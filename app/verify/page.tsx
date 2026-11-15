'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import authService, { checkIsAdmin, extractRoleFromToken } from '@/services/authService';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Lấy email từ query param hoặc từ sessionStorage đã lưu lúc đăng ký
    const [email, setEmail] = useState('');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [tempEmail, setTempEmail] = useState('');

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    // Khởi tạo email từ query param hoặc sessionStorage
    useEffect(() => {
        const paramEmail = searchParams.get('email');
        let initialEmail = '';

        if (paramEmail) {
            initialEmail = paramEmail.trim();
        } else if (typeof window !== 'undefined') {
            const savedEmail = sessionStorage.getItem('pending_verification_email');
            if (savedEmail) {
                initialEmail = savedEmail.trim();
            }
        }

        setEmail(initialEmail);
        setTempEmail(initialEmail);

        // Kiểm tra nếu có mã otp sẵn trong query params (ví dụ từ liên kết trong email)
        const paramOtp = searchParams.get('otp') || searchParams.get('code');
        if (paramOtp && paramOtp.length === 6 && /^\d+$/.test(paramOtp)) {
            const digits = paramOtp.split('');
            setOtp(digits);
        }

        // Tự động focus vào ô OTP đầu tiên
        setTimeout(() => {
            if (inputRefs.current[0]) {
                inputRefs.current[0]?.focus();
            }
        }, 300);
    }, [searchParams]);

    // Đồng hồ đếm ngược gửi lại OTP
    useEffect(() => {
        if (resendCooldown <= 0) {
            setCanResend(true);
            return;
        }

        const timer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Xử lý thay đổi ký tự từng ô OTP
    const handleOtpChange = (index: number, value: string) => {
        // Chỉ chấp nhận chữ số
        const cleanVal = value.replace(/\D/g, '');

        if (!cleanVal) {
            const newOtp = [...otp];
            newOtp[index] = '';
            setOtp(newOtp);
            return;
        }

        // Nếu người dùng gõ hoặc dán nhiều số vào một ô
        if (cleanVal.length > 1) {
            handlePaste(cleanVal, index);
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = cleanVal;
        setOtp(newOtp);
        setErrorMessage('');

        // Tự động nhảy sang ô tiếp theo
        if (index < 5 && cleanVal) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Xử lý phím Backspace, ArrowLeft, ArrowRight
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Xử lý dán mã (Paste)
    const handlePaste = (pastedText: string, startIndex: number = 0) => {
        const digits = pastedText.replace(/\D/g, '').slice(0, 6);
        if (!digits) return;

        const newOtp = [...otp];
        for (let i = 0; i < digits.length; i++) {
            const targetIdx = startIndex + i;
            if (targetIdx < 6) {
                newOtp[targetIdx] = digits[i];
            }
        }
        setOtp(newOtp);
        setErrorMessage('');

        // Chuyển focus đến ô sau ký tự dán cuối cùng
        const nextFocus = Math.min(startIndex + digits.length, 5);
        inputRefs.current[nextFocus]?.focus();
    };

    // Lưu chỉnh sửa email nếu người dùng nhập sai email lúc đăng ký
    const handleSaveEmail = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempEmail || !tempEmail.includes('@')) {
            setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
            return;
        }
        setEmail(tempEmail.trim());
        setIsEditingEmail(false);
        setErrorMessage('');
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('pending_verification_email', tempEmail.trim());
        }
    };

    // Gửi lại mã OTP
    const handleResendOtp = async () => {
        if (!canResend || isResending) return;
        if (!email) {
            setErrorMessage('Vui lòng cung cấp địa chỉ email để nhận lại mã OTP.');
            return;
        }

        setIsResending(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Backend có endpoint gửi lại nếu có hỗ trợ
            if (typeof (authService as any).resendVerification === 'function') {
                await (authService as any).resendVerification(email);
            }
            setSuccessMessage('Mã xác thực mới đã được gửi đến email của bạn.');
            setResendCooldown(60);
            setCanResend(false);
        } catch (err: any) {
            const data = err.response?.data;
            if (data?.code === 1505) {
                setErrorMessage('Vui lòng đợi 60 giây trước khi yêu cầu gửi lại mã.');
            } else {
                setErrorMessage(
                    data?.message || 'Không thể gửi lại mã OTP lúc này. Vui lòng kiểm tra lại hòm thư hoặc đăng ký lại.'
                );
            }
        } finally {
            setIsResending(false);
        }
    };

    // Thực hiện xác thực OTP và tự động đăng nhập vào Dashboard
    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const fullOtp = otp.join('');
        if (!email) {
            setErrorMessage('Vui lòng nhập email tài khoản của bạn.');
            return;
        }

        if (fullOtp.length !== 6) {
            setErrorMessage('Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Gọi API Backend xác thực OTP
            await authService.verifyEmail({
                email: email.trim(),
                otp: fullOtp,
            });

            // 2. Xác thực thành công: Kiểm tra thông tin đăng nhập tạm để auto-login
            setSuccessMessage('Xác thực tài khoản thành công!');

            let savedPassword = '';
            let savedEmail = '';
            if (typeof window !== 'undefined') {
                savedPassword = sessionStorage.getItem('pending_verification_pass') || '';
                savedEmail = sessionStorage.getItem('pending_verification_email') || '';
            }

            // Nếu có lưu mật khẩu tạm thời từ form đăng ký -> Tự động đăng nhập luôn
            if (savedPassword && (!savedEmail || savedEmail.toLowerCase() === email.toLowerCase())) {
                setIsAutoLoggingIn(true);
                setSuccessMessage('Xác thực thành công! Đang tự động đăng nhập vào Dashboard...');

                try {
                    const loginRes = await authService.login({
                        identifier: email.trim(),
                        password: savedPassword,
                    });

                    // Xóa thông tin mật khẩu tạm trong sessionStorage sau khi login thành công
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('pending_verification_pass');
                        sessionStorage.removeItem('pending_verification_email');
                    }

                    // Điều hướng sang Dashboard tương ứng (Admin hoặc User)
                    let userRole: any =
                        loginRes?.user?.role ||
                        loginRes?.role ||
                        loginRes?.roles ||
                        (loginRes as any)?.data?.role ||
                        (loginRes as any)?.result?.role;

                    const accessToken =
                        loginRes.accessToken ||
                        (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

                    if (!userRole && accessToken) {
                        userRole = extractRoleFromToken(accessToken);
                    }

                    setTimeout(() => {
                        if (checkIsAdmin(userRole)) {
                            router.push('/admin/dashboard');
                        } else {
                            router.push('/dashboard');
                        }
                    }, 800);
                    return;
                } catch (loginErr) {
                    console.warn('Auto login after verification failed, redirecting to login page:', loginErr);
                }
            }

            // Nếu không có mật khẩu tạm trong session, chuyển hướng sang trang đăng nhập với thông báo thành công
            setTimeout(() => {
                router.push(`/login?verified=true&email=${encodeURIComponent(email.trim())}`);
            }, 1200);

        } catch (err: any) {
            console.error('Email verification error:', err);
            const data = err.response?.data;
            const code = data?.code;
            let msg = 'Mã xác thực không hợp lệ. Vui lòng kiểm tra lại.';

            if (code === 1501) {
                msg = 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại 6 chữ số.';
            } else if (code === 1502) {
                msg = 'Mã xác thực OTP đã hết hạn (sau 5 phút). Vui lòng yêu cầu mã mới.';
            } else if (code === 1503) {
                msg = 'Bạn đã nhập sai mã quá 5 lần. Vui lòng yêu cầu mã mới để tiếp tục.';
            } else if (code === 1504) {
                msg = 'Email này đã được xác thực trước đó. Bạn có thể đăng nhập ngay.';
                setTimeout(() => {
                    router.push(`/login?email=${encodeURIComponent(email.trim())}`);
                }, 2000);
            } else if (code === 1506) {
                msg = 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.';
            } else if (data?.message) {
                msg = data.message;
            }

            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const isComplete = otp.every((digit) => digit !== '');

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 antialiased grid grid-cols-1 lg:grid-cols-12">
            {/* =====================================================
                LEFT - MARKETING & SECURITY SECTION (Desktop: lg+)
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

                {/* Main Content */}
                <div className="relative z-10 my-auto py-6 max-w-xl">
                    <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                        Bảo mật tài khoản
                    </span>

                    <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 mb-3">
                        Kích hoạt tài khoản<br />
                        và bắt đầu học ngay
                    </h1>

                    <p className="mb-6 text-sm leading-relaxed text-slate-600">
                        Mã OTP xác thực đã được gửi về hộp thư của bạn. Vui lòng nhập mã để hoàn tất đăng ký và khám phá lộ trình học SQL.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 text-blue-600 shadow-sm">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Xác thực an toàn</h3>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                    Mã OTP chỉ gửi trực tiếp đến email chính chủ của bạn.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-600 shadow-sm">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Tự động đăng nhập</h3>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                    Hệ thống tự động chuyển bạn vào Dashboard ngay khi xác thực thành công.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100 text-indigo-600 shadow-sm">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Hiệu lực trong 5 phút</h3>
                                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                    Mã OTP có hiệu lực 5 phút để đảm bảo quyền bảo mật dữ liệu.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mockup Box */}
                <div className="relative z-10 w-full max-w-[340px] mx-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-300 shadow-xl border border-slate-800">
                    <div><span className="text-cyan-400 font-bold">POST</span> /api/auth/verify-email</div>
                    <div className="text-slate-500">--------------------------------</div>
                    <div><span className="text-amber-400 font-bold">STATUS:</span> <span className="text-emerald-400">200 OK</span></div>
                    <div><span className="text-blue-400 font-bold">USER_STATUS:</span> ACTIVATED</div>
                    <div className="text-slate-400 font-semibold mt-1">-- Auto loading Dashboard...</div>
                </div>
            </aside>

            {/* =====================================================
                RIGHT - VERIFICATION FORM
            ====================================================== */}
            <main className="col-span-1 lg:col-span-7 xl:col-span-7 flex flex-col justify-between items-center p-6 sm:p-10 bg-slate-100 min-h-screen overflow-y-auto">
                {/* Mobile / Tablet Header */}
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
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline ml-1">
                            Đăng nhập
                        </Link>
                    </div>
                </div>

                {/* Verification Card */}
                <div className="w-full max-w-[460px] mx-auto my-auto bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/60 p-6 sm:p-8">
                    {/* Header Icon */}
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shadow-sm shadow-blue-500/10">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">
                            Xác thực tài khoản
                        </h2>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                            Chúng tôi đã gửi mã xác thực 6 chữ số đến địa chỉ email:
                        </p>

                        {/* Email display & edit toggle */}
                        <div className="mt-2.5 flex items-center justify-center gap-2">
                            {isEditingEmail ? (
                                <form onSubmit={handleSaveEmail} className="flex items-center gap-1.5 w-full max-w-[320px]">
                                    <input
                                        type="email"
                                        value={tempEmail}
                                        onChange={(e) => setTempEmail(e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-blue-600"
                                        placeholder="email@example.com"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                                    >
                                        Lưu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTempEmail(email);
                                            setIsEditingEmail(false);
                                        }}
                                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                </form>
                            ) : (
                                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200">
                                    <span className="font-semibold text-slate-800 text-xs sm:text-sm max-w-[220px] sm:max-w-[280px] truncate">
                                        {email || 'Chưa cung cấp email'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingEmail(true)}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                        title="Chỉnh sửa email nếu nhập sai"
                                    >
                                        Đổi
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in duration-200">
                            <svg className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="flex-1 font-medium">{errorMessage}</span>
                        </div>
                    )}

                    {/* Success Banner */}
                    {successMessage && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 animate-in fade-in duration-200">
                            <svg className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="flex-1 font-medium">{successMessage}</span>
                        </div>
                    )}

                    {/* Auto Logging In Notice */}
                    {isAutoLoggingIn && (
                        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 font-semibold animate-pulse">
                            <svg className="h-4 w-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Đang chuyển hướng đến trang Dashboard...</span>
                        </div>
                    )}

                    {/* Form OTP Input */}
                    <form onSubmit={handleVerify} className="space-y-6">
                        {/* 6 Digit Input Cells */}
                        <div>
                            <label className="mb-2 block text-center text-xs font-semibold text-slate-700">
                                Nhập mã OTP gồm 6 chữ số
                            </label>
                            <div
                                className="flex justify-between items-center gap-2 sm:gap-2.5"
                                onPaste={(e) => {
                                    e.preventDefault();
                                    handlePaste(e.clipboardData.getData('text'));
                                }}
                            >
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => {
                                            inputRefs.current[idx] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        disabled={isLoading || isAutoLoggingIn}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className={`w-11 h-13 sm:w-13 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border transition-all outline-none disabled:bg-slate-50 disabled:text-slate-400 ${
                                            digit
                                                ? 'border-blue-600 bg-blue-50/30 text-blue-900 shadow-sm'
                                                : 'border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={!isComplete || isLoading || isAutoLoggingIn}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Đang xác thực...</span>
                                </>
                            ) : isAutoLoggingIn ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Đang vào Dashboard...</span>
                                </>
                            ) : (
                                <span>Xác nhận OTP</span>
                            )}
                        </button>
                    </form>

                    {/* Resend & Support */}
                    <div className="mt-6 text-center text-xs text-slate-500 space-y-2">
                        <div>
                            Chưa nhận được mã?{' '}
                            {canResend ? (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={isResending || isLoading}
                                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                                >
                                    {isResending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                                </button>
                            ) : (
                                <span className="text-slate-400 font-medium">
                                    Gửi lại sau <span className="font-bold text-blue-600">{resendCooldown}s</span>
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            * Mẹo: Vui lòng kiểm tra kỹ cả thư mục <strong>Spam (Thư rác)</strong> hoặc <strong>Quảng cáo</strong> nếu không thấy thư trong Hộp thư đến.
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <Link href="/register" className="hover:text-blue-600 hover:underline">
                            ← Đăng ký lại
                        </Link>
                        <Link href="/login" className="hover:text-blue-600 hover:underline">
                            Đến trang Đăng nhập →
                        </Link>
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

export default function VerifyPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải trang xác thực...</span>
                    </div>
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
