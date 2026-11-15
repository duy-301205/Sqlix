import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
export const AUTH_TOKENS_CHANGED = 'sqlix:auth-tokens-changed';
export const AUTH_SESSION_EXPIRED = 'sqlix:auth-session-expired';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000,
});
// No authentication interceptors on this client: refreshing must never recurse.
const refreshClient = axios.create({ baseURL: BASE_URL, timeout: 15000 });
let refreshPromise: Promise<string> | null = null;

export function storeAuthTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    window.dispatchEvent(new Event(AUTH_TOKENS_CHANGED));
}

export function clearAuthTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new Event(AUTH_TOKENS_CHANGED));
}

export function getAccessTokenRefreshDelay(token: string | null): number | null {
    if (!token) return 0;
    try {
        const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const claims = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')));
        if (typeof claims.exp !== 'number') return null;
        const lifetime = typeof claims.iat === 'number' ? (claims.exp - claims.iat) * 1000 : 300000;
        const leeway = Math.min(60000, Math.max(1000, lifetime / 5));
        return Math.max(0, claims.exp * 1000 - Date.now() - leeway);
    } catch {
        return null;
    }
}

function expireSession(expectedRefreshToken: string | null) {
    if (typeof window === 'undefined' || localStorage.getItem('refreshToken') !== expectedRefreshToken) return;
    clearAuthTokens();
    // Keep the current editor mounted; the user can sign in in another tab.
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED));
}

export function refreshAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;
    if (typeof window === 'undefined') return Promise.reject(new Error('Authentication requires a browser session.'));
    const startingAccess = localStorage.getItem('accessToken');
    const startingRefresh = localStorage.getItem('refreshToken');
    const refresh = async () => {
        const currentAccess = localStorage.getItem('accessToken');
        const currentRefresh = localStorage.getItem('refreshToken');
        // A different tab may have refreshed or signed in while waiting for the lock.
        if (currentAccess && currentRefresh && (currentAccess !== startingAccess || currentRefresh !== startingRefresh)) return currentAccess;
        if (!currentRefresh) {
            expireSession(currentRefresh);
            throw new Error('Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.');
        }
        try {
            const response = await refreshClient.post('/api/auth/refresh', { refreshToken: currentRefresh });
            const raw = response.data;
            const tokens = raw?.result ?? raw?.data ?? raw;
            const access = tokens?.accessToken ?? tokens?.token ?? tokens?.access_token;
            const rotated = tokens?.refreshToken ?? tokens?.refresh_token;
            if (typeof access !== 'string' || !access) throw new Error('Máy chủ chưa trả về access token mới. Vui lòng thử lại.');
            // Never restore a session after logout, or overwrite a newer login.
            if (localStorage.getItem('refreshToken') !== currentRefresh) {
                const newer = localStorage.getItem('accessToken');
                if (newer && localStorage.getItem('refreshToken')) return newer;
                throw new Error('Phiên đăng nhập đã thay đổi.');
            }
            storeAuthTokens(access, typeof rotated === 'string' ? rotated : undefined);
            return access;
        } catch (error) {
            if (localStorage.getItem('refreshToken') !== currentRefresh) {
                const newer = localStorage.getItem('accessToken');
                if (newer && localStorage.getItem('refreshToken')) return newer;
            }
            // Connection failures and server errors must not log the user out.
            if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
                expireSession(currentRefresh);
            }
            throw error;
        }
    };
    const task = navigator.locks
        ? navigator.locks.request('sqlix:refresh-session', refresh).then<string>(token => token)
        : refresh();
    const pending = task.finally(() => { if (refreshPromise === pending) refreshPromise = null; });
    refreshPromise = pending;
    return pending;
}

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };
const publicAuthPaths = new Set([
    '/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/oauth',
    '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/verify-email',
]);
const requestPath = (url?: string) => new URL(url || '/', BASE_URL).pathname;

apiClient.interceptors.request.use(async (config: RetryConfig) => {
    if (typeof window === 'undefined' || publicAuthPaths.has(requestPath(config.url))) return config;
    let token = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    if (!config._retry && refresh && (refreshPromise || getAccessTokenRefreshDelay(token) === 0)) {
        token = await refreshAccessToken();
    }
    if (token) config.headers.set('Authorization', 'Bearer ' + token);
    else config.headers.delete('Authorization');
    // Refresh rotation can happen before sending or retrying a logout request.
    if (requestPath(config.url) === '/api/auth/logout') {
        const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        config.data = { ...data, refreshToken: localStorage.getItem('refreshToken') };
    }
    return config;
});

apiClient.interceptors.response.use(response => response, async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry || publicAuthPaths.has(requestPath(original.url))) throw error;
    original._retry = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const sent = original.headers.get('Authorization');
    // A late 401 from the old access token reuses the token already refreshed.
    const access = token && sent !== 'Bearer ' + token ? token : await refreshAccessToken();
    original.headers.set('Authorization', 'Bearer ' + access);
    return apiClient(original);
});

export default apiClient;
