import apiClient from './apiClient';

export type OccupationType = 'STUDENT' | 'PROFESSIONAL' | 'OTHER';

export interface UserProfile {
    id: string | number;
    full_name: string;
    username: string;
    email: string;
    avatar_url?: string;
    role: string;
    occupation: OccupationType | string;
    current_streak: number;
    longest_streak: number;
    daily_target_minutes: number;
    bio?: string;
    // Backward compatibility helpers
    fullName?: string;
    avatarUrl?: string;
    avatar?: string;
    streakCount?: number;
    streak?: number;
    dailyTarget?: number;
    [key: string]: any;
}

export interface UpdateProfileData {
    full_name: string;
    avatar_url?: string;
    bio?: string;
    daily_target_minutes: number;
    occupation: OccupationType | string;
    // Backward compatibility helpers
    fullName?: string;
    avatarUrl?: string;
    dailyTarget?: number;
    [key: string]: any;
}

export const userService = {
    /**
     * Lấy thông tin hồ sơ của người dùng hiện tại
     * GET /api/users/me
     * Response trả về trong bọc `result` (hoặc `data`/trực tiếp)
     */
    getCurrentUser: async (): Promise<UserProfile> => {
        const response = await apiClient.get<any>('/api/users/me');
        const raw = response.data?.result || response.data?.data || response.data;

        // Chuẩn hóa dữ liệu trả về hỗ trợ cả snake_case và camelCase
        return {
            ...raw,
            full_name: raw.full_name || raw.fullName || '',
            avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || '',
            current_streak: raw.current_streak ?? raw.streakCount ?? raw.streak ?? 0,
            longest_streak: raw.longest_streak ?? raw.longestStreak ?? 0,
            daily_target_minutes: raw.daily_target_minutes ?? raw.dailyTarget ?? 30,
        };
    },

    /**
     * Cập nhật thông tin hồ sơ người dùng
     * PUT /api/users/me
     * Body gửi lên chuẩn snake_case theo DTO backend
     */
    updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
        const payload = {
            full_name: data.full_name || data.fullName,
            avatar_url: data.avatar_url || data.avatarUrl || '',
            bio: data.bio || '',
            daily_target_minutes: Number(data.daily_target_minutes ?? data.dailyTarget ?? 30),
            occupation: data.occupation,
        };
        const response = await apiClient.put<any>('/api/users/me', payload);
        const raw = response.data?.result || response.data?.data || response.data;

        return {
            ...raw,
            full_name: raw.full_name || raw.fullName || payload.full_name,
            avatar_url: raw.avatar_url || raw.avatarUrl || payload.avatar_url,
            current_streak: raw.current_streak ?? raw.streakCount ?? 0,
            longest_streak: raw.longest_streak ?? 0,
            daily_target_minutes: raw.daily_target_minutes ?? payload.daily_target_minutes,
        };
    },
};

export default userService;
