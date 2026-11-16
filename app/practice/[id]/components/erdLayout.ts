import type { ErdRelationship } from './erdRelationships';

type Table = { name: string; columns: { name: string }[] };
export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; width: number; height: number };
export type Route = { relation: ErdRelationship; points: Point[] };

// Stable force layout: rectangle dimensions, rather than table counts, determine spacing.
export function layoutErd(tables: Table[], relationships: ErdRelationship[]) {
    const ordered = [...tables].sort((a, b) => a.name.localeCompare(b.name));
    const index = new Map(ordered.map((t, i) => [t.name, i]));
    const edges = relationships.filter(r => r.fromTable !== r.toTable && index.has(r.fromTable) && index.has(r.toTable));
    const nodes = ordered.map((t, i) => ({ x: Math.cos(i * 2.39996) * 220 * Math.sqrt(i), y: Math.sin(i * 2.39996) * 220 * Math.sqrt(i), w: 220, h: 52 + t.columns.length * 26 }));
    for (let step = 0; step < 420; step++) {
        const forces = nodes.map(n => ({ x: -n.x * .012, y: -n.y * .012 }));
        for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
            const p = nodes[a], q = nodes[b];
            const dx = q.x - p.x || .1, dy = q.y - p.y || .1, d = Math.hypot(dx, dy);
            const clearance = Math.min((p.w + q.w) / 2 / (Math.abs(dx) / d), (p.h + q.h) / 2 / (Math.abs(dy) / d)) + 100;
            const f = Math.max(0, clearance - d) * .3 + 3500 / (d * d);
            forces[a].x -= dx / d * f; forces[a].y -= dy / d * f;
            forces[b].x += dx / d * f; forces[b].y += dy / d * f;
        }
        for (const edge of edges) {
            const a = index.get(edge.fromTable)!, b = index.get(edge.toTable)!;
            const p = nodes[a], q = nodes[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
            const target = Math.min((p.w + q.w) / 2 / Math.max(.01, Math.abs(dx) / d), (p.h + q.h) / 2 / Math.max(.01, Math.abs(dy) / d)) + 140;
            const f = (d - target) * .035;
            forces[a].x += dx / d * f; forces[a].y += dy / d * f;
            forces[b].x -= dx / d * f; forces[b].y -= dy / d * f;
        }
        nodes.forEach((n, i) => { n.x += Math.max(-20, Math.min(20, forces[i].x)); n.y += Math.max(-20, Math.min(20, forces[i].y)); });
    }
    // Resolve any remaining collisions, including disconnected tables and long columns.
    for (let pass = 0; pass < nodes.length * 10; pass++) {
        let changed = false;
        for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
            const p = nodes[a], q = nodes[b], dx = q.x - p.x, dy = q.y - p.y;
            const ox = (p.w + q.w) / 2 + 80 - Math.abs(dx), oy = (p.h + q.h) / 2 + 80 - Math.abs(dy);
            if (ox > 0 && oy > 0) {
                if (ox < oy) { const shift = (ox + 1) / 2 * (dx >= 0 ? 1 : -1); p.x -= shift; q.x += shift; }
                else { const shift = (oy + 1) / 2 * (dy >= 0 ? 1 : -1); p.y -= shift; q.y += shift; }
                changed = true;
            }
        }
        if (!changed) break;
    }
    const minX = Math.min(0, ...nodes.map(n => n.x - n.w / 2)), minY = Math.min(0, ...nodes.map(n => n.y - n.h / 2));
    return Object.fromEntries(ordered.map((t, i) => [t.name, { left: Math.round(nodes[i].x - nodes[i].w / 2 - minX + 90), top: Math.round(nodes[i].y - nodes[i].h / 2 - minY + 90), width: nodes[i].w, height: nodes[i].h }])) as Record<string, Rect>;
}

// Orthogonal visibility grid. Each obstacle contributes corridors around its perimeter.
export function routeErd(tables: Table[], rectangles: Record<string, Rect>, relationships: ErdRelationship[]): Route[] {
    const rects = Object.values(rectangles);
    const columnY = (table: string, columns: string[]) => {
        const t = tables.find(t => t.name === table)!;
        return rectangles[table].top + 56 + columns.reduce((s, c) => s + Math.max(0, t.columns.findIndex(x => x.name === c)), 0) / Math.max(1, columns.length) * 26;
    };
    const xs = new Set<number>([20]), ys = new Set<number>([20]);
    rects.forEach(r => { xs.add(r.left - 24); xs.add(r.left + r.width + 24); ys.add(r.top - 24); ys.add(r.top + r.height + 24); });
    relationships.forEach(r => { ys.add(columnY(r.fromTable, r.fromColumns)); ys.add(columnY(r.toTable, r.toColumns)); });
    const xx = [...xs].sort((a, b) => a - b), yy = [...ys].sort((a, b) => a - b), w = xx.length;
    const points = yy.flatMap(y => xx.map(x => ({ x, y })));
    const inside = (p: Point, r: Rect) => p.x > r.left - 10 && p.x < r.left + r.width + 10 && p.y > r.top - 10 && p.y < r.top + r.height + 10;
    const free = points.map(p => !rects.some(r => inside(p, r)));
    const clear = (a: Point, b: Point) => !rects.some(r => a.x === b.x
        ? a.x > r.left - 10 && a.x < r.left + r.width + 10 && Math.max(a.y, b.y) > r.top - 10 && Math.min(a.y, b.y) < r.top + r.height + 10
        : a.y > r.top - 10 && a.y < r.top + r.height + 10 && Math.max(a.x, b.x) > r.left - 10 && Math.min(a.x, b.x) < r.left + r.width + 10);
    const neighbors = points.map((p, i) => [i % w ? i - 1 : -1, i % w < w - 1 ? i + 1 : -1, i - w, i + w].filter(j => j >= 0 && j < points.length && free[i] && free[j] && clear(p, points[j])));
    const used = new Map<string, number>();
    const segmentKey = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`;
    return [...relationships].sort((a, b) => `${a.fromTable}.${a.fromCol}.${a.toTable}`.localeCompare(`${b.fromTable}.${b.fromCol}.${b.toTable}`)).map(relation => {
        const source = rectangles[relation.fromTable], target = rectangles[relation.toTable];
        const sy = columnY(relation.fromTable, relation.fromColumns), ty = columnY(relation.toTable, relation.toColumns);
        const ports = (r: Rect, y: number) => [ { anchor: { x: r.left, y }, stub: { x: r.left - 24, y } }, { anchor: { x: r.left + r.width, y }, stub: { x: r.left + r.width + 24, y } } ];
        let best: { cost: number; path: number[]; start: Point; end: Point } | undefined;
        for (const s of ports(source, sy)) for (const t of ports(target, ty)) {
            if (source === target && s.stub.x !== t.stub.x) continue;
            const start = yy.indexOf(sy) * w + xx.indexOf(s.stub.x), goal = yy.indexOf(ty) * w + xx.indexOf(t.stub.x);
            const dist = new Map<number, number>([[start * 3, 0]]), previous = new Map<number, number>();
            const heap: [number, number][] = [];
            const push = (entry: [number, number]) => { heap.push(entry); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= entry[0]) break; heap[i] = heap[p]; i = p; } heap[i] = entry; };
            const pop = () => { const first = heap[0], last = heap.pop()!; if (heap.length) { let i = 0; while (i * 2 + 1 < heap.length) { let c = i * 2 + 1; if (c + 1 < heap.length && heap[c + 1][0] < heap[c][0]) c++; if (heap[c][0] >= last[0]) break; heap[i] = heap[c]; i = c; } heap[i] = last; } return first; };
            push([0, start * 3]);
            while (heap.length) {
                const [cost, state] = pop(); if (cost !== dist.get(state)) continue;
                const node = Math.floor(state / 3), direction = state % 3;
                if (node === goal) {
                    const path = [node]; let cur = state;
                    while (previous.has(cur)) { cur = previous.get(cur)!; path.push(Math.floor(cur / 3)); }
                    if (!best || cost < best.cost) best = { cost, path: path.reverse(), start: s.anchor, end: t.anchor };
                    break;
                }
                for (const next of neighbors[node]) {
                    const dir = points[node].x === points[next].x ? 2 : 1, nextState = next * 3 + dir;
                    const nextCost = cost + Math.abs(points[node].x - points[next].x) + Math.abs(points[node].y - points[next].y) + (direction && direction !== dir ? 32 : 0) + (used.get(segmentKey(node, next)) || 0) * 90;
                    if (nextCost < (dist.get(nextState) ?? Infinity)) { dist.set(nextState, nextCost); previous.set(nextState, state); push([nextCost, nextState]); }
                }
            }
        }
        if (!best) throw new Error(`Cannot route ERD relationship ${relation.fromTable} -> ${relation.toTable}`);
        best.path.slice(1).forEach((n, i) => { const key = segmentKey(best!.path[i], n); used.set(key, (used.get(key) || 0) + 1); });
        return { relation, points: [best.start, ...best.path.map(i => points[i]), best.end] };
    });
}
