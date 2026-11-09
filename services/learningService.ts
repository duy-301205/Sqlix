import apiClient from './apiClient';
import {
    CurriculumCategory,
    LessonDetail,
    LessonSection,
    LessonSummary,
    NoteBox,
    TableOfContentItem,
} from '@/types/learning';

// Re-export types for convenient imports from services/learningService
export type {
    CurriculumCategory,
    LessonDetail,
    LessonSection,
    LessonSummary,
    NoteBox,
    TableOfContentItem,
};

/**
 * Trợ giúp bóc tách dữ liệu từ API response wrapper (result / data / payload)
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

export const learningService = {
    /**
     * Lấy cây danh mục lộ trình và danh sách bài học
     * GET /api/learning/curriculum
     * @returns Mảng các CurriculumCategory
     */
    getCurriculum: async (): Promise<CurriculumCategory[]> => {
        const response = await apiClient.get<any>('/api/learning/curriculum');
        const data = unwrapResponse<any>(response.data);
        return Array.isArray(data) ? data : [];
    },

    /**
     * Lấy chi tiết bài học theo slug hoặc id
     * GET /api/learning/lessons/{slug}
     * @param slug - Định danh hoặc slug của bài học
     * @returns Chi tiết bài học LessonDetail
     */
    getLessonDetail: async (slug: string): Promise<LessonDetail> => {
        const response = await apiClient.get<any>(`/api/learning/lessons/${encodeURIComponent(slug)}`);
        const data = unwrapResponse<LessonDetail>(response.data);
        return data;
    },

    /**
     * Bật/tắt trạng thái yêu thích (bookmark) của bài học
     * POST /api/learning/lessons/{lessonId}/bookmark
     * @param lessonId - ID của bài học
     * @returns Boolean biểu thị trạng thái yêu thích mới (true: đã bookmark, false: chưa)
     */
    toggleBookmark: async (lessonId: string): Promise<boolean> => {
        const response = await apiClient.post<any>(`/api/learning/lessons/${encodeURIComponent(lessonId)}/bookmark`);
        const data = unwrapResponse<any>(response.data);

        if (typeof data === 'boolean') {
            return data;
        }
        if (data && typeof data === 'object') {
            if ('isBookmarked' in data) return Boolean(data.isBookmarked);
            if ('bookmarked' in data) return Boolean(data.bookmarked);
        }
        return Boolean(data);
    },

    /**
     * Đánh dấu bài học đã hoàn thành
     * POST /api/learning/lessons/{lessonId}/complete
     * @param lessonId - ID của bài học
     * @returns Boolean biểu thị trạng thái hoàn thành (true nếu thành công)
     */
    markLessonCompleted: async (lessonId: string): Promise<boolean> => {
        const response = await apiClient.post<any>(`/api/learning/lessons/${encodeURIComponent(lessonId)}/complete`);
        const data = unwrapResponse<any>(response.data);

        if (typeof data === 'boolean') {
            return data;
        }
        if (data && typeof data === 'object') {
            if ('isCompleted' in data) return Boolean(data.isCompleted);
            if ('completed' in data) return Boolean(data.completed);
            if (data.status === 'COMPLETED') return true;
        }
        return true;
    },
};

export default learningService;
