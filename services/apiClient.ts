import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Quản lý trạng thái refresh token để tránh gọi nhiều lần đồng thời
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else if (token) {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

// 1. Request Interceptor: Tự động gắn accessToken vào Header
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const accessToken = localStorage.getItem('accessToken');
            const url = config.url || '';
            const isPublicAuthEndpoint =
                url.includes('/api/auth/login') ||
                url.includes('/api/auth/register') ||
                url.includes('/api/auth/forgot-password') ||
                url.includes('/api/auth/reset-password') ||
                url.includes('/api/auth/verify-email');

            if (accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            } else if (!isPublicAuthEndpoint) {
                console.warn(
                    `[API Client] Gửi request [${config.method?.toUpperCase()} ${url}] nhưng không có accessToken trong localStorage!`
                );
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Response Interceptor: Xử lý tự động refresh token khi gặp 401 Unauthorized
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        const status = error.response.status;

        // Xử lý lỗi 403 Forbidden: Tài khoản không có quyền (không refresh token vì refresh vẫn sẽ không có quyền)
        if (status === 403) {
            console.error(
                `[API Client] 403 Forbidden tại [${originalRequest.method?.toUpperCase()} ${originalRequest.url}]:`,
                error.response.data
            );
            return Promise.reject(error);
        }

        // Chỉ xử lý tự động refresh token với lỗi 401 Unauthorized
        if (status !== 401) {
            return Promise.reject(error);
        }

        // Bỏ qua nếu chính endpoint login hoặc refresh bị 401 để tránh lặp vô tận
        const url = originalRequest.url || '';
        if (url.includes('/api/auth/login') || url.includes('/api/auth/refresh')) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Nếu đang trong quá trình refresh token, đưa các request sau vào hàng đợi
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return apiClient(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        if (!refreshToken) {
            console.warn('[API Client] Không có refreshToken. Chuyển hướng sang /login');
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
            isRefreshing = false;
            return Promise.reject(error);
        }

        try {
            // Gọi endpoint refresh
            const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
                refreshToken,
            });

            const data = response.data;
            const target = data?.result || data?.data || data;

            const newAccessToken = target.token || target.accessToken || target.access_token;
            const newRefreshToken = target.refreshToken || target.refresh_token;

            if (!newAccessToken) {
                throw new Error('No access token returned from refresh endpoint');
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }
            }

            // Gắn token mới vào header request gốc và retry
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            processQueue(null, newAccessToken);
            return apiClient(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default apiClient;
