/**
 * TypeScript Interfaces cho Module Quản trị Lịch sử Thi (Admin History CMS)
 */

export interface AdminHistoryFilterParams {
    userId?: string;
    testId?: string;
    keyword?: string;
    fromDate?: string; // Định dạng ISO-8601
    toDate?: string;   // Định dạng ISO-8601
    minScore?: number;
    maxScore?: number;
    status?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
    [key: string]: any;
}

export interface AdminHistoryItem {
    sessionId: string;
    userId: string;
    username: string;
    fullName: string;
    testTitle: string;
    score: number;
    submittedAt: string;
    durationSeconds: number;
    status: string;
    isPassed: boolean;
    userAvatar?: string;
    userEmail?: string;
    maxScore?: number;
    passingScore?: number;
    mockTestId?: string;
    correctAnswersCount?: number;
    totalQuestions?: number;
    totalQuestionsCount?: number;
    startedAt?: string;
    id?: string;
    [key: string]: any;
}

export interface AdminHistoryPagination {
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

export interface AdminHistoryResponse {
    items: AdminHistoryItem[];
    pagination: AdminHistoryPagination;
}
