'use client';

import { useState } from 'react';

export default function EditorTab() {
    const [sqlQuery, setSqlQuery] = useState(
        `SELECT p.product_name, c.category_name, p.price\nFROM products p\nJOIN categories c ON p.category_id = c.category_id\nWHERE p.price >= 500000\nORDER BY p.price DESC\nLIMIT 10;`
    );
    const [queryResult, setQueryResult] = useState<any[] | null>(null);

    const handleRunQuery = () => {
        setQueryResult([
            { product_name: 'Bàn phím cơ không dây RK84', category_name: 'Phụ kiện', price: '1,250,000 VNĐ' },
            { product_name: 'Chuột công thái học Master 3S', category_name: 'Phụ kiện', price: '2,190,000 VNĐ' },
            { product_name: 'Màn hình UltraFine 4K 27 inch', category_name: 'Màn hình', price: '9,800,000 VNĐ' },
            { product_name: 'Tai nghe Bluetooth ANC Pro', category_name: 'Âm thanh', price: '3,450,000 VNĐ' },
        ]);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
            {/* Query Editor Box */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Trình soạn thảo SQL</h3>
                    <button
                        type="button"
                        onClick={handleRunQuery}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>Chạy truy vấn</span>
                    </button>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs flex-1 min-h-[240px]">
          <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={9}
              className="w-full bg-transparent text-cyan-300 outline-none resize-none leading-relaxed"
          />
                </div>
            </div>

            {/* Query Result Box */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Kết quả thực thi (Output)</h3>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto min-h-[240px]">
                    {queryResult ? (
                        <table className="w-full text-left text-xs font-mono">
                            <thead>
                            <tr className="border-b border-slate-300 text-slate-500 font-bold">
                                <th className="pb-2">Tên sản phẩm</th>
                                <th className="pb-2">Danh mục</th>
                                <th className="pb-2">Giá</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800">
                            {queryResult.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 pr-2">{row.product_name}</td>
                                    <td className="py-2 pr-2">{row.category_name}</td>
                                    <td className="py-2 font-bold text-blue-600">{row.price}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                            Bấm &quot;Chạy truy vấn&quot; để hiển thị dữ liệu kết quả...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}