import apiClient from './apiClient';
import {
    AdminSystemStats,
    SystemHealthInfo,
    RecentTestSessionItem,
} from '@/types/adminDashboard';

export type {
    AdminSystemStats,
    SystemHealthInfo,
    RecentTestSessionItem,
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

export const adminDashboardService = {
    /**
     * Lấy các số liệu thống kê tổng quan của toàn hệ thống
     * GET /api/admin/dashboard/stats
     * @returns AdminSystemStats (totalUsers, totalDatabases, totalExercises, totalMockTests, totalTestSessions...)
     */
    getDashboardStats: async (): Promise<AdminSystemStats> => {
        const response = await apiClient.get<any>('/api/admin/dashboard/stats');
        const data = unwrapResponse<any>(response.data);

        return {
            totalUsers: data?.totalUsers ?? 0,
            activeUsersToday: data?.activeUsersToday ?? 0,
            userGrowthPercent: data?.userGrowthPercent ?? 0,
            totalCategories: data?.totalCategories ?? 0,
            totalLessons: data?.totalLessons ?? 0,
            totalSections: data?.totalSections ?? 0,
            totalDatabases: data?.totalDatabases ?? 0,
            totalExercises: data?.totalExercises ?? 0,
            totalMockTests: data?.totalMockTests ?? 0,
            totalQuestions: data?.totalQuestions ?? 0,
            totalTestSessions: data?.totalTestSessions ?? 0,
            passRatePercent: data?.passRatePercent ?? 0,
            averageTestScore: data?.averageTestScore ?? 0,
            systemHealth: data?.systemHealth || {
                dbStatus: 'HEALTHY',
                activeConnections: 12,
                cpuUsagePercent: 24,
                memoryUsagePercent: 42,
                avgQueryLatencyMs: 38,
            },
            recentTestSessions: Array.isArray(data?.recentTestSessions) ? data.recentTestSessions : [],
            ...data,
        };
    },
};

export default adminDashboardService;
