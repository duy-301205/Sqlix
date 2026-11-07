'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { TestSessionHistory } from '../types';
import { mockHistorySessions, mockMockTests } from '../mockData';

// Extended mock session records for realistic CMS pagination and filtering
const initialSessions: TestSessionHistory[] = [
    ...mockHistorySessions,
    {
        id: 'sess-106',
        sessionId: 'sess-106',
        userId: 'usr-6',
        userName: 'Đặng Quốc Huy',
        userEmail: 'huy.dang@startup.io',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-1',
        mockTestTitle: 'Đề thi thử SQL Cơ bản - Đợt 1',
        score: 9.0,
        maxScore: 10,
        isPassed: true,
        durationSeconds: 1540,
        startedAt: '2024-03-27T14:10:00Z',
        submittedAt: '2024-03-27T14:35:40Z',
        correctAnswersCount: 14,
        totalQuestionsCount: 15
    },
    {
        id: 'sess-107',
        sessionId: 'sess-107',
        userId: 'usr-7',
        userName: 'Bùi Thị Mai',
        userEmail: 'mai.bui@techcorp.vn',
        userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-3',
        mockTestTitle: 'Database Optimization & Indexing Assessment',
        score: 5.5,
        maxScore: 10,
        isPassed: false,
        durationSeconds: 2900,
        startedAt: '2024-03-27T09:00:00Z',
        submittedAt: '2024-03-27T09:48:20Z',
        correctAnswersCount: 5,
        totalQuestionsCount: 10
    },
    {
        id: 'sess-108',
        sessionId: 'sess-108',
        userId: 'usr-8',
        userName: 'Hoàng Văn Nam',
        userEmail: 'nam.hoang@hust.edu.vn',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-2',
        mockTestTitle: 'SQL Advanced Aggregations & Window Functions',
        score: 8.5,
        maxScore: 10,
        isPassed: true,
        durationSeconds: 2250,
        startedAt: '2024-03-26T16:20:00Z',
        submittedAt: '2024-03-26T16:57:30Z',
        correctAnswersCount: 10,
        totalQuestionsCount: 12
    },
    {
        id: 'sess-109',
        sessionId: 'sess-109',
        userId: 'usr-9',
        userName: 'Trịnh Cẩm Tú',
        userEmail: 'tu.trinh@fintech.vn',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-1',
        mockTestTitle: 'Đề thi thử SQL Cơ bản - Đợt 1',
        score: 7.5,
        maxScore: 10,
        isPassed: true,
        durationSeconds: 1980,
        startedAt: '2024-03-26T11:00:00Z',
        submittedAt: '2024-03-26T11:33:00Z',
        correctAnswersCount: 11,
        totalQuestionsCount: 15
    },
    {
        id: 'sess-110',
        sessionId: 'sess-110',
        userId: 'usr-10',
        userName: 'Lý Kiến Quốc',
        userEmail: 'quoc.ly@dataanalytics.com',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        mockTestId: 'test-3',
        mockTestTitle: 'Database Optimization & Indexing Assessment',
        score: 4.0,
        maxScore: 10,
        isPassed: false,
        durationSeconds: 2950,
        startedAt: '2024-03-25T15:00:00Z',
        submittedAt: '2024-03-25T15:49:10Z',
        correctAnswersCount: 4,
        totalQuestionsCount: 10
    }
];

export default function AdminHistoryPage() {
    // ================= State =================
    const [sessions, setSessions] = useState<TestSessionHistory[]>(initialSessions);

    // Filters
    const [searchUserQuery, setSearchUserQuery] = useState('');
    const [selectedTestFilter, setSelectedTestFilter] = useState('ALL');
    const [resultFilter, setResultFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
    const [scoreRangeFilter, setScoreRangeFilter] = useState<string>('ALL');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    // Modals
    const [viewingSession, setViewingSession] = useState<TestSessionHistory | null>(null);
    const [deletingSession, setDeletingSession] = useState<TestSessionHistory | null>(null);

    // ================= Filtering Logic =================
    const filteredSessions = useMemo(() => {
        return sessions.filter((s) => {
            // Search query by student name, email, or session ID
            const matchesSearch =
                s.userName.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                s.userEmail.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                s.sessionId.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                s.mockTestTitle.toLowerCase().includes(searchUserQuery.toLowerCase());

            // Test filter
            const matchesTest =
                selectedTestFilter === 'ALL' || s.mockTestId === selectedTestFilter;

            // Result status filter
            const matchesResult =
                resultFilter === 'ALL' ||
                (resultFilter === 'PASSED' && s.isPassed) ||
                (resultFilter === 'FAILED' && !s.isPassed);

            // Score range filter
            let matchesScore = true;
            if (scoreRangeFilter === 'EXCELLENT') {
                matchesScore = s.score >= 9.0;
            } else if (scoreRangeFilter === 'GOOD') {
                matchesScore = s.score >= 7.0 && s.score < 9.0;
            } else if (scoreRangeFilter === 'AVERAGE') {
                matchesScore = s.score >= 5.0 && s.score < 7.0;
            } else if (scoreRangeFilter === 'POOR') {
                matchesScore = s.score < 5.0;
            }

            return matchesSearch && matchesTest && matchesResult && matchesScore;
        });
    }, [sessions, searchUserQuery, selectedTestFilter, resultFilter, scoreRangeFilter]);

    // Paginated sessions
    const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;
    const paginatedSessions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSessions.slice(start, start + pageSize);
    }, [filteredSessions, currentPage]);

    // Format helper for duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}p ${secs < 10 ? '0' : ''}${secs}s`;
    };

    // Format helper for timestamp
    const formatDateTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // ================= Delete Session Handler =================
    const handleConfirmDeleteSession = () => {
        if (!deletingSession) return;
        console.log(`[API DELETE]: /api/admin/test-sessions/${deletingSession.sessionId}`);

        setSessions((prev) => prev.filter((s) => s.id !== deletingSession.id));
        setDeletingSession(null);

        // Adjust page if needed
        if (paginatedSessions.length === 1 && currentPage > 1) {
            setCurrentPage((p) => p - 1);
        }
    };

    // Export report handler
    const handleExportReport = () => {
        console.log('[API GET]: /api/admin/mock-tests/history/export?format=csv');
        alert(`Đã chuẩn bị tải về báo cáo lịch sử thi (${filteredSessions.length} bản ghi theo bộ lọc)!`);
    };

    // KPI Metrics
    const totalAttempts = sessions.length;
    const totalPassed = sessions.filter((s) => s.isPassed).length;
    const passRate = totalAttempts ? Math.round((totalPassed / totalAttempts) * 100) : 0;
    const averageScore = totalAttempts
        ? (sessions.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts).toFixed(1)
        : '0.0';
    const totalHoursSpent = totalAttempts
        ? Math.round(sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0) / 3600)
        : 0;

    return (
        <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8 min-w-0">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span>Lịch Sử Thi Toàn Hệ Thống</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            CMS Admin
                        </span>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                        Theo dõi, thống kê và giám sát toàn diện kết quả các phiên thi thử SQL của tất cả học viên trong hệ thống SQLix.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Xuất Báo Cáo (CSV)</span>
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
                        <span className="text-xs text-slate-400 block mt-0.5">phiên thi hoàn thành</span>
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
                        <span className="text-2xl font-black text-indigo-600">{averageScore} / 10</span>
                        <span className="text-xs text-slate-400 block mt-0.5">toàn bộ học viên</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                        ⭐
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Thời Gian Làm Bài
                        </span>
                        <span className="text-2xl font-black text-purple-600">~{totalHoursSpent} giờ</span>
                        <span className="text-xs text-slate-400 block mt-0.5">tổng thời gian làm bài</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                        ⏱️
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="w-full lg:w-96 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchUserQuery}
                            onChange={(e) => {
                                setSearchUserQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Tìm theo học viên, email, mã phiên..."
                            className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="w-full lg:w-auto flex flex-wrap items-center gap-3">
                        {/* Mock Test Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500">Đề thi:</span>
                            <select
                                value={selectedTestFilter}
                                onChange={(e) => {
                                    setSelectedTestFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[200px] truncate"
                            >
                                <option value="ALL">Tất cả đề thi</option>
                                {mockMockTests.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Result Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500">Kết quả:</span>
                            <select
                                value={resultFilter}
                                onChange={(e) => {
                                    setResultFilter(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="ALL">Tất cả kết quả</option>
                                <option value="PASSED">Đạt yêu cầu (Passed)</option>
                                <option value="FAILED">Chưa đạt (Failed)</option>
                            </select>
                        </div>

                        {/* Score Range Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-500">Thang điểm:</span>
                            <select
                                value={scoreRangeFilter}
                                onChange={(e) => {
                                    setScoreRangeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="ALL">Tất cả điểm</option>
                                <option value="EXCELLENT">Xuất sắc (≥ 9.0)</option>
                                <option value="GOOD">Khá - Giỏi (7.0 - 8.9)</option>
                                <option value="AVERAGE">Trung bình (5.0 - 6.9)</option>
                                <option value="POOR">Chưa đạt (&lt; 5.0)</option>
                            </select>
                        </div>
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
                                <th className="py-4 px-6 text-center">Thời gian làm</th>
                                <th className="py-4 px-6">Thời gian nộp</th>
                                <th className="py-4 px-6 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {paginatedSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                                        Không tìm thấy phiên thi nào phù hợp với bộ lọc hiện tại.
                                    </td>
                                </tr>
                            ) : (
                                paginatedSessions.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                                        {/* Session ID */}
                                        <td className="py-4 px-6">
                                            <span className="font-mono text-xs font-bold text-slate-400">
                                                #{s.sessionId}
                                            </span>
                                        </td>

                                        {/* Student Info */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                    <Image
                                                        src={s.userAvatar}
                                                        alt={s.userName}
                                                        width={36}
                                                        height={36}
                                                        className="w-full h-full object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-snug">
                                                        {s.userName}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {s.userEmail}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Exam Title */}
                                        <td className="py-4 px-6">
                                            <p className="font-semibold text-slate-800 line-clamp-1">
                                                {s.mockTestTitle}
                                            </p>
                                            <span className="text-[11px] text-slate-400">
                                                Đúng {s.correctAnswersCount} / {s.totalQuestionsCount} câu
                                            </span>
                                        </td>

                                        {/* Score */}
                                        <td className="py-4 px-6 text-center">
                                            <div className="inline-flex items-baseline gap-1 font-black">
                                                <span className={`text-base ${
                                                    s.score >= 8.0
                                                        ? 'text-emerald-600'
                                                        : s.score >= 6.0
                                                        ? 'text-blue-600'
                                                        : 'text-rose-600'
                                                }`}>
                                                    {s.score}
                                                </span>
                                                <span className="text-xs text-slate-400">/ {s.maxScore}</span>
                                            </div>
                                        </td>

                                        {/* Result Badge */}
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                s.isPassed
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {s.isPassed ? '✓ ĐẠT' : '✕ CHƯA ĐẠT'}
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

                                        {/* Action buttons */}
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
                                                    title="Xóa phiên thi"
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
                {filteredSessions.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
                        <div>
                            Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
                            {Math.min(currentPage * pageSize, filteredSessions.length)} trên tổng số{' '}
                            {filteredSessions.length} phiên thi
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                            >
                                Trước
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* MODAL: VIEW SESSION DETAILS (Height 93vh, Accent Border)                  */}
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
                                            src={viewingSession.userAvatar}
                                            alt={viewingSession.userName}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-base">
                                            {viewingSession.userName}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {viewingSession.userEmail}
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
                                        {viewingSession.mockTestTitle}
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
                                        {viewingSession.score} / {viewingSession.maxScore}
                                    </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Số Câu Đúng
                                    </span>
                                    <span className="text-2xl font-black text-slate-900 mt-1 block">
                                        {viewingSession.correctAnswersCount} / {viewingSession.totalQuestionsCount}
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
                                        Tỷ Lệ Chính Xác
                                    </span>
                                    <span className="text-2xl font-black text-blue-600 mt-1 block">
                                        {Math.round((viewingSession.correctAnswersCount / viewingSession.totalQuestionsCount) * 100)}%
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
                                    <div className="pt-2 border-t border-slate-200 text-slate-500 leading-relaxed italic">
                                        * Lưu ý Quản trị viên: Toàn bộ câu truy vấn SQL và lịch sử tick trắc nghiệm của học viên đã được lưu trữ trong log engine chấm điểm.
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
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
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
                            <strong className="text-slate-800">{deletingSession.userName}</strong> (Đề:{' '}
                            <span className="font-semibold text-slate-800">{deletingSession.mockTestTitle}</span>
                            )? Kết quả thi và lịch sử điểm số của phiên thi này sẽ bị xóa khỏi hệ thống.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeletingSession(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleConfirmDeleteSession}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
