import apiClient from './apiClient';
import {
    HistorySummary,
    HistoryFilterParams,
    HistoryItem,
    HistoryPagination,
    HistoryTrendItem,
    HistoryDetail,
} from '@/types/history';

export type {
    HistorySummary,
    HistoryFilterParams,
    HistoryItem,
    HistoryPagination,
    HistoryTrendItem,
    HistoryDetail,
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

export const historyService = {
    /**
     * Lấy 4 chỉ số thống kê tổng quan lịch sử thi của học viên
     * GET /api/mock-tests/history/summary
     * @returns HistorySummary (totalTestsTaken, averageScore, highestScore, passRatePercentage)
     */
    getHistorySummary: async (): Promise<HistorySummary> => {
        const response = await apiClient.get<any>('/api/mock-tests/history/summary');
        const data = unwrapResponse<any>(response.data);

        return {
            totalTestsTaken: data?.totalTestsTaken ?? data?.totalAttempts ?? data?.total ?? 0,
            averageScore: data?.averageScore ?? data?.avgScore ?? 0,
            highestScore: data?.highestScore ?? data?.bestScore ?? data?.maxScore ?? 0,
            passRatePercentage: data?.passRatePercentage ?? data?.passRate ?? 0,
            ...data,
        };
    },

    /**
     * Lấy danh sách lịch sử thi có phân trang và bộ lọc
     * GET /api/mock-tests/history
     * @param params - Các tham số lọc: keyword, status, difficulty, sortBy, sortDirection, page, size
     * @returns HistoryPagination
     */
    getHistoryList: async (params?: HistoryFilterParams): Promise<HistoryPagination> => {
        const queryParams = {
            page: 0,
            size: 6,
            ...params,
        };

        const response = await apiClient.get<any>('/api/mock-tests/history', { params: queryParams });
        const data = unwrapResponse<any>(response.data);

        // Trường hợp backend trả về đối tượng phân trang chuẩn
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            const rawItems: any[] = Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.content)
                ? data.content
                : Array.isArray(data.history)
                ? data.history
                : [];

            const formattedItems: HistoryItem[] = rawItems.map((item) => ({
                sessionId: item.sessionId || item.id || '',
                id: item.sessionId || item.id || '',
                testId: item.testId || item.mockTestId || item.slug || 'mock-1',
                testTitle: item.testTitle || item.title || 'Đề thi SQL',
                difficulty: item.difficulty || 'Trung bình',
                submittedAt: item.submittedAt || item.createdAt || '',
                durationSeconds: item.durationSeconds ?? item.timeSpentSeconds ?? 0,
                timeSpentSeconds: item.timeSpentSeconds ?? item.durationSeconds ?? 0,
                durationMinutes: item.durationMinutes ?? 20,
                correctCount: item.correctCount ?? item.correctAnswers ?? 0,
                correctAnswers: item.correctAnswers ?? item.correctCount ?? 0,
                totalQuestions: item.totalQuestions ?? item.questionsCount ?? 5,
                score: item.score ?? 0,
                isPassed: item.isPassed ?? (item.score >= 60),
                status: item.status || (item.isPassed || item.score >= 60 ? 'PASSED' : 'FAILED'),
                category: item.category || 'SQL Database',
                ...item,
            }));

            const total = data.total ?? data.totalElements ?? formattedItems.length;
            const size = queryParams.size || data.size || data.pageSize || 6;
            const page = queryParams.page !== undefined ? queryParams.page : (data.page || data.currentPage || 0);
            const totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / size));

            return {
                items: formattedItems,
                total,
                page,
                size,
                totalPages,
            };
        }

        // Trường hợp backend trả về trực tiếp một mảng
        const rawList: any[] = Array.isArray(data) ? data : [];
        const formattedList: HistoryItem[] = rawList.map((item) => ({
            sessionId: item.sessionId || item.id || '',
            id: item.sessionId || item.id || '',
            testId: item.testId || item.mockTestId || item.slug || 'mock-1',
            testTitle: item.testTitle || item.title || 'Đề thi SQL',
            difficulty: item.difficulty || 'Trung bình',
            submittedAt: item.submittedAt || item.createdAt || '',
            durationSeconds: item.durationSeconds ?? item.timeSpentSeconds ?? 0,
            timeSpentSeconds: item.timeSpentSeconds ?? item.durationSeconds ?? 0,
            durationMinutes: item.durationMinutes ?? 20,
            correctCount: item.correctCount ?? item.correctAnswers ?? 0,
            correctAnswers: item.correctAnswers ?? item.correctCount ?? 0,
            totalQuestions: item.totalQuestions ?? item.questionsCount ?? 5,
            score: item.score ?? 0,
            isPassed: item.isPassed ?? (item.score >= 60),
            status: item.status || (item.isPassed || item.score >= 60 ? 'PASSED' : 'FAILED'),
            category: item.category || 'SQL Database',
            ...item,
        }));

        return {
            items: formattedList,
            total: formattedList.length,
            page: queryParams.page || 0,
            size: queryParams.size || formattedList.length || 6,
            totalPages: Math.max(1, Math.ceil(formattedList.length / (queryParams.size || 6))),
        };
    },

    /**
     * Lấy mảng điểm số theo thời gian để vẽ biểu đồ tiến độ học tập
     * GET /api/mock-tests/history/trends
     * @param limit - Số lượng phiên thi gần nhất cần lấy (mặc định 10)
     * @returns HistoryTrendItem[]
     */
    getHistoryTrends: async (limit = 10): Promise<HistoryTrendItem[]> => {
        const response = await apiClient.get<any>('/api/mock-tests/history/trends', {
            params: { limit },
        });
        const data = unwrapResponse<any>(response.data);
        return Array.isArray(data) ? data : [];
    },

    /**
     * Lấy chi tiết lịch sử một phiên thi (kèm đáp án người dùng, đáp án chuẩn và lời giải)
     * GET /api/mock-tests/history/{sessionId}
     * @param sessionId - Mã phiên thi
     * @returns HistoryDetail
     */
    getHistoryDetail: async (sessionId: string): Promise<HistoryDetail> => {
        const response = await apiClient.get<any>(`/api/mock-tests/history/${encodeURIComponent(sessionId)}`);
        const data = unwrapResponse<any>(response.data);

        const rawQuestions = Array.isArray(data?.questions)
            ? data.questions
            : Array.isArray(data?.questionsReview)
            ? data.questionsReview
            : [];

        const questions = rawQuestions.map((q: any) => {
            const correctAnswerVal =
                q.correctAnswer ||
                q.mcCorrectOption ||
                q.solutionQuery ||
                q.solutionAnswer ||
                '';
            const earnedPoints = q.score !== undefined ? q.score : (q.points ?? 0);
            const totalPoints = q.maxScore !== undefined ? q.maxScore : (q.maxPoints ?? q.points ?? 20);

            return {
                ...q,
                questionId: q.questionId || q.id || '',
                questionText: q.content || q.questionText || q.question || '',
                content: q.content || q.questionText || q.question || '',
                type: q.questionType || q.type || 'sql_query',
                questionType: q.questionType || q.type || 'sql_query',
                points: earnedPoints,
                score: earnedPoints,
                maxPoints: totalPoints,
                maxScore: totalPoints,
                isCorrect: q.isCorrect ?? q.correct ?? false,
                userAnswer: q.submittedAnswer ?? q.userAnswer ?? '',
                submittedAnswer: q.submittedAnswer ?? q.userAnswer ?? '',
                correctAnswer: correctAnswerVal,
                solutionAnswer: correctAnswerVal,
                solutionQuery: q.solutionQuery || (q.questionType !== 'MULTIPLE_CHOICE' ? correctAnswerVal : ''),
                mcCorrectOption: q.mcCorrectOption || (q.questionType === 'MULTIPLE_CHOICE' ? correctAnswerVal : ''),
                explanation: q.explanation || '',
            };
        });

        return {
            ...data,
            sessionId: data?.sessionId || data?.id || sessionId,
            testId: data?.testId || data?.mockTestId || 'mock-1',
            testTitle: data?.testTitle || data?.title || 'Đề thi SQL',
            category: data?.category || 'SQL Database',
            difficulty: data?.difficulty || 'Trung bình',
            score: data?.score ?? 0,
            isPassed: data?.isPassed ?? (data?.score >= 60),
            submittedAt: data?.submittedAt || '',
            durationSeconds: data?.durationSeconds ?? data?.timeSpentSeconds ?? 0,
            timeSpentSeconds: data?.timeSpentSeconds ?? data?.durationSeconds ?? 0,
            durationMinutes: data?.durationMinutes ?? 20,
            correctCount: data?.correctCount ?? data?.correctAnswers ?? questions.filter((q: any) => q.isCorrect).length,
            correctAnswers: data?.correctAnswers ?? data?.correctCount ?? questions.filter((q: any) => q.isCorrect).length,
            totalQuestions: data?.totalQuestions ?? questions.length ?? 5,
            status: data?.status || (data?.score >= 60 ? 'PASSED' : 'FAILED'),
            questions,
            questionsReview: questions,
        };
    },

    /**
     * Xóa một phiên thi khỏi lịch sử của học viên
     * DELETE /api/mock-tests/history/{sessionId}
     * @param sessionId - Mã phiên thi cần xóa
     * @returns boolean
     */
    deleteHistorySession: async (sessionId: string): Promise<boolean> => {
        const response = await apiClient.delete<any>(`/api/mock-tests/history/${encodeURIComponent(sessionId)}`);
        const data = unwrapResponse<any>(response.data);
        return data === true || data?.success === true || response.status === 200 || response.status === 204;
    },
};

export default historyService;
