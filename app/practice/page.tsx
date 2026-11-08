'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import practiceService, { PracticeDatabase } from '@/services/practiceService';

const getDifficultyColor = (diff: string | undefined): string => {
    const d = (diff || '').toLowerCase();
    if (d.includes('dễ') || d.includes('easy')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (d.includes('khó') || d.includes('hard')) {
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
};

const getIconBg = (index: number): string => {
    const bgs = [
        'bg-emerald-50 text-emerald-600 border-emerald-100',
        'bg-blue-50 text-blue-600 border-blue-100',
        'bg-purple-50 text-purple-600 border-purple-100',
        'bg-amber-50 text-amber-600 border-amber-100',
        'bg-indigo-50 text-indigo-600 border-indigo-100',
    ];
    return bgs[index % bgs.length];
};

export default function PracticePage() {
    const [mounted, setMounted] = useState(false);
    const [databases, setDatabases] = useState<PracticeDatabase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'hard'>('latest');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

    const fetchDatabases = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await practiceService.getDatabases();
            if (Array.isArray(data)) {
                setDatabases(data);
            } else {
                setDatabases([]);
            }
        } catch (err: any) {
            console.error('[Practice] Lỗi khi gọi getDatabases:', err);
            setDatabases([]);
            setError(err?.response?.data?.message || err?.message || 'Không thể đồng bộ danh sách CSDL từ máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchDatabases();
    }, [fetchDatabases]);

    const filteredDatabases = useMemo(() => {
        return databases
            .filter((db) => {
                const name = db.name || '';
                const desc = db.description || '';
                const matchSearch =
                    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    desc.toLowerCase().includes(searchTerm.toLowerCase());

                const diff = (db.difficulty || '').toLowerCase();
                const sel = selectedDifficulty.toLowerCase();
                const matchDifficulty = sel === 'all' || diff.includes(sel);

                return matchSearch && matchDifficulty;
            })
            .sort((a, b) => {
                if (sortBy === 'popular') {
                    return (b.rating || b.exercisesCount || 0) - (a.rating || a.exercisesCount || 0);
                }
                if (sortBy === 'hard') {
                    return (b.tablesCount || 0) - (a.tablesCount || 0);
                }
                return 0;
            });
    }, [databases, searchTerm, sortBy, selectedDifficulty]);

    if (!mounted) {
        return <div className="min-h-screen bg-[#f1f5f9]" />;
    }

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar Component */}
            <Sidebar />

            {/* Main Content View */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header userName="Duy Hoàng" streakCount={7} />

                <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8">
                    {/* Header & Controls */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                <span>⚡ Kho bài tập thực tế</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
                                Luyện tập truy vấn SQL
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Chọn cơ sở dữ liệu mẫu để bắt đầu thực hành viết câu lệnh từ cơ bản đến phức tạp.
                            </p>
                        </div>

                        {/* Filter / Search Bar */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-72">
                                <svg
                                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm kiếm cơ sở dữ liệu..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                                />
                            </div>

                            {/* Difficulty Filter */}
                            <select
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                                className="px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer shadow-xs"
                            >
                                <option value="all">Tất cả độ khó</option>
                                <option value="dễ">Dễ</option>
                                <option value="trung bình">Trung bình</option>
                                <option value="khó">Khó</option>
                            </select>

                            {/* Sort Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer shadow-xs"
                            >
                                <option value="latest">Mới nhất</option>
                                <option value="popular">Đánh giá cao nhất</option>
                                <option value="hard">Nhiều bảng dữ liệu</option>
                            </select>
                        </div>
                    </div>

                    {/* Loading Skeletons */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-pulse"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-xl bg-slate-200" />
                                        <div className="w-16 h-6 rounded-full bg-slate-200" />
                                    </div>
                                    <div className="h-5 bg-slate-200 rounded w-2/3" />
                                    <div className="h-4 bg-slate-100 rounded w-full" />
                                    <div className="h-4 bg-slate-100 rounded w-4/5" />
                                    <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                                        <div className="h-8 bg-slate-100 rounded" />
                                        <div className="h-8 bg-slate-100 rounded" />
                                        <div className="h-8 bg-slate-100 rounded" />
                                    </div>
                                    <div className="h-10 bg-slate-200 rounded-xl w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Database Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredDatabases.map((db, idx) => {
                                const dbKey = db.slug || db.id;
                                const diffColor = db.difficultyColor || getDifficultyColor(db.difficulty);
                                const iconBg = db.iconBg || getIconBg(idx);
                                const tablesCount = db.tablesCount ?? (typeof db.schemaData === 'object' && Array.isArray((db.schemaData as any)?.tables) ? (db.schemaData as any).tables.length : 0);
                                const exercisesCount = db.exercisesCount ?? 0;
                                const rating = db.rating ?? 4.8;

                                return (
                                    <div
                                        key={db.id || dbKey}
                                        className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div
                                                    className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-sm ${iconBg}`}
                                                >
                                                    {db.iconUrl ? (
                                                        <img
                                                            src={db.iconUrl}
                                                            alt={db.name}
                                                            className="w-6 h-6 object-contain"
                                                        />
                                                    ) : (
                                                        <svg
                                                            className="w-6 h-6"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span
                                                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${diffColor}`}
                                                >
                                                    {db.difficulty}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {db.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 leading-relaxed mt-1.5 min-h-[36px]">
                                                {db.description}
                                            </p>
                                        </div>

                                        {/* Specs Box */}
                                        <div className="mt-6">
                                            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                                                <div>
                                                    <div className="text-xs font-black text-slate-900">
                                                        {tablesCount}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                                                        Bảng
                                                    </div>
                                                </div>
                                                <div className="border-x border-slate-100">
                                                    <div className="text-xs font-black text-slate-900">
                                                        {exercisesCount}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                                                        Bài tập
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-900">
                                                        ⭐ {rating}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                                                        Đánh giá
                                                    </div>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/practice/${encodeURIComponent(dbKey)}`}
                                                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                                            >
                                                <span>Bắt đầu luyện tập</span>
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                                                    />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && filteredDatabases.length === 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                            <p className="text-sm font-bold text-slate-700">Không tìm thấy cơ sở dữ liệu phù hợp</p>
                            <p className="text-xs text-slate-400 mt-1">Hãy thử thay đổi từ khóa hoặc bộ lọc độ khó.</p>
                        </div>
                    )}

                    {/* CTA Custom DB Suggestion */}
                    <div
                        className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md shadow-blue-500/20"
                        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}
                    >
                        <div className="space-y-1 text-center md:text-left">
                            <h3 className="text-lg font-black tracking-tight">Chưa tìm thấy cơ sở dữ liệu mong muốn?</h3>
                            <p className="text-xs text-blue-100 leading-relaxed max-w-xl">
                                Bạn có thể gửi đề xuất schema cơ sở dữ liệu riêng hoặc tính năng truy vấn cụ thể để chúng tôi bổ sung thêm vào hệ thống luyện tập.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="px-6 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-600 font-bold text-xs transition-all shadow-sm shrink-0 cursor-pointer"
                        >
                            Gửi đề xuất
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
