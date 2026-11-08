import apiClient from './apiClient';
import {
    PracticeDatabase,
    PracticeExercise,
    PracticeDatabaseDetail,
    ExerciseWorkspace,
    DatabaseSchemaData,
    TableSchema,
    TableRelationship,
    ColumnSchema,
    RunQueryResponse,
    SubmitQueryResponse,
} from '@/types/practice';

export type {
    PracticeDatabase,
    PracticeExercise,
    PracticeDatabaseDetail,
    ExerciseWorkspace,
    DatabaseSchemaData,
    TableSchema,
    TableRelationship,
    ColumnSchema,
    RunQueryResponse,
    SubmitQueryResponse,
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

/**
 * Chuẩn hóa schemaData nếu backend trả về dạng chuỗi JSON
 */
const parseSchemaData = (schemaData: any): DatabaseSchemaData | null => {
    if (!schemaData) return null;
    if (typeof schemaData === 'string') {
        try {
            return JSON.parse(schemaData);
        } catch (e) {
            console.warn('[PracticeService] Lỗi parse schemaData JSON:', e);
            return null;
        }
    }
    return schemaData;
};

export const practiceService = {
    /**
     * Lấy danh sách các cơ sở dữ liệu mẫu để luyện tập
     * GET /api/practice/databases
     * @returns Mảng các PracticeDatabase
     */
    getDatabases: async (): Promise<PracticeDatabase[]> => {
        const response = await apiClient.get<any>('/api/practice/databases');
        const data = unwrapResponse<any>(response.data);
        const list: PracticeDatabase[] = Array.isArray(data) ? data : [];

        // Chuẩn hóa schemaData cho từng CSDL nếu có
        return list.map((db) => ({
            ...db,
            schemaData: parseSchemaData(db.schemaData),
        }));
    },

    /**
     * Lấy thông tin chi tiết một cơ sở dữ liệu (kèm schemaData ERD và danh sách bài tập)
     * GET /api/practice/databases/{slug}
     * @param slug - Slug hoặc ID của cơ sở dữ liệu (ví dụ: 'ecommerce', 'university')
     * @returns Chi tiết CSDL PracticeDatabaseDetail
     */
    getDatabaseDetail: async (slug: string): Promise<PracticeDatabaseDetail> => {
        const response = await apiClient.get<any>(`/api/practice/databases/${encodeURIComponent(slug)}`);
        const data = unwrapResponse<any>(response.data);

        const parsedSchema = parseSchemaData(data.schemaData);

        // Chuẩn hóa cấu trúc để tương thích ngược với các tab hiện có
        const normalizedDetail: PracticeDatabaseDetail = {
            ...data,
            schemaData: parsedSchema,
            tables: data.tables || parsedSchema?.tables || [],
            relationships: data.relationships || parsedSchema?.relationships || parsedSchema?.relations || [],
            exercises: Array.isArray(data.exercises) ? data.exercises : [],
        };

        return normalizedDetail;
    },

    /**
     * Lấy thông tin chi tiết của đề bài tập để nạp vào phòng thực hành (Workspace)
     * GET /api/practice/exercises/{exerciseId}
     * @param exerciseId - ID của bài tập
     * @returns Chi tiết đề bài tập ExerciseWorkspace
     */
    getExerciseWorkspace: async (exerciseId: string): Promise<ExerciseWorkspace> => {
        const response = await apiClient.get<any>(`/api/practice/exercises/${encodeURIComponent(exerciseId)}`);
        const data = unwrapResponse<any>(response.data);

        return {
            ...data,
            schemaData: parseSchemaData(data.schemaData),
            requirements: Array.isArray(data.requirements) ? data.requirements : [],
            expectedColumns: Array.isArray(data.expectedColumns || data.expectedOutputColumns)
                ? (data.expectedColumns || data.expectedOutputColumns)
                : [],
        };
    },

    /**
     * Chạy thử câu lệnh SQL trong phòng thực hành (Run Query)
     * POST /api/practice/exercises/{exerciseId}/run
     * @param exerciseId - ID của bài tập
     * @param query - Chuỗi câu lệnh SQL cần chạy thử
     * @returns Kết quả chạy thử RunQueryResponse (columns, rows, errorMessage)
     */
    runQuery: async (exerciseId: string, query: string): Promise<RunQueryResponse> => {
        const response = await apiClient.post<any>(
            `/api/practice/exercises/${encodeURIComponent(exerciseId)}/run`,
            { query }
        );
        const data = unwrapResponse<any>(response.data);

        // Chuẩn hóa kết quả trả về
        const rawRows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.data) ? data.data : [];
        let rawColumns: string[] = Array.isArray(data?.columns) ? data.columns : [];

        // Nếu backend không trả sẵn columns nhưng có rows dạng object
        if (rawColumns.length === 0 && rawRows.length > 0 && typeof rawRows[0] === 'object' && !Array.isArray(rawRows[0])) {
            rawColumns = Object.keys(rawRows[0]);
        }

        return {
            columns: rawColumns,
            rows: rawRows,
            errorMessage: data?.errorMessage || data?.error || null,
            executionTimeMs: data?.executionTimeMs ?? data?.durationMs ?? 0,
            rowCount: data?.rowCount ?? rawRows.length,
        };
    },

    /**
     * Nộp bài kiểm tra và chấm điểm tự động (Submit Query)
     * POST /api/practice/exercises/{exerciseId}/submit
     * @param exerciseId - ID của bài tập
     * @param query - Chuỗi câu lệnh SQL người dùng nộp
     * @returns Kết quả chấm điểm SubmitQueryResponse (status, score, feedback, actualResult)
     */
    submitQuery: async (exerciseId: string, query: string): Promise<SubmitQueryResponse> => {
        const response = await apiClient.post<any>(
            `/api/practice/exercises/${encodeURIComponent(exerciseId)}/submit`,
            { query }
        );
        const data = unwrapResponse<any>(response.data);

        // Chuẩn hóa actualResult nếu có
        let actualResult: RunQueryResponse | null = null;
        if (data?.actualResult) {
            const rawRows = Array.isArray(data.actualResult.rows)
                ? data.actualResult.rows
                : Array.isArray(data.actualResult.data)
                ? data.actualResult.data
                : [];
            let rawColumns: string[] = Array.isArray(data.actualResult.columns) ? data.actualResult.columns : [];

            if (rawColumns.length === 0 && rawRows.length > 0 && typeof rawRows[0] === 'object' && !Array.isArray(rawRows[0])) {
                rawColumns = Object.keys(rawRows[0]);
            }

            actualResult = {
                columns: rawColumns,
                rows: rawRows,
                errorMessage: data.actualResult.errorMessage || null,
                executionTimeMs: data.actualResult.executionTimeMs ?? 0,
                rowCount: data.actualResult.rowCount ?? rawRows.length,
            };
        }

        return {
            status: data?.status || (data?.score >= 100 ? 'PASSED' : 'FAILED'),
            score: typeof data?.score === 'number' ? data.score : 0,
            feedback: data?.feedback || data?.message || '',
            actualResult,
            expectedResult: data?.expectedResult || null,
            passedCount: data?.passedCount,
            totalTests: data?.totalTests,
            executionTimeMs: data?.executionTimeMs,
        };
    },
};

export default practiceService;
