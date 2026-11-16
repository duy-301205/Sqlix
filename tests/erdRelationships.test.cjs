const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const moduleObject = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../app/practice/[id]/components/erdRelationships.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module: moduleObject, exports: moduleObject.exports });
const { resolveErdRelationships } = moduleObject.exports;
const pk = name => ({ name, isPk: true });
const fk = (name, references, primary = false) => ({ name, isFk: true, isPk: primary, references });

test('company schema recognizes nine FKs including self-reference and a composite key', () => {
    const tables = [
        { name: 'phongban', columns: [pk('maphg'), fk('trphg', 'nhanvien.manv')] },
        { name: 'nhanvien', columns: [pk('manv'), fk('ma_nql', 'nhanvien.manv'), fk('phg', 'phongban.maphg')] },
        { name: 'diadiem_phg', columns: [fk('maphg', 'phongban.maphg', true), pk('diadiem')] },
        { name: 'dean', columns: [pk('mada'), fk('phong', 'phongban.maphg')] },
        { name: 'congviec', columns: [fk('mada', 'dean.mada', true), pk('stt')] },
        { name: 'phancong', columns: [fk('ma_nvien', 'nhanvien.manv', true), fk('mada', 'congviec.mada', true), fk('stt', 'congviec.stt', true)] },
        { name: 'thannhan', columns: [fk('ma_nvien', 'nhanvien.manv', true), pk('tentn')] },
    ];
    const relations = resolveErdRelationships(tables);
    assert.equal(relations.length, 9);
    assert.ok(relations.some(rel => rel.fromTable === 'nhanvien' && rel.toTable === 'nhanvien' && rel.fromCol === 'ma_nql'));
    const composite = relations.find(rel => rel.fromTable === 'phancong' && rel.toTable === 'congviec');
    assert.equal(composite.fromColumns.join(','), 'mada,stt');
    assert.equal(composite.toColumns.join(','), 'mada,stt');
});

const messages = [
    { name: 'users', columns: [pk('id')] },
    { name: 'messages', columns: [pk('id'), fk('sender_id', 'users.id'), fk('recipient_id', { table: 'users', column: 'id' })] },
];
test('different FKs between the same tables remain separate', () => {
    const relations = resolveErdRelationships(messages);
    assert.equal(relations.length, 2);
    assert.equal(new Set(relations.map(rel => rel.fromCol)).size, 2);
});
test('legacy explicit relationship formats deduplicate against column references', () => {
    assert.equal(resolveErdRelationships(messages, ['messages.sender_id -> users.id']).length, 2);
    assert.equal(resolveErdRelationships(messages, [{ fromTable: 'messages', fromColumn: 'sender_id', toTable: 'users', toColumn: 'id' }]).length, 2);
});
test('invalid target columns do not produce misleading diagram edges', () => {
    assert.equal(resolveErdRelationships([
        { name: 'users', columns: [pk('id')] },
        { name: 'orders', columns: [fk('owner', 'users.missing')] },
    ]).length, 0);
});
