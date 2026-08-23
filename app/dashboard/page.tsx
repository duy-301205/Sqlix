'use client';

import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';

export default function DashboardPage() {
    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar Component */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header Component */}
                <Header userName="Duy Hoàng" streakCount={7} />

                {/* Scrollable Dashboard Body */}
                <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8">
                    {/* ================= 1. Top Metric Cards (4 Columns) ================= */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* Metric 1 */}
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
                                    <span className="text-3xl font-black text-slate-950">24</span>
                                    <span className="text-sm font-semibold text-slate-500">/ 120 bài</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: '20%' }}></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-blue-600">Đã đạt 20%</span>
                                <span className="text-slate-400 font-medium">Còn 96 bài</span>
                            </div>
                        </div>

                        {/* Metric 2 */}
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
                                    <span className="text-3xl font-black text-slate-950">156</span>
                                    <span className="text-sm font-semibold text-slate-500">/ 300 bài</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '52%' }}></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-emerald-600">Đã hoàn thành 52%</span>
                                <span className="text-slate-400 font-medium">+14 bài tuần này</span>
                            </div>
                        </div>

                        {/* Metric 3 */}
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
                                    <span className="text-3xl font-black text-slate-950">8.6</span>
                                    <span className="text-sm font-semibold text-slate-500">/ 10</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                    <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: '86%' }}></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-purple-600">Xếp loại: Xuất sắc</span>
                                <span className="text-slate-400 font-medium">Top 15% học viên</span>
                            </div>
                        </div>

                        {/* Metric 4 */}
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
                                    <span className="text-3xl font-black text-slate-950">18.5</span>
                                    <span className="text-sm font-semibold text-slate-500">giờ</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-amber-600">Trung bình 45p/ngày</span>
                                <span className="text-slate-400 font-medium">30 ngày qua</span>
                            </div>
                        </div>
                    </div>

                    {/* ================= 2. Middle Row: Progress & Chart ================= */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Skills Progress Card (5 Cols on desktop) */}
                        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg">Mức độ thành thạo</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Tiến độ chi tiết từng chuyên đề SQL</p>
                                </div>
                                <Link
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                    href="/dashboard/learning"
                                >
                                    Xem chi tiết →
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { title: 'SQL Cơ bản (SELECT, WHERE, ORDER BY)', percent: 80, color: 'bg-blue-600' },
                                    { title: 'SQL Nâng cao (Aggregate Functions)', percent: 60, color: 'bg-emerald-500' },
                                    { title: 'JOIN & Multi-table Queries', percent: 45, color: 'bg-purple-600' },
                                    { title: 'GROUP BY & HAVING Clause', percent: 30, color: 'bg-amber-500' },
                                    { title: 'Subqueries & CTEs', percent: 20, color: 'bg-rose-500' },
                                    { title: 'Window Functions & Indexing', percent: 10, color: 'bg-teal-500' },
                                ].map((skill) => (
                                    <div key={skill.title} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-slate-800">{skill.title}</span>
                                            <span className="text-slate-600 font-bold">{skill.percent}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`${skill.color} h-full rounded-full transition-all duration-500`}
                                                style={{ width: `${skill.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity Analytics Card (7 Cols on desktop) */}
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

                            {/* Crisp SVG Line Chart */}
                            <div className="w-full h-64 relative">
                                <div className="absolute inset-0 flex flex-col justify-between text-[11px] text-slate-400">
                                    {[40, 30, 20, 10, 0].map((val) => (
                                        <div key={val} className="w-full border-t border-dashed border-slate-200 flex justify-between relative">
                                            <span className="absolute -left-6 -top-2">{val}</span>
                                            <span className="absolute -right-6 -top-2">{val / 4}</span>
                                        </div>
                                    ))}
                                </div>

                                <svg className="absolute inset-0 w-full h-full pb-6 px-6" preserveAspectRatio="none" viewBox="0 0 500 200">
                                    {/* Gradient fill */}
                                    <defs>
                                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M 0,160 Q 70,120 150,110 T 300,50 T 400,130 T 500,90 L 500,200 L 0,200 Z"
                                        fill="url(#blueGrad)"
                                    />
                                    {/* Line 1 - Exercises */}
                                    <path
                                        d="M 0,160 Q 70,120 150,110 T 300,50 T 400,130 T 500,90"
                                        fill="none"
                                        stroke="#2563eb"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                    {/* Line 2 - Scores */}
                                    <path
                                        d="M 0,120 Q 70,140 150,80 T 300,80 T 400,96 T 500,56"
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>

                                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[11px] font-semibold text-slate-400 px-6">
                                    <span>22/04</span>
                                    <span>27/04</span>
                                    <span>02/05</span>
                                    <span>07/05</span>
                                    <span>12/05</span>
                                    <span>17/05</span>
                                    <span>22/05</span>
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
                                        <h4 className="font-bold text-slate-900 text-sm">SELECT nâng cao</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Bài 12: DISTINCT, LIMIT & OFFSET</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                                        <span>Tiến độ bài học</span>
                                        <span className="text-blue-600">60%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-full rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                </div>

                                <button className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2">
                                    <span>Tiếp tục học</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* 2. Recent Exercises */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-slate-900 text-base">Bài tập gần đây</h3>
                                <Link className="text-xs font-bold text-blue-600 hover:underline" href="/dashboard/practice">
                                    Xem tất cả →
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {[
                                    { title: 'Tìm sinh viên có GPA cao nhất', tag: 'SQL cơ bản', score: '9.0/10', time: '2 giờ trước', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                                    { title: 'Đếm số đơn hàng theo trạng thái', tag: 'GROUP BY', score: '8.5/10', time: '1 ngày trước', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                                    { title: 'Liệt kê sản phẩm bán chạy nhất', tag: 'JOIN', score: '7.5/10', time: '2 ngày trước', color: 'text-purple-700 bg-purple-50 border-purple-200' },
                                    { title: 'Tìm nhân viên lương cao hơn PB', tag: 'Subquery', score: '8.0/10', time: '3 ngày trước', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                                ].map((item) => (
                                    <div key={item.title} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-blue-600 cursor-pointer">
                                                {item.title}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${item.color}`}>
                                                    {item.tag}
                                                </span>
                                                <span className="text-[10px] text-slate-400">{item.time}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
                                            {item.score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Recent Mock Test */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-slate-900 text-base">Kỳ thi thử gần đây</h3>
                                <Link className="text-xs font-bold text-blue-600 hover:underline" href="/dashboard/mock-test">
                                    Lịch sử thi →
                                </Link>
                            </div>

                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between flex-1">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-slate-900 text-sm">SQL Mock Exam #03</h4>
                                        <span className="text-[11px] font-semibold text-slate-400">18/05/2026</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4">20 câu hỏi trắc nghiệm & thực hành • 30 phút</p>

                                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Điểm</span>
                                            <div className="text-base font-black text-blue-600 mt-0.5">8.5</div>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Thời gian</span>
                                            <div className="text-base font-black text-slate-800 mt-0.5">25:30</div>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Xếp hạng</span>
                                            <div className="text-base font-black text-emerald-600 mt-0.5">Top 32%</div>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer">
                                    Xem chi tiết lời giải
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}