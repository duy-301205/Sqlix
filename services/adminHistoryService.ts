import apiClient from './apiClient';
import {
    AdminHistoryFilterParams,
    AdminHistoryItem,
    AdminHistoryResponse,
    AdminHistoryPagination,
} from '@/types/adminHistory';

export type {
    AdminHistoryFilterParams,
    AdminHistoryItem,
    AdminHistoryResponse,
    AdminHistoryPagination,
};

/**
 * Trợ giúp trích xuất payload từ API response wrapper (`result` / `data`)
 */
const unwrapResponse = <T>(data: any): T => {
    if (data && typeof data === 'object') {
        if ('result' in data && data.result !== undefined) {
            return data.result as T;
        }
        if ('data' in data && data.data !== undefined) {
            return data.data as T;
        }
    }
    return data as T;
};

export const adminHistoryService = {
    /**
     * Lấy danh sách lịch sử thi toàn hệ thống kèm bộ lọc và thông tin phân trang
     * GET /api/admin/mock-tests/history
     * @param params - Các tham số lọc: userId, testId, fromDate, toDate, minScore, maxScore, page, size, sortBy, sortDirection...
     * @returns AdminHistoryResponse chứa danh sách items và pagination metadata
     */
    getAllHistories: async (
        params?: AdminHistoryFilterParams
    ): Promise<AdminHistoryResponse> => {
        const response = await apiClient.get<any>('/api/admin/mock-tests/history', {
            params,
        });

        const rawData = response.data;
        const unwrapped = unwrapResponse<any>(rawData);

        // Trích xuất danh sách items
        let items: AdminHistoryItem[] = [];
        if (Array.isArray(unwrapped)) {
            items = unwrapped;
        } else if (unwrapped && Array.isArray(unwrapped.items)) {
            items = unwrapped.items;
        } else if (unwrapped && Array.isArray(unwrapped.content)) {
            items = unwrapped.content;
        } else if (rawData && Array.isArray(rawData.result)) {
            items = rawData.result;
        }

        // Trích xuất metadata phân trang
        const rawPagination =
            rawData?.pagination ||
            unwrapped?.pagination ||
            rawData?.pageable ||
            unwrapped?.pageable ||
            {};

        const page = params?.page ?? rawPagination.page ?? rawPagination.pageNumber ?? 0;
        const size = params?.size ?? rawPagination.size ?? rawPagination.pageSize ?? 20;
        const total =
            rawPagination.total ??
            rawPagination.totalElements ??
            unwrapped?.total ??
            rawData?.total ??
            items.length;
        const totalPages =
            rawPagination.totalPages ??
            (size > 0 ? Math.ceil(total / size) : 1);

        const pagination: AdminHistoryPagination = {
            total,
            page,
            size,
            totalPages: Math.max(1, totalPages),
        };

        return {
            items,
            pagination,
        };
    },

    /**
     * Xóa một phiên thi của thí sinh
     * DELETE /api/admin/test-sessions/{sessionId}
     * @param sessionId - Mã phiên thi cần xóa
     */
    deleteTestSession: async (sessionId: string): Promise<any> => {
        const response = await apiClient.delete<any>(
            `/api/admin/test-sessions/${encodeURIComponent(sessionId)}`
        );
        return unwrapResponse<any>(response.data);
    },
};

export default adminHistoryService;
