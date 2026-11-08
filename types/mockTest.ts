/**
 * TypeScript Interfaces cho Module Thi thử mô phỏng (Mock Test)
 */

export interface MockTestParams {
    difficulty?: string;
    category?: string;
    search?: string;
    page?: number;
    size?: number;
    [key: string]: any;
}

export interface MockTestSummary {
    id: string;
    title: string;
    slug: string;
    description?: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó' | 'Nâng cao' | string;
    durationMinutes: number;
    coverImageUrl?: string;
    questionsCount?: number;
    participantsCount?: number;
    category?: string;
    rating?: number;
    passScore?: number;
    difficultyColor?: string;
    icon?: string;
    iconBg?: string;
    iconColor?: string;
    [key: string]: any;
}

export interface MockTestDetail extends MockTestSummary {
    overview?: string;
    rules?: string[];
    instructions?: string[];
    topics?: string[];
    totalScore?: number;
    passingScore?: number;
    databaseName?: string;
    databaseId?: string;
    [key: string]: any;
}

export interface StartSessionResponse {
    sessionId: string;
    testId?: string;
    startedAt?: string;
    expiresAt?: string;
    durationSeconds?: number;
    status?: string;
    [key: string]: any;
}

export interface MockTestPagination {
    items: MockTestSummary[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
    [key: string]: any;
}

export interface MultipleChoiceOption {
    id?: string | number;
    label?: string;
    text: string;
    value?: string;
    [key: string]: any;
}

/**
 * Câu hỏi trong phòng thi Workspace
 */
export interface WorkspaceQuestion {
    id: string;
    questionType: 'SQL' | 'MULTIPLE_CHOICE' | 'sql_query' | 'multiple_choice' | string;
    content: string;
    points: number;
    sortOrder: number;
    title?: string;
    // Dành riêng cho câu hỏi SQL
    databaseId?: string;
    databaseName?: string;
    schemaData?: any;
    maxRetries?: number;
    sampleQuery?: string;
    expectedColumns?: string[];
    // Dành riêng cho câu hỏi Trắc nghiệm
    mcOptions?: MultipleChoiceOption[] | string[];
    // Trạng thái của user trong session
    userAnswer?: string | null;
    isAnswered?: boolean;
    isFlagged?: boolean;
    [key: string]: any;
}

/**
 * Thông tin phòng thi trả về từ GET /api/test-sessions/{sessionId}/workspace
 */
export interface TestWorkspaceResponse {
    id: string; // sessionId
    sessionId?: string;
    testId?: string;
    testTitle?: string;
    startTime: string; // ISO Datetime string từ DB
    durationMinutes: number;
    questions: WorkspaceQuestion[];
    status?: string;
    totalPoints?: number;
    passingScore?: number;
    [key: string]: any;
}

/**
 * Kết quả trả về khi nộp/lưu từng câu hỏi
 */
export interface SubmitAnswerResponse {
    questionId?: string;
    submittedAnswer?: string;
    isCorrect?: boolean;
    score?: number;
    feedback?: string;
    saved?: boolean;
    runResult?: {
        columns?: string[];
        rows?: any[];
        errorMessage?: string | null;
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Kết quả trả về khi nộp toàn bộ bài thi
 */
export interface SubmitTestResponse {
    sessionId: string;
    totalScore?: number;
    passingScore?: number;
    isPassed?: boolean;
    completedAt?: string;
    message?: string;
    details?: any[];
    [key: string]: any;
}
