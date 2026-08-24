'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { DATABASES_DETAIL } from '../../data';
import { DATABASE_EXERCISES, Exercise } from '../../exercisesData';
import ErdTab from '../../components/ErdTab';
import OverviewTab from '../../components/OverviewTab';

interface SolvePageProps {
    params: Promise<{ id: string; exerciseId: string }>;
}

export default function SolveExercisePage({ params }: SolvePageProps) {
    const [mounted, setMounted] = useState(false);
    const resolvedParams = use(params);
    const dbId = resolvedParams.id || 'ecommerce';
    const exerciseId = resolvedParams.exerciseId || 'ex-ecom-1';

    const dbData = DATABASES_DETAIL[dbId] || DATABASES_DETAIL.ecommerce;
    const exerciseList = DATABASE_EXERCISES[dbId] || DATABASE_EXERCISES.ecommerce;
    const exercise: Exercise =
        exerciseList.find((e) => e.id === exerciseId) || exerciseList[0];

    const [activeTab, setActiveTab] = useState<'problem' | 'schema'>('problem');
    const [codeQuery, setCodeQuery] = useState(exercise.sampleQuery);
    const [isRunning, setIsRunning] = useState(false);
    const [testResult, setTestResult] = useState<any[] | null>(null);
    const [submitScore, setSubmitScore] = useState<number | null>(null);
    const [scoreFeedback, setScoreFeedback] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRunTest = () => {
        setIsRunning(true);
        setSubmitScore(null);
        setScoreFeedback(null);
        setTimeout(() => {
            setTestResult(exercise.mockData);
            setIsRunning(false);
        }, 400);
    };

    const handleSubmitCode = () => {
        setIsRunning(true);
        setTimeout(() => {
            setIsRunning(false);
            setTestResult(exercise.mockData);

            const sanitized = codeQuery.toLowerCase();
            if (
                sanitized.includes('select') &&
                sanitized.includes('from') &&
                (sanitized.includes('where') || sanitized.includes('join') || sanitized.includes('group by'))
            ) {
                setSubmitScore(100);
                setScoreFeedback('Chúc mừng! Câu lệnh truy vấn của bạn hoàn toàn chính xác và tối ưu.');
            } else {
                setSubmitScore(65);
                setScoreFeedback('Câu lệnh đã thực thi nhưng chưa đáp ứng đủ các điều kiện lọc theo yêu cầu đề bài.');
            }
        }, 600);
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
                            Bài #{exercise.orderNumber}: {exercise.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${exercise.difficultyColor}`}>
                            {exercise.difficulty}
                        </span>
                    </div>

                    {activeTab === 'problem' && (
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleRunTest}
                                disabled={isRunning}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>▶ Chạy thử</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmitCode}
                                disabled={isRunning}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>⚡ Nộp bài chấm điểm</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Workspace */}
                <div className="flex-1 overflow-hidden w-full min-h-0">
                    {activeTab === 'problem' ? (
                        <div className="grid grid-cols-2 h-full w-full">
                            {/* CỘT 1: ĐỀ BÀI + DUY NHẤT SƠ ĐỒ ERD */}
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
                                                {exercise.title}
                                            </h2>
                                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                                {exercise.description}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                            <h4 className="text-xs font-bold text-slate-900">Yêu cầu truy vấn:</h4>
                                            <ul className="space-y-1.5 text-xs text-slate-600 pl-4 list-disc">
                                                {exercise.requirements.map((req, i) => (
                                                    <li key={i}>{req}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-900">Cột dữ liệu kỳ vọng:</h4>
                                            <div className="flex gap-2 flex-wrap">
                                                {exercise.expectedOutputColumns.map((col) => (
                                                    <span
                                                        key={col}
                                                        className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-mono text-[11px] font-bold"
                                                    >
                                                        {col}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chỉ hiển thị duy nhất sơ đồ ERD (Ẩn sidebar thông tin, chú thích, mẹo) */}
                                    <div className="pt-6 border-t border-slate-200 space-y-3">
                                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            <span>📊</span> Sơ đồ quan hệ ERD
                                        </h3>
                                        <div className="w-full">
                                            <ErdTab dbData={dbData} diagramOnly={true} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CỘT 2: SQL EDITOR & RESULT */}
                            <div className="h-full flex flex-col bg-white overflow-hidden">
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
                                        onClick={() => setCodeQuery(exercise.sampleQuery)}
                                        className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-medium flex items-center gap-1"
                                        title="Khôi phục câu lệnh mặc định"
                                    >
                                        <span>🔄</span> Đặt lại
                                    </button>
                                </div>

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

                                <div className="h-72 bg-slate-50/50 border-t border-slate-200 flex flex-col overflow-hidden shrink-0">
                                    <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between shrink-0">
                                        <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                                            <span>📊</span> Kết quả thực thi & Điểm số
                                        </span>
                                        {submitScore !== null && (
                                            <span
                                                className={`px-3 py-0.5 rounded-full text-xs font-black font-mono shadow-2xs ${
                                                    submitScore === 100
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                }`}
                                            >
                                                Điểm số: {submitScore} / 100
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 p-4 overflow-auto text-xs font-mono bg-white">
                                        {scoreFeedback && (
                                            <div
                                                className={`mb-3 p-3.5 rounded-xl border text-xs leading-relaxed font-sans font-medium flex items-start gap-2.5 ${
                                                    submitScore === 100
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                                        : 'bg-amber-50 border-amber-200 text-amber-900'
                                                }`}
                                            >
                                                <span className="text-base">{submitScore === 100 ? '🎉' : '⚠️'}</span>
                                                <div>
                                                    <div className="font-bold text-xs mb-0.5">
                                                        {submitScore === 100 ? 'Kết quả chính xác!' : 'Cần cải thiện:'}
                                                    </div>
                                                    <div>{scoreFeedback}</div>
                                                </div>
                                            </div>
                                        )}

                                        {testResult ? (
                                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                                <table className="w-full text-left text-slate-800 divide-y divide-slate-200">
                                                    <thead className="bg-slate-50">
                                                    <tr>
                                                        {Object.keys(testResult[0] || {}).map((col) => (
                                                            <th key={col} className="py-2.5 px-3.5 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                                                    {testResult.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                            {Object.values(row).map((val: any, cIdx) => (
                                                                <td key={cIdx} className="py-2 px-3.5 text-slate-800 font-mono">
                                                                    {val}
                                                                </td>
                                                            ))}
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
                                                    Nhấn <span className="font-bold text-slate-700">&quot;Chạy thử&quot;</span> để kiểm tra output hoặc <span className="font-bold text-emerald-600">&quot;Nộp bài&quot;</span> để chấm điểm.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
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
                                <OverviewTab dbData={dbData} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}