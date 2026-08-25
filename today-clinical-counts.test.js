"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const Counts=require("./today-clinical-counts");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8"),css=fs.readFileSync("style.css","utf8");
for(const [metric,label] of [["preventive","予防"],["checkups","健康診断"],["imaging","画像検査"],["bloodTests","血液検査"],["surgeries","手術"],["trimming","トリミング"]]){
 test(`${label} + / - changes the existing clinical fields by one and never goes negative`,()=>{
  const entries=[{date:"2026-08-19",sales:100,clinical:{preventive:0,xrays:0,ultrasounds:0,bloodTests:0}}];
  assert.equal(Counts.update(entries,"2026-08-19",metric,1).value,1);
  assert.equal(Counts.value(entries[0],metric),1);
  assert.equal(Counts.update(entries,"2026-08-19",metric,-1).value,0);
  assert.equal(Counts.update(entries,"2026-08-19",metric,-1).value,0);
  assert.equal(entries[0].sales,100);
 });
}
test("imaging preserves the established xray/ultrasound structure",()=>{
 const entries=[{date:"2026-08-19",clinical:{xrays:0,ultrasounds:2,custom:7}}];
 Counts.update(entries,"2026-08-19","imaging",-1);
 assert.deepEqual(entries[0].clinical,{xrays:0,ultrasounds:1,custom:7});
 Counts.update(entries,"2026-08-19","imaging",1);
 assert.deepEqual(entries[0].clinical,{xrays:1,ultrasounds:1,custom:7});
});
test("only the selected past date changes and its monthly total follows it",()=>{
 const entries=[{date:"2026-08-18",clinical:{bloodTests:3}},{date:"2026-08-19",clinical:{bloodTests:5}}];
 const total=()=>entries.filter(e=>e.date.startsWith("2026-08")).reduce((sum,e)=>sum+Counts.value(e,"bloodTests"),0);
 assert.equal(total(),8); Counts.update(entries,"2026-08-18","bloodTests",1);
 assert.equal(entries[0].clinical.bloodTests,4); assert.equal(entries[1].clinical.bloodTests,5); assert.equal(total(),9);
});
test("all six increments survive storage serialization and can return to zero",()=>{
 const date="2026-08-19",entries=[];
 for(const metric of ["preventive","checkups","imaging","bloodTests","surgeries","trimming"])Counts.update(entries,date,metric,1);
 const restored=JSON.parse(JSON.stringify(entries));
 for(const metric of ["preventive","checkups","imaging","bloodTests","surgeries","trimming"]){assert.equal(Counts.value(restored[0],metric),1);assert.equal(Counts.update(restored,date,metric,-1).value,0);assert.equal(Counts.update(restored,date,metric,-1).value,0)}
});
test("summary has six uniform accessible steppers and autosaves the selected date",()=>{
 for(const metric of ["preventive","checkups","imaging","bloodTests","surgeries","trimming"]){assert.match(html,new RegExp(`data-metric="${metric}"`));assert.match(app,new RegExp(`TodayClinicalCounts\\.value\\(e,"${metric}"\\)`))}
 assert.match(app,/const date=summaryTargetDate\(\),result=TodayClinicalCounts\.update/);
 assert.match(app,/if\(!result\)return;save\(\)/);
 assert.doesNotMatch(app,/fillClinicalForm/);
 assert.match(app,/event\.target\.closest\("\[data-summary-clinical-step\]"\)/);
});
test("iPhone layout uses 48px controls, one-column rows, and no horizontal overflow",()=>{
 assert.match(css,/today-clinical-counts button\{min-width:48px;min-height:48px/);
 assert.match(css,/@media\(max-width:520px\)\{\.today-clinical-counts\{grid-template-columns:1fr\}/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(190px,1\.25fr\)/);
});

test("top-level surgery and trimming fields stay compatible with existing aggregates",()=>{
 const entries=[{date:"2026-08-19",surgeries:2,trimming:4,checkups:9,clinical:{preventive:3}}];
 Counts.update(entries,"2026-08-19","surgeries",1); Counts.update(entries,"2026-08-19","trimming",-1);
 assert.deepEqual(entries[0],{date:"2026-08-19",surgeries:3,trimming:3,checkups:9,clinical:{preventive:3}});
});
