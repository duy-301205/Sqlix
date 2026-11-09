'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';

interface ResultPageProps {
    params: Promise<{ sessionId: string }>;
}

export default function TestResultPage({ params }: ResultPageProps) {
    const resolvedParams = use(params);
    const sessionId = resolvedParams.sessionId || 'session-demo';

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

    return (
        <div
            className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans"
            suppressHydrationWarning
        >
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" suppressHydrationWarning>
                <Header userName="Duy Hoàng" streakCount={7} />

                <main className="flex-1 overflow-y-auto px-6 lg:px-12 py-10 w-full max-w-[900px] mx-auto space-y-8 flex flex-col justify-center">
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-md text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-4xl shadow-inner animate-in zoom-in-95 duration-300">
                            🎉
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Nộp bài thi thành công!
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                                Bài thi của bạn đã được hệ thống ghi nhận và chấm điểm tự động.
                            </p>
                            <div className="font-mono text-xs text-slate-400 pt-1">
                                Mã phiên thi: <span className="text-slate-700 font-bold">{sessionId}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg mx-auto">
                            <div>
                                <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                                    Đã nộp
                                </div>
                                <div className="text-[11px] text-slate-500 font-semibold mt-1">Trạng thái</div>
                            </div>
                            <div className="border-x border-slate-200">
                                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                                    100%
                                </div>
                                <div className="text-[11px] text-slate-500 font-semibold mt-1">Hoàn thành</div>
                            </div>
                            <div>
                                <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
                                    ✓
                                </div>
                                <div className="text-[11px] text-slate-500 font-semibold mt-1">Đã lưu DB</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                            <Link
                                href="/mock-tests"
                                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 text-center"
                            >
                                Trở về danh sách đề thi
                            </Link>

                            <Link
                                href="/dashboard"
                                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors text-center"
                            >
                                Xem bảng điều khiển Dashboard
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
