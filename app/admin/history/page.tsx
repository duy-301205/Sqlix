'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import adminHistoryService, {
    AdminHistoryItem,
    AdminHistoryFilterParams,
    AdminHistoryPagination,
} from '@/services/adminHistoryService';
import adminMockTestService from '@/services/adminMockTestService';

interface ToastState {
    message: string;
    type: 'success' | 'error';
}

// Chuẩn hóa một bản ghi phiên thi từ Backend hoặc Mock
const normalizeHistoryItem = (
    item: any,
    index: number,
    matchedTest?: { maxScore?: number; totalQuestions?: number }
): AdminHistoryItem => {
    const rawScore = Number(item.score ?? 0);
    const calculatedMaxScore = Number(
        item.maxScore ??
        matchedTest?.maxScore ??
        (rawScore > 10 ? 100 : 100)
    );
    const calculatedTotalQuestions = Number(
        item.totalQuestionsCount ??
        item.totalQuestions ??
        matchedTest?.totalQuestions ??
        10
    );
    const rawPassed =
        item.isPassed !== undefined
            ? Boolean(item.isPassed)
            : rawScore >= calculatedMaxScore * 0.6;

    return {
        id: String(item.id || item.sessionId || `sess-${index + 1}`),
        sessionId: String(item.sessionId || item.id || `sess-${index + 1}`),
        userId: String(item.userId || `usr-${index + 1}`),
        username: item.username || item.userName || `user_${index + 1}`,
        fullName: item.fullName || item.userName || `Thí sinh ${index + 1}`,
        userAvatar:
            item.userAvatar ||
            item.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        userEmail: item.userEmail || item.email || `${item.username || 'user'}@gmail.com`,
        mockTestId: item.mockTestId || item.testId || 'test-1',
        testTitle: item.testTitle || item.mockTestTitle || 'Đề thi thử SQL',
        score: rawScore,
        maxScore: calculatedMaxScore,
        passingScore: item.passingScore !== undefined ? Number(item.passingScore) : Math.round(calculatedMaxScore * 0.6),
        isPassed: rawPassed,
        status: item.status || 'COMPLETED',
        durationSeconds: Number(item.durationSeconds ?? 1800),
        correctAnswersCount: Number(item.correctAnswersCount ?? item.correctCount ?? 8),
        totalQuestions: calculatedTotalQuestions,
        totalQuestionsCount: calculatedTotalQuestions,
        startedAt: item.startedAt || new Date(Date.now() - 3600000).toISOString(),
        submittedAt: item.submittedAt || new Date().toISOString(),
    };
};

export default function AdminHistoryPage() {
    // ================= State Management =================
    const [histories, setHistories] = useState<AdminHistoryItem[]>([]);
    const [mockTestsList, setMockTestsList] = useState<{ id: string; title: string }[]>([]);
    const testsMapRef = useRef<Map<string, { maxScore?: number; totalQuestions?: number }>>(new Map());
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // Toast State
    const [toast, setToast] = useState<ToastState | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type });
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
        }, 3500);
    }, []);

    // Pagination State (Backend 0-indexed)
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [pagination, setPagination] = useState<AdminHistoryPagination>({
        total: 0,
        page: 0,
        size: 10,
        totalPages: 1,
    });

    // Advanced Filters State
    const [keyword, setKeyword] = useState<string>('');
    const [selectedTestId, setSelectedTestId] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isPassedFilter, setIsPassedFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [minScore, setMinScore] = useState<string>('');
    const [maxScore, setMaxScore] = useState<string>('');

    // Modals
    const [viewingSession, setViewingSession] = useState<AdminHistoryItem | null>(null);
    const [deletingSession, setDeletingSession] = useState<AdminHistoryItem | null>(null);

    // ================= Fetch Data =================

    // 1. Fetch available mock tests for dropdown filter
    const fetchAvailableTests = useCallback(async () => {
        try {
            const rawTests = await adminMockTestService.getAdminMockTests();
            if (Array.isArray(rawTests)) {
                setMockTestsList(rawTests.map((t) => ({ id: t.id, title: t.title })));
                const map = new Map<string, { maxScore?: number; totalQuestions?: number }>();
                rawTests.forEach((t) => {
                    const info = {
                        maxScore: Number(t.maxScore || 100),
                        totalQuestions: Number(t.totalQuestions || 10),
                    };
                    if (t.id) map.set(t.id, info);
                    if (t.title) map.set(t.title.trim().toLowerCase(), info);
                });
                testsMapRef.current = map;
            } else {
                setMockTestsList([]);
            }
        } catch {
            setMockTestsList([]);
        }
    }, []);

    // 2. Fetch history records from API
    const fetchHistories = useCallback(async () => {
        setIsLoading(true);

        // Build query params
        const params: AdminHistoryFilterParams = {
            page,
            size,
        };

        if (keyword.trim()) params.keyword = keyword.trim();
        if (selectedTestId !== 'ALL') params.testId = selectedTestId;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        if (isPassedFilter === 'PASSED') params.status = 'PASSED';
        if (isPassedFilter === 'FAILED') params.status = 'FAILED';

        if (fromDate) {
            params.fromDate = new Date(`${fromDate}T00:00:00Z`).toISOString();
        }
        if (toDate) {
            params.toDate = new Date(`${toDate}T23:59:59Z`).toISOString();
        }

        if (minScore !== '') params.minScore = Number(minScore);
        if (maxScore !== '') params.maxScore = Number(maxScore);

        try {
            const res = await adminHistoryService.getAllHistories(params);

            if (res && Array.isArray(res.items)) {
                const map = testsMapRef.current;
                const normalized = res.items.map((item, idx) => {
                    const titleKey = (item.testTitle || '')?.trim()?.toLowerCase();
                    const matchedTest =
                        (item.mockTestId ? map.get(item.mockTestId) : undefined) ||
                        (item.testId ? map.get(item.testId) : undefined) ||
                        (titleKey ? map.get(titleKey) : undefined);
                    return normalizeHistoryItem(item, idx, matchedTest);
                });
                setHistories(normalized);
                setPagination(res.pagination);
            } else {
                setHistories([]);
                setPagination({
                    total: 0,
                    page,
                    size,
                    totalPages: 1,
                });
            }
        } catch (err) {
            console.error('[AdminHistory] Lỗi fetch lịch sử từ API:', err);
            setHistories([]);
            setPagination({
                total: 0,
                page: 0,
                size: 10,
                totalPages: 1,
            });
        } finally {
            setIsLoading(false);
        }
    }, [page, size, keyword, selectedTestId, statusFilter, isPassedFilter, fromDate, toDate, minScore, maxScore]);

    useEffect(() => {
        fetchAvailableTests();
    }, [fetchAvailableTests]);

    useEffect(() => {
        fetchHistories();
    }, [fetchHistories]);

    // Reset all filters
    const handleResetFilters = () => {
        setKeyword('');
        setSelectedTestId('ALL');
        setStatusFilter('ALL');
        setIsPassedFilter('ALL');
        setFromDate('');
        setToDate('');
        setMinScore('');
        setMaxScore('');
        setPage(0);
    };

    // ================= Delete Session =================
    const handleConfirmDeleteSession = async () => {
        if (!deletingSession) return;

        setIsDeleting(true);
        try {
            await adminHistoryService.deleteTestSession(deletingSession.sessionId);
            showToast(`Đã xóa phiên thi #${deletingSession.sessionId} thành công!`, 'success');
            setDeletingSession(null);
            await fetchHistories();
        } catch (err: any) {
            console.error('[AdminHistory] Lỗi khi xóa phiên thi:', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa phiên thi!';
            showToast(msg, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Format helper for duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}p ${secs < 10 ? '0' : ''}${secs}s`;
    };

    // Format helper for timestamp
    const formatDateTime = (isoString?: string) => {
        if (!isoString) return '--';
        try {
            const d = new Date(isoString);
            return d.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return isoString;
        }
    };

    // KPI Metrics calculation
    const totalAttempts = pagination.total || histories.length;
    const totalPassed = histories.filter((s) => s.isPassed).length;
    const passRate = histories.length
        ? Math.round((totalPassed / histories.length) * 100)
        : 0;
    const averageScore = histories.length
        ? (histories.reduce((acc, curr) => acc + curr.score, 0) / histories.length).toFixed(1)
        : '0.0';

    return (
        <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8 min-w-0">
            {/* Toast Notification Banner */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${
                        toast.type === 'success'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                            : 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                    }`}
                >
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    <span>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 hover:opacity-80 p-0.5 rounded cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Top Action Bar & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Quản Trị Lịch Sử Thi Thử
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Theo dõi kết quả làm bài của học viên, phân tích tỷ lệ đạt và quản lý các phiên thi
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleResetFilters}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Đặt lại bộ lọc</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Tổng Lượt Nộp Bài
                        </span>
                        <span className="text-2xl font-black text-slate-900">{totalAttempts}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">phiên thi hệ thống</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                        📋
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Tỷ Lệ Đạt (Pass Rate)
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-emerald-600">{passRate}%</span>
                            <span className="text-xs text-slate-400">({totalPassed} lượt)</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${passRate}%` }} />
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                        🏆
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Điểm Trung Bình
                        </span>
                        <span className="text-2xl font-black text-indigo-600">
                            {averageScore} / {histories[0]?.maxScore || 100}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">toàn bộ học viên</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        ⭐
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Quy Mô Đang Hiển Thị
                        </span>
                        <span className="text-2xl font-black text-purple-600">{histories.length}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">trang {page + 1}/{pagination.totalPages}</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                        ⏱️
                    </div>
                </div>
            </div>

            {/* Advanced Filter Toolbar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span>Bộ Lọc Nâng Cao &amp; Tìm Kiếm</span>
                    </span>
                </div>

                {/* Filter Grid: Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Keyword Search */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Tìm học viên / Email / Mã phiên
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => {
                                    setKeyword(e.target.value);
                                    setPage(0);
                                }}
                                placeholder="Nhập tên, email hoặc mã phiên..."
                                className="w-full bg-transparent border-none p-0 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Mock Test Dropdown */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Đề thi thử (Test ID)
                        </label>
                        <select
                            value={selectedTestId}
                            onChange={(e) => {
                                setSelectedTestId(e.target.value);
                                setPage(0);
                            }}
                            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer truncate"
                        >
                            <option value="ALL">Tất cả đề thi</option>
                            {mockTestsList.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Result Filter */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Kết quả (isPassed)
                        </label>
                        <select
                            value={isPassedFilter}
                            onChange={(e) => {
                                setIsPassedFilter(e.target.value as any);
                                setPage(0);
                            }}
                            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="ALL">Tất cả kết quả</option>
                            <option value="PASSED">Đạt yêu cầu (Passed)</option>
                            <option value="FAILED">Chưa đạt (Failed)</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Trạng thái phiên thi
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                            }}
                            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="COMPLETED">Đã nộp bài (COMPLETED)</option>
                            <option value="IN_PROGRESS">Đang làm dở (IN_PROGRESS)</option>
                        </select>
                    </div>
                </div>

                {/* Filter Grid: Row 2 (Date Pickers & Score Range) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                    {/* From Date */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Từ ngày (fromDate)
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setPage(0);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200/80 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* To Date */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Đến ngày (toDate)
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setPage(0);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200/80 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Min Score */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Điểm tối thiểu (minScore)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={minScore}
                            onChange={(e) => {
                                setMinScore(e.target.value);
                                setPage(0);
                            }}
                            placeholder="0"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200/80 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Max Score */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Điểm tối đa (maxScore)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={maxScore}
                            onChange={(e) => {
                                setMaxScore(e.target.value);
                                setPage(0);
                            }}
                            placeholder="100"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200/80 text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                <th className="py-4 px-6 w-24">Mã phiên</th>
                                <th className="py-4 px-6">Học viên</th>
                                <th className="py-4 px-6">Đề thi</th>
                                <th className="py-4 px-6 text-center">Điểm số</th>
                                <th className="py-4 px-6 text-center">Kết quả</th>
                                <th className="py-4 px-6 text-center">Trạng thái</th>
                                <th className="py-4 px-6 text-center">Thời gian làm</th>
                                <th className="py-4 px-6">Thời gian nộp</th>
                                <th className="py-4 px-6 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                            <span>Đang tải danh sách lịch sử thi...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : histories.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                                        Không tìm thấy phiên thi nào phù hợp với bộ lọc hiện tại.
                                    </td>
                                </tr>
                            ) : (
                                histories.map((s) => (
                                    <tr key={s.sessionId} className="hover:bg-slate-50/70 transition-colors">
                                        {/* Session ID */}
                                        <td className="py-4 px-6">
                                            <span className="font-mono text-xs font-bold text-slate-500">
                                                #{s.sessionId}
                                            </span>
                                        </td>

                                        {/* Student Info */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                    <Image
                                                        src={s.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                                        alt={s.fullName}
                                                        width={36}
                                                        height={36}
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-snug">
                                                        {s.fullName}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {s.userEmail || s.username}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Exam Title */}
                                        <td className="py-4 px-6 max-w-xs">
                                            <p className="font-semibold text-slate-800 line-clamp-1">
                                                {s.testTitle}
                                            </p>
                                            <span className="text-[11px] text-slate-400">
                                                Đúng {s.correctAnswersCount ?? 0} / {s.totalQuestionsCount ?? 10} câu
                                            </span>
                                        </td>

                                        {/* Score */}
                                        <td className="py-4 px-6 text-center">
                                            <div className="inline-flex items-baseline gap-1 font-black">
                                                <span className={`text-base ${
                                                    s.score >= 8.0
                                                        ? 'text-emerald-600'
                                                        : s.score >= 5.0
                                                        ? 'text-blue-600'
                                                        : 'text-rose-600'
                                                }`}>
                                                    {s.score}
                                                </span>
                                                <span className="text-xs text-slate-400">/ {s.maxScore || 100}</span>
                                            </div>
                                        </td>

                                        {/* isPassed Badge */}
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                s.isPassed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {s.isPassed ? '✓ ĐẠT' : '✕ CHƯA ĐẠT'}
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                                                {s.status}
                                            </span>
                                        </td>

                                        {/* Duration */}
                                        <td className="py-4 px-6 text-center text-xs font-semibold text-slate-600">
                                            {formatDuration(s.durationSeconds)}
                                        </td>

                                        {/* Submitted Timestamp */}
                                        <td className="py-4 px-6 text-xs text-slate-500">
                                            {formatDateTime(s.submittedAt)}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => setViewingSession(s)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                    title="Xem chi tiết phiên thi"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>

                                                <button
                                                    onClick={() => setDeletingSession(s)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                    title="Xóa phiên thi này"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {pagination.total > 0 && (
                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
                        <div>
                            Hiển thị {page * size + 1} -{' '}
                            {Math.min((page + 1) * size, pagination.total)} trên tổng số{' '}
                            {pagination.total} phiên thi
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                            >
                                Trước
                            </button>

                            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i).map((pIndex) => (
                                <button
                                    key={pIndex}
                                    onClick={() => setPage(pIndex)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        page === pIndex
                                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    {pIndex + 1}
                                </button>
                            ))}

                            <button
                                disabled={page >= pagination.totalPages - 1}
                                onClick={() => setPage((p) => Math.min(pagination.totalPages - 1, p + 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* MODAL: VIEW SESSION DETAILS                                               */}
            {/* ========================================================================= */}
            {viewingSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm">
                    <div
                        style={{ height: '93vh', maxHeight: '93vh' }}
                        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35)] border-2 border-slate-300/85 ring-1 ring-slate-900/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-98 duration-150"
                    >
                        {/* Gradient Top Accent Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 shrink-0" />

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-slate-400">
                                            #{viewingSession.sessionId}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            viewingSession.isPassed
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            {viewingSession.isPassed ? '✓ Đạt yêu cầu' : '✕ Chưa đạt'}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                                        Chi Tiết Phiên Thi Thử
                                    </h3>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setViewingSession(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-7 space-y-6">
                            {/* Student & Exam Card */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0">
                                        <Image
                                            src={viewingSession.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                            alt={viewingSession.fullName}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-base">
                                            {viewingSession.fullName}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {viewingSession.userEmail || viewingSession.username}
                                        </p>
                                        <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                                            Mã thí sinh: {viewingSession.userId}
                                        </span>
                                    </div>
                                </div>

                                <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Đề thi thực hiện
                                    </span>
                                    <p className="font-bold text-slate-800 text-sm mt-0.5">
                                        {viewingSession.testTitle}
                                    </p>
                                    <span className="text-xs text-slate-400 block mt-0.5">
                                        Nộp bài: {formatDateTime(viewingSession.submittedAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Score Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Điểm Đạt Được
                                    </span>
                                    <span className={`text-2xl font-black mt-1 block ${
                                        viewingSession.isPassed ? 'text-emerald-600' : 'text-rose-600'
                                    }`}>
                                        {viewingSession.score} / {viewingSession.maxScore || 100}
                                    </span>
                                    {viewingSession.passingScore !== undefined && (
                                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                                            (Điểm đạt: {viewingSession.passingScore})
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Số Câu Đúng
                                    </span>
                                    <span className="text-2xl font-black text-slate-900 mt-1 block">
                                        {viewingSession.correctAnswersCount ?? 0} / {viewingSession.totalQuestionsCount ?? viewingSession.totalQuestions ?? 10}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Thời Lượng Làm
                                    </span>
                                    <span className="text-2xl font-black text-purple-600 mt-1 block">
                                        {formatDuration(viewingSession.durationSeconds)}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Trạng Thái
                                    </span>
                                    <span className="text-lg font-black text-blue-600 mt-1 block uppercase">
                                        {viewingSession.status}
                                    </span>
                                </div>
                            </div>

                            {/* Answers Breakdown / Log Info */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                    Nhật Ký Phiên Thi &amp; Đánh Giá Hệ Thống
                                </h4>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span>Bắt đầu phiên thi:</span>
                                        <strong className="text-slate-800 font-mono">
                                            {formatDateTime(viewingSession.startedAt)}
                                        </strong>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Hoàn tất &amp; Nộp bài:</span>
                                        <strong className="text-slate-800 font-mono">
                                            {formatDateTime(viewingSession.submittedAt)}
                                        </strong>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Hệ thống chấm điểm tự động:</span>
                                        <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                                            Hoàn tất 100%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setViewingSession(null)}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: DELETE SESSION CONFIRMATION                                        */}
            {/* ========================================================================= */}
            {deletingSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-base font-black text-slate-900">
                            Xác nhận xóa phiên thi #{deletingSession.sessionId}?
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Bạn có chắc chắn muốn xóa phiên thi của thí sinh{' '}
                            <strong className="text-slate-800">{deletingSession.fullName}</strong> (Đề:{' '}
                            <span className="font-semibold text-slate-800">{deletingSession.testTitle}</span>
                            )? Kết quả thi và lịch sử điểm số của phiên thi này sẽ bị xóa khỏi hệ thống.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingSession(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleConfirmDeleteSession}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {isDeleting && (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>Xác nhận xóa</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
