'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import userService, { UserProfile as IServiceUserProfile, OccupationType } from '@/services/userService';

export type { OccupationType };
export type UserProfile = IServiceUserProfile;

const DEFAULT_AVATAR =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla';

const SAMPLE_AVATARS = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

const OCCUPATION_MAP: Record<string, { label: string; icon: string }> = {
    STUDENT: { label: 'Học sinh / Sinh viên', icon: '🎒' },
    PROFESSIONAL: { label: 'Người đi làm', icon: '💼' },
    OTHER: { label: 'Khác', icon: '🌐' },
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Chế độ chỉnh sửa (mặc định là false - chỉ xem)
    const [isEditing, setIsEditing] = useState(false);

    // Form data chỉnh sửa
    const [formData, setFormData] = useState({
        full_name: '',
        avatar_url: '',
        bio: '',
        occupation: 'STUDENT' as OccupationType,
        daily_target_minutes: 30,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveToast, setSaveToast] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const hasLoadedRef = useRef(false);

    // Tải thông tin người dùng từ Backend
    const loadProfile = async () => {
        try {
            const data = await userService.getCurrentUser();
            if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    avatar_url: data.avatar_url || '',
                    bio: data.bio || '',
                    occupation: (data.occupation as OccupationType) || 'STUDENT',
                    daily_target_minutes: data.daily_target_minutes || 30,
                });
            }
        } catch (err: any) {
            console.error('Lỗi khi tải thông tin hồ sơ:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;
        loadProfile();
    }, []);

    // Bắt đầu chỉnh sửa
    const handleStartEdit = () => {
        if (!profile) return;
        setFormData({
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || '',
            bio: profile.bio || '',
            occupation: (profile.occupation as OccupationType) || 'STUDENT',
            daily_target_minutes: profile.daily_target_minutes || 30,
        });
        setErrorMessage(null);
        setIsEditing(true);
    };

    // Hủy chỉnh sửa, quay về trạng thái chỉ xem
    const handleCancelEdit = () => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                avatar_url: profile.avatar_url || '',
                bio: profile.bio || '',
                occupation: (profile.occupation as OccupationType) || 'STUDENT',
                daily_target_minutes: profile.daily_target_minutes || 30,
            });
        }
        setErrorMessage(null);
        setIsEditing(false);
    };

    // Lưu thông tin chỉnh sửa (PUT /api/users/me)
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

            // Sau khi lưu thành công -> Khóa form lại (không cho chỉnh nữa)
            setIsEditing(false);
            setSaveToast('Cập nhật hồ sơ cá nhân thành công!');
            setTimeout(() => setSaveToast(null), 3000);
        } catch (err: any) {
            console.error('Lỗi khi cập nhật hồ sơ:', err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Cập nhật thất bại. Vui lòng kiểm tra lại!';
            setErrorMessage(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const displayAvatar = profile?.avatar_url || DEFAULT_AVATAR;
    const occupationInfo =
        OCCUPATION_MAP[profile?.occupation || 'STUDENT'] || { label: 'Học viên', icon: '🎓' };

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
            {/* Sidebar Component */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Header Component */}
                <Header userName={profile?.full_name} streakCount={profile?.current_streak} />

                {/* Scrollable Body */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 w-full max-w-[1200px] mx-auto space-y-6">
                    {/* Toast Thông báo thành công */}
                    {saveToast && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
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

                    {/* Toast Thông báo lỗi */}
                    {errorMessage && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
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

                    {isLoading ? (
                        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs animate-pulse space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-slate-200"></div>
                                <div className="space-y-3 flex-1">
                                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* ========================================================================= */}
                            {/* HERO PROFILE CARD: Ảnh đại diện, Tên, Badges, Nút Chỉnh sửa               */}
                            {/* ========================================================================= */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                                {/* Banner trên */}
                                <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 relative">
                                    <div className="absolute inset-0 bg-white/5 opacity-50 backdrop-blur-[1px]"></div>
                                </div>

                                <div className="px-6 sm:px-8 pb-8 pt-0 relative">
                                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-6">
                                        {/* Avatar & Thông tin cơ bản */}
                                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                                            <div className="relative w-28 h-28 rounded-full p-1.5 bg-white shadow-lg ring-4 ring-slate-100 shrink-0">
                                                <Image
                                                    src={displayAvatar}
                                                    alt={profile?.full_name || 'Avatar'}
                                                    width={112}
                                                    height={112}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>

                                            <div className="mb-1">
                                                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                                        {profile?.full_name || 'Người dùng SQLix'}
                                                    </h1>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                        {profile?.role === 'ADMIN' ? 'Quản trị viên' : 'Học viên'}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-3">
                                                    <span>@{profile?.username || 'user'}</span>
                                                    <span>•</span>
                                                    <span>{profile?.email}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Nút hành động: Chỉnh sửa hồ sơ */}
                                        <div className="flex justify-center sm:justify-end">
                                            {!isEditing ? (
                                                <button
                                                    type="button"
                                                    onClick={handleStartEdit}
                                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    <span>Chỉnh sửa thông tin</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                                                >
                                                    Hủy chỉnh sửa
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Thống kê Streak nổi bật */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                                        <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/60 flex items-center gap-3.5">
                                            <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shrink-0">
                                                🔥
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">
                                                    Chuỗi ngày học (Streak)
                                                </span>
                                                <div className="text-xl font-black text-orange-950 mt-0.5">
                                                    {profile?.current_streak ?? 0} <span className="text-xs font-bold text-orange-700">ngày</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center gap-3.5">
                                            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
                                                🏆
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                                                    Kỷ lục chuỗi dài nhất
                                                </span>
                                                <div className="text-xl font-black text-amber-950 mt-0.5">
                                                    {profile?.longest_streak ?? 0} <span className="text-xs font-bold text-amber-700">ngày</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center gap-3.5">
                                            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
                                                ⏱️
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                                                    Mục tiêu học tập
                                                </span>
                                                <div className="text-xl font-black text-blue-950 mt-0.5">
                                                    {profile?.daily_target_minutes ?? 30} <span className="text-xs font-bold text-blue-700">phút/ngày</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ========================================================================= */}
                            {/* NỘI DUNG CHÍNH: CHẾ ĐỘ XEM HOẶC CHẾ ĐỘ CHỈNH SỬA                          */}
                            {/* ========================================================================= */}
                            {!isEditing ? (
                                /* --- 1. CHẾ ĐỘ XEM THÔNG TIN (READ-ONLY) --- */
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>Thông Tin Cá Nhân</span>
                                        </h2>
                                        <span className="text-xs font-semibold text-slate-400">
                                            Nhấn &quot;Chỉnh sửa thông tin&quot; ở trên để cập nhật
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                Họ và Tên
                                            </span>
                                            <p className="text-sm font-bold text-slate-800">
                                                {profile?.full_name || 'Chưa cập nhật'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                Nghề Nghiệp / Đối Tượng
                                            </span>
                                            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                                <span>{occupationInfo.icon}</span>
                                                <span>{occupationInfo.label}</span>
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                Tên Đăng Nhập
                                            </span>
                                            <p className="text-sm font-bold text-slate-800">
                                                @{profile?.username}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                Địa Chỉ Email
                                            </span>
                                            <p className="text-sm font-bold text-slate-800">
                                                {profile?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Giới thiệu bản thân */}
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                            Giới Thiệu Bản Thân (Bio)
                                        </span>
                                        <p className="text-sm text-slate-700 leading-relaxed italic">
                                            {profile?.bio ? `"${profile.bio}"` : 'Chưa có thông tin giới thiệu bản thân.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* --- 2. CHẾ ĐỘ CHỈNH SỬA (FORM EDIT) --- */
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-500/30 shadow-md space-y-6">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <div>
                                            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                                <span>Cập Nhật Thông Tin Hồ Sơ</span>
                                            </h2>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Thay đổi thông tin và nhấn &quot;Lưu thay đổi&quot; để hoàn tất
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                            Đang chỉnh sửa
                                        </span>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Họ và tên */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Họ và Tên <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                placeholder="Nguyễn Văn A"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                                            />
                                        </div>

                                        {/* Ảnh đại diện (Avatar URL) */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-slate-700">
                                                Đường Dẫn Ảnh Đại Diện (Avatar URL)
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                                                    <Image
                                                        src={formData.avatar_url || DEFAULT_AVATAR}
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
                                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                                />
                                            </div>

                                            {/* Ảnh mẫu chọn nhanh */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[11px] text-slate-400 font-semibold mr-1">
                                                    Ảnh mẫu:
                                                </span>
                                                {SAMPLE_AVATARS.map((url, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, avatar_url: url })}
                                                        className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                                                            formData.avatar_url === url
                                                                ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                                                                : 'border-slate-200 hover:border-blue-400 opacity-80 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <Image
                                                            src={url}
                                                            alt={`Avatar mẫu ${index + 1}`}
                                                            width={32}
                                                            height={32}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Nghề nghiệp */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-2">
                                                Nghề Nghiệp / Đối Tượng
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    { key: 'STUDENT', label: 'Học sinh / Sinh viên', icon: '🎒' },
                                                    { key: 'PROFESSIONAL', label: 'Người đi làm', icon: '💼' },
                                                    { key: 'OTHER', label: 'Khác', icon: '🌐' },
                                                ].map((item) => {
                                                    const isSelected = formData.occupation === item.key;
                                                    return (
                                                        <div
                                                            key={item.key}
                                                            onClick={() =>
                                                                setFormData({ ...formData, occupation: item.key as OccupationType })
                                                            }
                                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                                                                isSelected
                                                                    ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500/20 text-blue-900 font-bold'
                                                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 font-medium'
                                                            }`}
                                                        >
                                                            <span className="text-lg">{item.icon}</span>
                                                            <span className="text-xs">{item.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Mục tiêu học mỗi ngày */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Mục Tiêu Học Mỗi Ngày (Phút)
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="360"
                                                    required
                                                    value={formData.daily_target_minutes}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            daily_target_minutes: Math.max(1, Number(e.target.value)),
                                                        })
                                                    }
                                                    className="w-32 px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                                />

                                                <div className="flex items-center gap-2">
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
                                        </div>

                                        {/* Giới thiệu bản thân */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Giới Thiệu Bản Thân (Bio)
                                            </label>
                                            <textarea
                                                rows={3}
                                                maxLength={500}
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                placeholder="Chia sẻ một vài điều về mục tiêu học SQL của bạn..."
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all leading-relaxed"
                                            />
                                        </div>

                                        {/* Nút Submit / Cancel */}
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={handleCancelEdit}
                                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                            >
                                                Hủy bỏ
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
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
