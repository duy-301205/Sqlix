/**
 * TypeScript Interfaces cho Module Lịch sử Thi thử (Mock Test History)
 */

export interface HistorySummary {
    totalTestsTaken: number;
    averageScore: number;
    highestScore: number;
    passRatePercentage: number;
    [key: string]: any;
}

export interface HistoryFilterParams {
    keyword?: string;
    status?: 'ALL' | 'PASSED' | 'FAILED' | 'all' | 'passed' | 'failed' | 'timeout' | string;
    difficulty?: string;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC' | 'asc' | 'desc';
    page?: number;
    size?: number;
    [key: string]: any;
}

export interface HistoryItem {
    sessionId: string;
    id?: string;
    testId: string;
    testTitle: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó' | string;
    submittedAt: string;
    durationSeconds: number;
    timeSpentSeconds?: number;
    durationMinutes?: number;
    correctCount: number;
    correctAnswers?: number;
    totalQuestions: number;
    score: number;
    isPassed: boolean;
    status: 'PASSED' | 'FAILED' | 'TIMEOUT' | 'passed' | 'failed' | 'timeout' | string;
    category?: string;
    questionsReview?: any[];
    [key: string]: any;
}

export interface HistoryPagination {
    items: HistoryItem[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
    [key: string]: any;
}

export interface HistoryTrendItem {
    sessionId?: string;
    testTitle?: string;
    score: number;
    submittedAt: string;
    isPassed?: boolean;
    [key: string]: any;
}

export interface HistoryDetailQuestion {
    questionId: string;
    questionText: string;
    type: 'sql_query' | 'multiple_choice' | 'SQL' | 'MULTIPLE_CHOICE' | string;
    points: number;
    maxPoints: number;
    isCorrect: boolean;
    userAnswer: string;
    solutionAnswer: string;
    explanation?: string;
    [key: string]: any;
}

export interface HistoryDetail {
    sessionId: string;
    testId: string;
    testTitle: string;
    category?: string;
    difficulty: string;
    score: number;
    isPassed: boolean;
    submittedAt: string;
    durationSeconds: number;
    timeSpentSeconds?: number;
    durationMinutes?: number;
    correctCount: number;
    correctAnswers?: number;
    totalQuestions: number;
    status: string;
    questions: HistoryDetailQuestion[];
    questionsReview?: HistoryDetailQuestion[];
    [key: string]: any;
}
