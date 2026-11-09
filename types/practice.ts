/**
 * TypeScript Interfaces cho Module Luyện tập (Practice)
 */

export interface ColumnSchema {
    name: string;
    type: string;
    isPk?: boolean;
    isFk?: boolean;
    description?: string;
    [key: string]: any;
}

export interface TableSchema {
    name: string;
    vietnameseName?: string;
    description?: string;
    columnsCount?: number;
    columns: ColumnSchema[];
    [key: string]: any;
}

export interface TableRelationship {
    relation: string;
    description: string;
    fromTable?: string;
    toTable?: string;
    [key: string]: any;
}

export interface DatabaseSchemaData {
    tables?: TableSchema[];
    relationships?: TableRelationship[];
    relations?: TableRelationship[];
    [key: string]: any;
}

export interface PracticeDatabase {
    id: string;
    name: string;
    slug: string;
    description: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó' | string;
    iconUrl?: string;
    schemaData?: DatabaseSchemaData | string | null;
    tablesCount: number;
    exercisesCount: number;
    // Thuộc tính bổ trợ UI
    rating?: number;
    difficultyColor?: string;
    iconBg?: string;
    iconColor?: string;
    icon?: string;
    [key: string]: any;
}

export interface PracticeExercise {
    id: string;
    title: string;
    description: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó' | string;
    topics?: string[] | string;
    maxScore?: number;
    requirements?: string[];
    expectedColumns?: string[];
    // Thuộc tính bổ trợ UI và tương thích ngược
    category?: string;
    points?: number;
    orderNumber?: number;
    difficultyColor?: string;
    sampleQuery?: string;
    hint?: string;
    [key: string]: any;
}

export interface PracticeDatabaseDetail extends PracticeDatabase {
    subtitle?: string;
    overviewText?: string;
    attributesCount?: number;
    relationsCount?: number;
    mainCategoriesCount?: number;
    businessTablesCount?: number;
    junctionTablesCount?: number;
    tables?: TableSchema[];
    relationships?: TableRelationship[];
    exercises: PracticeExercise[];
    [key: string]: any;
}

export interface ExerciseWorkspace {
    id: string;
    databaseId?: string;
    databaseSlug?: string;
    title: string;
    description: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó' | string;
    topics?: string[] | string;
    maxScore: number;
    requirements: string[];
    expectedColumns: string[];
    initialSql?: string;
    sampleQuery?: string;
    hint?: string;
    mockData?: any[];
    schemaData?: DatabaseSchemaData | string | null;
    orderNumber?: number;
    difficultyColor?: string;
    [key: string]: any;
}

/**
 * Kết quả trả về khi chạy thử câu lệnh SQL (Run Query)
 */
export interface RunQueryResponse {
    columns: string[];
    rows: Array<Record<string, any> | any[]>;
    errorMessage?: string | null;
    executionTimeMs?: number;
    rowCount?: number;
    [key: string]: any;
}

/**
 * Kết quả trả về khi nộp bài chấm điểm tự động (Submit Query)
 */
export interface SubmitQueryResponse {
    status: 'PASSED' | 'FAILED' | 'ERROR' | string;
    score: number;
    feedback: string;
    actualResult?: RunQueryResponse | null;
    expectedResult?: RunQueryResponse | null;
    passedCount?: number;
    totalTests?: number;
    executionTimeMs?: number;
    [key: string]: any;
}
