'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

type Scope = 'student' | 'admin';
const changedEvent = 'sqlix:sidebar-visibility-changed';
const fallbackPreferences = new Map<string, boolean>();
const serverSnapshot = () => false;
const subscribe = (listener: () => void) => {
    window.addEventListener(changedEvent, listener);
    window.addEventListener('storage', listener);
    window.addEventListener('resize', listener);
    return () => {
        window.removeEventListener(changedEvent, listener);
        window.removeEventListener('storage', listener);
        window.removeEventListener('resize', listener);
    };
};

function useSidebarVisibility(scope: Scope) {
    const key = `sqlix_sidebar_collapsed_${scope}`;
    const snapshot = useCallback(() => {
        try {
            const preference = localStorage.getItem(key);
            return preference === null ? window.matchMedia('(max-width: 767px)').matches : preference === 'true';
        } catch { return fallbackPreferences.get(key) ?? window.matchMedia('(max-width: 767px)').matches; }
    }, [key]);
    const collapsed = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
    const toggle = useCallback(() => {
        const next = !snapshot();
        fallbackPreferences.set(key, next);
        try { localStorage.setItem(key, String(next)); } catch {}
        window.dispatchEvent(new Event(changedEvent));
    }, [key, snapshot]);
    return { collapsed, toggle };
}

export function SidebarToggle({ scope = 'student', className = '' }: { scope?: Scope; className?: string }) {
    const { collapsed, toggle } = useSidebarVisibility(scope);
    const label = collapsed ? 'Hiện sidebar' : 'Ẩn sidebar';
    return <button type="button" onClick={toggle} title={label} aria-label={label}
        aria-expanded={!collapsed} aria-controls={`${scope}-navigation-sidebar`}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500 ${className}`}>
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
    </button>;
}

export function SidebarShell({ scope = 'student', className, children }: { scope?: Scope; className: string; children: ReactNode }) {
    const { collapsed, toggle } = useSidebarVisibility(scope);
    const panelRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !collapsed && window.matchMedia('(max-width: 767px)').matches
                && panelRef.current?.getClientRects().length) toggle();
        };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [collapsed, toggle]);
    return <>
        {collapsed && <SidebarToggle scope={scope}
            className="fixed left-0 top-1/2 z-30 h-8! w-8! -translate-y-1/2 rounded-l-none" />}
        {!collapsed && <button type="button" aria-label="Đóng sidebar" onClick={toggle}
            className="fixed inset-0 z-30 bg-slate-900/35 md:hidden" />}
        <aside ref={panelRef} id={`${scope}-navigation-sidebar`}
            aria-label={scope === 'admin' ? 'Điều hướng quản trị' : 'Điều hướng học viên'}
            style={{ display: collapsed ? 'none' : undefined }}
            className={`fixed inset-y-0 left-0 z-40 md:relative md:z-30 ${className}`}>
            <SidebarToggle scope={scope} className="absolute right-2 top-6 h-8! w-8!" />
            {children}
        </aside>
    </>;
}
