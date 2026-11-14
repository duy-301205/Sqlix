'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import mockTestService, { TestResultResponse } from '@/services/mockTestService';
import historyService, { HistoryDetail } from '@/services/historyService';
import {
    Award,
    CheckCircle2,
    XCircle,
    Clock,
    Target,
    HelpCircle,
    RotateCcw,
    History,
    Home,
    AlertCircle,
    Check,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

interface ResultPageProps {
    params: Promise<{ sessionId: string }>;
}

export default function TestResultPage({ params }: ResultPageProps) {
    const resolvedParams = use(params);
    const sessionId = resolvedParams.sessionId;

    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [resultData, setResultData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!sessionId) return;

        const fetchResult = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Ưu tiên 1: Gọi API kết quả phiên thi trực tiếp từ phòng thi
                const result = await mockTestService.getTestResult(sessionId);
                setResultData(result);
            } catch (err: any) {
                console.warn('[TestResult] Không thể lấy từ getTestResult, fallback sang getHistoryDetail:', err?.message);
                try {
                    // Fallback 2: Lấy từ chi tiết lịch sử bài thi
                    const historyDetail = await historyService.getHistoryDetail(sessionId);
                    setResultData(historyDetail);
                } catch (fallbackErr: any) {
                    console.error('[TestResult] Lỗi lấy kết quả thi:', fallbackErr);
                    setError('Không thể tải chi tiết kết quả bài thi. Vui lòng thử lại sau.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchResult();
    }, [sessionId]);

    if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

    // Tính toán các chỉ số điểm và kết quả
    const questions: any[] = resultData?.questions || resultData?.questionsReview || [];
    const totalScore = resultData?.totalScore ?? resultData?.score ?? 0;
    
    // Tính tổng điểm tối đa của đề thi
    const maxScore =
        resultData?.maxScore ||
        questions.reduce((sum: number, q: any) => sum + (q.points || q.maxScore || q.maxPoints || 0), 0) ||
        100;

    const passingScore = resultData?.passingScore ?? Math.round(maxScore * 0.6);
    const isPassed =
        resultData?.isPassed !== undefined
            ? Boolean(resultData.isPassed)
            : totalScore >= passingScore;

    const correctCount =
        resultData?.correctCount ??
        questions.filter((q: any) => Boolean(q.isCorrect)).length;

    const totalQuestions = resultData?.totalQuestions || questions.length || 0;
    const accuracyRate =
        totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Thời gian làm bài
    const durationSeconds =
        resultData?.durationSeconds ??
        resultData?.durationDeducted ??
        resultData?.timeSpentSeconds ??
        0;
    const durationMinutes = Math.floor(durationSeconds / 60);
    const durationRemainingSeconds = durationSeconds % 60;
    const formattedDuration =
        durationMinutes > 0
            ? `${durationMinutes} phút ${durationRemainingSeconds} giây`
            : `${durationRemainingSeconds} giây`;

    return (
        <div
            className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans"
            suppressHydrationWarning
        >
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" suppressHydrationWarning>
                <Header userName="Học viên" streakCount={7} />

                <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 w-full max-w-[1000px] mx-auto space-y-8">
                    {/* Loading State */}
                    {isLoading ? (
                        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xs text-center space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm font-semibold text-slate-600">
                                Đang tổng hợp điểm và kết quả bài thi...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-3xl p-10 border border-rose-200 shadow-xs text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-2xl">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Không thể tải kết quả bài thi</h2>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{error}</p>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <Link
                                    href="/history"
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
                                >
                                    Xem lại trong lịch sử thi
                                </Link>
                                <Link
                                    href="/mock-tests"
                                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                                >
                                    Về danh sách đề thi
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Card Tổng quan Kết Quả Thi */}
                            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-md space-y-6">
                                <div className="text-center space-y-3">
                                    <div
                                        className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner animate-in zoom-in-95 duration-300 ${
                                            isPassed
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-amber-100 text-amber-600'
                                        }`}
                                    >
                                        {isPassed ? '🏆' : '📝'}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-1">
                                            {isPassed ? (
                                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đạt yêu cầu qua bài
                                                </span>
                                            ) : (
                                                <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                                                    <XCircle className="w-3.5 h-3.5" /> Chưa đạt điểm qua bài
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                            {isPassed
                                                ? 'Chúc mừng! Bạn đã hoàn thành xuất sắc bài thi!'
                                                : 'Bạn đã hoàn thành bài thi!'}
                                        </h1>
                                        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                                            {isPassed
                                                ? `Bạn đã đạt ${totalScore}/${maxScore} điểm, vượt qua mức điểm yêu cầu (${passingScore} điểm). Kết quả đã được lưu vào hệ thống.`
                                                : `Bạn đạt ${totalScore}/${maxScore} điểm (điểm đạt yêu cầu: ${passingScore} điểm). Hãy xem lại lời giải chi tiết bên dưới để ôn luyện nhé.`}
                                        </p>
                                        <div className="font-mono text-xs text-slate-400 pt-1">
                                            Mã phiên thi: <span className="text-slate-700 font-bold">{sessionId}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 4 Ô Grid Thống Kê Điểm Số */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50/80 border border-slate-200 rounded-2xl">
                                    {/* 1. Tổng điểm */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-center shadow-2xs">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                            <Award className="w-3.5 h-3.5 text-blue-600" /> Tổng điểm
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                                            <span className={isPassed ? 'text-emerald-600' : 'text-slate-900'}>
                                                {totalScore}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-400">/{maxScore}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-1">
                                            Điểm đạt: <strong>{passingScore}</strong>
                                        </div>
                                    </div>

                                    {/* 2. Số câu đúng */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-center shadow-2xs">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Số câu đúng
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                                            {correctCount}
                                            <span className="text-sm font-semibold text-slate-400">/{totalQuestions}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-1">
                                            Đúng {accuracyRate}% câu hỏi
                                        </div>
                                    </div>

                                    {/* 3. Tỷ lệ chính xác */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-center shadow-2xs">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                            <Target className="w-3.5 h-3.5 text-purple-600" /> Tỷ lệ đạt
                                        </div>
                                        <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
                                            {accuracyRate}%
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-1">
                                            {isPassed ? 'Đạt tiêu chuẩn' : 'Cần cố gắng thêm'}
                                        </div>
                                    </div>

                                    {/* 4. Thời gian làm bài */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-center shadow-2xs">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Thời gian
                                        </div>
                                        <div className="text-lg sm:text-xl font-black text-slate-800 font-mono mt-1">
                                            {formattedDuration}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-1">Thời gian thực tế</div>
                                    </div>
                                </div>

                                {/* Nút Điều Hướng Nhanh */}
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <Link
                                        href="/history"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20"
                                    >
                                        <History className="w-4 h-4" />
                                        <span>Xem Lịch sử thi của bạn</span>
                                    </Link>

                                    <Link
                                        href="/mock-tests"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
                                    >
                                        <Home className="w-4 h-4" />
                                        <span>Danh sách đề thi</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Chi Tiết Từng Câu Hỏi & Lời Giải */}
                            {questions.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                            <span>Chi tiết từng câu hỏi &amp; Lời giải</span>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                                {questions.length} câu
                                            </span>
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        {questions.map((q: any, idx: number) => {
                                            const isMc =
                                                q.questionType === 'MULTIPLE_CHOICE' ||
                                                q.type === 'MULTIPLE_CHOICE' ||
                                                q.type === 'multiple_choice';

                                            const correctOptionKey =
                                                q.mcCorrectOption ||
                                                q.correctAnswer ||
                                                q.solutionAnswer ||
                                                '';

                                            const earnedScore = q.score !== undefined ? q.score : (q.points ?? 0);
                                            const totalQuestionPoints =
                                                q.maxScore !== undefined
                                                    ? q.maxScore
                                                    : (q.points ?? q.maxPoints ?? 10);

                                            // Tìm nội dung của phương án trắc nghiệm đúng nếu có mcOptions
                                            const matchingOption = Array.isArray(q.mcOptions)
                                                ? q.mcOptions.find((o: any) => (o.key || o.id) === correctOptionKey)
                                                : null;

                                            return (
                                                <div
                                                    key={q.questionId || idx}
                                                    className={`rounded-2xl border p-5 sm:p-6 transition-all bg-white shadow-2xs ${
                                                        q.isCorrect
                                                            ? 'border-emerald-200 hover:border-emerald-300'
                                                            : 'border-rose-200 hover:border-rose-300'
                                                    }`}
                                                >
                                                    {/* Header câu hỏi */}
                                                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                {isMc ? 'Trắc nghiệm' : 'Truy vấn SQL'}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-600">
                                                                {earnedScore} / {totalQuestionPoints} điểm
                                                            </span>
                                                            {q.isCorrect ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    <Check className="w-3.5 h-3.5" /> Đúng
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                                    <X className="w-3.5 h-3.5" /> Sai
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Đề bài */}
                                                    <p className="font-semibold text-slate-900 text-sm mb-4 leading-relaxed">
                                                        {q.content || q.questionText || 'Nội dung câu hỏi'}
                                                    </p>

                                                    {/* Câu trả lời của người dùng */}
                                                    <div className="mb-3">
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                                                            Câu trả lời của bạn:
                                                        </span>
                                                        <div
                                                            className={`p-3 rounded-xl text-xs font-mono whitespace-pre-wrap ${
                                                                q.isCorrect
                                                                    ? 'bg-emerald-50/50 border border-emerald-200 text-slate-800'
                                                                    : 'bg-rose-50/50 border border-rose-200 text-rose-700 font-semibold'
                                                            }`}
                                                        >
                                                            {q.submittedAnswer || q.userAnswer || '(Chưa chọn câu trả lời)'}
                                                        </div>
                                                    </div>

                                                    {/* Đáp án chính xác */}
                                                    <div className="mb-3">
                                                        <span className="text-[11px] font-bold text-emerald-700 uppercase block mb-1">
                                                            Đáp án chính xác:
                                                        </span>
                                                        {isMc ? (
                                                            <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
                                                                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                                                    {correctOptionKey || '?'}
                                                                </span>
                                                                <span>
                                                                    Phương án chính xác:{' '}
                                                                    <strong>
                                                                        {correctOptionKey}
                                                                        {matchingOption?.content
                                                                            ? ` - ${matchingOption.content}`
                                                                            : ''}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="p-3.5 rounded-xl text-xs font-mono bg-slate-900 text-emerald-400 whitespace-pre-wrap border border-slate-800 shadow-inner">
                                                                {q.solutionQuery || q.correctAnswer || q.solutionAnswer || '(Chưa có câu truy vấn mẫu)'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Giải thích chi tiết */}
                                                    {q.explanation && (
                                                        <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/70 text-xs text-blue-900 flex items-start gap-2.5">
                                                            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong className="font-bold text-blue-950">Giải thích chi tiết: </strong>
                                                                <span>{q.explanation}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
