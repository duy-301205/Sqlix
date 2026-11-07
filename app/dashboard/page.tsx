'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
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

    const fetchDashboardData = async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            // Tải dữ liệu song song từ 4 endpoints
            const [overviewRes, masteryRes, chartRes, activitiesRes] = await Promise.allSettled([
                dashboardService.getOverview(),
                dashboardService.getMastery(),
                dashboardService.getActivityChart(),
                dashboardService.getRecentActivities(),
            ]);

            if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
            if (masteryRes.status === 'fulfilled') setMastery(masteryRes.value);
            if (chartRes.status === 'fulfilled') setChartData(chartRes.value);
            if (activitiesRes.status === 'fulfilled') setRecentActivities(activitiesRes.value);

            // Nếu cả 4 đều thất bại thì báo lỗi
            if (
                overviewRes.status === 'rejected' &&
                masteryRes.status === 'rejected' &&
                chartRes.status === 'rejected' &&
                activitiesRes.status === 'rejected'
            ) {
                setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau!');
            }
        } catch (err: any) {
            console.error('Lỗi khi tải dữ liệu dashboard:', err);
            setErrorMessage('Có lỗi xảy ra khi tải dữ liệu bảng điều khiển.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // 1. Số liệu tổng quan (với fallback tính toán an toàn)
    const completedLessons = overview?.completedLessons ?? overview?.completed_lessons ?? 0;
    const totalLessons = overview?.totalLessons ?? overview?.total_lessons ?? 120;
    const lessonPercent =
        overview?.lessonPercentage ??
        (totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0);
    const remainingLessons = Math.max(0, totalLessons - completedLessons);

    const completedExercises = overview?.completedExercises ?? overview?.completed_exercises ?? 0;
    const totalExercises = overview?.totalExercises ?? overview?.total_exercises ?? 300;
    const exercisePercent =
        overview?.exercisePercentage ??
        (totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0);

    const averageScore = overview?.averageScore ?? overview?.average_score ?? 0;
    const rankingTier = overview?.rankingTier ?? overview?.ranking_tier ?? 'Đang xếp hạng';
    const rankingPercentile = overview?.rankingPercentile ?? 'Top học viên tích cực';

    const studyTimeHours = overview?.studyTimeHours ?? overview?.study_time_hours ?? 0;
    const dailyAverageMinutes = overview?.dailyAverageMinutes ?? overview?.daily_average_minutes ?? 0;

    // 2. Tính toán đường biểu đồ SVG từ chartData
    const renderChartPaths = () => {
        if (!chartData || chartData.length === 0) {
            // Placeholder đường sóng mặc định nếu chưa có dữ liệu 30 ngày
            return {
                exercisesPath: 'M 0,160 Q 70,120 150,110 T 300,50 T 400,130 T 500,90',
                scoresPath: 'M 0,120 Q 70,140 150,80 T 300,80 T 400,96 T 500,56',
                gradientPath: 'M 0,160 Q 70,120 150,110 T 300,50 T 400,130 T 500,90 L 500,200 L 0,200 Z',
                dateLabels: ['1', '5', '10', '15', '20', '25', '30'],
            };
        }

        const width = 500;
        const height = 180;
        const n = chartData.length;
        const stepX = width / Math.max(1, n - 1);

        // Max bài tập để scale
        const maxEx = Math.max(...chartData.map((d) => d.exerciseCount ?? d.exercise_count ?? d.exercises ?? 0), 10);

        const exPoints = chartData.map((d, i) => {
            const val = d.exerciseCount ?? d.exercise_count ?? d.exercises ?? 0;
            const x = Math.round(i * stepX);
            const y = Math.round(height - (val / maxEx) * (height - 30));
            return `${x},${y}`;
        });

        const scorePoints = chartData.map((d, i) => {
            const score = d.averageScore ?? d.average_score ?? d.score ?? 0; // thang 10
            const x = Math.round(i * stepX);
            const y = Math.round(height - (score / 10) * (height - 30));
            return `${x},${y}`;
        });

        const exercisesPath = `M ${exPoints.join(' L ')}`;
        const scoresPath = `M ${scorePoints.join(' L ')}`;
        const gradientPath = `M ${exPoints.join(' L ')} L ${width},${height} L 0,${height} Z`;

        // Lấy 7 mốc ngày đại diện
        const step = Math.max(1, Math.floor(n / 6));
        const dateLabels = chartData
            .filter((_, idx) => idx % step === 0 || idx === n - 1)
            .slice(0, 7)
            .map((d) => d.date?.slice(-5) || d.date || '');

        return { exercisesPath, scoresPath, gradientPath, dateLabels };
    };

    const chartRender = renderChartPaths();

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar Component */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header Component */}
                <Header />

                {/* Scrollable Dashboard Body */}
                <main className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8">
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
                                onClick={fetchDashboardData}
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
                                            <span className="text-sm font-semibold text-slate-500">/ 10</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                            <div
                                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, (Number(averageScore) / 10) * 100)}%` }}
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
                                            <span className="text-3xl font-black text-slate-950">{studyTimeHours}</span>
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
                                <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg">Thống kê hoạt động</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">Tương quan giữa số bài tập và điểm số</p>
                                        </div>
                                        <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                                            30 ngày gần nhất
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center gap-6 mb-4 px-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                                            Số bài tập đã làm
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                                            Điểm trung bình (thang 10)
                                        </div>
                                    </div>

                                    {/* Crisp Dynamic SVG Line Chart */}
                                    <div className="w-full h-64 relative">
                                        <div className="absolute inset-0 flex flex-col justify-between text-[11px] text-slate-400">
                                            {[40, 30, 20, 10, 0].map((val) => (
                                                <div key={val} className="w-full border-t border-dashed border-slate-200 flex justify-between relative">
                                                    <span className="absolute -left-6 -top-2">{val}</span>
                                                    <span className="absolute -right-6 -top-2">{val / 4}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <svg className="absolute inset-0 w-full h-full pb-6 px-6" preserveAspectRatio="none" viewBox="0 0 500 180">
                                            <defs>
                                                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                                                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path d={chartRender.gradientPath} fill="url(#blueGrad)" />
                                            <path
                                                d={chartRender.exercisesPath}
                                                fill="none"
                                                stroke="#2563eb"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d={chartRender.scoresPath}
                                                fill="none"
                                                stroke="#10b981"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                            />
                                        </svg>

                                        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[11px] font-semibold text-slate-400 px-6">
                                            {chartRender.dateLabels.map((label, idx) => (
                                                <span key={idx}>{label}</span>
                                            ))}
                                        </div>
                                    </div>
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
                                        <Link className="text-xs font-bold text-blue-600 hover:underline" href="/mock-test">
                                            Lịch sử thi →
                                        </Link>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between flex-1">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-bold text-slate-900 text-sm">
                                                    {overview?.recentMockTest?.title || 'SQL Mock Exam #01'}
                                                </h4>
                                                <span className="text-[11px] font-semibold text-slate-400">
                                                    {overview?.recentMockTest?.date || 'Hôm nay'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">
                                                {overview?.recentMockTest?.questionCount ?? 20} câu hỏi trắc nghiệm & thực hành • 30 phút
                                            </p>

                                            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                                                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Điểm</span>
                                                    <div className="text-base font-black text-blue-600 mt-0.5">
                                                        {overview?.recentMockTest?.score ?? '8.5'}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Thời gian</span>
                                                    <div className="text-base font-black text-slate-800 mt-0.5">
                                                        {overview?.recentMockTest?.duration ?? '25:30'}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Xếp hạng</span>
                                                    <div className="text-base font-black text-emerald-600 mt-0.5">
                                                        {overview?.recentMockTest?.ranking ?? 'Top 25%'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href="/mock-test"
                                            className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer block text-center"
                                        >
                                            Xem chi tiết kỳ thi
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
