'use client';

import React, { useState } from 'react';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Trình render Markdown tối ưu hóa cho bài giảng SQL
 * Hỗ trợ Heading (# -> ######), Bold (**), Italic (*), Inline code (`),
 * Code block (```sql), Unordered list (-/*), Ordered list (1.), Blockquote (>), Table (|)
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    if (!content || !content.trim()) return null;

    const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedBlockId(id);
        setTimeout(() => setCopiedBlockId(null), 2000);
    };

    // Hàm phân giải inline: Bold, Italic, Code, Link
    const renderInline = (text: string): React.ReactNode[] => {
        // Tokenize text into inline parts
        const elements: React.ReactNode[] = [];
        // Match regex: code `...`, bold **...** or __...__, italic *...* or _..._, link [...](...)
        const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+(?!\*)|(?<!_)_[^_]+(?!_)|\[([^\]]+)\]\(([^)]+)\))/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            // Push text before match
            if (match.index > lastIndex) {
                elements.push(text.slice(lastIndex, match.index));
            }

            const raw = match[0];
            const key = `${match.index}-${raw}`;

            if (raw.startsWith('`') && raw.endsWith('`')) {
                // Inline code
                elements.push(
                    <code
                        key={key}
                        className="px-1.5 py-0.5 rounded-md font-mono text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60"
                    >
                        {raw.slice(1, -1)}
                    </code>
                );
            } else if ((raw.startsWith('**') && raw.endsWith('**')) || (raw.startsWith('__') && raw.endsWith('__'))) {
                // Bold
                elements.push(
                    <strong key={key} className="font-bold text-slate-900">
                        {renderInline(raw.slice(2, -2))}
                    </strong>
                );
            } else if ((raw.startsWith('*') && raw.endsWith('*')) || (raw.startsWith('_') && raw.endsWith('_'))) {
                // Italic
                elements.push(
                    <em key={key} className="italic text-slate-800">
                        {renderInline(raw.slice(1, -1))}
                    </em>
                );
            } else if (raw.startsWith('[') && raw.includes('](')) {
                // Link
                const linkText = match[2];
                const linkUrl = match[3];
                elements.push(
                    <a
                        key={key}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                        {linkText}
                    </a>
                );
            } else {
                elements.push(raw);
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            elements.push(text.slice(lastIndex));
        }

        return elements;
    };

    // Phân giải các dòng / block của Markdown
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // 1. Code block fenced ```
        if (line.trim().startsWith('```')) {
            const lang = line.trim().slice(3).trim() || 'SQL';
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            const codeString = codeLines.join('\n');
            const blockId = `code-block-${i}`;

            nodes.push(
                <div key={blockId} className="my-4 rounded-xl border border-slate-800 bg-slate-950 shadow-md overflow-hidden text-xs font-mono">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold ml-2">
                                {lang}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(codeString, blockId)}
                            className="hover:text-white transition-colors cursor-pointer text-[11px] flex items-center gap-1 font-sans"
                        >
                            {copiedBlockId === blockId ? 'Đã copy ✓' : 'Sao chép'}
                        </button>
                    </div>
                    <pre className="p-4 text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre">
                        <code>{codeString}</code>
                    </pre>
                </div>
            );
            continue;
        }

        // 2. Headings (# -> ######)
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            const key = `h-${level}-${i}`;

            if (level === 1) {
                nodes.push(
                    <h1 key={key} className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-3 tracking-tight">
                        {renderInline(headingText)}
                    </h1>
                );
            } else if (level === 2) {
                nodes.push(
                    <h2 key={key} className="text-lg sm:text-xl font-black text-slate-900 mt-5 mb-2.5 tracking-tight border-b border-slate-100 pb-1.5">
                        {renderInline(headingText)}
                    </h2>
                );
            } else if (level === 3) {
                nodes.push(
                    <h3 key={key} className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-blue-600 shrink-0" />
                        <span>{renderInline(headingText)}</span>
                    </h3>
                );
            } else if (level === 4) {
                nodes.push(
                    <h4 key={key} className="text-sm sm:text-base font-bold text-slate-800 mt-3.5 mb-1.5">
                        {renderInline(headingText)}
                    </h4>
                );
            } else {
                nodes.push(
                    <h5 key={key} className="text-xs sm:text-sm font-bold text-slate-700 mt-3 mb-1 uppercase tracking-wider">
                        {renderInline(headingText)}
                    </h5>
                );
            }
            i++;
            continue;
        }

        // 3. Blockquote (> ...)
        if (line.trim().startsWith('>')) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('>')) {
                quoteLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            nodes.push(
                <blockquote
                    key={`quote-${i}`}
                    className="my-3.5 pl-4 py-2.5 pr-3.5 border-l-4 border-blue-500 bg-blue-50/50 rounded-r-xl text-slate-700 text-xs sm:text-sm leading-relaxed"
                >
                    {quoteLines.map((ql, qIdx) => (
                        <p key={qIdx} className={qIdx > 0 ? 'mt-1.5' : ''}>
                            {renderInline(ql)}
                        </p>
                    ))}
                </blockquote>
            );
            continue;
        }

        // 4. Unordered List (- item or * item)
        if (/^[\*\-]\s+(.*)$/.test(line.trim())) {
            const listItems: string[] = [];
            while (i < lines.length && /^[\*\-]\s+(.*)$/.test(lines[i].trim())) {
                const itemMatch = lines[i].trim().match(/^[\*\-]\s+(.*)$/);
                if (itemMatch) listItems.push(itemMatch[1]);
                i++;
            }
            nodes.push(
                <ul key={`ul-${i}`} className="my-3 space-y-1.5 pl-2">
                    {listItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <span>{renderInline(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // 5. Ordered List (1. item, 2. item)
        if (/^\d+\.\s+(.*)$/.test(line.trim())) {
            const listItems: string[] = [];
            while (i < lines.length && /^\d+\.\s+(.*)$/.test(lines[i].trim())) {
                const itemMatch = lines[i].trim().match(/^\d+\.\s+(.*)$/);
                if (itemMatch) listItems.push(itemMatch[1]);
                i++;
            }
            nodes.push(
                <ol key={`ol-${i}`} className="my-3 space-y-1.5 pl-1">
                    {listItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                            <span className="font-bold text-blue-600 min-w-[20px] text-right shrink-0">
                                {idx + 1}.
                            </span>
                            <span>{renderInline(item)}</span>
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // 6. Horizontal Rule (--- or ***)
        if (/^(\-{3,}|\*{3,})$/.test(line.trim())) {
            nodes.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
            i++;
            continue;
        }

        // 7. Regular paragraph / text line
        if (line.trim().length === 0) {
            i++;
            continue;
        }

        // Collect continuous non-empty lines into a single paragraph
        const paraLines: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim().length > 0 &&
            !lines[i].trim().startsWith('```') &&
            !lines[i].match(/^#{1,6}\s+/) &&
            !lines[i].trim().startsWith('>') &&
            !/^[\*\-]\s+/.test(lines[i].trim()) &&
            !/^\d+\.\s+/.test(lines[i].trim()) &&
            !/^(\-{3,}|\*{3,})$/.test(lines[i].trim())
        ) {
            paraLines.push(lines[i]);
            i++;
        }

        nodes.push(
            <p key={`p-${i}`} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
                {paraLines.map((pl, plIdx) => (
                    <React.Fragment key={plIdx}>
                        {renderInline(pl)}
                        {plIdx < paraLines.length - 1 && <br />}
                    </React.Fragment>
                ))}
            </p>
        );
    }

    return <div className={`markdown-content space-y-1 ${className}`}>{nodes}</div>;
}
