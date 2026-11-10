'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import authService from '@/services/authService';
import userService, { UserProfile } from '@/services/userService';

const DEFAULT_AVATAR =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla';

export default function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true;
        userService.getCurrentUser().then((data) => {
            if (active && data) setUser(data);
        }).catch(() => {});
        return () => { active = false; };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await authService.logout();
        } finally {
            userService.clearCache();
            setIsMenuOpen(false);
            setIsLoggingOut(false);
            router.replace('/login');
        }
    };

    const getPageTitle = () => {
        if (pathname.includes('/admin/profile')) {
            return {
                title: 'Hồ Sơ Quản Trị Viên',
                subtitle: 'Xem và quản lý thông tin tài khoản quản trị hệ thống'
            };
        }
        if (pathname.includes('/admin/users')) {
            return {
                title: 'Quản lý Người dùng',
                subtitle: 'Phân quyền, kiểm duyệt và quản lý tài khoản học viên & giảng viên'
            };
        }
        if (pathname.includes('/admin/learning')) {
            return {
                title: 'Quản lý Lộ trình Học tập',
                subtitle: 'Cấu trúc Danh mục, Bài học và các Section bài giảng SQL'
            };
        }
        if (pathname.includes('/admin/practice')) {
            return {
                title: 'Quản lý Kho Luyện tập',
                subtitle: 'Cơ sở dữ liệu mẫu (DDL) và ngân hàng bài tập SQL thực hành'
            };
        }
        if (pathname.includes('/admin/mock-tests')) {
            return {
                title: 'Quản lý Đề Thi thử',
                subtitle: 'Ngân hàng đề thi, câu hỏi trắc nghiệm và truy vấn SQL'
            };
        }
        if (pathname.includes('/admin/history')) {
            return {
                title: 'Lịch sử Thi toàn hệ thống',
                subtitle: 'Tra cứu, lọc kết quả và giám sát các phiên thi của học viên'
            };
        }
        return {
            title: 'Bảng Điều Khiển Quản Trị',
            subtitle: 'Hôm nay là một ngày tuyệt vời để vận hành SQLix!'
        };
    };

    const { title, subtitle } = getPageTitle();
    const avatarUrl = user?.avatar_url || DEFAULT_AVATAR;
    const displayName = user?.full_name || user?.username || 'Duy Hoàng';
    const roleTitle = user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Quản trị viên';

    return (
        <header className="flex justify-between items-center w-full px-6 md:px-10 py-5 bg-[#f8f9ff]/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200/60 shrink-0">
            {/* Left: Greeting / Title */}
            <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                    {title} 🛡️
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {subtitle}
                </p>
            </div>

            {/* Right: Actions (Status, Notifications, User Profile Menu) */}
            <div className="flex items-center gap-3 sm:gap-4">
                {/* System Status Pill */}
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-slate-200/80 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">PostgreSQL</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Kết nối tốt</span>
                </div>

                {/* Notifications Button */}
                <button
                    type="button"
                    onClick={() => console.log('Admin notifications open')}
                    className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-full border border-slate-200/80 text-slate-600 hover:text-blue-600 transition-colors shadow-xs cursor-pointer"
                    title="Thông báo quản trị"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                {/* Admin User Profile Dropdown Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group"
                        title="Tùy chọn tài khoản quản trị"
                    >
                        <Image
                            alt="Avatar Admin"
                            width={36}
                            height={36}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover group-hover:ring-2 group-hover:ring-blue-500/30 transition-all"
                            src={avatarUrl}
                        />
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                                {displayName}
                            </span>
                            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                                {roleTitle}
                            </span>
                        </div>
                        <svg
                            className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-blue-600'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Profile Info Header */}
                            <div className="px-4 py-2.5 border-b border-slate-100">
                                <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email || 'admin@sqlix.edu.vn'}</p>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 uppercase">
                                        {user?.role || 'ADMIN'}
                                    </span>
                                </div>
                            </div>

                            {/* Menu Links */}
                            <div className="py-1">
                                {/* Hồ sơ Quản trị viên (Ở lại trong trang admin) */}
                                <Link
                                    href="/admin/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors ${
                                        pathname === '/admin/profile'
                                            ? 'bg-blue-50 text-blue-600 font-bold'
                                            : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                                    }`}
                                >
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Hồ sơ Quản trị viên</span>
                                </Link>

                                {/* Chuyển sang Cổng học viên (Khi admin muốn thử nghiệm giao diện học viên) */}
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                                >
                                    <span className="text-sm">🎒</span>
                                    <span>Chuyển sang Cổng học viên</span>
                                </Link>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100 my-1"></div>

                            {/* Logout Button */}
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

