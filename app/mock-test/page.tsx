'use client';

import { useState, useMemo, type ReactNode, type MouseEvent } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { MOCK_TESTS, type MockTestItem } from './mockTestData';

// --- Types & Constants ---
type SortOption = 'newest' | 'popular' | 'questions';

const DIFFICULTY_OPTIONS = ['all', 'Dễ', 'Trung bình', 'Nâng cao'] as const;
const CATEGORY_OPTIONS = [
    'all',
    'E-commerce',
    'University',
    'Hospital',
    'Analytics',
    'Banking',
] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'popular', label: 'Nhiều lượt thi nhất' },
    { value: 'questions', label: 'Nhiều câu hỏi nhất' },
];

const TIPS = [
    {
        step: 1,
        title: 'Đọc kỹ đề bài',
        desc: 'Xác định rõ các cột và điều kiện lọc cần lấy trước khi viết lệnh.',
        color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
        step: 2,
        title: 'Phân bổ thời gian',
        desc: 'Không dành quá nhiều thời gian cho một câu hỏi khó.',
        color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
        step: 3,
        title: 'Chạy thử câu lệnh',
        desc: 'Luôn kiểm tra bảng kết quả thực thi trước khi nhấn nộp bài.',
        color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
];

function formatNumber(num: number): string {
    return num.toLocaleString('vi-VN');
}

// --- Category Icon Component ---
function CategoryIcon({ icon }: { icon: string }) {
    const iconPaths: Record<string, ReactNode> = {
        shopping_cart: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
        ),
        school: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"
            />
        ),
        medical_services: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
        ),
        bar_chart: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
        ),
        account_balance: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
            />
        ),
    };

    const defaultPath = (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
    );

    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {iconPaths[icon] || defaultPath}
        </svg>
    );
}

// --- Main Page Component ---
export default function MockTestPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
    const [selectedTestModal, setSelectedTestModal] = useState<MockTestItem | null>(null);

    const toggleBookmark = (id: string, e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setBookmarkedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredTests = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return MOCK_TESTS
            .filter((test) => {
                const matchDiff = filterDifficulty === 'all' || test.difficulty === filterDifficulty;
                const matchCat = filterCategory === 'all' || test.category === filterCategory;
                const matchSearch =
                    !query ||
                    test.title.toLowerCase().includes(query) ||
                    test.description.toLowerCase().includes(query) ||
                    test.category.toLowerCase().includes(query);

                return matchDiff && matchCat && matchSearch;
            })
            .sort((a, b) => {
                if (sortBy === 'popular') return b.participantsCount - a.participantsCount;
                if (sortBy === 'questions') return b.questionsCount - a.questionsCount;
                return 0;
            });
    }, [searchQuery, filterDifficulty, filterCategory, sortBy]);

    const totalParticipants = useMemo(
        () => MOCK_TESTS.reduce((acc, curr) => acc + curr.participantsCount, 0),
        []
    );

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header userName="Duy Hoàng" streakCount={7} />

                <main className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 py-6 sm:py-8 w-full max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
                    {/* Banner Hero */}
                    <div
                        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)' }}
                        className="rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full"
                    >
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                                <span>⏱️ Bấm giờ tự động</span>
                                <span className="w-1 h-1 rounded-full bg-white/60" />
                                <span>Chấm điểm ngay</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                SQL Mock Test Phòng Thi Thử
                            </h1>
                            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                                Thử thách kỹ năng truy vấn SQL với các bài thi trắc nghiệm và thực hành có giới hạn thời gian. Chấm điểm tự động và xem đáp án giải thích chi tiết.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-xl text-center min-w-[110px]">
                                <div className="text-xl font-black text-white">{MOCK_TESTS.length}</div>
                                <div className="text-[11px] text-blue-100 font-medium">Bộ đề sẵn sàng</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-xl text-center min-w-[110px]">
                                <div className="text-xl font-black text-white">{formatNumber(totalParticipants)}</div>
                                <div className="text-[11px] text-blue-100 font-medium">Lượt thi tham gia</div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <svg
                                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm theo tên đề thi, chủ đề..."
                                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-start md:justify-end">
                            <select
                                value={filterDifficulty}
                                onChange={(e) => setFilterDifficulty(e.target.value)}
                                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
                            >
                                {DIFFICULTY_OPTIONS.map((diff) => (
                                    <option key={diff} value={diff}>
                                        {diff === 'all' ? 'Tất cả cấp độ' : diff}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
                            >
                                {CATEGORY_OPTIONS.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'Tất cả chủ đề' : cat}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
                            >
                                {SORT_OPTIONS.map((sort) => (
                                    <option key={sort.value} value={sort.value}>
                                        {sort.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full">
                        {/* Test list */}
                        <div className="xl:col-span-8 space-y-4 w-full">
                            {filteredTests.map((item) => (
                                <MockTestCard
                                    key={item.id}
                                    item={item}
                                    isBookmarked={!!bookmarkedIds[item.id]}
                                    onBookmark={(e) => toggleBookmark(item.id, e)}
                                    onSelect={() => setSelectedTestModal(item)}
                                />
                            ))}

                            {filteredTests.length === 0 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
                                    <p className="font-bold text-slate-700 text-sm">
                                        Không tìm thấy đề thi phù hợp
                                    </p>
                                    <p>Hãy thử thay đổi từ khóa hoặc bộ lọc độ khó.</p>
                                </div>
                            )}
                        </div>

                        {/* Right column */}
                        <div className="xl:col-span-4 space-y-5 w-full">
                            {/* Overview */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span>📊</span> Tổng quan Mock Test
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <OverviewStat label="Tổng số đề" value={MOCK_TESTS.length} color="purple" />
                                    <OverviewStat
                                        label="Lượt thi"
                                        value={formatNumber(totalParticipants)}
                                        color="blue"
                                    />
                                    <OverviewStat label="Tỷ lệ hoàn thành" value="72%" color="emerald" />
                                    <OverviewStat label="Thời gian TB" value="30 phút" color="amber" />
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span>💡</span> Mẹo làm bài thi
                                </h3>
                                <div className="space-y-3.5 text-xs">
                                    {TIPS.map((tip) => (
                                        <div key={tip.step} className="flex items-start gap-3">
                                            <div
                                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${tip.color}`}
                                            >
                                                {tip.step}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{tip.title}</h4>
                                                <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                                                    {tip.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal */}
            {selectedTestModal && (
                <TestModal item={selectedTestModal} onClose={() => setSelectedTestModal(null)} />
            )}
        </div>
    );
}

// --- Sub-components ---

function MockTestCard({
                          item,
                          isBookmarked,
                          onBookmark,
                          onSelect,
                      }: {
    item: MockTestItem;
    isBookmarked: boolean;
    onBookmark: (e: MouseEvent<HTMLButtonElement>) => void;
    onSelect: () => void;
}) {
    return (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
            {/* Khối bên trái: Icon + Thông tin */}
            <div className="flex items-start gap-4 flex-1">
                {/* Icon */}
                <div
                    className={`w-12 h-12 rounded-xl ${item.iconBg} ${item.iconColor} border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                >
                    <CategoryIcon icon={item.icon} />
                </div>

                {/* Nội dung text */}
                <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border shrink-0 ${item.difficultyColor}`}
                        >
                            {item.difficulty}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                            {item.category}
                        </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {item.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 font-medium flex-wrap">
                        <span className="flex items-center gap-1.5 shrink-0">
                            <span>📄</span>
                            <b>{item.questionsCount}</b> câu hỏi
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                            <span>⏱️</span>
                            <b>{item.durationMinutes}</b> phút
                        </span>
                        <span className="flex items-center gap-1.5 shrink-0">
                            <span>👥</span>
                            <b>{formatNumber(item.participantsCount)}</b> lượt thi
                        </span>
                    </div>
                </div>
            </div>

            {/* Khối bên phải: Luôn ghim sang mép phải */}
            <div className="flex items-center gap-2.5 shrink-0 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <button
                    type="button"
                    onClick={onBookmark}
                    className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isBookmarked
                            ? 'bg-amber-50 border-amber-300 text-amber-500'
                            : 'border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                    title={isBookmarked ? 'Đã lưu' : 'Lưu vào danh sách'}
                >
                    <svg
                        className="w-4 h-4"
                        fill={isBookmarked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                    </svg>
                </button>

                <button
                    type="button"
                    onClick={onSelect}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                >
                    <span>Bắt đầu thi</span>
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
                </button>
            </div>
        </div>
    );
}

function OverviewStat({
                          label,
                          value,
                          color,
                      }: {
    label: string;
    value: string | number;
    color: 'purple' | 'blue' | 'emerald' | 'amber';
}) {
    const styles = {
        purple: 'bg-purple-50/70 border-purple-100 text-purple-700 text-purple-600',
        blue: 'bg-blue-50/70 border-blue-100 text-blue-700 text-blue-600',
        emerald: 'bg-emerald-50/70 border-emerald-100 text-emerald-700 text-emerald-600',
        amber: 'bg-amber-50/70 border-amber-100 text-amber-700 text-amber-600',
    };

    const [bgAndBorder, textVal, textLabel] = styles[color].split(' ');

    return (
        <div className={`p-3.5 border rounded-xl ${bgAndBorder}`}>
            <div className={`text-lg font-black ${textVal}`}>{value}</div>
            <div className={`text-[11px] font-semibold mt-0.5 ${textLabel}`}>{label}</div>
        </div>
    );
}

function TestModal({ item, onClose }: { item: MockTestItem; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-5 sm:p-6 w-[92vw] sm:w-[420px] max-w-[420px] shadow-2xl space-y-4 relative border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="flex items-center gap-3">
                    <div
                        className={`w-11 h-11 rounded-xl ${item.iconBg} ${item.iconColor} border flex items-center justify-center shrink-0 shadow-xs`}
                    >
                        <CategoryIcon icon={item.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.difficultyColor}`}
                            >
                                {item.difficulty}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                {item.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mô tả */}
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {item.description}
                </p>

                {/* Thông số nhanh */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                        <div className="text-slate-400 text-[10px]">Số câu hỏi</div>
                        <div className="font-bold text-slate-800 mt-0.5">{item.questionsCount} câu</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                        <div className="text-slate-400 text-[10px]">Thời gian</div>
                        <div className="font-bold text-blue-600 mt-0.5">{item.durationMinutes} phút</div>
                    </div>
                </div>

                {/* Nút hành động */}
                <div className="flex gap-2.5 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                        Hủy
                    </button>
                    <Link
                        href={`/mock-test/${item.id}`}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl text-center transition-colors cursor-pointer shadow-xs hover:shadow"
                    >
                        Vào phòng thi
                    </Link>
                </div>
            </div>
        </div>
    );
}