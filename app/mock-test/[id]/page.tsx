'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { MOCK_TESTS, MockTestItem, MockQuestion } from '../mockTestData';

interface MockTestRoomPageProps {
    params: Promise<{ id: string }>;
}

export default function MockTestRoomPage({ params }: MockTestRoomPageProps) {
    const [mounted, setMounted] = useState(false);
    const resolvedParams = use(params);
    const testId = resolvedParams.id || 'mock-1';

    const testItem: MockTestItem = useMemo(() => {
        return MOCK_TESTS.find((t) => t.id === testId) || MOCK_TESTS[0];
    }, [testId]);

    // Chỉ lấy các câu hỏi dạng sql_query (truy vấn)
    const questions: MockQuestion[] = useMemo(() => {
        const rawQuestions = testItem.questions || [];
        const sqlOnly = rawQuestions.filter((q) => q.type === 'sql_query');
        return sqlOnly.length > 0 ? sqlOnly : rawQuestions;
    }, [testItem]);

    const totalQuestions = questions.length;

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(testItem.durationMinutes * 60);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [testQueryResults, setTestQueryResults] = useState<Record<string, Record<string, any>[] | null>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'schema'>('problem');

    // Quản lý điểm số (thang 100) và feedback riêng cho từng câu
    const [questionScores, setQuestionScores] = useState<Record<string, number | null>>({});
    const [questionFeedbacks, setQuestionFeedbacks] = useState<Record<string, string | null>>({});

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const initialAnswers: Record<string, string> = {};
        questions.forEach((q) => {
            if (q.sampleQuery) {
                initialAnswers[q.id] = q.sampleQuery;
            }
        });
        setUserAnswers(initialAnswers);
    }, [questions]);

    useEffect(() => {
        if (isSubmitted || timeLeftSeconds <= 0) return;

        const timer = setInterval(() => {
            setTimeLeftSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsSubmitted(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isSubmitted, timeLeftSeconds]);

    const currentQuestion = questions[currentQuestionIndex] || questions[0];

    const formattedTime = useMemo(() => {
        const minutes = Math.floor(timeLeftSeconds / 60);
        const seconds = timeLeftSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeftSeconds]);

    const handleSqlChange = (questionId: string, code: string) => {
        if (isSubmitted) return;
        setUserAnswers((prev) => ({ ...prev, [questionId]: code }));
    };

    const toggleFlag = (questionId: string) => {
        setFlaggedQuestions((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    // Chạy thử câu lệnh (chỉ xem trước bảng output)
    const handleRunTest = () => {
        if (!currentQuestion) return;
        setIsRunning(true);
        setTimeout(() => {
            setTestQueryResults((prev) => ({
                ...prev,
                [currentQuestion.id]: currentQuestion.mockTableResult || [],
            }));
            setIsRunning(false);
        }, 300);
    };

    // Nộp bài từng câu để chấm điểm thang 100 ngay lập tức
    const handleSubmitSingleQuestion = () => {
        if (!currentQuestion || isSubmitted) return;
        setIsRunning(true);

        setTimeout(() => {
            setIsRunning(false);
            setTestQueryResults((prev) => ({
                ...prev,
                [currentQuestion.id]: currentQuestion.mockTableResult || [],
            }));

            const ans = (userAnswers[currentQuestion.id] || '').trim().toLowerCase();
            const hasSelect = ans.includes('select');
            const hasFrom = ans.includes('from');

            if (hasSelect && hasFrom && (ans.includes('where') || ans.includes('join') || ans.includes('group by') || ans.length > 30)) {
                setQuestionScores((prev) => ({ ...prev, [currentQuestion.id]: 100 }));
                setQuestionFeedbacks((prev) => ({
                    ...prev,
                    [currentQuestion.id]: 'Chính xác 100%! Câu lệnh SQL của bạn đã đáp ứng đầy đủ yêu cầu truy vấn.',
                }));
            } else if (hasSelect && hasFrom) {
                setQuestionScores((prev) => ({ ...prev, [currentQuestion.id]: 60 }));
                setQuestionFeedbacks((prev) => ({
                    ...prev,
                    [currentQuestion.id]: 'Chưa đạt! Câu lệnh đã thực thi nhưng còn thiếu điều kiện lọc hoặc liên kết bảng.',
                }));
            } else {
                setQuestionScores((prev) => ({ ...prev, [currentQuestion.id]: 0 }));
                setQuestionFeedbacks((prev) => ({
                    ...prev,
                    [currentQuestion.id]: 'Cú pháp câu lệnh chưa hợp lệ. Vui lòng kiểm tra lại cấu trúc SELECT ... FROM ...',
                }));
            }
        }, 500);
    };

    // Thống kê tổng kết
    const scoreSummary = useMemo(() => {
        let totalScore = 0;
        let submittedQuestionsCount = 0;
        let perfectCount = 0;

        questions.forEach((q) => {
            const score = questionScores[q.id];
            if (score !== null && score !== undefined) {
                totalScore += score;
                submittedQuestionsCount++;
                if (score === 100) perfectCount++;
            }
        });

        const averageScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;
        return {
            averageScore,
            totalPossibleScore: totalQuestions * 100,
            earnedTotalScore: totalScore,
            perfectCount,
            submittedQuestionsCount,
            isPassed: averageScore >= 60,
        };
    }, [questions, questionScores, totalQuestions]);

    const answeredCount = useMemo(() => {
        return questions.filter((q) => {
            const ans = userAnswers[q.id];
            return ans && ans.trim().length > 0;
        }).length;
    }, [questions, userAnswers]);

    const handleRetake = () => {
        const initialAnswers: Record<string, string> = {};
        questions.forEach((q) => {
            if (q.sampleQuery) {
                initialAnswers[q.id] = q.sampleQuery;
            }
        });
        setUserAnswers(initialAnswers);
        setFlaggedQuestions({});
        setQuestionScores({});
        setQuestionFeedbacks({});
        setTimeLeftSeconds(testItem.durationMinutes * 60);
        setIsSubmitted(false);
        setCurrentQuestionIndex(0);
        setTestQueryResults({});
    };

    if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

    const currentCode = userAnswers[currentQuestion.id] || '';
    const currentScore = questionScores[currentQuestion.id];
    const currentFeedback = questionFeedbacks[currentQuestion.id];

    return (
        <div
            className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans"
            suppressHydrationWarning
        >
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header userName="Duy Hoàng" streakCount={7} />

                {/* Top Controls Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href="/mock-test"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            ← Thoát
                        </Link>
                        <span className="text-slate-300">|</span>
                        <span className="font-black text-xs text-slate-900 truncate">
                            {testItem.title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                            (Đã làm: <b className="text-blue-600">{answeredCount}/{totalQuestions}</b> câu)
                        </span>
                    </div>

                    {/* Timer & Submit Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                        {!isSubmitted ? (
                            <>
                                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-black border ${
                                    timeLeftSeconds < 300
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                                        : 'bg-slate-100 border-slate-200 text-slate-800'
                                }`}>
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{formattedTime}</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowSubmitModal(true)}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>Hoàn thành bài thi</span>
                                    <span>✓</span>
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={handleRetake}
                                className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                                Làm lại bài
                            </button>
                        )}
                    </div>
                </div>

                {/* Question Navigator Bar */}
                {!isSubmitted && (
                    <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 py-0.5">
                            {questions.map((q, idx) => {
                                const isCurrent = currentQuestionIndex === idx;
                                const isFlagged = !!flaggedQuestions[q.id];
                                const score = questionScores[q.id];
                                const isPerfect = score === 100;
                                const isGraded = score !== null && score !== undefined;

                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`relative min-w-[36px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                                            isCurrent
                                                ? 'ring-2 ring-blue-600 ring-offset-1 bg-blue-600 text-white'
                                                : isPerfect
                                                    ? 'bg-emerald-500 text-white font-black'
                                                    : isGraded
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                        : isFlagged
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-300'
                                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                    >
                                        <span>Câu {idx + 1}</span>
                                        {isFlagged && (
                                            <span className="absolute -top-1 -right-1 text-[8px]">🚩</span>
                                        )}
                                        {isPerfect && !isCurrent && (
                                            <span className="absolute -top-1 -right-1 text-[8px]">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => toggleFlag(currentQuestion.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                flaggedQuestions[currentQuestion.id]
                                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>{flaggedQuestions[currentQuestion.id] ? '🚩 Đã gắn cờ' : '🏳️ Gắn cờ'}</span>
                        </button>
                    </div>
                )}

                {/* Main Workspace */}
                <div className="flex-1 overflow-hidden w-full min-h-0">
                    {isSubmitted ? (
                        /* ================= RESULT VIEW ================= */
                        <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto space-y-6">
                            <div className={`rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 ${
                                scoreSummary.isPassed
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 shadow-emerald-500/10'
                                    : 'bg-gradient-to-r from-rose-600 to-amber-700 shadow-rose-500/10'
                            }`}>
                                <div className="space-y-2 text-center md:text-left">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                                        {scoreSummary.isPassed ? '🎉 Đạt yêu cầu' : '⚠️ Cần cố gắng thêm'}
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-black">
                                        Điểm trung bình: {scoreSummary.averageScore} / 100
                                    </h2>
                                    <p className="text-xs sm:text-sm text-white/90">
                                        Bạn đạt điểm tối đa ở {scoreSummary.perfectCount}/{totalQuestions} câu hỏi (Tổng điểm: {scoreSummary.earnedTotalScore}/{scoreSummary.totalPossibleScore}).
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleRetake}
                                        className="px-5 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        Làm lại bài
                                    </button>
                                    <Link
                                        href="/mock-test"
                                        className="px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition-all"
                                    >
                                        Danh sách đề
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-base font-black text-slate-900">Chi tiết kết quả từng câu hỏi</h3>
                                {questions.map((q, idx) => {
                                    const userAns = userAnswers[q.id] || '';
                                    const score = questionScores[q.id] || 0;
                                    const isCorrect = score === 100;

                                    return (
                                        <div
                                            key={q.id}
                                            className={`bg-white rounded-2xl p-5 border shadow-xs space-y-4 ${
                                                isCorrect ? 'border-emerald-200' : 'border-rose-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                                                        isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-500">
                                                        Truy vấn SQL
                                                    </span>
                                                </div>
                                                <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                                                    isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    Điểm số: {score} / 100
                                                </span>
                                            </div>

                                            <p className="text-sm font-bold text-slate-900">{q.question}</p>

                                            <div className="space-y-2 text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-700">Câu lệnh của bạn:</span>
                                                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl mt-1 overflow-x-auto font-mono text-[11px]">
                                                        {userAns || '(Chưa điền câu lệnh)'}
                                                    </pre>
                                                </div>
                                                {q.solutionQuery && (
                                                    <div>
                                                        <span className="font-bold text-emerald-700">Đáp án gợi ý:</span>
                                                        <pre className="bg-emerald-950 text-emerald-200 p-3 rounded-xl mt-1 overflow-x-auto font-mono text-[11px]">
                                                            {q.solutionQuery}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>

                                            {q.explanation && (
                                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900">
                                                    <span className="font-bold">💡 Giải thích: </span>
                                                    <span>{q.explanation}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* ================= EXAM WORKSPACE 2 COLUMNS ================= */
                        <div className="grid grid-cols-2 h-full w-full">
                            {/* CỘT 1: ĐỀ BÀI & ERD */}
                            <div className="h-full border-r border-slate-200 bg-white flex flex-col overflow-hidden">
                                <div className="flex border-b border-slate-200 px-4 bg-slate-50 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('problem')}
                                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                            activeTab === 'problem'
                                                ? 'border-blue-600 text-blue-600 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        📄 Mô tả đề bài & ERD
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('schema')}
                                        className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                            activeTab === 'schema'
                                                ? 'border-blue-600 text-blue-600 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        🗄️ Cấu trúc bảng (Schema)
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {activeTab === 'problem' ? (
                                        <>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">
                                                            Câu #{currentQuestionIndex + 1}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-semibold">
                                                            Thang điểm: 100 điểm
                                                        </span>
                                                    </div>
                                                    <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                                                        {currentQuestion.question}
                                                    </h2>
                                                    {currentQuestion.description && (
                                                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                                            {currentQuestion.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {currentQuestion.schema && currentQuestion.schema.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-bold text-slate-900">Cột dữ liệu kỳ vọng:</h4>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {currentQuestion.schema[0].columns.map((col) => (
                                                                <span
                                                                    key={col}
                                                                    className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-mono text-[11px] font-bold"
                                                                >
                                                                    {col}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sơ đồ quan hệ ERD */}
                                            <div className="pt-6 border-t border-slate-200 space-y-3">
                                                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                    <span>📊</span> Sơ đồ quan hệ ERD
                                                </h3>
                                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                                    {currentQuestion.schema?.map((sch, i) => (
                                                        <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 text-xs">
                                                            <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2 flex justify-between items-center">
                                                                <span className="text-blue-700">{sch.tableName}</span>
                                                                <span className="text-[10px] text-slate-400 uppercase">Table</span>
                                                            </div>
                                                            <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                                                                {sch.columns.map((col, cIdx) => (
                                                                    <div key={cIdx} className="flex justify-between items-center">
                                                                        <span>{col}</span>
                                                                        <span className="text-[10px] text-slate-400">VARCHAR</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* Tab Schema */
                                        <div className="space-y-4 text-xs">
                                            <h4 className="font-bold text-slate-900">Chi tiết cấu trúc bảng:</h4>
                                            {currentQuestion.schema?.map((sch, i) => (
                                                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                                    <div className="font-bold text-blue-700 text-sm">📋 {sch.tableName}</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {sch.columns.map((col, cIdx) => (
                                                            <span key={cIdx} className="px-2 py-1 bg-white border border-slate-200 rounded-md font-mono text-[11px] text-slate-700">
                                                                {col}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Prev / Next Action */}
                                <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        ← Câu trước
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                                        disabled={currentQuestionIndex === totalQuestions - 1}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Câu tiếp theo →
                                    </button>
                                </div>
                            </div>

                            {/* CỘT 2: SQL EDITOR & CONSOLE CHẤM ĐIỂM TỪNG CÂU */}
                            <div className="h-full flex flex-col bg-white overflow-hidden">
                                {/* Editor Top Bar */}
                                <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                        <span className="text-xs font-mono font-bold text-slate-800">SQL Query Editor</span>
                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                                            PostgreSQL / MySQL
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleSqlChange(currentQuestion.id, currentQuestion.sampleQuery || '')}
                                        className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium flex items-center gap-1"
                                        title="Khôi phục câu lệnh mặc định"
                                    >
                                        <span>🔄</span> Đặt lại
                                    </button>
                                </div>

                                {/* Textarea Area */}
                                <div className="flex-1 flex bg-white relative overflow-hidden min-h-[200px]">
                                    <div className="py-3.5 px-3 bg-slate-50/80 border-r border-slate-200 text-right select-none font-mono text-xs text-slate-400 leading-relaxed font-semibold shrink-0">
                                        {currentCode.split('\n').map((_, i) => (
                                            <div key={i}>{i + 1}</div>
                                        ))}
                                    </div>
                                    <textarea
                                        value={currentCode}
                                        onChange={(e) => handleSqlChange(currentQuestion.id, e.target.value)}
                                        className="flex-1 p-3.5 bg-white text-slate-900 font-mono text-xs outline-none resize-none leading-relaxed focus:bg-slate-50/30 transition-colors"
                                        spellCheck={false}
                                        placeholder="-- Viết câu lệnh truy vấn SQL của bạn tại đây..."
                                    />
                                </div>

                                {/* Result Console & Single Question Submit */}
                                <div className="h-72 bg-slate-50/50 border-t border-slate-200 flex flex-col overflow-hidden shrink-0">
                                    <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                                                <span>📊</span> Kết quả thực thi & Điểm số
                                            </span>
                                            {currentScore !== null && currentScore !== undefined && (
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                                                        currentScore === 100
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                    }`}
                                                >
                                                    {currentScore} / 100 điểm
                                                </span>
                                            )}
                                        </div>

                                        {/* Hai nút Chạy thử và Nộp bài câu này */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleRunTest}
                                                disabled={isRunning}
                                                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                            >
                                                <span>▶ Chạy thử</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleSubmitSingleQuestion}
                                                disabled={isRunning}
                                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                            >
                                                <span>⚡ Nộp bài câu này</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-4 overflow-auto text-xs font-mono bg-white">
                                        {/* Feedback phản hồi sau khi nộp */}
                                        {currentFeedback && (
                                            <div
                                                className={`mb-3 p-3 rounded-xl border text-xs leading-relaxed font-sans font-medium flex items-start gap-2.5 ${
                                                    currentScore === 100
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                                        : 'bg-amber-50 border-amber-200 text-amber-900'
                                                }`}
                                            >
                                                <span className="text-base">{currentScore === 100 ? '🎉' : '⚠️'}</span>
                                                <div>
                                                    <div className="font-bold text-xs mb-0.5">
                                                        {currentScore === 100 ? 'Đạt điểm tuyệt đối (100/100)' : 'Chưa hoàn thành chính xác:'}
                                                    </div>
                                                    <div>{currentFeedback}</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Table dữ liệu kết quả */}
                                        {testQueryResults[currentQuestion.id] ? (
                                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                                <table className="w-full text-left text-slate-800 divide-y divide-slate-200">
                                                    <thead className="bg-slate-50">
                                                    <tr>
                                                        {Object.keys(testQueryResults[currentQuestion.id]![0] || {}).map((col) => (
                                                            <th key={col} className="py-2.5 px-3.5 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                                                    {testQueryResults[currentQuestion.id]!.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                            {Object.values(row).map((val: any, cIdx) => (
                                                                <td key={cIdx} className="py-2 px-3.5 text-slate-800 font-mono">
                                                                    {String(val)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-6 gap-2">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-base">
                                                    ⚡
                                                </div>
                                                <p className="text-center font-sans font-medium text-slate-500">
                                                    Nhấn <span className="font-bold text-slate-700">&quot;Chạy thử&quot;</span> để xem bảng output hoặc <span className="font-bold text-emerald-600">&quot;Nộp bài câu này&quot;</span> để chấm điểm trực tiếp.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Hoàn thành & Nộp toàn bộ bài thi */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
                                📝
                            </div>
                            <h3 className="text-lg font-black text-slate-900">Xác nhận nộp bài thi?</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Bạn có muốn kết thúc toàn bộ bài thi và xem bảng điểm tổng hợp không?
                            </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Số câu đạt 100 điểm:</span>
                                <span className="font-bold text-emerald-600">{scoreSummary.perfectCount} / {totalQuestions} câu</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Số câu chưa làm:</span>
                                <span className="font-bold text-rose-600">{totalQuestions - answeredCount} câu</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Thời gian còn lại:</span>
                                <span className="font-bold text-blue-600 font-mono">{formattedTime}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                                Làm tiếp
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSubmitModal(false);
                                    setIsSubmitted(true);
                                }}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                            >
                                Kết thúc bài thi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}