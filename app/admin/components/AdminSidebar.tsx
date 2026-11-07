'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
    const pathname = usePathname();

    const navItems = [
        {
            name: 'Dashboard',
            href: '/admin/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
        },
        {
            name: 'Users',
            href: '/admin/users',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            name: 'Learning',
            href: '/admin/learning',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
        },
        {
            name: 'Practice',
            href: '/admin/practice',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ),
        },
        {
            name: 'Mock Tests',
            href: '/admin/mock-tests',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
        },
        {
            name: 'History',
            href: '/admin/history',
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
            <div className="px-6 mb-6 flex items-center justify-between shrink-0">
                <Link className="flex items-center gap-3" href="/admin/dashboard">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20">
                        S
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                            SQL<span className="text-blue-600">Learn</span>
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">
                            Admin Portal
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation Items (Scrollable) */}
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
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
                            <span>{item.name}</span>
                        </Link>
                    );
                })}

                {/* Bottom Nav: Portal Switch & Logout */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Cổng học viên</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => console.log('Admin logout')}
                        className="flex items-center gap-3.5 text-rose-600 hover:bg-rose-50 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors w-full text-left cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Đăng xuất</span>
                    </button>
                </div>

                {/* Admin Status Card */}
                <div className="mt-auto px-1 pt-4 shrink-0">
                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-center shadow-xs">
                        <div className="w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1.5 flex items-center justify-center text-base shadow-inner">
                            🛡️
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mb-0.5">Quyền Quản Trị</h4>
                        <p className="text-[11px] text-slate-500 mb-2 leading-tight">Hệ thống vận hành an toàn.</p>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[95%] rounded-full"></div>
                        </div>
                        <div className="text-left mt-1 text-[10px] font-bold text-emerald-600 flex items-center justify-between">
                            <span>PostgreSQL Sandbox</span>
                            <span>Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
