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

const compare=(current,baseline={})=>Analysis.analyze({month:"2026-08",entries:[row("2025-08-01",baseline),row("2026-08-01",current)]});

test("売上減少月は影響額最大の項目を主因候補にし、減少要因を金額で示す",()=>{
 const result=compare({sales:50000,patients:8,newPatients:2,trimmings:20},{sales:100000,patients:10,newPatients:1,trimmings:0});
 assert.match(result.summary.conclusion,/下回っています.*客単価.*最も大きい主因候補/);
 assert.match(result.summary.decrease,/客単価.*推定約.*万円のマイナス影響/);
 assert.match(result.summary.increase,/新患数.*増加.*売上を支えた可能性/);
 assert.match(result.summary.next,/診療構成.*再診患者/);
});

test("売上増加月は増加側の最大推定影響を主因候補にする",()=>{
 const result=compare({sales:150000,patients:12},{sales:100000,patients:10});
 assert.match(result.summary.conclusion,/上回っています.*客単価.*主因候補/);
 assert.match(result.summary.increase,/プラス影響/);
});

test("患者数減少と客単価上昇をそれぞれ断定せず説明する",()=>{
 const result=compare({sales:108000,patients:9},{sales:100000,patients:10});
 assert.match(result.summary.decrease,/患者数.*マイナス影響/);
 assert.match(result.summary.increase,/客単価.*プラス影響.*因果関係は断定できません/);
 assert.match(result.summary.next,/新患・再診/);
});

test("患者数増加と客単価低下では客単価確認を案内する",()=>{
 const result=compare({sales:96000,patients:12},{sales:100000,patients:10});
 assert.match(result.summary.decrease,/客単価.*マイナス影響/);
 assert.match(result.summary.increase,/患者数.*プラス影響/);
 assert.match(result.summary.next,/画像検査・血液検査・健康診断/);
});

test("比較データ不足を明示する",()=>{
 const result=Analysis.analyze({month:"2026-08",entries:[row("2026-08-01")]});
 assert.equal(result.comparison,null);assert.deepEqual(result.missing,["比較できる過去データがありません"]);
});
