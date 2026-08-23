'use client';

import Image from 'next/image';

interface HeaderProps {
    userName?: string;
    streakCount?: number;
}

export default function Header({ 
    userName = 'Duy Hoàng', 
    streakCount = 7 
}: HeaderProps) {
    return (
        <header className="flex justify-between items-center w-full px-6 md:px-10 py-5 bg-[#f8f9ff]/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200/60 shrink-0">
            {/* Left: Greeting */}
            <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                    Xin chào, {userName}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Hôm nay là một ngày tuyệt vời để học SQL!
                </p>
            </div>

            {/* Right: Actions (Streak, Notifications, User Profile) */}
            <div className="flex items-center gap-3 sm:gap-4">
                {/* Streak Counter */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full border border-slate-200/80 shadow-xs">
                    <span className="text-sm sm:text-base">🔥</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{streakCount}</span>
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
                <div className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full bg-white border border-slate-200/80 shadow-xs cursor-pointer hover:bg-slate-50 transition-colors">
                    <Image
                        alt="Avatar"
                        width={36}
                        height={36}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-800 hidden sm:block">{userName}</span>
                    <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </header>
    );
}