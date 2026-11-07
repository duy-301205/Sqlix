'use client';

import { useState, useMemo } from 'react';
import { mockLearningCategories } from '../mockData';
import { LearningCategory, LessonItem, SectionItem } from '../types';

type ModalType = 'CATEGORY' | 'LESSON' | 'SECTION' | null;

interface DeleteTarget {
    type: 'CATEGORY' | 'LESSON' | 'SECTION';
    id: string;
    title: string;
    parentId?: string;
}

export default function AdminLearningPage() {
    const [categories, setCategories] = useState<LearningCategory[]>(mockLearningCategories);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
        categories[0]?.id || null
    );

    // Accordion: which lessons are expanded
    const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({
        'les-1': true,
    });

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
        description: '',
        difficulty: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        orderIndex: 1,
        isPublished: true,
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

    // Stats
    const totalCategoriesCount = categories.length;
    const totalLessonsCount = categories.reduce((acc, cat) => acc + cat.lessons.length, 0);
    const totalSectionsCount = categories.reduce(
        (acc, cat) => acc + cat.lessons.reduce((sub, les) => sub + les.sections.length, 0),
        0
    );

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

    const handleSaveCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTarget) {
            console.log(`[API PUT]: /api/admin/categories/${editingTarget.id}`, categoryForm);
            setCategories((prev) =>
                prev.map((c) => (c.id === editingTarget.id ? { ...c, ...categoryForm } : c))
            );
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
            console.log('[API POST]: /api/admin/categories', newCat);
            setCategories((prev) => [...prev, newCat]);
            setSelectedCategoryId(newCat.id);
        }
        setActiveModal(null);
    };

    // ================= Lesson CRUD =================
    const handleOpenLessonModal = (targetCategoryId: string, lesson?: LessonItem) => {
        if (lesson) {
            setEditingTarget(lesson);
            setLessonForm({
                categoryId: lesson.categoryId,
                title: lesson.title,
                description: lesson.description,
                difficulty: lesson.difficulty,
                orderIndex: lesson.orderIndex,
                isPublished: lesson.isPublished,
            });
        } else {
            setEditingTarget(null);
            const currentCat = categories.find((c) => c.id === targetCategoryId);
            setLessonForm({
                categoryId: targetCategoryId,
                title: '',
                description: '',
                difficulty: 'BEGINNER',
                orderIndex: (currentCat?.lessons.length || 0) + 1,
                isPublished: true,
            });
        }
        setActiveModal('LESSON');
    };

    const handleSaveLesson = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTarget) {
            console.log(`[API PUT]: /api/admin/lessons/${editingTarget.id}`, lessonForm);
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
            console.log('[API POST]: /api/admin/lessons', newLesson);
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
        }
        setActiveModal(null);
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

    const handleSaveSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTarget) {
            console.log(`[API PUT]: /api/admin/sections/${editingTarget.id}`, sectionForm);
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
        } else {
            const newSec: SectionItem = {
                id: `sec-${Date.now()}`,
                title: sectionForm.title,
                durationMinutes: Number(sectionForm.durationMinutes),
                orderIndex: Number(sectionForm.orderIndex),
                contentMarkdown: sectionForm.contentMarkdown,
                sampleQuery: sectionForm.sampleQuery,
                expectedResult: sectionForm.expectedResult,
            };
            console.log('[API POST]: /api/admin/sections', newSec);
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
        }
        setActiveModal(null);
    };

    // ================= Delete Execution =================
    const handleConfirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'CATEGORY') {
            console.log(`[API DELETE]: /api/admin/categories/${deleteTarget.id}`);
            setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            if (selectedCategoryId === deleteTarget.id) {
                const remaining = categories.filter((c) => c.id !== deleteTarget.id);
                setSelectedCategoryId(remaining[0]?.id || null);
            }
        } else if (deleteTarget.type === 'LESSON') {
            console.log(`[API DELETE]: /api/admin/lessons/${deleteTarget.id}`);
            setCategories((prev) =>
                prev.map((cat) => ({
                    ...cat,
                    lessons: cat.lessons.filter((les) => les.id !== deleteTarget.id),
                }))
            );
        } else if (deleteTarget.type === 'SECTION') {
            console.log(`[API DELETE]: /api/admin/sections/${deleteTarget.id}`);
            setCategories((prev) =>
                prev.map((cat) => ({
                    ...cat,
                    lessons: cat.lessons.map((les) => ({
                        ...les,
                        sections: les.sections.filter((sec) => sec.id !== deleteTarget.id),
                    })),
                }))
            );
        }

        setDeleteTarget(null);
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden min-w-0">
            {/* Top Toolbar */}
            <div className="px-6 md:px-10 py-4 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            Quản Lý Lộ Trình Học Tập 📚
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{totalCategoriesCount} Danh mục</span>
                            <span>•</span>
                            <span>{totalLessonsCount} Bài học</span>
                            <span>•</span>
                            <span>{totalSectionsCount} Sections</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleOpenCategoryModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Thêm Danh Mục Mới</span>
                    </button>
                </div>
            </div>

            {/* Split View: Left Categories Sub-Sidebar + Right Lessons Detail */}
            <div className="flex-1 flex overflow-hidden min-w-0">
                {/* Left 1: Category Master List */}
                <aside className="w-80 shrink-0 h-full bg-white border-r border-slate-200/80 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Danh Mục Lộ Trình
                        </span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                            {categories.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {categories.map((cat, idx) => {
                            const isSelected = cat.id === activeCategory?.id;
                            const lessonCount = cat.lessons.length;
                            const sectionCount = cat.lessons.reduce((acc, l) => acc + l.sections.length, 0);

                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group text-left ${
                                        isSelected
                                            ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <h4 className={`text-xs font-bold truncate ${
                                                isSelected ? 'text-blue-900' : 'text-slate-800'
                                            }`}>
                                                {cat.title}
                                            </h4>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenCategoryModal(cat);
                                                }}
                                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-white"
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
                                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-white"
                                                title="Xóa danh mục"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                                        {cat.description}
                                    </p>

                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-400">
                                        <span className="text-slate-600">📖 {lessonCount} bài học</span>
                                        <span>•</span>
                                        <span>📄 {sectionCount} sections</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Right 2: Detail Lessons & Sections */}
                <main className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 min-w-0 bg-[#f8f9ff]/40">
                    {activeCategory ? (
                        <div className="space-y-6 max-w-5xl mx-auto">
                            {/* Category Banner Card */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                            Danh Mục #{activeCategory.orderIndex}
                                        </span>
                                        <h3 className="text-lg font-black text-slate-900">
                                            {activeCategory.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-500 max-w-xl">
                                        {activeCategory.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleOpenLessonModal(activeCategory.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Thêm Bài Học Mới</span>
                                    </button>
                                </div>
                            </div>

                            {/* Search Bar in Category: Flex container không bị đè icon */}
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200/80 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-2xs">
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
                                                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                                            >
                                                {/* Lesson Header */}
                                                <div
                                                    onClick={() => toggleLessonExpand(lesson.id)}
                                                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center shrink-0">
                                                            {lessonIndex + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                                                    {lesson.title}
                                                                </h4>
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                    lesson.difficulty === 'BEGINNER'
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        : lesson.difficulty === 'INTERMEDIATE'
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                }`}>
                                                                    {lesson.difficulty}
                                                                </span>
                                                                {!lesson.isPublished && (
                                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                                                                        Bản nháp
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                                                {lesson.description}
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
                                                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                        >
                                                            + Thêm Section
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenLessonModal(activeCategory.id, lesson);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
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
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                                                            title="Xóa bài học"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>

                                                        <svg
                                                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
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

                                                {/* Sections Content Drawer */}
                                                {isExpanded && (
                                                    <div className="p-4 bg-white border-t border-slate-100 space-y-2">
                                                        {lesson.sections.length === 0 ? (
                                                            <p className="text-xs text-slate-400 italic py-2 pl-2">
                                                                Chưa có section nào. Bấm &quot;+ Thêm Section&quot; ở trên để tạo nội dung học.
                                                            </p>
                                                        ) : (
                                                            lesson.sections.map((section, secIdx) => (
                                                                <div
                                                                    key={section.id}
                                                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
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
                                                                                        <span className="text-blue-600 font-mono text-[10px] bg-blue-50 px-1.5 py-0.5 rounded">
                                                                                            SQL Query
                                                                                        </span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <button
                                                                            onClick={() => handleOpenSectionModal(lesson.id, section)}
                                                                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-200 transition-colors"
                                                                            title="Sửa section"
                                                                        >
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                setDeleteTarget({
                                                                                    type: 'SECTION',
                                                                                    id: section.id,
                                                                                    title: section.title,
                                                                                    parentId: lesson.id,
                                                                                })
                                                                            }
                                                                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-200 transition-colors"
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
            </div>

            {/* ================= Modal: Create / Edit Category (Fixed Header & Footer) ================= */}
            {activeModal === 'CATEGORY' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden">
                        {/* Fixed Header */}
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Body */}
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

                            {/* Fixed Footer */}
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
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                                >
                                    {editingTarget ? 'Lưu thay đổi' : 'Tạo danh mục'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= Modal: Create / Edit Lesson (Fixed Header & Footer) ================= */}
            {activeModal === 'LESSON' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden">
                        {/* Fixed Header */}
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Body */}
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
                                        rows={3}
                                        value={lessonForm.description}
                                        onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                                        placeholder="Khái quát nội dung và mục tiêu người học sẽ nắm được..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="publishCheck"
                                        checked={lessonForm.isPublished}
                                        onChange={(e) => setLessonForm({ ...lessonForm, isPublished: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="publishCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                                        Xuất bản ngay (Hiển thị cho học viên trên trang học tập)
                                    </label>
                                </div>
                            </div>

                            {/* Fixed Footer */}
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
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                                >
                                    {editingTarget ? 'Lưu thay đổi' : 'Tạo bài học'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= Modal: Create / Edit Section (Fixed Header & Footer) ================= */}
            {activeModal === 'SECTION' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden">
                        {/* Fixed Header */}
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Body */}
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
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                        rows={2}
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

                            {/* Fixed Footer */}
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
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                                >
                                    {editingTarget ? 'Lưu section' : 'Tạo section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= Delete Confirmation Dialog ================= */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
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
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
