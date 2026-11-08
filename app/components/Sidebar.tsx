'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import userService from '@/services/userService';
import { checkCanAccessAdmin } from '@/services/authService';

export default function Sidebar() {
    const pathname = usePathname();
    const [canAccessAdmin, setCanAccessAdmin] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem('accessToken')) return;
        userService.getCurrentUser()
            .then((user) => setCanAccessAdmin(checkCanAccessAdmin(user.role)))
            .catch(() => setCanAccessAdmin(false));
    }, []);

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
        },
        {
            name: 'Learning',
            href: '/learning',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
        },
        {
            name: 'Practice',
            href: '/practice',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ),
        },
        {
            name: 'Mock Test',
            href: '/mock-tests',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
        },
        {
            name: 'History',
            href: '/history',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ];

    return (
        <aside className="w-64 shrink-0 h-screen bg-white border-r border-slate-200/80 shadow-xs flex flex-col py-6 z-30">
            {/* Brand Logo */}
            <div className="px-6 mb-6 flex items-center gap-3 shrink-0">
                <Link className="flex items-center gap-3" href="/">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
                        S
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                        SQL<span className="text-blue-600">Learn</span>
                    </span>
                </Link>
            </div>

            {/* Navigation Items (Scrollable) */}
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto px-3">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href === '/mock-tests' && pathname?.startsWith('/mock-test')) ||
                        (item.href !== '/' && item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                                isActive
                                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            {item.icon}
                            {item.name}
                        </Link>
                    );
                })}

                {/* Bottom Nav: Admin Portal Shortcut, Settings & Logout */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1">
                    {canAccessAdmin && <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3.5 text-blue-600 bg-blue-50/80 hover:bg-blue-100 text-blue-700 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border border-blue-200/70 shadow-2xs group"
                    >
                        <svg className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Trang Quản Trị 🛡️</span>
                    </Link>}
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </Link>
                    <Link
                        href="/login"
                        className="flex items-center gap-3.5 text-rose-600 hover:bg-rose-50 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </Link>
                </div>

                {/* Target Progress Banner */}
                <div className="mt-4 px-1 pb-2 shrink-0">
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-center shadow-xs">
                        <div className="w-8 h-8 bg-amber-100 rounded-full mx-auto mb-1.5 flex items-center justify-center text-base shadow-inner">
                            🏆
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mb-0.5">Cố gắng mỗi ngày!</h4>
                        <p className="text-[11px] text-slate-500 mb-2 leading-tight">Học SQL 15 phút mỗi ngày.</p>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[33%] rounded-full"></div>
                        </div>
                        <div className="text-left mt-1 text-[10px] font-bold text-emerald-600">5 / 15 phút</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
