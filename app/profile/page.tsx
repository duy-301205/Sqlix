'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import userService, { UserProfile as IServiceUserProfile, OccupationType } from '@/services/userService';

export type { OccupationType };
export type UserProfile = IServiceUserProfile;

const DEFAULT_AVATAR =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla';

const INITIAL_PROFILE: UserProfile = {
    id: 'usr-98421',
    username: 'duyhoang_sql',
    email: 'duy.hoang@sqlix.edu.vn',
    role: 'ADMIN',
    full_name: 'Duy Hoàng',
    avatar_url: DEFAULT_AVATAR,
    bio: 'Đam mê dữ liệu và tối ưu hóa câu truy vấn SQL hiệu năng cao. Đang học và chia sẻ kiến thức backend development.',
    occupation: 'PROFESSIONAL',
    daily_target_minutes: 30,
    current_streak: 7,
    longest_streak: 21,
};

const SAMPLE_AVATARS = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export default function ProfilePage() {
    // Master profile data
    const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
    const [isLoading, setIsLoading] = useState(true);

    // Form edit states
    const [formData, setFormData] = useState({
        full_name: INITIAL_PROFILE.full_name,
        avatar_url: INITIAL_PROFILE.avatar_url || '',
        bio: INITIAL_PROFILE.bio || '',
        occupation: INITIAL_PROFILE.occupation,
        daily_target_minutes: INITIAL_PROFILE.daily_target_minutes,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveToast, setSaveToast] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copyToast, setCopyToast] = useState(false);

    // Load Profile thực tế từ Backend API
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await userService.getCurrentUser();
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    avatar_url: data.avatar_url || '',
                    bio: data.bio || '',
                    occupation: (data.occupation as OccupationType) || 'STUDENT',
                    daily_target_minutes: data.daily_target_minutes || 30,
                });
            } catch (err: any) {
                console.error('Lỗi khi tải thông tin hồ sơ:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []);

    // Handle Form Submit (PUT /api/users/me)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSaveToast(null);

        if (!formData.full_name.trim()) {
            setErrorMessage('Vui lòng nhập họ và tên!');
            return;
        }

        if (formData.daily_target_minutes < 1) {
            setErrorMessage('Mục tiêu học mỗi ngày tối thiểu là 1 phút!');
            return;
        }

        setIsSaving(true);

        const updatePayload = {
            full_name: formData.full_name.trim(),
            avatar_url: formData.avatar_url.trim(),
            bio: formData.bio.trim(),
            daily_target_minutes: Number(formData.daily_target_minutes),
            occupation: formData.occupation,
        };

        try {
            const updated = await userService.updateProfile(updatePayload);
            setProfile(updated);
            setFormData({
                full_name: updated.full_name,
                avatar_url: updated.avatar_url || '',
                bio: updated.bio || '',
                occupation: (updated.occupation as OccupationType) || 'STUDENT',
                daily_target_minutes: updated.daily_target_minutes || 30,
            });
            setSaveToast('Cập nhật hồ sơ cá nhân thành công!');
            setTimeout(() => setSaveToast(null), 3500);
        } catch (err: any) {
            console.error('Lỗi khi cập nhật hồ sơ:', err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Cập nhật thất bại. Vui lòng thử lại!';
            setErrorMessage(msg);
        } finally {
            setIsSaving(false);
        }
    };

    // Reset Form
    const handleReset = () => {
        setFormData({
            full_name: profile.full_name,
            avatar_url: profile.avatar_url || '',
            bio: profile.bio || '',
            occupation: (profile.occupation as OccupationType) || 'STUDENT',
            daily_target_minutes: profile.daily_target_minutes,
        });
    };

    // Copy Account ID
    const handleCopyId = () => {
        if (profile.id) {
            navigator.clipboard.writeText(String(profile.id));
            setCopyToast(true);
            setTimeout(() => setCopyToast(false), 2000);
        }
    };

    const hasChanges =
        formData.full_name !== profile.full_name ||
        formData.avatar_url !== profile.avatar_url ||
        formData.bio !== profile.bio ||
        formData.occupation !== profile.occupation ||
        formData.daily_target_minutes !== profile.daily_target_minutes;

    return (
        <div className="flex h-screen w-full bg-[#f1f5f9] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Main Student Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header Component */}
                <Header userName={profile.full_name} streakCount={profile.current_streak} />

                {/* Scrollable Body */}
                <main className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-12 py-8 w-full max-w-[1500px] mx-auto space-y-8 min-w-0">
                    {/* Success Toast Notification */}
                    {saveToast && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                                    ✓
                                </span>
                                <span>{saveToast}</span>
                            </div>
                            <button
                                onClick={() => setSaveToast(null)}
                                className="text-emerald-600 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Error Toast Notification */}
                    {errorMessage && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs">
                                    ✕
                                </span>
                                <span>{errorMessage}</span>
                            </div>
                            <button
                                onClick={() => setErrorMessage(null)}
                                className="text-rose-600 hover:text-rose-900 text-xs font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Main 2-Column Responsive Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* ========================================================================= */}
                        {/* LEFT COLUMN: HERO OVERVIEW + ACCOUNT INFO + LEARNING PROGRESS             */}
                        {/* ========================================================================= */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* 1. Hero Profile Card */}
                            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
                                {/* Ambient Background Gradient */}
                                <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-r from-blue-600 via-indigo-600 to-sky-500 -z-0" />

                                <div className="relative z-10 pt-8 flex flex-col items-center text-center">
                                    {/* Avatar with Glow & Ring */}
                                    <div className="relative mb-3.5 group">
                                        <div className="w-24 h-24 rounded-full p-1 bg-white shadow-xl ring-4 ring-blue-500/20">
                                            <Image
                                                src={formData.avatar_url || profile.avatar_url || DEFAULT_AVATAR}
                                                alt={profile.full_name || 'User Avatar'}
                                                width={96}
                                                height={96}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                        <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                    </div>

                                    {/* Name & Username */}
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                        {formData.full_name || profile.full_name}
                                    </h2>
                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                        @{profile.username}
                                    </p>

                                    {/* Badges: Role & Occupation */}
                                    <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                                        <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                                            {profile.role === 'ADMIN' ? '🛡️ Quản trị viên' : '🎓 Học viên'}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {formData.occupation === 'STUDENT'
                                                ? '🎒 Học sinh / Sinh viên'
                                                : formData.occupation === 'PROFESSIONAL'
                                                ? '💼 Đi làm / Chuyên gia'
                                                : '🌐 Khác'}
                                        </span>
                                    </div>

                                    {/* Bio Preview */}
                                    <p className="text-xs text-slate-500 mt-4 px-2 leading-relaxed italic">
                                        &quot;{formData.bio || 'Chưa có thông tin giới thiệu bản thân.'}&quot;
                                    </p>
                                </div>
                            </div>

                            {/* 2. Tiến Độ Học Tập (Learning Progress & Streaks - Read Only) */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                        <span>Tiến Độ Rèn Luyện SQL</span>
                                    </h3>
                                    <span className="text-[11px] font-semibold text-slate-400">Chỉ số tích lũy</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    {/* Current Streak */}
                                    <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70 shadow-2xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-orange-700">Streak Hiện Tại</span>
                                            <span className="text-lg">🔥</span>
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-black text-orange-950">
                                                {profile.current_streak}
                                            </span>
                                            <span className="text-xs font-semibold text-orange-700">ngày</span>
                                        </div>
                                        <p className="text-[10px] text-orange-600/90 mt-1 font-medium">
                                            Duy trì liên tục mỗi ngày
                                        </p>
                                    </div>

                                    {/* Longest Streak */}
                                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 shadow-2xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-800">Kỷ Lục Dài Nhất</span>
                                            <span className="text-lg">🏆</span>
                                        </div>
                                        <div className="mt-2 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-black text-amber-950">
                                                {profile.longest_streak}
                                            </span>
                                            <span className="text-xs font-semibold text-amber-700">ngày</span>
                                        </div>
                                        <p className="text-[10px] text-amber-600/90 mt-1 font-medium">
                                            Thành tích cao nhất đạt được
                                        </p>
                                    </div>
                                </div>

                                {/* Daily Target Display */}
                                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                            ⏱️
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-800 block">
                                                Mục tiêu mỗi ngày
                                            </span>
                                            <span className="text-xs text-blue-700 font-medium">
                                                Rèn luyện SQL {formData.daily_target_minutes} phút/ngày
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-blue-700">
                                        {formData.daily_target_minutes}p
                                    </span>
                                </div>
                            </div>

                            {/* 3. Thông Tin Tài Khoản (Account Info - Read Only) */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                        <span>Thông Tin Tài Khoản</span>
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                        Chỉ đọc (Cố định)
                                    </span>
                                </div>

                                <div className="space-y-3 text-xs">
                                    {/* User ID */}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                                                Mã Định Danh (ID)
                                            </span>
                                            <span className="font-mono font-bold text-slate-800">
                                                {profile.id}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCopyId}
                                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                        >
                                            {copyToast ? '✓ Đã chép' : 'Sao chép'}
                                        </button>
                                    </div>

                                    {/* Username */}
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                                                Tên Tài Khoản (Username)
                                            </span>
                                            <span className="font-semibold text-slate-800">
                                                @{profile.username}
                                            </span>
                                        </div>
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>

                                    {/* Email */}
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                                                Địa Chỉ Email
                                            </span>
                                            <span className="font-semibold text-slate-800">
                                                {profile.email}
                                            </span>
                                        </div>
                                        <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                                            ✓ Đã xác thực
                                        </span>
                                    </div>

                                    {/* Role */}
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                                                Phân Quyền Hệ Thống (Role)
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {profile.role}
                                            </span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                            ACTIVE
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* RIGHT COLUMN: EDITABLE PERSONAL PROFILE FORM (PUT /api/users/me)          */}
                        {/* ========================================================================= */}
                        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                                        Chỉnh Sửa Thông Tin Cá Nhân
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Cập nhật hồ sơ hiển thị công khai qua API <code className="font-mono text-blue-600">PUT /api/users/me</code>
                                    </p>
                                </div>
                                {hasChanges && (
                                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                                        Có thay đổi chưa lưu
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Field 1: Họ và tên */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Họ và Tên (Full Name) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Ví dụ: Nguyễn Minh Anh"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Field 2: Avatar URL & Quick Presets */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Đường Dẫn Ảnh Đại Diện (Avatar URL)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                                            <Image
                                                src={formData.avatar_url || profile.avatar_url || DEFAULT_AVATAR}
                                                alt="Avatar preview"
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <input
                                            type="url"
                                            value={formData.avatar_url}
                                            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                            placeholder="https://example.com/avatar.png"
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Quick Preset Avatars */}
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                                            Hoặc chọn nhanh ảnh mẫu có sẵn:
                                        </span>
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            {SAMPLE_AVATARS.map((url, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, avatar_url: url })}
                                                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                                                        formData.avatar_url === url
                                                            ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                                                            : 'border-slate-200 hover:border-blue-400 opacity-80 hover:opacity-100'
                                                    }`}
                                                >
                                                    <Image
                                                        src={url}
                                                        alt={`Sample ${index + 1}`}
                                                        width={36}
                                                        height={36}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Field 3: Nghề nghiệp (Occupation) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">
                                        Nghề Nghiệp Hiện Tại (Occupation)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { key: 'STUDENT', label: 'Học sinh / Sinh viên', icon: '🎒', desc: 'Đang theo học tại trường' },
                                            { key: 'PROFESSIONAL', label: 'Người đi làm', icon: '💼', desc: 'Lập trình viên, Data, v.v.' },
                                            { key: 'OTHER', label: 'Khác', icon: '🌐', desc: 'Tự do / Khác' },
                                        ].map((item) => {
                                            const isSelected = formData.occupation === item.key;
                                            return (
                                                <div
                                                    key={item.key}
                                                    onClick={() =>
                                                        setFormData({ ...formData, occupation: item.key as OccupationType })
                                                    }
                                                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                                                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-base">{item.icon}</span>
                                                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 leading-tight">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Field 4: Mục tiêu học mỗi ngày (daily_target_minutes) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Mục Tiêu Học Mỗi Ngày (Phút) <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-xs text-blue-600 font-bold">
                                            {formData.daily_target_minutes} phút/ngày
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="360"
                                            required
                                            value={formData.daily_target_minutes}
                                            onChange={(e) =>
                                                setFormData({ ...formData, daily_target_minutes: Math.max(1, Number(e.target.value)) })
                                            }
                                            className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />

                                        {/* Quick Preset Buttons */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {[15, 30, 45, 60].map((mins) => (
                                                <button
                                                    key={mins}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, daily_target_minutes: mins })}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        formData.daily_target_minutes === mins
                                                            ? 'bg-blue-600 text-white shadow-xs'
                                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    {mins} phút
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1.5">
                                        Hệ thống sẽ dựa vào thời lượng này để tính tỷ lệ hoàn thành mục tiêu ngày và duy trì Streak.
                                    </p>
                                </div>

                                {/* Field 5: Giới thiệu bản thân (Bio, max 500 characters) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-slate-700">
                                            Giới Thiệu Bản Thân (Bio)
                                        </label>
                                        <span
                                            className={`text-[11px] font-mono font-semibold ${
                                                formData.bio.length > 500 ? 'text-rose-600 font-bold' : 'text-slate-400'
                                            }`}
                                        >
                                            {formData.bio.length} / 500 ký tự
                                        </span>
                                    </div>
                                    <textarea
                                        rows={4}
                                        maxLength={500}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Chia sẻ đôi nét về mục tiêu học SQL, sở thích công nghệ hoặc định hướng công việc của bạn..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        disabled={!hasChanges || isSaving}
                                        onClick={handleReset}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Đặt lại
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                </svg>
                                                <span>Đang lưu...</span>
                                            </>
                                        ) : (
                                            <span>Lưu thay đổi</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
