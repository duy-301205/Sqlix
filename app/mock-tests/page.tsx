'use client';

import { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import mockTestService, { MockTestSummary } from '@/services/mockTestService';

type SortOption = 'newest' | 'popular' | 'questions';

const DIFFICULTY_OPTIONS = [
    { label: 'Tất cả độ khó', value: 'all' },
    { label: 'Dễ', value: 'Dễ' },
    { label: 'Trung bình', value: 'Trung bình' },
    { label: 'Nâng cao / Khó', value: 'Nâng cao' },
];

const CATEGORY_OPTIONS = [
    { label: 'Tất cả chủ đề', value: 'all' },
    { label: 'E-commerce', value: 'E-commerce' },
    { label: 'University', value: 'University' },
    { label: 'Hospital', value: 'Hospital' },
    { label: 'Analytics', value: 'Analytics' },
    { label: 'Banking', value: 'Banking' },
];

const TIPS = [
    {
        step: 1,
        title: 'Đọc kỹ đề bài',
        desc: 'Xác định rõ các cột và điều kiện lọc cần lấy trước khi viết câu truy vấn.',
        color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
        step: 2,
        title: 'Phân bổ thời gian',
        desc: 'Mỗi câu có mức độ phức tạp khác nhau, tránh dừng quá lâu ở một câu khó.',
        color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
        step: 3,
        title: 'Chạy thử câu lệnh',
        desc: 'Luôn kiểm tra bảng kết quả thực thi và kiểu dữ liệu trước khi nộp bài thi.',
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
];

const getDifficultyColor = (diff: string | undefined): string => {
    const d = (diff || '').toLowerCase();
    if (d.includes('dễ') || d.includes('easy')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (d.includes('khó') || d.includes('nâng cao') || d.includes('hard')) {
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
};

const getIconBg = (index: number): string => {
    const bgs = [
        'bg-purple-50 text-purple-600 border-purple-100',
        'bg-blue-50 text-blue-600 border-blue-100',
        'bg-emerald-50 text-emerald-600 border-emerald-100',
        'bg-amber-50 text-amber-600 border-amber-100',
    ];
    return bgs[index % bgs.length];
};

function CategoryIcon({ icon }: { icon?: string }) {
    if (icon === 'school') {
        return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5" />
            </svg>
        );
    }
    if (icon === 'medical_services') {
        return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        );
    }
    if (icon === 'bar_chart') {
        return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        );
    }
    return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    );
}

export default function MockTestsListPage() {
    const [mounted, setMounted] = useState(false);
    const [mockTests, setMockTests] = useState<MockTestSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchTests = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mockTestService.getMockTests({
                difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                search: searchTerm || undefined,
                page: currentPage,
                size: 8,
            });

            if (data && Array.isArray(data.items)) {
                setMockTests(data.items);
                setTotalPages(data.totalPages || 1);
                setTotalCount(data.total || data.items.length);
            } else {
                setMockTests([]);
                setTotalPages(1);
                setTotalCount(0);
            }
        } catch (err: any) {
            console.error('[MockTests] Lỗi khi tải danh sách đề thi:', err);
            setMockTests([]);
            setTotalPages(1);
            setTotalCount(0);
            setError(err?.response?.data?.message || err?.message || 'Không thể đồng bộ đề thi từ máy chủ.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDifficulty, selectedCategory, searchTerm, currentPage]);

    useEffect(() => {
        setMounted(true);
        fetchTests();
    }, [fetchTests]);

    // Client-side search and sorting on current page items
    const filteredTests = useMemo(() => {
        return mockTests
            .filter((t) => {
                const title = t.title || '';
                const desc = t.description || '';
                const matchSearch =
                    title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    desc.toLowerCase().includes(searchTerm.toLowerCase());

                const diff = (t.difficulty || '').toLowerCase();
                const matchDiff =
                    selectedDifficulty === 'all' || diff.includes(selectedDifficulty.toLowerCase());

                const cat = (t.category || '').toLowerCase();
                const matchCat =
                    selectedCategory === 'all' || cat.includes(selectedCategory.toLowerCase());

                return matchSearch && matchDiff && matchCat;
            })
            .sort((a, b) => {
                if (sortBy === 'popular') return (b.participantsCount || 0) - (a.participantsCount || 0);
                if (sortBy === 'questions') return (b.questionsCount || 0) - (a.questionsCount || 0);
                return 0;
            });
    }, [mockTests, searchTerm, selectedDifficulty, selectedCategory, sortBy]);

    if (!mounted) return <div className="min-h-screen bg-[#f1f5f9]" />;

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header userName="Duy Hoàng" streakCount={7} />

                <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8">
                    {/* Header & Controls */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                <span>🎯 Thi thử áp lực thời gian thực</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
                                Phòng thi thử SQL mô phỏng
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Rèn luyện kỹ năng giải đề, quản lý thời gian và đánh giá năng lực với bộ đề thi chuẩn hóa.
                            </p>
                        </div>

                        {/* Search & Filters Bar */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-64">
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
                                    placeholder="Tìm kiếm đề thi..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                                />
                            </div>

                            {/* Difficulty */}
                            <select
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                                className="px-3 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer shadow-xs"
                            >
                                {DIFFICULTY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Category */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer shadow-xs"
                            >
                                {CATEGORY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer shadow-xs"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="popular">Nhiều lượt thi nhất</option>
                                <option value="questions">Nhiều câu hỏi nhất</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TIPS.map((tip) => (
                            <div
                                key={tip.step}
                                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5"
                            >
                                <div
                                    className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 ${tip.color}`}
                                >
                                    0{tip.step}
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">{tip.title}</h4>
                                    <p className="text-[11px] text-slate-500 line-clamp-1">{tip.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Skeletons Loading */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between gap-6 animate-pulse"
                                >
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-slate-200 rounded w-1/4" />
                                            <div className="h-5 bg-slate-200 rounded w-1/2" />
                                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                                        </div>
                                    </div>
                                    <div className="w-32 h-10 bg-slate-200 rounded-xl shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Danh sách các đề thi (Cards List) */
                        <div className="space-y-4">
                            {filteredTests.map((test, idx) => {
                                const testSlug = test.slug || test.id;
                                const diffColor = test.difficultyColor || getDifficultyColor(test.difficulty);
                                const iconBg = test.iconBg || getIconBg(idx);

                                return (
                                    <div
                                        key={test.id || testSlug}
                                        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                                    >
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            {/* Icon hoặc Ảnh Cover */}
                                            <div
                                                className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}
                                            >
                                                {test.coverImageUrl ? (
                                                    <img
                                                        src={test.coverImageUrl}
                                                        alt={test.title}
                                                        className="w-8 h-8 object-contain rounded-lg"
                                                    />
                                                ) : (
                                                    <CategoryIcon icon={test.icon} />
                                                )}
                                            </div>

                                            {/* Chi tiết thông tin */}
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span
                                                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${diffColor}`}
                                                    >
                                                        {test.difficulty}
                                                    </span>
                                                    {test.category && (
                                                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                                            {test.category}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                    {test.title}
                                                </h3>

                                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                    {test.description || 'Đề thi mô phỏng trắc nghiệm và viết câu truy vấn SQL thực tế.'}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 font-medium flex-wrap">
                                                    <span className="flex items-center gap-1.5 shrink-0">
                                                        <span>📄</span>
                                                        <b>{test.questionsCount || 10}</b> câu hỏi
                                                    </span>
                                                    <span className="flex items-center gap-1.5 shrink-0">
                                                        <span>⏱️</span>
                                                        <b>{test.durationMinutes}</b> phút
                                                    </span>
                                                    <span className="flex items-center gap-1.5 shrink-0">
                                                        <span>👥</span>
                                                        <b>{(test.participantsCount || 1200).toLocaleString('vi-VN')}</b> lượt thi
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nút hành động xem đề thi & vào phòng */}
                                        <div className="flex items-center gap-3 shrink-0 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                            <Link
                                                href={`/mock-tests/${encodeURIComponent(testSlug)}`}
                                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 shrink-0"
                                            >
                                                <span>Xem chi tiết & Thi</span>
                                                <svg
                                                    className="w-3.5 h-3.5"
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
                    {!isLoading && filteredTests.length === 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                            <p className="text-sm font-bold text-slate-700">Không tìm thấy đề thi phù hợp</p>
                            <p className="text-xs text-slate-400 mt-1">Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <span className="text-xs text-slate-500 font-medium">
                                Hiển thị trang <b>{currentPage}</b> / <b>{totalPages}</b>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    ← Trước
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Sau →
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
