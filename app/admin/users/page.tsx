'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { mockUsers } from '../mockData';
import { AdminUser, UserRole, UserStatus } from '../types';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>(mockUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    // Modal state for Create / Edit
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'STUDENT' as UserRole,
        status: 'ACTIVE' as UserStatus,
    });

    // Modal state for Delete confirmation
    const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUser | null>(null);

    // ================= Filter Logic =================
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.username.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
            const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    // Pagination slice
    const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    // ================= CRUD Event Handlers =================

    // 1. PUT /api/admin/users/{id}/role
    const handleRoleChange = (userId: string, newRole: UserRole) => {
        console.log(`[API PUT]: /api/admin/users/${userId}/role`, { role: newRole });
        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
    };

    // 2. PUT /api/admin/users/{id}/status (Toggle Active / Banned)
    const handleStatusToggle = (userId: string, currentStatus: UserStatus) => {
        const newStatus: UserStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
        console.log(`[API PUT]: /api/admin/users/${userId}/status`, { status: newStatus });
        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
    };

    // Open Modal for Create
    const handleOpenCreateModal = () => {
        setEditingUser(null);
        setFormData({
            fullName: '',
            username: '',
            email: '',
            password: '',
            role: 'STUDENT',
            status: 'ACTIVE',
        });
        setIsFormModalOpen(true);
    };

    // Open Modal for Edit
    const handleOpenEditModal = (user: AdminUser) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            password: '',
            role: user.role,
            status: user.status,
        });
        setIsFormModalOpen(true);
    };

    // 3. POST /api/admin/users or PUT /api/admin/users/{id}
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            // Update
            console.log(`[API PUT]: /api/admin/users/${editingUser.id}`, formData);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === editingUser.id
                        ? {
                              ...u,
                              fullName: formData.fullName,
                              username: formData.username,
                              email: formData.email,
                              role: formData.role,
                              status: formData.status,
                          }
                        : u
                )
            );
        } else {
            // Create
            const newUser: AdminUser = {
                id: `usr-${Date.now()}`,
                username: formData.username,
                fullName: formData.fullName,
                email: formData.email,
                avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5s5gKn-GLKNAcWX9EFxyoYiTB5P4nSlHOI-1xfIgZeQsJ-r6VomssBqEWxVxf1x6An_7eTmstH3JQg7MKykFsZYIiXmy79nQtx5w5ttWLQIfnSMUTq90KVF2u89D6vK7mBb_dvZwHu_MhOck-Fkp_KdrFxPRZ_xmi6VeVbbXxjdepfIMNmsdpS4AyKZyt6weuqVVp_G3ciu6_0akcgzTF5K2MjVGgLmJYTT81_BgzxZc6cDDdmOla',
                role: formData.role,
                status: formData.status,
                totalExercisesSolved: 0,
                testsTaken: 0,
                createdAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
            };
            console.log('[API POST]: /api/admin/users', newUser);
            setUsers((prev) => [newUser, ...prev]);
        }

        setIsFormModalOpen(false);
    };

    // 4. DELETE /api/admin/users/{id}
    const handleConfirmDelete = () => {
        if (!deleteTargetUser) return;
        console.log(`[API DELETE]: /api/admin/users/${deleteTargetUser.id}`);
        setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id));
        setDeleteTargetUser(null);
    };

    // Helper counts
    const countStudents = users.filter((u) => u.role === 'STUDENT').length;
    const countInstructors = users.filter((u) => u.role === 'INSTRUCTOR').length;
    const countBanned = users.filter((u) => u.status === 'BANNED').length;

    return (
        <main className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 w-full max-w-[1600px] mx-auto space-y-8 min-w-0">
            {/* ================= 1. Top Bar: Title & Create Button ================= */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Quản Lý Người Dùng 👥
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Quản lý phân quyền, theo dõi hoạt động học tập và trạng thái tài khoản
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Thêm thành viên mới</span>
                    </button>
                </div>
            </div>

            {/* ================= 2. 4 Mini Stat Badges ================= */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-medium">Tổng người dùng</span>
                        <p className="text-xl font-black text-slate-900">{users.length}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-medium">Học viên</span>
                        <p className="text-xl font-black text-slate-900">{countStudents}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-medium">Giảng viên</span>
                        <p className="text-xl font-black text-slate-900">{countInstructors}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-medium">Đang bị khóa</span>
                        <p className="text-xl font-black text-rose-600">{countBanned}</p>
                    </div>
                </div>
            </div>

            {/* ================= 3. Filter & Search Toolbar ================= */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search input: Flex container không bị đè icon */}
                <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Tìm kiếm theo Tên, Email hoặc Username..."
                        className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Role Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Vai trò:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="ALL">Tất cả vai trò</option>
                            <option value="STUDENT">Học viên (STUDENT)</option>
                            <option value="INSTRUCTOR">Giảng viên (INSTRUCTOR)</option>
                            <option value="ADMIN">Quản trị viên (ADMIN)</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Trạng thái:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                            <option value="BANNED">Đã khóa (BANNED)</option>
                            <option value="PENDING">Chờ duyệt (PENDING)</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setRoleFilter('ALL');
                                setStatusFilter('ALL');
                                setCurrentPage(1);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-bold px-2 py-1 cursor-pointer"
                        >
                            Đặt lại
                        </button>
                    )}
                </div>
            </div>

            {/* ================= 4. Main Users Table ================= */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        Không tìm thấy người dùng phù hợp với bộ lọc hiện tại.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                                        {/* Avatar & Name */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                                                    {user.fullName.charAt(0)}
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
                                                Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </td>

                                        {/* Activity Stats */}
                                        <td className="py-4 px-6 text-center">
                                            <div className="inline-flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold" title="Bài tập đã giải">
                                                    {user.totalExercisesSolved} bài
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold" title="Lượt thi thử">
                                                    {user.testsTaken} đề thi
                                                </span>
                                            </div>
                                        </td>

                                        {/* Role Dropdown */}
                                        <td className="py-4 px-6">
                                            <div className="relative inline-block">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-hidden transition-all ${
                                                        user.role === 'ADMIN'
                                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                            : user.role === 'INSTRUCTOR'
                                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    }`}
                                                >
                                                    <option value="STUDENT">STUDENT</option>
                                                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            </div>
                                        </td>

                                        {/* Status Switch */}
                                        <td className="py-4 px-6 text-center">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusToggle(user.id, user.status)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                                        user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'
                                                    }`}
                                                    title={user.status === 'ACTIVE' ? 'Bấm để Khóa tài khoản' : 'Bấm để Kích hoạt tài khoản'}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                            user.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                                <span className={`text-xs font-bold ${
                                                    user.status === 'ACTIVE'
                                                        ? 'text-emerald-600'
                                                        : user.status === 'BANNED'
                                                        ? 'text-rose-600'
                                                        : 'text-amber-600'
                                                }`}>
                                                    {user.status === 'ACTIVE' ? 'Hoạt động' : user.status === 'BANNED' ? 'Đã khóa' : 'Chờ duyệt'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                {/* Edit Button */}
                                                <button
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ================= 5. Pagination Bar ================= */}
                <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>
                        Hiển thị <span className="font-bold text-slate-800">{Math.min(filteredUsers.length, (currentPage - 1) * pageSize + 1)}</span> - <span className="font-bold text-slate-800">{Math.min(filteredUsers.length, currentPage * pageSize)}</span> trên tổng số <span className="font-bold text-slate-800">{filteredUsers.length}</span> người dùng
                    </p>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Trang trước
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 rounded-lg font-bold transition-colors cursor-pointer ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
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
                        {/* Fixed Header */}
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
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
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                    >
                                        <option value="STUDENT">STUDENT (Học viên)</option>
                                        <option value="INSTRUCTOR">INSTRUCTOR (Giảng viên)</option>
                                        <option value="ADMIN">ADMIN (Quản trị viên)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                                    >
                                        <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                                        <option value="BANNED">Đã khóa (BANNED)</option>
                                        <option value="PENDING">Chờ duyệt (PENDING)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer */}
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
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
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
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTargetUser(null)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                            >
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
