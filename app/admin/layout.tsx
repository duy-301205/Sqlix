'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import userService from '@/services/userService';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        let active = true;
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.replace('/login');
            return () => { active = false; };
        }

        userService.getCurrentUser(true).then((user) => {
            if (!active) return;
            if (user.role !== 'ADMIN') {
                router.replace('/dashboard');
                return;
            }
            setAuthorized(true);
        }).catch(() => {
            if (active) router.replace('/login');
        });

        return () => { active = false; };
    }, [router]);

    if (!authorized) {
        return <div className="flex min-h-screen items-center justify-center text-slate-600">Đang kiểm tra quyền truy cập...</div>;
    }

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar Component */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header Component */}
                <AdminHeader />

                {/* Main Scrollable Admin Workspace */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}
