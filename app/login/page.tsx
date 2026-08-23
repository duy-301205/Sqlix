'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || isLoading) return;

        setIsLoading(true);

        // Giả lập xử lý đăng nhập (1.2s) rồi chuyển hướng
        setTimeout(() => {
            router.push('/dashboard');
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 antialiased grid grid-cols-1 lg:grid-cols-12">
            {/* =====================================================
                LEFT - MARKETING SECTION (Desktop Only: lg+)
            ====================================================== */}
            <aside className="relative hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between p-10 xl:p-12 border-r border-slate-200 bg-slate-50 overflow-hidden min-h-screen">
                {/* Background ambient decoration */}
                <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl" />

                {/* Header Logo */}
                <div className="relative z-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2.5 text-2xl font-bold text-slate-900"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 4.24 2 7c0 2.21 3.13 4.19 7.5 4.81V14.5C5.36 13.8 2 11.66 2 9v5c0 2.76 4.48 5 12 5s12-2.24 12-5V9c0 2.66-3.36 4.8-7.5 5.5v-2.69C20.87 11.19 24 9.21 24 7c0-2.76-4.48-5-12-5zm0 8c-4.42 0-8-1.79-8-4s3.58-4 8-4 8 1.79 8 4-3.58 4-8 4z" />
                            </svg>
                        </div>
                        <span className="tracking-tight">
                            SQL<span className="text-blue-600">Learn</span>
                        </span>
                    </Link>
                </div>

                {/* Main Introduction */}
                <div className="relative z-10 my-auto py-6 max-w-xl">
                    <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                        Học SQL dễ dàng hơn
                    </span>

                    <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 mb-3">
                        Làm chủ SQL với nền tảng<br />
                        thực hành tốt nhất
                    </h1>

                    <p className="mb-6 text-sm leading-relaxed text-slate-600">
                        Nâng cao kỹ năng phân tích và thao tác cơ sở dữ liệu của bạn mỗi ngày với bài tập thực tế.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 text-blue-600 shadow-sm">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Học theo lộ trình</h3>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                    Chương trình bài bản từ các câu lệnh cơ bản đến nâng cao.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-600 shadow-sm">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Đa dạng bài tập</h3>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                    Hàng trăm bài tập thực hành trên CSDL mô phỏng.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100 text-indigo-600 shadow-sm">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Thi thử sát thực tế</h3>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                    Đánh giá năng lực giải quyết vấn đề qua bài test thời gian.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mockup Box */}
                <div className="relative z-10 w-full max-w-[340px] mx-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-300 shadow-xl border border-slate-800">
                    <div><span className="text-cyan-400 font-bold">SELECT</span> name, gpa</div>
                    <div><span className="text-cyan-400 font-bold">FROM</span> students</div>
                    <div><span className="text-cyan-400 font-bold">WHERE</span> gpa &gt;= 8.0</div>
                    <div><span className="text-cyan-400 font-bold">ORDER BY</span> gpa <span className="text-amber-400">DESC</span>;</div>
                </div>
            </aside>

            {/* =====================================================
                RIGHT - LOGIN FORM
            ====================================================== */}
            <main className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between items-center p-6 sm:p-10 bg-slate-100 min-h-screen overflow-y-auto">
                {/* Header Logo for Mobile/Tablet */}
                <div className="w-full flex justify-between lg:justify-end items-center mb-6 shrink-0">
                    <Link href="/" className="lg:hidden flex items-center gap-2 text-lg font-bold text-slate-900">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 4.24 2 7c0 2.21 3.13 4.19 7.5 4.81V14.5C5.36 13.8 2 11.66 2 9v5c0 2.76 4.48 5 12 5s12-2.24 12-5V9c0 2.66-3.36 4.8-7.5 5.5v-2.69C20.87 11.19 24 9.21 24 7c0-2.76-4.48-5-12-5zm0 8c-4.42 0-8-1.79-8-4s3.58-4 8-4 8 1.79 8 4-3.58 4-8 4z" />
                            </svg>
                        </div>
                        <span>SQL<span className="text-blue-600">Learn</span></span>
                    </Link>
                    <div className="text-xs sm:text-sm font-medium text-slate-500">
                        Chưa có tài khoản?{' '}
                        <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline ml-1">
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>

                {/* Login Form Card */}
                <div className="w-full max-w-[420px] mx-auto my-auto bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/60 p-6 sm:p-8">
                    {/* Heading */}
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">
                            Đăng nhập
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                            Chào mừng bạn quay trở lại!
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email / Username */}
                        <div>
                            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-700">
                                Email hoặc tên đăng nhập
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                placeholder="name@example.com"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="mb-1 flex items-center justify-between gap-3">
                                <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                                    Mật khẩu
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-10 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
                                    aria-label="Hiện hoặc ẩn mật khẩu"
                                >
                                    {showPassword ? (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-3.057-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Submit Button with Loading State */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-75 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Đang đăng nhập...</span>
                                </>
                            ) : (
                                <span>Đăng nhập</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                            hoặc
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Google */}
                        <button
                            type="button"
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>

                        {/* GitHub */}
                        <button
                            type="button"
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                            <svg className="h-3.5 w-3.5 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                                <path clipRule="evenodd" fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                            GitHub
                        </button>
                    </div>
                </div>

                {/* Security Footnote */}
                <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1 shrink-0">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Bảo mật thông tin của bạn là ưu tiên hàng đầu của chúng tôi.</span>
                </div>
            </main>
        </div>
    );
}