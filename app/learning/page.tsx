'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { SQL_COURSES, LESSONS_DATABASE } from './data';

function LessonContent() {
    const searchParams = useSearchParams();
    const lessonParam = searchParams.get('lesson') || 'select';

    // Lấy dữ liệu bài học theo param, fallback về bài 'select' nếu không tìm thấy
    const currentLesson =
        (LESSONS_DATABASE as Record<string, any>)[lessonParam] || LESSONS_DATABASE.select;

    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isUnderstood, setIsUnderstood] = useState(false);
    const [openCategory, setOpenCategory] = useState<string>(currentLesson.category);

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Sub-Sidebar: Course Curriculum */}
            <aside className="w-64 border-r border-slate-200 bg-white hidden xl:flex flex-col p-4 overflow-y-auto shrink-0">
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-3 px-2">
                    Lộ trình SQL
                </h3>

                <div className="space-y-3">
                    {SQL_COURSES.map((group) => {
                        const isOpen = openCategory === group.category;
                        return (
                            <div key={group.category} className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenCategory(isOpen ? '' : group.category)}
                                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <span>{group.category}</span>
                                    <svg
                                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                            isOpen ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {isOpen && (
                                    <div className="pl-2 space-y-0.5 border-l-2 border-slate-100 ml-2">
                                        {group.lessons.map((lesson) => {
                                            const isCurrent = lesson.id === currentLesson.id;
                                            return (
                                                <Link
                                                    key={lesson.id}
                                                    href={`/learning?lesson=${lesson.id}`}
                                                    className={`block px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                                                        isCurrent
                                                            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60'
                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {lesson.title}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* Scrollable Lesson Content */}
            <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 max-w-5xl mx-auto space-y-8">
                {/* Breadcrumb & Title */}
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 font-medium">
                        <Link href="/learning" className="hover:text-blue-600 transition-colors">
                            Learning
                        </Link>
                        <span>/</span>
                        <span className="text-slate-600">{currentLesson.category}</span>
                        <span>/</span>
                        <span className="text-blue-600 font-bold">{currentLesson.title}</span>
                    </nav>

                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                        <h1 className="text-3xl font-black text-slate-950 tracking-tight">
                            {currentLesson.title}
                        </h1>
                        <button
                            type="button"
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isFavorite
                                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <svg
                                className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : 'fill-none'}`}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                            {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                        </button>
                    </div>

                    <p className="mt-3 text-sm text-slate-600 leading-relaxed font-normal">
                        {currentLesson.description}
                    </p>
                </div>

                {/* Learning Objectives Box */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-6 relative overflow-hidden">
                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-emerald-600/30">
                                ✓
                            </div>
                            <h2 className="text-base font-bold text-emerald-950">Mục tiêu bài học</h2>
                        </div>
                        <ul className="space-y-2 text-xs sm:text-sm text-emerald-900 font-medium pl-1">
                            {currentLesson.objectives.map((obj: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                                    <span>{obj}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Lesson Sections */}
                <div className="space-y-8">
                    {currentLesson.sections.map((sec: any) => (
                        <section key={sec.id} id={sec.id} className="space-y-3">
                            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200/80 pb-2">
                                {sec.heading}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {sec.content}
                            </p>

                            {/* Code Block */}
                            <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-md overflow-hidden font-mono text-xs">
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
                                    <div className="flex gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(sec.code, sec.id)}
                                        className="hover:text-white transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                                    >
                                        {copiedCode === sec.id ? 'Đã copy ✓' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="p-4 text-cyan-300 leading-relaxed overflow-x-auto">
                                    <code>{sec.code}</code>
                                </pre>
                            </div>

                            {/* Callout Note */}
                            <div
                                className={`p-4 rounded-xl text-xs sm:text-sm flex gap-3 border ${
                                    sec.noteType === 'tip'
                                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                                        : 'bg-blue-50 border-blue-200 text-blue-900'
                                }`}
                            >
                                <span className="text-base shrink-0">
                                    {sec.noteType === 'tip' ? '💡' : 'ℹ️'}
                                </span>
                                <div>
                                    <span className="font-bold mr-1">
                                        {sec.noteType === 'tip' ? 'Mẹo tối ưu:' : 'Giải thích:'}
                                    </span>
                                    <span>{sec.note}</span>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                {/* Bottom Lesson Navigation */}
                <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    {currentLesson.prevLessonId ? (
                        <Link
                            href={`/learning?lesson=${currentLesson.prevLessonId}`}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
                        >
                            ← Bài trước
                        </Link>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 text-xs font-bold cursor-not-allowed"
                        >
                            ← Bài trước
                        </button>
                    )}

                    {currentLesson.nextLessonId ? (
                        <Link
                            href={`/learning?lesson=${currentLesson.nextLessonId}`}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                        >
                            Bài tiếp theo: {currentLesson.nextLessonTitle} →
                        </Link>
                    ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                            Đã hoàn thành toàn bộ chuyên đề 🎉
                        </span>
                    )}
                </div>
            </main>

            {/* Right Floating TOC / Actions */}
            <aside className="w-72 border-l border-slate-200 bg-white hidden lg:flex flex-col p-6 overflow-y-auto shrink-0 gap-6">
                <div className="space-y-3">
                    <h4 className="text-xs font-black tracking-wider uppercase text-slate-400">
                        Nội dung bài học
                    </h4>
                    <nav className="space-y-1 text-xs">
                        {currentLesson.toc.map((item: any, idx: number) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                className={`block py-1.5 px-2 rounded-lg transition-colors ${
                                    idx === 0
                                        ? 'font-bold text-blue-600 bg-blue-50'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                {item.title}
                            </a>
                        ))}
                    </nav>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">Thực hành ngay</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Áp dụng kiến thức bài {currentLesson.title} với bài tập thực hành.
                    </p>
                    <Link
                        href={`/practice?topic=${currentLesson.id}`}
                        className="w-full inline-block py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                    >
                        Luyện tập ngay ⚡
                    </Link>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-blue-950">Bạn đã hiểu bài này chứ?</h4>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                        Đánh dấu hoàn thành để hệ thống cộng điểm streak và mở khóa bài tiếp theo.
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsUnderstood(!isUnderstood)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isUnderstood
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-100/50'
                        }`}
                    >
                        {isUnderstood ? '✓ Đã hoàn thành' : 'Đánh dấu đã hiểu'}
                    </button>
                </div>
            </aside>
        </div>
    );
}

export default function LearningPage() {
    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar */}
            <Sidebar />

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header userName="Duy Hoàng" streakCount={7} />
                <Suspense
                    fallback={
                        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                            Đang tải bài học...
                        </div>
                    }
                >
                    <LessonContent />
                </Suspense>
            </div>
        </div>
    );
}