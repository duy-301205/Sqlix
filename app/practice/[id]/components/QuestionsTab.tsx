'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DatabaseDetail } from '../data';
import { DATABASE_EXERCISES } from '../exercisesData';

interface QuestionsTabProps {
    dbData: DatabaseDetail;
}

export default function QuestionsTab({ dbData }: QuestionsTabProps) {
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const exercises = DATABASE_EXERCISES[dbData.id] || DATABASE_EXERCISES.ecommerce || [];

    const filteredExercises = exercises.filter((ex) => {
        const matchDiff =
            filterDifficulty === 'all' ||
            ex.difficulty.toLowerCase() === filterDifficulty.toLowerCase();

        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
            q === '' ||
            ex.title.toLowerCase().includes(q) ||
            ex.category.toLowerCase().includes(q) ||
            ex.description.toLowerCase().includes(q);

        return matchDiff && matchSearch;
    });

    return (
        <div className="w-full space-y-4 pb-12">
            {/* Header thanh lọc & Tìm kiếm - Sử dụng Grid để khống chế chiều rộng 100% */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center w-full">
                <div className="md:col-span-6 lg:col-span-7">
                    <h2 className="text-base font-black text-slate-900">Danh sách bài tập thực hành</h2>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Chọn câu hỏi để mở phòng thi viết truy vấn và nộp bài chấm điểm tự động.
                    </p>
                </div>

                <div className="md:col-span-6 lg:col-span-5 flex items-center gap-2.5 justify-start md:justify-end w-full">
                    <div className="relative w-full max-w-[220px]">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm bài tập..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors shrink-0"
                    >
                        <option value="all">Tất cả độ khó</option>
                        <option value="Dễ">Dễ</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Khó">Khó</option>
                    </select>
                </div>
            </div>

            {/* Danh sách thẻ bài tập */}
            <div className="flex flex-col gap-3 w-full">
                {filteredExercises.map((ex) => (
                    <div
                        key={ex.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                        {/* Cột trái: Số thứ tự + Chi tiết bài */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                #{ex.orderNumber}
                            </div>

                            <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${ex.difficultyColor}`}>
                                        {ex.difficulty}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                        {ex.category}
                                    </span>
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                    {ex.title}
                                </h3>

                                <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                                    {ex.description}
                                </p>
                            </div>
                        </div>

                        {/* Cột phải: Điểm số + Nút làm bài */}
                        <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                            <div className="text-left md:text-right">
                                <div className="text-xs font-black text-slate-900">{ex.points} điểm</div>
                                <div className="text-[10px] text-slate-400">Thang điểm 100</div>
                            </div>

                            <Link
                                href={`/practice/${dbData.id}/solve/${ex.id}`}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                                <span>Làm bài</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                ))}

                {filteredExercises.length === 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-xs text-slate-400">
                        Không tìm thấy bài tập phù hợp với bộ lọc hiện tại.
                    </div>
                )}
            </div>
        </div>
    );
}