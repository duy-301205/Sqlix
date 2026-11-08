/**
 * TypeScript Interfaces cho Module Quản trị Người dùng (Admin Users)
 */

export type AdminUserRole = 'USER' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | string;

export interface AdminUser {
    id: string;
    username: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    occupation?: string;
    role: AdminUserRole;
    active: boolean;
    createdAt: string;
    // Các trường mở rộng / tương thích giao diện
    status?: 'ACTIVE' | 'BANNED' | 'PENDING' | string;
    totalExercisesSolved?: number;
    testsTaken?: number;
    lastActiveAt?: string;
    [key: string]: any;
}

export interface AdminUserFilterParams {
    search?: string;
    role?: string;
    active?: boolean | null;
    page?: number;
    size?: number;
    [key: string]: any;
}

export interface AdminUserPaginationInfo {
    total: number;
    page: number;
    size: number;
    totalPages: number;
    [key: string]: any;
}

export interface AdminUserResponse {
    users: AdminUser[];
    pagination: AdminUserPaginationInfo;
}
