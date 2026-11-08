'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import adminPracticeService, {
    DatabaseRequest,
    ExerciseRequest,
} from '@/services/adminPracticeService';
import { mockDatabases, mockExercises } from '../mockData';
import { PracticeDatabase, PracticeExercise } from '../types';

type ModalMode = 'DATABASE' | 'EXERCISE' | null;

interface DeleteTarget {
    type: 'DATABASE' | 'EXERCISE';
    id: string;
    title: string;
}

interface ToastState {
    message: string;
    type: 'success' | 'error';
}

// Chuẩn hóa Database trả về từ API backend
const normalizeDatabase = (db: any, index: number): PracticeDatabase => {
    let schemaStr = '';
    if (typeof db.schemaData === 'string') {
        schemaStr = db.schemaData;
    } else if (db.schemaData && typeof db.schemaData === 'object') {
        schemaStr = JSON.stringify(db.schemaData, null, 2);
    } else {
        schemaStr = '{\n  "tables": ["users", "orders"],\n  "relationships": [\n    "orders.user_id -> users.id"\n  ]\n}';
    }

    return {
        id: String(db.id || db.databaseId || `db-${index + 1}`),
        name: db.name || db.title || `Database ${index + 1}`,
        slug: db.slug || db.name?.toLowerCase().replace(/\s+/g, '-') || `database-${index + 1}`,
        description: db.description || '',
        dialect: (db.dialect || 'PostgreSQL') as 'PostgreSQL' | 'MySQL' | 'SQLite',
        tableCount: Number(db.tablesCount ?? db.tableCount ?? (db.tables?.length || 4)),
        sampleRecordsCount: Number(db.sampleRecordsCount ?? 5000),
        schemaData: schemaStr,
        initSqlScript: db.initSqlScript || '-- DDL Create tables & Insert sample data\nCREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));\nCREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INT, total NUMERIC(10,2));',
        createdAt: db.createdAt || new Date().toISOString(),
        updatedAt: db.updatedAt || new Date().toISOString(),
        exerciseCount: Number(db.exercisesCount ?? db.exerciseCount ?? (Array.isArray(db.exercises) ? db.exercises.length : 0)),
        difficulty: db.difficulty || 'Trung bình',
        iconUrl: db.iconUrl || '',
    };
};

// Chuẩn hóa Exercise trả về từ API backend
const normalizeExercise = (ex: any, index: number, defaultDbId: string): PracticeExercise & {
    topics?: string;
    maxScore?: number;
    expectedColumns?: any;
    description?: string;
} => {
    let reqText = '';
    if (typeof ex.requirements === 'string') {
        reqText = ex.requirements;
    } else if (Array.isArray(ex.requirements)) {
        reqText = ex.requirements.join('\n');
    } else if (ex.requirements && typeof ex.requirements === 'object') {
        reqText = JSON.stringify(ex.requirements, null, 2);
    } else {
        reqText = ex.description || `Thực hiện truy vấn SQL cho bài tập ${index + 1}`;
    }

    let expColsText = '';
    if (typeof ex.expectedColumns === 'string') {
        expColsText = ex.expectedColumns;
    } else if (Array.isArray(ex.expectedColumns)) {
        expColsText = JSON.stringify(ex.expectedColumns);
    } else if (Array.isArray(ex.expectedOutputColumns)) {
        expColsText = JSON.stringify(ex.expectedOutputColumns);
    } else {
        expColsText = '[]';
    }

    return {
        id: String(ex.id || ex.exerciseId || `ex-${index + 1}`),
        databaseId: String(ex.databaseId || defaultDbId),
        title: ex.title || `Bài tập SQL ${index + 1}`,
        slug: ex.slug || ex.title?.toLowerCase().replace(/\s+/g, '-') || `bai-tap-${index + 1}`,
        difficulty: (ex.difficulty || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
        requirements: reqText,
        description: ex.description || reqText,
        solutionQuery: ex.solutionQuery || 'SELECT * FROM table_name WHERE condition;',
        initialCodeSnippet: ex.initialCodeSnippet || '-- Viết câu truy vấn SQL của bạn tại đây\nSELECT \nFROM \n',
        hints: Array.isArray(ex.hints)
            ? ex.hints
            : typeof ex.hints === 'string'
            ? [ex.hints]
            : [],
        points: Number(ex.points ?? ex.maxScore ?? 20),
        maxScore: Number(ex.maxScore ?? ex.points ?? 20),
        orderIndex: Number(ex.orderIndex ?? ex.sortOrder ?? index + 1),
        topics: ex.topics || 'SQL_QUERY',
        expectedColumns: expColsText,
        createdAt: ex.createdAt || new Date().toISOString(),
    };
};

export default function AdminPracticePage() {
    // Data states
    const [databases, setDatabases] = useState<PracticeDatabase[]>([]);
    const [exercises, setExercises] = useState<PracticeExercise[]>([]);
    const [isLoadingDatabases, setIsLoadingDatabases] = useState<boolean>(true);
    const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Toast feedback state
    const [toast, setToast] = useState<ToastState | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type });
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
        }, 3500);
    }, []);

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
        difficulty: 'Trung bình',
        iconUrl: '',
        description: '',
        tableCount: 4,
        sampleRecordsCount: 5000,
        schemaData: '',
        initSqlScript: '',
    });

    // Form states: Exercise
    const [exForm, setExForm] = useState({
        databaseId: '',
        title: '',
        slug: '',
        description: '',
        difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
        topics: 'SELECT, FILTER, JOIN',
        points: 20,
        orderIndex: 1,
        requirements: '',
        expectedColumns: '["id", "name"]',
        solutionQuery: '',
        initialCodeSnippet: '',
        hints: '',
    });

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    // ================= Fetch API Data =================

    // 1. Fetch Databases (Level 1)
    const fetchDatabases = useCallback(async () => {
        setIsLoadingDatabases(true);
        try {
            const rawList = await adminPracticeService.getAdminDatabases();
            if (Array.isArray(rawList) && rawList.length > 0) {
                const normalized = rawList.map((db, idx) => normalizeDatabase(db, idx));
                setDatabases(normalized);
            } else {
                // Fallback to mock data if empty
                setDatabases(mockDatabases.map((db, idx) => normalizeDatabase(db, idx)));
            }
        } catch (err) {
            console.warn('[AdminPractice] Lỗi tải databases từ API, sử dụng mock:', err);
            setDatabases(mockDatabases.map((db, idx) => normalizeDatabase(db, idx)));
        } finally {
            setIsLoadingDatabases(false);
        }
    }, []);

    // 2. Fetch Exercises for Selected Database (Level 2)
    const fetchExercisesForDb = useCallback(async (dbId: string) => {
        setIsLoadingExercises(true);
        try {
            const rawExercises = await adminPracticeService.getAdminExercises(dbId);
            if (Array.isArray(rawExercises) && rawExercises.length > 0) {
                const normalized = rawExercises.map((ex, idx) => normalizeExercise(ex, idx, dbId));
                setExercises((prev) => {
                    const others = prev.filter((e) => e.databaseId !== dbId);
                    return [...others, ...normalized];
                });
            } else {
                // Fallback to mock exercises for this database if empty
                const mocks = mockExercises
                    .filter((e) => e.databaseId === dbId)
                    .map((ex, idx) => normalizeExercise(ex, idx, dbId));
                setExercises((prev) => {
                    const others = prev.filter((e) => e.databaseId !== dbId);
                    return [...others, ...mocks];
                });
            }
        } catch (err) {
            console.warn(`[AdminPractice] Lỗi tải exercises cho DB ${dbId}:`, err);
            const mocks = mockExercises
                .filter((e) => e.databaseId === dbId)
                .map((ex, idx) => normalizeExercise(ex, idx, dbId));
            setExercises((prev) => {
                const others = prev.filter((e) => e.databaseId !== dbId);
                return [...others, ...mocks];
            });
        } finally {
            setIsLoadingExercises(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchDatabases();
    }, [fetchDatabases]);

    // When a database is selected in Level 2, load its exercises
    useEffect(() => {
        if (selectedDbId) {
            fetchExercisesForDb(selectedDbId);
        }
    }, [selectedDbId, fetchExercisesForDb]);

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
                difficulty: db.difficulty || 'Trung bình',
                iconUrl: (db as any).iconUrl || '',
                description: db.description,
                tableCount: db.tableCount || 4,
                sampleRecordsCount: db.sampleRecordsCount || 5000,
                schemaData: db.schemaData,
                initSqlScript: db.initSqlScript,
            });
        } else {
            setEditingTarget(null);
            setDbForm({
                name: '',
                slug: '',
                dialect: 'PostgreSQL',
                difficulty: 'Trung bình',
                iconUrl: '',
                description: '',
                tableCount: 4,
                sampleRecordsCount: 5000,
                schemaData: '{\n  "tables": [\n    {\n      "name": "users",\n      "columns": [\n        { "name": "id", "type": "SERIAL", "isPk": true },\n        { "name": "name", "type": "VARCHAR(100)" },\n        { "name": "email", "type": "VARCHAR(150)" }\n      ]\n    },\n    {\n      "name": "orders",\n      "columns": [\n        { "name": "id", "type": "SERIAL", "isPk": true },\n        { "name": "user_id", "type": "INT", "isFk": true },\n        { "name": "total", "type": "NUMERIC(10,2)" }\n      ]\n    }\n  ],\n  "relationships": [\n    {\n      "fromTable": "orders",\n      "toTable": "users",\n      "relation": "orders.user_id -> users.id",\n      "description": "Mỗi đơn hàng thuộc về một người dùng"\n    }\n  ]\n}',
                initSqlScript: '-- DDL Create tables & Insert sample data\nCREATE TABLE users (\n    id SERIAL PRIMARY KEY,\n    name VARCHAR(100) NOT NULL,\n    email VARCHAR(150) UNIQUE NOT NULL\n);\n\nCREATE TABLE orders (\n    id SERIAL PRIMARY KEY,\n    user_id INT REFERENCES users(id),\n    total NUMERIC(10,2) NOT NULL DEFAULT 0\n);\n\n-- Sample rows\nINSERT INTO users (name, email) VALUES (\'Nguyễn Văn A\', \'a@gmail.com\'), (\'Trần Thị B\', \'b@gmail.com\');\nINSERT INTO orders (user_id, total) VALUES (1, 1500000), (2, 850000);',
            });
        }
        setActiveModal('DATABASE');
    };

    // Helper: Định dạng JSON Schema tự động
    const handleFormatSchemaJson = () => {
        try {
            const parsed = JSON.parse(dbForm.schemaData);
            setDbForm((prev) => ({
                ...prev,
                schemaData: JSON.stringify(parsed, null, 2),
            }));
            showToast('Đã định dạng JSON thành công!', 'success');
        } catch {
            showToast('Chuỗi JSON chưa đúng cú pháp, vui lòng kiểm tra lại!', 'error');
        }
    };

    const handleSaveDatabase = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!dbForm.name.trim()) {
            showToast('Vui lòng nhập tên Database!', 'error');
            return;
        }
        if (!dbForm.schemaData.trim()) {
            showToast('Vui lòng nhập cấu trúc Schema (JSON format)!', 'error');
            return;
        }
        if (!dbForm.initSqlScript.trim()) {
            showToast('Vui lòng nhập Script SQL Khởi Tạo!', 'error');
            return;
        }

        // Parse schemaData nếu hợp lệ
        let parsedSchema: any = dbForm.schemaData;
        try {
            parsedSchema = JSON.parse(dbForm.schemaData);
        } catch {
            // để nguyên chuỗi nếu người dùng nhập dạng string
        }

        const generatedSlug =
            dbForm.slug.trim() ||
            dbForm.name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

        const payload: DatabaseRequest = {
            name: dbForm.name.trim(),
            slug: generatedSlug,
            description: dbForm.description.trim(),
            difficulty: dbForm.difficulty,
            iconUrl: dbForm.iconUrl.trim(),
            schemaData: parsedSchema,
            initSqlScript: dbForm.initSqlScript.trim(),
            tablesCount: Number(dbForm.tableCount),
            exercisesCount: Number(editingTarget?.exerciseCount || 0),
            dialect: dbForm.dialect,
            sampleRecordsCount: Number(dbForm.sampleRecordsCount),
        };

        setIsSaving(true);
        try {
            if (editingTarget) {
                await adminPracticeService.updateDatabase(editingTarget.id, payload);
                showToast(`Cập nhật cơ sở dữ liệu "${payload.name}" thành công!`, 'success');
            } else {
                await adminPracticeService.createDatabase(payload);
                showToast(`Tạo mới cơ sở dữ liệu "${payload.name}" thành công!`, 'success');
            }
            setActiveModal(null);
            await fetchDatabases();
        } catch (err: any) {
            console.error('[AdminPractice] Lỗi lưu Database:', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu Database!';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
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
                description: (ex as any).description || ex.requirements || '',
                difficulty: ex.difficulty,
                topics: (ex as any).topics || 'SQL_QUERY',
                points: ex.points || 20,
                orderIndex: ex.orderIndex || 1,
                requirements: ex.requirements,
                expectedColumns: (ex as any).expectedColumns || '["id", "name"]',
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
                description: '',
                difficulty: 'MEDIUM',
                topics: 'JOIN, GROUP BY, AGGREGATE',
                points: 20,
                orderIndex: dbExercises.length + 1,
                requirements: 'Viết câu lệnh SQL truy vấn danh sách thông tin theo yêu cầu...',
                expectedColumns: '["id", "name", "total"]',
                solutionQuery: 'SELECT u.id, u.name, SUM(o.total) AS total\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.name\nORDER BY total DESC;',
                initialCodeSnippet: '-- Viết câu truy vấn SQL của bạn tại đây\nSELECT \nFROM \n',
                hints: 'Sử dụng INNER JOIN giữa hai bảng users và orders\nSử dụng hàm tổng SUM() và mệnh đề GROUP BY',
            });
        }
        setActiveModal('EXERCISE');
    };

    const handleSaveExercise = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!exForm.title.trim()) {
            showToast('Vui lòng nhập tiêu đề bài tập!', 'error');
            return;
        }
        if (!exForm.requirements.trim()) {
            showToast('Vui lòng nhập yêu cầu đề bài!', 'error');
            return;
        }
        if (!exForm.solutionQuery.trim()) {
            showToast('Vui lòng nhập đáp án truy vấn SQL chuẩn!', 'error');
            return;
        }

        const targetDbId = selectedDbId || exForm.databaseId;
        if (!targetDbId) {
            showToast('Không xác định được Database cha!', 'error');
            return;
        }

        // Xử lý requirements (JSON hoặc string)
        let parsedRequirements: any = exForm.requirements.trim();
        try {
            if (parsedRequirements.startsWith('[') || parsedRequirements.startsWith('{')) {
                parsedRequirements = JSON.parse(parsedRequirements);
            }
        } catch {
            // giữ dạng string
        }

        // Xử lý expectedColumns (JSON mảng tên cột hoặc mảng chuỗi)
        let parsedColumns: any = [];
        try {
            const rawCol = exForm.expectedColumns.trim();
            if (rawCol.startsWith('[')) {
                parsedColumns = JSON.parse(rawCol);
            } else if (rawCol.length > 0) {
                parsedColumns = rawCol.split(',').map((c) => c.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
            }
        } catch {
            parsedColumns = [];
        }

        const hintsArray = exForm.hints
            ? exForm.hints.split('\n').map((h) => h.trim()).filter((h) => h.length > 0)
            : [];

        const generatedSlug =
            exForm.slug.trim() ||
            exForm.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

        const payload: ExerciseRequest = {
            title: exForm.title.trim(),
            description: exForm.description.trim() || exForm.requirements.trim(),
            difficulty: exForm.difficulty,
            topics: exForm.topics.trim() || 'SQL_QUERY',
            maxScore: Number(exForm.points),
            requirements: parsedRequirements,
            expectedColumns: parsedColumns,
            solutionQuery: exForm.solutionQuery.trim(),
            sortOrder: Number(exForm.orderIndex),
            slug: generatedSlug,
            initialCodeSnippet: exForm.initialCodeSnippet,
            hints: hintsArray,
        };

        setIsSaving(true);
        try {
            if (editingTarget) {
                await adminPracticeService.updateExercise(editingTarget.id, payload);
                showToast(`Cập nhật bài tập "${payload.title}" thành công!`, 'success');
            } else {
                await adminPracticeService.createExercise(targetDbId, payload);
                showToast(`Tạo mới bài tập "${payload.title}" thành công!`, 'success');
            }
            setActiveModal(null);
            await fetchExercisesForDb(targetDbId);
            await fetchDatabases();
        } catch (err: any) {
            console.error('[AdminPractice] Lỗi lưu Exercise:', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu Bài tập!';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ================= Delete Execution =================
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setIsSaving(true);
        try {
            if (deleteTarget.type === 'DATABASE') {
                await adminPracticeService.deleteDatabase(deleteTarget.id);
                showToast(`Đã xóa cơ sở dữ liệu "${deleteTarget.title}"!`, 'success');
                if (selectedDbId === deleteTarget.id) {
                    setSelectedDbId(null);
                }
                await fetchDatabases();
            } else if (deleteTarget.type === 'EXERCISE') {
                await adminPracticeService.deleteExercise(deleteTarget.id);
                showToast(`Đã xóa bài tập "${deleteTarget.title}"!`, 'success');
                if (selectedDbId) {
                    await fetchExercisesForDb(selectedDbId);
                    await fetchDatabases();
                }
            }
            setDeleteTarget(null);
        } catch (err: any) {
            console.error('[AdminPractice] Lỗi khi xóa:', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi thực hiện xóa!';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const totalExercisesCount = useMemo(() => {
        return databases.reduce((sum, d) => sum + (d.exerciseCount || 0), 0) || exercises.length;
    }, [databases, exercises]);

    return (
        <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8 min-w-0">
            {/* Toast Notification Banner */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${
                        toast.type === 'success'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                            : 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                    }`}
                >
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    <span>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 hover:opacity-80 p-0.5 rounded cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ========================================================================= */}
            {/* LEVEL 1: DATABASE LIST VIEW                                               */}
            {/* ========================================================================= */}
            {!selectedDbId ? (
                <>
                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                Quản Trị Cơ Sở Dữ Liệu & Bài Luyện SQL
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Quản lý cấu hình schema, script DDL khởi tạo và bài tập thực hành theo 2 cấp
                            </p>
                        </div>
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

                    {/* Compact Stat Badges (Side-by-side in 1 Row) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                                    Cơ sở dữ liệu mẫu
                                </span>
                                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">
                                    {databases.length} CSDL
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                                    Tổng số Bài tập SQL
                                </span>
                                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">
                                    {totalExercisesCount} bài
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                                    Tổng số Bảng Schema
                                </span>
                                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">
                                    {databases.reduce((sum, d) => sum + (d.tableCount || 0), 0)} Tables
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
                        <div className="w-full sm:w-80 md:w-96 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
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

                        <div className="flex items-center gap-2">
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
                    {isLoadingDatabases ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-pulse space-y-4">
                                    <div className="h-5 bg-slate-100 rounded w-24" />
                                    <div className="h-6 bg-slate-100 rounded w-3/4" />
                                    <div className="h-4 bg-slate-100 rounded w-full" />
                                    <div className="h-16 bg-slate-50 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredDatabases.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                                    Không tìm thấy Database nào phù hợp với bộ lọc hiện tại.
                                </div>
                            ) : (
                                filteredDatabases.map((db) => {
                                    const count = db.exerciseCount ?? exercises.filter((ex) => ex.databaseId === db.id).length;

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
                                                        <span className="text-sm font-black text-slate-800">~{db.sampleRecordsCount?.toLocaleString()} rows</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action: Open Level 2 Exercises */}
                                            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-xs font-bold text-emerald-600">
                                                    {count} bài tập SQL
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
                    )}
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
                                    {isLoadingExercises ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                                Đang tải danh sách bài tập của Database...
                                            </td>
                                        </tr>
                                    ) : filteredExercises.length === 0 ? (
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
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[11px] text-slate-400 font-mono">
                                                            slug: {ex.slug}
                                                        </span>
                                                        {(ex as any).topics && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                                                {(ex as any).topics}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenExerciseModal(ex)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                            title="Chỉnh sửa bài tập"
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
                        style={{ height: '94vh', maxHeight: '94vh' }}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Đường dẫn tĩnh (Slug)
                                    </label>
                                    <input
                                        type="text"
                                        value={dbForm.slug}
                                        onChange={(e) => setDbForm({ ...dbForm, slug: e.target.value })}
                                        placeholder="ecommerce-store (tự tạo nếu để trống)"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ khó</label>
                                    <select
                                        value={dbForm.difficulty}
                                        onChange={(e) => setDbForm({ ...dbForm, difficulty: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                    >
                                        <option value="Dễ">Dễ</option>
                                        <option value="Trung bình">Trung bình</option>
                                        <option value="Khó">Khó</option>
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
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Cấu trúc Schema (JSON format / Metadata) <span className="text-rose-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleFormatSchemaJson}
                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                    >
                                        Định dạng JSON
                                    </button>
                                </div>
                                <textarea
                                    rows={6}
                                    required
                                    value={dbForm.schemaData}
                                    onChange={(e) => setDbForm({ ...dbForm, schemaData: e.target.value })}
                                    placeholder='{ "tables": [{ "name": "users", "columns": [] }], "relationships": [] }'
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
                                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-blue-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                disabled={isSaving}
                                onClick={() => handleSaveDatabase()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {isSaving && (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>{editingTarget ? 'Lưu thay đổi' : 'Tạo Database'}</span>
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
                        style={{ height: '94vh', maxHeight: '94vh' }}
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
                                    <p className="text-xs text-slate-400">
                                        Thiết lập yêu cầu đề bài, kết quả mong đợi và câu truy vấn SQL chuẩn
                                    </p>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Slug bài tập
                                    </label>
                                    <input
                                        type="text"
                                        value={exForm.slug}
                                        onChange={(e) => setExForm({ ...exForm, slug: e.target.value })}
                                        placeholder="top-5-khach-hang (tự tạo nếu để trống)"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm thưởng (maxScore)</label>
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
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự bài (sortOrder)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={exForm.orderIndex}
                                        onChange={(e) => setExForm({ ...exForm, orderIndex: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề (topics)</label>
                                    <input
                                        type="text"
                                        value={exForm.topics}
                                        onChange={(e) => setExForm({ ...exForm, topics: e.target.value })}
                                        placeholder="JOIN, GROUP BY"
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
                                    placeholder="Viết câu lệnh SQL trả về danh sách khách hàng và tổng tiền chi tiêu..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Danh sách cột mong đợi (expectedColumns - dạng JSON hoặc phân tách bởi dấu phẩy)
                                </label>
                                <input
                                    type="text"
                                    value={exForm.expectedColumns}
                                    onChange={(e) => setExForm({ ...exForm, expectedColumns: e.target.value })}
                                    placeholder='["id", "name", "total"] hoặc id, name, total'
                                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                    className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-blue-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                disabled={isSaving}
                                onClick={() => handleSaveExercise()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {isSaving && (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>{editingTarget ? 'Lưu thay đổi' : 'Tạo bài tập'}</span>
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
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
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
                            {deleteTarget.type === 'DATABASE' && ' Toàn bộ bài tập và schema của cơ sở dữ liệu này sẽ bị xóa vĩnh viễn khỏi hệ thống.'}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleConfirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {isSaving && (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>Xác nhận xóa</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
