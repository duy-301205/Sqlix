'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import ActivityChart from './ActivityChart';
import dashboardService, {
    DashboardOverview,
    TopicMastery,
    DailyActivity,
    RecentActivity,
} from '@/services/dashboardService';

const COLOR_PALETTES = [
    'bg-blue-600',
    'bg-emerald-500',
    'bg-purple-600',
    'bg-amber-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-indigo-600',
    'bg-cyan-500',
];

export default function DashboardPage() {
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [mastery, setMastery] = useState<TopicMastery[]>([]);
    const [chartData, setChartData] = useState<DailyActivity[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const requestRef = useRef(0);

    const fetchDashboardData = useCallback(async (silent = false) => {
        const requestId = ++requestRef.current;
        if (!silent) setIsLoading(true);
        setErrorMessage(null);

        try {
            // Tải dữ liệu song song từ 4 endpoints
            const [overviewRes, masteryRes, chartRes, activitiesRes] = await Promise.allSettled([
                dashboardService.getOverview(),
                dashboardService.getMastery(),
                dashboardService.getActivityChart(),
                dashboardService.getRecentActivities(),
            ]);
            if (requestId !== requestRef.current) return;

            if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
            if (masteryRes.status === 'fulfilled') setMastery(masteryRes.value);
            if (chartRes.status === 'fulfilled') setChartData(chartRes.value);
            if (activitiesRes.status === 'fulfilled') setRecentActivities(activitiesRes.value);

            // Nếu cả 4 đều thất bại thì báo lỗi chi tiết từ backend
            if (
                overviewRes.status === 'rejected' &&
                masteryRes.status === 'rejected' &&
                chartRes.status === 'rejected' &&
                activitiesRes.status === 'rejected'
            ) {
                const firstError: any = overviewRes.reason || masteryRes.reason || chartRes.reason;
                const data = firstError?.response?.data;
                const backendMsg = data?.message || firstError?.message || 'Không thể tải dữ liệu bảng điều khiển.';
                const code = data?.code;
                setErrorMessage(code ? `[Lỗi ${code}] ${backendMsg}` : backendMsg);
            }
        } catch (err: any) {
            if (requestId !== requestRef.current) return;
            console.error('Lỗi khi tải dữ liệu dashboard:', err);
            setErrorMessage('Có lỗi xảy ra khi tải dữ liệu bảng điều khiển.');
        } finally {
            if (requestId === requestRef.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchDashboardData();
        const refresh = () => {
            if (document.visibilityState === 'visible') void fetchDashboardData(true);
        };
        window.addEventListener('focus', refresh);
        window.addEventListener('pageshow', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            ++requestRef.current;
            window.removeEventListener('focus', refresh);
            window.removeEventListener('pageshow', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [fetchDashboardData]);

    // 1. Số liệu tổng quan (với fallback tính toán an toàn)
    const completedLessons = overview?.totalLessonsCompleted ?? 0;
    const totalLessons = overview?.totalLessons ?? 0;
    const lessonPercent =
        overview?.lessonPercentage ??
        (totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0);
    const remainingLessons = Math.max(0, totalLessons - completedLessons);

    const completedExercises = overview?.totalExercisesSolved ?? 0;
    const totalExercises = overview?.totalExercises ?? 0;
    const exercisePercent =
        overview?.exercisePercentage ??
        (totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0);

    const averageScore = overview?.averageScore ?? overview?.average_score ?? 0;
    const rankingTier = 'Bài thực hành và thi thử';
    const rankingPercentile = 'Thang 100';

    const studyTimeHours = (overview?.totalStudyTimeSeconds ?? 0) / 3600;
    const dailyAverageMinutes = overview?.dailyAverageMinutes ?? overview?.daily_average_minutes ?? 0;

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar Component */}
            <div className="shrink-0"><Sidebar /></div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header Component */}
                <Header />

                {/* Scrollable Dashboard Body */}
                <main className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto">
                    <div className="px-4 sm:px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8">
                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{errorMessage}</span>
                            </div>
                            <button
                                onClick={() => void fetchDashboardData()}
                                className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-all"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Loading Skeleton */}
                    {isLoading ? (
                        <div className="space-y-8 animate-pulse">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 h-44 border border-slate-200/80 flex flex-col justify-between">
                                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                        <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-5 bg-white rounded-2xl p-6 h-80 border border-slate-200/80"></div>
                                <div className="lg:col-span-7 bg-white rounded-2xl p-6 h-80 border border-slate-200/80"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ================= 1. Top Metric Cards (4 Columns) ================= */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                {/* Metric 1: Bài học hoàn thành */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bài học hoàn thành</span>
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="my-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-slate-950">{completedLessons}</span>
                                            <span className="text-sm font-semibold text-slate-500">/ {totalLessons} bài</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, lessonPercent)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-blue-600">Đã đạt {lessonPercent}%</span>
                                        <span className="text-slate-400 font-medium">Còn {remainingLessons} bài</span>
                                    </div>
                                </div>

                                {/* Metric 2: Bài tập đã làm */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bài tập đã làm</span>
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="my-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-slate-950">{completedExercises}</span>
                                            <span className="text-sm font-semibold text-slate-500">/ {totalExercises} bài</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, exercisePercent)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-emerald-600">Đã hoàn thành {exercisePercent}%</span>
                                        <span className="text-slate-400 font-medium">
                                            {overview?.weeklyNewExercises ? `+${overview.weeklyNewExercises} tuần này` : 'Tích cực luyện tập'}
                                        </span>
                                    </div>
                                </div>

                                {/* Metric 3: Điểm trung bình */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Điểm trung bình</span>
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="my-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-slate-950">
                                                {typeof averageScore === 'number' ? averageScore.toFixed(1) : averageScore}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-500">/ 100</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                            <div
                                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.max(0, Math.min(100, Number(averageScore)))}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-purple-600">{rankingTier}</span>
                                        <span className="text-slate-400 font-medium">{rankingPercentile}</span>
                                    </div>
                                </div>

                                {/* Metric 4: Thời gian học tập */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Thời gian học tập</span>
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="my-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-slate-950">{studyTimeHours.toFixed(2)}</span>
                                            <span className="text-sm font-semibold text-slate-500">giờ</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                            <div
                                                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, (Number(dailyAverageMinutes) / 60) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-amber-600">
                                            {dailyAverageMinutes > 0 ? `TB ${dailyAverageMinutes}p/ngày` : 'Học tập đều đặn'}
                                        </span>
                                        <span className="text-slate-400 font-medium">30 ngày qua</span>
                                    </div>
                                </div>
                            </div>

                            {/* ================= 2. Middle Row: Progress & Chart ================= */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Skills Mastery Card (5 Cols) */}
                                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg">Mức độ thành thạo</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Tiến độ chi tiết từng chuyên đề SQL</p>
                                        </div>
                                        <Link
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                            href="/learning"
                                        >
                                            Xem chi tiết →
                                        </Link>
                                    </div>

                                    <div className="space-y-4">
                                        {mastery && mastery.length > 0 ? (
                                            mastery.map((item, index) => {
                                                const title = item.title || item.topicName || item.name || `Chuyên đề #${index + 1}`;
                                                const percent = item.percentage ?? item.percent ?? item.masteryPercentage ?? item.mastery_percentage ?? 0;
                                                const colorClass = item.color || COLOR_PALETTES[index % COLOR_PALETTES.length];

                                                return (
                                                    <div key={item.id || item.topicId || index} className="space-y-1.5">
                                                        <div className="flex justify-between text-xs font-semibold">
                                                            <span className="text-slate-800">{title}</span>
                                                            <span className="text-slate-600 font-bold">{percent}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className={`${colorClass} h-full rounded-full transition-all duration-500`}
                                                                style={{ width: `${Math.min(100, percent)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-slate-400 italic text-center py-6">
                                                Chưa có dữ liệu thành thạo. Hãy hoàn thành các bài học đầu tiên!
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Activity Analytics Card (7 Cols) */}
                                <div className="lg:col-span-7 min-w-0 overflow-hidden bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg">Thống kê hoạt động</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Lượt nộp bài thực hành và đề thi thử đã hoàn thành</p>
                                        </div>
                                        <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                                            30 ngày gần nhất
                                        </div>
                                    </div>

                                    <ActivityChart data={chartData} />
                                </div>
                            </div>

                            {/* ================= 3. Bottom Row: 3 Action Columns ================= */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {/* 1. Continue Learning */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-black text-slate-900 text-base">Bài học tiếp tục</h3>
                                        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">Đang học</span>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                                                SQL
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">
                                                    {overview?.nextLesson?.title || 'SELECT & WHERE nâng cao'}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {overview?.nextLesson?.subTitle || 'Luyện tập truy vấn cơ bản'}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                                                <span>Tiến độ bài học</span>
                                                <span className="text-blue-600">
                                                    {overview?.nextLesson?.progress ?? 50}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-full rounded-full"
                                                    style={{ width: `${overview?.nextLesson?.progress ?? 50}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <Link
                                            href="/learning"
                                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <span>Tiếp tục học</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>

                                {/* 2. Recent Exercises / Activities */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-black text-slate-900 text-base">Hoạt động gần đây</h3>
                                        <Link className="text-xs font-bold text-blue-600 hover:underline" href="/practice">
                                            Xem tất cả →
                                        </Link>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {recentActivities && recentActivities.length > 0 ? (
                                            recentActivities.slice(0, 4).map((item, idx) => (
                                                <div key={item.id || idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-blue-600 cursor-pointer">
                                                            {item.title}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold border text-blue-700 bg-blue-50 border-blue-200">
                                                                {item.tag || item.category || 'Thực hành'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {item.timeAgo || item.createdAt || 'Gần đây'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {item.score !== undefined && (
                                                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
                                                            {item.score}
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 italic text-center py-6">
                                                Chưa có hoạt động thực hành nào gần đây.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Recent Mock Test */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-black text-slate-900 text-base">Kỳ thi thử gần đây</h3>
                                        <Link className="text-xs font-bold text-blue-600 hover:underline" href="/history">
                                            Lịch sử thi →
                                        </Link>
                                    </div>

                                    {overview?.recentMockTest ? (
                                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between flex-1">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{overview.recentMockTest.title}</h4>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {overview.recentMockTest.submittedAt ? new Date(overview.recentMockTest.submittedAt).toLocaleString('vi-VN') : 'Chưa có thời gian nộp'}
                                                    {' • '}{overview.recentMockTest.questionCount} câu hỏi
                                                </p>
                                                <div className="grid grid-cols-3 gap-2 my-4 text-center">
                                                    <div className="rounded-xl border border-slate-200 bg-white p-2">
                                                        <span className="text-[10px] text-slate-500">Điểm / 100</span>
                                                        <p className="mt-1 text-lg font-black text-blue-600">{Number(overview.recentMockTest.score).toFixed(1)}</p>
                                                    </div>
                                                    <div className="rounded-xl border border-slate-200 bg-white p-2">
                                                        <span className="text-[10px] text-slate-500">Thời gian</span>
                                                        <p className="mt-1 text-sm font-bold">{Math.floor(overview.recentMockTest.durationSeconds / 60)}p {overview.recentMockTest.durationSeconds % 60}s</p>
                                                    </div>
                                                    <div className="rounded-xl border border-slate-200 bg-white p-2">
                                                        <span className="text-[10px] text-slate-500">Kết quả</span>
                                                        <p className={'mt-1 text-sm font-bold ' + (overview.recentMockTest.isPassed ? 'text-emerald-600' : 'text-rose-600')}>{overview.recentMockTest.isPassed ? 'Đạt' : 'Chưa đạt'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href={'/test-sessions/' + overview.recentMockTest.sessionId + '/result'} className="block rounded-xl border border-slate-300 bg-white py-2.5 text-center text-xs font-bold hover:bg-slate-100">Xem chi tiết kỳ thi</Link>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                                            <p className="text-sm font-semibold text-slate-600">Chưa có kỳ thi thử nào hoàn thành</p>
                                            <Link href="/mock-tests" className="mt-4 text-xs font-bold text-blue-600 hover:underline">Khám phá đề thi →</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                </main>
            </div>
        </div>
    );
}
