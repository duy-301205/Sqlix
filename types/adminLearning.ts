/**
 * TypeScript Interfaces cho Module Quản trị Nội dung Học tập (Admin Learning CMS)
 */

export interface CourseCategoryRequest {
    name: string;
    description: string;
    sortOrder: number;
    slug?: string;
    [key: string]: any;
}

export interface LessonAdminRequest {
    categoryId: string;
    title: string;
    slug: string;
    description: string;
    objectives: string[];
    practiceTopicCode: string;
    sortOrder: number;
    isPublished?: boolean;
    [key: string]: any;
}

export interface LessonSectionAdminRequest {
    title: string;
    content: string;
    sampleSql: string;
    noteBox?: any;
    sortOrder: number;
    durationMinutes?: number;
    [key: string]: any;
}

export interface AdminCategoryItem {
    id: string;
    name?: string;
    title?: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    orderIndex?: number;
    lessons?: any[];
    [key: string]: any;
}
