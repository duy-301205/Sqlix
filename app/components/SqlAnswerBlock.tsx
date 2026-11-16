'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDialect, postgresql } from 'sql-formatter';

export function formatSqlAnswer(query: string): string {
    try {
        return formatDialect(query, {
            dialect: postgresql, tabWidth: 4, keywordCase: 'upper',
            expressionWidth: 70, linesBetweenQueries: 1,
        });
    } catch {
        // Invalid submissions must remain readable even if they cannot be formatted.
        return query;
    }
}

export default function SqlAnswerBlock({ query, label }: { query: string; label: string }) {
    const formatted = useMemo(() => formatSqlAnswer(query), [query]);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(formatted);
            setCopyStatus('copied');
        } catch { setCopyStatus('error'); }
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setCopyStatus('idle'), 2500);
    };

    if (!query.trim()) return <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">Chưa có truy vấn SQL.</p>;

    return (
        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner" data-sql-answer={label}>
            <div className="flex flex-col items-start justify-between gap-2 border-b border-slate-800 bg-slate-900 px-2 py-2.5 sm:flex-row sm:items-center sm:px-4">
                <span className="min-w-0 max-w-full break-words text-xs font-semibold text-slate-300">{label} <span className="ml-2 font-mono text-[10px] text-slate-500">SQL</span></span>
                <button type="button" onClick={copy} aria-label={`Sao chép ${label}`} className="max-w-full shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400">
                    <span aria-live="polite">{copyStatus === 'copied' ? 'Đã sao chép ✓' : copyStatus === 'error' ? 'Không thể sao chép' : 'Sao chép'}</span>
                </button>
            </div>
            <div className="flex text-xs leading-6">
                <pre aria-hidden="true" className="hidden shrink-0 select-none border-r border-slate-800 bg-slate-900/40 px-3 py-4 text-right font-mono text-slate-600 sm:block">{formatted.split('\n').map((_, i) => i + 1).join('\n')}</pre>
                <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre px-3 py-4 font-mono text-cyan-200 sm:px-4" tabIndex={0} aria-label={label}><code>{formatted}</code></pre>
            </div>
        </div>
    );
}
