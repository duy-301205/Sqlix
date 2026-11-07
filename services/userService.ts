import apiClient from './apiClient';

export interface UserProfile {
    id: string | number;
    email: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
    avatar?: string;
    occupation?: 'STUDENT' | 'PROFESSIONAL' | 'OTHER' | string;
    role?: 'ADMIN' | 'USER' | string;
    streakCount?: number;
    streak?: number;
    dailyTarget?: number;
    targetMinutes?: number;
    bio?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

export interface UpdateProfileData {
    fullName?: string;
    avatarUrl?: string;
    occupation?: string;
    dailyTarget?: number;
    bio?: string;
    phone?: string;
    [key: string]: any;
}

export const userService = {
    /**
     * Lấy thông tin hồ sơ của người dùng hiện tại
     * GET /api/users/me
     */
    getCurrentUser: async (): Promise<UserProfile> => {
        const response = await apiClient.get<any>('/api/users/me');
        // Backend có thể trả về trực tiếp user object hoặc { data: user }
        return response.data?.data || response.data;
    },

    /**
     * Cập nhật thông tin hồ sơ người dùng
     * PUT /api/users/me
     */
    updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
        const response = await apiClient.put<any>('/api/users/me', data);
        return response.data?.data || response.data;
    },
};

export default userService;
