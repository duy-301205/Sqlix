'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
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
import {
    Maximize2,
    Minimize2,
    Play,
    Zap,
    RotateCcw,
    Copy,
    Check,
    PanelLeftClose,
    PanelLeftOpen,
    GripVertical,
    GripHorizontal,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Columns2,
    Clock,
    Layers,
    FileText,
    Database,
    BookOpen,
    X,
} from 'lucide-react';

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

// SQL keyword formatter helper
function formatSqlQuery(sql: string): string {
    if (!sql.trim()) return sql;
    const keywords = [
        'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT',
        'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN',
        'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'ASC', 'DESC',
        'LIMIT', 'OFFSET', 'UNION', 'ALL', 'AS', 'IN', 'BETWEEN',
        'LIKE', 'ILIKE', 'IS NULL', 'IS NOT NULL', 'CASE', 'WHEN', 'THEN',
        'ELSE', 'END', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
        'EXISTS', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'ROUND'
    ];
    let formatted = sql;
    keywords.forEach((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, kw);
    });
    return formatted;
}

export default function SolveExercisePage({ params }: SolvePageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const dbId = resolvedParams.id || 'ecommerce';
    const exerciseId = resolvedParams.exerciseId || 'ex-ecom-1';

    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'problem' | 'schema'>('problem');

    // Workspace Layout Resizing & Fullscreen States
    const [leftPanelWidth, setLeftPanelWidth] = useState(48); // %
    const [editorHeight, setEditorHeight] = useState(55); // %
    const [isDraggingH, setIsDraggingH] = useState(false);
    const [isDraggingV, setIsDraggingV] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
    const [showFullscreenRef, setShowFullscreenRef] = useState(false);
    const [fullscreenTab, setFullscreenTab] = useState<'problem' | 'schema'>('problem');
    const [fullscreenRightWidth, setFullscreenRightWidth] = useState(50); // %
    const [isDraggingFullscreenH, setIsDraggingFullscreenH] = useState(false);
    const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
    const [copiedQuery, setCopiedQuery] = useState(false);
    const [copiedCol, setCopiedCol] = useState<string | null>(null);

    const workspaceRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumsRef = useRef<HTMLDivElement>(null);

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

    const savedQueryRef = useRef<string | null>(null);
    const savedResultRef = useRef<SubmitQueryResponse | null>(null);
    const submissionPromiseRef = useRef<Promise<SubmitQueryResponse> | null>(null);
    const [submissionError, setSubmissionError] = useState('');

    // Restore saved layout preferences
    useEffect(() => {
        try {
            const savedW = localStorage.getItem('sqlix_workspace_left_width');
            if (savedW) {
                const num = parseFloat(savedW);
                if (!isNaN(num) && num >= 25 && num <= 75) setLeftPanelWidth(num);
            }
            const savedH = localStorage.getItem('sqlix_workspace_editor_height');
            if (savedH) {
                const num = parseFloat(savedH);
                if (!isNaN(num) && num >= 25 && num <= 80) setEditorHeight(num);
            }
            const savedSide = localStorage.getItem('sqlix_sidebar_collapsed');
            if (savedSide !== null) setIsSidebarCollapsed(savedSide === 'true');
        } catch {
            // ignore localStorage errors
        }
    }, []);

    // 1. Tải thông tin Workspace và Database Detail từ API
    const loadExerciseData = useCallback(async () => {
        savedQueryRef.current = null;
        savedResultRef.current = null;
        setSubmitResult(null);
        setSubmissionError('');
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

    // Handle Esc key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isEditorFullscreen) {
                setIsEditorFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditorFullscreen]);

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
            if (isOutputCollapsed) setIsOutputCollapsed(false);
        } catch (error: any) {
            console.error('[RunQuery] Lỗi khi gọi API run:', error);
            const backendErrorMsg =
                error?.response?.data?.message ||
                error?.response?.data?.result?.errorMessage ||
                error?.response?.data?.errorMessage;

            if (backendErrorMsg) {
                setRunResult({
                    status: 'ERROR',
                    errorMessage: backendErrorMsg,
                    columns: [],
                    rows: [],
                    rowCount: 0,
                    executionTimeMs: 0,
                });
                if (isOutputCollapsed) setIsOutputCollapsed(false);
            } else {
                setRunResult({
                    status: 'ERROR',
                    errorMessage:
                        error?.message ||
                        'Lỗi hệ thống khi thực thi truy vấn. Vui lòng kiểm tra lại câu lệnh.',
                    columns: [],
                    rows: [],
                    rowCount: 0,
                    executionTimeMs: 0,
                });
                if (isOutputCollapsed) setIsOutputCollapsed(false);
            }
        } finally {
            setIsRunning(false);
        }
    };

    const saveCurrentAttempt = (): Promise<SubmitQueryResponse> => {
        if (submissionPromiseRef.current) {
            return submissionPromiseRef.current.then(() => saveCurrentAttempt());
        }
        if (savedQueryRef.current === codeQuery && savedResultRef.current) return Promise.resolve(savedResultRef.current);
        const query = codeQuery;
        setIsSubmitting(true);
        setSubmissionError('');
        const promise = practiceService.finishExercise(exerciseId, query).then((result) => {
            savedQueryRef.current = query;
            savedResultRef.current = result;
            setSubmitResult(result);
            if (result.actualResult) setRunResult(result.actualResult);
            return result;
        }).finally(() => {
            submissionPromiseRef.current = null;
            setIsSubmitting(false);
        });
        submissionPromiseRef.current = promise;
        return promise;
    };

    const handleSubmitCode = async () => {
        if (!codeQuery.trim() || isRunning || isSubmitting) return;
        try {
            await saveCurrentAttempt();
            setShowSubmitModal(true);
        } catch (error: any) {
            setSubmissionError(error?.response?.data?.message || error?.message || 'Không thể nộp bài. Vui lòng thử lại.');
        }
    };

    // Horizontal Split Drag Handler (Between Left and Right Columns)
    const handleStartDragH = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingH(true);
        const container = workspaceRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - containerRect.left;
            const newPct = (deltaX / containerRect.width) * 100;
            const clamped = Math.min(75, Math.max(25, newPct));
            setLeftPanelWidth(clamped);
        };

        const onMouseUp = () => {
            setIsDraggingH(false);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            try {
                localStorage.setItem('sqlix_workspace_left_width', String(leftPanelWidth));
            } catch {}
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    // Fullscreen Horizontal Split Drag Handler (Between Editor and Đề bài & ERD)
    const handleStartDragFullscreenH = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingFullscreenH(true);
        const container = fullscreenContainerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - containerRect.left;
            const leftPct = (deltaX / containerRect.width) * 100;
            const rightPct = 100 - leftPct;
            const clamped = Math.min(75, Math.max(25, rightPct));
            setFullscreenRightWidth(clamped);
        };

        const onMouseUp = () => {
            setIsDraggingFullscreenH(false);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    // Vertical Split Drag Handler (Between Editor and Output)
    const handleStartDragV = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDraggingV(true);
        const panel = rightPanelRef.current;
        if (!panel) return;

        const panelRect = panel.getBoundingClientRect();
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'row-resize';

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - panelRect.top;
            const newPct = (deltaY / panelRect.height) * 100;
            const clamped = Math.min(82, Math.max(20, newPct));
            setEditorHeight(clamped);
        };

        const onMouseUp = () => {
            setIsDraggingV(false);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            try {
                localStorage.setItem('sqlix_workspace_editor_height', String(editorHeight));
            } catch {}
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    // Keyboard handling in Textarea (Tab indentation & Ctrl+Enter run)
    const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleRunTest();
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const val = textarea.value;
            const updated = val.substring(0, start) + '    ' + val.substring(end);
            setCodeQuery(updated);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }, 0);
        }
    };

    // Copy query to clipboard
    const handleCopyQuery = async () => {
        if (!codeQuery) return;
        try {
            await navigator.clipboard.writeText(codeQuery);
            setCopiedQuery(true);
            setTimeout(() => setCopiedQuery(false), 2000);
        } catch (err) {
            console.error('Cannot copy query:', err);
        }
    };

    // Format SQL query
    const handleFormatQuery = () => {
        const formatted = formatSqlQuery(codeQuery);
        setCodeQuery(formatted);
    };

    // Copy expected column or append to query
    const handleColumnClick = (col: string) => {
        navigator.clipboard.writeText(col);
        setCopiedCol(col);
        setTimeout(() => setCopiedCol(null), 1500);
    };

    // Toggle Sidebar
    const toggleSidebar = () => {
        setIsSidebarCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('sqlix_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

    if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

    // Shared Editor Content (rendered normally or in Fullscreen modal)
    const renderEditorAndOutput = (isFullscreenMode: boolean = false) => (
        <div
            ref={!isFullscreenMode ? rightPanelRef : undefined}
            className={`h-full flex flex-col bg-white overflow-hidden ${
                isFullscreenMode ? 'w-full h-full' : ''
            }`}
        >
            {/* Editor Top Bar Toolbar */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-slate-50/90 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-400/50 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                        <span>SQL Query Editor</span>
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold border border-blue-200">
                        PostgreSQL / MySQL
                    </span>

                    {isFullscreenMode && (
                        <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <span>Bài #{exerciseOrder}:</span>
                            <span className="font-semibold text-slate-700 truncate max-w-xs">{exerciseTitle}</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Format SQL Button */}
                    <button
                        type="button"
                        onClick={handleFormatQuery}
                        className="px-2.5 py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1"
                        title="Tự động viết hoa từ khóa SQL chuẩn (SELECT, FROM, WHERE...)"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Format SQL</span>
                    </button>

                    {/* Copy Query Button */}
                    <button
                        type="button"
                        onClick={handleCopyQuery}
                        className="px-2.5 py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1"
                        title="Sao chép câu lệnh"
                    >
                        {copiedQuery ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">Đã chép!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Sao chép</span>
                            </>
                        )}
                    </button>

                    {/* Reset Button */}
                    <button
                        type="button"
                        onClick={() =>
                            setCodeQuery(workspace?.initialSql || fallbackExercise.sampleQuery || '')
                        }
                        className="px-2.5 py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1"
                        title="Khôi phục câu lệnh mẫu mặc định"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Đặt lại</span>
                    </button>

                    {/* Fullscreen Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setIsEditorFullscreen((prev) => !prev)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1 ${
                            isFullscreenMode
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                        }`}
                        title={isFullscreenMode ? 'Thu nhỏ trình soạn thảo (Esc)' : 'Toàn màn hình trình soạn thảo SQL'}
                    >
                        {isFullscreenMode ? (
                            <>
                                <Minimize2 className="w-3.5 h-3.5" />
                                <span>Thu nhỏ (Esc)</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Toàn màn hình</span>
                            </>
                        )}
                    </button>

                    {/* In Fullscreen Mode, button to toggle Problem & ERD reference side panel */}
                    {isFullscreenMode && (
                        <button
                            type="button"
                            onClick={() => setShowFullscreenRef((prev) => !prev)}
                            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 shadow-2xs ${
                                showFullscreenRef
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title="Bật/Tắt xem Đề bài và Sơ đồ quan hệ ERD bên phải"
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{showFullscreenRef ? 'Đóng Đề bài & ERD' : 'Xem Đề bài & ERD'}</span>
                        </button>
                    )}

                    {/* In Fullscreen Mode, show action buttons directly inside toolbar */}
                    {isFullscreenMode && (
                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                            <button
                                type="button"
                                onClick={handleRunTest}
                                disabled={isRunning || isSubmitting}
                                className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Chạy thử câu lệnh (Ctrl + Enter)"
                            >
                                {isRunning ? (
                                    <>
                                        <span className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                        <span>Đang chạy...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3 h-3 fill-slate-700" />
                                        <span>Chạy thử</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmitCode}
                                disabled={isRunning || isSubmitting}
                                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang chấm...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-3 h-3 fill-white" />
                                        <span>Nộp bài</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Textarea Code Editor */}
            <div
                style={{
                    height: isOutputCollapsed ? 'calc(100% - 42px)' : `${editorHeight}%`,
                }}
                className="flex bg-white relative overflow-hidden transition-all duration-75"
            >
                {/* Line Numbers */}
                <div
                    ref={lineNumsRef}
                    className="py-3 px-3 bg-slate-50/70 border-r border-slate-200 text-right select-none font-mono text-[13px] text-slate-400 leading-6 font-semibold shrink-0 overflow-hidden"
                >
                    {codeQuery.split('\n').map((_, i) => (
                        <div key={i}>{i + 1}</div>
                    ))}
                </div>

                {/* Editor Textarea */}
                <textarea
                    ref={textareaRef}
                    value={codeQuery}
                    onChange={(e) => setCodeQuery(e.target.value)}
                    onKeyDown={handleEditorKeyDown}
                    onScroll={(e) => {
                        if (lineNumsRef.current) {
                            lineNumsRef.current.scrollTop = e.currentTarget.scrollTop;
                        }
                    }}
                    className="flex-1 p-3 bg-white text-slate-900 font-mono text-[13px] outline-none resize-none leading-6 focus:bg-blue-50/10 transition-colors selection:bg-blue-100"
                    spellCheck={false}
                    placeholder="-- Viết câu lệnh truy vấn SQL của bạn tại đây... (Nhấn Ctrl + Enter để Chạy thử)"
                />

                {/* Hint Bar in bottom-right corner */}
                <div className="absolute bottom-2 right-4 pointer-events-none select-none text-[10px] font-mono text-slate-400 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200/80 shadow-2xs">
                    Phím tắt: <span className="font-semibold text-slate-600">Ctrl + Enter</span> để chạy | <span className="font-semibold text-slate-600">Tab</span> để lùi dòng
                </div>
            </div>

            {/* Vertical Splitter Handle (Between Editor and Output) */}
            {!isOutputCollapsed && (
                <div
                    onMouseDown={handleStartDragV}
                    onDoubleClick={() => setEditorHeight(55)}
                    className="h-1.5 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 cursor-row-resize transition-colors relative flex items-center justify-center shrink-0 group select-none z-10"
                    title="Kéo lên/xuống để chỉnh độ cao kết quả (Nhấp đúp để đặt lại 55/45)"
                >
                    <div className="h-0.5 w-10 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
                </div>
            )}

            {/* Output Panel (Kết quả thực thi & Chấm điểm) */}
            <div
                style={{
                    height: isOutputCollapsed ? '42px' : `${100 - editorHeight}%`,
                }}
                className="bg-slate-50/50 border-t border-slate-200 flex flex-col overflow-hidden shrink-0 transition-all duration-75"
            >
                {/* Output Header */}
                <div className="px-4 sm:px-5 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsOutputCollapsed((prev) => !prev)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                            title={isOutputCollapsed ? 'Mở rộng bảng kết quả' : 'Thu gọn bảng kết quả'}
                        >
                            {isOutputCollapsed ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                            )}
                        </button>

                        <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                            <span>📊</span>
                            <span>Kết quả thực thi</span>
                        </span>

                        {runResult?.executionTimeMs !== undefined && (
                            <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{runResult.executionTimeMs} ms</span>
                            </span>
                        )}

                        {runResult?.rowCount !== undefined && (
                            <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                📑 {runResult.rowCount} dòng
                            </span>
                        )}

                        {submitResult && (
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono shadow-2xs ${
                                    submitResult.status === 'PASSED' || submitResult.score >= 100
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                            >
                                Điểm: {submitResult.score} / 100
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsOutputCollapsed((prev) => !prev)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                        >
                            {isOutputCollapsed ? 'Mở rộng' : 'Thu gọn'}
                        </button>
                    </div>
                </div>

                {/* Output Content Body */}
                {!isOutputCollapsed && (
                    <div className="flex-1 p-3 sm:p-4 overflow-auto text-xs font-mono bg-white">
                        {/* SQL Execution Error */}
                        {runResult?.errorMessage ? (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-xs text-rose-900 font-sans">
                                    <span className="text-base">⚠️</span>
                                    <span>Lỗi thực thi câu lệnh SQL (SQL Error)</span>
                                </div>
                                <pre className="p-3 bg-white/90 rounded-lg text-rose-950 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-rose-100">
                                    {runResult.errorMessage}
                                </pre>
                            </div>
                        ) : runResult && runResult.rows ? (
                            /* Dynamic Result Table */
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                <table className="w-full text-left text-slate-800 divide-y divide-slate-200">
                                    <thead className="bg-slate-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="py-2 px-3 font-mono text-[10px] text-slate-400 font-bold uppercase w-12 text-center bg-slate-50">
                                                #
                                            </th>
                                            {runResult.columns.map((col) => (
                                                <th
                                                    key={col}
                                                    className="py-2.5 px-3.5 font-bold text-slate-700 text-[11px] uppercase tracking-wider font-mono bg-slate-50"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                                        {runResult.rows.map((row: any, rIdx: number) => (
                                            <tr key={rIdx} className="hover:bg-blue-50/40 transition-colors">
                                                <td className="py-2 px-3 text-slate-400 font-mono text-[11px] text-center select-none">
                                                    {rIdx + 1}
                                                </td>
                                                {runResult.columns.map((col, cIdx) => {
                                                    const val = Array.isArray(row)
                                                        ? row[cIdx]
                                                        : row[col];
                                                    return (
                                                        <td
                                                            key={cIdx}
                                                            className="py-2 px-3.5 text-slate-800 font-mono text-xs whitespace-nowrap"
                                                        >
                                                            {val === null || val === undefined ? (
                                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-mono italic">
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
                            /* Empty State */
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8 gap-2">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-lg">
                                    ⚡
                                </div>
                                <p className="text-center font-sans font-medium text-slate-500 max-w-sm">
                                    Nhấn{' '}
                                    <span className="font-bold text-slate-700">
                                        &quot;Chạy thử&quot;
                                    </span>{' '}
                                    (hoặc Ctrl + Enter) để kiểm tra bảng dữ liệu hoặc{' '}
                                    <span className="font-bold text-emerald-600">
                                        &quot;Nộp bài&quot;
                                    </span>{' '}
                                    để chấm điểm tự động.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div
            className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans"
            suppressHydrationWarning
        >
            {/* Sidebar with Collapse / Expand capability */}
            <div className={isSidebarCollapsed ? 'hidden' : 'block shrink-0'}>
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                <Header userName="Duy Hoàng" />

                {submissionError && (
                    <p role="alert" className="bg-rose-50 px-6 py-2.5 text-xs font-medium text-rose-600 border-b border-rose-200">
                        {submissionError}
                    </p>
                )}

                {/* Top Workspace Header Bar */}
                <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 gap-3 shadow-2xs">
                    {/* Left side: Navigation & Title */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {/* Toggle Sidebar Button */}
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title={isSidebarCollapsed ? 'Mở lại menu điều hướng' : 'Thu gọn menu để mở rộng tối đa không gian làm bài'}
                        >
                            {isSidebarCollapsed ? (
                                <>
                                    <PanelLeftOpen className="w-4 h-4 text-blue-600" />
                                    <span className="hidden xl:inline text-[11px] font-bold text-blue-600">Hiện Menu</span>
                                </>
                            ) : (
                                <>
                                    <PanelLeftClose className="w-4 h-4" />
                                    <span className="hidden xl:inline text-[11px]">Thu gọn</span>
                                </>
                            )}
                        </button>

                        <Link
                            href={`/practice/${dbId}`}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                        >
                            <span>←</span>
                            <span className="hidden sm:inline">Danh sách câu hỏi</span>
                        </Link>

                        <span className="text-slate-300 hidden sm:inline">|</span>

                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            Bài #{exerciseOrder}: {exerciseTitle}
                        </span>

                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${exerciseDifficultyColor}`}
                        >
                            {exerciseDifficulty}
                        </span>
                    </div>

                    {/* Right side: Action Buttons & Layout Reset */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Reset Split 50/50 Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setLeftPanelWidth(50);
                                setEditorHeight(55);
                                setIsOutputCollapsed(false);
                            }}
                            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                            title="Đặt lại tỷ lệ 2 cột về mặc định (50/50)"
                        >
                            <Columns2 className="w-3.5 h-3.5" />
                            <span>Tỷ lệ 50/50</span>
                        </button>

                        {/* Nút Chạy thử (Run) */}
                        <button
                            type="button"
                            onClick={handleRunTest}
                            disabled={isRunning || isSubmitting}
                            className={`px-3.5 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isRunning ? 'opacity-70 cursor-wait' : ''
                            }`}
                            title="Phím tắt: Ctrl + Enter"
                        >
                            {isRunning ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                    <span>Đang thực thi...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-slate-700" />
                                    <span>Chạy thử</span>
                                </>
                            )}
                        </button>

                        {/* Nút Nộp bài chấm điểm (Submit) */}
                        <button
                            type="button"
                            onClick={handleSubmitCode}
                            disabled={isRunning || isSubmitting}
                            className={`px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
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
                                    <Zap className="w-3.5 h-3.5 fill-white" />
                                    <span>Nộp bài chấm điểm</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Workspace Area with Horizontal Resizer */}
                <div
                    ref={workspaceRef}
                    className="flex-1 overflow-hidden w-full min-h-0 flex relative bg-slate-100"
                >
                    {/* CỘT 1: ĐỀ BÀI + SƠ ĐỒ ERD / SCHEMA */}
                    <div
                        style={{ width: `${leftPanelWidth}%` }}
                        className="h-full border-r border-slate-200 bg-white flex flex-col overflow-hidden min-w-[280px]"
                    >
                        {/* Tabs Navigation inside Left Column */}
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
                                <FileText className="w-3.5 h-3.5" />
                                <span>Mô tả đề bài & ERD</span>
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
                                <Database className="w-3.5 h-3.5" />
                                <span>Cấu trúc bảng (Schema)</span>
                            </button>
                        </div>

                        {/* Content for Left Column */}
                        {activeTab === 'problem' ? (
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                                            {exerciseTitle}
                                        </h2>
                                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                                            {exerciseDescription}
                                        </p>
                                    </div>

                                    {/* Yêu cầu truy vấn */}
                                    {exerciseRequirements && exerciseRequirements.length > 0 && (
                                        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-2 shadow-2xs">
                                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <span>📌</span> Yêu cầu truy vấn:
                                            </h4>
                                            <ul className="space-y-1.5 text-xs text-slate-600 pl-4 list-disc leading-relaxed">
                                                {exerciseRequirements.map((req, i) => (
                                                    <li key={i}>{req}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Cột dữ liệu kỳ vọng */}
                                    {exerciseExpectedColumns && exerciseExpectedColumns.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                                                <span>🎯 Cột dữ liệu kỳ vọng:</span>
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    (Nhấn vào cột để chép tên)
                                                </span>
                                            </h4>
                                            <div className="flex gap-2 flex-wrap">
                                                {exerciseExpectedColumns.map((col) => (
                                                    <button
                                                        key={col}
                                                        type="button"
                                                        onClick={() => handleColumnClick(col)}
                                                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                                        title="Nhấn để sao chép tên cột"
                                                    >
                                                        <span>{col}</span>
                                                        {copiedCol === col && (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sơ đồ quan hệ ERD */}
                                <div className="pt-6 border-t border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            <span>📊</span> Sơ đồ quan hệ ERD
                                        </h3>
                                        <span className="text-[10px] text-slate-400">
                                            Kéo thanh phân cách để mở rộng sơ đồ
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                        <ErdTab
                                            dbData={dbDetail || fallbackDbData}
                                            schemaData={dbDetail?.schemaData || workspace?.schemaData}
                                            diagramOnly={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Cấu trúc bảng Schema inside Left Column (keeps Editor visible!) */
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                                <OverviewTab
                                    dbData={dbDetail || fallbackDbData}
                                    schemaData={dbDetail?.schemaData || workspace?.schemaData}
                                    compact={true}
                                />
                            </div>
                        )}
                    </div>

                    {/* HORIZONTAL RESIZER SPLITTER (Drag to adjust column widths) */}
                    <div
                        onMouseDown={handleStartDragH}
                        onDoubleClick={() => setLeftPanelWidth(50)}
                        className="w-2 hover:w-2.5 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize transition-all relative flex items-center justify-center shrink-0 group select-none z-20"
                        title="Kéo sang trái/phải để chỉnh độ rộng 2 cột (Nhấp đúp để đặt lại 50/50)"
                    >
                        <div className="w-1 h-8 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
                    </div>

                    {/* CỘT 2: SQL EDITOR & KẾT QUẢ THỰC THI */}
                    <div
                        style={{ width: `${100 - leftPanelWidth}%` }}
                        className="h-full flex flex-col bg-white overflow-hidden min-w-[320px]"
                    >
                        {renderEditorAndOutput(false)}
                    </div>
                </div>
            </div>

            {/* FULLSCREEN EDITOR MODAL (Toàn màn hình trình soạn thảo với tuỳ chọn xem Đề bài & ERD bên phải) */}
            {isEditorFullscreen && (
                <div
                    ref={fullscreenContainerRef}
                    className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-row animate-in fade-in duration-150 overflow-hidden w-full h-full"
                >
                    {/* Phần soạn thảo & kết quả (Cột trái) */}
                    <div
                        style={{
                            width: showFullscreenRef ? `${100 - fullscreenRightWidth}%` : '100%',
                        }}
                        className="h-full flex flex-col bg-white overflow-hidden min-w-[320px]"
                    >
                        {renderEditorAndOutput(true)}
                    </div>

                    {/* Thanh kéo chỉnh độ rộng giữa Editor và Đề bài trong chế độ toàn màn hình */}
                    {showFullscreenRef && (
                        <div
                            onMouseDown={handleStartDragFullscreenH}
                            onDoubleClick={() => setFullscreenRightWidth(50)}
                            className="w-2 hover:w-2.5 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize transition-all relative flex items-center justify-center shrink-0 group select-none z-30"
                            title="Kéo sang trái/phải để tùy chỉnh độ rộng giữa Editor và Đề bài (Nhấp đúp để đặt lại 50/50)"
                        >
                            <div className="w-1 h-8 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
                        </div>
                    )}

                    {/* Cột hiển thị Đề bài & ERD bên phải trong chế độ toàn màn hình */}
                    {showFullscreenRef && (
                        <div
                            style={{ width: `${fullscreenRightWidth}%` }}
                            className="h-full bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-2xl z-20 animate-in slide-in-from-right-6 duration-200 overflow-hidden min-w-[320px]"
                        >
                            {/* Header của Cột Đề bài & ERD */}
                            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setFullscreenTab('problem')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                                            fullscreenTab === 'problem'
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                        }`}
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Đề bài & ERD</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFullscreenTab('schema')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                                            fullscreenTab === 'schema'
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                        }`}
                                    >
                                        <Database className="w-3.5 h-3.5" />
                                        <span>Cấu trúc bảng</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFullscreenRightWidth(50)}
                                        className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-md border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                                        title="Đặt lại tỷ lệ 50/50"
                                    >
                                        <Columns2 className="w-3 h-3" />
                                        <span>Tỷ lệ 50/50</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowFullscreenRef(false)}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                        title="Đóng phần đề bài (để editor mở rộng 100%)"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Side Panel */}
                            {fullscreenTab === 'problem' ? (
                                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                                                Bài #{exerciseOrder}: {exerciseTitle}
                                            </h3>
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${exerciseDifficultyColor}`}
                                            >
                                                {exerciseDifficulty}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                                            {exerciseDescription}
                                        </p>
                                    </div>

                                    {/* Yêu cầu truy vấn */}
                                    {exerciseRequirements && exerciseRequirements.length > 0 && (
                                        <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <span>📌</span> Yêu cầu truy vấn:
                                            </h4>
                                            <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc leading-relaxed">
                                                {exerciseRequirements.map((req, i) => (
                                                    <li key={i}>{req}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Cột dữ liệu kỳ vọng */}
                                    {exerciseExpectedColumns && exerciseExpectedColumns.length > 0 && (
                                        <div className="space-y-1.5">
                                            <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                                                <span>🎯 Cột dữ liệu kỳ vọng:</span>
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    (Nhấn để chép tên)
                                                </span>
                                            </h4>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {exerciseExpectedColumns.map((col) => (
                                                    <button
                                                        key={col}
                                                        type="button"
                                                        onClick={() => handleColumnClick(col)}
                                                        className="px-2.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-mono text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                                        title="Nhấn để sao chép tên cột"
                                                    >
                                                        <span>{col}</span>
                                                        {copiedCol === col && (
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sơ đồ quan hệ ERD */}
                                    <div className="pt-4 border-t border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <span>📊</span> Sơ đồ quan hệ ERD
                                            </h4>
                                            <span className="text-[10px] text-slate-400">
                                                Kéo để di chuyển, nút +/- để zoom
                                            </span>
                                        </div>
                                        <div className="w-full h-[400px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative shadow-2xs">
                                            <ErdTab
                                                dbData={dbDetail || fallbackDbData}
                                                schemaData={dbDetail?.schemaData || workspace?.schemaData}
                                                diagramOnly={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                                    <OverviewTab
                                        dbData={dbDetail || fallbackDbData}
                                        schemaData={dbDetail?.schemaData || workspace?.schemaData}
                                        compact={true}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Floating Tab Button on the right edge when side panel is closed */}
                    {!showFullscreenRef && (
                        <button
                            type="button"
                            onClick={() => setShowFullscreenRef(true)}
                            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2.5 pl-3.5 pr-2.5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[-4px_4px_24px_rgba(37,99,235,0.4)] rounded-l-full transition-all duration-200 group cursor-pointer hover:pl-4.5 hover:-translate-x-1 border-y border-l border-white/20 select-none animate-in slide-in-from-right-3"
                            title="Mở xem Đề bài & Sơ đồ ERD"
                        >
                            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                                <BookOpen className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-bold tracking-tight">
                                Đề bài & ERD
                            </span>
                            <span className="text-[11px] text-blue-200 group-hover:-translate-x-1 transition-transform font-bold">
                                ◀
                            </span>
                        </button>
                    )}
                </div>
            )}

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
