import apiClient from './apiClient';

export interface DashboardOverview {
    completedLessons?: number;
    completed_lessons?: number;
    totalLessons?: number;
    total_lessons?: number;
    lessonPercentage?: number;

    completedExercises?: number;
    completed_exercises?: number;
    totalExercises?: number;
    total_exercises?: number;
    exercisePercentage?: number;
    weeklyNewExercises?: number;

    averageScore?: number;
    average_score?: number;
    rankingTier?: string;
    ranking_tier?: string;
    rankingPercentile?: string;

    studyTimeHours?: number;
    study_time_hours?: number;
    dailyAverageMinutes?: number;
    daily_average_minutes?: number;

    // Gợi ý bài học tiếp theo
    nextLesson?: {
        id?: string | number;
        title: string;
        lessonNumber?: string | number;
        subTitle?: string;
        progress?: number;
    };

    // Kỳ thi thử gần đây
    recentMockTest?: {
        id?: string | number;
        title: string;
        date?: string;
        score?: number | string;
        duration?: string;
        ranking?: string;
        questionCount?: number;
    };

    [key: string]: any;
}

export interface TopicMastery {
    id?: string | number;
    topicId?: string | number;
    title?: string;
    topicName?: string;
    name?: string;
    percentage?: number;
    percent?: number;
    masteryPercentage?: number;
    mastery_percentage?: number;
    color?: string;
    [key: string]: any;
}

export interface DailyActivity {
    date: string;
    exerciseCount?: number;
    exercise_count?: number;
    exercises?: number;
    averageScore?: number;
    average_score?: number;
    score?: number;
    studyMinutes?: number;
    study_minutes?: number;
    [key: string]: any;
}

export interface RecentActivity {
    id: string | number;
    title: string;
    type?: 'EXERCISE' | 'LESSON' | 'MOCK_TEST' | string;
    tag?: string;
    category?: string;
    score?: number | string;
    timeAgo?: string;
    createdAt?: string;
    created_at?: string;
    timestamp?: string;
    [key: string]: any;
}

export const dashboardService = {
    /**
     * Lấy số liệu tổng quan của học viên
     * GET /api/dashboard/overview
     * Backend trả về bọc trong `result`
     */
    getOverview: async (): Promise<DashboardOverview> => {
        const response = await apiClient.get<any>('/api/dashboard/overview');
        return response.data?.result || response.data?.data || response.data;
    },

    /**
     * Lấy danh sách mức độ thành thạo theo từng chuyên đề
     * GET /api/dashboard/mastery
     * Backend trả về bọc trong `result`
     */
    getMastery: async (): Promise<TopicMastery[]> => {
        const response = await apiClient.get<any>('/api/dashboard/mastery');
        const data = response.data?.result || response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
    },

    /**
     * Lấy dữ liệu biểu đồ hoạt động trong 30 ngày
     * GET /api/dashboard/chart/30-days
     * Backend trả về bọc trong `result`
     */
    getActivityChart: async (): Promise<DailyActivity[]> => {
        const response = await apiClient.get<any>('/api/dashboard/chart/30-days');
        const data = response.data?.result || response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
    },

    /**
     * Lấy danh sách các hoạt động / bài tập gần nhất
     * GET /api/dashboard/recent-activities
     * Backend trả về bọc trong `result`
     */
    getRecentActivities: async (): Promise<RecentActivity[]> => {
        const response = await apiClient.get<any>('/api/dashboard/recent-activities');
        const data = response.data?.result || response.data?.data || response.data;
        return Array.isArray(data) ? data : [];
    },
};

export default dashboardService;
