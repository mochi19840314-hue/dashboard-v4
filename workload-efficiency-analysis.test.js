const test=require("node:test"),assert=require("node:assert/strict"),Analysis=require("./workload-efficiency-analysis"),Learning=require("./clinical-learning-engine");
const resolver=source=>Learning.calculateWorkload(source);
const row=(date,patients,sales,clinical={})=>({date,patients,sales,clinical});

test("23件で売上が伸びない日は高負荷・低効率として識別する",()=>{
 const entries=[
  row("2026-08-01",15,225000,{bloodTests:2,imaging:1}),
  row("2026-08-02",16,240000,{bloodTests:2,imaging:1}),
  row("2026-08-03",14,210000,{bloodTests:1,imaging:1}),
  row("2026-08-04",23,180000,{bloodTests:1})
 ];
 const result=Analysis.analyze({month:"2026-08",entries,workloadResolver:resolver});
 assert.equal(result.ready,true);
 assert.equal(result.lowReturnDays.length,1);
 assert.equal(result.lowReturnDays[0].patients,23);
 assert.match(result.headline,/高負荷日のうち1日/);
});

test("低めの負荷で売上効率が高い日を効率パターンとして拾う",()=>{
 const entries=[
  row("2026-08-01",15,150000,{bloodTests:2,imaging:1}),
  row("2026-08-02",16,160000,{bloodTests:2,imaging:1}),
  row("2026-08-03",17,170000,{bloodTests:2,imaging:1}),
  row("2026-08-04",12,220000,{bloodTests:1})
 ];
 const result=Analysis.analyze({month:"2026-08",entries,workloadResolver:resolver});
 assert.ok(result.efficientDays.some(x=>x.date==="2026-08-04"));
 assert.ok(result.best.salesPerLoad>=result.baseline.salesPerLoad);
});

test("手術や高負荷診療は既存のClinicalLearningEngine負荷計算を使う",()=>{
 const base=Analysis.daily(row("2026-08-01",10,180000,{}),resolver);
 const surgery=Analysis.daily(row("2026-08-02",10,180000,{surgeries:3}),resolver);
 assert.ok(surgery.workload>base.workload);
 assert.equal(surgery.workload,Learning.calculateWorkload(Analysis.workloadSource(row("2026-08-02",10,180000,{surgeries:3}))));
});

test("4営業日未満では無理に評価しない",()=>{
 const result=Analysis.analyze({month:"2026-08",entries:[row("2026-08-01",10,100000),row("2026-08-02",12,120000),row("2026-08-03",14,140000)],workloadResolver:resolver});
 assert.equal(result.ready,false);
 assert.match(result.reason,/4営業日以上/);
});

test("売上/負荷ptを利益と表現しない",()=>{
 const result=Analysis.analyze({month:"2026-08",entries:[row("2026-08-01",10,100000),row("2026-08-02",12,120000),row("2026-08-03",14,140000),row("2026-08-04",16,160000)],workloadResolver:resolver});
 assert.ok(result.notes.every(text=>!text.includes("利益効率")));
 assert.match(result.notes[0],/利益ではなく/);
});
