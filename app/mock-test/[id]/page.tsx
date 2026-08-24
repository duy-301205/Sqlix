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
    const resolvedParams = use(params);
    const testId = resolvedParams.id || 'mock-1';

    const testItem: MockTestItem = useMemo(() => {
        return MOCK_TESTS.find((t) => t.id === testId) || MOCK_TESTS[0];
    }, [testId]);

    const questions: MockQuestion[] = testItem.questions || [];
    const totalQuestions = questions.length;

    // Test Taking State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(testItem.durationMinutes * 60);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [testQueryResults, setTestQueryResults] = useState<Record<string, Record<string, any>[] | null>>({});
    const [isExecutingQuery, setIsExecutingQuery] = useState(false);

    // Initialize user answers with sample starter query for SQL questions
    useEffect(() => {
        const initialAnswers: Record<string, string> = {};
        questions.forEach((q) => {
            if (q.type === 'sql_query' && q.sampleQuery) {
                initialAnswers[q.id] = q.sampleQuery;
            }
        });
        setUserAnswers(initialAnswers);
    }, [questions]);

    // Timer countdown
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

    // Format time mm:ss
    const formattedTime = useMemo(() => {
        const minutes = Math.floor(timeLeftSeconds / 60);
        const seconds = timeLeftSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeftSeconds]);

    // Answer handlers
    const handleSelectOption = (questionId: string, optionId: string) => {
        if (isSubmitted) return;
        setUserAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const handleSqlChange = (questionId: string, code: string) => {
        if (isSubmitted) return;
        setUserAnswers((prev) => ({
            ...prev,
            [questionId]: code,
        }));
    };

    const toggleFlag = (questionId: string) => {
        setFlaggedQuestions((prev) => ({
            ...prev,
            [questionId]: !prev[questionId],
        }));
    };

    // Run SQL test preview
    const handleRunSqlQuery = () => {
        if (!currentQuestion || currentQuestion.type !== 'sql_query') return;
        setIsExecutingQuery(true);
        setTimeout(() => {
            setTestQueryResults((prev) => ({
                ...prev,
                [currentQuestion.id]: currentQuestion.mockTableResult || [],
            }));
            setIsExecutingQuery(false);
        }, 400);
    };

    // Calculate score
    const scoreSummary = useMemo(() => {
        let earnedPoints = 0;
        let totalPossiblePoints = 0;
        let correctCount = 0;

        questions.forEach((q) => {
            totalPossiblePoints += q.points;
            const ans = (userAnswers[q.id] || '').trim();

            if (q.type === 'multiple_choice') {
                if (ans === q.correctOptionId) {
                    earnedPoints += q.points;
                    correctCount++;
                }
            } else if (q.type === 'sql_query') {
                // SQL query basic semantic validation
                const cleanAns = ans.toLowerCase();
                const hasSelect = cleanAns.includes('select');
                const hasFrom = cleanAns.includes('from');
                if (hasSelect && hasFrom && ans.length > 20) {
                    earnedPoints += q.points;
                    correctCount++;
                } else if (hasSelect && hasFrom) {
                    earnedPoints += Math.floor(q.points * 0.5);
                }
            }
        });

        const percent = totalPossiblePoints > 0 ? Math.round((earnedPoints / totalPossiblePoints) * 100) : 0;
        const isPassed = percent >= 60;

        return {
            earnedPoints,
            totalPossiblePoints,
            correctCount,
            percent,
            isPassed,
        };
    }, [questions, userAnswers]);

    // Check answered status
    const answeredCount = useMemo(() => {
        return questions.filter((q) => {
            const ans = userAnswers[q.id];
            return ans && ans.trim().length > 0;
        }).length;
    }, [questions, userAnswers]);

    const handleConfirmSubmit = () => {
        setShowSubmitModal(false);
        setIsSubmitted(true);
    };

    const handleRetake = () => {
        const initialAnswers: Record<string, string> = {};
        questions.forEach((q) => {
            if (q.type === 'sql_query' && q.sampleQuery) {
                initialAnswers[q.id] = q.sampleQuery;
            }
        });
        setUserAnswers(initialAnswers);
        setFlaggedQuestions({});
        setTimeLeftSeconds(testItem.durationMinutes * 60);
        setIsSubmitted(false);
        setCurrentQuestionIndex(0);
        setTestQueryResults({});
    };

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header userName="Duy Hoàng" streakCount={7} />

                {/* Top Exam Navigation Bar */}
                <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href="/mock-test"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Thoát</span>
                        </Link>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <div className="min-w-0">
                            <h2 className="text-sm font-black text-slate-900 truncate">{testItem.title}</h2>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                <span className={`px-2 py-0.5 rounded font-bold ${testItem.difficultyColor}`}>
                                    {testItem.difficulty}
                                </span>
                                <span>•</span>
                                <span>{totalQuestions} câu hỏi</span>
                            </div>
                        </div>
                    </div>

                    {/* Timer & Submit Header Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                        {!isSubmitted ? (
                            <>
                                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black border transition-colors ${
                                    timeLeftSeconds < 300
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                                        : 'bg-slate-100 border-slate-200 text-slate-800'
                                }`}>
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{formattedTime}</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowSubmitModal(true)}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                                >
                                    Nộp bài thi
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">Đã kết thúc bài thi</span>
                                <button
                                    type="button"
                                    onClick={handleRetake}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                    Làm lại bài
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Exam Interface */}
                <main className="flex-1 overflow-y-auto p-6 w-full max-w-[1600px] mx-auto">
                    {/* RESULTS VIEW */}
                    {isSubmitted ? (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {/* Score Card Banner */}
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
                                        Kết quả bài thi: {scoreSummary.percent}%
                                    </h2>
                                    <p className="text-xs sm:text-sm text-white/90">
                                        Bạn đã trả lời đúng {scoreSummary.correctCount}/{totalQuestions} câu hỏi ({scoreSummary.earnedPoints}/{scoreSummary.totalPossiblePoints} điểm).
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleRetake}
                                        className="px-5 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        Làm lại bài thi
                                    </button>
                                    <Link
                                        href="/mock-test"
                                        className="px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition-all"
                                    >
                                        Danh sách đề thi
                                    </Link>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="space-y-4">
                                <h3 className="text-base font-black text-slate-900">Chi tiết lời giải từng câu hỏi</h3>

                                {questions.map((q, idx) => {
                                    const userAns = userAnswers[q.id] || '';
                                    const isCorrect =
                                        q.type === 'multiple_choice'
                                            ? userAns === q.correctOptionId
                                            : userAns.toLowerCase().includes('select') && userAns.toLowerCase().includes('from');

                                    return (
                                        <div
                                            key={q.id}
                                            className={`bg-white rounded-2xl p-6 border shadow-xs space-y-4 ${
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
                                                    <span className="text-xs font-bold text-slate-400">
                                                        {q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Viết SQL'} • {q.points} điểm
                                                    </span>
                                                </div>
                                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                                    isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    {isCorrect ? 'Chính xác' : 'Chưa đúng'}
                                                </span>
                                            </div>

                                            <p className="text-sm font-bold text-slate-900">{q.question}</p>

                                            {/* Multiple choice review */}
                                            {q.type === 'multiple_choice' && q.options && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                    {q.options.map((opt) => {
                                                        const isSelected = userAns === opt.id;
                                                        const isActualCorrect = q.correctOptionId === opt.id;
                                                        return (
                                                            <div
                                                                key={opt.id}
                                                                className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                                                                    isActualCorrect
                                                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                                                        : isSelected
                                                                        ? 'bg-rose-50 border-rose-300 text-rose-900 line-through'
                                                                        : 'bg-slate-50 border-slate-200 text-slate-600'
                                                                }`}
                                                            >
                                                                <span className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                                                    {opt.id}
                                                                </span>
                                                                <span>{opt.text}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* SQL review */}
                                            {q.type === 'sql_query' && (
                                                <div className="space-y-2 text-xs">
                                                    <div>
                                                        <span className="font-bold text-slate-700">Câu truy vấn của bạn:</span>
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
                                            )}

                                            {/* Explanation */}
                                            {q.explanation && (
                                                <div className="bg-blue-50/70 border border-blue-200/70 p-3 rounded-xl text-xs text-blue-900">
                                                    <span className="font-bold">💡 Giải thích chi tiết: </span>
                                                    <span>{q.explanation}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* TAKING EXAM VIEW */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* ================= CỘT TRÁI: NỘI DUNG CÂU HỎI HIỆN TẠI (8 PHẦN) ================= */}
                            <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
                                {/* Question Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-black">
                                            Câu {currentQuestionIndex + 1} / {totalQuestions}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">
                                            {currentQuestion.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Viết truy vấn SQL'} • {currentQuestion.points} điểm
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => toggleFlag(currentQuestion.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                            flaggedQuestions[currentQuestion.id]
                                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        <span>{flaggedQuestions[currentQuestion.id] ? '🚩 Đã gắn cờ' : '🏳️ Gắn cờ xem lại'}</span>
                                    </button>
                                </div>

                                {/* Question Title & Description */}
                                <div className="space-y-2">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                        {currentQuestion.question}
                                    </h3>
                                    {currentQuestion.description && (
                                        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                            {currentQuestion.description}
                                        </p>
                                    )}
                                </div>

                                {/* MULTIPLE CHOICE INTERFACE */}
                                {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                                    <div className="space-y-3 pt-2">
                                        {currentQuestion.options.map((opt) => {
                                            const isSelected = userAnswers[currentQuestion.id] === opt.id;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                                                    className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all flex items-center gap-3.5 cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-xs'
                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                                                        isSelected
                                                            ? 'bg-blue-600 text-white shadow-xs'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {opt.id}
                                                    </span>
                                                    <span>{opt.text}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* SQL CODING INTERFACE */}
                                {currentQuestion.type === 'sql_query' && (
                                    <div className="space-y-4 pt-2">
                                        {/* Schema preview badge */}
                                        {currentQuestion.schema && (
                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                                                <div className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                                    <span>🗄️ Cấu trúc bảng liên quan:</span>
                                                </div>
                                                <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                                                    {currentQuestion.schema.map((sch, i) => (
                                                        <div key={i}>
                                                            <b className="text-blue-700">{sch.tableName}</b> ({sch.columns.join(', ')})
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* SQL Textarea Editor */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-700">Trình soạn thảo câu lệnh SQL:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSqlChange(currentQuestion.id, '')}
                                                    className="text-slate-400 hover:text-rose-600 font-semibold transition-colors"
                                                >
                                                    Xóa tất cả
                                                </button>
                                            </div>
                                            <textarea
                                                value={userAnswers[currentQuestion.id] || ''}
                                                onChange={(e) => handleSqlChange(currentQuestion.id, e.target.value)}
                                                rows={6}
                                                placeholder="-- Nhập câu lệnh SELECT của bạn tại đây..."
                                                className="w-full p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 border border-slate-800 leading-relaxed resize-y"
                                            />
                                        </div>

                                        {/* Run Query Action */}
                                        <div className="flex items-center justify-between pt-1">
                                            <button
                                                type="button"
                                                onClick={handleRunSqlQuery}
                                                disabled={isExecutingQuery}
                                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                                            >
                                                {isExecutingQuery ? (
                                                    <span>⏳ Đang chạy thử...</span>
                                                ) : (
                                                    <>
                                                        <span>▶ Chạy thử câu lệnh</span>
                                                    </>
                                                )}
                                            </button>

                                            <span className="text-[11px] text-slate-400">Kết quả được kiểm tra tự động khi nộp</span>
                                        </div>

                                        {/* Query Result Preview Table */}
                                        {testQueryResults[currentQuestion.id] && (
                                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                                                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                                    <span>✓ Đã thực thi thử nghiệm thành công:</span>
                                                </div>
                                                <div className="overflow-x-auto max-h-48 rounded-lg border border-slate-200">
                                                    <table className="w-full text-left text-xs bg-white">
                                                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                                            <tr>
                                                                {Object.keys(testQueryResults[currentQuestion.id]![0] || {}).map((col) => (
                                                                    <th key={col} className="p-2.5 text-[11px] uppercase tracking-wider">{col}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 text-slate-800">
                                                            {testQueryResults[currentQuestion.id]!.map((row, rIdx) => (
                                                                <tr key={rIdx} className="hover:bg-slate-50">
                                                                    {Object.values(row).map((val: any, cIdx) => (
                                                                        <td key={cIdx} className="p-2.5 font-mono text-[11px]">
                                                                            {String(val)}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bottom Prev / Next Navigation Controls */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        ← Câu trước
                                    </button>

                                    {currentQuestionIndex < totalQuestions - 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span>Câu tiếp theo</span>
                                            <span>→</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowSubmitModal(true)}
                                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span>Hoàn thành & Nộp bài</span>
                                            <span>✓</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ================= CỘT PHẢI: BẢNG ĐIỀU HƯỚNG CÂU HỎI (4 PHẦN) ================= */}
                            <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-5">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-1">Danh sách câu hỏi</h4>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Đã làm: <b>{answeredCount}/{totalQuestions}</b></span>
                                        <span>Tiến độ: <b>{Math.round((answeredCount / totalQuestions) * 100)}%</b></span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Question Grid Palette */}
                                <div className="grid grid-cols-5 gap-2.5">
                                    {questions.map((q, idx) => {
                                        const isCurrent = currentQuestionIndex === idx;
                                        const isAnswered = !!(userAnswers[q.id] && userAnswers[q.id].trim().length > 0);
                                        const isFlagged = !!flaggedQuestions[q.id];

                                        return (
                                            <button
                                                key={q.id}
                                                type="button"
                                                onClick={() => setCurrentQuestionIndex(idx)}
                                                className={`relative h-11 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                                                    isCurrent
                                                        ? 'ring-2 ring-blue-600 ring-offset-2 bg-blue-600 text-white shadow-xs'
                                                        : isFlagged
                                                        ? 'bg-amber-100 border border-amber-300 text-amber-800'
                                                        : isAnswered
                                                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span>{idx + 1}</span>
                                                {isFlagged && (
                                                    <span className="absolute -top-1 -right-1 text-[9px]">🚩</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Status Legend */}
                                <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200"></div>
                                        <span>Đã trả lời</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300"></div>
                                        <span>Gắn cờ xem lại</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200"></div>
                                        <span>Chưa trả lời</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowSubmitModal(true)}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                                >
                                    Nộp bài kiểm tra
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal Xác nhận nộp bài */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
                                📝
                            </div>
                            <h3 className="text-lg font-black text-slate-900">Xác nhận nộp bài thi?</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Bạn có chắc chắn muốn kết thúc bài thi và nhận kết quả đánh giá không?
                            </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Số câu đã trả lời:</span>
                                <span className="font-bold text-slate-800">{answeredCount} / {totalQuestions} câu</span>
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
                                onClick={handleConfirmSubmit}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                            >
                                Xác nhận nộp bài
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
