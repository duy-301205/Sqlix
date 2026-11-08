import apiClient from './apiClient';
import {
    MockTestParams,
    MockTestSummary,
    MockTestDetail,
    StartSessionResponse,
    MockTestPagination,
    WorkspaceQuestion,
    TestWorkspaceResponse,
    SubmitAnswerResponse,
    SubmitTestResponse,
} from '@/types/mockTest';

export type {
    MockTestParams,
    MockTestSummary,
    MockTestDetail,
    StartSessionResponse,
    MockTestPagination,
    WorkspaceQuestion,
    TestWorkspaceResponse,
    SubmitAnswerResponse,
    SubmitTestResponse,
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

export const mockTestService = {
    /**
     * Lấy danh sách các đề thi thử và phân trang
     * GET /api/mock-tests
     * @param params - Các tham số lọc: difficulty (EASY, MEDIUM, HARD), page (mặc định 0), size (mặc định 10)...
     * @returns Danh sách đề thi MockTestPagination
     */
    getMockTests: async (params?: MockTestParams): Promise<MockTestPagination> => {
        const queryParams = {
            page: 0,
            size: 10,
            ...params,
        };

        const response = await apiClient.get<any>('/api/mock-tests', { params: queryParams });
        const data = unwrapResponse<any>(response.data);

        // Trường hợp backend trả về đối tượng phân trang chuẩn
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            const rawItems = Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.content)
                ? data.content
                : Array.isArray(data.tests)
                ? data.tests
                : [];

            const total = data.total ?? data.totalElements ?? rawItems.length;
            const size = queryParams.size || data.size || data.pageSize || 10;
            const page = queryParams.page !== undefined ? queryParams.page : (data.page || data.currentPage || 0);
            const totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / size));

            return {
                items: rawItems,
                total,
                page,
                size,
                totalPages,
            };
        }

        // Trường hợp backend trả về trực tiếp một mảng
        const list: MockTestSummary[] = Array.isArray(data) ? data : [];
        return {
            items: list,
            total: list.length,
            page: queryParams.page || 0,
            size: queryParams.size || list.length || 10,
            totalPages: 1,
        };
    },

    /**
     * Lấy thông tin chi tiết giới thiệu đề thi trước khi bắt đầu
     * GET /api/mock-tests/{slug}
     * @param slug - Slug hoặc ID của đề thi
     * @returns Chi tiết đề thi MockTestDetail
     */
    getMockTestDetail: async (slug: string): Promise<MockTestDetail> => {
        const response = await apiClient.get<any>(`/api/mock-tests/${encodeURIComponent(slug)}`);
        const data = unwrapResponse<any>(response.data);
        return data as MockTestDetail;
    },

    /**
     * Khởi tạo phiên làm bài thi mới (Session)
     * POST /api/mock-tests/{testId}/start
     * @param testId - ID của đề thi
     * @returns Thông tin phiên thi StartSessionResponse gồm `sessionId`
     */
    startTestSession: async (testId: string): Promise<StartSessionResponse> => {
        const response = await apiClient.post<any>(`/api/mock-tests/${encodeURIComponent(testId)}/start`);
        const data = unwrapResponse<any>(response.data);

        const sessionId =
            data?.sessionId ||
            data?.session_id ||
            data?.id ||
            (typeof data === 'string' ? data : '');

        return {
            ...data,
            sessionId,
        };
    },

    /**
     * Lấy thông tin chi tiết của phòng thi (Workspace) gồm startTime, durationMinutes và danh sách câu hỏi
     * GET /api/test-sessions/{sessionId}/workspace
     * @param sessionId - Mã phiên làm bài thi
     * @returns TestWorkspaceResponse
     */
    getTestWorkspace: async (sessionId: string): Promise<TestWorkspaceResponse> => {
        const response = await apiClient.get<any>(`/api/test-sessions/${encodeURIComponent(sessionId)}/workspace`);
        const data = unwrapResponse<any>(response.data);

        const rawQuestions: WorkspaceQuestion[] = Array.isArray(data?.questions)
            ? data.questions
            : Array.isArray(data?.questionList)
            ? data.questionList
            : [];

        return {
            ...data,
            id: data?.id || data?.sessionId || sessionId,
            sessionId: data?.sessionId || data?.id || sessionId,
            startTime: data?.startTime || data?.startedAt || new Date().toISOString(),
            durationMinutes: data?.durationMinutes ?? data?.duration ?? 45,
            questions: rawQuestions,
        };
    },

    /**
     * Lưu nháp câu trắc nghiệm hoặc chạy chấm điểm ngay cho câu SQL
     * POST /api/test-sessions/{sessionId}/answers/{questionId}
     * Body: { "submittedAnswer": answer }
     * @param sessionId - Mã phiên thi
     * @param questionId - ID câu hỏi
     * @param answer - Nội dung câu trả lời (SQL query hoặc option value)
     * @returns SubmitAnswerResponse
     */
    submitAnswer: async (
        sessionId: string,
        questionId: string,
        answer: string
    ): Promise<SubmitAnswerResponse> => {
        const response = await apiClient.post<any>(
            `/api/test-sessions/${encodeURIComponent(sessionId)}/answers/${encodeURIComponent(questionId)}`,
            { submittedAnswer: answer }
        );
        const data = unwrapResponse<any>(response.data);

        return {
            questionId,
            submittedAnswer: answer,
            isCorrect: data?.isCorrect ?? data?.correct,
            score: data?.score,
            feedback: data?.feedback || data?.message,
            saved: true,
            runResult: data?.runResult || data?.result,
            ...data,
        };
    },

    /**
     * Nộp toàn bộ bài thi khi kết thúc phiên thi
     * POST /api/test-sessions/{sessionId}/submit
     * @param sessionId - Mã phiên thi
     * @returns SubmitTestResponse
     */
    submitTest: async (sessionId: string): Promise<SubmitTestResponse> => {
        const response = await apiClient.post<any>(
            `/api/test-sessions/${encodeURIComponent(sessionId)}/submit`,
            {}
        );
        const data = unwrapResponse<any>(response.data);

        return {
            sessionId,
            totalScore: data?.totalScore ?? data?.score,
            passingScore: data?.passingScore,
            isPassed: data?.isPassed ?? data?.passed,
            completedAt: data?.completedAt || new Date().toISOString(),
            message: data?.message,
            details: data?.details || [],
            ...data,
        };
    },
};

export default mockTestService;
