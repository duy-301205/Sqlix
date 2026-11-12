'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import adminUserService, {
    AdminUser,
    AdminUserPaginationInfo,
} from '@/services/adminUserService';

export default function AdminUsersPage() {
    // ================= State Quản lý Người dùng =================
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pagination, setPagination] = useState<AdminUserPaginationInfo>({
        total: 0,
        page: 0,
        size: 20,
        totalPages: 1,
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ================= State Bộ lọc & Tìm kiếm =================
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL | ACTIVE | BANNED
    const [currentPage, setCurrentPage] = useState<number>(0); // 0-based index
    const pageSize = 20;

    // ================= State Xử lý Thao tác =================
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
    } | null>(null);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Modal state for Create / Edit
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'USER',
        active: true,
    });

    // Modal state for Delete confirmation
    const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUser | null>(null);

    // Helper Toast
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage({ message, type });
        toastTimeoutRef.current = setTimeout(() => {
            setToastMessage(null);
        }, 3500);
    }, []);

    // Debounce search query (350ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(0);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ================= Fetch Data từ API =================
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let activeParam: boolean | null = null;
            if (statusFilter === 'ACTIVE') activeParam = true;
            else if (statusFilter === 'BANNED') activeParam = false;

            const res = await adminUserService.getUsers({
                search: debouncedSearch.trim() || undefined,
                role: roleFilter !== 'ALL' ? roleFilter : undefined,
                active: activeParam,
                page: currentPage,
                size: pageSize,
            });

            if (res && Array.isArray(res.users)) {
                setUsers(res.users);
                setPagination(res.pagination);
            } else {
                throw new Error('Cấu trúc dữ liệu API trả về không hợp lệ');
            }
        } catch (err: any) {
            console.error('[AdminUsers] Không thể tải dữ liệu từ API máy chủ:', err);
            setError(err?.response?.data?.message || err?.message || 'Không thể đồng bộ danh sách người dùng từ máy chủ.');
            setUsers([]);
            setPagination({
                total: 0,
                page: currentPage,
                size: pageSize,
                totalPages: 1,
            });
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, roleFilter, statusFilter, currentPage, pageSize]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Cleanup toast timeout on unmount
    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, []);

    // ================= CRUD & Actions Event Handlers =================

    // 1. Cập nhật vai trò (Role): PUT /api/admin/users/{userId}/role
    const handleRoleChange = async (userId: string, newRole: string) => {
        const targetUser = users.find((u) => u.id === userId);
        const oldRole = targetUser?.role || 'USER';

        // Optimistic UI update
        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
        );
        setUpdatingUserId(userId);

        try {
            await adminUserService.updateUserRole(userId, newRole);
            showToast(
                `Đã chuyển vai trò của "${targetUser?.username || userId}" thành "${newRole}" thành công!`,
                'success'
            );
        } catch (err: any) {
            console.error('[AdminUsers] Lỗi khi đổi vai trò:', err);
            // Revert state khi lỗi
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, role: oldRole } : u))
            );
            showToast(
                err?.response?.data?.message || err?.message || 'Không thể đổi vai trò người dùng. Vui lòng thử lại!',
                'error'
            );
        } finally {
            setUpdatingUserId(null);
        }
    };

    // 2. Cập nhật trạng thái (Khóa / Mở khóa): PUT /api/admin/users/{userId}/status
    const handleStatusToggle = async (userId: string, currentActive: boolean) => {
        const nextActive = !currentActive;
        const targetUser = users.find((u) => u.id === userId);

        // Optimistic UI update
        setUsers((prev) =>
            prev.map((u) =>
                u.id === userId
                    ? {
                          ...u,
                          active: nextActive,
                          status: nextActive ? 'ACTIVE' : 'BANNED',
                      }
                    : u
            )
        );
        setUpdatingUserId(userId);

        try {
            await adminUserService.updateUserStatus(userId, nextActive);
            showToast(
                `Đã ${nextActive ? 'kích hoạt mở khóa' : 'khóa tài khoản'} của "${targetUser?.username || userId}" thành công!`,
                'success'
            );
        } catch (err: any) {
            console.error('[AdminUsers] Lỗi khi đổi trạng thái người dùng:', err);
            // Revert state khi lỗi
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId
                        ? {
                              ...u,
                              active: currentActive,
                              status: currentActive ? 'ACTIVE' : 'BANNED',
                          }
                        : u
                )
            );
            showToast(
                err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái người dùng!',
                'error'
            );
        } finally {
            setUpdatingUserId(null);
        }
    };

    // Modal Create
    const handleOpenCreateModal = () => {
        setEditingUser(null);
        setFormData({
            fullName: '',
            username: '',
            email: '',
            password: '',
            role: 'USER',
            active: true,
        });
        setIsFormModalOpen(true);
    };

    // Modal Edit
    const handleOpenEditModal = (user: AdminUser) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            password: '',
            role: user.role,
            active: user.active,
        });
        setIsFormModalOpen(true);
    };

    // Submit form modal
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            // Update local state & trigger role/status update if changed
            if (formData.role !== editingUser.role) {
                await handleRoleChange(editingUser.id, formData.role);
            }
            if (formData.active !== editingUser.active) {
                await handleStatusToggle(editingUser.id, editingUser.active);
            }
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === editingUser.id
                        ? {
                              ...u,
                              fullName: formData.fullName,
                              username: formData.username,
                              email: formData.email,
                          }
                        : u
                )
            );
            showToast(`Đã cập nhật thông tin người dùng "${formData.username}".`, 'success');
        } else {
            // Thêm người dùng mới vào danh sách hiện tại
            const newUser: AdminUser = {
                id: `usr-${Date.now()}`,
                username: formData.username,
                fullName: formData.fullName,
                email: formData.email,
                avatarUrl: '',
                role: formData.role,
                active: formData.active,
                status: formData.active ? 'ACTIVE' : 'BANNED',
                totalExercisesSolved: 0,
                testsTaken: 0,
                createdAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
            };
            setUsers((prev) => [newUser, ...prev]);
            setPagination((p) => ({ ...p, total: p.total + 1 }));
            showToast(`Đã thêm thành viên "${formData.username}" thành công.`, 'success');
        }

        setIsFormModalOpen(false);
    };

    // Xóa người dùng
    const handleConfirmDelete = () => {
        if (!deleteTargetUser) return;
        setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id));
        setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        showToast(`Đã xóa tài khoản "${deleteTargetUser.username}".`, 'success');
        setDeleteTargetUser(null);
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setDebouncedSearch('');
        setRoleFilter('ALL');
        setStatusFilter('ALL');
        setCurrentPage(0);
    };

    // Helper counts cho 4 mini stats
    const totalUsersCount = pagination.total || users.length;
    const countStudents = users.filter((u) => u.role === 'USER' || (u.role as string) === 'STUDENT').length;
    const countInstructors = users.filter((u) => u.role === 'INSTRUCTOR').length;
    const countBanned = users.filter((u) => !u.active || u.status === 'BANNED').length;

    const hasActiveFilters = searchQuery !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

    return (
        <main className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-6 min-w-0 font-sans">
            {/* ================= 1. Top Action Bar ================= */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Quản lý Người dùng
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Quản lý danh sách thành viên, cập nhật vai trò phân quyền và kiểm soát trạng thái tài khoản.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Thêm thành viên mới</span>
                    </button>
                </div>
            </div>

            {/* ================= 2. 4 Mini Stat Badges ================= */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">Tổng người dùng</span>
                        <p className="text-xl font-black text-slate-900">{totalUsersCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">Học viên (User)</span>
                        <p className="text-xl font-black text-slate-900">{countStudents}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">Giảng viên</span>
                        <p className="text-xl font-black text-slate-900">{countInstructors}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">Đang bị khóa</span>
                        <p className="text-xl font-black text-rose-600">{countBanned}</p>
                    </div>
                </div>
            </div>

            {/* ================= 3. Filter & Search Toolbar ================= */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Search Input */}
                    <div className="md:col-span-6 relative">
                        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo Tên, Email hoặc Username..."
                            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Role Filter */}
                    <div className="md:col-span-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setCurrentPage(0);
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="ALL">Tất cả vai trò</option>
                            <option value="USER">USER (Học viên)</option>
                            <option value="INSTRUCTOR">INSTRUCTOR (Giảng viên)</option>
                            <option value="ADMIN">ADMIN (Quản trị viên)</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="md:col-span-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(0);
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                            <option value="BANNED">Đã bị khóa (BANNED)</option>
                        </select>
                    </div>
                </div>

                {/* Sub row info & Reset filter */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
                    <span>
                        Tổng số: <strong className="text-slate-800">{pagination.total}</strong> người dùng
                        {hasActiveFilters && ' (đang lọc)'}
                    </span>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer transition-colors"
                        >
                            ✕ Đặt lại bộ lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Error Alert nếu gọi API gặp sự cố */}
            {error && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
                    <span>⚠️ {error}</span>
                    <button
                        type="button"
                        onClick={fetchUsers}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* ================= 4. Main Users Table ================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                <th className="py-4 px-6">Thành Viên</th>
                                <th className="py-4 px-6">Email & Ngày Tham Gia</th>
                                <th className="py-4 px-6 text-center">Hoạt Động SQL</th>
                                <th className="py-4 px-6">Vai Trò (Role)</th>
                                <th className="py-4 px-6 text-center">Trạng Thái (Status)</th>
                                <th className="py-4 px-6 text-right">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {isLoading ? (
                                /* Skeletons */
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200" />
                                                <div className="space-y-1.5 w-32">
                                                    <div className="h-3.5 bg-slate-200 rounded" />
                                                    <div className="h-2.5 bg-slate-100 rounded w-20" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="h-3.5 bg-slate-200 rounded w-40 mb-1" />
                                            <div className="h-2.5 bg-slate-100 rounded w-24" />
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="h-5 bg-slate-100 rounded-md w-24 mx-auto" />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="h-6 bg-slate-200 rounded-full w-24" />
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="h-6 bg-slate-100 rounded w-16 ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        Không tìm thấy người dùng phù hợp với bộ lọc hiện tại.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const isUpdatingThisUser = updatingUserId === user.id;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Avatar & Name */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 truncate">
                                                            {user.fullName}
                                                        </p>
                                                        <p className="text-xs text-slate-400 truncate">
                                                            @{user.username}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email & Joined Date */}
                                            <td className="py-4 px-6">
                                                <p className="font-medium text-slate-800">{user.email}</p>
                                                <span className="text-xs text-slate-400">
                                                    Tham gia:{' '}
                                                    {user.createdAt
                                                        ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                                                        : 'Gần đây'}
                                                </span>
                                            </td>

                                            {/* Activity Stats */}
                                            <td className="py-4 px-6 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold" title="Bài tập đã giải">
                                                        {user.totalExercisesSolved ?? 0} bài
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold" title="Lượt thi thử">
                                                        {user.testsTaken ?? 0} đề thi
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Role Dropdown (Gắn hàm updateUserRole) */}
                                            <td className="py-4 px-6">
                                                <div className="relative inline-block">
                                                    <select
                                                        value={user.role === 'STUDENT' ? 'USER' : user.role}
                                                        disabled={isUpdatingThisUser}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        className={`text-xs font-bold px-3 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${
                                                            user.role === 'ADMIN'
                                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                : user.role === 'INSTRUCTOR'
                                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        } ${isUpdatingThisUser ? 'opacity-50 cursor-wait' : ''}`}
                                                    >
                                                        <option value="USER">USER (Học viên)</option>
                                                        <option value="INSTRUCTOR">INSTRUCTOR (Giảng viên)</option>
                                                        <option value="ADMIN">ADMIN (Quản trị viên)</option>
                                                    </select>
                                                </div>
                                            </td>

                                            {/* Status Switch (Gắn hàm updateUserStatus) */}
                                            <td className="py-4 px-6 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isUpdatingThisUser}
                                                        onClick={() => handleStatusToggle(user.id, user.active)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                            user.active ? 'bg-emerald-500' : 'bg-slate-300'
                                                        } ${isUpdatingThisUser ? 'opacity-60 cursor-wait' : ''}`}
                                                        title={user.active ? 'Bấm để Khóa tài khoản' : 'Bấm để Kích hoạt mở khóa'}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                                user.active ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                    <span className={`text-xs font-bold ${
                                                        user.active ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}>
                                                        {user.active ? 'Hoạt động' : 'Đã khóa'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    {/* Edit Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(user)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Chỉnh sửa thông tin"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTargetUser(user)}
                                                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Xóa người dùng"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ================= 5. Pagination Bar ================= */}
                <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>
                        Hiển thị{' '}
                        <span className="font-bold text-slate-800">
                            {users.length > 0 ? currentPage * pageSize + 1 : 0}
                        </span>{' '}
                        -{' '}
                        <span className="font-bold text-slate-800">
                            {Math.min(pagination.total, (currentPage + 1) * pageSize)}
                        </span>{' '}
                        trên tổng số{' '}
                        <span className="font-bold text-slate-800">{pagination.total}</span> người dùng
                    </p>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Trang trước
                        </button>

                        {Array.from({ length: pagination.totalPages }, (_, i) => i).map((pageIdx) => (
                            <button
                                key={pageIdx}
                                type="button"
                                onClick={() => setCurrentPage(pageIdx)}
                                className={`w-7 h-7 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                                    currentPage === pageIdx
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                {pageIdx + 1}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages - 1, p + 1))}
                            disabled={currentPage >= pagination.totalPages - 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Trang sau
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= 6. Create / Edit User Modal ================= */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
                    <form
                        onSubmit={handleFormSubmit}
                        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    {editingUser ? 'Chỉnh Sửa Người Dùng' : 'Thêm Thành Viên Mới'}
                                </h3>
                                <p className="text-xs text-slate-400">Thiết lập tài khoản và phân quyền hệ thống</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Họ và tên <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Username <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="user123"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Email <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="user@example.com"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white cursor-pointer"
                                    >
                                        <option value="USER">USER (Học viên)</option>
                                        <option value="INSTRUCTOR">INSTRUCTOR (Giảng viên)</option>
                                        <option value="ADMIN">ADMIN (Quản trị viên)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
                                    <select
                                        value={formData.active ? 'ACTIVE' : 'BANNED'}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'ACTIVE' })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white cursor-pointer"
                                    >
                                        <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                                        <option value="BANNED">Đã khóa (BANNED)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                            >
                                {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ================= 7. Delete Confirmation Dialog ================= */}
            {deleteTargetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div 
                        style={{ maxWidth: '440px' }}
                        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">
                            Xác Nhận Xóa Tài Khoản?
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            Bạn có chắc chắn muốn xóa tài khoản của thành viên <span className="font-bold text-slate-800">{deleteTargetUser.fullName}</span> (@{deleteTargetUser.username}) không? Thao tác này sẽ xóa vĩnh viễn và không thể khôi phục lại dữ liệu nộp bài.
                        </p>
                        <div 
                            style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}
                            className="flex items-center justify-end gap-3"
                        >
                            <button
                                type="button"
                                onClick={() => setDeleteTargetUser(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                style={{ backgroundColor: '#e11d48', color: '#ffffff' }}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 8. Toast Notification Container ================= */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold border ${
                            toastMessage.type === 'success'
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                                : toastMessage.type === 'error'
                                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
                                : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'
                        }`}
                    >
                        <span>{toastMessage.message}</span>
                        <button
                            type="button"
                            onClick={() => setToastMessage(null)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
