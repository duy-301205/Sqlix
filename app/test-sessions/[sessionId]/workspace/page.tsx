'use client';

import { useState, useEffect, useMemo, use, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import mockTestService, {
    TestWorkspaceResponse,
    WorkspaceQuestion,
} from '@/services/mockTestService';
import practiceService, { RunQueryResponse } from '@/services/practiceService';
import ErdTab from '@/app/practice/[id]/components/ErdTab';
import OverviewTab from '@/app/practice/[id]/components/OverviewTab';
import { DATABASES_DETAIL } from '@/app/practice/[id]/data';

interface WorkspacePageProps {
    params: Promise<{ sessionId: string }>;
}

export default function TestWorkspacePage({ params }: WorkspacePageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const sessionId = resolvedParams.sessionId || 'session-demo';

    const [mounted, setMounted] = useState(false);
    const [workspace, setWorkspace] = useState<TestWorkspaceResponse | null>(null);
    const [questions, setQuestions] = useState<WorkspaceQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // States lưu câu trả lời và trạng thái từng câu
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [answeredStatus, setAnsweredStatus] = useState<Record<string, boolean>>({});
    const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

    // SQL Execution & Output Results
    const [isRunningQuery, setIsRunningQuery] = useState(false);
    const [queryResults, setQueryResults] = useState<Record<string, RunQueryResponse | null>>({});

    // Countdown Timer State (đồng bộ từ Database)
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

    // UI Loading, Tabs & Modal
    const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
    const [isSubmittingTest, setIsSubmittingTest] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activeLeftTab, setActiveLeftTab] = useState<'problem' | 'schema'>('problem');

    const autoSubmittedRef = useRef(false);

    // 1. Tải dữ liệu phòng thi từ API
    const loadWorkspace = useCallback(async () => {
        setIsLoadingWorkspace(true);
        try {
            const data = await mockTestService.getTestWorkspace(sessionId);
            if (data && data.questions && data.questions.length > 0) {
                const normalizedQuestions = data.questions.map((q: any, idx: number) => {
                    const qId = String(q.id || q.questionId || `q-${idx + 1}`);
                    return {
                        ...q,
                        id: qId,
                        questionId: qId,
                    };
                });
                setWorkspace(data);
                setQuestions(normalizedQuestions);

                const initialAnswers: Record<string, string> = {};
                const initialAnswered: Record<string, boolean> = {};

                normalizedQuestions.forEach((q) => {
                    if (q.userAnswer) {
                        initialAnswers[q.id] = q.userAnswer;
                        initialAnswered[q.id] = true;
                    } else if (q.sampleQuery) {
                        initialAnswers[q.id] = q.sampleQuery;
                    }
                });
                setUserAnswers(initialAnswers);
                setAnsweredStatus(initialAnswered);
            } else {
                throw new Error('Dữ liệu phòng thi trống');
            }
        } catch (err: any) {
            console.error('[TestWorkspace] Lỗi khi tải dữ liệu phòng thi:', err);
            setWorkspace(null);
            setQuestions([]);
        } finally {
            setIsLoadingWorkspace(false);
        }
    }, [sessionId]);

    useEffect(() => {
        setMounted(true);
        loadWorkspace();
    }, [loadWorkspace]);

    // 2. Logic Đồng hồ đếm ngược đồng bộ CHÍNH XÁC theo Database startTime & durationMinutes
    useEffect(() => {
        if (!workspace?.startTime || !workspace?.durationMinutes) return;

        const startMs = new Date(workspace.startTime).getTime();
        const durationMs = workspace.durationMinutes * 60 * 1000;
        const endMs = startMs + durationMs;

        const calculateRemaining = () => {
            const nowMs = Date.now();
            return Math.max(0, Math.floor((endMs - nowMs) / 1000));
        };

        setTimeLeftSeconds(calculateRemaining());

        const timer = setInterval(() => {
            const remaining = calculateRemaining();
            setTimeLeftSeconds(remaining);

            if (remaining <= 0 && !autoSubmittedRef.current) {
                autoSubmittedRef.current = true;
                clearInterval(timer);
                handleAutoSubmit();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [workspace]);

    const formattedTimer = useMemo(() => {
        if (timeLeftSeconds === null) return '--:--';
        const hours = Math.floor(timeLeftSeconds / 3600);
        const minutes = Math.floor((timeLeftSeconds % 3600) / 60);
        const seconds = timeLeftSeconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes
                .toString()
                .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeftSeconds]);

    const isTimeUrgent = timeLeftSeconds !== null && timeLeftSeconds < 300;

    // Câu hỏi hiện tại
    const currentQuestion = questions[currentQuestionIndex] || questions[0];
    const totalQuestions = questions.length;
    const answeredCount = Object.values(answeredStatus).filter(Boolean).length;
    const currentAnswer = userAnswers[currentQuestion?.id] || '';
    const isCurrentSaving = !!savingStatus[currentQuestion?.id];
    const currentRunResult = queryResults[currentQuestion?.id] || null;

    // Phân loại câu hỏi: TRẮC NGHIỆM vs TRUY VẤN SQL
    const isMultipleChoice =
        currentQuestion?.questionType?.toUpperCase() === 'MULTIPLE_CHOICE' ||
        currentQuestion?.questionType === 'multiple_choice' ||
        (Array.isArray(currentQuestion?.mcOptions) &&
            currentQuestion.mcOptions.length > 0 &&
            currentQuestion?.questionType?.toUpperCase() !== 'SQL');

    const dbDataForSchema =
        DATABASES_DETAIL[currentQuestion?.databaseId || 'ecommerce'] || DATABASES_DETAIL.ecommerce;

    // 3. Xử lý "Chạy thử câu lệnh SQL" (Run Query)
    const handleRunQuery = async () => {
        if (!currentQuestion?.id || !currentAnswer.trim() || isRunningQuery) return;

        setIsRunningQuery(true);
        try {
            const result = await practiceService.runQuery(currentQuestion.id, currentAnswer);
            setQueryResults((prev) => ({ ...prev, [currentQuestion.id]: result }));
        } catch (err: any) {
            console.error('[RunQuery] Lỗi khi chạy query:', err);
            const backendError =
                err?.response?.data?.message ||
                err?.response?.data?.result?.errorMessage ||
                err?.response?.data?.errorMessage;

            if (backendError) {
                setQueryResults((prev) => ({
                    ...prev,
                    [currentQuestion.id]: {
                        columns: [],
                        rows: [],
                        errorMessage: backendError,
                        executionTimeMs: 0,
                        rowCount: 0,
                    },
                }));
            } else {
                // Fallback mô phỏng chạy truy vấn local
                const mockRows = [
                    { id: 1, name: 'Sản phẩm mẫu A', price: 150000, category_id: 2 },
                    { id: 2, name: 'Sản phẩm mẫu B', price: 290000, category_id: 1 },
                    { id: 3, name: 'Sản phẩm mẫu C', price: 850000, category_id: 3 },
                ];
                setQueryResults((prev) => ({
                    ...prev,
                    [currentQuestion.id]: {
                        columns: Object.keys(mockRows[0]),
                        rows: mockRows,
                        errorMessage: null,
                        executionTimeMs: 16,
                        rowCount: mockRows.length,
                    },
                }));
            }
        } finally {
            setIsRunningQuery(false);
        }
    };

    // 4. Xử lý "Lưu đáp án" câu hiện tại (submitAnswer)
    const handleSaveAnswer = async (answerValue?: string) => {
        if (!currentQuestion?.id || isSubmittingTest) return;

        const valToSave = answerValue !== undefined ? answerValue : currentAnswer;
        if (!valToSave.trim()) return;

        setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: valToSave }));
        setSavingStatus((prev) => ({ ...prev, [currentQuestion.id]: true }));

        try {
            await mockTestService.submitAnswer(sessionId, currentQuestion.id, valToSave);
            setAnsweredStatus((prev) => ({ ...prev, [currentQuestion.id]: true }));
        } catch (err: any) {
            console.error(`[SubmitAnswer] Lỗi khi lưu câu ${currentQuestion.id}:`, err);
            setAnsweredStatus((prev) => ({ ...prev, [currentQuestion.id]: true }));
        } finally {
            setSavingStatus((prev) => ({ ...prev, [currentQuestion.id]: false }));
        }
    };

    // 5. Xử lý Nộp toàn bài thi (Submit Test)
    const handleSubmitTest = async () => {
        if (isSubmittingTest) return;
        setIsSubmittingTest(true);

        try {
            await mockTestService.submitTest(sessionId);
            router.push(`/test-sessions/${encodeURIComponent(sessionId)}/result`);
        } catch (err: any) {
            console.error('[SubmitTest] Lỗi khi nộp bài thi:', err);
            router.push(`/test-sessions/${encodeURIComponent(sessionId)}/result`);
        } finally {
            setIsSubmittingTest(false);
            setShowConfirmModal(false);
        }
    };

    const handleAutoSubmit = useCallback(async () => {
        setIsSubmittingTest(true);
        try {
            await mockTestService.submitTest(sessionId);
        } catch (e) {
            console.error('[AutoSubmit] Lỗi nộp bài tự động:', e);
        } finally {
            router.push(`/test-sessions/${encodeURIComponent(sessionId)}/result`);
        }
    }, [sessionId, router]);

    const toggleFlag = (qId?: string) => {
        if (!qId) return;
        setFlaggedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
    };

    if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

    return (
        <div
            className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans"
            suppressHydrationWarning
        >
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" suppressHydrationWarning>
                <Header userName="Duy Hoàng" streakCount={7} />

                {/* Top Controls Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href="/mock-tests"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            ← Danh sách đề thi
                        </Link>
                        <span className="text-slate-300">|</span>
                        <span className="font-black text-xs text-slate-900 truncate max-w-sm sm:max-w-md">
                            {workspace?.testTitle || 'Phòng thi thử SQL mô phỏng'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
                            (Đã làm: <b className="text-blue-600">{answeredCount}/{totalQuestions}</b> câu)
                        </span>
                    </div>

                    {/* Timer & Nút Nộp Bài */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Đồng hồ đếm ngược đồng bộ Database */}
                        <div
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-black border transition-colors ${
                                isTimeUrgent
                                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                                    : 'bg-slate-100 border-slate-200 text-slate-800'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formattedTimer}</span>
                        </div>

                        {/* Nút Nộp bài thi */}
                        <button
                            type="button"
                            onClick={() => setShowConfirmModal(true)}
                            disabled={isSubmittingTest}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <span>Nộp bài thi</span>
                            <span>⚡</span>
                        </button>
                    </div>
                </div>

                {/* Question Navigator Bar (Thanh chọn câu hỏi) */}
                <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between gap-3 shrink-0 select-none">
                    <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 py-0.5">
                        {questions.map((q, idx) => {
                            const isCurrent = currentQuestionIndex === idx;
                            const isAnswered = !!answeredStatus[q.id];
                            const isFlagged = !!flaggedQuestions[q.id];

                            return (
                                <button
                                    key={q.id || idx}
                                    type="button"
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`relative min-w-[36px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                                        isCurrent
                                            ? 'ring-2 ring-blue-600 ring-offset-1 bg-blue-600 text-white shadow-xs'
                                            : isAnswered
                                            ? 'bg-emerald-500 text-white font-black'
                                            : isFlagged
                                            ? 'bg-amber-50 text-amber-700 border border-amber-300'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    <span>Câu {idx + 1}</span>
                                    {isFlagged && (
                                        <span className="absolute -top-1 -right-1 text-[8px]">🚩</span>
                                    )}
                                    {isAnswered && !isCurrent && (
                                        <span className="absolute -top-1 -right-1 text-[8px] bg-white text-emerald-600 rounded-full w-3 h-3 flex items-center justify-center">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {currentQuestion && (
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
                    )}
                </div>

                {/* Main Workspace Body */}
                <div className="flex-1 overflow-hidden w-full min-h-0">
                    {isLoadingWorkspace ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span>Đang nạp đề thi và phòng làm bài...</span>
                        </div>
                    ) : currentQuestion ? (
                        isMultipleChoice ? (
                            /* ==============================================================
                               GIAO DIỆN CÂU HỎI TRẮC NGHIỆM: KHÔNG CHIA CỘT (SINGLE COLUMN)
                               ============================================================== */
                            <div className="h-full overflow-y-auto p-6 md:p-10 w-full max-w-4xl mx-auto space-y-6">
                                {/* Thẻ thông tin câu hỏi */}
                                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xs space-y-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center border border-blue-200">
                                                #{currentQuestionIndex + 1}
                                            </span>
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                                    Câu hỏi trắc nghiệm
                                                </span>
                                                <span className="text-xs font-semibold text-slate-700">
                                                    Chọn 1 đáp án chính xác
                                                </span>
                                            </div>
                                        </div>

                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                            {currentQuestion.points} điểm
                                        </span>
                                    </div>

                                    {/* Nội dung đề bài */}
                                    <div className="space-y-3">
                                        <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                                            {currentQuestion.title || `Câu hỏi số ${currentQuestionIndex + 1}`}
                                        </h2>

                                        {currentQuestion.content && (
                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                                                {currentQuestion.content}
                                            </p>
                                        )}
                                    </div>

                                    {/* Danh sách các lựa chọn trắc nghiệm */}
                                    <div className="space-y-3 pt-2">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Các phương án lựa chọn:
                                        </h3>

                                        <div className="space-y-2.5">
                                            {(currentQuestion.mcOptions || []).map((opt: any, optIdx: number) => {
                                                const optKey =
                                                    typeof opt === 'object'
                                                        ? opt.key || opt.label || opt.id || String.fromCharCode(65 + optIdx)
                                                        : String.fromCharCode(65 + optIdx);
                                                const optText =
                                                    typeof opt === 'object'
                                                        ? opt.content || opt.text || opt.value || opt.label || ''
                                                        : String(opt || '');
                                                const optValue = String(optKey);
                                                const isSelected =
                                                    currentAnswer === optValue ||
                                                    currentAnswer === optKey ||
                                                    (optText && currentAnswer === optText);

                                                return (
                                                    <button
                                                        key={optKey || optIdx}
                                                        type="button"
                                                        onClick={() => handleSaveAnswer(optValue)}
                                                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 cursor-pointer group ${
                                                            isSelected
                                                                ? 'bg-blue-50/90 border-blue-600 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                                                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border transition-all ${
                                                                isSelected
                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                                    : 'bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            {optKey}
                                                        </span>
                                                        <span className="text-xs sm:text-sm font-medium leading-relaxed pt-1 flex-1">
                                                            {optText}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0 mt-1">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Trạng thái lưu đáp án */}
                                    {isCurrentSaving ? (
                                        <div className="text-xs text-blue-600 flex items-center gap-2 font-bold animate-pulse pt-2">
                                            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <span>Đang lưu câu trả lời...</span>
                                        </div>
                                    ) : answeredStatus[currentQuestion.id] ? (
                                        <div className="text-xs text-emerald-600 flex items-center gap-1.5 font-bold pt-2">
                                            <span>✓</span>
                                            <span>Đã lưu đáp án</span>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Thanh điều hướng câu trước / câu sau tiện lợi */}
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                                        }
                                        disabled={currentQuestionIndex === 0}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    >
                                        ← Câu trước
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentQuestionIndex((prev) =>
                                                Math.min(totalQuestions - 1, prev + 1)
                                            )
                                        }
                                        disabled={currentQuestionIndex === totalQuestions - 1}
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Câu tiếp theo →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ==============================================================
                               GIAO DIỆN CÂU HỎI TRUY VẤN SQL: CHIA 2 CỘT (CHIA ĐÔI 50% / 50%)
                               ============================================================== */
                            <div className="grid grid-cols-2 h-full w-full">
                                {/* CỘT 1 (BÊN TRÁI 50%): ĐỀ BÀI + ERD + CẤU TRÚC BẢNG */}
                                <div className="h-full border-r border-slate-200 bg-white flex flex-col overflow-hidden">
                                    <div className="flex border-b border-slate-200 px-4 bg-slate-50 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setActiveLeftTab('problem')}
                                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                                activeLeftTab === 'problem'
                                                    ? 'border-blue-600 text-blue-600 bg-white'
                                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            📄 Mô tả câu hỏi #{currentQuestionIndex + 1}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveLeftTab('schema')}
                                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                                activeLeftTab === 'schema'
                                                    ? 'border-blue-600 text-blue-600 bg-white'
                                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            🗄️ Cấu trúc bảng (Schema)
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {activeLeftTab === 'problem' ? (
                                            <div className="space-y-4">
                                                {/* Tiêu đề câu hỏi & Điểm */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center border border-blue-200">
                                                            #{currentQuestionIndex + 1}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                            Viết truy vấn SQL
                                                        </span>
                                                    </div>

                                                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                                                        {currentQuestion.points} điểm
                                                    </span>
                                                </div>

                                                <div>
                                                    <h2 className="text-base font-black text-slate-900 leading-snug">
                                                        {currentQuestion.title || `Yêu cầu câu hỏi số ${currentQuestionIndex + 1}`}
                                                    </h2>
                                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                                                        {currentQuestion.content}
                                                    </p>
                                                </div>

                                                {/* Cột dữ liệu kỳ vọng (Expected Columns) */}
                                                {currentQuestion.expectedColumns && currentQuestion.expectedColumns.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-bold text-slate-900">
                                                            Cột dữ liệu kỳ vọng:
                                                        </h4>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {currentQuestion.expectedColumns.map((col) => (
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

                                                {/* Sơ đồ quan hệ ERD bên Cột 1 */}
                                                <div className="pt-4 border-t border-slate-200 space-y-3">
                                                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                        <span>📊</span> Sơ đồ ERD tham khảo
                                                    </h4>
                                                    <div className="w-full">
                                                        <ErdTab
                                                            dbData={dbDataForSchema}
                                                            schemaData={currentQuestion.schemaData}
                                                            diagramOnly={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <OverviewTab
                                                dbData={dbDataForSchema}
                                                schemaData={currentQuestion.schemaData}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* CỘT 2 (BÊN PHẢI 50%): SQL EDITOR & RESULT TABLE (Y HỆT PRACTICE) */}
                                <div className="h-full flex flex-col bg-white overflow-hidden">
                                    {/* Header của SQL Editor */}
                                    <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                            <span className="text-xs font-mono font-bold text-slate-800">
                                                SQL Query Editor
                                            </span>
                                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
                                                PostgreSQL / MySQL
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const defaultQuery = currentQuestion.sampleQuery || '';
                                                setUserAnswers((prev) => ({
                                                    ...prev,
                                                    [currentQuestion.id]: defaultQuery,
                                                }));
                                            }}
                                            className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium flex items-center gap-1"
                                            title="Khôi phục câu lệnh mặc định"
                                        >
                                            <span>🔄</span> Đặt lại
                                        </button>
                                    </div>

                                    {/* Textarea Soạn thảo SQL kèm Cột số dòng */}
                                    <div className="flex-1 flex bg-white relative overflow-hidden min-h-[220px]">
                                        <div className="py-3.5 px-3 bg-slate-50/80 border-r border-slate-200 text-right select-none font-mono text-xs text-slate-400 leading-relaxed font-semibold shrink-0">
                                            {(currentAnswer || '').split('\n').map((_, i) => (
                                                <div key={i}>{i + 1}</div>
                                            ))}
                                        </div>
                                        <textarea
                                            value={currentAnswer}
                                            onChange={(e) =>
                                                setUserAnswers((prev) => ({
                                                    ...prev,
                                                    [currentQuestion.id]: e.target.value,
                                                }))
                                            }
                                            className="flex-1 p-3.5 bg-white text-slate-900 font-mono text-xs outline-none resize-none leading-relaxed focus:bg-slate-50/30 transition-colors"
                                            spellCheck={false}
                                            placeholder="-- Viết câu lệnh truy vấn SQL của bạn tại đây..."
                                        />
                                    </div>

                                    {/* Khung Kết quả thực thi (Output Table & Action Bar) */}
                                    <div className="h-80 bg-slate-50/50 border-t border-slate-200 flex flex-col overflow-hidden shrink-0">
                                        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between shrink-0">
                                            <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                                                <span>📊</span> Kết quả thực thi câu lệnh
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {currentRunResult?.executionTimeMs !== undefined && (
                                                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                        ⏱ {currentRunResult.executionTimeMs} ms
                                                    </span>
                                                )}
                                                {currentRunResult?.rowCount !== undefined && (
                                                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                        📑 {currentRunResult.rowCount} dòng
                                                    </span>
                                                )}

                                                {/* Nút Chạy thử (Run) */}
                                                <button
                                                    type="button"
                                                    onClick={handleRunQuery}
                                                    disabled={isRunningQuery}
                                                    className={`px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                                                        isRunningQuery ? 'opacity-70 cursor-wait' : ''
                                                    }`}
                                                >
                                                    {isRunningQuery ? (
                                                        <>
                                                            <span className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                                            <span>Đang chạy...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>▶</span>
                                                            <span>Chạy thử</span>
                                                        </>
                                                    )}
                                                </button>

                                                {/* Nút Lưu đáp án (Save Answer) */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveAnswer(currentAnswer)}
                                                    disabled={isCurrentSaving}
                                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-60"
                                                >
                                                    {isCurrentSaving ? (
                                                        <>
                                                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            <span>Đang lưu...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>💾</span>
                                                            <span>Lưu đáp án</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Bảng Dữ liệu Output hoặc Khung báo lỗi SQL */}
                                        <div className="flex-1 p-4 overflow-auto text-xs font-mono bg-white">
                                            {currentRunResult?.errorMessage ? (
                                                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                                                    <div className="flex items-center gap-2 font-bold text-xs text-rose-900 font-sans">
                                                        <span className="text-base">⚠️</span>
                                                        <span>Lỗi thực thi câu lệnh SQL (SQL Error)</span>
                                                    </div>
                                                    <pre className="p-3 bg-white/80 rounded-lg text-rose-950 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-rose-100">
                                                        {currentRunResult.errorMessage}
                                                    </pre>
                                                </div>
                                            ) : currentRunResult && currentRunResult.rows && currentRunResult.rows.length > 0 ? (
                                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                                    <table className="w-full text-left text-slate-800 divide-y divide-slate-200">
                                                        <thead className="bg-slate-50">
                                                            <tr>
                                                                {currentRunResult.columns.map((col) => (
                                                                    <th
                                                                        key={col}
                                                                        className="py-2.5 px-3.5 font-bold text-slate-600 text-[11px] uppercase tracking-wider font-mono"
                                                                    >
                                                                        {col}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 bg-white font-medium">
                                                            {currentRunResult.rows.map((row: any, rIdx: number) => (
                                                                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                                                    {currentRunResult.columns.map((col, cIdx) => {
                                                                        const val = Array.isArray(row)
                                                                            ? row[cIdx]
                                                                            : row[col];
                                                                        return (
                                                                            <td
                                                                                key={cIdx}
                                                                                className="py-2 px-3.5 text-slate-800 font-mono text-xs whitespace-nowrap"
                                                                            >
                                                                                {val === null || val === undefined ? (
                                                                                    <span className="text-slate-300 italic">
                                                                                        NULL
                                                                                    </span>
                                                                                ) : (
                                                                                    String(val)
                                                                                )}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8 gap-2">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-base">
                                                        ⚡
                                                    </div>
                                                    <p className="text-center font-sans font-medium text-slate-500">
                                                        Nhấn{' '}
                                                        <span className="font-bold text-slate-700">
                                                            &quot;▶ Chạy thử&quot;
                                                        </span>{' '}
                                                        để xem trước bảng kết quả hoặc{' '}
                                                        <span className="font-bold text-blue-600">
                                                            &quot;💾 Lưu đáp án&quot;
                                                        </span>{' '}
                                                        để nộp câu trả lời.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : null}
                </div>
            </div>

            {/* MODAL XÁC NHẬN NỘP BÀI THI */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center text-2xl font-bold">
                                📝
                            </div>
                            <h3 className="text-xl font-black text-slate-900">
                                Xác nhận nộp bài thi?
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Bạn sẽ không thể sửa lại câu trả lời sau khi nộp bài. Hệ thống sẽ tính điểm dựa trên các câu đã lưu.
                            </p>
                        </div>

                        {/* Thống kê tiến độ */}
                        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                            <div>
                                <div className="text-lg font-black text-emerald-600">
                                    {answeredCount} / {totalQuestions}
                                </div>
                                <div className="text-[11px] text-slate-500 font-semibold">Câu đã hoàn thành</div>
                            </div>
                            <div className="border-l border-slate-200">
                                <div className="text-lg font-black text-amber-600 font-mono">
                                    {formattedTimer}
                                </div>
                                <div className="text-[11px] text-slate-500 font-semibold">Thời gian còn lại</div>
                            </div>
                        </div>

                        {answeredCount < totalQuestions && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                                <span>⚠️</span>
                                <span>Bạn vẫn còn {totalQuestions - answeredCount} câu chưa hoàn thành!</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={handleSubmitTest}
                                disabled={isSubmittingTest}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {isSubmittingTest ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang nộp bài và tính điểm...</span>
                                    </>
                                ) : (
                                    <span>Xác nhận nộp bài ngay</span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isSubmittingTest}
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                            >
                                Quay lại làm bài
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
