import apiClient from './apiClient';

export type Occupation = 'STUDENT' | 'PROFESSIONAL' | 'OTHER';

export interface LoginCredentials {
    identifier?: string;
    emailOrUsername?: string;
    email?: string;
    username?: string;
    password: string;
}

export interface RegisterData {
    fullName: string;
    username: string;
    email: string;
    password: string;
    occupation: Occupation;
    termsAccepted: boolean;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    tokenType?: string;
}

export interface AuthResponse extends Partial<AuthTokens> {
    message?: string;
    data?: AuthTokens;
    user?: any;
    [key: string]: any;
}

export interface VerifyEmailData {
    email: string;
    code?: string;
    token?: string;
    otp?: string;
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    email?: string;
    token?: string;
    code?: string;
    newPassword?: string;
    password?: string;
}

export const authService = {
    /**
     * Đăng nhập người dùng
     * POST /api/auth/login
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        // Backend Spring Boot yêu cầu chính xác 2 trường: identifier và password
        const identifier = credentials.identifier || credentials.emailOrUsername || credentials.email || credentials.username || '';
        const payload = {
            identifier: identifier.trim(),
            password: credentials.password,
        };
        const response = await apiClient.post<any>('/api/auth/login', payload);
        const raw = response.data;
        // Backend có thể bọc trong `result` (Spring Boot ApiResponse), hoặc `data`, hoặc trả về trực tiếp
        const target = raw?.result || raw?.data || raw;

        // Trích xuất token linh hoạt từ mọi định dạng phổ biến của Spring Boot
        const accessToken =
            target?.accessToken ||
            target?.token ||
            target?.access_token ||
            raw?.accessToken ||
            raw?.token;

        const refreshToken =
            target?.refreshToken ||
            target?.refresh_token ||
            raw?.refreshToken;

        // Tự động lưu ngay vào localStorage
        if (typeof window !== 'undefined') {
            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
                console.log('✅ Đã lưu accessToken vào localStorage:', accessToken.slice(0, 15) + '...');
            } else {
                console.warn('⚠️ Không tìm thấy accessToken trong response đăng nhập từ Backend:', raw);
            }
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
        }

        return {
            ...raw,
            ...target,
            accessToken,
            refreshToken,
        };
    },

    /**
     * Đăng ký tài khoản mới
     * POST /api/auth/register
     */
    register: async (data: RegisterData): Promise<any> => {
        // Khớp chính xác với RegisterRequest của Backend Spring Boot
        const payload = {
            username: data.username.trim(),
            email: data.email.trim(),
            password: data.password,
            fullName: data.fullName.trim(),
            occupation: data.occupation,
            termsAccepted: Boolean(data.termsAccepted),
        };
        const response = await apiClient.post('/api/auth/register', payload);
        return response.data;
    },

    /**
     * Đăng xuất người dùng
     * POST /api/auth/logout
     */
    logout: async (refreshToken?: string): Promise<any> => {
        const token = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);
        try {
            const response = await apiClient.post('/api/auth/logout', { refreshToken: token });
            return response.data;
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        }
    },

    /**
     * Xác thực email (OTP hoặc Token)
     * POST /api/auth/verify-email
     */
    verifyEmail: async (data: VerifyEmailData): Promise<any> => {
        const response = await apiClient.post('/api/auth/verify-email', {
            email: data.email.trim(),
            otp: data.otp || data.code || data.token || '',
        });
        return response.data;
    },

    /**
     * Yêu cầu gửi link/mã đặt lại mật khẩu
     * POST /api/auth/forgot-password
     */
    forgotPassword: async (data: ForgotPasswordData): Promise<any> => {
        const response = await apiClient.post('/api/auth/forgot-password', data);
        return response.data;
    },

    /**
     * Đặt lại mật khẩu mới
     * POST /api/auth/reset-password
     */
    resetPassword: async (data: ResetPasswordData): Promise<any> => {
        const response = await apiClient.post('/api/auth/reset-password', {
            token: data.token || data.code || '',
            newPassword: data.newPassword || data.password || '',
        });
        return response.data;
    },
};

/**
 * Kiểm tra xem role có phải là ADMIN hay không
 */
export const checkIsAdmin = (roleData?: any): boolean => {
    if (!roleData) return false;
    if (Array.isArray(roleData)) {
        return roleData.some((r) => checkIsAdmin(r));
    }
    const r = String(roleData).toUpperCase().trim();
    return r === 'ADMIN' || r === 'ROLE_ADMIN' || r.includes('ADMIN');
};

/**
 * Kiểm tra xem user có quyền vào trang quản trị hay không (ADMIN hoặc GIÁO VIÊN / INSTRUCTOR)
 */
export const checkCanAccessAdmin = (roleData?: any): boolean => {
    if (!roleData) return false;
    if (Array.isArray(roleData)) {
        return roleData.some((r) => checkCanAccessAdmin(r));
    }
    const r = String(roleData).toUpperCase().trim();
    return (
        r === 'ADMIN' ||
        r === 'ROLE_ADMIN' ||
        r === 'INSTRUCTOR' ||
        r === 'ROLE_INSTRUCTOR' ||
        r === 'TEACHER' ||
        r === 'ROLE_TEACHER' ||
        r.includes('ADMIN') ||
        r.includes('INSTRUCTOR') ||
        r.includes('TEACHER')
    );
};

/**
 * Trích xuất role từ accessToken JWT nếu có
 */
export const extractRoleFromToken = (token?: string | null): string | null => {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length === 3) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            const parsed = JSON.parse(jsonPayload);
            return parsed?.role || parsed?.roles || parsed?.scope || parsed?.authorities || null;
        }
    } catch {
        try {
            const parsed = JSON.parse(atob(token.split('.')[1]));
            return parsed?.role || parsed?.roles || parsed?.scope || parsed?.authorities || null;
        } catch {
            return null;
        }
    }
    return null;
};

export default authService;
