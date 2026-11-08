/**
 * TypeScript Interfaces cho Module Lộ trình & Lý thuyết SQL (Learning)
 */

export interface NoteBox {
    type?: 'tip' | 'info' | 'warning' | string;
    title?: string;
    content: string;
}

export interface LessonSection {
    id: string;
    title: string;
    content: string;
    sampleSql: string;
    noteBox?: NoteBox | string | null;
    // Tương thích ngược (Backward compatibility)
    heading?: string;
    code?: string;
    note?: string;
    noteType?: 'tip' | 'info' | 'warning' | string;
    orderIndex?: number;
    [key: string]: any;
}

export interface LessonSummary {
    id: string;
    slug?: string;
    title: string;
    orderIndex?: number;
    completed?: boolean;
    isCompleted?: boolean;
    status?: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | string;
    isBookmarked?: boolean;
    durationMinutes?: number;
    [key: string]: any;
}

export interface CurriculumCategory {
    id?: string | number;
    name?: string;
    category?: string;
    title?: string;
    description?: string;
    orderIndex?: number;
    lessons: LessonSummary[];
    [key: string]: any;
}

export interface TableOfContentItem {
    id: string;
    title: string;
}

export interface LessonDetail {
    id: string;
    slug: string;
    title: string;
    description?: string;
    category?: string;
    categoryId?: string | number;
    objectives?: string[];
    sections: LessonSection[];
    isBookmarked: boolean;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | string;
    isCompleted?: boolean;
    prevLessonSlug?: string | null;
    prevLessonId?: string | null;
    prevLessonTitle?: string | null;
    nextLessonSlug?: string | null;
    nextLessonId?: string | null;
    nextLessonTitle?: string | null;
    toc?: TableOfContentItem[];
    [key: string]: any;
}
