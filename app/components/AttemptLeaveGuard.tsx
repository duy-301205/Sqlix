'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

type ExitAction = () => void | Promise<void>;
let requestExit: ((action: ExitAction) => void) | null = null;

// Actions such as logout must finish the attempt before clearing authentication.
export function requestAttemptExit(action: ExitAction) {
    if (requestExit) requestExit(action);
    else void action();
}

interface Props {
    isActive: () => boolean;
    onFinish: () => Promise<void>;
    message: string;
}

export default function AttemptLeaveGuard(props: Props) {
    const router = useRouter();
    const active = props.isActive();
    const latest = useRef(props);
    latest.current = props;
    const actionRef = useRef<ExitAction | null>(null);
    const bypassRef = useRef(false);
    const busyRef = useRef(false);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const cancelRef = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const ensureHistoryRef = useRef<() => void>(() => {});
    const releaseHistoryRef = useRef<() => Promise<void>>(async () => {});

    useEffect(() => {
        const request = (action: ExitAction) => {
            if (bypassRef.current || !latest.current.isActive()) {
                void (async () => {
                    if (!bypassRef.current) { bypassRef.current = true; await releaseHistoryRef.current(); }
                    await action();
                })();
                return;
            }
            if (busyRef.current || actionRef.current) return;
            actionRef.current = action;
            setError('');
            setOpen(true);
        };
        requestExit = request;
        const push = router.push, replace = router.replace, back = router.back, forward = router.forward;
        const staysOnPage = (href: string) => {
            const url = new URL(href, location.href);
            return url.origin === location.origin && url.pathname === location.pathname;
        };
        const guardedPush: typeof push = (...args) => staysOnPage(args[0]) ? push(...args) : request(() => push(...args));
        const guardedReplace: typeof replace = (...args) => staysOnPage(args[0]) ? replace(...args) : request(() => replace(...args));
        const guardedBack = () => request(() => back());
        const guardedForward = () => request(() => forward());
        router.push = guardedPush;
        router.replace = guardedReplace;
        router.back = guardedBack;
        router.forward = guardedForward;

        const click = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const anchor = (event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
            if (!anchor || anchor.download || (anchor.target && anchor.target !== '_self')) return;
            const url = new URL(anchor.href, window.location.href);
            if (!['http:', 'https:'].includes(url.protocol)) return;
            if (url.origin === location.origin && url.pathname === location.pathname) return;
            if (bypassRef.current || !latest.current.isActive()) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            request(() => url.origin === location.origin ? push(url.pathname + url.search + url.hash) : location.assign(url.href));
        };
        document.addEventListener('click', click, true);

        // Keep Back on a same-document entry so the page cannot unmount before confirmation.
        const historyKey = 'attempt-' + Date.now() + '-' + Math.random();
        let installed = false;
        let restoring = false;
        let release: (() => void) | null = null;
        let restored: Promise<void> = Promise.resolve();
        let resolveRestore: (() => void) | null = null;
        ensureHistoryRef.current = () => {
            if (!installed && latest.current.isActive()) {
                history.pushState({ ...history.state, attemptGuard: historyKey }, '', location.href);
                installed = true;
            }
        };
        releaseHistoryRef.current = async () => {
            await restored;
            if (!installed || history.state?.attemptGuard !== historyKey) return;
            await new Promise<void>((resolve) => {
                release = resolve;
                history.back();
            });
            installed = false;
        };
        const popstate = (event: PopStateEvent) => {
            if (release) {
                event.stopImmediatePropagation();
                const done = release;
                release = null;
                done();
                return;
            }
            if (restoring) {
                event.stopImmediatePropagation();
                restoring = false;
                resolveRestore?.();
                resolveRestore = null;
                return;
            }
            if (bypassRef.current || !latest.current.isActive() || !installed) return;
            event.stopImmediatePropagation();
            restoring = true;
            restored = new Promise<void>((resolve) => { resolveRestore = resolve; });
            history.forward();
            request(() => history.back());
        };
        window.addEventListener('popstate', popstate, true);
        const beforeUnload = (event: BeforeUnloadEvent) => {
            if (!bypassRef.current && latest.current.isActive()) { event.preventDefault(); event.returnValue = ''; }
        };
        window.addEventListener('beforeunload', beforeUnload);

        return () => {
            if (requestExit === request) requestExit = null;
            if (router.push === guardedPush) router.push = push;
            if (router.replace === guardedReplace) router.replace = replace;
            if (router.back === guardedBack) router.back = back;
            if (router.forward === guardedForward) router.forward = forward;
            document.removeEventListener('click', click, true);
            window.removeEventListener('popstate', popstate, true);
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [router]);

    useEffect(() => { if (active) ensureHistoryRef.current(); }, [active]);

    const cancel = () => { if (!busyRef.current) { actionRef.current = null; setOpen(false); } };
    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;
        cancelRef.current?.focus();
        const keydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { event.preventDefault(); cancel(); }
            if (event.key === 'Tab') {
                event.preventDefault();
                if (busyRef.current) return;
                (document.activeElement === cancelRef.current ? confirmRef : cancelRef).current?.focus();
            }
        };
        document.addEventListener('keydown', keydown, true);
        return () => { document.removeEventListener('keydown', keydown, true); previous?.focus(); };
    }, [open]);

    const confirm = async () => {
        if (busyRef.current || !actionRef.current) return;
        busyRef.current = true;
        setBusy(true);
        setError('');
        try {
            await latest.current.onFinish();
            bypassRef.current = true;
            await releaseHistoryRef.current();
            await actionRef.current();
            setOpen(false);
            actionRef.current = null;
        } catch (failure: any) {
            bypassRef.current = false;
            setError(failure?.response?.data?.message || failure?.message || 'Không thể kết thúc bài. Vui lòng thử lại.');
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    if (!open) return null;
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15, 23, 42, 0.5)' }}>
            <section role="dialog" aria-modal="true" aria-labelledby="leave-attempt-title" aria-describedby="leave-attempt-description"
                style={{ width: '100%', maxWidth: 448, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', margin: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
                <h2 id="leave-attempt-title" className="text-lg font-bold">Bạn có muốn thoát không?</h2>
                <p id="leave-attempt-description" className="mt-3 text-sm leading-6 text-slate-600">{props.message}</p>
                {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button ref={cancelRef} type="button" disabled={busy} onClick={cancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Tiếp tục làm bài</button>
                    <button ref={confirmRef} type="button" disabled={busy} onClick={confirm} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang kết thúc...' : 'Kết thúc và thoát'}</button>
                </div>
            </section>
        </div>, document.body,
    );
}
