'use client';

import React, { useState } from 'react';
import {
    MockTest,
    MockTestQuestion,
    QuestionType,
    QuestionOption,
    PracticeDatabase
} from '../types';
import {
    mockMockTests,
    mockQuestions,
    mockDatabases
} from '../mockData';

export default function AdminMockTestsPage() {
    // ================= State Management =================
    const [mockTests, setMockTests] = useState<MockTest[]>(mockMockTests);
    const [questions, setQuestions] = useState<MockTestQuestion[]>(mockQuestions);
    const [databases] = useState<PracticeDatabase[]>(mockDatabases);

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
        description: '',
        durationMinutes: 45,
        passingScore: 7.0,
        maxScore: 10,
        difficulty: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        isPublished: true,
    });

    // Form state for Question
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
        options: QuestionOption[];
    }>({
        mockTestId: '',
        type: 'SQL_QUERY',
        prompt: '',
        orderIndex: 1,
        points: 2.0,
        explanation: '',
        databaseId: databases[0]?.id || 'db-1',
        solutionQuery: 'SELECT * FROM table_name;',
        initialQuery: 'SELECT \nFROM \n',
        options: [
            { id: 'opt-1', key: 'A', content: '', isCorrect: true },
            { id: 'opt-2', key: 'B', content: '', isCorrect: false },
            { id: 'opt-3', key: 'C', content: '', isCorrect: false },
            { id: 'opt-4', key: 'D', content: '', isCorrect: false },
        ],
    });

    // Active test details when in Level 2
    const activeTest = mockTests.find((t) => t.id === selectedTestId);

    // Filtered Tests
    const filteredTests = mockTests.filter((t) => {
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

    // Filtered Questions for Active Test
    const activeQuestions = questions.filter(
        (q) => q.mockTestId === selectedTestId
    );
    const filteredQuestions = activeQuestions.filter((q) => {
        const matchesSearch =
            q.prompt.toLowerCase().includes(searchQuestionQuery.toLowerCase()) ||
            (q.explanation &&
                q.explanation.toLowerCase().includes(searchQuestionQuery.toLowerCase()));
        const matchesType = typeFilter === 'ALL' || q.type === typeFilter;
        return matchesSearch && matchesType;
    });

    // ================= Test CRUD Handlers =================
    const handleOpenTestModal = (test?: MockTest) => {
        if (test) {
            setEditingTest(test);
            setTestForm({
                title: test.title,
                description: test.description,
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
                description: '',
                durationMinutes: 45,
                passingScore: 7.0,
                maxScore: 10,
                difficulty: 'BEGINNER',
                isPublished: true,
            });
        }
        setActiveModal('TEST');
    };

    const handleSaveTest = () => {
        if (!testForm.title.trim()) {
            alert('Vui lòng nhập tiêu đề đề thi!');
            return;
        }

        if (editingTest) {
            console.log(`[API PUT]: /api/admin/mock-tests/${editingTest.id}`, testForm);
            setMockTests((prev) =>
                prev.map((t) =>
                    t.id === editingTest.id
                        ? {
                              ...t,
                              ...testForm,
                              updatedAt: new Date().toISOString(),
                          }
                        : t
                )
            );
        } else {
            const newTest: MockTest = {
                id: `test-${Date.now()}`,
                title: testForm.title,
                description: testForm.description,
                durationMinutes: Number(testForm.durationMinutes),
                passingScore: Number(testForm.passingScore),
                maxScore: Number(testForm.maxScore),
                difficulty: testForm.difficulty,
                isPublished: testForm.isPublished,
                questionsCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            console.log('[API POST]: /api/admin/mock-tests', newTest);
            setMockTests((prev) => [newTest, ...prev]);
        }
        setActiveModal(null);
    };

    const handleTogglePublish = (test: MockTest) => {
        const updatedStatus = !test.isPublished;
        console.log(
            `[API PUT]: /api/admin/mock-tests/${test.id}/publish`,
            { isPublished: updatedStatus }
        );
        setMockTests((prev) =>
            prev.map((t) =>
                t.id === test.id ? { ...t, isPublished: updatedStatus } : t
            )
        );
    };

    // ================= Question CRUD Handlers =================
    const handleOpenQuestionModal = (question?: MockTestQuestion) => {
        if (!selectedTestId) return;

        if (question) {
            setEditingQuestion(question);
            setQuestionForm({
                mockTestId: question.mockTestId,
                type: question.type,
                prompt: question.prompt,
                orderIndex: question.orderIndex,
                points: question.points,
                explanation: question.explanation || '',
                databaseId: question.databaseId || databases[0]?.id || 'db-1',
                solutionQuery: question.solutionQuery || '',
                initialQuery: question.initialQuery || '',
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
                databaseId: databases[0]?.id || 'db-1',
                solutionQuery: 'SELECT * FROM table_name WHERE condition;',
                initialQuery: 'SELECT \nFROM \n',
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

    const handleSaveQuestion = () => {
        if (!questionForm.prompt.trim()) {
            alert('Vui lòng nhập nội dung câu hỏi!');
            return;
        }

        if (questionForm.type === 'SQL_QUERY') {
            if (!questionForm.solutionQuery.trim()) {
                alert('Vui lòng nhập câu truy vấn đáp án chuẩn SQL!');
                return;
            }
        } else {
            const hasCorrectOption = questionForm.options.some((o) => o.isCorrect);
            if (!hasCorrectOption) {
                alert('Vui lòng chọn ít nhất 1 đáp án đúng cho câu trắc nghiệm!');
                return;
            }
            const hasEmptyContent = questionForm.options.some((o) => !o.content.trim());
            if (hasEmptyContent) {
                alert('Vui lòng điền đầy đủ nội dung cho các đáp án lựa chọn A, B, C, D!');
                return;
            }
        }

        if (editingQuestion) {
            console.log(
                `[API PUT]: /api/admin/mock-tests/${selectedTestId}/questions/${editingQuestion.id}`,
                questionForm
            );
            setQuestions((prev) =>
                prev.map((q) =>
                    q.id === editingQuestion.id
                        ? {
                              ...q,
                              type: questionForm.type,
                              prompt: questionForm.prompt,
                              orderIndex: Number(questionForm.orderIndex),
                              points: Number(questionForm.points),
                              explanation: questionForm.explanation,
                              databaseId:
                                  questionForm.type === 'SQL_QUERY'
                                      ? questionForm.databaseId
                                      : undefined,
                              solutionQuery:
                                  questionForm.type === 'SQL_QUERY'
                                      ? questionForm.solutionQuery
                                      : undefined,
                              initialQuery:
                                  questionForm.type === 'SQL_QUERY'
                                      ? questionForm.initialQuery
                                      : undefined,
                              options:
                                  questionForm.type === 'MULTIPLE_CHOICE'
                                      ? questionForm.options
                                      : undefined,
                          }
                        : q
                )
            );
        } else {
            const newQ: MockTestQuestion = {
                id: `q-${Date.now()}`,
                mockTestId: selectedTestId!,
                type: questionForm.type,
                prompt: questionForm.prompt,
                orderIndex: Number(questionForm.orderIndex),
                points: Number(questionForm.points),
                explanation: questionForm.explanation,
                databaseId:
                    questionForm.type === 'SQL_QUERY'
                        ? questionForm.databaseId
                        : undefined,
                solutionQuery:
                    questionForm.type === 'SQL_QUERY'
                        ? questionForm.solutionQuery
                        : undefined,
                initialQuery:
                    questionForm.type === 'SQL_QUERY'
                        ? questionForm.initialQuery
                        : undefined,
                options:
                    questionForm.type === 'MULTIPLE_CHOICE'
                        ? questionForm.options
                        : undefined,
            };
            console.log(
                `[API POST]: /api/admin/mock-tests/${selectedTestId}/questions`,
                newQ
            );
            setQuestions((prev) => [...prev, newQ]);

            // Update question count on parent test
            setMockTests((prev) =>
                prev.map((t) =>
                    t.id === selectedTestId
                        ? { ...t, questionsCount: t.questionsCount + 1 }
                        : t
                )
            );
        }
        setActiveModal(null);
    };

    // ================= Delete Confirmation =================
    const handleConfirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'TEST') {
            console.log(`[API DELETE]: /api/admin/mock-tests/${deleteTarget.id}`);
            setMockTests((prev) => prev.filter((t) => t.id !== deleteTarget.id));
            setQuestions((prev) => prev.filter((q) => q.mockTestId !== deleteTarget.id));
            if (selectedTestId === deleteTarget.id) {
                setSelectedTestId(null);
            }
        } else if (deleteTarget.type === 'QUESTION') {
            console.log(
                `[API DELETE]: /api/admin/mock-tests/${selectedTestId}/questions/${deleteTarget.id}`
            );
            setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
            if (selectedTestId) {
                setMockTests((prev) =>
                    prev.map((t) =>
                        t.id === selectedTestId
                            ? { ...t, questionsCount: Math.max(0, t.questionsCount - 1) }
                            : t
                    )
                );
            }
        }
        setDeleteTarget(null);
    };

    // Helper for Option Radio Select
    const handleSelectCorrectOption = (key: 'A' | 'B' | 'C' | 'D') => {
        setQuestionForm((prev) => ({
            ...prev,
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
    const publishedTests = mockTests.filter((t) => t.isPublished).length;
    const totalQuestionsCount = questions.length;
    const avgDuration = totalTests
        ? Math.round(
              mockTests.reduce((acc, curr) => acc + curr.durationMinutes, 0) /
                  totalTests
          )
        : 0;

    return (
        <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8 min-w-0">
            {/* ========================================================================= */}
            {/* LEVEL 1: MOCK TESTS LIST VIEW                                             */}
            {/* ========================================================================= */}
            {!selectedTestId ? (
                <>
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <span>Quản Lý Đề Thi Thử</span>
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                    CMS Admin
                                </span>
                            </h1>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                                Quản lý danh sách các đề thi thử, thiết lập thời gian thi, điểm đạt và hệ thống câu hỏi trắc nghiệm &amp; truy vấn SQL.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => handleOpenTestModal()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Tạo Đề Thi Mới</span>
                            </button>
                        </div>
                    </div>

                    {/* KPI Metric Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Tổng Đề Thi
                                </span>
                                <span className="text-2xl font-black text-slate-900">{totalTests}</span>
                                <span className="text-xs text-slate-400 block mt-0.5">kỳ thi được tạo</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                📝
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Đang Công Khai
                                </span>
                                <span className="text-2xl font-black text-emerald-600">{publishedTests}</span>
                                <span className="text-xs text-slate-400 block mt-0.5">học viên có thể thi</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                🚀
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Tổng Số Câu Hỏi
                                </span>
                                <span className="text-2xl font-black text-indigo-600">{totalQuestionsCount}</span>
                                <span className="text-xs text-slate-400 block mt-0.5">SQL &amp; Trắc nghiệm</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                💡
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Thời Lượng TB
                                </span>
                                <span className="text-2xl font-black text-purple-600">{avgDuration} phút</span>
                                <span className="text-xs text-slate-400 block mt-0.5">mỗi phiên thi thử</span>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                ⏱️
                            </div>
                        </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full sm:w-auto flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchTestQuery}
                                onChange={(e) => setSearchTestQuery(e.target.value)}
                                placeholder="Tìm kiếm đề thi theo tên hoặc nội dung..."
                                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto shrink-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-500">Độ khó:</span>
                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    className="text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value="BEGINNER">Cơ bản (BEGINNER)</option>
                                    <option value="INTERMEDIATE">Trung bình (INTERMEDIATE)</option>
                                    <option value="ADVANCED">Nâng cao (ADVANCED)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value="PUBLISHED">Đang công khai</option>
                                    <option value="DRAFT">Bản nháp (Ẩn)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Mock Tests Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredTests.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                                Không tìm thấy Đề thi nào phù hợp với bộ lọc tìm kiếm.
                            </div>
                        ) : (
                            filteredTests.map((test) => {
                                const testQCount = questions.filter(
                                    (q) => q.mockTestId === test.id
                                ).length;

                                return (
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
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                    }`}>
                                                        {test.difficulty}
                                                    </span>

                                                    {/* Publish Toggle Button */}
                                                    <button
                                                        onClick={() => handleTogglePublish(test)}
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                                                            test.isPublished
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                                        }`}
                                                        title="Bấm để bật/tắt xuất bản"
                                                    >
                                                        {test.isPublished ? '● Công khai' : '○ Bản nháp'}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1">
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

                                            {/* Test Title & Description */}
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {test.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                {test.description}
                                            </p>

                                            {/* Specs: Duration & Pass Score */}
                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Thời lượng</span>
                                                    <span className="text-sm font-black text-slate-800">{test.durationMinutes} phút</span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Điểm qua</span>
                                                    <span className="text-sm font-black text-emerald-600">{test.passingScore} / {test.maxScore}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action: Open Level 2 Questions */}
                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                                                <span>{testQCount} câu hỏi</span>
                                            </span>

                                            <button
                                                onClick={() => setSelectedTestId(test.id)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                                            >
                                                <span>Quản lý câu hỏi</span>
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
                /* LEVEL 2: QUESTIONS MANAGEMENT OF SELECTED MOCK TEST                       */
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
                            <span>Quay lại Danh sách Đề thi</span>
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        activeTest?.difficulty === 'BEGINNER'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : activeTest?.difficulty === 'INTERMEDIATE'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-purple-100 text-purple-700'
                                    }`}>
                                        {activeTest?.difficulty}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        activeTest?.isPublished
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {activeTest?.isPublished ? '● Đang công khai' : '○ Bản nháp'}
                                    </span>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                        {activeTest?.title}
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                                    {activeTest?.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                                    <span>⏱️ Thời lượng: <strong className="text-slate-900">{activeTest?.durationMinutes} phút</strong></span>
                                    <span>🎯 Điểm đạt: <strong className="text-emerald-600">{activeTest?.passingScore} / {activeTest?.maxScore} điểm</strong></span>
                                    <span>📊 Tổng câu hỏi: <strong className="text-blue-600">{activeQuestions.length} câu</strong></span>
                                </div>
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
                                placeholder="Tìm kiếm câu hỏi theo nội dung hoặc giải thích..."
                                className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <span className="text-xs font-semibold text-slate-500">Loại câu hỏi:</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="ALL">Tất cả loại</option>
                                <option value="SQL_QUERY">Truy vấn SQL (SQL_QUERY)</option>
                                <option value="MULTIPLE_CHOICE">Trắc nghiệm (MULTIPLE_CHOICE)</option>
                            </select>
                        </div>
                    </div>

                    {/* Questions Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                        <th className="py-4 px-6 w-16">Thứ tự</th>
                                        <th className="py-4 px-6 w-36">Loại câu hỏi</th>
                                        <th className="py-4 px-6">Nội dung câu hỏi &amp; Chi tiết</th>
                                        <th className="py-4 px-6 text-center w-28">Điểm số</th>
                                        <th className="py-4 px-6 text-right w-28">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredQuestions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                                                Đề thi này chưa có câu hỏi nào. Bấm &quot;Thêm Câu Hỏi Mới&quot; để thiết lập.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredQuestions.map((q) => (
                                            <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Index */}
                                                <td className="py-4 px-6 text-xs font-black text-slate-400">
                                                    #{q.orderIndex}
                                                </td>

                                                {/* Type Badge */}
                                                <td className="py-4 px-6">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                        q.type === 'SQL_QUERY'
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                    }`}>
                                                        {q.type === 'SQL_QUERY' ? 'SQL Query' : 'Trắc nghiệm'}
                                                    </span>
                                                </td>

                                                {/* Prompt & Details */}
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-slate-900 leading-relaxed">
                                                        {q.prompt}
                                                    </p>

                                                    {/* If SQL Query */}
                                                    {q.type === 'SQL_QUERY' && (
                                                        <div className="mt-2 text-xs text-slate-500 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                                    CSDL: {databases.find((d) => d.id === q.databaseId)?.name || q.databaseId}
                                                                </span>
                                                            </div>
                                                            {q.solutionQuery && (
                                                                <div className="bg-slate-50 p-2 rounded-lg font-mono text-[11px] text-blue-800 border border-slate-200/60 max-w-xl truncate">
                                                                    {q.solutionQuery}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* If Multiple Choice */}
                                                    {q.type === 'MULTIPLE_CHOICE' && q.options && (
                                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                                                            {q.options.map((opt) => (
                                                                <div
                                                                    key={opt.id}
                                                                    className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-2 ${
                                                                        opt.isCorrect
                                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                                                                            : 'bg-slate-50 border-slate-200 text-slate-600'
                                                                    }`}
                                                                >
                                                                    <span className="font-black">{opt.key}.</span>
                                                                    <span className="truncate">{opt.content}</span>
                                                                    {opt.isCorrect && (
                                                                        <span className="ml-auto text-[10px] text-emerald-600 font-bold uppercase">
                                                                            ✓ Đúng
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Explanation */}
                                                    {q.explanation && (
                                                        <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                                                            Giải thích: {q.explanation}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Points */}
                                                <td className="py-4 px-6 text-center font-bold text-slate-700">
                                                    +{q.points} đ
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
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
            {/* MODAL: CREATE / EDIT MOCK TEST (Height 93vh, Accent Border)               */}
            {/* ========================================================================= */}
            {activeModal === 'TEST' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm">
                    <div
                        style={{ height: '93vh', maxHeight: '93vh' }}
                        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-[0_25px_70px_-15px_rgba(15,23,42,0.35)] border-2 border-slate-300/85 ring-1 ring-slate-900/10 flex flex-col overflow-hidden animate-in fade-in zoom-in-98 duration-150"
                    >
                        {/* Gradient Top Accent Bar */}
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
                                        {editingTest ? 'Chỉnh Sửa Đề Thi Thử' : 'Tạo Đề Thi Thử Mới'}
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                        max="10"
                                        step="0.5"
                                        value={testForm.passingScore}
                                        onChange={(e) => setTestForm({ ...testForm, passingScore: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
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
                                onClick={handleSaveTest}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                {editingTest ? 'Lưu thay đổi' : 'Tạo Đề Thi'}
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
                        style={{ height: '93vh', maxHeight: '93vh' }}
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
                                    Loại câu hỏi <span className="text-rose-500">*</span>
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
                                            <span className="text-[10px] text-slate-500 block">Học viên viết truy vấn chạy trên DB</span>
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

                            {/* Common Prompt */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Nội dung câu hỏi (Prompt) <span className="text-rose-500">*</span>
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
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự câu</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={questionForm.orderIndex}
                                        onChange={(e) => setQuestionForm({ ...questionForm, orderIndex: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm số (+)</label>
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                        </svg>
                                        <span>Cấu hình Truy Vấn SQL</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Cơ sở dữ liệu mẫu liên kết <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={questionForm.databaseId}
                                            onChange={(e) => setQuestionForm({ ...questionForm, databaseId: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                        >
                                            {databases.map((db) => (
                                                <option key={db.id} value={db.id}>
                                                    {db.name} ({db.dialect})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Đáp án truy vấn chuẩn (solutionQuery) <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            rows={5}
                                            required
                                            value={questionForm.solutionQuery}
                                            onChange={(e) => setQuestionForm({ ...questionForm, solutionQuery: e.target.value })}
                                            placeholder="SELECT ... FROM ... WHERE ...;"
                                            className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-blue-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Mã mẫu ban đầu cho học viên (initialQuery)
                                        </label>
                                        <textarea
                                            rows={3}
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
                                            <span>Danh sách Phương Án Trắc Nghiệm</span>
                                            <span className="text-[10px] text-slate-400 font-normal">(Chọn Radio button để đánh dấu đáp án đúng)</span>
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
                                                                Đáp án chuẩn
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
                                    Giải thích chi tiết (Hiển thị sau khi nộp bài)
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
                                onClick={handleSaveQuestion}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                {editingQuestion ? 'Lưu thay đổi' : 'Thêm Câu Hỏi'}
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
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
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
