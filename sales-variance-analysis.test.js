const test=require("node:test"),assert=require("node:assert/strict"),Analysis=require("./sales-variance-analysis");
const row=(date,overrides={})=>({date,sales:100000,patients:10,newPatients:1,checkups:1,surgeries:0,trimmings:0,clinical:{revisits:8,preventive:2,bloodTests:2,xrays:1,ultrasounds:0},...overrides});

test("前年同月を優先し、同じ保存営業日数で比較する",()=>{
 const entries=[row("2025-08-01"),row("2025-08-02"),row("2025-08-03",{sales:900000}),row("2026-07-01"),row("2026-08-01",{sales:120000,patients:8}),row("2026-08-02",{sales:120000,patients:8})];
 const result=Analysis.analyze({month:"2026-08",entries});
 assert.equal(result.comparison.type,"year");assert.equal(result.baseline.sales,200000);assert.equal(result.salesDelta,40000);assert.equal(result.baseline.days,2);
 assert.ok(result.positive.some(item=>item.key==="unit"));assert.ok(result.negative.some(item=>item.key==="patients"));
});

test("前年がなければ前月、さらに無ければ直近月平均を選ぶ",()=>{
 assert.equal(Analysis.chooseComparison("2026-08",[row("2026-07-01")]).type,"previous");
 assert.equal(Analysis.chooseComparison("2026-08",[row("2026-06-01"),row("2026-05-01")]).type,"average");
});

test("未入力と保存済み0件を区別し、診療項目を金額換算しない",()=>{
 const entries=[row("2025-08-01",{checkups:0,clinical:{bloodTests:0}}),row("2026-08-01",{checkups:undefined,clinical:{bloodTests:3}})];
 const result=Analysis.analyze({month:"2026-08",entries});
 assert.ok(result.missing.some(text=>text.includes("健康診断件数")));assert.ok(result.positive.some(item=>item.key==="bloodTests"));
 assert.ok(result.impacts.every(item=>!item.name.includes("血液検査")));
});
