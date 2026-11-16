const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(name){const m={exports:{}};new Function('module','exports',ts.transpileModule(fs.readFileSync(`app/practice/[id]/components/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);return m.exports;}
const {layoutErd,routeErd}=load('erdLayout');
const {resolveErdRelationships}=load('erdRelationships');
function verify(tables){
 const rel=resolveErdRelationships(tables), rect=layoutErd(tables,rel), routes=routeErd(tables,rect,rel);
 assert.deepEqual(layoutErd([...tables].reverse(),rel),rect);
 assert.equal(routes.length,rel.length);
 const all=Object.values(rect);
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j];assert.ok(a.left+a.width<=b.left||b.left+b.width<=a.left||a.top+a.height<=b.top||b.top+b.height<=a.top,'tables overlap');}
 for(const route of routes)for(let i=1;i<route.points.length;i++){
 const a=route.points[i-1],b=route.points[i];assert.ok(a.x===b.x||a.y===b.y);
 for(const r of all){const crosses=a.x===b.x?a.x>r.left&&a.x<r.left+r.width&&Math.max(a.y,b.y)>r.top&&Math.min(a.y,b.y)<r.top+r.height:a.y>r.top&&a.y<r.top+r.height&&Math.max(a.x,b.x)>r.left&&Math.min(a.x,b.x)<r.left+r.width;assert.ok(!crosses,'line crosses table');}
 }
}
const pk={name:'id',isPk:true};
for(const shape of ['chain','star','cycle','disconnected'])test(`generic ${shape} layout avoids tables`,()=>verify(Array.from({length:12},(_,i)=>({name:`table${i}`,columns:[pk,...(i&&shape!=='disconnected'?[{name:'parent',isFk:true,references:`table${shape==='star'?0:i-1}.id`}]:[]),...(shape==='cycle'&&!i?[{name:'parent',isFk:true,references:'table11.id'}]:[]),...Array.from({length:i%7},(_,j)=>({name:`field${j}`}))]}))));
test('self reference and multiple foreign keys',()=>verify([{name:'employee',columns:[pk,{name:'manager',isFk:true,references:'employee.id'},{name:'mentor',isFk:true,references:'employee.id'}]}]));
test('empty schema',()=>verify([]));
const company = [
 ['phongban',4,[['trphg','nhanvien.manv']],'maphg'],
 ['nhanvien',10,[['ma_nql','nhanvien.manv'],['phg','phongban.maphg']],'manv'],
 ['diadiem_phg',2,[['maphg','phongban.maphg']],'diadiem'],
 ['dean',4,[['phong','phongban.maphg']],'mada'],
 ['congviec',3,[['mada','dean.mada']],'stt'],
 ['phancong',4,[['ma_nvien','nhanvien.manv'],['mada','congviec.mada'],['stt','congviec.stt']],'id'],
 ['thannhan',5,[['ma_nvien','nhanvien.manv']],'tentn'],
].map(([name,count,refs,key])=>({name,columns:[{name:key,isPk:true},...refs.map(([name,references])=>({name,isFk:true,isPk:name==='mada',references})),...Array.from({length:Math.max(0,count-refs.length-1)},(_,i)=>({name:`field${i}`}))]}));
test('company graph with cyclic department and employee relationships',()=>verify(company));
