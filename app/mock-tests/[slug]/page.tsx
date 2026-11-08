'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import mockTestService, { MockTestDetail } from '@/services/mockTestService';
import { MOCK_TESTS } from '@/app/mock-test/mockTestData';

interface PageProps {
    params: Promise<{ slug: string }>;
}

const getDifficultyColor = (diff: string | undefined): string => {
    const d = (diff || '').toLowerCase();
    if (d.includes('dễ') || d.includes('easy')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (d.includes('khó') || d.includes('hard') || d.includes('nâng cao')) {
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
};

export default function MockTestDetailPage({ params }: PageProps) {
    const router = useRouter();
    const resolvedParams = use(params);
    const slug = resolvedParams.slug || 'mock-1';

    const [mounted, setMounted] = useState(false);
    const [testDetail, setTestDetail] = useState<MockTestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);

    // 1. Tải thông tin giới thiệu đề thi từ API
    const fetchDetail = useCallback(async () => {
        setIsLoading(true);
        setSessionError(null);
        try {
            const data = await mockTestService.getMockTestDetail(slug);
            if (data && (data.id || data.slug || data.title)) {
                setTestDetail(data);
            } else {
                throw new Error('Dữ liệu đề thi không hợp lệ');
            }
        } catch (err: any) {
            console.error(`[MockTest] Lỗi khi tải chi tiết đề thi slug="${slug}":`, err);

            // Fallback sang dữ liệu MOCK_TESTS nội bộ nếu API chưa có slug này
            const fallback =
                MOCK_TESTS.find((t) => t.id === slug || (t as any).slug === slug) || MOCK_TESTS[0];

            setTestDetail({
                ...fallback,
                slug: fallback.id,
                overview: fallback.description,
                rules: [
                    'Thời gian làm bài sẽ được đếm ngược liên tục ngay khi bạn nhấn "Bắt đầu làm bài".',
                    'Mỗi câu hỏi trắc nghiệm hoặc SQL yêu cầu thực hiện đúng định dạng và logic truy vấn dữ liệu.',
                    'Hệ thống tự động lưu câu trả lời sau mỗi lần chọn đáp án hoặc thực thi câu lệnh SQL.',
                    'Không tải lại trang hoặc tắt tab trình duyệt trong quá trình thi để bảo toàn điểm số.',
                ],
                passingScore: 80,
                totalScore: 100,
            } as any);
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        setMounted(true);
        fetchDetail();
    }, [fetchDetail]);

    // 2. Xử lý nút "Bắt đầu làm bài" (Start Session)
    const handleStartSession = async () => {
        if (!testDetail?.id || isStartingSession) return;

        setIsStartingSession(true);
        setSessionError(null);

        try {
            const response = await mockTestService.startTestSession(testDetail.id);
            if (response && response.sessionId) {
                // Điều hướng sang workspace phòng thi
                router.push(`/test-sessions/${encodeURIComponent(response.sessionId)}/workspace`);
            } else {
                throw new Error('Không nhận được mã phiên thi (sessionId) từ máy chủ');
            }
        } catch (err: any) {
            console.error('[MockTest] Lỗi khởi tạo phiên thi:', err);
            // Fallback khi chạy thử nghiệm offline trong môi trường dev
            const fallbackSessionId = `session-${testDetail.id}-${Date.now()}`;
            router.push(`/test-sessions/${encodeURIComponent(fallbackSessionId)}/workspace`);
        } finally {
            setIsStartingSession(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-[#f8fafc]" />;

    const title = testDetail?.title || 'Đề thi thử SQL';
    const duration = testDetail?.durationMinutes || testDetail?.duration || 45;
    const questionsCount = testDetail?.questionsCount || (testDetail?.questions?.length) || 10;
    const difficulty = testDetail?.difficulty || testDetail?.level || 'Trung bình';
    const diffColor = testDetail?.difficultyColor || getDifficultyColor(difficulty);
    const category = testDetail?.category || testDetail?.categoryName || 'SQL Database';
    const passingScore = testDetail?.passingScore || 80;
    const totalScore = testDetail?.totalScore || 100;

    return (
        <div
            className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans"
            suppressHydrationWarning
        >
            {/* Sidebar */}
            <Sidebar />

            {/* Main Container */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0" suppressHydrationWarning>
                <Header userName="Duy Hoàng" streakCount={7} />

                <main className="flex-1 overflow-y-auto px-6 lg:px-10 py-6 w-full max-w-[1400px] mx-auto flex flex-col space-y-6">
                    {/* Breadcrumbs chuẩn hệ thống */}
                    <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
                        <Link
                            href="/mock-tests"
                            className="hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kho đề thi thử
                        </Link>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-700 font-bold truncate max-w-sm">{title}</span>
                    </nav>

                    {/* Skeletons Loading */}
                    {isLoading ? (
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 animate-pulse">
                            <div className="flex gap-2">
                                <div className="h-6 bg-slate-200 rounded w-20" />
                                <div className="h-6 bg-slate-200 rounded w-24" />
                            </div>
                            <div className="h-8 bg-slate-200 rounded w-1/2" />
                            <div className="h-4 bg-slate-100 rounded w-2/3" />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-20 bg-slate-100 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    ) : testDetail ? (
                        <div className="space-y-6">
                            {/* Card Thông tin chính */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${diffColor}`}>
                                            {difficulty}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 uppercase tracking-wider">
                                            {category}
                                        </span>
                                    </div>

                                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1.5">
                                        {title}
                                    </h1>

                                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
                                        {testDetail.description ||
                                            testDetail.overview ||
                                            'Bài thi mô phỏng môi trường phỏng vấn thực tế với các yêu cầu truy vấn từ cơ bản đến phức tạp.'}
                                    </p>
                                </div>

                                {/* 4 Ô Thông số thống kê */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
                                        <div className="text-xl font-black text-slate-900">⏱️ {duration}</div>
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">Phút làm bài</div>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
                                        <div className="text-xl font-black text-slate-900">📄 {questionsCount}</div>
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">Câu hỏi truy vấn</div>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
                                        <div className="text-xl font-black text-emerald-600">🎯 {passingScore}/{totalScore}</div>
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">Điểm qua môn</div>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-0.5">
                                        <div className="text-xl font-black text-blue-600">👥 {(testDetail.participantsCount || 982).toLocaleString('vi-VN')}</div>
                                        <div className="text-[11px] text-slate-400 font-semibold uppercase">Lượt thi</div>
                                    </div>
                                </div>
                            </div>

                            {/* Hai khối: Quy chế bên trái & Bảng xác nhận thi bên phải (Đồng bộ trắng/xám theo hệ thống) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                {/* Khối Quy chế & Hướng dẫn */}
                                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Quy chế và hướng dẫn phòng thi</span>
                                    </h3>

                                    <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                                        {(testDetail.rules || [
                                            'Thời gian làm bài sẽ được đếm ngược liên tục ngay khi bạn nhấn "Bắt đầu làm bài".',
                                            'Mỗi câu hỏi trắc nghiệm hoặc SQL yêu cầu thực hiện đúng định dạng và logic truy vấn dữ liệu.',
                                            'Hệ thống tự động lưu câu trả lời sau mỗi lần chọn đáp án hoặc thực thi câu lệnh SQL.',
                                            'Không tải lại trang hoặc tắt tab trình duyệt trong quá trình thi để bảo toàn điểm số.',
                                        ]).map((rule, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-slate-600">{rule}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                                        <svg className="w-4 h-4 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>Lưu ý: Không chia sẻ đề thi ra bên ngoài và đảm bảo nguồn điện, đường truyền Internet ổn định.</span>
                                    </div>
                                </div>

                                {/* Khối Bắt đầu làm bài (Đồng bộ thẻ Card trắng chuẩn Sqlix) */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-1">
                                            Sẵn sàng thử sức?
                                        </h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Đảm bảo đường truyền mạng ổn định trước khi tạo phiên thi. Hệ thống sẽ tính điểm ngay khi bạn bắt đầu.
                                        </p>
                                    </div>

                                    {/* Danh sách tóm tắt nhanh */}
                                    <div className="space-y-2 border-y border-slate-100 py-3.5 text-xs text-slate-600">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Thời lượng:</span>
                                            <span className="font-bold text-slate-800">{duration} phút</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Số lượng:</span>
                                            <span className="font-bold text-slate-800">{questionsCount} câu hỏi</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Điểm tối thiểu đạt:</span>
                                            <span className="font-bold text-emerald-600">{passingScore} / {totalScore}</span>
                                        </div>
                                    </div>

                                    {sessionError && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                                            {sessionError}
                                        </div>
                                    )}

                                    {/* Nút hành động chuẩn Sqlix: Nền xanh blue-600, chữ trắng */}
                                    <button
                                        type="button"
                                        onClick={handleStartSession}
                                        disabled={isStartingSession}
                                        className={`w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer ${
                                            isStartingSession ? 'opacity-70 cursor-wait' : ''
                                        }`}
                                    >
                                        {isStartingSession ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Đang khởi tạo phòng thi...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Vào phòng thi ngay</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </>
                                        )}
                                    </button>

                                    <Link
                                        href="/mock-tests"
                                        className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        ← Quay lại danh sách đề thi
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    );
}
