'use client';

import { useState } from 'react';
import { DatabaseDetail } from '../data';
import { PracticeDatabaseDetail } from '@/types/practice';

interface OverviewTabProps {
    dbData: DatabaseDetail | PracticeDatabaseDetail;
    schemaData?: any;
    compact?: boolean;
}

export default function OverviewTab({ dbData, schemaData, compact = false }: OverviewTabProps) {
    const tablesList =
        (schemaData && schemaData.tables && schemaData.tables.length > 0)
            ? schemaData.tables
            : dbData.tables || [];
    const relationshipsList =
        (schemaData && (schemaData.relationships || schemaData.relations))
            ? (schemaData.relationships || schemaData.relations)
            : dbData.relationships || [];

    const defaultExpanded = tablesList[0]?.name || 'products';
    const [expandedTable, setExpandedTable] = useState<string | null>(defaultExpanded);

    const tablesCount = tablesList.length || dbData.tablesCount || 0;
    const attributesCount =
        tablesList.reduce((acc: number, t: any) => acc + (t.columns?.length || t.columnsCount || 0), 0) ||
        dbData.attributesCount ||
        0;
    const relationsCount = relationshipsList.length || dbData.relationsCount || 0;

    return (
        <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-12'} gap-6 pb-6`}>
            {/* Left Column: Metrics & Table Schema */}
            <div className={`${compact ? '' : 'lg:col-span-7'} space-y-6`}>
                {/* Metrics Box */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                    <h2 className="text-base font-black text-slate-900">Tổng quan cơ sở dữ liệu</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {dbData.overviewText || (dbData as any).description || 'Thông tin cấu trúc cơ sở dữ liệu mẫu cho bài tập thực hành.'}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                TB
                            </div>
                            <div>
                                <div className="text-base font-black text-slate-900">{tablesCount}</div>
                                <div className="text-[11px] text-slate-500 font-medium">Bảng</div>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                                CL
                            </div>
                            <div>
                                <div className="text-base font-black text-slate-900">{attributesCount}</div>
                                <div className="text-[11px] text-slate-500 font-medium">Thuộc tính</div>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                                FK
                            </div>
                            <div>
                                <div className="text-base font-black text-slate-900">{relationsCount}</div>
                                <div className="text-[11px] text-slate-500 font-medium">Liên kết</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Schema Accordions */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <h2 className="text-base font-black text-slate-900">Định nghĩa các bảng</h2>
                    <div className="space-y-3">
                        {tablesList.map((t: any) => {
                            const isExpanded = expandedTable === t.name;
                            const columns = t.columns || [];
                            return (
                                <div key={t.name} className="border border-slate-200 rounded-xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedTable(isExpanded ? null : t.name)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                                            {t.name} {t.vietnameseName ? `(${t.vietnameseName})` : ''}
                                        </span>
                                        <svg
                                            className={`w-4 h-4 text-slate-400 transition-transform ${
                                                isExpanded ? 'rotate-180' : ''
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                    {isExpanded && (
                                        <div className="p-4 bg-white border-t border-slate-200 overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                                        <th className="pb-2">Thuộc tính</th>
                                                        <th className="pb-2">Kiểu</th>
                                                        <th className="pb-2">Mô tả</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 font-medium">
                                                    {columns.map((col: any) => (
                                                        <tr key={col.name}>
                                                            <td className="py-2 font-mono text-slate-900 font-bold flex items-center gap-1.5">
                                                                <span>{col.name}</span>
                                                                {col.isPk && (
                                                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px]">
                                                                        PK
                                                                    </span>
                                                                )}
                                                                {col.isFk && (
                                                                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px]">
                                                                        FK
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2 font-mono text-slate-500">{col.type}</td>
                                                            <td className="py-2 text-slate-600">{col.description || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Column: Relationships & Descriptions */}
            <div className={`${compact ? '' : 'lg:col-span-5'} space-y-6`}>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <h2 className="text-base font-black text-slate-900">Mô tả các bảng chính</h2>
                    <div className="space-y-3">
                        {tablesList.map((t: any) => (
                            <div
                                key={t.name}
                                className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-blue-600">{t.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {t.columnsCount || t.columns?.length || 0} thuộc tính
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{t.description || '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <h2 className="text-base font-black text-slate-900">Mối quan hệ giữa các bảng</h2>
                    <div className="space-y-3">
                        {relationshipsList.map((rel: any, idx: number) => (
                            <div
                                key={idx}
                                className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1"
                            >
                                <div className="font-mono text-xs font-bold text-purple-700">
                                    {rel.relation || `${rel.fromTable} ↔ ${rel.toTable}`}
                                </div>
                                <p className="text-xs text-slate-500">{rel.description}</p>
                            </div>
                        ))}
                        {relationshipsList.length === 0 && (
                            <p className="text-xs text-slate-400">Chưa có thông tin mối quan hệ bảng.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
