'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MockTestRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/mock-tests');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center text-xs text-slate-400 font-sans">
            Đang chuyển hướng sang phòng thi thử...
        </div>
    );
}
