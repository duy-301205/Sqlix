/**
 * TypeScript Interfaces cho Module Quản trị Đề thi (Admin Mock Test CMS)
 */

export interface MockTestRequest {
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    durationMinutes: number;
    coverImageUrl: string;
    passingScore?: number;
    maxScore?: number;
    isPublished?: boolean;
    [key: string]: any;
}

export interface MockTestQuestionRequest {
    questionType: 'SQL_QUERY' | 'MULTIPLE_CHOICE';
    databaseId?: string;
    content: string;
    points: number;
    sortOrder: number;
    requirements?: any;
    expectedColumns?: any;
    solutionQuery?: string;
    maxRetries?: number;
    mcOptions?: any;
    mcCorrectOption?: string;
    explanation?: string;
    initialQuery?: string;
    [key: string]: any;
}

export interface AdminMockTest {
    id: string;
    title: string;
    slug?: string;
    description: string;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'Dễ' | 'Trung bình' | 'Khó' | string;
    durationMinutes: number;
    coverImageUrl?: string;
    passingScore?: number;
    maxScore?: number;
    isPublished?: boolean;
    questionsCount?: number;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

export interface AdminMockQuestion {
    id: string;
    mockTestId: string;
    questionType: 'SQL_QUERY' | 'MULTIPLE_CHOICE';
    content: string;
    points: number;
    sortOrder: number;
    databaseId?: string;
    requirements?: any;
    expectedColumns?: any;
    solutionQuery?: string;
    maxRetries?: number;
    mcOptions?: any;
    mcCorrectOption?: string;
    explanation?: string;
    initialQuery?: string;
    options?: any[];
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}
