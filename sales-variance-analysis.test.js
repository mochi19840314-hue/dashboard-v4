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

test("2026年8月のAI総評は数値の再掲ではなく経営判断と次月の確認事項を示す",()=>{
 const clinical=(revisits,bloodTests,xrays)=>({revisits,preventive:1,bloodTests,xrays,ultrasounds:0});
 const entries=[
  row("2025-08-01",{sales:100000,patients:10,newPatients:1,checkups:2,clinical:clinical(9,3,2)}),
  row("2025-08-02",{sales:100000,patients:10,newPatients:1,checkups:2,clinical:clinical(9,3,2)}),
  row("2026-08-01",{sales:60000,patients:9,newPatients:2,checkups:1,clinical:clinical(7,1,1)}),
  row("2026-08-02",{sales:60000,patients:9,newPatients:2,checkups:1,clinical:clinical(7,1,1)})
 ];
 const result=Analysis.analyze({month:"2026-08",entries}),summary=result.summary,all=[summary.judgment,...summary.points,...summary.priorities].join(" ");
 assert.match(summary.judgment,/患者数の減少以上に、客単価低下への対応.*再診患者の動き/);
 assert.match(summary.points[0],/画像検査・血液検査・健康診断.*同時に起きていないか確認する価値/);
 assert.deepEqual(summary.priorities,["再診患者数の推移を確認","必要症例への検査・健診提案状況を確認","新患が継続診療につながっているか確認"]);
 assert.doesNotMatch(all,/\d+(?:\.\d+)?(?:%|件|円|ポイント)|推定約|マイナス影響|プラス影響/);
 assert.equal(summary.points.length<=2,true);assert.equal(summary.priorities.length<=3,true);
});

test("患者数維持か増加かつ客単価低下では集患より診療構成を確認する",()=>{
 const result=compare({sales:96000,patients:12},{sales:100000,patients:10});
 assert.match(result.summary.judgment,/集患よりも診療内容や診療構成/);
 assert.match(result.summary.points.join(" "),/画像検査・血液検査・健康診断/);
});

test("患者数減少かつ客単価維持以上では来院数と継続診療を確認する",()=>{
 const result=compare({sales:108000,patients:9},{sales:100000,patients:10});
 assert.match(result.summary.judgment,/診療単価よりも、来院数と継続診療/);
 assert.match(result.summary.priorities[0],/新患・再診別/);
});

test("患者数と客単価がともに増加した場合は診療パターンの再現性を確認する",()=>{
 const result=compare({sales:150000,patients:12},{sales:100000,patients:10});
 assert.match(result.summary.judgment,/現在の診療パターンを維持し、再現性/);
 assert.match(result.summary.priorities[0],/好調日の患者構成と診療内容/);
});

test("比較データ不足を明示する",()=>{
 const result=Analysis.analyze({month:"2026-08",entries:[row("2026-08-01")]});
 assert.equal(result.comparison,null);assert.deepEqual(result.missing,["比較できる過去データがありません"]);
});
