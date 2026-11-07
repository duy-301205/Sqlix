'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import userService, { UserProfile } from '@/services/userService';
import authService from '@/services/authService';

interface HeaderProps {
    userName?: string;
    streakCount?: number;
}

export default function Header({ 
    userName: defaultUserName = 'Người học', 
    streakCount: defaultStreakCount = 0 
}: HeaderProps) {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Lấy thông tin user hiện tại khi component mount
    useEffect(() => {
        const fetchUserData = async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (!token) return;

            try {
                const userData = await userService.getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.error('Không thể lấy thông tin người dùng:', error);
            }
        };

        fetchUserData();
    }, []);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Xử lý đăng xuất
    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
            await authService.logout(refreshToken || undefined);
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
            setIsMenuOpen(false);
            setIsLoggingOut(false);
            router.push('/login');
        }
    };

    const displayName = user?.fullName || user?.username || defaultUserName;
    const displayStreak = user?.streakCount ?? user?.streak ?? defaultStreakCount;
    const avatarUrl = user?.avatarUrl || user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla';
    const isAdmin = user?.role === 'ADMIN';

    return (
        <header className="flex justify-between items-center w-full px-6 md:px-10 py-5 bg-[#f8f9ff]/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200/60 shrink-0">
            {/* Left: Greeting */}
            <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                    Xin chào, {displayName}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Hôm nay là một ngày tuyệt vời để học SQL!
                </p>
            </div>

            {/* Right: Actions (Admin Portal, Streak, Notifications, User Menu) */}
            <div className="flex items-center gap-3 sm:gap-4">
                {/* Admin Portal Shortcut Button */}
                {isAdmin && (
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-full text-xs font-bold transition-all shadow-2xs"
                        title="Chuyển sang Bảng điều khiển Quản trị"
                    >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Vào Quản Trị</span>
                    </Link>
                )}

                {/* Streak Counter */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-slate-200/80 shadow-xs">
                    <span className="text-sm sm:text-base">🔥</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{displayStreak}</span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">Ngày streak</span>
                </div>

                {/* Notifications Button */}
                <button
                    type="button"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-full border border-slate-200/80 text-slate-600 hover:text-blue-600 transition-colors shadow-xs cursor-pointer"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group"
                        title="Tùy chọn tài khoản"
                        aria-expanded={isMenuOpen}
                    >
                        <Image
                            alt="Avatar"
                            width={36}
                            height={36}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover group-hover:ring-2 group-hover:ring-blue-500/30 transition-all"
                            src={avatarUrl}
                        />
                        <span className="text-xs sm:text-sm font-bold text-slate-800 hidden sm:block group-hover:text-blue-600 transition-colors">
                            {displayName}
                        </span>
                        <svg 
                            className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-blue-600'}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'Học viên SQLix'}</p>
                            </div>

                            <Link
                                href="/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Hồ sơ cá nhân</span>
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left disabled:opacity-50"
                            >
                                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
