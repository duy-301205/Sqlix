'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import adminLearningService from '@/services/adminLearningService';
import { mockLearningCategories } from '../mockData';
import { LearningCategory, LessonItem, SectionItem } from '../types';

type ModalType = 'CATEGORY' | 'LESSON' | 'SECTION' | null;

interface DeleteTarget {
    type: 'CATEGORY' | 'LESSON' | 'SECTION';
    id: string;
    title: string;
    parentId?: string;
}

// Helper chuẩn hóa dữ liệu curriculum trả về từ Backend
const normalizeCurriculumData = (rawList: any[]): LearningCategory[] => {
    if (!Array.isArray(rawList)) return [];

    return rawList.map((cat: any, cIdx: number) => {
        const catId = String(cat.id || cat.categoryId || `cat-${cIdx + 1}`);
        const rawLessons = Array.isArray(cat.lessons) ? cat.lessons : [];

        const lessons: LessonItem[] = rawLessons.map((les: any, lIdx: number) => {
            const lessonId = String(les.id || les.lessonId || `les-${cIdx + 1}-${lIdx + 1}`);
            const rawSections = Array.isArray(les.sections) ? les.sections : [];

            const sections: SectionItem[] = rawSections.map((sec: any, sIdx: number) => ({
                id: String(sec.id || sec.sectionId || `sec-${sIdx + 1}`),
                title: sec.title || `Phần học ${sIdx + 1}`,
                orderIndex: sec.orderIndex ?? sec.sortOrder ?? sIdx + 1,
                contentMarkdown: sec.contentMarkdown || sec.content || '',
                sampleQuery: sec.sampleQuery || sec.sampleSql || '',
                expectedResult: sec.expectedResult || '',
                durationMinutes: sec.durationMinutes ?? 15,
                noteBox: sec.noteBox || null,
            }));

            return {
                id: lessonId,
                categoryId: catId,
                title: les.title || `Bài học ${lIdx + 1}`,
                slug: les.slug || les.title?.toLowerCase().replace(/\s+/g, '-') || `bai-hoc-${lIdx + 1}`,
                description: les.description || '',
                orderIndex: les.orderIndex ?? les.sortOrder ?? lIdx + 1,
                difficulty: (les.difficulty || 'BEGINNER') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
                isPublished: les.isPublished !== undefined ? Boolean(les.isPublished) : true,
                objectives: Array.isArray(les.objectives) ? les.objectives : [les.description || les.title],
                practiceTopicCode: les.practiceTopicCode || 'SQL_BASIC',
                sections,
            };
        });

        return {
            id: catId,
            title: cat.title || cat.name || `Danh mục ${cIdx + 1}`,
            slug: cat.slug || cat.title?.toLowerCase().replace(/\s+/g, '-') || `danh-muc-${cIdx + 1}`,
            description: cat.description || '',
            orderIndex: cat.orderIndex ?? cat.sortOrder ?? cIdx + 1,
            iconName: cat.iconName || 'BookOpen',
            colorTheme: cat.colorTheme || 'blue',
            lessons,
        };
    });
};

export default function AdminLearningPage() {
    const [categories, setCategories] = useState<LearningCategory[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Accordion: which lessons are expanded
    const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});

    // Modals
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [editingTarget, setEditingTarget] = useState<any | null>(null);

    // Form states
    const [categoryForm, setCategoryForm] = useState({
        title: '',
        slug: '',
        description: '',
        orderIndex: 1,
        colorTheme: 'blue',
    });

    const [lessonForm, setLessonForm] = useState({
        categoryId: '',
        title: '',
        slug: '',
        description: '',
        difficulty: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        orderIndex: 1,
        isPublished: true,
        practiceTopicCode: 'SQL_BASIC',
        objectivesText: '',
    });

    const [sectionForm, setSectionForm] = useState({
        lessonId: '',
        title: '',
        durationMinutes: 15,
        orderIndex: 1,
        contentMarkdown: '',
        sampleQuery: '',
        expectedResult: '',
    });

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // Toast
    const [toastMessage, setToastMessage] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage({ message, type });
        toastTimeoutRef.current = setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    }, []);

    // 1. Fetch Curriculum từ API
    const fetchCurriculum = useCallback(async () => {
        setIsLoading(true);
        try {
            const raw = await adminLearningService.getAdminCurriculum();
            if (Array.isArray(raw) && raw.length > 0) {
                const normalized = normalizeCurriculumData(raw);
                setCategories(normalized);
                setSelectedCategoryId((prev) => {
                    if (prev && normalized.some((c) => c.id === prev)) return prev;
                    return normalized[0]?.id || null;
                });
            } else {
                throw new Error('Dữ liệu lộ trình rỗng');
            }
        } catch (err: any) {
            console.warn('[AdminLearning] Không thể tải cây danh mục từ API, kích hoạt mock data fallback:', err.message);
            const fallback = normalizeCurriculumData(mockLearningCategories);
            setCategories(fallback);
            setSelectedCategoryId((prev) => prev || fallback[0]?.id || null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurriculum();
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, [fetchCurriculum]);

    // Active Category
    const activeCategory = useMemo(() => {
        return categories.find((c) => c.id === selectedCategoryId) || categories[0] || null;
    }, [categories, selectedCategoryId]);

    // Lessons in active category
    const filteredLessons = useMemo(() => {
        if (!activeCategory) return [];
        if (!searchQuery.trim()) return activeCategory.lessons;

        return activeCategory.lessons.filter(
            (l) =>
                l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.sections.some((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [activeCategory, searchQuery]);

    const toggleLessonExpand = (lessonId: string) => {
        setExpandedLessons((prev) => ({
            ...prev,
            [lessonId]: !prev[lessonId],
        }));
    };

    // ================= Category CRUD =================
    const handleOpenCategoryModal = (cat?: LearningCategory) => {
        if (cat) {
            setEditingTarget(cat);
            setCategoryForm({
                title: cat.title,
                slug: cat.slug,
                description: cat.description,
                orderIndex: cat.orderIndex,
                colorTheme: cat.colorTheme,
            });
        } else {
            setEditingTarget(null);
            setCategoryForm({
                title: '',
                slug: '',
                description: '',
                orderIndex: categories.length + 1,
                colorTheme: 'blue',
            });
        }
        setActiveModal('CATEGORY');
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            name: categoryForm.title,
            description: categoryForm.description,
            sortOrder: Number(categoryForm.orderIndex),
            slug: categoryForm.slug || categoryForm.title.toLowerCase().replace(/\s+/g, '-'),
        };

        try {
            if (editingTarget) {
                await adminLearningService.updateCategory(editingTarget.id, payload);
                showToast(`Đã cập nhật danh mục "${categoryForm.title}" thành công!`, 'success');
            } else {
                await adminLearningService.createCategory(payload);
                showToast(`Đã tạo mới danh mục "${categoryForm.title}" thành công!`, 'success');
            }
            setActiveModal(null);
            await fetchCurriculum();
        } catch (err: any) {
            console.error('[AdminLearning] Lỗi khi lưu danh mục:', err);
            // Fallback optimistic update
            if (editingTarget) {
                setCategories((prev) =>
                    prev.map((c) => (c.id === editingTarget.id ? { ...c, ...categoryForm } : c))
                );
                showToast('Đã lưu thay đổi danh mục (chế độ cục bộ).', 'success');
            } else {
                const newCat: LearningCategory = {
                    id: `cat-${Date.now()}`,
                    title: categoryForm.title,
                    slug: categoryForm.slug || categoryForm.title.toLowerCase().replace(/\s+/g, '-'),
                    description: categoryForm.description,
                    orderIndex: Number(categoryForm.orderIndex),
                    iconName: 'BookOpen',
                    colorTheme: categoryForm.colorTheme,
                    lessons: [],
                };
                setCategories((prev) => [...prev, newCat]);
                setSelectedCategoryId(newCat.id);
                showToast('Đã tạo danh mục mới (chế độ cục bộ).', 'success');
            }
            setActiveModal(null);
        } finally {
            setIsSaving(false);
        }
    };

    // ================= Lesson CRUD =================
    const handleOpenLessonModal = (targetCategoryId: string, lesson?: LessonItem) => {
        if (lesson) {
            setEditingTarget(lesson);
            setLessonForm({
                categoryId: lesson.categoryId,
                title: lesson.title,
                slug: (lesson as any).slug || '',
                description: lesson.description,
                difficulty: lesson.difficulty,
                orderIndex: lesson.orderIndex,
                isPublished: lesson.isPublished,
                practiceTopicCode: (lesson as any).practiceTopicCode || 'SQL_BASIC',
                objectivesText: ((lesson as any).objectives || []).join('\n'),
            });
        } else {
            setEditingTarget(null);
            const currentCat = categories.find((c) => c.id === targetCategoryId);
            setLessonForm({
                categoryId: targetCategoryId,
                title: '',
                slug: '',
                description: '',
                difficulty: 'BEGINNER',
                orderIndex: (currentCat?.lessons.length || 0) + 1,
                isPublished: true,
                practiceTopicCode: 'SQL_BASIC',
                objectivesText: '',
            });
        }
        setActiveModal('LESSON');
    };

    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const objectives = lessonForm.objectivesText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);

        const payload = {
            categoryId: lessonForm.categoryId,
            title: lessonForm.title,
            slug: lessonForm.slug || lessonForm.title.toLowerCase().replace(/\s+/g, '-'),
            description: lessonForm.description,
            objectives: objectives.length > 0 ? objectives : [lessonForm.description || lessonForm.title],
            practiceTopicCode: lessonForm.practiceTopicCode || 'SQL_BASIC',
            sortOrder: Number(lessonForm.orderIndex),
            difficulty: lessonForm.difficulty,
            isPublished: lessonForm.isPublished,
        };

        try {
            if (editingTarget) {
                await adminLearningService.updateLesson(editingTarget.id, payload);
                showToast(`Đã cập nhật bài học "${lessonForm.title}" thành công!`, 'success');
            } else {
                await adminLearningService.createLesson(payload);
                showToast(`Đã tạo mới bài học "${lessonForm.title}" thành công!`, 'success');
            }
            setActiveModal(null);
            await fetchCurriculum();
        } catch (err: any) {
            console.error('[AdminLearning] Lỗi khi lưu bài học:', err);
            // Fallback optimistic update
            if (editingTarget) {
                setCategories((prev) =>
                    prev.map((c) => {
                        if (c.id !== editingTarget.categoryId) return c;
                        return {
                            ...c,
                            lessons: c.lessons.map((l) =>
                                l.id === editingTarget.id ? { ...l, ...lessonForm } : l
                            ),
                        };
                    })
                );
                showToast('Đã lưu bài học (chế độ cục bộ).', 'success');
            } else {
                const newLesson: LessonItem = {
                    id: `les-${Date.now()}`,
                    categoryId: lessonForm.categoryId,
                    title: lessonForm.title,
                    description: lessonForm.description,
                    difficulty: lessonForm.difficulty,
                    orderIndex: Number(lessonForm.orderIndex),
                    isPublished: lessonForm.isPublished,
                    sections: [],
                };
                setCategories((prev) =>
                    prev.map((c) => {
                        if (c.id !== lessonForm.categoryId) return c;
                        return {
                            ...c,
                            lessons: [...c.lessons, newLesson],
                        };
                    })
                );
                setExpandedLessons((prev) => ({ ...prev, [newLesson.id]: true }));
                showToast('Đã tạo bài học mới (chế độ cục bộ).', 'success');
            }
            setActiveModal(null);
        } finally {
            setIsSaving(false);
        }
    };

    // ================= Section CRUD =================
    const handleOpenSectionModal = (targetLessonId: string, section?: SectionItem) => {
        if (section) {
            setEditingTarget(section);
            setSectionForm({
                lessonId: targetLessonId,
                title: section.title,
                durationMinutes: section.durationMinutes,
                orderIndex: section.orderIndex,
                contentMarkdown: section.contentMarkdown || '',
                sampleQuery: section.sampleQuery || '',
                expectedResult: section.expectedResult || '',
            });
        } else {
            setEditingTarget(null);
            setSectionForm({
                lessonId: targetLessonId,
                title: '',
                durationMinutes: 15,
                orderIndex: 1,
                contentMarkdown: '',
                sampleQuery: '',
                expectedResult: '',
            });
        }
        setActiveModal('SECTION');
    };

    const handleSaveSection = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            title: sectionForm.title,
            content: sectionForm.contentMarkdown,
            sampleSql: sectionForm.sampleQuery,
            noteBox: null,
            sortOrder: Number(sectionForm.orderIndex),
            durationMinutes: Number(sectionForm.durationMinutes),
        };

        try {
            if (editingTarget) {
                await adminLearningService.updateSection(editingTarget.id, payload);
                showToast(`Đã cập nhật section "${sectionForm.title}" thành công!`, 'success');
            } else {
                await adminLearningService.createSection(sectionForm.lessonId, payload);
                showToast(`Đã tạo mới section "${sectionForm.title}" thành công!`, 'success');
            }
            setActiveModal(null);
            await fetchCurriculum();
        } catch (err: any) {
            console.error('[AdminLearning] Lỗi khi lưu section:', err);
            // Fallback optimistic update
            if (editingTarget) {
                setCategories((prev) =>
                    prev.map((cat) => ({
                        ...cat,
                        lessons: cat.lessons.map((les) => {
                            if (les.id !== sectionForm.lessonId) return les;
                            return {
                                ...les,
                                sections: les.sections.map((sec) =>
                                    sec.id === editingTarget.id ? { ...sec, ...sectionForm } : sec
                                ),
                            };
                        }),
                    }))
                );
                showToast('Đã lưu section (chế độ cục bộ).', 'success');
            } else {
                const newSec: SectionItem = {
                    id: `sec-${Date.now()}`,
                    title: sectionForm.title,
                    orderIndex: Number(sectionForm.orderIndex),
                    durationMinutes: Number(sectionForm.durationMinutes),
                    contentMarkdown: sectionForm.contentMarkdown,
                    sampleQuery: sectionForm.sampleQuery,
                    expectedResult: sectionForm.expectedResult,
                };
                setCategories((prev) =>
                    prev.map((cat) => ({
                        ...cat,
                        lessons: cat.lessons.map((les) => {
                            if (les.id !== sectionForm.lessonId) return les;
                            return {
                                ...les,
                                sections: [...les.sections, newSec],
                            };
                        }),
                    }))
                );
                showToast('Đã tạo section mới (chế độ cục bộ).', 'success');
            }
            setActiveModal(null);
        } finally {
            setIsSaving(false);
        }
    };

    // ================= Delete Confirm =================
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);

        try {
            if (deleteTarget.type === 'CATEGORY') {
                await adminLearningService.deleteCategory(deleteTarget.id);
                showToast(`Đã xóa danh mục "${deleteTarget.title}" thành công!`, 'success');
            } else if (deleteTarget.type === 'LESSON') {
                await adminLearningService.deleteLesson(deleteTarget.id);
                showToast(`Đã xóa bài học "${deleteTarget.title}" thành công!`, 'success');
            } else if (deleteTarget.type === 'SECTION') {
                await adminLearningService.deleteSection(deleteTarget.id);
                showToast(`Đã xóa phần học "${deleteTarget.title}" thành công!`, 'success');
            }
            setDeleteTarget(null);
            await fetchCurriculum();
        } catch (err: any) {
            console.error('[AdminLearning] Lỗi khi xóa:', err);
            // Fallback optimistic delete
            if (deleteTarget.type === 'CATEGORY') {
                setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            } else if (deleteTarget.type === 'LESSON') {
                setCategories((prev) =>
                    prev.map((c) => ({
                        ...c,
                        lessons: c.lessons.filter((l) => l.id !== deleteTarget.id),
                    }))
                );
            } else if (deleteTarget.type === 'SECTION') {
                setCategories((prev) =>
                    prev.map((c) => ({
                        ...c,
                        lessons: c.lessons.map((l) => ({
                            ...l,
                            sections: l.sections.filter((s) => s.id !== deleteTarget.id),
                        })),
                    }))
                );
            }
            showToast(`Đã xóa "${deleteTarget.title}" (chế độ cục bộ).`, 'success');
            setDeleteTarget(null);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden w-full h-full bg-[#f8fafc] text-slate-800 antialiased font-sans">
            {/* ========================================================================= */}
            {/* LEFT PANE: MASTER CATEGORIES LIST (SIDEBAR DANH MỤC LỘ TRÌNH)             */}
            {/* ========================================================================= */}
            <aside className="w-80 sm:w-96 border-r border-slate-200/80 bg-white flex flex-col shrink-0 h-full">
                {/* Header Pane */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            Lộ Trình Học Tập
                        </h2>
                        <span className="text-xs text-slate-400">
                            {categories.length} danh mục khóa học
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleOpenCategoryModal()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title="Tạo danh mục mới"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Thêm DM</span>
                    </button>
                </div>

                {/* Categories List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {isLoading ? (
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                            </div>
                        ))
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                            Chưa có danh mục nào. Bấm &quot;Thêm DM&quot; để bắt đầu.
                        </div>
                    ) : (
                        categories.map((cat, idx) => {
                            const isSelected = cat.id === selectedCategoryId;
                            const lessonCount = cat.lessons?.length || 0;
                            const sectionCount = (cat.lessons || []).reduce(
                                (acc, l) => acc + (l.sections?.length || 0),
                                0
                            );

                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none group relative ${
                                        isSelected
                                            ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                                            : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {idx + 1}
                                            </span>
                                            <h3
                                                className={`text-xs font-bold truncate ${
                                                    isSelected ? 'text-blue-900' : 'text-slate-800'
                                                }`}
                                            >
                                                {cat.title}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenCategoryModal(cat);
                                                }}
                                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white transition-colors cursor-pointer"
                                                title="Sửa danh mục"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget({
                                                        type: 'CATEGORY',
                                                        id: cat.id,
                                                        title: cat.title,
                                                    });
                                                }}
                                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors cursor-pointer"
                                                title="Xóa danh mục"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                                        {cat.description || 'Chưa có mô tả danh mục.'}
                                    </p>

                                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-400">
                                        <span className="text-slate-600">📚 {lessonCount} bài học</span>
                                        <span>•</span>
                                        <span>📄 {sectionCount} sections</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* ========================================================================= */}
            {/* RIGHT PANE: DETAIL VIEW (ACTIVE CATEGORY + LESSONS + SECTIONS)             */}
            {/* ========================================================================= */}
            <main className="flex-1 h-full overflow-y-auto p-6 md:p-8 min-w-0">
                {activeCategory ? (
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Active Category Header Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                        Danh Mục #{activeCategory.orderIndex}
                                    </span>
                                    <h2 className="text-lg font-black text-slate-900 truncate">
                                        {activeCategory.title}
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                                    {activeCategory.description || 'Chưa có phần giới thiệu danh mục.'}
                                </p>
                                <div className="flex items-center gap-3 pt-1 text-[11px] font-bold text-slate-400">
                                    <span className="text-blue-600">📚 {activeCategory.lessons.length} bài học</span>
                                    <span>•</span>
                                    <span>
                                        📄{' '}
                                        {activeCategory.lessons.reduce((acc, l) => acc + l.sections.length, 0)}{' '}
                                        phần học (sections)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleOpenCategoryModal(activeCategory)}
                                    className="p-2.5 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                    title="Chỉnh sửa danh mục"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleOpenLessonModal(activeCategory.id)}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Thêm Bài Học Mới</span>
                                </button>
                            </div>
                        </div>

                        {/* Search Input Bar */}
                        <div className="w-full max-w-md flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-2xs">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm bài học hoặc phần học (section)..."
                                className="w-full bg-transparent border-none p-0 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Lessons List (Accordion) */}
                        <div className="space-y-4">
                            {filteredLessons.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200">
                                    Chưa có bài học nào trong danh mục này. Bấm &quot;Thêm Bài Học Mới&quot; để tạo bài học đầu tiên.
                                </div>
                            ) : (
                                filteredLessons.map((lesson, lessonIndex) => {
                                    const isExpanded = !!expandedLessons[lesson.id];
                                    return (
                                        <div
                                            key={lesson.id}
                                            className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
                                        >
                                            {/* Lesson Header */}
                                            <div
                                                onClick={() => toggleLessonExpand(lesson.id)}
                                                className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center shrink-0">
                                                        {lessonIndex + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-sm font-bold text-slate-900 truncate">
                                                                {lesson.title}
                                                            </h4>
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                    lesson.difficulty === 'BEGINNER'
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                                                        : lesson.difficulty === 'INTERMEDIATE'
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                                                                        : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                                                                }`}
                                                            >
                                                                {lesson.difficulty}
                                                            </span>
                                                            {!lesson.isPublished && (
                                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                                    Bản nháp
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                                            {lesson.sections.length} phần học • {lesson.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenSectionModal(lesson.id);
                                                        }}
                                                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                                    >
                                                        <span>+ Section</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenLessonModal(activeCategory.id, lesson);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                                                        title="Sửa bài học"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteTarget({
                                                                type: 'LESSON',
                                                                id: lesson.id,
                                                                title: lesson.title,
                                                                parentId: activeCategory.id,
                                                            });
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                                                        title="Xóa bài học"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>

                                                    <div className="p-1.5 text-slate-400">
                                                        <svg
                                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                                isExpanded ? 'rotate-180' : ''
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sections Drawer */}
                                            {isExpanded && (
                                                <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-2.5">
                                                    {lesson.sections.length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic py-2 pl-2">
                                                            Chưa có section nào. Bấm &quot;+ Section&quot; ở trên để tạo nội dung học.
                                                        </p>
                                                    ) : (
                                                        lesson.sections.map((section, secIdx) => (
                                                            <div
                                                                key={section.id}
                                                                className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/70 hover:border-blue-300 transition-all shadow-2xs"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                        {secIdx + 1}
                                                                    </span>
                                                                    <div className="min-w-0">
                                                                        <h5 className="text-xs font-bold text-slate-800 truncate">
                                                                            {section.title}
                                                                        </h5>
                                                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                                            <span>⏱️ {section.durationMinutes} phút</span>
                                                                            {section.sampleQuery && (
                                                                                <>
                                                                                    <span>•</span>
                                                                                    <span className="text-blue-600 font-mono text-[9px] bg-blue-50 px-1.5 py-0.5 rounded font-bold border border-blue-100">
                                                                                        SQL Query
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenSectionModal(lesson.id, section)}
                                                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                                                        title="Sửa section"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setDeleteTarget({
                                                                                type: 'SECTION',
                                                                                id: section.id,
                                                                                title: section.title,
                                                                                parentId: lesson.id,
                                                                            })
                                                                        }
                                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                                                                        title="Xóa section"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80">
                        Vui lòng chọn hoặc tạo một Danh mục lộ trình ở cột bên trái.
                    </div>
                )}
            </main>

            {/* ================= Modal: Create / Edit Category ================= */}
            {activeModal === 'CATEGORY' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-300/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    {editingTarget ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Lộ Trình'}
                                </h3>
                                <p className="text-xs text-slate-400">Thiết lập thông tin danh mục bài học</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Tiêu đề danh mục <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={categoryForm.title}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                                        placeholder="Ví dụ: SQL Nâng Cao & Tối Ưu Truy Vấn"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Slug URL</label>
                                        <input
                                            type="text"
                                            value={categoryForm.slug}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                                            placeholder="sql-nang-cao"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự hiển thị</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={categoryForm.orderIndex}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, orderIndex: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả tóm tắt</label>
                                    <textarea
                                        rows={3}
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        placeholder="Mô tả nội dung học viên sẽ đạt được sau danh mục này..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer ${
                                        isSaving ? 'opacity-70 cursor-wait' : ''
                                    }`}
                                >
                                    {isSaving ? 'Đang lưu...' : editingTarget ? 'Lưu thay đổi' : 'Tạo danh mục'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= Modal: Create / Edit Lesson ================= */}
            {activeModal === 'LESSON' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-300/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[88vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    {editingTarget ? 'Chỉnh Sửa Bài Học' : 'Thêm Bài Học Mới'}
                                </h3>
                                <p className="text-xs text-slate-400">Thiết lập thông tin bài học và độ khó</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveLesson} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Tiêu đề bài học <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={lessonForm.title}
                                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                        placeholder="Ví dụ: Kỹ thuật GROUP BY và HAVING trong SQL"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Slug URL</label>
                                        <input
                                            type="text"
                                            value={lessonForm.slug}
                                            onChange={(e) => setLessonForm({ ...lessonForm, slug: e.target.value })}
                                            placeholder="group-by-having"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Mã chủ đề (Topic Code)</label>
                                        <input
                                            type="text"
                                            value={lessonForm.practiceTopicCode}
                                            onChange={(e) => setLessonForm({ ...lessonForm, practiceTopicCode: e.target.value })}
                                            placeholder="SQL_BASIC"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ khó</label>
                                        <select
                                            value={lessonForm.difficulty}
                                            onChange={(e) => setLessonForm({ ...lessonForm, difficulty: e.target.value as any })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                        >
                                            <option value="BEGINNER">BEGINNER (Cơ bản)</option>
                                            <option value="INTERMEDIATE">INTERMEDIATE (Trung cấp)</option>
                                            <option value="ADVANCED">ADVANCED (Nâng cao)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự bài</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={lessonForm.orderIndex}
                                            onChange={(e) => setLessonForm({ ...lessonForm, orderIndex: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả bài học</label>
                                    <textarea
                                        rows={2}
                                        value={lessonForm.description}
                                        onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                                        placeholder="Khái quát nội dung và mục tiêu người học sẽ nắm được..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mục tiêu bài học (Mỗi dòng 1 mục tiêu)</label>
                                    <textarea
                                        rows={2}
                                        value={lessonForm.objectivesText}
                                        onChange={(e) => setLessonForm({ ...lessonForm, objectivesText: e.target.value })}
                                        placeholder="Hiểu cách gom nhóm dòng dữ liệu&#10;Áp dụng điều kiện lọc trên nhóm với HAVING"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="publishCheck"
                                        checked={lessonForm.isPublished}
                                        onChange={(e) => setLessonForm({ ...lessonForm, isPublished: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="publishCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                                        Xuất bản ngay (Hiển thị cho học viên trên trang học tập)
                                    </label>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer ${
                                        isSaving ? 'opacity-70 cursor-wait' : ''
                                    }`}
                                >
                                    {isSaving ? 'Đang lưu...' : editingTarget ? 'Lưu thay đổi' : 'Tạo bài học'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= Modal: Create / Edit Section ================= */}
            {activeModal === 'SECTION' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-slate-300/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    {editingTarget ? 'Chỉnh Sửa Section' : 'Thêm Section Mới'}
                                </h3>
                                <p className="text-xs text-slate-400">Soạn thảo lý thuyết và câu truy vấn SQL mẫu</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveSection} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Tiêu đề phần học (Section Title) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={sectionForm.title}
                                        onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                                        placeholder="Ví dụ: Cú pháp mệnh đề WHERE và điều kiện lọc"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Thời lượng ước tính (phút)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={sectionForm.durationMinutes}
                                            onChange={(e) => setSectionForm({ ...sectionForm, durationMinutes: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Thứ tự trong bài học
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={sectionForm.orderIndex}
                                            onChange={(e) => setSectionForm({ ...sectionForm, orderIndex: Number(e.target.value) })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nội dung lý thuyết (Markdown)
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={sectionForm.contentMarkdown}
                                        onChange={(e) => setSectionForm({ ...sectionForm, contentMarkdown: e.target.value })}
                                        placeholder="Nhập nội dung bài giảng dưới định dạng Markdown..."
                                        className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Câu lệnh SQL mẫu minh họa (Sample Query)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={sectionForm.sampleQuery}
                                        onChange={(e) => setSectionForm({ ...sectionForm, sampleQuery: e.target.value })}
                                        placeholder="SELECT * FROM users WHERE status = 'ACTIVE';"
                                        className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-blue-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Mô tả kết quả kỳ vọng (Expected Result)
                                    </label>
                                    <input
                                        type="text"
                                        value={sectionForm.expectedResult}
                                        onChange={(e) => setSectionForm({ ...sectionForm, expectedResult: e.target.value })}
                                        placeholder="Trả về các bản ghi người dùng đang hoạt động"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer ${
                                        isSaving ? 'opacity-70 cursor-wait' : ''
                                    }`}
                                >
                                    {isSaving ? 'Đang lưu...' : editingTarget ? 'Lưu section' : 'Tạo section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= Delete Confirmation Dialog ================= */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-slate-300/80 animate-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">
                            Xác Nhận Xóa {deleteTarget.type === 'CATEGORY' ? 'Danh Mục' : deleteTarget.type === 'LESSON' ? 'Bài Học' : 'Section'}?
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            Bạn có chắc chắn muốn xóa <span className="font-bold text-slate-800">&quot;{deleteTarget.title}&quot;</span>?
                            {deleteTarget.type === 'CATEGORY' && ' Mọi bài học và section thuộc danh mục này cũng sẽ bị xóa bỏ vĩnh viễn.'}
                            {deleteTarget.type === 'LESSON' && ' Mọi section thuộc bài học này cũng sẽ bị xóa bỏ.'}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleConfirmDelete}
                                className={`px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isDeleting ? 'opacity-70 cursor-wait' : ''
                                }`}
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang xóa...</span>
                                    </>
                                ) : (
                                    <span>Xác nhận xóa</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= Toast Container ================= */}
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
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
