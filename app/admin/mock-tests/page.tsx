'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import adminMockTestService, {
    MockTestRequest,
    MockTestQuestionRequest,
} from '@/services/adminMockTestService';
import adminPracticeService from '@/services/adminPracticeService';
import {
    MockTest,
    MockTestQuestion,
    QuestionType,
    QuestionOption,
    PracticeDatabase,
} from '../types';

interface ToastState {
    message: string;
    type: 'success' | 'error';
}

// Chuẩn hóa MockTest từ API Backend
const normalizeMockTest = (item: any, index: number): MockTest => {
    let diff: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'INTERMEDIATE';
    const rawDiff = String(item.difficulty || '').toUpperCase();
    if (rawDiff === 'BEGINNER' || rawDiff === 'EASY' || rawDiff === 'DỄ') diff = 'BEGINNER';
    else if (rawDiff === 'ADVANCED' || rawDiff === 'HARD' || rawDiff === 'KHÓ') diff = 'ADVANCED';

    return {
        id: String(item.id || item.testId || `test-${index + 1}`),
        title: item.title || item.name || `Đề thi thử ${index + 1}`,
        slug: item.slug || item.title?.toLowerCase().replace(/\s+/g, '-') || `de-thi-${index + 1}`,
        description: item.description || item.overview || '',
        durationMinutes: Number(item.durationMinutes || 45),
        passingScore: Number(item.passingScore ?? item.passScore ?? 7.0),
        maxScore: Number(item.maxScore ?? item.totalScore ?? 10),
        isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : true,
        difficulty: diff,
        questionsCount: Number(
            item.questionsCount ?? (Array.isArray(item.questions) ? item.questions.length : 0)
        ),
        coverImageUrl: item.coverImageUrl || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
    };
};

// Chuẩn hóa MockTestQuestion từ API Backend
const normalizeQuestion = (
    q: any,
    index: number,
    defaultTestId: string
): MockTestQuestion => {
    const qType: QuestionType =
        q.questionType === 'MULTIPLE_CHOICE' || q.type === 'MULTIPLE_CHOICE'
            ? 'MULTIPLE_CHOICE'
            : 'SQL_QUERY';

    let reqText = '';
    if (typeof q.requirements === 'string') {
        reqText = q.requirements;
    } else if (Array.isArray(q.requirements)) {
        reqText = q.requirements.join('\n');
    } else if (q.requirements && typeof q.requirements === 'object') {
        reqText = JSON.stringify(q.requirements, null, 2);
    }

    let expColsText = '';
    if (typeof q.expectedColumns === 'string') {
        expColsText = q.expectedColumns;
    } else if (Array.isArray(q.expectedColumns)) {
        expColsText = JSON.stringify(q.expectedColumns);
    } else {
        expColsText = '[]';
    }

    // Xử lý options trắc nghiệm
    let parsedOptions: QuestionOption[] = [
        { id: 'opt-1', key: 'A', content: '', isCorrect: true },
        { id: 'opt-2', key: 'B', content: '', isCorrect: false },
        { id: 'opt-3', key: 'C', content: '', isCorrect: false },
        { id: 'opt-4', key: 'D', content: '', isCorrect: false },
    ];

    const rawOptions = q.mcOptions || q.options;
    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
        parsedOptions = rawOptions.map((opt: any, oIdx: number) => {
            const key = (opt.key || ['A', 'B', 'C', 'D'][oIdx] || 'A') as 'A' | 'B' | 'C' | 'D';
            const isCorrect =
                opt.isCorrect !== undefined
                    ? Boolean(opt.isCorrect)
                    : q.mcCorrectOption === key;
            return {
                id: String(opt.id || `opt-${oIdx + 1}`),
                key,
                content: opt.content || opt.text || '',
                isCorrect,
            };
        });
    }

    return {
        id: String(q.id || q.questionId || `q-${index + 1}`),
        mockTestId: String(q.mockTestId || q.testId || defaultTestId),
        type: qType,
        prompt: q.content || q.prompt || q.title || `Câu hỏi ${index + 1}`,
        orderIndex: Number(q.sortOrder ?? q.orderIndex ?? index + 1),
        points: Number(q.points ?? 2.0),
        explanation: q.explanation || '',
        databaseId: q.databaseId || '',
        solutionQuery: q.solutionQuery || '',
        initialQuery: q.initialQuery || '-- Viết truy vấn tại đây\nSELECT \nFROM ',
        requirements: reqText,
        expectedColumns: expColsText,
        maxRetries: Number(q.maxRetries ?? 3),
        options: parsedOptions,
        mcCorrectOption: q.mcCorrectOption || parsedOptions.find((o) => o.isCorrect)?.key || 'A',
    };
};

export default function AdminMockTestsPage() {
    // ================= State Management =================
    const [mockTests, setMockTests] = useState<MockTest[]>([]);
    const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
    const [databases, setDatabases] = useState<PracticeDatabase[]>([]);

    const [isLoadingTests, setIsLoadingTests] = useState<boolean>(true);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Toast State
    const [toast, setToast] = useState<ToastState | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type });
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
        }, 3500);
    }, []);

    // Selected Test for Level 2 (Questions Management)
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

    // Filters for Level 1 (Tests)
    const [searchTestQuery, setSearchTestQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Filters for Level 2 (Questions)
    const [searchQuestionQuery, setSearchQuestionQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');

    // Modals
    const [activeModal, setActiveModal] = useState<'TEST' | 'QUESTION' | null>(null);
    const [editingTest, setEditingTest] = useState<MockTest | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<MockTestQuestion | null>(null);

    // Confirm Delete Dialog
    const [deleteTarget, setDeleteTarget] = useState<{
        type: 'TEST' | 'QUESTION';
        id: string;
        title: string;
    } | null>(null);

    // Form state for Mock Test
    const [testForm, setTestForm] = useState({
        title: '',
        slug: '',
        description: '',
        coverImageUrl: '',
        durationMinutes: 45,
        passingScore: 7.0,
        maxScore: 10,
        difficulty: 'INTERMEDIATE' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        isPublished: true,
    });

    // Form state for Question (Dynamic Form)
    const [questionForm, setQuestionForm] = useState<{
        mockTestId: string;
        type: QuestionType;
        prompt: string;
        orderIndex: number;
        points: number;
        explanation: string;
        databaseId: string;
        solutionQuery: string;
        initialQuery: string;
        requirements: string;
        expectedColumns: string;
        maxRetries: number;
        mcCorrectOption: string;
        options: QuestionOption[];
    }>({
        mockTestId: '',
        type: 'SQL_QUERY',
        prompt: '',
        orderIndex: 1,
        points: 2.0,
        explanation: '',
        databaseId: '',
        solutionQuery: 'SELECT * FROM table_name;',
        initialQuery: 'SELECT \nFROM \n',
        requirements: 'Viết câu truy vấn SQL lấy dữ liệu theo đúng yêu cầu đề bài...',
        expectedColumns: '["id", "name"]',
        maxRetries: 3,
        mcCorrectOption: 'A',
        options: [
            { id: 'opt-1', key: 'A', content: '', isCorrect: true },
            { id: 'opt-2', key: 'B', content: '', isCorrect: false },
            { id: 'opt-3', key: 'C', content: '', isCorrect: false },
            { id: 'opt-4', key: 'D', content: '', isCorrect: false },
        ],
    });

    // ================= Fetch API Data =================

    // 1. Fetch Databases for dropdown select
    const fetchDatabases = useCallback(async () => {
        try {
            const raw = await adminPracticeService.getAdminDatabases();
            if (Array.isArray(raw)) {
                setDatabases(raw as any);
            } else {
                setDatabases([]);
            }
        } catch {
            setDatabases([]);
        }
    }, []);

    // 2. Fetch Mock Tests (Level 1)
    const fetchMockTests = useCallback(async () => {
        setIsLoadingTests(true);
        try {
            const rawTests = await adminMockTestService.getAdminMockTests();
            if (Array.isArray(rawTests)) {
                const normalized = rawTests.map((t, idx) => normalizeMockTest(t, idx));
                setMockTests(normalized);
            } else {
                setMockTests([]);
            }
        } catch (err) {
            console.error('[AdminMockTest] Lỗi fetch mock tests từ API:', err);
            setMockTests([]);
        } finally {
            setIsLoadingTests(false);
        }
    }, []);

    // 3. Fetch Questions for Selected Mock Test (Level 2)
    const fetchQuestionsForTest = useCallback(async (testId: string) => {
        setIsLoadingQuestions(true);
        try {
            const rawQuestions = await adminMockTestService.getAdminMockTestQuestions(testId);
            if (Array.isArray(rawQuestions)) {
                const normalized = rawQuestions.map((q, idx) => normalizeQuestion(q, idx, testId));
                setQuestions((prev) => {
                    const others = prev.filter((q) => q.mockTestId !== testId);
                    return [...others, ...normalized];
                });
            } else {
                setQuestions((prev) => prev.filter((q) => q.mockTestId !== testId));
            }
        } catch (err) {
            console.error(`[AdminMockTest] Lỗi tải câu hỏi cho test ${testId}:`, err);
            setQuestions((prev) => prev.filter((q) => q.mockTestId !== testId));
        } finally {
            setIsLoadingQuestions(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchDatabases();
        fetchMockTests();
    }, [fetchDatabases, fetchMockTests]);

    // When a test is selected in Level 2, load its questions
    useEffect(() => {
        if (selectedTestId) {
            fetchQuestionsForTest(selectedTestId);
        }
    }, [selectedTestId, fetchQuestionsForTest]);

    // Active test details when in Level 2
    const activeTest = useMemo(() => {
        return mockTests.find((t) => t.id === selectedTestId) || null;
    }, [mockTests, selectedTestId]);

    // Filtered Tests for Level 1
    const filteredTests = useMemo(() => {
        return mockTests.filter((t) => {
            const matchesSearch =
                t.title.toLowerCase().includes(searchTestQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchTestQuery.toLowerCase());
            const matchesDifficulty =
                difficultyFilter === 'ALL' || t.difficulty === difficultyFilter;
            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'PUBLISHED' && t.isPublished) ||
                (statusFilter === 'DRAFT' && !t.isPublished);
            return matchesSearch && matchesDifficulty && matchesStatus;
        });
    }, [mockTests, searchTestQuery, difficultyFilter, statusFilter]);

    // Questions of Active Test
    const activeQuestions = useMemo(() => {
        if (!selectedTestId) return [];
        return questions.filter((q) => q.mockTestId === selectedTestId);
    }, [questions, selectedTestId]);

    // Filtered Questions for Level 2
    const filteredQuestions = useMemo(() => {
        return activeQuestions.filter((q) => {
            const matchesSearch =
                q.prompt.toLowerCase().includes(searchQuestionQuery.toLowerCase()) ||
                (q.explanation &&
                    q.explanation.toLowerCase().includes(searchQuestionQuery.toLowerCase()));
            const matchesType = typeFilter === 'ALL' || q.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [activeQuestions, searchQuestionQuery, typeFilter]);

    // ================= Test CRUD Handlers =================
    const handleOpenTestModal = (test?: MockTest) => {
        if (test) {
            setEditingTest(test);
            setTestForm({
                title: test.title,
                slug: test.slug || '',
                description: test.description,
                coverImageUrl: test.coverImageUrl || '',
                durationMinutes: test.durationMinutes,
                passingScore: test.passingScore,
                maxScore: test.maxScore,
                difficulty: test.difficulty,
                isPublished: test.isPublished,
            });
        } else {
            setEditingTest(null);
            setTestForm({
                title: '',
                slug: '',
                description: '',
                coverImageUrl: '',
                durationMinutes: 45,
                passingScore: 7.0,
                maxScore: 10,
                difficulty: 'INTERMEDIATE',
                isPublished: true,
            });
        }
        setActiveModal('TEST');
    };

    const handleSaveTest = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!testForm.title.trim()) {
            showToast('Vui lòng nhập tiêu đề đề thi!', 'error');
            return;
        }

        const generatedSlug =
            testForm.slug.trim() ||
            testForm.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

        const diffMap: Record<string, string> = {
            BEGINNER: 'EASY',
            EASY: 'EASY',
            INTERMEDIATE: 'MEDIUM',
            MEDIUM: 'MEDIUM',
            ADVANCED: 'HARD',
            HARD: 'HARD',
        };
        const backendDifficulty = diffMap[testForm.difficulty] || 'MEDIUM';

        const payload: MockTestRequest = {
            title: testForm.title.trim(),
            slug: generatedSlug,
            description: testForm.description.trim(),
            difficulty: backendDifficulty,
            durationMinutes: Number(testForm.durationMinutes) || 30,
            coverImageUrl: testForm.coverImageUrl?.trim() || '',
            passingScore: Number(testForm.passingScore) || 7.0,
            maxScore: Number(testForm.maxScore) || 10,
            isPublished: Boolean(testForm.isPublished),
        };

        setIsSaving(true);
        try {
            if (editingTest) {
                await adminMockTestService.updateMockTest(editingTest.id, payload);
                showToast(`Cập nhật đề thi "${payload.title}" thành công!`, 'success');
            } else {
                await adminMockTestService.createMockTest(payload);
                showToast(`Tạo đề thi mới "${payload.title}" thành công!`, 'success');
            }
            setActiveModal(null);
            await fetchMockTests();
        } catch (err: any) {
            console.error('[AdminMockTest] Lỗi lưu đề thi:', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu đề thi!';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePublish = async (test: MockTest) => {
        const updatedStatus = !test.isPublished;
        try {
            await adminMockTestService.updateMockTest(test.id, {
                isPublished: updatedStatus,
            });
            showToast(
                `Đã ${updatedStatus ? 'xuất bản' : 'chuyển sang nháp'} đề thi "${test.title}"!`,
                'success'
            );
            await fetchMockTests();
        } catch {
            // fallback local update
            setMockTests((prev) =>
                prev.map((t) => (t.id === test.id ? { ...t, isPublished: updatedStatus } : t))
            );
        }
    };

    // ================= Question CRUD Handlers =================
    const handleOpenQuestionModal = (question?: MockTestQuestion) => {
        if (!selectedTestId) return;

        const defaultDbId = databases[0]?.id || '';

        if (question) {
            setEditingQuestion(question);
            setQuestionForm({
                mockTestId: question.mockTestId,
                type: question.type,
                prompt: question.prompt,
                orderIndex: question.orderIndex,
                points: question.points,
                explanation: question.explanation || '',
                databaseId: question.databaseId || defaultDbId,
                solutionQuery: question.solutionQuery || '',
                initialQuery: question.initialQuery || '',
                requirements: question.requirements || '',
                expectedColumns: question.expectedColumns || '["id", "name"]',
                maxRetries: question.maxRetries || 3,
                mcCorrectOption: question.mcCorrectOption || 'A',
                options: question.options || [
                    { id: 'opt-1', key: 'A', content: '', isCorrect: true },
                    { id: 'opt-2', key: 'B', content: '', isCorrect: false },
                    { id: 'opt-3', key: 'C', content: '', isCorrect: false },
                    { id: 'opt-4', key: 'D', content: '', isCorrect: false },
                ],
            });
        } else {
            setEditingQuestion(null);
            setQuestionForm({
                mockTestId: selectedTestId,
                type: 'SQL_QUERY',
                prompt: '',
                orderIndex: activeQuestions.length + 1,
                points: 2.0,
                explanation: '',
                databaseId: defaultDbId,
                solutionQuery: 'SELECT * FROM table_name WHERE condition;',
                initialQuery: 'SELECT \nFROM \n',
                requirements: 'Viết câu truy vấn SQL lấy thông tin theo đúng yêu cầu đề bài...',
                expectedColumns: '["id", "name"]',
                maxRetries: 3,
                mcCorrectOption: 'A',
                options: [
                    { id: 'opt-1', key: 'A', content: '', isCorrect: true },
                    { id: 'opt-2', key: 'B', content: '', isCorrect: false },
                    { id: 'opt-3', key: 'C', content: '', isCorrect: false },
                    { id: 'opt-4', key: 'D', content: '', isCorrect: false },
                ],
            });
        }
        setActiveModal('QUESTION');
    };

    const handleSaveQuestion = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!questionForm.prompt.trim()) {
            showToast('Vui lòng nhập nội dung câu hỏi!', 'error');
            return;
        }

        if (questionForm.type === 'SQL_QUERY') {
            if (!questionForm.databaseId) {
                showToast('Vui lòng chọn cơ sở dữ liệu mẫu liên kết cho câu hỏi SQL!', 'error');
                return;
            }
            if (!questionForm.solutionQuery.trim()) {
                showToast('Vui lòng nhập câu truy vấn đáp án chuẩn SQL!', 'error');
                return;
            }
        } else {
            const hasEmptyContent = questionForm.options.some((o) => !o.content.trim());
            if (hasEmptyContent) {
                showToast('Vui lòng điền đầy đủ nội dung cho các đáp án lựa chọn A, B, C, D!', 'error');
                return;
            }
        }

        // Parse requirements into string array
        let parsedRequirements: string[] = [];
        try {
            const rawReq = questionForm.requirements.trim();
            if (rawReq.startsWith('[')) {
                parsedRequirements = JSON.parse(rawReq);
            } else if (rawReq.length > 0) {
                parsedRequirements = rawReq.split('\n').map((s) => s.trim()).filter(Boolean);
            }
        } catch {
            parsedRequirements = questionForm.requirements.trim() ? [questionForm.requirements.trim()] : [];
        }

        // Parse expectedColumns
        let parsedColumns: any = [];
        try {
            const trimmed = questionForm.expectedColumns.trim();
            if (trimmed.startsWith('[')) {
                parsedColumns = JSON.parse(trimmed);
            } else if (trimmed.length > 0) {
                parsedColumns = trimmed.split(',').map((c) => c.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
            }
        } catch {
            parsedColumns = [];
        }

        const correctOptKey =
            questionForm.options.find((o) => o.isCorrect)?.key || questionForm.mcCorrectOption || 'A';

        const payload: MockTestQuestionRequest = {
            questionType: questionForm.type,
            content: questionForm.prompt.trim(),
            points: Number(questionForm.points),
            sortOrder: Number(questionForm.orderIndex),
            explanation: questionForm.explanation.trim(),
            ...(questionForm.type === 'SQL_QUERY'
                ? {
                      databaseId: questionForm.databaseId || undefined,
                      requirements: parsedRequirements,
                      expectedColumns: parsedColumns,
                      solutionQuery: questionForm.solutionQuery.trim(),
                      maxRetries: Number(questionForm.maxRetries || 3),
                      initialQuery: questionForm.initialQuery,
                  }
                : {
                      mcOptions: questionForm.options.map((o) => ({
                          key: o.key,
                          content: o.content.trim(),
                          isCorrect: o.key === correctOptKey,
                      })),
                      mcCorrectOption: correctOptKey,
                  }),
        };

        setIsSaving(true);
        try {
            if (editingQuestion) {
                await adminMockTestService.updateQuestion(editingQuestion.id, payload);
                showToast('Cập nhật câu hỏi thành công!', 'success');
            } else {
                await adminMockTestService.createQuestion(selectedTestId!, payload);
                showToast('Thêm câu hỏi mới vào đề thi thành công!', 'success');
            }
            setActiveModal(null);
            if (selectedTestId) {
                await fetchQuestionsForTest(selectedTestId);
                await fetchMockTests();
            }
        } catch (err: any) {
            console.error('[AdminMockTest] Lỗi lưu câu hỏi:', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu câu hỏi!';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ================= Delete Confirmation =================
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setIsSaving(true);
        try {
            if (deleteTarget.type === 'TEST') {
                await adminMockTestService.deleteMockTest(deleteTarget.id);
                showToast(`Đã xóa đề thi "${deleteTarget.title}"!`, 'success');
                if (selectedTestId === deleteTarget.id) {
                    setSelectedTestId(null);
                }
                await fetchMockTests();
            } else if (deleteTarget.type === 'QUESTION') {
                await adminMockTestService.deleteQuestion(deleteTarget.id);
                showToast(`Đã xóa câu hỏi "${deleteTarget.title}"!`, 'success');
                if (selectedTestId) {
                    await fetchQuestionsForTest(selectedTestId);
                    await fetchMockTests();
                }
            }
            setDeleteTarget(null);
        } catch (err: any) {
            console.error('[AdminMockTest] Lỗi khi xóa:', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi thực hiện xóa!';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for Option Radio Select
    const handleSelectCorrectOption = (key: 'A' | 'B' | 'C' | 'D') => {
        setQuestionForm((prev) => ({
            ...prev,
            mcCorrectOption: key,
            options: prev.options.map((opt) => ({
                ...opt,
                isCorrect: opt.key === key,
            })),
        }));
    };

    const handleOptionContentChange = (
        key: 'A' | 'B' | 'C' | 'D',
        value: string
    ) => {
        setQuestionForm((prev) => ({
            ...prev,
            options: prev.options.map((opt) =>
                opt.key === key ? { ...opt, content: value } : opt
            ),
        }));
    };

    // KPI Metrics
    const totalTests = mockTests.length;
    const totalPublished = mockTests.filter((t) => t.isPublished).length;
    const totalQuestionsCount = mockTests.reduce((acc, t) => acc + (t.questionsCount || 0), 0);

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
            {/* LEVEL 1: MOCK TESTS LIST VIEW                                             */}
            {/* ========================================================================= */}
            {!selectedTestId ? (
                <>
                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                Quản Trị Đề Thi Thử (Mock Tests CMS)
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Quản lý ngân hàng đề thi mô phỏng, câu hỏi trắc nghiệm và bài tập SQL thực hành
                            </p>
                        </div>
                        <button
                            onClick={() => handleOpenTestModal()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Thêm Đề Thi Mới</span>
                        </button>
                    </div>

                    {/* Stat Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                                    Tổng số đề thi
                                </span>
                                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">
                                    {totalTests} đề thi
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                                    Đang xuất bản
                                </span>
                                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">
                                    {totalPublished} công khai
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block truncate">
                                    Tổng số câu hỏi
                                </span>
                                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 truncate">
                                    {totalQuestionsCount} câu hỏi
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                        <div className="w-full sm:w-80 md:w-96 flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchTestQuery}
                                onChange={(e) => setSearchTestQuery(e.target.value)}
                                placeholder="Tìm kiếm đề thi theo tên hoặc mô tả..."
                                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">Độ khó:</span>
                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                >
                                    <option value="ALL">Tất cả độ khó</option>
                                    <option value="BEGINNER">Cơ bản (BEGINNER)</option>
                                    <option value="INTERMEDIATE">Trung bình (INTERMEDIATE)</option>
                                    <option value="ADVANCED">Nâng cao (ADVANCED)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value="PUBLISHED">Công khai</option>
                                    <option value="DRAFT">Bản nháp</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tests Grid */}
                    {isLoadingTests ? (
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
                            {filteredTests.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                                    Không tìm thấy đề thi nào phù hợp với bộ lọc hiện tại.
                                </div>
                            ) : (
                                filteredTests.map((test) => (
                                    <div
                                        key={test.id}
                                        className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                                    >
                                        <div>
                                            {/* Badges & Actions */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        test.difficulty === 'BEGINNER'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : test.difficulty === 'INTERMEDIATE'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        {test.difficulty}
                                                    </span>

                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        test.isPublished
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {test.isPublished ? 'Công khai' : 'Bản nháp'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleTogglePublish(test)}
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                            test.isPublished
                                                                ? 'text-emerald-600 hover:bg-emerald-50'
                                                                : 'text-slate-400 hover:bg-slate-100'
                                                        }`}
                                                        title={test.isPublished ? 'Gỡ công khai (chuyển sang nháp)' : 'Xuất bản công khai'}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenTestModal(test)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                                        title="Sửa thông tin đề thi"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setDeleteTarget({
                                                                type: 'TEST',
                                                                id: test.id,
                                                                title: test.title,
                                                            })
                                                        }
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                                        title="Xóa đề thi"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Title & Description */}
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                {test.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                {test.description}
                                            </p>

                                            {/* Specs */}
                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Thời lượng</span>
                                                    <span className="text-sm font-black text-slate-800">{test.durationMinutes} phút</span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Điểm qua môn</span>
                                                    <span className="text-sm font-black text-slate-800">{test.passingScore}/{test.maxScore} pts</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action: Open Level 2 Questions */}
                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-blue-600">
                                                {test.questionsCount || 0} câu hỏi
                                            </span>

                                            <button
                                                onClick={() => setSelectedTestId(test.id)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                                            >
                                                <span>Xem câu hỏi / Chi tiết</span>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* ========================================================================= */
                /* LEVEL 2: QUESTIONS LIST OF SELECTED MOCK TEST                             */
                /* ========================================================================= */
                <>
                    {/* Level 2 Breadcrumb & Header */}
                    <div className="space-y-4">
                        <button
                            onClick={() => setSelectedTestId(null)}
                            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Quay lại Danh sách Đề thi thử</span>
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                                        {activeTest?.difficulty}
                                    </span>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                        {activeTest?.title}
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                                    {activeTest?.description} (Thời lượng: {activeTest?.durationMinutes} phút | Điểm đạt: {activeTest?.passingScore}/{activeTest?.maxScore})
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => handleOpenQuestionModal()}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Thêm Câu Hỏi Mới</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter toolbar for questions */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full sm:w-auto flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuestionQuery}
                                onChange={(e) => setSearchQuestionQuery(e.target.value)}
                                placeholder="Tìm kiếm câu hỏi trong đề thi này..."
                                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <span className="text-xs font-semibold text-slate-500">Loại câu:</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="ALL">Tất cả loại câu</option>
                                <option value="SQL_QUERY">Truy vấn SQL</option>
                                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                            </select>
                        </div>
                    </div>

                    {/* Questions Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                        <th className="py-4 px-6 w-16">STT</th>
                                        <th className="py-4 px-6">Nội Dung Câu Hỏi</th>
                                        <th className="py-4 px-6 text-center">Loại Câu</th>
                                        <th className="py-4 px-6 text-center">Điểm Số</th>
                                        <th className="py-4 px-6 max-w-xs">Thông Tin Bổ Trợ</th>
                                        <th className="py-4 px-6 text-right">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {isLoadingQuestions ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                                Đang tải danh sách câu hỏi trong đề thi...
                                            </td>
                                        </tr>
                                    ) : filteredQuestions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                                                Đề thi này chưa có câu hỏi nào. Nhấn &quot;Thêm Câu Hỏi Mới&quot; để bổ sung.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredQuestions.map((q, idx) => (
                                            <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Index */}
                                                <td className="py-4 px-6 text-xs font-black text-slate-400">
                                                    #{idx + 1}
                                                </td>

                                                {/* Content Prompt */}
                                                <td className="py-4 px-6 max-w-md">
                                                    <p className="font-bold text-slate-900 line-clamp-2">
                                                        {q.prompt}
                                                    </p>
                                                    {q.explanation && (
                                                        <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                                            Giải thích: {q.explanation}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Question Type */}
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                                        q.type === 'SQL_QUERY'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                    }`}>
                                                        {q.type === 'SQL_QUERY' ? 'Truy vấn SQL' : 'Trắc nghiệm'}
                                                    </span>
                                                </td>

                                                {/* Points */}
                                                <td className="py-4 px-6 text-center">
                                                    <span className="font-black text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                                        +{q.points} pts
                                                    </span>
                                                </td>

                                                {/* Extra Details */}
                                                <td className="py-4 px-6 max-w-xs text-xs">
                                                    {q.type === 'SQL_QUERY' ? (
                                                        <div className="space-y-0.5 font-mono text-[11px] text-slate-600">
                                                            <div className="truncate">
                                                                <span className="text-slate-400">DB:</span>{' '}
                                                                {databases.find((d) => d.id === q.databaseId)?.name || q.databaseId || 'Mặc định'}
                                                            </div>
                                                            <div className="truncate text-blue-700">
                                                                {q.solutionQuery}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[11px] text-slate-600">
                                                            <span className="font-bold text-emerald-600">
                                                                Đáp án đúng: {q.mcCorrectOption || q.options?.find((o) => o.isCorrect)?.key || 'A'}
                                                            </span>
                                                            <div className="text-slate-400">
                                                                {q.options?.length || 4} phương án lựa chọn
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-6 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleOpenQuestionModal(q)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                            title="Sửa câu hỏi"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    type: 'QUESTION',
                                                                    id: q.id,
                                                                    title: q.prompt,
                                                                })
                                                            }
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                                            title="Xóa câu hỏi"
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
            {/* MODAL: CREATE / EDIT MOCK TEST                                            */}
            {/* ========================================================================= */}
            {activeModal === 'TEST' && (
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {editingTest ? 'Chỉnh Sửa Đề Thi Thử' : 'Thêm Đề Thi Thử Mới'}
                                    </h3>
                                    <p className="text-xs text-slate-400">Thiết lập thông số kỳ thi, thời lượng và điều kiện đạt</p>
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
                                        Tiêu đề đề thi <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={testForm.title}
                                        onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                                        placeholder="Ví dụ: Đề thi thử SQL Tổng Hợp - Đợt 2"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Đường dẫn tĩnh (Slug)
                                    </label>
                                    <input
                                        type="text"
                                        value={testForm.slug}
                                        onChange={(e) => setTestForm({ ...testForm, slug: e.target.value })}
                                        placeholder="de-thi-tong-hop-dot-2 (tự tạo nếu để trống)"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ khó</label>
                                    <select
                                        value={testForm.difficulty}
                                        onChange={(e) => setTestForm({ ...testForm, difficulty: e.target.value as any })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                    >
                                        <option value="BEGINNER">Cơ bản (BEGINNER)</option>
                                        <option value="INTERMEDIATE">Trung bình (INTERMEDIATE)</option>
                                        <option value="ADVANCED">Nâng cao (ADVANCED)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Thời lượng (phút)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        step="5"
                                        value={testForm.durationMinutes}
                                        onChange={(e) => setTestForm({ ...testForm, durationMinutes: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm đạt qua bài</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        step="0.5"
                                        value={testForm.passingScore}
                                        onChange={(e) => setTestForm({ ...testForm, passingScore: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm tối đa</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        step="1"
                                        value={testForm.maxScore}
                                        onChange={(e) => setTestForm({ ...testForm, maxScore: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh bìa (coverImageUrl)</label>
                                <input
                                    type="text"
                                    value={testForm.coverImageUrl}
                                    onChange={(e) => setTestForm({ ...testForm, coverImageUrl: e.target.value })}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả đề thi</label>
                                <textarea
                                    rows={3}
                                    value={testForm.description}
                                    onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                                    placeholder="Nội dung tóm tắt kiến thức kiểm tra, phạm vi đề thi..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={testForm.isPublished}
                                        onChange={(e) => setTestForm({ ...testForm, isPublished: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 block">Xuất bản công khai</span>
                                        <span className="text-[11px] text-slate-400 block">
                                            Học viên có thể nhìn thấy và bắt đầu làm bài thi thử này trên hệ thống.
                                        </span>
                                    </div>
                                </label>
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
                                onClick={() => handleSaveTest()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {isSaving && (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>{editingTest ? 'Lưu thay đổi' : 'Tạo Đề Thi'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: CREATE / EDIT QUESTION (Dynamic Fields for SQL_QUERY & MULTIPLE_CHOICE) */}
            {/* ========================================================================= */}
            {activeModal === 'QUESTION' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm">
                    <div
                        style={{ height: '94vh', maxHeight: '94vh' }}
                        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35)] border-2 border-slate-300/85 ring-1 ring-slate-900/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-98 duration-150"
                    >
                        {/* Gradient Top Accent Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 shrink-0" />

                        {/* Fixed Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới Vào Đề'}
                                    </h3>
                                    <p className="text-xs text-slate-400">Chọn loại câu hỏi và nhập đáp án chuẩn (SQL hoặc Trắc nghiệm)</p>
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
                            {/* Question Type Selector */}
                            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                                <label className="block text-xs font-bold text-blue-900 mb-2">
                                    Loại câu hỏi (questionType) <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label
                                        onClick={() => setQuestionForm({ ...questionForm, type: 'SQL_QUERY' })}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            questionForm.type === 'SQL_QUERY'
                                                ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                                                : 'bg-white/60 border-slate-200 hover:bg-white'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="questionType"
                                            checked={questionForm.type === 'SQL_QUERY'}
                                            onChange={() => {}}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Viết câu lệnh SQL</span>
                                            <span className="text-[10px] text-slate-500 block">Học viên viết truy vấn chạy trên CSDL</span>
                                        </div>
                                    </label>

                                    <label
                                        onClick={() => setQuestionForm({ ...questionForm, type: 'MULTIPLE_CHOICE' })}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            questionForm.type === 'MULTIPLE_CHOICE'
                                                ? 'bg-white border-purple-600 shadow-xs ring-2 ring-purple-500/20'
                                                : 'bg-white/60 border-slate-200 hover:bg-white'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="questionType"
                                            checked={questionForm.type === 'MULTIPLE_CHOICE'}
                                            onChange={() => {}}
                                            className="text-purple-600 focus:ring-purple-500"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Trắc nghiệm</span>
                                            <span className="text-[10px] text-slate-500 block">Chọn đáp án đúng (A, B, C, D)</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Common Content / Prompt */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Nội dung câu hỏi (content) <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={questionForm.prompt}
                                    onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })}
                                    placeholder="Ví dụ: Hãy viết câu lệnh SQL trả về danh sách top 3 sản phẩm có doanh thu cao nhất..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            {/* Order Index & Points */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự câu (sortOrder)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={questionForm.orderIndex}
                                        onChange={(e) => setQuestionForm({ ...questionForm, orderIndex: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số (points)</label>
                                    <input
                                        type="number"
                                        min="0.5"
                                        step="0.5"
                                        value={questionForm.points}
                                        onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            {/* ================= DYNAMIC FIELDS BASED ON TYPE ================= */}
                            {questionForm.type === 'SQL_QUERY' ? (
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                        </svg>
                                        <span>Cấu hình Truy Vấn SQL</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Cơ sở dữ liệu mẫu liên kết (databaseId) <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={questionForm.databaseId}
                                                onChange={(e) => setQuestionForm({ ...questionForm, databaseId: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                            >
                                                {databases.map((db) => (
                                                    <option key={db.id} value={db.id}>
                                                        {db.name} ({db.dialect || 'PostgreSQL'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Số lần thử tối đa (maxRetries)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={questionForm.maxRetries}
                                                onChange={(e) => setQuestionForm({ ...questionForm, maxRetries: Number(e.target.value) })}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Yêu cầu đề bài (requirements)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={questionForm.requirements}
                                            onChange={(e) => setQuestionForm({ ...questionForm, requirements: e.target.value })}
                                            placeholder="Yêu cầu chi tiết về câu lệnh SQL..."
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Danh sách cột mong đợi (expectedColumns - dạng JSON hoặc phân tách dấu phẩy)
                                        </label>
                                        <input
                                            type="text"
                                            value={questionForm.expectedColumns}
                                            onChange={(e) => setQuestionForm({ ...questionForm, expectedColumns: e.target.value })}
                                            placeholder='["id", "name", "total"] hoặc id, name, total'
                                            className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Đáp án truy vấn chuẩn (solutionQuery) <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            rows={4}
                                            required
                                            value={questionForm.solutionQuery}
                                            onChange={(e) => setQuestionForm({ ...questionForm, solutionQuery: e.target.value })}
                                            placeholder="SELECT ... FROM ... WHERE ...;"
                                            className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-blue-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Mã mẫu ban đầu cho học viên (initialQuery)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={questionForm.initialQuery}
                                            onChange={(e) => setQuestionForm({ ...questionForm, initialQuery: e.target.value })}
                                            placeholder="-- Viết truy vấn tại đây\nSELECT \nFROM "
                                            className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                                            <span>Danh sách Phương Án Trắc Nghiệm (mcOptions)</span>
                                            <span className="text-[10px] text-slate-400 font-normal">(Chọn Radio button để đánh dấu mcCorrectOption)</span>
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {questionForm.options.map((opt) => (
                                            <div
                                                key={opt.key}
                                                className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                                                    opt.isCorrect
                                                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10'
                                                        : 'bg-slate-50 border-slate-200'
                                                }`}
                                            >
                                                <div className="pt-2">
                                                    <input
                                                        type="radio"
                                                        name="correctOption"
                                                        checked={opt.isCorrect}
                                                        onChange={() => handleSelectCorrectOption(opt.key)}
                                                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        title="Đánh dấu đây là đáp án đúng"
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-black text-slate-800">
                                                            Lựa chọn {opt.key}
                                                        </span>
                                                        {opt.isCorrect && (
                                                            <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
                                                                Đáp án chuẩn ({opt.key})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={opt.content}
                                                        onChange={(e) => handleOptionContentChange(opt.key, e.target.value)}
                                                        placeholder={`Nhập nội dung cho đáp án ${opt.key}...`}
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Explanation */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Giải thích chi tiết (explanation - hiển thị sau khi nộp bài)
                                </label>
                                <textarea
                                    rows={3}
                                    value={questionForm.explanation}
                                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                    placeholder="Giải thích vì sao đáp án này đúng và lưu ý cho học viên..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                                onClick={() => handleSaveQuestion()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                {isSaving && (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                <span>{editingQuestion ? 'Lưu thay đổi' : 'Thêm Câu Hỏi'}</span>
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

                        <h3 className="text-base font-black text-slate-900">
                            Xác nhận xóa {deleteTarget.type === 'TEST' ? 'Đề thi thử' : 'Câu hỏi'}?
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Bạn có chắc chắn muốn xóa &quot;
                            <span className="font-semibold text-slate-800">{deleteTarget.title}</span>
                            &quot;? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu liên quan.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={handleConfirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
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
