import apiClient from './apiClient';
import {
    AdminUser,
    AdminUserFilterParams,
    AdminUserPaginationInfo,
    AdminUserResponse,
    AdminUserRole,
} from '@/types/adminUser';

export type {
    AdminUser,
    AdminUserFilterParams,
    AdminUserPaginationInfo,
    AdminUserResponse,
    AdminUserRole,
};

/**
 * Trợ giúp chuẩn hóa từng đối tượng User từ backend
 */
const normalizeAdminUser = (raw: any): AdminUser => {
    const active =
        raw.active !== undefined
            ? Boolean(raw.active)
            : raw.status
            ? raw.status === 'ACTIVE'
            : true;

    return {
        id: String(raw.id || raw.userId || ''),
        username: raw.username || '',
        email: raw.email || '',
        fullName: raw.fullName || raw.name || raw.username || 'Người dùng',
        avatarUrl: raw.avatarUrl || raw.avatar || '',
        occupation: raw.occupation || '',
        role: (raw.role || 'USER') as AdminUserRole,
        active,
        status: active ? 'ACTIVE' : 'BANNED',
        createdAt: raw.createdAt || raw.createdDate || new Date().toISOString(),
        totalExercisesSolved: raw.totalExercisesSolved ?? raw.solvedExercisesCount ?? 0,
        testsTaken: raw.testsTaken ?? raw.mockTestsTaken ?? 0,
        lastActiveAt: raw.lastActiveAt || raw.updatedAt || raw.createdAt || new Date().toISOString(),
        ...raw,
    };
};

export const adminUserService = {
    /**
     * Lấy danh sách người dùng kèm phân trang và bộ lọc tìm kiếm
     * GET /api/admin/users
     * @param params - Các query params: search, role, active, page, size
     * @returns AdminUserResponse gồm mảng `users` và đối tượng `pagination`
     */
    getUsers: async (params?: AdminUserFilterParams): Promise<AdminUserResponse> => {
        const queryParams: Record<string, any> = {
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        };

        if (params?.search && params.search.trim()) {
            queryParams.search = params.search.trim();
        }

        if (params?.role && params.role !== 'ALL') {
            queryParams.role = params.role;
        }

        if (params?.active !== undefined && params.active !== null) {
            queryParams.active = params.active;
        }

        const response = await apiClient.get<any>('/api/admin/users', { params: queryParams });
        const data = response.data;

        // Trích xuất danh sách users và thông tin phân trang từ cấu trúc response đa dạng
        let rawUsers: any[] = [];
        let total = 0;
        let page = queryParams.page;
        let size = queryParams.size;
        let totalPages = 1;

        // Trường hợp 1: Backend bọc trong result và pagination riêng
        // ví dụ: { result: [...users...], pagination: { total: 100, page: 0, size: 20, totalPages: 5 } }
        if (data && typeof data === 'object') {
            if (Array.isArray(data.result)) {
                rawUsers = data.result;
            } else if (Array.isArray(data.data)) {
                rawUsers = data.data;
            } else if (data.result && typeof data.result === 'object') {
                if (Array.isArray(data.result.content)) {
                    rawUsers = data.result.content;
                } else if (Array.isArray(data.result.items)) {
                    rawUsers = data.result.items;
                } else if (Array.isArray(data.result.users)) {
                    rawUsers = data.result.users;
                }
            } else if (Array.isArray(data.content)) {
                // Trường hợp 2: Spring Boot Page chuẩn
                rawUsers = data.content;
            } else if (Array.isArray(data.users)) {
                rawUsers = data.users;
            } else if (Array.isArray(data.items)) {
                rawUsers = data.items;
            } else if (Array.isArray(data)) {
                // Trường hợp 3: Trả về trực tiếp mảng
                rawUsers = data;
            }

            // Trích xuất pagination
            const pag = data.pagination || data.result?.pagination || data.pageable || data;
            total =
                pag?.total ??
                pag?.totalElements ??
                data?.totalElements ??
                data?.total ??
                rawUsers.length;
            size = pag?.size ?? pag?.pageSize ?? queryParams.size;
            page = pag?.page ?? pag?.number ?? pag?.currentPage ?? queryParams.page;
            totalPages =
                pag?.totalPages ??
                data?.totalPages ??
                Math.max(1, Math.ceil(total / (size || 1)));
        }

        const users = rawUsers.map(normalizeAdminUser);

        return {
            users,
            pagination: {
                total,
                page,
                size,
                totalPages,
            },
        };
    },

    /**
     * Cập nhật trạng thái Khóa / Mở khóa người dùng
     * PUT /api/admin/users/{userId}/status
     * Body: { "active": active }
     * @param userId - Mã người dùng
     * @param active - true: kích hoạt, false: khóa tài khoản
     * @returns Kết quả trả về từ API
     */
    updateUserStatus: async (userId: string, active: boolean): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/users/${encodeURIComponent(userId)}/status`,
            { active }
        );
        return response.data?.result ?? response.data?.data ?? response.data;
    },

    /**
     * Cập nhật vai trò (Role) của người dùng
     * PUT /api/admin/users/{userId}/role
     * Body: { "role": role }
     * @param userId - Mã người dùng
     * @param role - Vai trò mới: USER / STUDENT, INSTRUCTOR, ADMIN
     * @returns Kết quả trả về từ API
     */
    updateUserRole: async (userId: string, role: string): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/users/${encodeURIComponent(userId)}/role`,
            { role }
        );
        return response.data?.result ?? response.data?.data ?? response.data;
    },
};

export default adminUserService;
