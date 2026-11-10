import apiClient from './apiClient';
import {
    DatabaseRequest,
    ExerciseRequest,
    AdminPracticeDatabase,
    AdminPracticeExercise,
} from '@/types/adminPractice';

export type {
    DatabaseRequest,
    ExerciseRequest,
    AdminPracticeDatabase,
    AdminPracticeExercise,
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

export const adminPracticeService = {
    // ================= DATABASES API =================

    /**
     * Lấy danh sách toàn bộ Database cho khu vực quản trị
     * Ưu tiên gọi GET /api/admin/practice/databases (đầy đủ schemaData và initSqlScript),
     * fallback GET /api/practice/databases nếu cần.
     */
    getAdminDatabases: async (): Promise<AdminPracticeDatabase[]> => {
        try {
            const adminRes = await apiClient.get<any>('/api/admin/practice/databases');
            const adminData = unwrapResponse<any>(adminRes.data);
            if (Array.isArray(adminData)) {
                return adminData;
            }
        } catch {
            // Fallback sang endpoint catalog
        }

        const response = await apiClient.get<any>('/api/practice/databases');
        const data = unwrapResponse<any>(response.data);
        return Array.isArray(data) ? data : [];
    },

    /**
     * Lấy chi tiết một Database (kèm schemaData, initSqlScript và danh sách exercises nếu có)
     * Gọi GET /api/admin/practice/databases/{id} hoặc GET /api/practice/databases/{slug}
     */
    getAdminDatabaseDetail: async (dbIdOrSlug: string): Promise<any> => {
        try {
            const adminRes = await apiClient.get<any>(
                `/api/admin/practice/databases/${encodeURIComponent(dbIdOrSlug)}`
            );
            const adminData = unwrapResponse<any>(adminRes.data);
            if (adminData && typeof adminData === 'object') {
                return adminData;
            }
        } catch {
            // Fallback sang endpoint catalog chi tiết
        }

        const response = await apiClient.get<any>(
            `/api/practice/databases/${encodeURIComponent(dbIdOrSlug)}`
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Tạo mới một Cơ sở dữ liệu mẫu
     * POST /api/admin/practice/databases (HTTP 201)
     * @param data - Dữ liệu DatabaseRequest
     */
    createDatabase: async (data: DatabaseRequest): Promise<any> => {
        const response = await apiClient.post<any>('/api/admin/practice/databases', data);
        return unwrapResponse<any>(response.data);
    },

    /**
     * Cập nhật thông tin Cơ sở dữ liệu mẫu
     * PUT /api/admin/practice/databases/{id}
     * @param dbId - ID của Database
     * @param data - Dữ liệu cập nhật
     */
    updateDatabase: async (dbId: string, data: Partial<DatabaseRequest>): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/practice/databases/${encodeURIComponent(dbId)}`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Xóa một Cơ sở dữ liệu mẫu
     * DELETE /api/admin/practice/databases/{id}
     * @param dbId - ID của Database
     */
    deleteDatabase: async (dbId: string): Promise<any> => {
        const response = await apiClient.delete<any>(
            `/api/admin/practice/databases/${encodeURIComponent(dbId)}`
        );
        return unwrapResponse<any>(response.data);
    },

    // ================= EXERCISES API =================

    /**
     * Lấy danh sách bài tập thuộc về một Database
     * Ưu tiên gọi GET /api/admin/practice/databases/{dbId}/exercises
     * Fallback sang /api/practice/databases/{dbId}/exercises hoặc chi tiết database
     */
    getAdminExercises: async (dbId: string): Promise<AdminPracticeExercise[]> => {
        try {
            const adminRes = await apiClient.get<any>(
                `/api/admin/practice/databases/${encodeURIComponent(dbId)}/exercises`
            );
            const adminData = unwrapResponse<any>(adminRes.data);
            if (Array.isArray(adminData)) return adminData;
        } catch {
            // Thử qua endpoint học viên hoặc chi tiết CSDL
            try {
                const response = await apiClient.get<any>(
                    `/api/practice/databases/${encodeURIComponent(dbId)}/exercises`
                );
                const data = unwrapResponse<any>(response.data);
                if (Array.isArray(data)) return data;
            } catch {
                try {
                    const dbDetail = await adminPracticeService.getAdminDatabaseDetail(dbId);
                    if (dbDetail && Array.isArray(dbDetail.exercises)) {
                        return dbDetail.exercises;
                    }
                } catch {
                    // ignore
                }
            }
        }

        return [];
    },

    /**
     * Tạo mới bài tập SQL cho một Database
     * POST /api/admin/practice/databases/{dbId}/exercises (HTTP 201)
     * @param dbId - ID của Database cha
     * @param data - Dữ liệu ExerciseRequest
     */
    createExercise: async (dbId: string, data: ExerciseRequest): Promise<any> => {
        const response = await apiClient.post<any>(
            `/api/admin/practice/databases/${encodeURIComponent(dbId)}/exercises`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Cập nhật bài tập SQL
     * PUT /api/admin/practice/exercises/{exerciseId}
     * @param exerciseId - ID bài tập
     * @param data - Dữ liệu cập nhật
     */
    updateExercise: async (exerciseId: string, data: Partial<ExerciseRequest>): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/practice/exercises/${encodeURIComponent(exerciseId)}`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Xóa bài tập SQL
     * DELETE /api/admin/practice/exercises/{exerciseId}
     * @param exerciseId - ID bài tập
     */
    deleteExercise: async (exerciseId: string): Promise<any> => {
        const response = await apiClient.delete<any>(
            `/api/admin/practice/exercises/${encodeURIComponent(exerciseId)}`
        );
        return unwrapResponse<any>(response.data);
    },
};

export default adminPracticeService;
