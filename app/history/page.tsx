'use client';

import { useState, useMemo, useId } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import {
    MOCK_HISTORY_DATA,
    calculateHistoryStats,
    type MockTestHistoryItem,
    type HistoryFilterState,
    type TestStatus,
    type TestDifficulty,
} from './historyData';
import {
    Clock,
    Award,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    RefreshCw,
    Eye,
    Trophy,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    X,
    ArrowUpDown,
    Check,
    BookOpen,
    HelpCircle,
    SlidersHorizontal,
    FileCode2,
    Target,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

// Helper: Định dạng thời lượng giây sang "X phút Y giây" hoặc "X phút"
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins} phút`;
    return `${mins}p ${secs}s`;
}

// Badge màu cho danh mục (Category)
function getCategoryBadge(category: string) {
    switch (category) {
        case 'E-commerce':
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'University':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Hospital':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'Analytics':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Banking':
            return 'bg-teal-50 text-teal-700 border-teal-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
}

// Badge màu cho độ khó (Difficulty)
function getDifficultyBadge(diff: TestDifficulty) {
    switch (diff) {
        case 'Dễ':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'Trung bình':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Khó':
            return 'bg-rose-50 text-rose-700 border-rose-200';
    }
}

export default function MockTestHistoryPage() {
    // Dữ liệu danh sách & filters
    const [historyList] = useState<MockTestHistoryItem[]>(MOCK_HISTORY_DATA);
    const [filters, setFilters] = useState<HistoryFilterState>({
        searchTerm: '',
        status: 'all',
        difficulty: 'all',
        sortBy: 'newest',
    });

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedReviewItem, setSelectedReviewItem] = useState<MockTestHistoryItem | null>(null);

    // Tính toán chỉ số tổng quan (Top Metric Cards)
    const stats = useMemo(() => calculateHistoryStats(historyList), [historyList]);

    // Lọc và sắp xếp dữ liệu
    const filteredAndSortedList = useMemo(() => {
        let result = historyList.filter((item) => {
            // Lọc theo từ khóa tìm kiếm (tên đề thi hoặc chủ đề)
            const matchSearch =
                item.testTitle.toLowerCase().includes(filters.searchTerm.toLowerCase().trim()) ||
                item.category.toLowerCase().includes(filters.searchTerm.toLowerCase().trim());

            if (!matchSearch) return false;

            // Lọc theo trạng thái
            if (filters.status !== 'all') {
                if (filters.status === 'passed' && item.score < 60) return false;
                if (filters.status === 'failed' && (item.score >= 60 || item.status === 'timeout')) return false;
                if (filters.status === 'timeout' && item.status !== 'timeout') return false;
            }

            // Lọc theo độ khó
            if (filters.difficulty !== 'all' && item.difficulty !== filters.difficulty) {
                return false;
            }

            return true;
        });

        // Sắp xếp
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case 'newest':
                    return b.submittedTimestamp - a.submittedTimestamp;
                case 'oldest':
                    return a.submittedTimestamp - b.submittedTimestamp;
                case 'highest_score':
                    return b.score - a.score;
                case 'lowest_score':
                    return a.score - b.score;
                default:
                    return 0;
            }
        });

        return result;
    }, [historyList, filters]);

    // Phân trang
    const totalPages = Math.ceil(filteredAndSortedList.length / ITEMS_PER_PAGE) || 1;
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedList, currentPage]);

    // Xử lý khi filter thay đổi -> reset về trang 1
    const handleFilterChange = <K extends keyof HistoryFilterState>(key: K, value: HistoryFilterState[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    // Đặt lại toàn bộ bộ lọc
    const handleResetFilters = () => {
        setFilters({
            searchTerm: '',
            status: 'all',
            difficulty: 'all',
            sortBy: 'newest',
        });
        setCurrentPage(1);
    };

    const hasActiveFilters =
        filters.searchTerm !== '' ||
        filters.status !== 'all' ||
        filters.difficulty !== 'all' ||
        filters.sortBy !== 'newest';

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header */}
                <Header userName="Duy Hoàng" streakCount={7} />

                {/* Scrollable Body */}
                <main className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8">
                    {/* ================= A. Header Trang & Title ================= */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700">
                                    <Clock className="w-5 h-5" />
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    Lịch sử Thi thử
                                </h1>
                            </div>
                            <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
                                Lưu trữ toàn bộ kết quả, thống kê tiến độ học tập và xem chi tiết đáp án các lần thi thử SQL của bạn.
                            </p>
                        </div>

                        {/* Nút Khám phá đề mới */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="/mock-test"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-98"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>Làm bài thi mới</span>
                            </Link>
                        </div>
                    </div>

                    {/* ================= A2. Top Metric Cards (4 Cards) ================= */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                        {/* Card 1: Tổng số lượt thi */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Tổng số lượt thi
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="my-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-950">{stats.totalAttempts}</span>
                                    <span className="text-sm font-semibold text-slate-500">lần nộp bài</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                    <div
                                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (stats.totalAttempts / 20) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-blue-600">Mục tiêu: 20 bài</span>
                                <span className="text-slate-400 font-medium">Hoàn thành {stats.totalAttempts}/20</span>
                            </div>
                        </div>

                        {/* Card 2: Điểm trung bình */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Điểm trung bình
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                                    <Award className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="my-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-950">{stats.averageScore}</span>
                                    <span className="text-sm font-semibold text-slate-500">/ 100 điểm</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                    <div
                                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${stats.averageScore}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-purple-600">Xếp loại: {stats.ratingText}</span>
                                <span className="text-slate-400 font-medium">Thang điểm 100</span>
                            </div>
                        </div>

                        {/* Card 3: Tỷ lệ Đạt (Pass Rate) */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Tỷ lệ Đạt (Pass Rate)
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="my-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-950">{stats.passRate}%</span>
                                    <span className="text-sm font-semibold text-slate-500">
                                        ({stats.passCount}/{stats.totalAttempts} bài Đạt)
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${stats.passRate}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-emerald-600">Tiêu chuẩn: ≥ 60 điểm</span>
                                <span className="text-slate-400 font-medium">
                                    {stats.totalAttempts - stats.passCount} bài chưa đạt
                                </span>
                            </div>
                        </div>

                        {/* Card 4: Bài thi đạt điểm cao nhất */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Điểm cao nhất
                                </span>
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                                    <Trophy className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="my-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-950">{stats.bestScore}</span>
                                    <span className="text-sm font-semibold text-slate-500">/ 100 điểm</span>
                                </div>
                                <p className="text-xs font-medium text-slate-600 mt-2 line-clamp-1" title={stats.bestTestTitle}>
                                    Đề: {stats.bestTestTitle}
                                </p>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                                    <Target className="w-3.5 h-3.5" /> Thành tích kỷ lục
                                </span>
                                <span className="text-slate-400 font-medium">Tuyệt đối</span>
                            </div>
                        </div>
                    </div>

                    {/* ================= B. Thanh Bộ lọc & Tìm kiếm ================= */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                            {/* Ô tìm kiếm */}
                            <div className="md:col-span-5 relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên đề thi, chủ đề CSDL..."
                                    value={filters.searchTerm}
                                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                {filters.searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange('searchTerm', '')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown: Trạng thái */}
                            <div className="md:col-span-2">
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value as any)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="passed">Đạt (≥ 60%)</option>
                                    <option value="failed">Chưa đạt (&lt; 60%)</option>
                                    <option value="timeout">Hết giờ (Timeout)</option>
                                </select>
                            </div>

                            {/* Dropdown: Độ khó */}
                            <div className="md:col-span-2">
                                <select
                                    value={filters.difficulty}
                                    onChange={(e) => handleFilterChange('difficulty', e.target.value as any)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="all">Tất cả độ khó</option>
                                    <option value="Dễ">Độ khó: Dễ</option>
                                    <option value="Trung bình">Độ khó: Trung bình</option>
                                    <option value="Khó">Độ khó: Khó</option>
                                </select>
                            </div>

                            {/* Dropdown: Sắp xếp */}
                            <div className="md:col-span-3">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="newest">Sắp xếp: Mới nhất</option>
                                    <option value="oldest">Sắp xếp: Cũ nhất</option>
                                    <option value="highest_score">Sắp xếp: Điểm cao nhất</option>
                                    <option value="lowest_score">Sắp xếp: Điểm thấp nhất</option>
                                </select>
                            </div>
                        </div>

                        {/* Thanh thông tin & Nút Reset */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                                <span>
                                    Tìm thấy <strong className="text-slate-800">{filteredAndSortedList.length}</strong> bài thi
                                    {hasActiveFilters && ' (đang lọc)'}
                                </span>
                            </div>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Đặt lại bộ lọc</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ================= C. Bảng / Danh sách Lịch sử thi ================= */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        {paginatedItems.length === 0 ? (
                            /* ================= D. Empty State ================= */
                            <div className="py-16 px-6 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    Không tìm thấy bài thi phù hợp
                                </h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    {hasActiveFilters
                                        ? 'Không có kết quả nào trùng khớp với bộ lọc hiện tại. Hãy thử tìm từ khóa khác hoặc xóa bộ lọc.'
                                        : 'Bạn chưa tham gia bài thi thử nào. Hãy bắt đầu thử sức với các bài thi SQL ngay hôm nay!'}
                                </p>
                                {hasActiveFilters ? (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Xóa toàn bộ bộ lọc</span>
                                    </button>
                                ) : (
                                    <Link
                                        href="/mock-test"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        <span>Khám phá phòng thi ngay</span>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View (Hidden on mobile/tablet screens) */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                <th className="py-4 px-6">Tên đề thi & Chủ đề</th>
                                                <th className="py-4 px-4 text-center">Độ khó</th>
                                                <th className="py-4 px-4">Thời gian nộp bài</th>
                                                <th className="py-4 px-4">Thời gian làm</th>
                                                <th className="py-4 px-4 text-center">Số câu đúng</th>
                                                <th className="py-4 px-4 text-center">Điểm số & Trạng thái</th>
                                                <th className="py-4 px-6 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {paginatedItems.map((item) => {
                                                const isPassed = item.score >= 60;
                                                const isTimeout = item.status === 'timeout';

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className="hover:bg-slate-50/70 transition-colors group"
                                                    >
                                                        {/* Tên đề thi & Tag chủ đề */}
                                                        <td className="py-4 px-6 max-w-xs">
                                                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                                {item.testTitle}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadge(
                                                                        item.category
                                                                    )}`}
                                                                >
                                                                    {item.category}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400 font-mono">
                                                                    #{item.id}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Độ khó */}
                                                        <td className="py-4 px-4 text-center">
                                                            <span
                                                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getDifficultyBadge(
                                                                    item.difficulty
                                                                )}`}
                                                            >
                                                                {item.difficulty}
                                                            </span>
                                                        </td>

                                                        {/* Thời gian nộp bài */}
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                <span>{item.submittedAt}</span>
                                                            </div>
                                                        </td>

                                                        {/* Thời gian làm bài */}
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                                <Clock className="w-4 h-4 text-slate-400" />
                                                                <span className="font-semibold text-slate-800">
                                                                    {formatDuration(item.timeSpentSeconds)}
                                                                </span>
                                                                <span className="text-slate-400 text-xs">
                                                                    / {item.durationMinutes}p
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Kết quả câu đúng */}
                                                        <td className="py-4 px-4 text-center">
                                                            <div className="font-bold text-slate-800">
                                                                {item.correctAnswers} / {item.totalQuestions}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 font-medium">
                                                                {Math.round((item.correctAnswers / item.totalQuestions) * 100)}% chính xác
                                                            </div>
                                                        </td>

                                                        {/* Điểm số & Badge trạng thái */}
                                                        <td className="py-4 px-4 text-center">
                                                            <div className="inline-flex flex-col items-center gap-1">
                                                                <span
                                                                    className={`text-base font-black ${
                                                                        isPassed ? 'text-emerald-600' : 'text-rose-600'
                                                                    }`}
                                                                >
                                                                    {item.score}
                                                                    <span className="text-xs font-medium text-slate-400">
                                                                        /100
                                                                    </span>
                                                                </span>

                                                                {/* Status Badge */}
                                                                {isTimeout ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                                        <AlertTriangle className="w-3 h-3" /> Hết giờ
                                                                    </span>
                                                                ) : isPassed ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                        <CheckCircle2 className="w-3 h-3" /> Đạt
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                                        <XCircle className="w-3 h-3" /> Chưa đạt
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Action Buttons */}
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedReviewItem(item)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                                                    title="Xem chi tiết câu trả lời & lời giải"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    <span>Chi tiết</span>
                                                                </button>
                                                                <Link
                                                                    href={`/mock-test/${item.testId}`}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                                                    title="Thi lại bài này"
                                                                >
                                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                                    <span>Thi lại</span>
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile/Tablet Card View (Displayed when < 1024px) */}
                                <div className="block lg:hidden divide-y divide-slate-100 p-4 space-y-4">
                                    {paginatedItems.map((item) => {
                                        const isPassed = item.score >= 60;
                                        const isTimeout = item.status === 'timeout';

                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/80 space-y-3"
                                            >
                                                {/* Header row: Title + Score */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-base leading-snug">
                                                            {item.testTitle}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadge(
                                                                    item.category
                                                                )}`}
                                                            >
                                                                {item.category}
                                                            </span>
                                                            <span
                                                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getDifficultyBadge(
                                                                    item.difficulty
                                                                )}`}
                                                            >
                                                                {item.difficulty}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <div
                                                            className={`text-xl font-black ${
                                                                isPassed ? 'text-emerald-600' : 'text-rose-600'
                                                            }`}
                                                        >
                                                            {item.score}
                                                            <span className="text-xs font-medium text-slate-400">
                                                                /100
                                                            </span>
                                                        </div>
                                                        {isTimeout ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 mt-1">
                                                                <AlertTriangle className="w-3 h-3" /> Hết giờ
                                                            </span>
                                                        ) : isPassed ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                                                                <CheckCircle2 className="w-3 h-3" /> Đạt
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 mt-1">
                                                                <XCircle className="w-3 h-3" /> Chưa đạt
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Meta stats grid */}
                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/60">
                                                    <div>
                                                        <span className="text-slate-400 block text-[11px]">Nộp bài</span>
                                                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {item.submittedAt}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block text-[11px]">Thời gian làm</span>
                                                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            {formatDuration(item.timeSpentSeconds)} / {item.durationMinutes}p
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 pt-1 border-t border-slate-100 flex justify-between items-center">
                                                        <span className="text-slate-500">Số câu trả lời đúng:</span>
                                                        <span className="font-bold text-slate-900">
                                                            {item.correctAnswers}/{item.totalQuestions} câu (
                                                            {Math.round((item.correctAnswers / item.totalQuestions) * 100)}%)
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Mobile Actions */}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedReviewItem(item)}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>Xem chi tiết</span>
                                                    </button>
                                                    <Link
                                                        href={`/mock-test/${item.testId}`}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                        <span>Thi lại</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* ================= D. Pagination ================= */}
                        {filteredAndSortedList.length > 0 && (
                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs sm:text-sm text-slate-500">
                                    Hiển thị{' '}
                                    <strong className="text-slate-800">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                    </strong>{' '}
                                    -{' '}
                                    <strong className="text-slate-800">
                                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedList.length)}
                                    </strong>{' '}
                                    trong tổng số{' '}
                                    <strong className="text-slate-800">{filteredAndSortedList.length}</strong> bài thi
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {/* Nút Trước */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Trang trước"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {/* Số trang */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                                currentPage === pageNum
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    {/* Nút Sau */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Trang kế tiếp"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* ================= Modal Xem Chi Tiết Lời Giải ================= */}
            {selectedReviewItem && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadge(
                                            selectedReviewItem.category
                                        )}`}
                                    >
                                        {selectedReviewItem.category}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400">
                                        Mã bài: #{selectedReviewItem.id}
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mt-1">
                                    {selectedReviewItem.testTitle}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedReviewItem(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Stats Bar */}
                        <div className="px-6 py-3.5 bg-blue-50/40 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Điểm đạt được</span>
                                    <span
                                        className={`font-black text-base ${
                                            selectedReviewItem.score >= 60 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                    >
                                        {selectedReviewItem.score} / 100 điểm
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Kết quả đúng</span>
                                    <span className="font-bold text-slate-800 text-base">
                                        {selectedReviewItem.correctAnswers} / {selectedReviewItem.totalQuestions} câu
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Thời gian làm</span>
                                    <span className="font-semibold text-slate-700">
                                        {formatDuration(selectedReviewItem.timeSpentSeconds)} (Hạn:{' '}
                                        {selectedReviewItem.durationMinutes}p)
                                    </span>
                                </div>
                            </div>

                            <div>
                                {selectedReviewItem.status === 'timeout' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Hết giờ nộp bài
                                    </span>
                                ) : selectedReviewItem.score >= 60 ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Đạt yêu cầu
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        <XCircle className="w-3.5 h-3.5" /> Chưa đạt
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Modal Questions Review Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <div className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <FileCode2 className="w-4 h-4 text-blue-600" />
                                <span>Chi tiết từng câu hỏi &amp; Lời giải</span>
                            </div>

                            <div className="space-y-4">
                                {selectedReviewItem.questionsReview.map((q, idx) => (
                                    <div
                                        key={q.questionId}
                                        className={`rounded-xl border p-5 transition-all ${
                                            q.isCorrect
                                                ? 'bg-emerald-50/20 border-emerald-200/80'
                                                : 'bg-rose-50/20 border-rose-200/80'
                                        }`}
                                    >
                                        {/* Câu số & Trạng thái */}
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-500 uppercase">
                                                    {q.type === 'sql_query' ? 'Truy vấn SQL' : 'Trắc nghiệm'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-600">
                                                    {q.points} / {q.maxPoints} điểm
                                                </span>
                                                {q.isCorrect ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <Check className="w-3 h-3" /> Đúng
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                                        <X className="w-3 h-3" /> Sai
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Nội dung câu hỏi */}
                                        <p className="font-semibold text-slate-900 text-sm mb-3">
                                            {q.questionText}
                                        </p>

                                        {/* Câu trả lời của học viên */}
                                        <div className="mb-3">
                                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                                                Câu trả lời của bạn:
                                            </span>
                                            <div
                                                className={`p-3 rounded-lg text-xs font-mono whitespace-pre-wrap ${
                                                    q.isCorrect
                                                        ? 'bg-white border border-emerald-200 text-slate-800'
                                                        : 'bg-white border border-rose-200 text-rose-700'
                                                }`}
                                            >
                                                {q.userAnswer || '(Không có câu trả lời)'}
                                            </div>
                                        </div>

                                        {/* Đáp án mẫu chuẩn */}
                                        <div className="mb-3">
                                            <span className="text-xs font-bold text-emerald-700 uppercase block mb-1">
                                                Đáp án chính xác:
                                            </span>
                                            <div className="p-3 rounded-lg text-xs font-mono bg-slate-900 text-emerald-400 whitespace-pre-wrap">
                                                {q.solutionAnswer}
                                            </div>
                                        </div>

                                        {/* Giải thích chi tiết */}
                                        {q.explanation && (
                                            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2">
                                                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <strong className="font-semibold">Giải thích chi tiết: </strong>
                                                    {q.explanation}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedReviewItem(null)}
                                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
                            >
                                Đóng
                            </button>

                            <Link
                                href={`/mock-test/${selectedReviewItem.testId}`}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-xs"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Làm lại đề thi này</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
