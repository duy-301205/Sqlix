'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { DATABASES_DETAIL, DatabaseDetail } from './data';
import { DATABASE_EXERCISES } from './exercisesData';
import OverviewTab from './components/OverviewTab';
import ErdTab from './components/ErdTab';
import QuestionsTab from './components/QuestionsTab';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PracticeDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const dbId = resolvedParams.id || 'ecommerce';

    const dbData: DatabaseDetail =
        DATABASES_DETAIL[dbId] || DATABASES_DETAIL.ecommerce;

    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'erd' | 'questions'>('questions');

    const totalExercises = DATABASE_EXERCISES[dbId]?.length || 3;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-screen bg-[#f8fafc]" />;
    }

    return (
        <div
            className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans"
            suppressHydrationWarning
        >
            {/* Sidebar Component */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" suppressHydrationWarning>
                <Header userName="Duy Hoàng" streakCount={7} />

                <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 w-full max-w-[1600px] mx-auto flex flex-col space-y-6">
                    {/* Top Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
                        <Link
                            href="/practice"
                            className="hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Luyện tập
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-700">{dbData.name}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-blue-600 font-bold">
                            {activeTab === 'questions' ? 'Danh sách câu hỏi' : activeTab === 'erd' ? 'Sơ đồ ERD' : 'Tổng quan CSDL'}
                        </span>
                    </nav>

                    {/* Top Action Bar */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{dbData.name}</h1>
                                <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${dbData.difficultyColor}`}>
                                    {dbData.difficulty}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500">{dbData.subtitle}</p>
                        </div>

                        <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700">
                            <span>📚</span>
                            <span>{totalExercises} bài tập thực hành</span>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-white px-6 border-b border-slate-200 flex gap-6 rounded-t-2xl shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('questions')}
                            className={`px-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                                activeTab === 'questions'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                            <span>Danh sách câu hỏi</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('erd')}
                            className={`px-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                                activeTab === 'erd'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                                />
                            </svg>
                            <span>Sơ đồ ERD</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('overview')}
                            className={`px-1 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                                activeTab === 'overview'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>Cấu trúc CSDL</span>
                        </button>
                    </div>

                    {/* Render Active Tab */}
                    {activeTab === 'questions' && <QuestionsTab dbData={dbData} />}
                    {activeTab === 'erd' && <ErdTab dbData={dbData} />}
                    {activeTab === 'overview' && <OverviewTab dbData={dbData} />}

                    {/* Bottom Action Footer */}
                    <div className="bg-blue-50 border border-blue-200/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                        <div className="flex items-center gap-3 text-blue-900 text-xs sm:text-sm font-medium">
                            <span className="text-lg">💡</span>
                            <span>
                                {activeTab === 'questions'
                                    ? 'Hãy xem qua tab Sơ đồ ERD để hiểu rõ mối quan hệ giữa các bảng trước khi giải bài nhé!'
                                    : 'Đã nắm rõ sơ đồ? Hãy chuyển sang tab Danh sách câu hỏi để bắt đầu luyện tập truy vấn!'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveTab(activeTab === 'questions' ? 'erd' : 'questions')}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
                        >
                            {activeTab === 'questions' ? 'Sang tab Sơ đồ ERD →' : 'Xem danh sách câu hỏi →'}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}