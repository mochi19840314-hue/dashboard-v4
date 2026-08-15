const test=require("node:test"),assert=require("node:assert/strict"),Result=require("./today-result");
const entry={date:"2026-08-15",sales:120000,patients:10,newPatients:1,checkups:1,clinical:{xrays:2,ultrasounds:2}};
const history=Array.from({length:5},(_,i)=>({date:`2026-08-${10+i}`,sales:100000,patients:10}));
test("18時前は詳細不足なら結果を表示しない",()=>assert.equal(Result.build({hour:17,entry:{...entry,newPatients:0,checkups:0,clinical:{}},history}).visible,false));
test("18時以降は当日データから最大3項目を自動評価する",()=>{const result=Result.build({hour:18,entry,history,target:130000});assert.equal(result.visible,true);assert.ok(result.items.length<=3);assert.deepEqual(result.items[0],{label:"客単価",value:"＋20%"})});
test("当日データ不足時は夜も結果を出さない",()=>assert.equal(Result.build({hour:20,entry:{date:"2026-08-15",sales:0,patients:0},history}).visible,false));
