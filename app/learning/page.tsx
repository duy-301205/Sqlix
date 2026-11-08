'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import learningService, {
    CurriculumCategory,
    LessonDetail,
    LessonSection,
    LessonSummary,
} from '@/services/learningService';
import { SQL_COURSES, LESSONS_DATABASE } from './data';

function LessonContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const lessonParam = searchParams.get('lesson') || searchParams.get('slug');

    // States lưu trữ dữ liệu
    const [curriculum, setCurriculum] = useState<CurriculumCategory[]>([]);
    const [currentLesson, setCurrentLesson] = useState<LessonDetail | null>(null);

    // States trạng thái tải và lỗi
    const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);
    const [isLoadingLesson, setIsLoadingLesson] = useState(true);
    const [curriculumError, setCurriculumError] = useState<string | null>(null);
    const [lessonError, setLessonError] = useState<string | null>(null);

    // Accordion sidebar & actions states
    const [openCategory, setOpenCategory] = useState<string>('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isBookmarking, setIsBookmarking] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoNavTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper hiển thị Toast tự tắt sau 4s
    const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage({ message, type });
        toastTimeoutRef.current = setTimeout(() => {
            setToastMessage(null);
        }, 4000);
    }, []);

    // 1. Fetch Curriculum (Danh mục & cây bài học)
    const fetchCurriculum = useCallback(async () => {
        setIsLoadingCurriculum(true);
        setCurriculumError(null);
        try {
            const data = await learningService.getCurriculum();
            if (Array.isArray(data)) {
                setCurriculum(data);
                if (data.length > 0) {
                    const firstCatName = data[0].category || data[0].name || data[0].title || '';
                    setOpenCategory((prev) => prev || firstCatName);
                } else {
                    setOpenCategory('');
                }
            } else {
                setCurriculum([]);
                setOpenCategory('');
            }
        } catch (err: any) {
            console.error('[Learning] Lỗi gọi API getCurriculum:', err);
            setCurriculum([]);
            setOpenCategory('');
            setCurriculumError(err?.response?.data?.message || err?.message || 'Không thể đồng bộ lộ trình từ máy chủ.');
        } finally {
            setIsLoadingCurriculum(false);
        }
    }, []);

    useEffect(() => {
        fetchCurriculum();
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            if (autoNavTimeoutRef.current) clearTimeout(autoNavTimeoutRef.current);
        };
    }, [fetchCurriculum]);

    // 2. Xác định slug của bài học cần tải
    const currentSlug = lessonParam || (curriculum[0]?.lessons?.[0]?.slug || curriculum[0]?.lessons?.[0]?.id || 'select');

    // 3. Fetch Lesson Detail theo slug
    const fetchLessonDetail = useCallback(async (slug: string) => {
        if (!slug) return;
        setIsLoadingLesson(true);
        setLessonError(null);

        try {
            const data = await learningService.getLessonDetail(slug);
            if (data && (data.id || data.slug || data.title)) {
                setCurrentLesson(data);
                if (data.category) {
                    setOpenCategory(data.category);
                }
            } else {
                throw new Error('Dữ liệu bài học không đúng định dạng');
            }
        } catch (err: any) {
            console.error(`[Learning] Lỗi tải bài học slug="${slug}":`, err);
            // Fallback sang LESSONS_DATABASE nếu có dữ liệu tương ứng
            const fallbackLesson = (LESSONS_DATABASE as Record<string, any>)[slug] || LESSONS_DATABASE.select;
            if (fallbackLesson) {
                console.warn(`[Learning] Đã kích hoạt fallback data cho bài học "${slug}"`);
                setCurrentLesson(fallbackLesson as any);
                setOpenCategory(fallbackLesson.category || '');
            } else {
                setLessonError(err?.response?.data?.message || err?.message || 'Không thể tải nội dung bài học.');
            }
        } finally {
            setIsLoadingLesson(false);
        }
    }, []);

    useEffect(() => {
        if (currentSlug) {
            fetchLessonDetail(currentSlug);
        }
    }, [currentSlug, fetchLessonDetail]);

    // Copy mã SQL vào Clipboard
    const handleCopy = (code: string, id: string) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // 4. Tương tác Yêu thích (Bookmark)
    const handleToggleBookmark = async () => {
        if (!currentLesson?.id || isBookmarking) return;

        setIsBookmarking(true);
        try {
            const newStatus = await learningService.toggleBookmark(currentLesson.id);
            setCurrentLesson((prev) => (prev ? { ...prev, isBookmarked: newStatus } : null));
            showToast(
                newStatus ? 'Đã thêm bài học vào danh sách yêu thích ❤️' : 'Đã xóa bài học khỏi danh sách yêu thích',
                'info'
            );
        } catch (error: any) {
            console.error('Lỗi khi toggle bookmark:', error);
            showToast('Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại!', 'error');
        } finally {
            setIsBookmarking(false);
        }
    };

    // 5. Tương tác Đánh dấu đã hiểu (Complete)
    const handleMarkCompleted = async () => {
        if (!currentLesson?.id || isCompleting) return;

        setIsCompleting(true);
        try {
            const success = await learningService.markLessonCompleted(currentLesson.id);
            if (success) {
                // Cập nhật trạng thái bài học hiện tại
                setCurrentLesson((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: 'COMPLETED',
                              isCompleted: true,
                          }
                        : null
                );

                // Cập nhật trạng thái completed trên cây Curriculum
                setCurriculum((prevCurriculum) =>
                    prevCurriculum.map((cat) => ({
                        ...cat,
                        lessons: cat.lessons.map((les) =>
                            les.id === currentLesson.id || les.slug === currentLesson.slug
                                ? { ...les, completed: true, isCompleted: true, status: 'COMPLETED' }
                                : les
                        ),
                    }))
                );

                // Xác định bài tiếp theo để điều hướng tự động
                const nextSlug = currentLesson.nextLessonSlug || currentLesson.nextLessonId;
                if (nextSlug) {
                    showToast('🎉 Tuyệt vời! Bạn đã hoàn thành bài học. Đang chuyển sang bài tiếp theo...', 'success');
                    if (autoNavTimeoutRef.current) clearTimeout(autoNavTimeoutRef.current);
                    autoNavTimeoutRef.current = setTimeout(() => {
                        router.push(`/learning?lesson=${encodeURIComponent(nextSlug)}`);
                    }, 1800);
                } else {
                    showToast('🎉 Chúc mừng! Bạn đã hoàn thành toàn bộ chuyên đề này!', 'success');
                }
            }
        } catch (error: any) {
            console.error('Lỗi khi đánh dấu hoàn thành:', error);
            showToast('Không thể lưu tiến độ học tập. Vui lòng thử lại!', 'error');
        } finally {
            setIsCompleting(false);
        }
    };

    // Kiểm tra trạng thái hoàn thành của bài học
    const isLessonCompleted = (lesson: LessonSummary | LessonDetail | null | undefined): boolean => {
        if (!lesson) return false;
        return (
            lesson.isCompleted === true ||
            lesson.completed === true ||
            lesson.status === 'COMPLETED' ||
            (lesson as any).status === 'completed'
        );
    };

    // Lấy bài học trước và tiếp theo (fallback qua curriculum nếu lessonDetail chưa có sẵn)
    const allLessons = curriculum.flatMap((c) => c.lessons || []);
    const currentIndex = allLessons.findIndex(
        (l) => (l.slug && l.slug === currentSlug) || l.id === currentSlug || (currentLesson && l.id === currentLesson.id)
    );

    const prevLessonItem =
        currentIndex > 0
            ? allLessons[currentIndex - 1]
            : null;

    const nextLessonItem =
        currentIndex >= 0 && currentIndex < allLessons.length - 1
            ? allLessons[currentIndex + 1]
            : null;

    const prevLessonHref = currentLesson?.prevLessonSlug
        ? `/learning?lesson=${encodeURIComponent(currentLesson.prevLessonSlug)}`
        : currentLesson?.prevLessonId
        ? `/learning?lesson=${encodeURIComponent(currentLesson.prevLessonId)}`
        : prevLessonItem
        ? `/learning?lesson=${encodeURIComponent(prevLessonItem.slug || prevLessonItem.id)}`
        : null;

    const nextLessonHref = currentLesson?.nextLessonSlug
        ? `/learning?lesson=${encodeURIComponent(currentLesson.nextLessonSlug)}`
        : currentLesson?.nextLessonId
        ? `/learning?lesson=${encodeURIComponent(currentLesson.nextLessonId)}`
        : nextLessonItem
        ? `/learning?lesson=${encodeURIComponent(nextLessonItem.slug || nextLessonItem.id)}`
        : null;

    const nextLessonTitle =
        currentLesson?.nextLessonTitle ||
        (nextLessonItem ? nextLessonItem.title : null);

    const currentIsCompleted = isLessonCompleted(currentLesson);
    const currentIsBookmarked = currentLesson?.isBookmarked ?? false;

    // Helper render Note Box linh hoạt
    const renderNoteBox = (section: LessonSection) => {
        let noteContent = '';
        let noteType = 'info';
        let noteTitle = '';

        if (section.noteBox) {
            if (typeof section.noteBox === 'object') {
                noteContent = section.noteBox.content || '';
                noteType = section.noteBox.type || 'info';
                noteTitle = section.noteBox.title || '';
            } else if (typeof section.noteBox === 'string') {
                noteContent = section.noteBox;
            }
        } else if (section.note) {
            noteContent = section.note;
            noteType = section.noteType || 'info';
        }

        if (!noteContent) return null;

        const isTip = noteType === 'tip';
        const isWarning = noteType === 'warning';

        const defaultTitle = isTip ? 'Mẹo tối ưu:' : isWarning ? 'Lưu ý quan trọng:' : 'Giải thích:';
        const icon = isTip ? '💡' : isWarning ? '⚠️' : 'ℹ️';
        const colorClasses = isTip
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : isWarning
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-blue-50 border-blue-200 text-blue-900';

        return (
            <div className={`p-4 rounded-xl text-xs sm:text-sm flex gap-3 border ${colorClasses}`}>
                <span className="text-base shrink-0">{icon}</span>
                <div className="space-y-0.5">
                    <span className="font-bold mr-1.5">{noteTitle || defaultTitle}</span>
                    <span className="leading-relaxed">{noteContent}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex overflow-hidden relative">
            {/* Toast Notification Container */}
            {toastMessage && (
                <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div
                        className={`px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold flex items-center gap-3 backdrop-blur-md ${
                            toastMessage.type === 'success'
                                ? 'bg-emerald-600/95 text-white border-emerald-500 shadow-emerald-500/20'
                                : toastMessage.type === 'error'
                                ? 'bg-rose-600/95 text-white border-rose-500 shadow-rose-500/20'
                                : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/30'
                        }`}
                    >
                        <span>{toastMessage.message}</span>
                        <button
                            type="button"
                            onClick={() => setToastMessage(null)}
                            className="text-white/80 hover:text-white ml-2 text-xs font-black cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Sub-Sidebar: Course Curriculum */}
            <aside className="w-64 border-r border-slate-200 bg-white hidden xl:flex flex-col p-4 overflow-y-auto shrink-0 select-none">
                <div className="flex items-center justify-between mb-3 px-2">
                    <h3 className="text-xs font-black tracking-wider uppercase text-slate-400">
                        Lộ trình SQL
                    </h3>
                    {curriculum.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            {allLessons.filter(isLessonCompleted).length}/{allLessons.length}
                        </span>
                    )}
                </div>

                {isLoadingCurriculum && curriculum.length === 0 ? (
                    <div className="space-y-3 px-2 py-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-8 bg-slate-100 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {curriculum.map((group, groupIdx) => {
                            const categoryName = group.category || group.name || group.title || `Chuyên đề ${groupIdx + 1}`;
                            const isOpen = openCategory === categoryName;
                            const groupLessons = group.lessons || [];
                            const completedCount = groupLessons.filter(isLessonCompleted).length;

                            return (
                                <div key={group.id || categoryName} className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => setOpenCategory(isOpen ? '' : categoryName)}
                                        className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="truncate">{categoryName}</span>
                                            {groupLessons.length > 0 && (
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    ({completedCount}/{groupLessons.length})
                                                </span>
                                            )}
                                        </div>
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
                                            {groupLessons.map((lesson) => {
                                                const targetSlug = lesson.slug || lesson.id;
                                                const isCurrent =
                                                    targetSlug === currentSlug ||
                                                    (currentLesson && lesson.id === currentLesson.id);
                                                const isCompleted = isLessonCompleted(lesson);

                                                return (
                                                    <Link
                                                        key={lesson.id || targetSlug}
                                                        href={`/learning?lesson=${encodeURIComponent(targetSlug)}`}
                                                        className={`flex items-center justify-between px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                                                            isCurrent
                                                                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-xs'
                                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <span className="truncate mr-2">{lesson.title}</span>
                                                        {isCompleted ? (
                                                            <span
                                                                title="Đã hoàn thành"
                                                                className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0"
                                                            >
                                                                ✓
                                                            </span>
                                                        ) : (
                                                            <span
                                                                title="Chưa học"
                                                                className="w-4 h-4 rounded-full border border-slate-200 text-transparent flex items-center justify-center text-[8px] shrink-0"
                                                            >
                                                                •
                                                            </span>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </aside>

            {/* Scrollable Lesson Content */}
            <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 max-w-5xl mx-auto space-y-8">
                {isLoadingLesson ? (
                    <div className="space-y-6 animate-pulse py-4">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-10 bg-slate-200 rounded w-2/3" />
                        <div className="h-24 bg-slate-100 rounded-2xl" />
                        <div className="h-40 bg-slate-100 rounded-2xl" />
                        <div className="h-32 bg-slate-100 rounded-2xl" />
                    </div>
                ) : lessonError ? (
                    <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-sm space-y-4 my-8">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xl font-bold">
                            ⚠️
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Không thể tải bài học</h2>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">{lessonError}</p>
                        <button
                            type="button"
                            onClick={() => fetchLessonDetail(currentSlug)}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
                        >
                            Thử tải lại bài học
                        </button>
                    </div>
                ) : currentLesson ? (
                    <>
                        {/* Breadcrumb & Title */}
                        <div>
                            <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 font-medium">
                                <Link href="/learning" className="hover:text-blue-600 transition-colors">
                                    Learning
                                </Link>
                                <span>/</span>
                                <span className="text-slate-600">
                                    {currentLesson.category || 'Lộ trình SQL'}
                                </span>
                                <span>/</span>
                                <span className="text-blue-600 font-bold">{currentLesson.title}</span>
                            </nav>

                            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                                <h1 className="text-3xl font-black text-slate-950 tracking-tight">
                                    {currentLesson.title}
                                </h1>
                                <button
                                    type="button"
                                    onClick={handleToggleBookmark}
                                    disabled={isBookmarking}
                                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                        currentIsBookmarked
                                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                    } ${isBookmarking ? 'opacity-60 cursor-wait' : ''}`}
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform ${
                                            currentIsBookmarked ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-current'
                                        }`}
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                    </svg>
                                    {currentIsBookmarked ? 'Đã yêu thích' : 'Yêu thích'}
                                </button>
                            </div>

                            {currentLesson.description && (
                                <p className="mt-3 text-sm text-slate-600 leading-relaxed font-normal">
                                    {currentLesson.description}
                                </p>
                            )}
                        </div>

                        {/* Learning Objectives Box (Mục tiêu bài học) */}
                        {Array.isArray(currentLesson.objectives) && currentLesson.objectives.length > 0 && (
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
                        )}

                        {/* Lesson Sections (Nội dung chi tiết từng phần) */}
                        <div className="space-y-8">
                            {Array.isArray(currentLesson.sections) &&
                                currentLesson.sections.map((sec: LessonSection) => {
                                    const sectionTitle = sec.title || sec.heading;
                                    const sectionCode = sec.sampleSql || sec.code;

                                    return (
                                        <section key={sec.id} id={sec.id} className="space-y-3 scroll-mt-6">
                                            {sectionTitle && (
                                                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200/80 pb-2">
                                                    {sectionTitle}
                                                </h3>
                                            )}
                                            {sec.content && (
                                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                                    {sec.content}
                                                </p>
                                            )}

                                            {/* Code Block (Sample SQL) */}
                                            {sectionCode && (
                                                <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-md overflow-hidden font-mono text-xs">
                                                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex gap-1.5">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold ml-2">
                                                                SQL
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(sectionCode, sec.id)}
                                                            className="hover:text-white transition-colors cursor-pointer text-[11px] flex items-center gap-1 font-sans"
                                                        >
                                                            {copiedCode === sec.id ? 'Đã copy ✓' : 'Sao chép'}
                                                        </button>
                                                    </div>
                                                    <pre className="p-4 text-cyan-300 leading-relaxed overflow-x-auto">
                                                        <code>{sectionCode}</code>
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Callout Note Box */}
                                            {renderNoteBox(sec)}
                                        </section>
                                    );
                                })}
                        </div>

                        {/* Bottom Lesson Navigation */}
                        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                            {prevLessonHref ? (
                                <Link
                                    href={prevLessonHref}
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

                            {nextLessonHref ? (
                                <Link
                                    href={nextLessonHref}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                                >
                                    {nextLessonTitle ? `Bài tiếp theo: ${nextLessonTitle} →` : 'Bài tiếp theo →'}
                                </Link>
                            ) : (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                                    Đã hoàn thành toàn bộ chuyên đề 🎉
                                </span>
                            )}
                        </div>
                    </>
                ) : null}
            </main>

            {/* Right Floating TOC / Actions */}
            <aside className="w-72 border-l border-slate-200 bg-white hidden lg:flex flex-col p-6 overflow-y-auto shrink-0 gap-6">
                {currentLesson && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-black tracking-wider uppercase text-slate-400">
                            Nội dung bài học
                        </h4>
                        <nav className="space-y-1 text-xs">
                            {(currentLesson.toc || currentLesson.sections || []).map((item: any, idx: number) => {
                                const itemId = item.id;
                                const itemTitle = item.title || item.heading;
                                if (!itemTitle) return null;
                                return (
                                    <a
                                        key={itemId || idx}
                                        href={`#${itemId}`}
                                        className={`block py-1.5 px-2 rounded-lg transition-colors ${
                                            idx === 0
                                                ? 'font-bold text-blue-600 bg-blue-50'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                    >
                                        {itemTitle}
                                    </a>
                                );
                            })}
                        </nav>
                    </div>
                )}

                {/* Card Thực hành */}
                {currentLesson && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center space-y-3">
                        <h4 className="text-sm font-bold text-slate-900">Thực hành ngay</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Áp dụng kiến thức bài {currentLesson.title} với bài tập thực hành.
                        </p>
                        <Link
                            href={`/practice?topic=${encodeURIComponent(currentLesson.slug || currentLesson.id)}`}
                            className="w-full inline-block py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                        >
                            Luyện tập ngay ⚡
                        </Link>
                    </div>
                )}

                {/* Card Đánh dấu đã hiểu */}
                {currentLesson && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-blue-950">Bạn đã hiểu bài này chứ?</h4>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                            Đánh dấu hoàn thành để hệ thống cộng điểm streak và mở khóa bài tiếp theo.
                        </p>
                        <button
                            type="button"
                            onClick={handleMarkCompleted}
                            disabled={isCompleting}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                                currentIsCompleted
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                                    : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-100/50'
                            } ${isCompleting ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isCompleting ? (
                                <span>Đang lưu tiến độ...</span>
                            ) : currentIsCompleted ? (
                                <>
                                    <span>✓</span>
                                    <span>Đã hoàn thành</span>
                                </>
                            ) : (
                                <span>Đánh dấu đã hiểu</span>
                            )}
                        </button>
                    </div>
                )}
            </aside>
        </div>
    );
}

export default function LearningPage() {
    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar hệ thống */}
            <Sidebar />

            {/* Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header />
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
