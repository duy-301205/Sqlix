export interface ErdRelationship {
    fromTable: string;
    fromCol: string;
    toTable: string;
    toCol: string;
    fromColumns: string[];
    toColumns: string[];
}

type Column = { name: string; isPk?: boolean; isFk?: boolean; references?: unknown };
type Table = { name: string; columns?: Column[] };
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' ? value as RecordValue : {};
const names = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : typeof value === 'string' && value ? [value] : [];
const identifier = (value: string) => value.split('.').at(-1)!.replace(/["`\[\]]/g, '').toLowerCase();

export function resolveErdRelationships(tables: Table[], rawRelationships: unknown = []): ErdRelationship[] {
    const result: ErdRelationship[] = [];
    const add = (sourceName: string, sourceColumns: string[], targetName: string, targetColumns: string[]) => {
        const source = tables.find(table => identifier(table.name) === identifier(sourceName));
        const target = tables.find(table => identifier(table.name) === identifier(targetName));
        if (!source || !target) return;
        const from = sourceColumns.map(name => source.columns?.find(column => identifier(column.name) === identifier(name))?.name);
        const to = targetColumns.map(name => target.columns?.find(column => identifier(column.name) === identifier(name))?.name);
        if (!from.length || from.length !== to.length || from.some(name => !name) || to.some(name => !name)) return;
        const fromColumns = from as string[], toColumns = to as string[];
        if (result.some(rel => rel.fromTable === source.name && rel.toTable === target.name
            && fromColumns.every((name, index) => rel.fromColumns.includes(name) && rel.toColumns[rel.fromColumns.indexOf(name)] === toColumns[index]))) return;
        result.push({ fromTable: source.name, fromCol: fromColumns[0], toTable: target.name, toCol: toColumns[0], fromColumns, toColumns });
    };

    for (const raw of Array.isArray(rawRelationships) ? rawRelationships : []) {
        const relation = record(raw);
        const text = typeof raw === 'string' ? raw : typeof relation.relation === 'string' ? relation.relation : '';
        const arrow = text.match(/([\w]+)\.([\w]+)\s*->\s*([\w]+)\.([\w]+)/);
        if (arrow) { add(arrow[1], [arrow[2]], arrow[3], [arrow[4]]); continue; }
        if (typeof relation.fromTable !== 'string' || typeof relation.toTable !== 'string') continue;
        const source = tables.find(table => identifier(table.name) === identifier(relation.fromTable as string));
        const target = tables.find(table => identifier(table.name) === identifier(relation.toTable as string));
        const from = names(relation.fromColumns ?? relation.fromColumn ?? relation.fromCol);
        const to = names(relation.toColumns ?? relation.toColumn ?? relation.toCol);
        add(relation.fromTable, from.length ? from : names(source?.columns?.find(col => col.isFk)?.name),
            relation.toTable, to.length ? to : names(target?.columns?.find(col => col.isPk)?.name ?? 'id'));
    }

    const references: { table: string; column: string; target: string; targetColumn: string }[] = [];
    for (const table of tables) {
        for (const column of table.columns || []) {
            const ref = record(column.references);
            const text = typeof column.references === 'string' ? column.references : '';
            const parts = text.replace(/["`\[\]]/g, '').split('.');
            const target = parts.length >= 2 ? parts.at(-2) : ref.table ?? ref.tableName ?? ref.toTable;
            const targetColumn = parts.length >= 2 ? parts.at(-1) : ref.column ?? ref.columnName ?? ref.toColumn;
            if (typeof target === 'string' && typeof targetColumn === 'string') {
                references.push({ table: table.name, column: column.name, target, targetColumn });
                continue;
            }
            // Preserve compatibility with older schemas that only marked conventional *_id columns.
            if (!column.isFk && !column.name.endsWith('_id')) continue;
            const stem = column.name.replace(/_id$/, '').toLowerCase();
            const inferred = tables.find(other => other.name !== table.name
                && [stem, stem + 's', stem + 'es', stem.replace(/y$/, 'ies')].includes(other.name.toLowerCase()));
            if (inferred) add(table.name, [column.name], inferred.name, [inferred.columns?.find(col => col.isPk)?.name ?? 'id']);
        }
    }

    const consumed = new Set<typeof references[number]>();
    for (const reference of references) {
        if (consumed.has(reference)) continue;
        const target = tables.find(table => identifier(table.name) === identifier(reference.target));
        const primaryKeys = target?.columns?.filter(col => col.isPk).map(col => col.name) || [];
        const group = references.filter(item => item.table === reference.table && identifier(item.target) === identifier(reference.target));
        // A complete reference to a composite primary key is one FK, not separate invalid single-column keys.
        if (primaryKeys.length > 1 && group.length === primaryKeys.length
            && primaryKeys.every(key => group.filter(item => identifier(item.targetColumn) === identifier(key)).length === 1)) {
            const ordered = primaryKeys.map(key => group.find(item => identifier(item.targetColumn) === identifier(key))!);
            add(reference.table, ordered.map(item => item.column), reference.target, primaryKeys);
            group.forEach(item => consumed.add(item));
        } else {
            add(reference.table, [reference.column], reference.target, [reference.targetColumn]);
            consumed.add(reference);
        }
    }
    return result;
}
