import apiClient from './apiClient';
import {
    MockTestRequest,
    MockTestQuestionRequest,
    AdminMockTest,
    AdminMockQuestion,
} from '@/types/adminMockTest';

export type {
    MockTestRequest,
    MockTestQuestionRequest,
    AdminMockTest,
    AdminMockQuestion,
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

export const adminMockTestService = {
    // ================= MOCK TESTS API =================

    /**
     * Lấy danh sách toàn bộ đề thi thử cho quản trị viên
     * Gọi GET /api/mock-tests
     */
    getAdminMockTests: async (): Promise<AdminMockTest[]> => {
        try {
            const response = await apiClient.get<any>('/api/mock-tests', {
                params: { page: 0, size: 100 },
            });
            const data = unwrapResponse<any>(response.data);
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.items)) return data.items;
        } catch (err) {
            console.error('[AdminMockTest] Lỗi lấy danh sách đề thi:', err);
        }

        return [];
    },

    /**
     * Lấy thông tin chi tiết một đề thi thử
     * Gọi GET /api/mock-tests/{id}
     */
    getAdminMockTestDetail: async (id: string): Promise<any> => {
        const response = await apiClient.get<any>(
            `/api/mock-tests/${encodeURIComponent(id)}`
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Tạo mới một đề thi thử
     * POST /api/admin/mock-tests (HTTP 201)
     * @param data - Dữ liệu MockTestRequest
     */
    createMockTest: async (data: MockTestRequest): Promise<any> => {
        const response = await apiClient.post<any>('/api/admin/mock-tests', data);
        return unwrapResponse<any>(response.data);
    },

    /**
     * Cập nhật thông tin đề thi thử
     * PUT /api/admin/mock-tests/{id}
     * @param id - ID đề thi
     * @param data - Dữ liệu cập nhật
     */
    updateMockTest: async (id: string, data: Partial<MockTestRequest>): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/mock-tests/${encodeURIComponent(id)}`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Xóa một đề thi thử
     * DELETE /api/admin/mock-tests/{id}
     * @param id - ID đề thi
     */
    deleteMockTest: async (id: string): Promise<any> => {
        const response = await apiClient.delete<any>(
            `/api/admin/mock-tests/${encodeURIComponent(id)}`
        );
        return unwrapResponse<any>(response.data);
    },

    // ================= MOCK TEST QUESTIONS API =================

    /**
     * Lấy danh sách câu hỏi thuộc về một đề thi
     * Thử GET /api/admin/mock-tests/{testId}/questions trước,
     * nếu không có thì lấy qua chi tiết đề thi hoặc workspace
     */
    getAdminMockTestQuestions: async (testId: string): Promise<AdminMockQuestion[]> => {
        try {
            const response = await apiClient.get<any>(
                `/api/admin/mock-tests/${encodeURIComponent(testId)}/questions`
            );
            const data = unwrapResponse<any>(response.data);
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.questions)) return data.questions;
        } catch {
            // fallback
        }

        try {
            const detail = await adminMockTestService.getAdminMockTestDetail(testId);
            if (detail && Array.isArray(detail.questions)) {
                return detail.questions;
            }
        } catch {
            // ignore
        }

        return [];
    },

    /**
     * Tạo mới câu hỏi cho một đề thi
     * POST /api/admin/mock-tests/{testId}/questions (HTTP 201)
     * @param testId - ID đề thi cha
     * @param data - Dữ liệu câu hỏi MockTestQuestionRequest
     */
    createQuestion: async (testId: string, data: MockTestQuestionRequest): Promise<any> => {
        const response = await apiClient.post<any>(
            `/api/admin/mock-tests/${encodeURIComponent(testId)}/questions`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Cập nhật câu hỏi đề thi
     * PUT /api/admin/mock-test-questions/{questionId}
     * @param questionId - ID câu hỏi
     * @param data - Dữ liệu cập nhật
     */
    updateQuestion: async (
        questionId: string,
        data: Partial<MockTestQuestionRequest>
    ): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/mock-test-questions/${encodeURIComponent(questionId)}`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Xóa câu hỏi đề thi
     * DELETE /api/admin/mock-test-questions/{questionId}
     * @param questionId - ID câu hỏi
     */
    deleteQuestion: async (questionId: string): Promise<any> => {
        const response = await apiClient.delete<any>(
            `/api/admin/mock-test-questions/${encodeURIComponent(questionId)}`
        );
        return unwrapResponse<any>(response.data);
    },
};

export default adminMockTestService;
