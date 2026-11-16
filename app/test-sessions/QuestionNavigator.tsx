'use client';
import styles from './QuestionNavigator.module.css';

interface Props {
    questions: { id: string }[];
    currentIndex: number;
    answered: Record<string, boolean>;
    flagged: Record<string, boolean>;
    onSelect: (index: number) => void;
    onToggleFlag: (id: string) => void;
}

export default function QuestionNavigator({ questions, currentIndex, answered, flagged, onSelect, onToggleFlag }: Props) {
    const current = questions[currentIndex];
    const answeredCount = questions.filter(question => answered[question.id]).length;

    return <aside aria-label="Danh sách câu hỏi" className={styles.panel}>
        <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Danh sách câu hỏi</h2>
            <span className="text-xs font-semibold text-slate-500">{answeredCount}/{questions.length} đã trả lời</span>
        </div>
        <div className={styles.grid} aria-label="Chọn câu hỏi">
            {questions.map((question, index) => {
                const selected = currentIndex === index;
                const completed = !!answered[question.id];
                const marked = !!flagged[question.id];
                return <button key={question.id} type="button" onClick={() => onSelect(index)}
                    aria-label={`Câu ${index + 1}${completed ? ', đã trả lời' : ', chưa trả lời'}${marked ? ', đã gắn cờ' : ''}`}
                    aria-current={selected ? 'step' : undefined}
                    className={`relative flex h-10 min-w-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors ${
                        selected ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-200 ring-offset-1'
                            : completed ? 'border-emerald-500 bg-emerald-500 text-white'
                                : marked ? 'border-amber-300 bg-amber-50 text-amber-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                    {index + 1}
                    {marked && <span aria-hidden="true" className="absolute -right-1 -top-1 text-[10px]">🚩</span>}
                    {completed && <span aria-hidden="true" className="absolute bottom-0 right-1 text-[9px]">✓</span>}
                </button>;
            })}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600" />Đang chọn</span>
            <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />Đã trả lời</span>
            <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm border border-slate-300 bg-slate-50" />Chưa trả lời</span>
            <span>🚩 Đã gắn cờ</span>
        </div>
        {current && <button type="button" onClick={() => onToggleFlag(current.id)}
            className="mt-5 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">
            {flagged[current.id] ? 'Bỏ gắn cờ câu ' : 'Gắn cờ câu '}{currentIndex + 1}
        </button>}
    </aside>;
}
