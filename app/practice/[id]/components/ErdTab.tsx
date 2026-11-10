'use client';

import { useState, useMemo } from 'react';
import { DatabaseDetail, TableSchema, DATABASES_DETAIL } from '../data';

interface ErdTabProps {
    dbData?: DatabaseDetail | any;
    schemaData?: any;
    compact?: boolean;
    diagramOnly?: boolean; // Cờ chỉ render sơ đồ, ẩn sidebar thông tin
}

interface TablePosition {
    top: number;
    left: number;
    width?: number;
    colorScheme: {
        border: string;
        headerBg: string;
        headerBorder: string;
    };
}

const TABLE_LAYOUTS: Record<string, Record<string, TablePosition>> = {
    ecommerce: {
        categories: {
            top: 15,
            left: 15,
            width: 215,
            colorScheme: { border: 'border-emerald-400', headerBg: 'bg-[#e8f8ee]', headerBorder: 'border-emerald-300' },
        },
        products: {
            top: 15,
            left: 255,
            width: 220,
            colorScheme: { border: 'border-blue-400', headerBg: 'bg-[#e8f1fd]', headerBorder: 'border-blue-300' },
        },
        order_details: {
            top: 15,
            left: 500,
            width: 220,
            colorScheme: { border: 'border-amber-400', headerBg: 'bg-[#fef7e7]', headerBorder: 'border-amber-300' },
        },
        customers: {
            top: 270,
            left: 40,
            width: 220,
            colorScheme: { border: 'border-rose-300', headerBg: 'bg-[#feeef1]', headerBorder: 'border-rose-200' },
        },
        orders: {
            top: 270,
            left: 475,
            width: 220,
            colorScheme: { border: 'border-purple-300', headerBg: 'bg-[#f5eefc]', headerBorder: 'border-purple-200' },
        },
    },
    university: {
        departments: {
            top: 15,
            left: 15,
            width: 215,
            colorScheme: { border: 'border-teal-400', headerBg: 'bg-[#e6fffa]', headerBorder: 'border-teal-300' },
        },
        instructors: {
            top: 270,
            left: 15,
            width: 215,
            colorScheme: { border: 'border-indigo-300', headerBg: 'bg-[#eef2ff]', headerBorder: 'border-indigo-200' },
        },
        students: {
            top: 15,
            left: 255,
            width: 220,
            colorScheme: { border: 'border-emerald-400', headerBg: 'bg-[#e8f8ee]', headerBorder: 'border-emerald-300' },
        },
        courses: {
            top: 15,
            left: 500,
            width: 220,
            colorScheme: { border: 'border-blue-400', headerBg: 'bg-[#e8f1fd]', headerBorder: 'border-blue-300' },
        },
        enrollments: {
            top: 270,
            left: 375,
            width: 230,
            colorScheme: { border: 'border-purple-300', headerBg: 'bg-[#f5eefc]', headerBorder: 'border-purple-200' },
        },
    },
    hospital: {
        patients: {
            top: 15,
            left: 15,
            width: 215,
            colorScheme: { border: 'border-rose-300', headerBg: 'bg-[#feeef1]', headerBorder: 'border-rose-200' },
        },
        doctors: {
            top: 15,
            left: 255,
            width: 215,
            colorScheme: { border: 'border-blue-400', headerBg: 'bg-[#e8f1fd]', headerBorder: 'border-blue-300' },
        },
        appointments: {
            top: 15,
            left: 495,
            width: 220,
            colorScheme: { border: 'border-purple-300', headerBg: 'bg-[#f5eefc]', headerBorder: 'border-purple-200' },
        },
        medical_records: {
            top: 270,
            left: 135,
            width: 230,
            colorScheme: { border: 'border-teal-400', headerBg: 'bg-[#e6fffa]', headerBorder: 'border-teal-300' },
        },
        prescriptions: {
            top: 270,
            left: 435,
            width: 220,
            colorScheme: { border: 'border-amber-400', headerBg: 'bg-[#fef7e7]', headerBorder: 'border-amber-300' },
        },
    },
};

const COLOR_SCHEMES = [
    { border: 'border-emerald-400', headerBg: 'bg-[#e8f8ee]', headerBorder: 'border-emerald-300' },
    { border: 'border-blue-400', headerBg: 'bg-[#e8f1fd]', headerBorder: 'border-blue-300' },
    { border: 'border-amber-400', headerBg: 'bg-[#fef7e7]', headerBorder: 'border-amber-300' },
    { border: 'border-rose-300', headerBg: 'bg-[#feeef1]', headerBorder: 'border-rose-200' },
    { border: 'border-purple-300', headerBg: 'bg-[#f5eefc]', headerBorder: 'border-purple-200' },
];

export default function ErdTab({ dbData, schemaData, compact = false, diagramOnly = false }: ErdTabProps) {
    const [zoomLevel, setZoomLevel] = useState<number>(100);

    const currentDb = dbData || DATABASES_DETAIL.ecommerce;
    const tablesList = (schemaData && schemaData.tables && schemaData.tables.length > 0)
        ? schemaData.tables
        : currentDb.tables && currentDb.tables.length > 0
        ? currentDb.tables
        : DATABASES_DETAIL.ecommerce.tables;

    const totalTables = tablesList.length;
    const totalRelations =
        schemaData?.relationships?.length ||
        schemaData?.relations?.length ||
        currentDb.relationsCount ||
        (currentDb.relationships ? currentDb.relationships.length : 4);
    const totalAttributes =
        tablesList.reduce((acc: number, t: any) => acc + (t.columns?.length || t.columnsCount || 0), 0) ||
        currentDb.attributesCount ||
        25;
    const totalForeignKeys = tablesList.reduce(
        (acc: number, t: any) => acc + (t.columns ? t.columns.filter((c: any) => c.isFk).length : 0),
        0
    );

    const isPresetDb = Boolean(currentDb?.id && TABLE_LAYOUTS[currentDb.id]);
    const dbLayout = isPresetDb ? TABLE_LAYOUTS[currentDb.id] : null;

    const getTableLayout = (table: TableSchema, index: number): TablePosition => {
        if (dbLayout && dbLayout[table.name]) {
            return dbLayout[table.name];
        }
        // Tự động phân bổ lưới: nếu <= 4 bảng thì chia 2 cột, nếu nhiều hơn thì chia 3 cột
        const numCols = tablesList.length <= 4 ? 2 : 3;
        const col = index % numCols;
        const row = Math.floor(index / numCols);
        const colSpacing = numCols === 2 ? 340 : 255;
        const rowSpacing = 260;

        return {
            top: 20 + row * rowSpacing,
            left: 20 + col * colSpacing,
            width: 220,
            colorScheme: COLOR_SCHEMES[index % COLOR_SCHEMES.length],
        };
    };

    const canvasBounds = useMemo(() => {
        let maxRight = 735;
        let maxBottom = 480;

        tablesList.forEach((t: any, idx: number) => {
            const pos = getTableLayout(t, idx);
            const w = pos.width || 220;
            const h = 40 + (t.columns?.length || 4) * 26 + 10;
            if (pos.left + w > maxRight) maxRight = pos.left + w + 30;
            if (pos.top + h > maxBottom) maxBottom = pos.top + h + 30;
        });

        return { width: Math.max(735, maxRight), height: Math.max(480, maxBottom) };
    }, [tablesList, dbLayout]);

    // Trích xuất toàn bộ quan hệ (từ schemaData hoặc suy đoán từ cột có isFk)
    interface ParsedRelation {
        fromTable: string; // Bảng chứa khóa ngoại FK
        fromCol: string;
        toTable: string;   // Bảng chứa khóa chính PK
        toCol: string;
    }

    const resolvedRelationships: ParsedRelation[] = useMemo(() => {
        const rawRels =
            schemaData?.relationships ||
            schemaData?.relations ||
            currentDb?.relationships ||
            [];

        const result: ParsedRelation[] = [];
        const seen = new Set<string>();

        const addRelation = (fromT: string, fromC: string, toT: string, toC: string) => {
            if (!fromT || !toT) return;
            const key = `${fromT}->${toT}`;
            if (!seen.has(key)) {
                seen.add(key);
                result.push({ fromTable: fromT, fromCol: fromC, toTable: toT, toCol: toC || 'id' });
            }
        };

        if (Array.isArray(rawRels)) {
            for (const r of rawRels) {
                if (typeof r === 'string') {
                    const m = r.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*->\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
                    if (m) {
                        addRelation(m[1], m[2], m[3], m[4]);
                    }
                } else if (r && typeof r === 'object') {
                    if (r.relation && typeof r.relation === 'string') {
                        const m = r.relation.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*->\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/);
                        if (m) {
                            addRelation(m[1], m[2], m[3], m[4]);
                        }
                    }
                    if (r.fromTable && r.toTable) {
                        addRelation(r.fromTable, r.fromColumn || '', r.toTable, r.toColumn || 'id');
                    }
                }
            }
        }

        // Bổ sung tự động suy đoán từ cột có isFk hoặc đuôi _id
        for (const t of tablesList) {
            const cols = t.columns || [];
            for (const c of cols) {
                if (c.isFk || (c.name.endsWith('_id') && c.name !== 'id')) {
                    const stem = c.name.replace(/_id$/, '');
                    const targetTable = tablesList.find(
                        (other: any) =>
                            other.name !== t.name &&
                            (other.name.toLowerCase() === stem.toLowerCase() ||
                             other.name.toLowerCase() === `${stem.toLowerCase()}s` ||
                             other.name.toLowerCase() === `${stem.toLowerCase()}es` ||
                             other.name.toLowerCase() === stem.toLowerCase().replace(/y$/, 'ies'))
                    );

                    if (targetTable) {
                        addRelation(t.name, c.name, targetTable.name, 'id');
                    }
                }
            }
        }

        return result;
    }, [schemaData, currentDb, tablesList]);

    return (
        <div className={`flex ${diagramOnly ? 'w-full' : compact ? 'flex-col' : 'flex-col lg:flex-row'} items-start gap-6 pb-2 w-full`}>
            {/* Sidebar thông tin (Chỉ render khi diagramOnly === false) */}
            {!diagramOnly && (
                <div className={`${compact ? 'w-full flex flex-col' : 'w-72 shrink-0 flex flex-col'} gap-4`}>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2 text-sm">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                                🗄️
                            </div>
                            <span>Thông tin sơ đồ</span>
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            Sơ đồ ERD mô tả cấu trúc và mối quan hệ giữa các bảng trong cơ sở dữ liệu {currentDb.name}.
                        </p>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="border border-slate-100 bg-slate-50/70 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-blue-600 mb-1 text-sm font-bold">🗂️</span>
                                <div className="font-black text-slate-800 text-base">{totalTables}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">Bảng</div>
                            </div>
                            <div className="border border-slate-100 bg-slate-50/70 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-purple-600 mb-1 text-sm font-bold">🔗</span>
                                <div className="font-black text-slate-800 text-base">{totalRelations}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">Quan hệ</div>
                            </div>
                            <div className="border border-slate-100 bg-slate-50/70 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-amber-500 mb-1 text-sm font-bold">🔑</span>
                                <div className="font-black text-slate-800 text-base">{totalAttributes}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">Thuộc tính</div>
                            </div>
                            <div className="border border-slate-100 bg-slate-50/70 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                                <span className="text-emerald-500 mb-1 text-sm font-bold">🔗</span>
                                <div className="font-black text-slate-800 text-base">{totalForeignKeys}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">Khóa ngoại</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm">Chú thích</h3>
                        <div className="space-y-3 text-xs">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 min-w-[42px]">
                                    <span className="text-amber-500 text-xs">🔑</span>
                                    <span className="text-[10px] font-bold text-slate-700">PK</span>
                                </div>
                                <span className="text-slate-600 font-medium">Khóa chính (Primary Key)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 min-w-[42px]">
                                    <span className="text-blue-500 text-xs">🔗</span>
                                    <span className="text-[10px] font-bold text-slate-700">FK</span>
                                </div>
                                <span className="text-slate-600 font-medium">Khóa ngoại (Foreign Key)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="min-w-[42px] flex items-center justify-center">
                                    <div className="w-8 h-px bg-slate-400"></div>
                                </div>
                                <span className="text-slate-600 font-medium">Quan hệ 1 - N</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vùng Canvas ERD */}
            <div
                style={{ height: compact || diagramOnly ? 480 : 520, minHeight: compact || diagramOnly ? 480 : 520 }}
                className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col shrink-0"
            >
                {/* Thanh công cụ Zoom */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-xs">
                    <button
                        type="button"
                        onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 140))}
                        className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg text-slate-700 flex items-center justify-center shadow-xs cursor-pointer text-sm font-bold"
                        title="Phóng to"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 50))}
                        className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg text-slate-700 flex items-center justify-center shadow-xs cursor-pointer text-sm font-bold"
                        title="Thu nhỏ"
                    >
                        -
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoomLevel(100)}
                        className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Mặc định 100%"
                    >
                        {zoomLevel}%
                    </button>
                </div>

                {/* Khung vẽ Canvas căn giữa */}
                <div
                    className="w-full h-full relative overflow-auto p-4 flex items-center justify-center"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)',
                        backgroundSize: '22px 22px',
                        backgroundColor: '#fafcff',
                    }}
                >
                    <div
                        style={{
                            width: canvasBounds.width,
                            height: canvasBounds.height,
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: 'center center',
                        }}
                        className="relative shrink-0 transition-transform duration-200 my-auto"
                    >
                        {/* ================= SVG DÂY NỐI ================= */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" overflow="visible">
                            {currentDb.id === 'ecommerce' && (
                                <>
                                    <g>
                                        <path d="M 230 75 L 255 75" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="233" y="67" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="245" y="67" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                        <line x1="248" y1="69" x2="255" y2="75" stroke="#64748b" strokeWidth="1.5" />
                                        <line x1="248" y1="81" x2="255" y2="75" stroke="#64748b" strokeWidth="1.5" />
                                        <circle cx="245" cy="75" r="2.5" fill="white" stroke="#64748b" strokeWidth="1.5" />
                                    </g>
                                    <g>
                                        <path d="M 475 75 L 500 75" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="478" y="67" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="490" y="67" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                        <line x1="493" y1="69" x2="500" y2="75" stroke="#64748b" strokeWidth="1.5" />
                                        <line x1="493" y1="81" x2="500" y2="75" stroke="#64748b" strokeWidth="1.5" />
                                        <circle cx="490" cy="75" r="2.5" fill="white" stroke="#64748b" strokeWidth="1.5" />
                                    </g>
                                    <g>
                                        <path d="M 260 340 L 475 340" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="270" y="332" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="458" y="332" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                        <line x1="468" y1="334" x2="475" y2="340" stroke="#64748b" strokeWidth="1.5" />
                                        <line x1="468" y1="346" x2="475" y2="340" stroke="#64748b" strokeWidth="1.5" />
                                        <circle cx="464" cy="340" r="2.5" fill="white" stroke="#64748b" strokeWidth="1.5" />
                                    </g>
                                    <g>
                                        <path d="M 585 270 L 585 190" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="593" y="260" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="593" y="205" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                        <line x1="579" y1="198" x2="585" y2="190" stroke="#64748b" strokeWidth="1.5" />
                                        <line x1="591" y1="198" x2="585" y2="190" stroke="#64748b" strokeWidth="1.5" />
                                        <circle cx="585" cy="202" r="2.5" fill="white" stroke="#64748b" strokeWidth="1.5" />
                                    </g>
                                </>
                            )}

                            {/* UNIVERSITY */}
                            {currentDb.id === 'university' && (
                                <>
                                    <g>
                                        <path d="M 230 75 L 255 75" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="234" y="67" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="246" y="67" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                    </g>
                                    <g>
                                        <path d="M 120 160 L 120 270" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="126" y="180" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="126" y="260" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                    </g>
                                    <g>
                                        <path d="M 475 75 L 500 75" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="480" y="67" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="492" y="67" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                    </g>
                                    <g>
                                        <path d="M 365 210 L 420 270" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="370" y="225" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="410" y="260" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                    </g>
                                </>
                            )}

                            {/* HOSPITAL */}
                            {currentDb.id === 'hospital' && (
                                <>
                                    <g>
                                        <path d="M 230 75 L 255 75" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="235" y="67" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="246" y="67" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                    </g>
                                    <g>
                                        <path d="M 470 75 L 495 75" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="475" y="67" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="486" y="67" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                    </g>
                                    <g>
                                        <path d="M 120 200 L 200 270" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="130" y="215" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="190" y="260" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                    </g>
                                    <g>
                                        <path d="M 365 340 L 435 340" fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x="375" y="332" fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                        <text x="420" y="332" fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                    </g>
                                </>
                            )}

                            {/* CSDL TÙY BIẾN HOẶC TỰ ĐỘNG VẼ DÂY LIÊN KẾT */}
                            {!isPresetDb &&
                                resolvedRelationships.map((rel, rIdx) => {
                                    const idxFrom = tablesList.findIndex((t: any) => t.name === rel.fromTable);
                                    const idxTo = tablesList.findIndex((t: any) => t.name === rel.toTable);
                                    if (idxFrom === -1 || idxTo === -1) return null;

                                    const tableFK = tablesList[idxFrom];
                                    const tablePK = tablesList[idxTo];
                                    const posFK = getTableLayout(tableFK, idxFrom);
                                    const posPK = getTableLayout(tablePK, idxTo);

                                    const wFK = posFK.width || 220;
                                    const hFK = 40 + (tableFK.columns?.length || 4) * 26;
                                    const wPK = posPK.width || 220;
                                    const hPK = 40 + (tablePK.columns?.length || 4) * 26;

                                    const cxFK = posFK.left + wFK / 2;
                                    const cyFK = posFK.top + hFK / 2;
                                    const cxPK = posPK.left + wPK / 2;
                                    const cyPK = posPK.top + hPK / 2;

                                    const dx = cxFK - cxPK;
                                    const dy = cyFK - cyPK;

                                    const fkColIdx = tableFK.columns?.findIndex((c: any) => c.name === rel.fromCol || c.isFk) ?? -1;
                                    const fkOffset = fkColIdx >= 0 ? 38 + fkColIdx * 26 + 13 : 38 + 13;
                                    const pkOffset = 38 + 13;

                                    let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
                                    let label1X = 0, label1Y = 0;
                                    let labelNX = 0, labelNY = 0;
                                    let fork1 = { x1: 0, y1: 0, x2: 0, y2: 0 };
                                    let fork2 = { x1: 0, y1: 0, x2: 0, y2: 0 };
                                    let dot = { cx: 0, cy: 0 };
                                    let pathD = '';

                                    if (Math.abs(dx) >= Math.abs(dy)) {
                                        if (dx > 0) {
                                            x1 = posPK.left + wPK;
                                            y1 = posPK.top + pkOffset;
                                            x2 = posFK.left;
                                            y2 = posFK.top + fkOffset;
                                            const midX = (x1 + x2) / 2;
                                            pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                                            label1X = x1 + 6;
                                            label1Y = y1 - 5;
                                            labelNX = x2 - 14;
                                            labelNY = y2 - 5;

                                            fork1 = { x1: x2 - 7, y1: y2 - 6, x2: x2, y2: y2 };
                                            fork2 = { x1: x2 - 7, y1: y2 + 6, x2: x2, y2: y2 };
                                            dot = { cx: x1 + 3, cy: y1 };
                                        } else {
                                            x1 = posPK.left;
                                            y1 = posPK.top + pkOffset;
                                            x2 = posFK.left + wFK;
                                            y2 = posFK.top + fkOffset;
                                            const midX = (x1 + x2) / 2;
                                            pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                                            label1X = x1 - 14;
                                            label1Y = y1 - 5;
                                            labelNX = x2 + 6;
                                            labelNY = y2 - 5;

                                            fork1 = { x1: x2 + 7, y1: y2 - 6, x2: x2, y2: y2 };
                                            fork2 = { x1: x2 + 7, y1: y2 + 6, x2: x2, y2: y2 };
                                            dot = { cx: x1 - 3, cy: y1 };
                                        }
                                    } else {
                                        if (dy > 0) {
                                            x1 = posPK.left + wPK / 2;
                                            y1 = posPK.top + hPK;
                                            x2 = posFK.left + wFK / 2;
                                            y2 = posFK.top;
                                            const midY = (y1 + y2) / 2;
                                            pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                                            label1X = x1 + 6;
                                            label1Y = y1 + 13;
                                            labelNX = x2 + 6;
                                            labelNY = y2 - 6;

                                            fork1 = { x1: x2 - 6, y1: y2 - 7, x2: x2, y2: y2 };
                                            fork2 = { x1: x2 + 6, y1: y2 - 7, x2: x2, y2: y2 };
                                            dot = { cx: x1, cy: y1 + 3 };
                                        } else {
                                            x1 = posPK.left + wPK / 2;
                                            y1 = posPK.top;
                                            x2 = posFK.left + wFK / 2;
                                            y2 = posFK.top + hFK;
                                            const midY = (y1 + y2) / 2;
                                            pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                                            label1X = x1 + 6;
                                            label1Y = y1 - 6;
                                            labelNX = x2 + 6;
                                            labelNY = y2 + 13;

                                            fork1 = { x1: x2 - 6, y1: y2 + 7, x2: x2, y2: y2 };
                                            fork2 = { x1: x2 + 6, y1: y2 + 7, x2: x2, y2: y2 };
                                            dot = { cx: x1, cy: y1 - 3 };
                                        }
                                    }

                                    return (
                                        <g key={`dynamic-rel-${rel.fromTable}-${rel.toTable}-${rIdx}`}>
                                            <path d={pathD} fill="none" stroke="#64748b" strokeWidth="1.5" />
                                            <text x={label1X} y={label1Y} fill="#475569" fontSize="10" fontWeight="bold">1</text>
                                            <text x={labelNX} y={labelNY} fill="#475569" fontSize="10" fontWeight="bold">N</text>
                                            <line x1={fork1.x1} y1={fork1.y1} x2={fork1.x2} y2={fork1.y2} stroke="#64748b" strokeWidth="1.5" />
                                            <line x1={fork2.x1} y1={fork2.y1} x2={fork2.x2} y2={fork2.y2} stroke="#64748b" strokeWidth="1.5" />
                                            <circle cx={dot.cx} cy={dot.cy} r="2.5" fill="white" stroke="#64748b" strokeWidth="1.5" />
                                        </g>
                                    );
                                })}
                        </svg>

                        {/* ================= THẺ BẢNG ================= */}
                        {tablesList.map((table: any, idx: number) => {
                            const pos = getTableLayout(table, idx);
                            return (
                                <div
                                    key={table.name}
                                    className={`absolute bg-white rounded-xl border ${pos.colorScheme.border} shadow-md overflow-hidden z-10 hover:shadow-lg transition-all`}
                                    style={{
                                        top: `${pos.top}px`,
                                        left: `${pos.left}px`,
                                        width: `${pos.width || 215}px`,
                                    }}
                                >
                                    <div
                                        className={`${pos.colorScheme.headerBg} px-3 py-1.5 border-b ${pos.colorScheme.headerBorder} font-bold text-slate-800 text-xs flex justify-between items-center`}
                                    >
                                        <span>{table.name}</span>
                                        {table.vietnameseName && (
                                            <span className="text-[10px] font-semibold text-slate-400">
                                                {table.vietnameseName}
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-2 space-y-1 text-xs bg-white font-sans">
                                        {table.columns.map((col: any) => (
                                            <div
                                                key={col.name}
                                                className={`flex justify-between items-center py-0.5 px-1 rounded ${
                                                    col.isPk
                                                        ? 'bg-amber-50/70 font-semibold text-slate-800'
                                                        : col.isFk
                                                            ? 'bg-blue-50/70 font-semibold text-blue-700'
                                                            : 'text-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5 truncate mr-1">
                                                    {col.isPk ? (
                                                        <span className="text-amber-500 text-xs shrink-0">🔑</span>
                                                    ) : col.isFk ? (
                                                        <span className="text-blue-500 text-xs shrink-0">🔗</span>
                                                    ) : (
                                                        <span className="w-3.5 inline-block shrink-0"></span>
                                                    )}
                                                    <span className="truncate">{col.name}</span>
                                                </div>
                                                <div
                                                    className={`text-[9px] font-semibold shrink-0 ${
                                                        col.isPk
                                                            ? 'text-slate-400'
                                                            : col.isFk
                                                                ? 'text-blue-600'
                                                                : 'text-slate-400'
                                                    }`}
                                                >
                                                    {col.type} {col.isPk ? 'PK' : col.isFk ? 'FK' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}