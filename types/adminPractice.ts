/**
 * TypeScript Interfaces cho Module Quản trị Database và Bài luyện (Admin Practice CMS)
 */

export interface DatabaseRequest {
    name: string;
    slug: string;
    description: string;
    difficulty: string;
    iconUrl: string;
    schemaData: any;
    initSqlScript: string;
    tablesCount: number;
    exercisesCount: number;
    dialect?: string;
    sampleRecordsCount?: number;
    [key: string]: any;
}

export interface ExerciseRequest {
    title: string;
    description: string;
    difficulty: string;
    topics: string;
    maxScore: number;
    requirements: any;
    expectedColumns: any;
    solutionQuery: string;
    sortOrder: number;
    databaseId?: string;
    slug?: string;
    initialCodeSnippet?: string;
    hints?: any;
    [key: string]: any;
}

export interface AdminPracticeDatabase {
    id: string;
    name: string;
    slug: string;
    description: string;
    difficulty?: string;
    iconUrl?: string;
    dialect?: string;
    schemaData?: any;
    initSqlScript?: string;
    tablesCount?: number;
    tableCount?: number;
    exercisesCount?: number;
    exerciseCount?: number;
    sampleRecordsCount?: number;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

export interface AdminPracticeExercise {
    id: string;
    databaseId: string;
    title: string;
    slug?: string;
    description?: string;
    difficulty: string;
    topics?: string;
    maxScore?: number;
    points?: number;
    requirements?: any;
    expectedColumns?: any;
    solutionQuery: string;
    initialCodeSnippet?: string;
    hints?: any;
    sortOrder?: number;
    orderIndex?: number;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}
