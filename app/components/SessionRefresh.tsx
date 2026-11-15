'use client';

import { useEffect, useState } from 'react';
import {
    AUTH_SESSION_EXPIRED, AUTH_TOKENS_CHANGED,
    getAccessTokenRefreshDelay, refreshAccessToken,
} from '@/services/apiClient';

export default function SessionRefresh() {
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;
        const schedule = () => {
            clearTimeout(timer);
            if (stopped) return;
            const access = localStorage.getItem('accessToken');
            const refresh = localStorage.getItem('refreshToken');
            if (access && refresh) setExpired(false);
            if (!refresh) return;
            const delay = getAccessTokenRefreshDelay(access);
            if (delay === null) return;
            timer = setTimeout(async () => {
                try {
                    await refreshAccessToken();
                } catch {
                    if (!stopped && localStorage.getItem('refreshToken')) {
                        // A temporary outage should not discard the login or the editor.
                        timer = setTimeout(schedule, 15000);
                    }
                    return;
                }
                schedule();
            }, Math.min(delay, 2147483647));
        };
        const focus = () => { if (document.visibilityState === 'visible') schedule(); };
        const storage = (event: StorageEvent) => {
            if (event.key === 'accessToken' || event.key === 'refreshToken' || event.key === null) schedule();
        };
        const sessionExpired = () => setExpired(true);
        schedule();
        window.addEventListener(AUTH_TOKENS_CHANGED, schedule);
        window.addEventListener(AUTH_SESSION_EXPIRED, sessionExpired);
        window.addEventListener('storage', storage);
        window.addEventListener('focus', focus);
        window.addEventListener('pageshow', focus);
        document.addEventListener('visibilitychange', focus);
        return () => {
            stopped = true;
            clearTimeout(timer);
            window.removeEventListener(AUTH_TOKENS_CHANGED, schedule);
            window.removeEventListener(AUTH_SESSION_EXPIRED, sessionExpired);
            window.removeEventListener('storage', storage);
            window.removeEventListener('focus', focus);
            window.removeEventListener('pageshow', focus);
            document.removeEventListener('visibilitychange', focus);
        };
    }, []);

    if (!expired) return null;
    return <div role="alert" className="fixed inset-x-4 top-4 z-[10001] mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-lg">
        Phiên đăng nhập không còn hợp lệ. Nội dung đang làm vẫn được giữ trên trang này.
        {' '}<a href="/login" target="_blank" rel="noopener noreferrer" className="font-bold underline">Đăng nhập lại trong tab mới</a>
    </div>;
}
