/**
 * TypeScript Interfaces cho Module Dashboard Quản trị (Admin Dashboard)
 */

export interface SystemHealthInfo {
    dbStatus?: 'HEALTHY' | 'DEGRADED' | 'DOWN' | string;
    activeConnections?: number;
    cpuUsagePercent?: number;
    memoryUsagePercent?: number;
    avgQueryLatencyMs?: number;
    [key: string]: any;
}

export interface RecentTestSessionItem {
    id: string;
    userName: string;
    userAvatar?: string;
    userEmail?: string;
    testTitle: string;
    score: number;
    maxScore: number;
    isPassed: boolean;
    durationSeconds: number;
    submittedAt: string;
    [key: string]: any;
}

export interface AdminSystemStats {
    totalUsers: number;
    activeUsersToday?: number;
    userGrowthPercent?: number;
    totalCategories?: number;
    totalLessons?: number;
    totalSections?: number;
    totalDatabases: number;
    totalExercises: number;
    totalMockTests: number;
    totalQuestions?: number;
    totalTestSessions: number;
    passRatePercent?: number;
    averageTestScore?: number;
    systemHealth?: SystemHealthInfo;
    recentTestSessions?: RecentTestSessionItem[];
    [key: string]: any;
}
