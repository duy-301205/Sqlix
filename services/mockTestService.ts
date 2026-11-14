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
    TestResultResponse,
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
    TestResultResponse,
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
     * @param params - Các tham số lọc: difficulty (EASY, MEDIUM, HARD), page (UI 1-indexed), size...
     * @returns Danh sách đề thi MockTestPagination
     */
    getMockTests: async (params?: MockTestParams): Promise<MockTestPagination> => {
        // UI uses 1-based page (1, 2, 3...), Spring Data JPA uses 0-based page (0, 1, 2...)
        const rawPage = params?.page !== undefined ? Number(params.page) : 1;
        const zeroBasedPage = Math.max(0, rawPage > 0 ? rawPage - 1 : 0);

        // Map Vietnamese/English difficulty to backend enum if provided
        let backendDifficulty: string | undefined = undefined;
        if (params?.difficulty && params.difficulty !== 'all') {
            const d = params.difficulty.toUpperCase();
            if (d.includes('DỄ') || d.includes('EASY') || d.includes('BEGINNER')) backendDifficulty = 'EASY';
            else if (d.includes('KHÓ') || d.includes('HARD') || d.includes('ADVANCED') || d.includes('NÂNG CAO')) backendDifficulty = 'HARD';
            else if (d.includes('TRUNG') || d.includes('MEDIUM') || d.includes('INTERMEDIATE')) backendDifficulty = 'MEDIUM';
        }

        const queryParams: Record<string, any> = {
            page: zeroBasedPage,
            size: params?.size || 10,
        };
        if (params?.search) queryParams.search = params.search;
        if (backendDifficulty) queryParams.difficulty = backendDifficulty;

        const response = await apiClient.get<any>('/api/mock-tests', { params: queryParams });
        const data = unwrapResponse<any>(response.data);

        const paginationInfo = response.data?.pagination;
        const rawList: any[] = Array.isArray(data)
            ? data
            : (data && Array.isArray(data.items))
            ? data.items
            : (data && Array.isArray(data.content))
            ? data.content
            : [];

        // Read custom metadata (passingScore, maxScore, isPublished) from localStorage
        let customMetaMap: Record<string, any> = {};
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('sqlix_mock_tests_custom_metadata');
                if (stored) customMetaMap = JSON.parse(stored);
            } catch {}
        }

        const normalizedList: MockTestSummary[] = rawList
            .map((item: any) => {
                const id = String(item.id);
                const slug = item.slug || id;
                const meta = customMetaMap[id] || customMetaMap[slug] || {};

                // Map difficulty to Vietnamese label
                let diffLabel: 'Dễ' | 'Trung bình' | 'Khó' = 'Trung bình';
                const rawDiff = String(item.difficulty || '').toUpperCase();
                if (rawDiff === 'EASY' || rawDiff === 'DỄ' || rawDiff === 'BEGINNER') {
                    diffLabel = 'Dễ';
                } else if (rawDiff === 'HARD' || rawDiff === 'KHÓ' || rawDiff === 'ADVANCED') {
                    diffLabel = 'Khó';
                }

                // Detect category from title / description
                let category = item.category || 'SQL';
                const text = ((item.title || '') + ' ' + (item.description || '')).toLowerCase();
                if (text.includes('commerce') || text.includes('bán hàng') || text.includes('thương mại')) category = 'E-commerce';
                else if (text.includes('university') || text.includes('đại học') || text.includes('giáo dục') || text.includes('trường')) category = 'University';
                else if (text.includes('hospital') || text.includes('bệnh viện') || text.includes('y tế')) category = 'Hospital';
                else if (text.includes('analytic') || text.includes('phân tích') || text.includes('thống kê')) category = 'Analytics';
                else if (text.includes('bank') || text.includes('ngân hàng') || text.includes('tài chính')) category = 'Banking';

                return {
                    id,
                    title: item.title || '',
                    slug,
                    description: item.description || '',
                    difficulty: diffLabel,
                    durationMinutes: Number(item.durationMinutes || 45),
                    coverImageUrl: item.coverImageUrl || '',
                    questionsCount: Number(item.totalQuestions ?? item.questionsCount ?? 0),
                    participantsCount: Number(item.totalParticipants ?? item.participantsCount ?? 0),
                    category,
                    passingScore: item.passingScore ?? meta.passingScore ?? 60,
                    maxScore: item.maxScore ?? meta.maxScore ?? 100,
                    isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : (meta.isPublished !== undefined ? Boolean(meta.isPublished) : true),
                };
            })
            // Filter out unpublished (draft) tests for students
            .filter((item: MockTestSummary) => item.isPublished !== false);

        const total = paginationInfo?.total ?? (data?.total || normalizedList.length);
        const totalPages = paginationInfo?.last_page ?? Math.max(1, Math.ceil(total / (queryParams.size || 10)));
        const page = paginationInfo?.current_page ?? rawPage;

        return {
            items: normalizedList,
            total,
            page,
            size: queryParams.size,
            totalPages,
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

        let customMetaMap: Record<string, any> = {};
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('sqlix_mock_tests_custom_metadata');
                if (stored) customMetaMap = JSON.parse(stored);
            } catch {}
        }

        const id = String(data?.id || slug);
        const itemSlug = data?.slug || slug;
        const meta = customMetaMap[id] || customMetaMap[itemSlug] || {};

        let diffLabel: 'Dễ' | 'Trung bình' | 'Khó' = 'Trung bình';
        const rawDiff = String(data?.difficulty || '').toUpperCase();
        if (rawDiff === 'EASY' || rawDiff === 'DỄ' || rawDiff === 'BEGINNER') {
            diffLabel = 'Dễ';
        } else if (rawDiff === 'HARD' || rawDiff === 'KHÓ' || rawDiff === 'ADVANCED') {
            diffLabel = 'Khó';
        }

        return {
            ...data,
            id,
            slug: itemSlug,
            difficulty: diffLabel,
            questionsCount: Number(data?.totalQuestions ?? data?.questionsCount ?? 0),
            participantsCount: Number(data?.totalParticipants ?? data?.participantsCount ?? 0),
            passingScore: data?.passingScore ?? meta.passingScore ?? 60,
            maxScore: data?.maxScore ?? meta.maxScore ?? 100,
            isPublished: data?.isPublished !== undefined ? Boolean(data?.isPublished) : (meta.isPublished !== undefined ? Boolean(meta.isPublished) : true),
        };
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

        const rawQuestions: any[] = Array.isArray(data?.questions)
            ? data.questions
            : Array.isArray(data?.questionList)
            ? data.questionList
            : [];

        const normalizedQuestions: WorkspaceQuestion[] = rawQuestions.map((q: any, idx: number) => {
            const qId = String(q.id || q.questionId || `q-${idx + 1}`);
            return {
                ...q,
                id: qId,
                questionId: qId,
                content: q.content || q.title || '',
                title: q.title || `Câu hỏi số ${idx + 1}`,
                points: Number(q.points ?? 10),
                sortOrder: Number(q.sortOrder ?? idx + 1),
                questionType: q.questionType || 'SQL_QUERY',
                databaseId: q.databaseId ? String(q.databaseId) : undefined,
                schemaData: q.schemaData || undefined,
                requirements: q.requirements || [],
                expectedColumns: q.expectedColumns || [],
                mcOptions: q.mcOptions || [],
            };
        });

        return {
            ...data,
            id: data?.id || data?.sessionId || sessionId,
            sessionId: data?.sessionId || data?.id || sessionId,
            testTitle: data?.testTitle || data?.title || 'Phòng thi thử SQL mô phỏng',
            startTime: data?.startTime || data?.startedAt || new Date().toISOString(),
            durationMinutes: data?.durationMinutes ?? data?.duration ?? 45,
            questions: normalizedQuestions,
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

    /**
     * Lấy kết quả chấm điểm chi tiết của phiên thi
     * GET /api/test-sessions/{sessionId}/result
     * @param sessionId - Mã phiên thi
     * @returns TestResultResponse
     */
    getTestResult: async (sessionId: string): Promise<TestResultResponse> => {
        const response = await apiClient.get<any>(
            `/api/test-sessions/${encodeURIComponent(sessionId)}/result`
        );
        const data = unwrapResponse<any>(response.data);

        const rawQuestions = Array.isArray(data?.questions) ? data.questions : [];
        const questions = rawQuestions.map((q: any) => ({
            ...q,
            questionId: q.questionId || q.id || '',
            questionType: q.questionType || q.type || 'SQL',
            content: q.content || q.questionText || '',
            points: q.points ?? 0,
            sortOrder: q.sortOrder ?? 0,
            submittedAnswer: q.submittedAnswer ?? q.userAnswer ?? '',
            score: q.score ?? 0,
            isCorrect: Boolean(q.isCorrect),
            solutionQuery: q.solutionQuery || '',
            mcCorrectOption: q.mcCorrectOption || '',
            explanation: q.explanation || '',
        }));

        return {
            ...data,
            sessionId: data?.sessionId || sessionId,
            totalScore: data?.totalScore ?? data?.score ?? 0,
            status: data?.status || 'COMPLETED',
            durationDeducted: data?.durationDeducted ?? data?.durationSeconds ?? 0,
            durationSeconds: data?.durationSeconds ?? data?.durationDeducted ?? 0,
            questions,
        };
    },
};

export default mockTestService;
