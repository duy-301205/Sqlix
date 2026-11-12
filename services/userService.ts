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

// Bộ nhớ đệm và khử trùng lặp request (Request Deduplication & Cache)
let cachedUserProfile: UserProfile | null = null;
let inflightUserPromise: Promise<UserProfile> | null = null;
let lastCacheTimestamp = 0;
const CACHE_DURATION_MS = 3000; // Cache 3 giây để triệt tiêu các request gọi trùng đồng thời

export const userService = {
    /**
     * Lấy thông tin hồ sơ của người dùng hiện tại
     * GET /api/users/me
     * Áp dụng In-flight Request Deduplication: Nếu có nhiều component (Header, ProfilePage)
     * cùng gọi trong 1 thời điểm, chỉ có DUY NHẤT 1 request HTTP được gửi đi.
     */
    getCurrentUser: async (forceRefresh = false): Promise<UserProfile> => {
        const now = Date.now();

        // 1. Nếu có cache còn hạn và không ép tải lại -> Trả về cache ngay lập tức (0 request HTTP)
        if (!forceRefresh && cachedUserProfile && now - lastCacheTimestamp < CACHE_DURATION_MS) {
            return cachedUserProfile;
        }

        // 2. Nếu đang có một request đang gửi đi và chưa xong -> Tái sử dụng Promise đó (0 request HTTP mới)
        if (!forceRefresh && inflightUserPromise) {
            return inflightUserPromise;
        }

        // 3. Khởi tạo request HTTP duy nhất
        inflightUserPromise = (async () => {
            try {
                const response = await apiClient.get<any>('/api/users/me');
                const raw = response.data?.result || response.data?.data || response.data;

                const normalizedUser: UserProfile = {
                    ...raw,
                    full_name: raw.full_name || raw.fullName || '',
                    avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || '',
                    current_streak: raw.current_streak ?? raw.streakCount ?? raw.streak ?? 0,
                    longest_streak: raw.longest_streak ?? raw.longestStreak ?? 0,
                    daily_target_minutes: raw.daily_target_minutes ?? raw.dailyTarget ?? 30,
                };

                cachedUserProfile = normalizedUser;
                lastCacheTimestamp = Date.now();
                return normalizedUser;
            } finally {
                // Request hoàn tất thì giải phóng cờ inflight
                inflightUserPromise = null;
            }
        })();

        return inflightUserPromise;
    },

    /**
     * Cập nhật thông tin hồ sơ người dùng
     * PUT /api/users/me
     * Tự động làm mới cache sau khi cập nhật thành công
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

        const updatedUser: UserProfile = {
            ...raw,
            full_name: raw.full_name || raw.fullName || payload.full_name,
            avatar_url: raw.avatar_url || raw.avatarUrl || payload.avatar_url,
            current_streak: raw.current_streak ?? raw.streakCount ?? 0,
            longest_streak: raw.longest_streak ?? 0,
            daily_target_minutes: raw.daily_target_minutes ?? payload.daily_target_minutes,
        };

        // Cập nhật lại cache với dữ liệu mới nhất
        cachedUserProfile = updatedUser;
        lastCacheTimestamp = Date.now();

        return updatedUser;
    },

    /**
     * Alias cho updateProfile
     */
    updateCurrentUser: (data: UpdateProfileData) => {
        return userService.updateProfile(data);
    },

    /**
     * Xóa cache thông tin user (dùng khi đăng xuất)
     */
    clearCache: () => {
        cachedUserProfile = null;
        inflightUserPromise = null;
        lastCacheTimestamp = 0;
    },
};

export default userService;
