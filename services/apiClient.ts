import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
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
            if (accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Response Interceptor: Bắt lỗi 401 và tự động refresh token
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Nếu không có response hoặc mã không phải 401 hoặc request đã retry rồi thì trả về lỗi
        if (!error.response || error.response.status !== 401 || !originalRequest) {
            return Promise.reject(error);
        }

        // Bỏ qua nếu endpoint chính là login, refresh hoặc logout để tránh lặp vô tận
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
            // Không có refresh token -> Đăng xuất người dùng
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
            isRefreshing = false;
            return Promise.reject(error);
        }

        try {
            // Gọi endpoint refresh không thông qua interceptor của apiClient để tránh loop
            const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
                refreshToken,
            });

            const data = response.data;
            // Hỗ trợ cấu trúc trả về linh hoạt: { accessToken, refreshToken } hoặc { data: { accessToken, ... } }
            const newAccessToken = data.accessToken || data.data?.accessToken;
            const newRefreshToken = data.refreshToken || data.data?.refreshToken;

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
