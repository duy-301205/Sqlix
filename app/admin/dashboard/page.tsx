'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { mockDashboardStats } from '../mockData';
import { DashboardStats } from '../types';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Simulated API call GET /api/admin/dashboard/stats
    const handleRefreshStats = () => {
        setIsRefreshing(true);
        console.log(`[API CALL]: GET /api/admin/dashboard/stats?range=${timeRange}`);
        setTimeout(() => {
            setIsRefreshing(false);
            console.log('[API RESPONSE]: Stats updated successfully', stats);
        }, 500);
    };

    return (
        <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8 min-w-0">
            {/* ================= 1. Top Bar: Overview Greeting & Action Pills ================= */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Tổng Quan Hệ Thống 📊
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Theo dõi thời gian thực số lượng học viên, bài tập và phiên thi thử
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Time Range Pills */}
                    <div className="flex items-center p-1 bg-white rounded-full border border-slate-200/80 shadow-xs">
                        {(['7d', '30d', 'all'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => {
                                    setTimeRange(range);
                                    console.log(`Selected range: ${range}`);
                                }}
                                className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                                    timeRange === range
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {range === '7d' ? '7 Ngày' : range === '30d' ? '30 Ngày' : 'Tất cả'}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefreshStats}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-full border border-slate-200/80 shadow-xs text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline">{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
                    </button>
                </div>
            </div>

            {/* ================= 2. Metric Cards (4 Columns) Đồng bộ hoàn toàn Dashboard ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Metric 1: Users */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng Người Dùng</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="my-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-950">{stats.totalUsers.toLocaleString()}</span>
                            <span className="text-sm font-semibold text-slate-500">/ 2.000 user</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.totalUsers / 2000) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-blue-600">+{stats.userGrowthPercent}% tháng này</span>
                        <span className="text-slate-400 font-medium">{stats.activeUsersToday} active hôm nay</span>
                    </div>
                </div>

                {/* Metric 2: Lessons */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bài Học & Lộ Trình</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    </div>
                    <div className="my-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-950">{stats.totalLessons}</span>
                            <span className="text-sm font-semibold text-slate-500">/ {stats.totalCategories} danh mục</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '84%' }}></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-emerald-600">{stats.totalSections} phần học</span>
                        <span className="text-slate-400 font-medium">Đã xuất bản 100%</span>
                    </div>
                </div>

                {/* Metric 3: Practice Exercises */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kho Luyện Tập SQL</span>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </div>
                    </div>
                    <div className="my-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-950">{stats.totalExercises}</span>
                            <span className="text-sm font-semibold text-slate-500">/ 300 bài tập</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                            <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.totalExercises / 300) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-purple-600">{stats.totalDatabases} Database mẫu</span>
                        <span className="text-slate-400 font-medium">+12 bài tuần này</span>
                    </div>
                </div>

                {/* Metric 4: Mock Tests */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lượt Thi Toàn Hệ Thống</span>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                    </div>
                    <div className="my-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-950">{stats.totalTestSessions.toLocaleString()}</span>
                            <span className="text-sm font-semibold text-slate-500">lượt nộp</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.passRatePercent}%` }}></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-amber-600">Đạt {stats.passRatePercent}%</span>
                        <span className="text-slate-400 font-medium">Điểm TB: {stats.averageTestScore}/10</span>
                    </div>
                </div>
            </div>

            {/* ================= 3. Quick Action Nav & Server Health ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Thao tác quản trị */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Thao Tác Quản Trị Nhanh</h3>
                                <p className="text-xs text-slate-500">Tạo mới và quản lý nội dung trong hệ thống</p>
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                4 Module chính
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        Quản lý Người dùng
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate">Phân quyền, khóa/mở tài khoản</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/learning"
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                        Thêm Lộ Trình / Bài Học
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate">Soạn thảo cấu trúc giáo trình</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/practice"
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/30 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                                        Kho Database & Bài Tập
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate">Tải DDL script và solution query</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/mock-tests"
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                                        Ngân Hàng Đề Thi Thử
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate">Thiết lập câu hỏi và thời gian thi</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Cần kiểm tra bài nộp của học viên?</span>
                        <Link href="/admin/history" className="font-bold text-blue-600 hover:underline">
                            Xem lịch sử thi toàn hệ thống &rarr;
                        </Link>
                    </div>
                </div>

                {/* Right 1 Col: Server & Database Health */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Máy Chủ SQL Sandbox</h3>
                                <p className="text-xs text-slate-500">PostgreSQL Container Engine</p>
                            </div>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Hoạt động
                            </span>
                        </div>

                        <div className="space-y-4 py-4">
                            {/* CPU */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-slate-600">CPU Tải trung bình</span>
                                    <span className="text-slate-900 font-bold">{stats.systemHealth.cpuUsagePercent}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${stats.systemHealth.cpuUsagePercent}%` }}></div>
                                </div>
                            </div>

                            {/* Memory */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className="text-slate-600">Bộ nhớ RAM đã cấp</span>
                                    <span className="text-slate-900 font-bold">{stats.systemHealth.memoryUsagePercent}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${stats.systemHealth.memoryUsagePercent}%` }}></div>
                                </div>
                            </div>

                            {/* Stat Boxes */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                                    <span className="text-[11px] text-slate-400 font-medium block">Độ trễ truy vấn</span>
                                    <span className="text-sm font-black text-slate-900">{stats.systemHealth.avgQueryLatencyMs} ms</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                                    <span className="text-[11px] text-slate-400 font-medium block">Active Sockets</span>
                                    <span className="text-sm font-black text-slate-900">{stats.systemHealth.activeConnections}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-center">
                        <button
                            onClick={() => console.log('Ping PostgreSQL cluster')}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                            Kiểm tra kết nối Database
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= 4. Recent Test Submissions Table ================= */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Các Phiên Thi Gần Nhất
                        </h3>
                        <p className="text-xs text-slate-500">
                            Học viên nộp bài thi thử trực tuyến
                        </p>
                    </div>
                    <Link
                        href="/admin/history"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                    >
                        <span>Xem tất cả lịch sử</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                <th className="py-3.5 px-6">Học Viên</th>
                                <th className="py-3.5 px-6">Đề Thi</th>
                                <th className="py-3.5 px-6 text-center">Điểm Số</th>
                                <th className="py-3.5 px-6 text-center">Kết Quả</th>
                                <th className="py-3.5 px-6">Thời Gian Làm</th>
                                <th className="py-3.5 px-6 text-right">Thời Điểm Nộp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {stats.recentTestSessions.map((session) => (
                                <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                                    {/* User */}
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                {session.userName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 truncate">
                                                    {session.userName}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate">
                                                    {session.userEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Test Title */}
                                    <td className="py-4 px-6 max-w-xs">
                                        <p className="font-semibold text-slate-800 truncate" title={session.testTitle}>
                                            {session.testTitle}
                                        </p>
                                        <span className="text-[11px] text-slate-400">ID: {session.id}</span>
                                    </td>

                                    {/* Score */}
                                    <td className="py-4 px-6 text-center">
                                        <span className={`inline-block font-black text-sm px-2.5 py-1 rounded-lg ${
                                            session.score >= 8
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : session.score >= 5
                                                ? 'bg-amber-50 text-amber-700'
                                                : 'bg-rose-50 text-rose-700'
                                        }`}>
                                            {session.score.toFixed(1)} / {session.maxScore}
                                        </span>
                                    </td>

                                    {/* Result Badge */}
                                    <td className="py-4 px-6 text-center">
                                        {session.isPassed ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Đạt
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                                                <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Chưa đạt
                                            </span>
                                        )}
                                    </td>

                                    {/* Duration */}
                                    <td className="py-4 px-6 text-xs text-slate-600">
                                        {Math.floor(session.durationSeconds / 60)} phút {session.durationSeconds % 60}s
                                    </td>

                                    {/* Submitted At */}
                                    <td className="py-4 px-6 text-right text-xs text-slate-500">
                                        {new Date(session.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.submittedAt).toLocaleDateString('vi-VN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
