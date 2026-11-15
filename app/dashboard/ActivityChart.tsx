'use client';

import { useEffect, useRef, useState } from 'react';
import type { DailyActivity } from '@/services/dashboardService';

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));

export default function ActivityChart({ data }: { data: DailyActivity[] }) {
    const container = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);
    const [hovered, setHovered] = useState<number | null>(null);
    useEffect(() => {
        const element = container.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const days = data.map(day => ({
        date: day.date,
        count: Math.max(0, Number(day.exercisesSolved ?? day.exerciseCount ?? 0) || 0),
        score: clamp(Number(day.averageScore ?? 0), 100),
    }));
    const height = 260;
    const left = 34, right = width - 38, top = 24, bottom = height - 34;
    const plotWidth = right - left, plotHeight = bottom - top;
    const maxCount = Math.max(4, Math.ceil(Math.max(0, ...days.map(day => day.count)) / 4) * 4);
    const step = plotWidth / Math.max(1, days.length);
    const x = (index: number) => left + step * (index + 0.5);
    const scoreY = (score: number) => bottom - score / 100 * plotHeight;
    const line = days.map((day, index) => day.count > 0
        ? `${index === 0 || days[index - 1].count === 0 ? 'M' : 'L'} ${x(index)},${scoreY(day.score)}` : '').join(' ');
    const active = hovered === null ? null : days[hovered];
    const tickEvery = Math.max(1, Math.ceil(days.length / (width < 420 ? 4 : 6)));

    return (
        <div ref={container} className="relative w-full min-w-0" onMouseLeave={() => setHovered(null)}>
            <div className="mb-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-sm bg-blue-600 inline-block" />Lượt làm bài</span>
                <span className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500 inline-block" />Điểm trung bình / 100</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="block h-[260px] w-full" role="img" aria-label="Lượt làm bài và điểm trung bình thang 100 trong 30 ngày">
                {[0, 1, 2, 3, 4].map(tick => {
                    const y = bottom - tick / 4 * plotHeight;
                    return <g key={tick}>
                        <line x1={left} x2={right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 4" />
                        <text x={left - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">{maxCount * tick / 4}</text>
                        <text x={right + 8} y={y + 4} fill="#64748b" fontSize="10">{tick * 25}</text>
                    </g>;
                })}
                <path d={line} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
                {days.map((day, index) => {
                    const barHeight = Math.min(day.count / maxCount, 1) * plotHeight;
                    const dateLabel = `${day.date.slice(8, 10)}/${day.date.slice(5, 7)}`;
                    const description = `${dateLabel}: ${day.count} lượt làm bài${day.count ? `, điểm trung bình ${day.score.toFixed(1)}/100` : ''}`;
                    return <g key={day.date}>
                        <rect x={x(index) - Math.min(step * 0.55, 16) / 2} y={bottom - barHeight} width={Math.min(step * 0.55, 16)} height={barHeight} rx="3" fill={hovered === index ? '#2563eb' : '#93c5fd'} />
                        {day.count > 0 && <circle cx={x(index)} cy={scoreY(day.score)} r="3.5" fill="#10b981" stroke="white" strokeWidth="1.5"><title>{description}</title></circle>}
                        {(index % tickEvery === 0 || index === days.length - 1) &&
                            <text x={x(index)} y={height - 10} textAnchor="middle" fill="#64748b" fontSize="10">{dateLabel}</text>}
                        <rect x={left + index * step} y={top - 8} width={step} height={plotHeight + 8} fill="transparent" onMouseEnter={() => setHovered(index)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} tabIndex={0} aria-label={description}><title>{description}</title></rect>
                    </g>;
                })}
                {!days.some(day => day.count > 0) && <text x={width / 2} y={height / 2} textAnchor="middle" fill="#64748b" fontSize="12">Chưa có lượt làm bài trong 30 ngày</text>}
            </svg>
            {active && <div className="pointer-events-none absolute top-9 z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md" style={{ left: Math.max(0, Math.min(width - 180, x(hovered!))) }}>
                <p className="font-bold text-slate-800">{active.date.split('-').reverse().join('/')}</p>
                <p className="mt-1 text-blue-600">{active.count} lượt làm bài</p>
                <p className="text-emerald-600">{active.count ? `${active.score.toFixed(1)} / 100 điểm` : 'Chưa có điểm'}</p>
            </div>}
        </div>
    );
}
