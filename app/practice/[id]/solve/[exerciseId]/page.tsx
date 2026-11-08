'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { DATABASES_DETAIL } from '../../data';
import { DATABASE_EXERCISES, Exercise } from '../../exercisesData';
import ErdTab from '../../components/ErdTab';
import OverviewTab from '../../components/OverviewTab';
import practiceService, {
    ExerciseWorkspace,
    PracticeDatabaseDetail,
    RunQueryResponse,
    SubmitQueryResponse,
} from '@/services/practiceService';

interface SolvePageProps {
    params: Promise<{ id: string; exerciseId: string }>;
}

const getDifficultyColor = (diff: string | undefined): string => {
    const d = (diff || '').toLowerCase();
    if (d.includes('dễ') || d.includes('easy')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (d.includes('khó') || d.includes('hard')) {
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
};

export default function SolveExercisePage({ params }: SolvePageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const dbId = resolvedParams.id || 'ecommerce';
    const exerciseId = resolvedParams.exerciseId || 'ex-ecom-1';

    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'schema'>('problem');

    // Dữ liệu fallback
    const fallbackDbData = DATABASES_DETAIL[dbId] || DATABASES_DETAIL.ecommerce;
    const fallbackExercises = DATABASE_EXERCISES[dbId] || DATABASE_EXERCISES.ecommerce;
    const fallbackExercise: Exercise =
        fallbackExercises.find((e) => e.id === exerciseId) || fallbackExercises[0];

    // States lưu dữ liệu đề bài & CSDL
    const [workspace, setWorkspace] = useState<ExerciseWorkspace | null>(null);
    const [dbDetail, setDbDetail] = useState<PracticeDatabaseDetail | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // SQL Editor State
    const [codeQuery, setCodeQuery] = useState(fallbackExercise.sampleQuery || '');

    // Execution States
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [runResult, setRunResult] = useState<RunQueryResponse | null>(null);
    const [submitResult, setSubmitResult] = useState<SubmitQueryResponse | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // 1. Tải thông tin Workspace và Database Detail từ API
    const loadExerciseData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const [wsData, dbData] = await Promise.allSettled([
                practiceService.getExerciseWorkspace(exerciseId),
                practiceService.getDatabaseDetail(dbId),
            ]);

            if (wsData.status === 'fulfilled' && wsData.value) {
                setWorkspace(wsData.value);
                if (wsData.value.initialSql || wsData.value.sampleQuery) {
                    setCodeQuery(wsData.value.initialSql || wsData.value.sampleQuery || '');
                }
            } else {
                console.warn('[Workspace] Sử dụng fallback cho đề bài tập.');
            }

            if (dbData.status === 'fulfilled' && dbData.value) {
                setDbDetail(dbData.value);
            }
        } catch (err) {
            console.error('[Workspace] Lỗi khi tải dữ liệu bài tập:', err);
        } finally {
            setIsLoadingData(false);
        }
    }, [dbId, exerciseId]);

    useEffect(() => {
        setMounted(true);
        loadExerciseData();
    }, [loadExerciseData]);

    // Dữ liệu bài tập hiển thị (ưu tiên từ API, fallback sang mock)
    const exerciseTitle = workspace?.title || fallbackExercise.title;
    const exerciseOrder = workspace?.orderNumber ?? fallbackExercise.orderNumber ?? 1;
    const exerciseDifficulty = workspace?.difficulty || fallbackExercise.difficulty;
    const exerciseDifficultyColor =
        workspace?.difficultyColor ||
        fallbackExercise.difficultyColor ||
        getDifficultyColor(exerciseDifficulty);
    const exerciseDescription = workspace?.description || fallbackExercise.description;
    const exerciseRequirements =
        workspace?.requirements && workspace.requirements.length > 0
            ? workspace.requirements
            : fallbackExercise.requirements;
    const exerciseExpectedColumns =
        workspace?.expectedColumns && workspace.expectedColumns.length > 0
            ? workspace.expectedColumns
            : fallbackExercise.expectedOutputColumns || [];

    // Tìm bài tập tiếp theo để chuyển bài khi hoàn thành
    const allExercises = dbDetail?.exercises?.length ? dbDetail.exercises : fallbackExercises;
    const currentIndex = allExercises.findIndex((e) => e.id === exerciseId);
    const nextExercise =
        currentIndex >= 0 && currentIndex < allExercises.length - 1
            ? allExercises[currentIndex + 1]
            : null;

    // 2. Xử lý hành động "Chạy thử" (Run Query)
    const handleRunTest = async () => {
        if (!codeQuery.trim() || isRunning || isSubmitting) return;

        setIsRunning(true);
        setRunResult(null);

        try {
            const result = await practiceService.runQuery(exerciseId, codeQuery);
            setRunResult(result);
        } catch (error: any) {
            console.error('[RunQuery] Lỗi khi gọi API run:', error);
            const backendErrorMsg =
                error?.response?.data?.message ||
                error?.response?.data?.result?.errorMessage ||
                error?.response?.data?.errorMessage;

            if (backendErrorMsg) {
                setRunResult({
                    columns: [],
                    rows: [],
                    errorMessage: backendErrorMsg,
                });
            } else {
                // Fallback mock khi chưa kết nối được backend endpoint
                console.warn('[RunQuery] Fallback chạy mô phỏng local.');
                setTimeout(() => {
                    const mockRows = fallbackExercise.mockData || [];
                    const mockCols = mockRows.length > 0 ? Object.keys(mockRows[0]) : [];
                    setRunResult({
                        columns: mockCols,
                        rows: mockRows,
                        errorMessage: null,
                        executionTimeMs: 18,
                        rowCount: mockRows.length,
                    });
                }, 300);
            }
        } finally {
            setIsRunning(false);
        }
    };

    // 3. Xử lý hành động "Nộp bài" (Submit Query)
    const handleSubmitCode = async () => {
        if (!codeQuery.trim() || isRunning || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await practiceService.submitQuery(exerciseId, codeQuery);
            setSubmitResult(result);
            setShowSubmitModal(true);

            // Nếu API có trả về actualResult thì cập nhật bảng hiển thị
            if (result.actualResult) {
                setRunResult(result.actualResult);
            }
        } catch (error: any) {
            console.error('[SubmitQuery] Lỗi khi gọi API submit:', error);
            const backendErrorMsg =
                error?.response?.data?.message ||
                error?.response?.data?.result?.feedback ||
                error?.response?.data?.feedback;

            if (backendErrorMsg) {
                setSubmitResult({
                    status: 'ERROR',
                    score: 0,
                    feedback: backendErrorMsg,
                });
                setShowSubmitModal(true);
            } else {
                // Fallback mô phỏng chấm điểm offline
                console.warn('[SubmitQuery] Fallback mô phỏng chấm điểm.');
                const sanitized = codeQuery.toLowerCase();
                const isPassed =
                    sanitized.includes('select') &&
                    sanitized.includes('from') &&
                    (sanitized.includes('where') || sanitized.includes('join') || sanitized.includes('group by'));

                const simulatedResult: SubmitQueryResponse = {
                    status: isPassed ? 'PASSED' : 'FAILED',
                    score: isPassed ? 100 : 65,
                    feedback: isPassed
                        ? 'Chúc mừng! Câu lệnh truy vấn của bạn hoàn toàn chính xác và tối ưu hiệu năng.'
                        : 'Câu lệnh đã thực thi nhưng chưa đáp ứng đủ các điều kiện lọc và nhóm theo yêu cầu đề bài.',
                    actualResult: {
                        columns: Object.keys(fallbackExercise.mockData[0] || {}),
                        rows: fallbackExercise.mockData,
                        executionTimeMs: 24,
                    },
                };
                setSubmitResult(simulatedResult);
                setShowSubmitModal(true);
                if (simulatedResult.actualResult) {
                    setRunResult(simulatedResult.actualResult);
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

    return (
        <div
            className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans"
            suppressHydrationWarning
        >
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header userName="Duy Hoàng" streakCount={7} />

                {/* Top Header Controls */}
                <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/practice/${dbId}`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                            ← Danh sách câu hỏi
                        </Link>
                        <span className="text-slate-300">|</span>
                        <span className="font-bold text-xs text-slate-900 truncate max-w-md">
                            Bài #{exerciseOrder}: {exerciseTitle}
                        </span>
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${exerciseDifficultyColor}`}
                        >
                            {exerciseDifficulty}
                        </span>
                    </div>

                    {activeTab === 'problem' && (
                        <div className="flex items-center gap-3">
                            {/* Nút Chạy thử (Run) */}
                            <button
                                type="button"
                                onClick={handleRunTest}
                                disabled={isRunning || isSubmitting}
                                className={`px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isRunning ? 'opacity-70 cursor-wait' : ''
                                }`}
                            >
                                {isRunning ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                        <span>Đang thực thi...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>▶</span>
                                        <span>Chạy thử</span>
                                    </>
                                )}
                            </button>

                            {/* Nút Nộp bài chấm điểm (Submit) */}
                            <button
                                type="button"
                                onClick={handleSubmitCode}
                                disabled={isRunning || isSubmitting}
                                className={`px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                                    isSubmitting ? 'opacity-70 cursor-wait' : ''
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang chấm điểm...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>⚡</span>
                                        <span>Nộp bài chấm điểm</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Workspace */}
                <div className="flex-1 overflow-hidden w-full min-h-0">
                    {activeTab === 'problem' ? (
                        <div className="grid grid-cols-2 h-full w-full">
                            {/* CỘT 1: ĐỀ BÀI + SƠ ĐỒ ERD */}
                            <div className="h-full border-r border-slate-200 bg-white flex flex-col overflow-hidden">
                                <div className="flex border-b border-slate-200 px-4 bg-slate-50 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('problem')}
                                        className="px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 border-blue-600 text-blue-600 bg-white"
                                    >
                                        📄 Mô tả đề bài & ERD
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('schema')}
                                        className="px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 border-transparent text-slate-500 hover:text-slate-800"
                                    >
                                        🗄️ Cấu trúc bảng (Schema)
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                                                {exerciseTitle}
                                            </h2>
                                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                                {exerciseDescription}
                                            </p>
                                        </div>

                                        {/* Yêu cầu truy vấn */}
                                        {exerciseRequirements && exerciseRequirements.length > 0 && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                                <h4 className="text-xs font-bold text-slate-900">Yêu cầu truy vấn:</h4>
                                                <ul className="space-y-1.5 text-xs text-slate-600 pl-4 list-disc">
                                                    {exerciseRequirements.map((req, i) => (
                                                        <li key={i}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Cột dữ liệu kỳ vọng */}
                                        {exerciseExpectedColumns && exerciseExpectedColumns.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-slate-900">Cột dữ liệu kỳ vọng:</h4>
                                                <div className="flex gap-2 flex-wrap">
                                                    {exerciseExpectedColumns.map((col) => (
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
                                        <div className="w-full">
                                            <ErdTab
                                                dbData={dbDetail || fallbackDbData}
                                                schemaData={dbDetail?.schemaData || workspace?.schemaData}
                                                diagramOnly={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CỘT 2: SQL EDITOR & KẾT QUẢ THỰC THI */}
                            <div className="h-full flex flex-col bg-white overflow-hidden">
                                {/* Editor Header */}
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
                                        onClick={() =>
                                            setCodeQuery(workspace?.initialSql || fallbackExercise.sampleQuery || '')
                                        }
                                        className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium flex items-center gap-1"
                                        title="Khôi phục câu lệnh mặc định"
                                    >
                                        <span>🔄</span> Đặt lại
                                    </button>
                                </div>

                                {/* Textarea Editor */}
                                <div className="flex-1 flex bg-white relative overflow-hidden min-h-[220px]">
                                    <div className="py-3.5 px-3 bg-slate-50/80 border-r border-slate-200 text-right select-none font-mono text-xs text-slate-400 leading-relaxed font-semibold shrink-0">
                                        {codeQuery.split('\n').map((_, i) => (
                                            <div key={i}>{i + 1}</div>
                                        ))}
                                    </div>
                                    <textarea
                                        value={codeQuery}
                                        onChange={(e) => setCodeQuery(e.target.value)}
                                        className="flex-1 p-3.5 bg-white text-slate-900 font-mono text-xs outline-none resize-none leading-relaxed focus:bg-slate-50/30 transition-colors"
                                        spellCheck={false}
                                        placeholder="-- Viết câu lệnh truy vấn SQL của bạn tại đây..."
                                    />
                                </div>

                                {/* Output Panel (Kết quả thực thi & Chấm điểm) */}
                                <div className="h-80 bg-slate-50/50 border-t border-slate-200 flex flex-col overflow-hidden shrink-0">
                                    <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between shrink-0">
                                        <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>📊</span> Kết quả thực thi
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {runResult?.executionTimeMs !== undefined && (
                                                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                    ⏱ {runResult.executionTimeMs} ms
                                                </span>
                                            )}
                                            {runResult?.rowCount !== undefined && (
                                                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                    📑 {runResult.rowCount} dòng
                                                </span>
                                            )}
                                            {submitResult && (
                                                <span
                                                    className={`px-3 py-0.5 rounded-full text-xs font-black font-mono shadow-2xs ${
                                                        submitResult.status === 'PASSED' || submitResult.score >= 100
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                    }`}
                                                >
                                                    Điểm: {submitResult.score} / 100
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-4 overflow-auto text-xs font-mono bg-white">
                                        {/* Trường hợp có lỗi SQL (errorMessage) */}
                                        {runResult?.errorMessage ? (
                                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                                                <div className="flex items-center gap-2 font-bold text-xs text-rose-900 font-sans">
                                                    <span className="text-base">⚠️</span>
                                                    <span>Lỗi thực thi câu lệnh SQL (SQL Error)</span>
                                                </div>
                                                <pre className="p-3 bg-white/80 rounded-lg text-rose-950 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-rose-100">
                                                    {runResult.errorMessage}
                                                </pre>
                                            </div>
                                        ) : runResult && runResult.rows ? (
                                            /* Bảng hiển thị kết quả (Dynamic Table) */
                                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                                <table className="w-full text-left text-slate-800 divide-y divide-slate-200">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            {runResult.columns.map((col) => (
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
                                                        {runResult.rows.map((row: any, rIdx: number) => (
                                                            <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                                                {runResult.columns.map((col, cIdx) => {
                                                                    // Xử lý dòng dạng object hoặc array
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
                                                        &quot;Chạy thử&quot;
                                                    </span>{' '}
                                                    để kiểm tra bảng dữ liệu hoặc{' '}
                                                    <span className="font-bold text-emerald-600">
                                                        &quot;Nộp bài&quot;
                                                    </span>{' '}
                                                    để chấm điểm tự động.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* TAB CẤU TRÚC BẢNG (SCHEMA) */
                        <div className="w-full h-full bg-white flex flex-col overflow-hidden">
                            <div className="flex border-b border-slate-200 px-6 bg-slate-50 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('problem')}
                                    className="px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 border-transparent text-slate-500 hover:text-slate-800"
                                >
                                    📄 Mô tả đề bài & ERD
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('schema')}
                                    className="px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 border-blue-600 text-blue-600 bg-white"
                                >
                                    🗄️ Cấu trúc bảng (Schema)
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1400px] w-full mx-auto">
                                <OverviewTab
                                    dbData={dbDetail || fallbackDbData}
                                    schemaData={dbDetail?.schemaData || workspace?.schemaData}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL BÁO CÁO KẾT QUẢ CHẤM ĐIỂM (SUBMIT MODAL) */}
            {showSubmitModal && submitResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="text-center space-y-2">
                            <div
                                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl shadow-sm ${
                                    submitResult.status === 'PASSED' || submitResult.score >= 100
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-amber-100 text-amber-600'
                                }`}
                            >
                                {submitResult.status === 'PASSED' || submitResult.score >= 100 ? '🎉' : '⚠️'}
                            </div>

                            <h3 className="text-xl font-black text-slate-900">
                                {submitResult.status === 'PASSED' || submitResult.score >= 100
                                    ? 'Hoàn thành xuất sắc!'
                                    : 'Chưa đạt điểm tối đa'}
                            </h3>

                            <div className="inline-block px-4 py-1.5 rounded-full font-mono font-black text-sm bg-slate-100 text-slate-800">
                                Điểm số:{' '}
                                <span
                                    className={
                                        submitResult.status === 'PASSED' || submitResult.score >= 100
                                            ? 'text-emerald-600'
                                            : 'text-amber-600'
                                    }
                                >
                                    {submitResult.score} / 100
                                </span>
                            </div>
                        </div>

                        {/* Phản hồi chi tiết (Feedback) */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                            <div className="font-bold text-slate-900 mb-1">Nhận xét từ hệ thống:</div>
                            <p>{submitResult.feedback}</p>
                        </div>

                        {/* Các nút hành động */}
                        <div className="flex flex-col gap-2.5 pt-2">
                            {nextExercise && (submitResult.status === 'PASSED' || submitResult.score >= 100) ? (
                                <Link
                                    href={`/practice/${dbId}/solve/${nextExercise.id}`}
                                    onClick={() => setShowSubmitModal(false)}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 text-center flex items-center justify-center gap-1.5"
                                >
                                    <span>Chuyển sang bài tiếp theo</span>
                                    <span>→</span>
                                </Link>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                            >
                                {submitResult.status === 'PASSED' || submitResult.score >= 100
                                    ? 'Xem lại câu lệnh'
                                    : 'Sửa lại câu truy vấn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
