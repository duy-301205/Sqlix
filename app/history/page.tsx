'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import historyService, {
    HistorySummary,
    HistoryItem,
    HistoryDetail,
} from '@/services/historyService';
import {
    Clock,
    Award,
    CheckCircle2,
    XCircle,
    Search,
    RefreshCw,
    Eye,
    Trophy,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    X,
    Check,
    BookOpen,
    HelpCircle,
    SlidersHorizontal,
    FileCode2,
    Target,
    Trash2,
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

// Helper: Định dạng thời lượng giây sang "X phút Y giây"
function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0 phút';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins} phút`;
    return `${mins}p ${secs}s`;
}

// Helper: Chuẩn hóa hiển thị thời gian nộp bài
function formatSubmittedAt(dateStr: string): string {
    if (!dateStr) return 'Vừa xong';
    if (dateStr.includes('/') || dateStr.includes('-') && dateStr.includes(':')) {
        // Đã là chuỗi định dạng sẵn
        if (!dateStr.includes('T')) return dateStr;
    }
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${hours}:${mins} - ${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
}

// Badge màu cho danh mục (Category)
function getCategoryBadge(category: string | undefined) {
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
function getDifficultyBadge(diff: string | undefined) {
    const d = (diff || '').toLowerCase();
    if (d.includes('dễ') || d.includes('easy')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (d.includes('khó') || d.includes('hard') || d.includes('nâng cao')) {
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
}

export default function MockTestHistoryPage() {
    const [mounted, setMounted] = useState(false);

    // ================= State Dữ liệu API =================
    const [summary, setSummary] = useState<HistorySummary | null>(null);
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
    const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);

    // ================= State Bộ lọc & Phân trang =================
    const [keyword, setKeyword] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [currentPage, setCurrentPage] = useState<number>(1);

    // ================= State Modal & Toast =================
    const [selectedReviewItem, setSelectedReviewItem] = useState<HistoryDetail | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
    const [sessionToDelete, setSessionToDelete] = useState<HistoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper hiển thị Toast tự tắt sau 3.5s
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage({ message, type });
        toastTimeoutRef.current = setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    }, []);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, []);

    // 1. Tải 4 chỉ số thống kê tổng quan (Top Metrics)
    const fetchSummary = useCallback(async () => {
        setIsLoadingSummary(true);
        try {
            const data = await historyService.getHistorySummary();
            if (data && (data.totalTestsTaken !== undefined || data.averageScore !== undefined)) {
                setSummary(data);
            } else {
                setSummary({
                    totalTestsTaken: 0,
                    averageScore: 0,
                    highestScore: 0,
                    passRatePercentage: 0,
                });
            }
        } catch (err: any) {
            console.error('[History] Lỗi khi tải dữ liệu thống kê:', err);
            setSummary({
                totalTestsTaken: 0,
                averageScore: 0,
                highestScore: 0,
                passRatePercentage: 0,
            });
        } finally {
            setIsLoadingSummary(false);
        }
    }, []);

    // 2. Tải danh sách lịch sử thi có bộ lọc & phân trang
    const fetchHistoryList = useCallback(async () => {
        setIsLoadingList(true);
        try {
            // Chuyển đổi status sang định dạng API mong muốn
            let apiStatus: string | undefined = undefined;
            if (statusFilter === 'passed') apiStatus = 'PASSED';
            else if (statusFilter === 'failed') apiStatus = 'FAILED';
            else if (statusFilter === 'timeout') apiStatus = 'TIMEOUT';

            // Chuyển đổi sortBy và sortDirection
            let apiSortBy = 'submittedAt';
            let sortDirection: 'ASC' | 'DESC' = 'DESC';
            if (sortBy === 'oldest') {
                apiSortBy = 'submittedAt';
                sortDirection = 'ASC';
            } else if (sortBy === 'highest_score') {
                apiSortBy = 'score';
                sortDirection = 'DESC';
            } else if (sortBy === 'lowest_score') {
                apiSortBy = 'score';
                sortDirection = 'ASC';
            }

            const res = await historyService.getHistoryList({
                keyword: keyword.trim() || undefined,
                status: apiStatus,
                difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
                sortBy: apiSortBy,
                sortDirection,
                page: Math.max(0, currentPage - 1),
                size: ITEMS_PER_PAGE,
            });

            if (res && Array.isArray(res.items)) {
                setHistoryItems(res.items);
                setTotalItems(res.total ?? res.items.length);
                setTotalPages(res.totalPages ?? Math.max(1, Math.ceil((res.total ?? res.items.length) / ITEMS_PER_PAGE)));
            } else {
                setHistoryItems([]);
                setTotalItems(0);
                setTotalPages(1);
            }
        } catch (err: any) {
            console.error('[History] Lỗi nạp lịch sử thi từ máy chủ:', err);
            setHistoryItems([]);
            setTotalItems(0);
            setTotalPages(1);
        } finally {
            setIsLoadingList(false);
        }
    }, [keyword, statusFilter, difficultyFilter, sortBy, currentPage]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        fetchHistoryList();
    }, [fetchHistoryList]);

    // 3. Xử lý xem chi tiết bài thi cũ
    const handleViewDetail = async (item: HistoryItem) => {
        setIsLoadingDetail(true);
        try {
            const detail = await historyService.getHistoryDetail(item.sessionId);
            setSelectedReviewItem(detail);
        } catch (err: any) {
            console.warn('[History] Không thể tải chi tiết phiên thi từ API, hiển thị thông tin sẵn có:', err.message);
            setSelectedReviewItem({
                sessionId: item.sessionId,
                testId: item.testId,
                testTitle: item.testTitle,
                category: item.category || 'SQL Database',
                difficulty: item.difficulty,
                score: item.score,
                isPassed: item.isPassed,
                submittedAt: item.submittedAt,
                durationSeconds: item.durationSeconds || item.timeSpentSeconds || 0,
                timeSpentSeconds: item.timeSpentSeconds || item.durationSeconds || 0,
                durationMinutes: item.durationMinutes || 20,
                correctCount: item.correctCount || item.correctAnswers || 0,
                correctAnswers: item.correctAnswers || item.correctCount || 0,
                totalQuestions: item.totalQuestions || 5,
                status: item.status,
                questions: (item as any).questionsReview || [],
                questionsReview: (item as any).questionsReview || [],
            });
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // 4. Xử lý xóa lịch sử bài thi
    const handleConfirmDelete = async () => {
        if (!sessionToDelete) return;
        setIsDeleting(true);

        try {
            await historyService.deleteHistorySession(sessionToDelete.sessionId);
            showToast(`Đã xóa kết quả phiên thi "${sessionToDelete.testTitle}" thành công!`, 'success');
            setSessionToDelete(null);

            // Tải lại danh sách & thống kê
            await Promise.all([fetchHistoryList(), fetchSummary()]);
        } catch (err: any) {
            console.error('[History] Lỗi khi xóa phiên thi:', err);
            // Fallback khi offline: loại bỏ item khỏi danh sách state hiện tại
            setHistoryItems((prev) => prev.filter((i) => i.sessionId !== sessionToDelete.sessionId));
            setTotalItems((prev) => Math.max(0, prev - 1));
            showToast('Đã xóa phiên thi khỏi lịch sử.', 'success');
            setSessionToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    // Đặt lại toàn bộ bộ lọc
    const handleResetFilters = () => {
        setKeyword('');
        setStatusFilter('all');
        setDifficultyFilter('all');
        setSortBy('newest');
        setCurrentPage(1);
    };

    const hasActiveFilters =
        keyword !== '' || statusFilter !== 'all' || difficultyFilter !== 'all' || sortBy !== 'newest';

    if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

    // Dữ liệu hiển thị thống kê 4 thẻ
    const totalAttempts = summary?.totalTestsTaken ?? 0;
    const avgScore = Math.round(summary?.averageScore ?? 0);
    const passRate = Math.round(summary?.passRatePercentage ?? 0);
    const bestScore = summary?.highestScore ?? 0;

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans" suppressHydrationWarning>
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" suppressHydrationWarning>
                {/* Header */}
                <Header userName="Duy Hoàng" streakCount={7} />

                {/* Scrollable Body */}
                <main className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 py-6 w-full max-w-[1500px] mx-auto space-y-6">
                    {/* Header Trang */}
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700">
                                <Clock className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Lịch sử Thi thử
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                            Lưu trữ toàn bộ kết quả, thống kê tiến độ học tập và xem chi tiết đáp án các lần thi thử SQL của bạn.
                        </p>
                    </div>

                    {/* ================= 4 Thẻ Thống kê (Top Metrics) ================= */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* Card 1: Tổng số lượt thi */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Tổng số lượt thi
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="my-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900">{totalAttempts}</span>
                                    <span className="text-xs font-semibold text-slate-500">lần nộp bài</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5">
                                    <div
                                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (totalAttempts / 20) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-500">
                                <span className="font-semibold text-blue-600">Đã tích lũy kinh nghiệm</span>
                                <span>Thực tế</span>
                            </div>
                        </div>

                        {/* Card 2: Điểm trung bình */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Điểm trung bình
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                                    <Award className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="my-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900">{avgScore}</span>
                                    <span className="text-xs font-semibold text-slate-500">/ 100 điểm</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5">
                                    <div
                                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${avgScore}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-semibold text-purple-600">
                                    {avgScore >= 80 ? 'Xếp loại: Xuất sắc' : avgScore >= 60 ? 'Xếp loại: Đạt chuẩn' : 'Cần cố gắng'}
                                </span>
                                <span className="text-slate-400 font-medium">Thang 100</span>
                            </div>
                        </div>

                        {/* Card 3: Tỷ lệ Đạt (Pass Rate) */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Tỷ lệ Đạt (Pass Rate)
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="my-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-emerald-600">{passRate}%</span>
                                    <span className="text-xs font-semibold text-slate-500">tổng số bài thi</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${passRate}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="font-semibold text-emerald-600">Tiêu chuẩn: ≥ 60 điểm</span>
                                <span className="text-slate-400 font-medium">Qua môn</span>
                            </div>
                        </div>

                        {/* Card 4: Điểm cao nhất */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Điểm cao nhất
                                </span>
                                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                                    <Trophy className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="my-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900">{bestScore}</span>
                                    <span className="text-xs font-semibold text-slate-500">/ 100 điểm</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5">
                                    <div
                                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${bestScore}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                                    <Target className="w-3 h-3" /> Thành tích kỷ lục
                                </span>
                                <span className="text-slate-400 font-medium">Cao nhất</span>
                            </div>
                        </div>
                    </div>

                    {/* ================= Thanh Bộ lọc & Tìm kiếm ================= */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            {/* Ô tìm kiếm */}
                            <div className="md:col-span-5 relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên bài thi, chủ đề CSDL..."
                                    value={keyword}
                                    onChange={(e) => {
                                        setKeyword(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                                {keyword && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setKeyword('');
                                            setCurrentPage(1);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown: Trạng thái */}
                            <div className="md:col-span-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
                                    value={difficultyFilter}
                                    onChange={(e) => {
                                        setDifficultyFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
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
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="newest">Sắp xếp: Mới nhất</option>
                                    <option value="oldest">Sắp xếp: Cũ nhất</option>
                                    <option value="highest_score">Sắp xếp: Điểm cao nhất</option>
                                    <option value="lowest_score">Sắp xếp: Điểm thấp nhất</option>
                                </select>
                            </div>
                        </div>

                        {/* Thanh thông tin số lượng & Đặt lại bộ lọc */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                    Tìm thấy <strong className="text-slate-800">{totalItems}</strong> bài thi
                                    {hasActiveFilters && ' (đang áp dụng lọc)'}
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

                    {/* ================= Bảng Danh sách Lịch sử ================= */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        {isLoadingList ? (
                            <div className="p-8 space-y-4 animate-pulse">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-16 bg-slate-100 rounded-xl" />
                                ))}
                            </div>
                        ) : historyItems.length === 0 ? (
                            /* Empty State */
                            <div className="py-16 px-6 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
                                    <Search className="w-6 h-6 text-blue-500" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">
                                    Không tìm thấy bài thi phù hợp
                                </h3>
                                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                                    {hasActiveFilters
                                        ? 'Không có kết quả nào trùng khớp với bộ lọc hiện tại. Hãy thử từ khóa khác hoặc xóa bộ lọc.'
                                        : 'Bạn chưa có lượt thi thử nào. Hãy chọn một bài thi để kiểm tra kiến thức SQL ngay nhé!'}
                                </p>
                                {hasActiveFilters ? (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Xóa toàn bộ bộ lọc</span>
                                    </button>
                                ) : (
                                    <Link
                                        href="/mock-tests"
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        <span>Khám phá phòng thi ngay</span>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                <th className="py-3.5 px-6">Tên đề thi & Chủ đề</th>
                                                <th className="py-3.5 px-4 text-center">Độ khó</th>
                                                <th className="py-3.5 px-4">Thời gian nộp bài</th>
                                                <th className="py-3.5 px-4">Thời gian làm</th>
                                                <th className="py-3.5 px-4 text-center">Số câu đúng</th>
                                                <th className="py-3.5 px-4 text-center">Điểm số & Trạng thái</th>
                                                <th className="py-3.5 px-6 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                            {historyItems.map((item) => {
                                                const isPassed = item.isPassed || item.score >= 60;
                                                const isTimeout =
                                                    item.status === 'timeout' || item.status === 'TIMEOUT';
                                                const timeSpent = item.timeSpentSeconds || item.durationSeconds || 0;
                                                const correct = item.correctCount ?? item.correctAnswers ?? 0;
                                                const totalQ = item.totalQuestions || 5;

                                                return (
                                                    <tr key={item.sessionId || item.id} className="hover:bg-slate-50/70 transition-colors group">
                                                        {/* Tên đề thi & Tag chủ đề */}
                                                        <td className="py-4 px-6 max-w-xs">
                                                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                                {item.testTitle}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoryBadge(item.category)}`}>
                                                                    {item.category || 'Database'}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400 font-mono">
                                                                    #{item.sessionId?.slice(0, 10)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Độ khó */}
                                                        <td className="py-4 px-4 text-center">
                                                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold border ${getDifficultyBadge(item.difficulty)}`}>
                                                                {item.difficulty}
                                                            </span>
                                                        </td>

                                                        {/* Thời gian nộp bài */}
                                                        <td className="py-4 px-4 text-slate-600">
                                                            <div className="flex items-center gap-1.5 font-medium">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{formatSubmittedAt(item.submittedAt)}</span>
                                                            </div>
                                                        </td>

                                                        {/* Thời gian làm bài */}
                                                        <td className="py-4 px-4 text-slate-600">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                <span className="font-semibold text-slate-800">
                                                                    {formatDuration(timeSpent)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Kết quả câu đúng */}
                                                        <td className="py-4 px-4 text-center">
                                                            <div className="font-bold text-slate-800">
                                                                {correct} / {totalQ}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 font-medium">
                                                                {Math.round((correct / (totalQ || 1)) * 100)}% chính xác
                                                            </div>
                                                        </td>

                                                        {/* Điểm số & Badge trạng thái */}
                                                        <td className="py-4 px-4 text-center">
                                                            <div className="inline-flex flex-col items-center gap-1">
                                                                <span className={`text-base font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {item.score}
                                                                    <span className="text-xs font-medium text-slate-400">/100</span>
                                                                </span>

                                                                {isTimeout ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                                        <AlertTriangle className="w-3 h-3" /> Hết giờ
                                                                    </span>
                                                                ) : isPassed ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                        <CheckCircle2 className="w-3 h-3" /> Đạt
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                                        <XCircle className="w-3 h-3" /> Chưa đạt
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Action Buttons */}
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleViewDetail(item)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                                                    title="Xem chi tiết câu trả lời & lời giải"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    <span>Chi tiết</span>
                                                                </button>

                                                                <Link
                                                                    href={`/mock-tests/${item.testId}`}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                                                    title="Thi lại đề thi này"
                                                                >
                                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                                    <span>Thi lại</span>
                                                                </Link>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSessionToDelete(item)}
                                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                                    title="Xóa phiên thi này khỏi lịch sử"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile/Tablet Card View */}
                                <div className="block lg:hidden divide-y divide-slate-100 p-4 space-y-4">
                                    {historyItems.map((item) => {
                                        const isPassed = item.isPassed || item.score >= 60;
                                        const isTimeout =
                                            item.status === 'timeout' || item.status === 'TIMEOUT';
                                        const timeSpent = item.timeSpentSeconds || item.durationSeconds || 0;
                                        const correct = item.correctCount ?? item.correctAnswers ?? 0;
                                        const totalQ = item.totalQuestions || 5;

                                        return (
                                            <div key={item.sessionId || item.id} className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/80 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                                                            {item.testTitle}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadge(item.category)}`}>
                                                                {item.category || 'Database'}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getDifficultyBadge(item.difficulty)}`}>
                                                                {item.difficulty}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <div className={`text-lg font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {item.score}
                                                            <span className="text-xs font-medium text-slate-400">/100</span>
                                                        </div>
                                                        {isTimeout ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 mt-1">
                                                                Hết giờ
                                                            </span>
                                                        ) : isPassed ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                                                                Đạt
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 mt-1">
                                                                Chưa đạt
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px]">Nộp bài</span>
                                                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                            {formatSubmittedAt(item.submittedAt)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px]">Thời gian làm</span>
                                                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                            {formatDuration(timeSpent)}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2 pt-1 border-t border-slate-100 flex justify-between items-center text-[11px]">
                                                        <span className="text-slate-500">Số câu đúng:</span>
                                                        <span className="font-bold text-slate-900">
                                                            {correct}/{totalQ} câu ({Math.round((correct / (totalQ || 1)) * 100)}%)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDetail(item)}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>Chi tiết</span>
                                                    </button>
                                                    <Link
                                                        href={`/mock-tests/${item.testId}`}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                        <span>Thi lại</span>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSessionToDelete(item)}
                                                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Pagination Footer */}
                        {totalItems > 0 && (
                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-slate-500">
                                    Hiển thị{' '}
                                    <strong className="text-slate-800">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                    </strong>{' '}
                                    -{' '}
                                    <strong className="text-slate-800">
                                        {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                                    </strong>{' '}
                                    trong tổng số <strong className="text-slate-800">{totalItems}</strong> bài thi
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        title="Trang trước"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                currentPage === pageNum
                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoryBadge(selectedReviewItem.category)}`}>
                                        {selectedReviewItem.category || 'Database'}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400">
                                        Mã bài: #{selectedReviewItem.sessionId?.slice(0, 10)}
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mt-1">
                                    {selectedReviewItem.testTitle}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedReviewItem(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Stats Bar */}
                        <div className="px-6 py-3.5 bg-blue-50/40 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Điểm đạt được</span>
                                    <span className={`font-black text-base ${selectedReviewItem.score >= 60 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {selectedReviewItem.score} / 100 điểm
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Kết quả đúng</span>
                                    <span className="font-bold text-slate-800 text-base">
                                        {selectedReviewItem.correctCount ?? selectedReviewItem.correctAnswers ?? 0} / {selectedReviewItem.totalQuestions} câu
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <span className="text-slate-500 block text-[11px]">Thời gian làm</span>
                                    <span className="font-semibold text-slate-700">
                                        {formatDuration(selectedReviewItem.durationSeconds || selectedReviewItem.timeSpentSeconds || 0)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                {selectedReviewItem.status === 'timeout' || selectedReviewItem.status === 'TIMEOUT' ? (
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

                        {/* Modal Questions Review Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <FileCode2 className="w-4 h-4 text-blue-600" />
                                <span>Chi tiết từng câu hỏi &amp; Lời giải</span>
                            </div>

                            {isLoadingDetail ? (
                                <div className="space-y-4 animate-pulse">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-32 bg-slate-100 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(selectedReviewItem.questions || selectedReviewItem.questionsReview || []).map((q, idx) => (
                                        <div
                                            key={q.questionId || idx}
                                            className={`rounded-xl border p-5 transition-all ${
                                                q.isCorrect ? 'bg-emerald-50/20 border-emerald-200/80' : 'bg-rose-50/20 border-rose-200/80'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500 uppercase">
                                                        {q.type === 'sql_query' || q.type === 'SQL' ? 'Truy vấn SQL' : 'Trắc nghiệm'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {q.points} / {q.maxPoints || q.points || 20} điểm
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

                                            <p className="font-semibold text-slate-900 text-xs sm:text-sm mb-3">
                                                {q.questionText}
                                            </p>

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

                                            <div className="mb-3">
                                                <span className="text-xs font-bold text-emerald-700 uppercase block mb-1">
                                                    Đáp án chính xác:
                                                </span>
                                                <div className="p-3 rounded-lg text-xs font-mono bg-slate-900 text-emerald-400 whitespace-pre-wrap">
                                                    {q.solutionAnswer}
                                                </div>
                                            </div>

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
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedReviewItem(null)}
                                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                            >
                                Đóng
                            </button>

                            <Link
                                href={`/mock-tests/${selectedReviewItem.testId}`}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Làm lại đề thi này</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= Modal Xác nhận Xóa phiên thi ================= */}
            {sessionToDelete && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <div className="text-center space-y-1.5">
                            <h3 className="text-lg font-black text-slate-900">
                                Xác nhận xóa lịch sử thi?
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                                Bạn có chắc chắn muốn xóa bài thi <strong className="text-slate-800 font-semibold">{sessionToDelete.testTitle}</strong> khỏi lịch sử cá nhân? Hành động này không thể hoàn tác.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setSessionToDelete(null)}
                                disabled={isDeleting}
                                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className={`w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                                    isDeleting ? 'opacity-70 cursor-wait' : ''
                                }`}
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang xóa...</span>
                                    </>
                                ) : (
                                    <span>Xóa vĩnh viễn</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= Toast Notification Container ================= */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold border ${
                            toastMessage.type === 'success'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                                : toastMessage.type === 'error'
                                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                                : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'
                        }`}
                    >
                        <span>{toastMessage.message}</span>
                        <button
                            type="button"
                            onClick={() => setToastMessage(null)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
