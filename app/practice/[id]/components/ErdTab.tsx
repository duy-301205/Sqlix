'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { DatabaseDetail, TableSchema, DATABASES_DETAIL } from '../data';
import { Crosshair, Move } from 'lucide-react';
import { resolveErdRelationships } from './erdRelationships';
import { layoutErd, routeErd } from './erdLayout';

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

const COLOR_SCHEMES = [
    { border: 'border-emerald-400', headerBg: 'bg-[#e8f8ee]', headerBorder: 'border-emerald-300' },
    { border: 'border-blue-400', headerBg: 'bg-[#e8f1fd]', headerBorder: 'border-blue-300' },
    { border: 'border-amber-400', headerBg: 'bg-[#fef7e7]', headerBorder: 'border-amber-300' },
    { border: 'border-rose-300', headerBg: 'bg-[#feeef1]', headerBorder: 'border-rose-200' },
    { border: 'border-purple-300', headerBg: 'bg-[#f5eefc]', headerBorder: 'border-purple-200' },
];

export default function ErdTab({ dbData, schemaData, compact = false, diagramOnly = false }: ErdTabProps) {
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [focusedTable, setFocusedTable] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const panStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
        startX: 0,
        startY: 0,
        initialPanX: 0,
        initialPanY: 0,
    });
    const hasAutoCenteredRef = useRef(false);

    const currentDb = dbData || DATABASES_DETAIL.ecommerce;
    const tablesList = (schemaData && schemaData.tables && schemaData.tables.length > 0)
        ? schemaData.tables
        : currentDb.tables && currentDb.tables.length > 0
        ? currentDb.tables
        : DATABASES_DETAIL.ecommerce.tables;

    const totalTables = tablesList.length;
    const resolvedRelationships = useMemo(() => resolveErdRelationships(tablesList,
        schemaData?.relationships ?? schemaData?.relations ?? currentDb?.relationships ?? []), [schemaData, currentDb, tablesList]);
    const totalRelations = resolvedRelationships.length;
    const totalAttributes =
        tablesList.reduce((acc: number, t: any) => acc + (t.columns?.length || t.columnsCount || 0), 0) ||
        currentDb.attributesCount ||
        25;
    const totalForeignKeys = tablesList.reduce(
        (acc: number, t: any) => acc + (t.columns ? t.columns.filter((c: any) => c.isFk || c.references).length : 0),
        0
    );

    const positions = useMemo(() => layoutErd(tablesList, resolvedRelationships), [tablesList, resolvedRelationships]);
    const routes = useMemo(() => routeErd(tablesList, positions, resolvedRelationships), [tablesList, positions, resolvedRelationships]);
    const getTableLayout = (table: TableSchema, index: number): TablePosition => ({
        ...positions[table.name], colorScheme: COLOR_SCHEMES[index % COLOR_SCHEMES.length],
    });

    // Tính toán giới hạn tọa độ của sơ đồ (Bounding Box)
    const diagramBounds = useMemo(() => {
        if (!tablesList || tablesList.length === 0) {
            return { minX: 0, minY: 0, maxX: 735, maxY: 480, width: 735, height: 480, centerX: 367.5, centerY: 240 };
        }
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        tablesList.forEach((t: any, idx: number) => {
            const pos = getTableLayout(t, idx);
            const w = pos.width || 220;
            const h = 52 + (t.columns?.length || 4) * 26;
            minX = Math.min(minX, pos.left);
            minY = Math.min(minY, pos.top);
            maxX = Math.max(maxX, pos.left + w);
            maxY = Math.max(maxY, pos.top + h);
        });

        const width = Math.max(100, maxX - minX);
        const height = Math.max(100, maxY - minY);
        return {
            minX,
            minY,
            maxX,
            maxY,
            width,
            height,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
        };
    }, [tablesList, positions]);

    // Canvas kích thước bao quanh đảm bảo đủ không gian vẽ dây SVG
    const canvasBounds = useMemo(() => {
        return {
            width: Math.max(750, diagramBounds.maxX + 40),
            height: Math.max(500, diagramBounds.maxY + 40),
        };
    }, [diagramBounds]);

    // Hàm tự động căn giữa sơ đồ vào chính giữa container
    const recenter = useCallback((overrideZoom?: number) => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (cw <= 0 || ch <= 0) return;

        const bounds = diagramBounds;
        const padding = 24;
        const availW = Math.max(60, cw - padding * 2);
        const availH = Math.max(60, ch - padding * 2);

        // Tỷ lệ vừa vặn với kích thước khung chứa
        const fitScale = Math.min(availW / bounds.width, availH / bounds.height);
        // Zoom mục tiêu: nếu sơ đồ to thì co lại để thấy hết, tối đa 100%, tối thiểu 45%
        const targetZoom = overrideZoom ?? Math.round(Math.max(45, Math.min(100, fitScale * 100)));
        const scale = targetZoom / 100;

        // Tọa độ đặt trọng tâm sơ đồ vào chính giữa container
        const initialPanX = cw / 2 - bounds.centerX * scale;
        const initialPanY = ch / 2 - bounds.centerY * scale;

        setZoomLevel(targetZoom);
        setPan({ x: initialPanX, y: initialPanY });
    }, [diagramBounds]);

    // Khi nạp trang hoặc schema thay đổi, tự động căn giữa luôn đầu tiên
    useEffect(() => {
        hasAutoCenteredRef.current = false;
        const timer = setTimeout(() => {
            recenter();
            hasAutoCenteredRef.current = true;
        }, 60);

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            const observer = new ResizeObserver(() => {
                if (!hasAutoCenteredRef.current) {
                    recenter();
                    hasAutoCenteredRef.current = true;
                }
            });
            observer.observe(containerRef.current);
            return () => {
                clearTimeout(timer);
                observer.disconnect();
            };
        }
        return () => clearTimeout(timer);
    }, [recenter]);

    // Xử lý kéo thả chuột (Pan / dịch chuyển trái, phải, lên, xuống tự do)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        setIsPanning(true);
        panStartRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialPanX: pan.x,
            initialPanY: pan.y,
        };

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - panStartRef.current.startX;
            const deltaY = moveEvent.clientY - panStartRef.current.startY;
            setPan({
                x: panStartRef.current.initialPanX + deltaX,
                y: panStartRef.current.initialPanY + deltaY,
            });
        };

        const onMouseUp = () => {
            setIsPanning(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    // Phóng to về phía tâm container
    const handleZoomIn = () => {
        setZoomLevel((prev) => {
            const next = Math.min(prev + 10, 160);
            if (containerRef.current) {
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;
                const ratio = (next / 100) / (prev / 100);
                setPan((p) => ({
                    x: cw / 2 - (cw / 2 - p.x) * ratio,
                    y: ch / 2 - (ch / 2 - p.y) * ratio,
                }));
            }
            return next;
        });
    };

    // Thu nhỏ về phía tâm container
    const handleZoomOut = () => {
        setZoomLevel((prev) => {
            const next = Math.max(prev - 10, 35);
            if (containerRef.current) {
                const cw = containerRef.current.clientWidth;
                const ch = containerRef.current.clientHeight;
                const ratio = (next / 100) / (prev / 100);
                setPan((p) => ({
                    x: cw / 2 - (cw / 2 - p.x) * ratio,
                    y: ch / 2 - (ch / 2 - p.y) * ratio,
                }));
            }
            return next;
        });
    };

    // Cuộn chuột để phóng to/thu nhỏ (Ctrl+Wheel) hoặc di chuyển pan
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            const delta = e.deltaY < 0 ? 8 : -8;
            setZoomLevel((prev) => {
                const next = Math.max(35, Math.min(160, prev + delta));
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const ratio = (next / 100) / (prev / 100);
                    setPan((p) => ({
                        x: mouseX - (mouseX - p.x) * ratio,
                        y: mouseY - (mouseY - p.y) * ratio,
                    }));
                }
                return next;
            });
        } else {
            setPan((p) => ({
                x: p.x - e.deltaX,
                y: p.y - e.deltaY,
            }));
        }
    };

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
                                <div className="text-[10px] text-slate-400 font-semibold">Cột khóa ngoại</div>
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

            {/* Vùng Canvas ERD với khả năng Pan & Zoom & Tự động Căn giữa */}
            <div
                style={{ height: compact || diagramOnly ? 480 : 520, minHeight: compact || diagramOnly ? 480 : 520 }}
                className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col shrink-0"
            >
                {/* Thanh công cụ Zoom & Căn giữa */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-xs">
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg text-slate-700 flex items-center justify-center shadow-xs cursor-pointer text-sm font-bold"
                        title="Phóng to (+)"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        className="w-7 h-7 bg-white hover:bg-slate-100 rounded-lg text-slate-700 flex items-center justify-center shadow-xs cursor-pointer text-sm font-bold"
                        title="Thu nhỏ (-)"
                    >
                        -
                    </button>
                    <button
                        type="button"
                        onClick={() => recenter()}
                        className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-1"
                        title="Căn giữa sơ đồ và vừa vặn khung hình"
                    >
                        <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                        <span>{zoomLevel}%</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => recenter()}
                        className="px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer border border-blue-200"
                        title="Đưa toàn bộ sơ đồ về chính giữa"
                    >
                        Căn giữa
                    </button>
                </div>

                {/* Gợi ý điều hướng ở góc dưới bên trái */}
                <div className="absolute bottom-2.5 left-3 z-20 pointer-events-none select-none text-[10px] font-medium text-slate-400 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
                    <Move className="w-3 h-3 text-slate-400" />
                    <span>Kéo chuột để di chuyển • Cuộn để di chuyển • Nhấp đúp để căn giữa</span>
                </div>

                {/* Khung vẽ Canvas ERD (Tự do Pan & Zoom, không bị cắt lề trái) */}
                <div
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onDoubleClick={() => recenter()}
                    onWheel={handleWheel}
                    className={`w-full h-full relative overflow-hidden select-none ${
                        isPanning ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
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
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel / 100})`,
                            transformOrigin: '0 0',
                        }}
                        className={`absolute top-0 left-0 ${
                            isPanning ? '' : 'transition-transform duration-100 ease-out'
                        }`}
                    >
                        {/* ================= SVG DÂY NỐI ================= */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" overflow="visible">
                            {routes.map(({ relation, points }, index) => {
                                const start = points[0], end = points[points.length - 1];
                                const fromDirection = Math.sign(points[1].x - start.x);
                                const toDirection = Math.sign(points[points.length - 2].x - end.x);
                                return (
                                    <g key={index} opacity={!focusedTable || relation.fromTable === focusedTable || relation.toTable === focusedTable ? 1 : 0.12} data-erd-relation={`${relation.fromTable}.${relation.fromColumns.join(',')}->${relation.toTable}.${relation.toColumns.join(',')}`}>
                                        <title>{`${relation.fromTable} (${relation.fromColumns.join(', ')}) → ${relation.toTable} (${relation.toColumns.join(', ')})`}</title>
                                        <path d={points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')} fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinejoin="round" />
                                        <path d={`M ${start.x} ${start.y - 5} L ${start.x + fromDirection * 12} ${start.y} L ${start.x} ${start.y + 5}`} fill="none" stroke="#64748b" strokeWidth="1.5" />
                                        <text x={start.x + fromDirection * 16} y={start.y - 7} textAnchor="middle" fontSize="11" fill="#475569">N</text>
                                        <text x={end.x + toDirection * 14} y={end.y - 7} textAnchor="middle" fontSize="11" fill="#475569">1</text>
                                        <circle cx={end.x} cy={end.y} r="2.5" fill="#64748b" />
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
                                    data-erd-table={table.name}
                                    onMouseEnter={() => setFocusedTable(table.name)}
                                    onMouseLeave={() => setFocusedTable(null)}
                                    className={`absolute bg-white rounded-xl border ${pos.colorScheme.border} shadow-md overflow-hidden z-10 hover:shadow-lg transition-all`}
                                    style={{
                                        top: `${pos.top}px`,
                                        left: `${pos.left}px`,
                                        width: `${pos.width || 215}px`,
                                    }}
                                >
                                    <div
                                        style={{ height: 34 }}
                                        className={`${pos.colorScheme.headerBg} px-3 py-1.5 border-b ${pos.colorScheme.headerBorder} font-bold text-slate-800 text-xs flex justify-between items-center`}
                                    >
                                        <span>{table.name}</span>
                                        {table.vietnameseName && (
                                            <span className="text-[10px] font-semibold text-slate-400">
                                                {table.vietnameseName}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ padding: 8, display: 'grid', gap: 0 }} className="text-xs bg-white font-sans">
                                        {table.columns.map((col: any) => (
                                            <div
                                                key={col.name}
                                                style={{ height: 26 }}
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
                                                    {col.type} {col.isPk ? (col.isFk || col.references ? 'PK · FK' : 'PK') : col.isFk || col.references ? 'FK' : ''}
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
