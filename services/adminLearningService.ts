import apiClient from './apiClient';
import {
    CourseCategoryRequest,
    LessonAdminRequest,
    LessonSectionAdminRequest,
    AdminCategoryItem,
} from '@/types/adminLearning';

export type {
    CourseCategoryRequest,
    LessonAdminRequest,
    LessonSectionAdminRequest,
    AdminCategoryItem,
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

export const adminLearningService = {
    /**
     * Lấy cây danh mục lộ trình và danh sách bài học dành cho Admin
     * Gọi GET /api/learning/curriculum
     * @returns Cây danh mục học tập
     */
    getAdminCurriculum: async (): Promise<any[]> => {
        const response = await apiClient.get<any>('/api/learning/curriculum');
        const data = unwrapResponse<any>(response.data);
        return Array.isArray(data) ? data : [];
    },

    // ================= CATEGORIES API =================

    /**
     * Tạo mới một danh mục khóa học (Category)
     * POST /api/admin/learning/categories (HTTP 201)
     * @param data - Thông tin danh mục: name, description, sortOrder
     */
    createCategory: async (data: CourseCategoryRequest): Promise<any> => {
        const response = await apiClient.post<any>('/api/admin/learning/categories', data);
        return unwrapResponse<any>(response.data);
    },

    /**
     * Cập nhật thông tin danh mục khóa học
     * PUT /api/admin/learning/categories/{categoryId}
     * @param categoryId - Mã danh mục
     * @param data - Thông tin cập nhật: name, description, sortOrder
     */
    updateCategory: async (categoryId: string, data: CourseCategoryRequest): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/learning/categories/${encodeURIComponent(categoryId)}`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Xóa một danh mục khóa học
     * DELETE /api/admin/learning/categories/{categoryId}
     * @param categoryId - Mã danh mục cần xóa
     */
    deleteCategory: async (categoryId: string): Promise<any> => {
        const response = await apiClient.delete<any>(
            `/api/admin/learning/categories/${encodeURIComponent(categoryId)}`
        );
        return unwrapResponse<any>(response.data);
    },

    // ================= LESSONS API =================

    /**
     * Tạo mới một bài học (Lesson)
     * POST /api/admin/learning/lessons (HTTP 201)
     * @param data - Thông tin bài học: categoryId, title, slug, description, objectives, practiceTopicCode, sortOrder
     */
    createLesson: async (data: LessonAdminRequest): Promise<any> => {
        const response = await apiClient.post<any>('/api/admin/learning/lessons', data);
        return unwrapResponse<any>(response.data);
    },

    /**
     * Cập nhật thông tin bài học
     * PUT /api/admin/learning/lessons/{lessonId}
     * @param lessonId - Mã bài học
     * @param data - Thông tin cập nhật
     */
    updateLesson: async (lessonId: string, data: LessonAdminRequest): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/learning/lessons/${encodeURIComponent(lessonId)}`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Xóa một bài học
     * DELETE /api/admin/learning/lessons/{lessonId}
     * @param lessonId - Mã bài học cần xóa
     */
    deleteLesson: async (lessonId: string): Promise<any> => {
        const response = await apiClient.delete<any>(
            `/api/admin/learning/lessons/${encodeURIComponent(lessonId)}`
        );
        return unwrapResponse<any>(response.data);
    },

    // ================= SECTIONS API =================

    /**
     * Tạo mới một phần học (Section) thuộc bài học
     * POST /api/admin/learning/lessons/{lessonId}/sections (HTTP 201)
     * @param lessonId - Mã bài học cha
     * @param data - Thông tin section: title, content, sampleSql, noteBox, sortOrder
     */
    createSection: async (lessonId: string, data: LessonSectionAdminRequest): Promise<any> => {
        const response = await apiClient.post<any>(
            `/api/admin/learning/lessons/${encodeURIComponent(lessonId)}/sections`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Cập nhật thông tin một phần học (Section)
     * PUT /api/admin/learning/sections/{sectionId}
     * @param sectionId - Mã section
     * @param data - Thông tin cập nhật
     */
    updateSection: async (sectionId: string, data: LessonSectionAdminRequest): Promise<any> => {
        const response = await apiClient.put<any>(
            `/api/admin/learning/sections/${encodeURIComponent(sectionId)}`,
            data
        );
        return unwrapResponse<any>(response.data);
    },

    /**
     * Xóa một phần học (Section)
     * DELETE /api/admin/learning/sections/{sectionId}
     * @param sectionId - Mã section cần xóa
     */
    deleteSection: async (sectionId: string): Promise<any> => {
        const response = await apiClient.delete<any>(
            `/api/admin/learning/sections/${encodeURIComponent(sectionId)}`
        );
        return unwrapResponse<any>(response.data);
    },
};

export default adminLearningService;
