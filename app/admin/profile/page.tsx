'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import userService, { UserProfile } from '@/services/userService';

const DEFAULT_AVATAR =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla';

const SAMPLE_AVATARS = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export default function AdminProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        avatar_url: '',
        bio: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveToast, setSaveToast] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const hasLoadedRef = useRef(false);

    const loadProfile = async () => {
        try {
            const data = await userService.getCurrentUser();
            if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    avatar_url: data.avatar_url || '',
                    bio: data.bio || '',
                });
            }
        } catch (err: any) {
            console.error('Lỗi khi tải thông tin admin:', err);
            setErrorMessage('Không thể tải thông tin quản trị viên.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadProfile();
        }
    }, []);

    const handleStartEdit = () => {
        if (!profile) return;
        setFormData({
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || '',
            bio: profile.bio || '',
        });
        setIsEditing(true);
        setErrorMessage(null);
    };

    const handleCancelEdit = () => {
        if (!profile) return;
        setFormData({
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || '',
            bio: profile.bio || '',
        });
        setIsEditing(false);
        setErrorMessage(null);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name.trim()) {
            setErrorMessage('Họ và tên không được để trống.');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);

        try {
            const updated = await userService.updateProfile({
                full_name: formData.full_name.trim(),
                avatar_url: formData.avatar_url.trim() || undefined,
                bio: formData.bio.trim() || undefined,
                daily_target_minutes: profile?.daily_target_minutes ?? 30,
                occupation: profile?.occupation ?? 'PROFESSIONAL',
            });

            setProfile(updated);
            setIsEditing(false);
            setSaveToast('Cập nhật hồ sơ quản trị viên thành công!');
            setTimeout(() => setSaveToast(null), 4000);
        } catch (err: any) {
            console.error('Lỗi khi lưu thông tin:', err);
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

    return (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 w-full max-w-5xl mx-auto space-y-6">
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
                        type="button"
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
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="text-rose-600 hover:text-rose-900 text-xs font-bold cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Profile Header Hero Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                {/* Banner Gradient */}
                <div className="h-32 sm:h-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 relative">
                    <div className="absolute inset-0 dot-pattern opacity-20" />
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Quản Trị Viên Hệ Thống
                        </span>
                        <Link
                            href="/dashboard"
                            className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 hover:bg-slate-100 transition-colors shadow-xs flex items-center gap-1"
                            title="Chuyển sang góc nhìn của Học viên"
                        >
                            <span>🎒</span>
                            <span>Cổng Học Viên</span>
                        </Link>
                    </div>
                </div>

                <div className="px-6 sm:px-8 pb-8 pt-0 relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-6">
                        {/* Avatar & Basic Info */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                            <div className="relative w-28 h-28 rounded-full p-1.5 bg-white shadow-lg ring-4 ring-slate-100 shrink-0">
                                <Image
                                    src={displayAvatar}
                                    alt={profile?.full_name || 'Admin Avatar'}
                                    width={112}
                                    height={112}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>

                            <div className="mb-1">
                                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {profile?.full_name || 'Quản trị viên SQLix'}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        🛡️ {profile?.role || 'ADMIN'}
                                    </span>
                                </div>

                                <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-3">
                                    <span>@{profile?.username || 'admin'}</span>
                                    <span>•</span>
                                    <span>{profile?.email || 'admin@sqlix.edu.vn'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-center sm:justify-end">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    onClick={handleStartEdit}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Chỉnh sửa hồ sơ</span>
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

                    {/* Bio Snippet */}
                    {profile?.bio && !isEditing && (
                        <div className="mt-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                            {profile.bio}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            {isEditing ? (
                /* FORM CHỈNH SỬA */
                <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black">
                                ✏️
                            </span>
                            <span>Chỉnh Sửa Thông Tin Quản Trị Viên</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Cập nhật họ tên, ảnh đại diện và thông tin giới thiệu của bạn</p>
                    </div>

                    {/* Avatar Selection */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">
                            Ảnh đại diện (Avatar)
                        </label>
                        <div className="flex items-center gap-3 overflow-x-auto pb-2">
                            {SAMPLE_AVATARS.map((url, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, avatar_url: url })}
                                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                                        formData.avatar_url === url
                                            ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                                            : 'border-slate-200 hover:border-blue-400'
                                    }`}
                                >
                                    <Image src={url} alt={`Preset ${idx + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Hoặc nhập đường dẫn ảnh (URL) tùy chỉnh:
                            </label>
                            <input
                                type="url"
                                value={formData.avatar_url}
                                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                placeholder="https://example.com/avatar.png"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Họ và tên <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Nhập họ và tên đầy đủ..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Giới thiệu bản thân (Bio)
                        </label>
                        <textarea
                            rows={3}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Mô tả ngắn gọn về vai trò quản trị hoặc chuyên môn của bạn..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-2 ${
                                isSaving ? 'opacity-70 cursor-wait' : ''
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <span>Lưu thay đổi</span>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                /* CHẾ ĐỘ XEM CHI TIẾT THÔNG TIN */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Thông tin tài khoản */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600" />
                                <span>Tài Khoản Quản Trị</span>
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Đang hoạt động
                            </span>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            <div>
                                <span className="text-slate-400 block text-[11px] mb-0.5">Tên đăng nhập:</span>
                                <span className="font-bold text-slate-800 font-mono">@{profile?.username || '—'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px] mb-0.5">Email liên hệ:</span>
                                <span className="font-bold text-slate-800">{profile?.email || '—'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px] mb-0.5">Họ và tên:</span>
                                <span className="font-bold text-slate-800">{profile?.full_name || '—'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px] mb-0.5">Vai trò hệ thống:</span>
                                <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-blue-700 bg-blue-50 border border-blue-200 text-[11px]">
                                    {profile?.role || 'ADMIN'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quyền hạn & Phân quyền quản trị */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                <span>Quyền Hạn Quản Trị</span>
                            </h3>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                Toàn quyền quản trị
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-center gap-2 text-slate-700">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>Quản lý người dùng, học viên & phân quyền</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>Tạo và chỉnh sửa Danh mục, Bài học, Sections</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>Quản lý Schema CSDL mẫu & Ngân hàng bài tập SQL</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>Tổ chức Đề thi thử và giám sát lịch sử làm bài</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500">Xem thử góc nhìn học viên:</span>
                            <Link
                                href="/dashboard"
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                                <span>Chuyển sang Cổng học viên</span>
                                <span>→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
