'use client';

import { useState, useMemo } from 'react';
import { mockDatabases, mockExercises } from '../mockData';
import { PracticeDatabase, PracticeExercise } from '../types';

type ModalMode = 'DATABASE' | 'EXERCISE' | null;

interface DeleteTarget {
    type: 'DATABASE' | 'EXERCISE';
    id: string;
    title: string;
}

export default function AdminPracticePage() {
    const [databases, setDatabases] = useState<PracticeDatabase[]>(mockDatabases);
    const [exercises, setExercises] = useState<PracticeExercise[]>(mockExercises);

    // Level 1 vs Level 2 navigation
    const [selectedDbId, setSelectedDbId] = useState<string | null>(null);

    // Search and filter state
    const [searchDbQuery, setSearchDbQuery] = useState('');
    const [dialectFilter, setDialectFilter] = useState<string>('ALL');
    const [searchExQuery, setSearchExQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');

    // Modals
    const [activeModal, setActiveModal] = useState<ModalMode>(null);
    const [editingTarget, setEditingTarget] = useState<any | null>(null);

    // Form states: Database
    const [dbForm, setDbForm] = useState({
        name: '',
        slug: '',
        dialect: 'PostgreSQL' as 'PostgreSQL' | 'MySQL' | 'SQLite',
        description: '',
        tableCount: 5,
        sampleRecordsCount: 10000,
        schemaData: '',
        initSqlScript: '',
    });

    // Form states: Exercise
    const [exForm, setExForm] = useState({
        databaseId: '',
        title: '',
        slug: '',
        difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
        points: 20,
        orderIndex: 1,
        requirements: '',
        solutionQuery: '',
        initialCodeSnippet: '',
        hints: '',
    });

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    // Active selected database (if in Level 2)
    const activeDb = useMemo(() => {
        return databases.find((db) => db.id === selectedDbId) || null;
    }, [databases, selectedDbId]);

    // Exercises of the selected database
    const dbExercises = useMemo(() => {
        if (!selectedDbId) return [];
        return exercises.filter((ex) => ex.databaseId === selectedDbId);
    }, [exercises, selectedDbId]);

    // Filtered databases for Level 1
    const filteredDatabases = useMemo(() => {
        return databases.filter((db) => {
            const matchesSearch =
                db.name.toLowerCase().includes(searchDbQuery.toLowerCase()) ||
                db.description.toLowerCase().includes(searchDbQuery.toLowerCase());
            const matchesDialect = dialectFilter === 'ALL' || db.dialect === dialectFilter;
            return matchesSearch && matchesDialect;
        });
    }, [databases, searchDbQuery, dialectFilter]);

    // Filtered exercises for Level 2
    const filteredExercises = useMemo(() => {
        return dbExercises.filter((ex) => {
            const matchesSearch =
                ex.title.toLowerCase().includes(searchExQuery.toLowerCase()) ||
                ex.requirements.toLowerCase().includes(searchExQuery.toLowerCase());
            const matchesDiff = difficultyFilter === 'ALL' || ex.difficulty === difficultyFilter;
            return matchesSearch && matchesDiff;
        });
    }, [dbExercises, searchExQuery, difficultyFilter]);

    // ================= Database CRUD =================
    const handleOpenDbModal = (db?: PracticeDatabase) => {
        if (db) {
            setEditingTarget(db);
            setDbForm({
                name: db.name,
                slug: db.slug,
                dialect: db.dialect,
                description: db.description,
                tableCount: db.tableCount,
                sampleRecordsCount: db.sampleRecordsCount,
                schemaData: db.schemaData,
                initSqlScript: db.initSqlScript,
            });
        } else {
            setEditingTarget(null);
            setDbForm({
                name: '',
                slug: '',
                dialect: 'PostgreSQL',
                description: '',
                tableCount: 4,
                sampleRecordsCount: 5000,
                schemaData: '{\n  "tables": ["users", "orders"],\n  "relationships": [\n    "orders.user_id -> users.id"\n  ]\n}',
                initSqlScript: '-- DDL Create tables & Insert sample data\nCREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));\nCREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INT, total NUMERIC(10,2));',
            });
        }
        setActiveModal('DATABASE');
    };

    const handleSaveDatabase = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!dbForm.name.trim()) {
            alert('Vui lòng nhập tên Database!');
            return;
        }
        if (!dbForm.schemaData.trim()) {
            alert('Vui lòng nhập cấu trúc Schema (JSON format)!');
            return;
        }
        if (!dbForm.initSqlScript.trim()) {
            alert('Vui lòng nhập Script SQL Khởi Tạo!');
            return;
        }

        if (editingTarget) {
            console.log(`[API PUT]: /api/admin/databases/${editingTarget.id}`, dbForm);
            setDatabases((prev) =>
                prev.map((d) =>
                    d.id === editingTarget.id
                        ? { ...d, ...dbForm, updatedAt: new Date().toISOString() }
                        : d
                )
            );
        } else {
            const newDb: PracticeDatabase = {
                id: `db-${Date.now()}`,
                name: dbForm.name,
                slug: dbForm.slug || dbForm.name.toLowerCase().replace(/\s+/g, '-'),
                description: dbForm.description,
                dialect: dbForm.dialect,
                tableCount: Number(dbForm.tableCount),
                sampleRecordsCount: Number(dbForm.sampleRecordsCount),
                schemaData: dbForm.schemaData,
                initSqlScript: dbForm.initSqlScript,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                exerciseCount: 0,
            };
            console.log('[API POST]: /api/admin/databases', newDb);
            setDatabases((prev) => [newDb, ...prev]);
        }
        setActiveModal(null);
    };

    // ================= Exercise CRUD =================
    const handleOpenExerciseModal = (ex?: PracticeExercise) => {
        if (!selectedDbId) return;

        if (ex) {
            setEditingTarget(ex);
            setExForm({
                databaseId: ex.databaseId,
                title: ex.title,
                slug: ex.slug,
                difficulty: ex.difficulty,
                points: ex.points,
                orderIndex: ex.orderIndex,
                requirements: ex.requirements,
                solutionQuery: ex.solutionQuery,
                initialCodeSnippet: ex.initialCodeSnippet || '',
                hints: ex.hints ? ex.hints.join('\n') : '',
            });
        } else {
            setEditingTarget(null);
            setExForm({
                databaseId: selectedDbId,
                title: '',
                slug: '',
                difficulty: 'MEDIUM',
                points: 20,
                orderIndex: dbExercises.length + 1,
                requirements: '',
                solutionQuery: 'SELECT * FROM table_name WHERE condition;',
                initialCodeSnippet: '-- Viết câu truy vấn SQL của bạn tại đây\nSELECT \nFROM \n',
                hints: '',
            });
        }
        setActiveModal('EXERCISE');
    };

    const handleSaveExercise = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!exForm.title.trim()) {
            alert('Vui lòng nhập tiêu đề bài tập!');
            return;
        }
        if (!exForm.requirements.trim()) {
            alert('Vui lòng nhập yêu cầu đề bài!');
            return;
        }
        if (!exForm.solutionQuery.trim()) {
            alert('Vui lòng nhập đáp án truy vấn SQL chuẩn!');
            return;
        }

        const hintsArray = exForm.hints
            ? exForm.hints.split('\n').filter((h) => h.trim().length > 0)
            : [];

        if (editingTarget) {
            console.log(`[API PUT]: /api/admin/exercises/${editingTarget.id}`, {
                ...exForm,
                hints: hintsArray,
            });
            setExercises((prev) =>
                prev.map((item) =>
                    item.id === editingTarget.id
                        ? {
                              ...item,
                              title: exForm.title,
                              slug: exForm.slug || exForm.title.toLowerCase().replace(/\s+/g, '-'),
                              difficulty: exForm.difficulty,
                              points: Number(exForm.points),
                              orderIndex: Number(exForm.orderIndex),
                              requirements: exForm.requirements,
                              solutionQuery: exForm.solutionQuery,
                              initialCodeSnippet: exForm.initialCodeSnippet,
                              hints: hintsArray,
                          }
                        : item
                )
            );
        } else {
            const newEx: PracticeExercise = {
                id: `ex-${Date.now()}`,
                databaseId: exForm.databaseId,
                title: exForm.title,
                slug: exForm.slug || exForm.title.toLowerCase().replace(/\s+/g, '-'),
                difficulty: exForm.difficulty,
                points: Number(exForm.points),
                orderIndex: Number(exForm.orderIndex),
                requirements: exForm.requirements,
                solutionQuery: exForm.solutionQuery,
                initialCodeSnippet: exForm.initialCodeSnippet,
                hints: hintsArray,
                createdAt: new Date().toISOString(),
            };
            console.log(
                `[API POST]: /api/admin/databases/${exForm.databaseId}/exercises`,
                newEx
            );
            setExercises((prev) => [...prev, newEx]);

            // Increment exerciseCount for this DB
            setDatabases((prev) =>
                prev.map((d) =>
                    d.id === exForm.databaseId
                        ? { ...d, exerciseCount: d.exerciseCount + 1 }
                        : d
                )
            );
        }
        setActiveModal(null);
    };

    // ================= Delete Execution =================
    const handleConfirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'DATABASE') {
            console.log(`[API DELETE]: /api/admin/databases/${deleteTarget.id}`);
            setDatabases((prev) => prev.filter((d) => d.id !== deleteTarget.id));
            setExercises((prev) => prev.filter((ex) => ex.databaseId !== deleteTarget.id));
            if (selectedDbId === deleteTarget.id) {
                setSelectedDbId(null);
            }
        } else if (deleteTarget.type === 'EXERCISE') {
            console.log(`[API DELETE]: /api/admin/exercises/${deleteTarget.id}`);
            setExercises((prev) => prev.filter((ex) => ex.id !== deleteTarget.id));
            if (selectedDbId) {
                setDatabases((prev) =>
                    prev.map((d) =>
                        d.id === selectedDbId
                            ? { ...d, exerciseCount: Math.max(0, d.exerciseCount - 1) }
                            : d
                    )
                );
            }
        }

        setDeleteTarget(null);
    };

    const totalExercisesCount = exercises.length;

    return (
        <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8 min-w-0">
            {/* ========================================================================= */}
            {/* LEVEL 1: DATABASE LIST VIEW                                               */}
            {/* ========================================================================= */}
            {!selectedDbId ? (
                <>
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                Kho Luyện Tập & Cơ Sở Dữ Liệu 🗄️
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Quản lý các Cơ sở dữ liệu mẫu (Sandbox DDL) và danh sách bài tập SQL thực hành
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleOpenDbModal()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Thêm Database Mới</span>
                            </button>
                        </div>
                    </div>

                    {/* Stat Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cơ sở dữ liệu mẫu</span>
                                <p className="text-2xl font-black text-slate-900">{databases.length} CSDL</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng số Bài tập SQL</span>
                                <p className="text-2xl font-black text-slate-900">{totalExercisesCount} bài</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng số Bảng Schema</span>
                                <p className="text-2xl font-black text-slate-900">
                                    {databases.reduce((sum, d) => sum + d.tableCount, 0)} Tables
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar: Flex Layout không bao giờ bị đè icon */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full sm:w-auto flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchDbQuery}
                                onChange={(e) => setSearchDbQuery(e.target.value)}
                                placeholder="Tìm kiếm database theo tên hoặc mô tả..."
                                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <span className="text-xs font-semibold text-slate-500">Hệ quản trị:</span>
                            <select
                                value={dialectFilter}
                                onChange={(e) => setDialectFilter(e.target.value)}
                                className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="ALL">Tất cả (All Dialects)</option>
                                <option value="PostgreSQL">PostgreSQL</option>
                                <option value="MySQL">MySQL</option>
                                <option value="SQLite">SQLite</option>
                            </select>
                        </div>
                    </div>

                    {/* Database Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredDatabases.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                                Không tìm thấy Database nào phù hợp với từ khóa tìm kiếm.
                            </div>
                        ) : (
                            filteredDatabases.map((db) => {
                                const dbExerciseCount = exercises.filter(
                                    (ex) => ex.databaseId === db.id
                                ).length;

                                return (
                                    <div
                                        key={db.id}
                                        className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            {/* Dialect badge & Actions */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    db.dialect === 'PostgreSQL'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : db.dialect === 'MySQL'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                }`}>
                                                    {db.dialect}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenDbModal(db)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                                        title="Sửa thông tin DB & Schema"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setDeleteTarget({
                                                                type: 'DATABASE',
                                                                id: db.id,
                                                                title: db.name,
                                                            })
                                                        }
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                                        title="Xóa database"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* DB Title & Description */}
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {db.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                {db.description}
                                            </p>

                                            {/* Specs: Tables & Sample Records */}
                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Cấu trúc bảng</span>
                                                    <span className="text-sm font-black text-slate-800">{db.tableCount} Tables</span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Dữ liệu mẫu</span>
                                                    <span className="text-sm font-black text-slate-800">~{db.sampleRecordsCount.toLocaleString()} rows</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action: Open Level 2 Exercises */}
                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-600">
                                                {dbExerciseCount} bài tập SQL
                                            </span>

                                            <button
                                                onClick={() => setSelectedDbId(db.id)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                                            >
                                                <span>Xem chi tiết / Bài tập</span>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                /* ========================================================================= */
                /* LEVEL 2: EXERCISES LIST OF SELECTED DATABASE                              */
                /* ========================================================================= */
                <>
                    {/* Level 2 Breadcrumb & Header */}
                    <div className="space-y-4">
                        <button
                            onClick={() => setSelectedDbId(null)}
                            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Quay lại Danh sách Cơ sở dữ liệu</span>
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                                        {activeDb?.dialect}
                                    </span>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                        {activeDb?.name}
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                                    {activeDb?.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => handleOpenExerciseModal()}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Thêm Bài Tập Mới</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter toolbar for exercises */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full sm:w-auto flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchExQuery}
                                onChange={(e) => setSearchExQuery(e.target.value)}
                                placeholder="Tìm kiếm bài tập trong database này..."
                                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <span className="text-xs font-semibold text-slate-500">Mức độ:</span>
                            <select
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="ALL">Tất cả độ khó</option>
                                <option value="EASY">Dễ (EASY)</option>
                                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                                <option value="HARD">Khó (HARD)</option>
                            </select>
                        </div>
                    </div>

                    {/* Exercises Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                        <th className="py-4 px-6 w-16">STT</th>
                                        <th className="py-4 px-6">Bài Tập</th>
                                        <th className="py-4 px-6 text-center">Độ Khó</th>
                                        <th className="py-4 px-6 text-center">Điểm Thưởng</th>
                                        <th className="py-4 px-6 max-w-md">Yêu Cầu Truy Vấn</th>
                                        <th className="py-4 px-6 text-right">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredExercises.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                                Database này chưa có bài tập nào. Bấm &quot;Thêm Bài Tập Mới&quot; để tạo.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExercises.map((ex, idx) => (
                                            <tr key={ex.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Index */}
                                                <td className="py-4 px-6 text-xs font-black text-slate-400">
                                                    #{idx + 1}
                                                </td>

                                                {/* Title & Slug */}
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-slate-900">{ex.title}</p>
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        slug: {ex.slug}
                                                    </span>
                                                </td>

                                                {/* Difficulty */}
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                                        ex.difficulty === 'EASY'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : ex.difficulty === 'MEDIUM'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        {ex.difficulty}
                                                    </span>
                                                </td>

                                                {/* Points */}
                                                <td className="py-4 px-6 text-center">
                                                    <span className="font-black text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                                        +{ex.points} pts
                                                    </span>
                                                </td>

                                                {/* Requirements */}
                                                <td className="py-4 px-6 max-w-md">
                                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                        {ex.requirements}
                                                    </p>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-6 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenExerciseModal(ex)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                            title="Sửa bài tập & đáp án SQL"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    type: 'EXERCISE',
                                                                    id: ex.id,
                                                                    title: ex.title,
                                                                })
                                                            }
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                            title="Xóa bài tập"
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
                    </div>
                </>
            )}

            {/* ========================================================================= */}
            {/* MODAL: CREATE / EDIT DATABASE                                             */}
            {/* ========================================================================= */}
            {activeModal === 'DATABASE' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm">
                    <div
                        style={{ height: '93vh', maxHeight: '93vh' }}
                        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35)] border-2 border-slate-300/85 ring-1 ring-slate-900/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-98 duration-150"
                    >
                        {/* Gradient Accent Top Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 shrink-0" />

                        {/* Fixed Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {editingTarget ? 'Chỉnh Sửa Cơ Sở Dữ Liệu' : 'Thêm Database Mới'}
                                    </h3>
                                    <p className="text-xs text-slate-400">Thiết lập cấu hình CSDL mẫu và script DDL khởi tạo</p>
                                </div>
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

                        {/* Scrollable Form Body */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-7 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Tên Database <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={dbForm.name}
                                    onChange={(e) => setDbForm({ ...dbForm, name: e.target.value })}
                                    placeholder="Ví dụ: E-Commerce Store (ShopNow)"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Hệ Quản Trị (Dialect)</label>
                                    <select
                                        value={dbForm.dialect}
                                        onChange={(e) => setDbForm({ ...dbForm, dialect: e.target.value as any })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                    >
                                        <option value="PostgreSQL">PostgreSQL</option>
                                        <option value="MySQL">MySQL</option>
                                        <option value="SQLite">SQLite</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Số bảng (Tables)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={dbForm.tableCount}
                                        onChange={(e) => setDbForm({ ...dbForm, tableCount: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Số bản ghi (Rows)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={dbForm.sampleRecordsCount}
                                        onChange={(e) => setDbForm({ ...dbForm, sampleRecordsCount: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả tổng quan</label>
                                <textarea
                                    rows={2}
                                    value={dbForm.description}
                                    onChange={(e) => setDbForm({ ...dbForm, description: e.target.value })}
                                    placeholder="Cơ sở dữ liệu mô phỏng sàn thương mại điện tử..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Cấu trúc Schema (JSON format / Metadata) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={dbForm.schemaData}
                                    onChange={(e) => setDbForm({ ...dbForm, schemaData: e.target.value })}
                                    placeholder='{ "tables": ["users", "orders"], "relationships": [] }'
                                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Script SQL Khởi Tạo (initSqlScript DDL/DML) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={6}
                                    required
                                    value={dbForm.initSqlScript}
                                    onChange={(e) => setDbForm({ ...dbForm, initSqlScript: e.target.value })}
                                    placeholder="CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));"
                                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-blue-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        {/* Fixed Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveDatabase()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                {editingTarget ? 'Lưu thay đổi' : 'Tạo Database'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: CREATE / EDIT EXERCISE                                             */}
            {/* ========================================================================= */}
            {activeModal === 'EXERCISE' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm">
                    <div
                        style={{ height: '93vh', maxHeight: '93vh' }}
                        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35)] border-2 border-slate-300/85 ring-1 ring-slate-900/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-98 duration-150"
                    >
                        {/* Gradient Accent Top Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 shrink-0" />

                        {/* Fixed Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {editingTarget ? 'Chỉnh Sửa Bài Tập SQL' : 'Thêm Bài Tập SQL Mới'}
                                    </h3>
                                    <p className="text-xs text-slate-400">Nhập yêu cầu đề bài và câu truy vấn SQL chuẩn</p>
                                </div>
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

                        {/* Scrollable Form Body */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-7 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Tiêu đề bài tập <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={exForm.title}
                                    onChange={(e) => setExForm({ ...exForm, title: e.target.value })}
                                    placeholder="Ví dụ: Tìm top 5 khách hàng chi tiêu nhiều nhất"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ khó</label>
                                    <select
                                        value={exForm.difficulty}
                                        onChange={(e) => setExForm({ ...exForm, difficulty: e.target.value as any })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                    >
                                        <option value="EASY">EASY (Dễ)</option>
                                        <option value="MEDIUM">MEDIUM (Trung bình)</option>
                                        <option value="HARD">HARD (Khó)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm thưởng</label>
                                    <input
                                        type="number"
                                        min="5"
                                        step="5"
                                        value={exForm.points}
                                        onChange={(e) => setExForm({ ...exForm, points: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự bài</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={exForm.orderIndex}
                                        onChange={(e) => setExForm({ ...exForm, orderIndex: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Yêu cầu đề bài (Requirements) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={exForm.requirements}
                                    onChange={(e) => setExForm({ ...exForm, requirements: e.target.value })}
                                    placeholder="Viết câu lệnh SQL trả về danh sách khách hàng..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Đáp án truy vấn chuẩn (solutionQuery) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={5}
                                    required
                                    value={exForm.solutionQuery}
                                    onChange={(e) => setExForm({ ...exForm, solutionQuery: e.target.value })}
                                    placeholder="SELECT u.id, u.name, SUM(o.total) FROM users u ..."
                                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-blue-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Mã mẫu ban đầu cho học viên (initialCodeSnippet)
                                </label>
                                <textarea
                                    rows={3}
                                    value={exForm.initialCodeSnippet}
                                    onChange={(e) => setExForm({ ...exForm, initialCodeSnippet: e.target.value })}
                                    placeholder="-- Viết truy vấn của bạn tại đây\nSELECT \nFROM "
                                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Gợi ý giải (Hints - mỗi dòng một gợi ý)
                                </label>
                                <textarea
                                    rows={2}
                                    value={exForm.hints}
                                    onChange={(e) => setExForm({ ...exForm, hints: e.target.value })}
                                    placeholder="Sử dụng JOIN giữa bảng users và orders&#10;Dùng SUM và GROUP BY"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        {/* Fixed Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveExercise()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                {editingTarget ? 'Lưu thay đổi' : 'Tạo bài tập'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* DELETE CONFIRMATION DIALOG                                                */}
            {/* ========================================================================= */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">
                            Xác Nhận Xóa {deleteTarget.type === 'DATABASE' ? 'Cơ Sở Dữ Liệu' : 'Bài Tập SQL'}?
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            Bạn có chắc chắn muốn xóa <span className="font-bold text-slate-800">&quot;{deleteTarget.title}&quot;</span>?
                            {deleteTarget.type === 'DATABASE' && ' Toàn bộ bài tập và schema của cơ sở dữ liệu này sẽ bị xóa bỏ vĩnh viễn.'}
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
        </main>
    );
}
