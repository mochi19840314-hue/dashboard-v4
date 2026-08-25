const test=require("node:test"),assert=require("node:assert/strict"),Summary=require("./daily-ai-summary");
const row=(date,sales,patients,extra={})=>({date,sales,patients,newPatients:2,clinical:{bloodTests:1,imaging:1,preventive:2},...extra});
test("好調日は理由を最大2つに絞り、未入力の利益率に触れない",()=>{const entries=[row("2026-08-11",180000,15),row("2026-08-12",190000,16),row("2026-08-13",170000,14),row("2026-08-14",230000,14)];const result=Summary.build({date:"2026-08-14",entries});assert.equal(result.evaluation,"好調");assert.ok(result.reasons.length<=2);assert.match(result.actions.join(""),/今後の営業日と比較/);assert.equal(result.meta.profitRateUsed,false);assert.doesNotMatch(JSON.stringify(result),/利益率/)});
test("患者数0の休診・欠損日は評価せず、過去平均にも含めない",()=>{const result=Summary.build({date:"2026-08-14",entries:[row("2026-08-12",180000,15),row("2026-08-13",0,0),row("2026-08-14",0,0)]});assert.equal(result.evaluation,"評価保留");assert.match(result.judgment[0],/評価から除外/)});
test("少数データや低検査率から悪化・検査増を断定しない",()=>{const result=Summary.build({date:"2026-08-14",entries:[row("2026-08-13",200000,16),row("2026-08-14",120000,10,{clinical:{bloodTests:0,imaging:0}})]});assert.match(result.judgment.join(""),/断定しません/);assert.match(result.judgment.join(""),/増やす必要があるとは判断しません/);assert.doesNotMatch(result.actions.join(""),/検査.*増/)});

test("健康診断率は血液検査率と分離し、患者数に対する割合で計算する",()=>{
 const result=Summary.metrics({patients:20,checkups:3,clinical:{bloodTests:7,preventive:2}});
 assert.equal(result.checkupRate,15);assert.equal(result.bloodRate,35);assert.equal(result.preventiveRate,10);
});
test("健康診断率が低いだけでは改善材料にせず、過去平均との差と継続低下が揃った場合だけ総評に含める",()=>{
 const checkupRow=(date,patients,checkups)=>({date,patients,sales:100000,checkups});
 const stable=[checkupRow("2026-08-01",20,4),checkupRow("2026-08-02",20,4),checkupRow("2026-08-03",20,4),checkupRow("2026-08-04",20,4)];
 const low=Summary.build({date:"2026-08-05",entry:checkupRow("2026-08-05",20,0),entries:[...stable,checkupRow("2026-08-05",20,0)]});
 assert.equal(low.meta.checkup.corroborated,false);assert.doesNotMatch(low.judgment.join(" "),/健康診断率/);
 const falling=[checkupRow("2026-08-01",20,8),checkupRow("2026-08-02",20,6),checkupRow("2026-08-03",20,4),checkupRow("2026-08-04",20,2)],today=checkupRow("2026-08-05",20,1);
 const result=Summary.build({date:today.date,entry:today,entries:[...falling,today]});
 assert.equal(result.meta.checkup.corroborated,true);assert.match(result.judgment.join(" "),/健康診断率5\.0%/);
});

const history=(sales=143000,patients=17,unitSales=sales)=>[
 row("2026-08-10",unitSales,patients),row("2026-08-11",unitSales,patients),row("2026-08-12",unitSales,patients)
];
test("売上増・患者数減・客単価増は診療効率が良い可能性を示す",()=>{
 const today=row("2026-08-13",248890,14),result=Summary.build({date:today.date,entry:today,entries:[...history(),today],snapshots:[{date:today.date,doctorWorkload:50}]});
 assert.equal(result.meta.efficiency.pattern,"high_sales_low_load");assert.match(result.judgment.join(""),/診療効率の良い日だった可能性/);assert.doesNotMatch(JSON.stringify(result),/軽め|特に対応は必要ありません/);
});
test("売上増・患者数増・高負荷は好調だが負荷と再現性に注意する",()=>{
 const today=row("2026-08-13",250000,22),result=Summary.build({date:today.date,entry:today,entries:[...history(),today],snapshots:[{date:today.date,doctorWorkload:85}]});
 assert.equal(result.evaluation,"好調");assert.equal(result.meta.efficiency.pattern,"high_sales_high_load");assert.match(result.judgment.join(""),/負荷も高い.*再現性/);
});
test("売上減・患者数通常・客単価減は客単価と診療構成を確認する",()=>{
 const today=row("2026-08-13",110000,17),result=Summary.build({date:today.date,entry:today,entries:[...history(),today]});
 assert.equal(result.meta.efficiency.pattern,"low_sales_low_unit");assert.match(result.judgment.join(""),/診療内容・客単価/);assert.match(result.actions.join(""),/客単価と診療構成/);
});
test("売上減・患者数減は来院数減少を主因候補にする",()=>{
 const today=row("2026-08-13",90000,11),result=Summary.build({date:today.date,entry:today,entries:[...history(),today]});
 assert.equal(result.meta.efficiency.pattern,"low_sales_low_patients");assert.match(result.judgment.join(""),/来院数の減少.*主な候補/);
});
test("効率パターンは複数営業日で再現するまで確定しない",()=>{
 const today=row("2026-08-13",248890,14),once=Summary.build({date:today.date,entry:today,entries:[...history(),today],snapshots:[{date:today.date,doctorWorkload:50}]});
 assert.equal(once.meta.efficiency.reproducible,false);const repeated=Summary.build({date:today.date,entry:today,entries:[...history(),today],snapshots:[{date:today.date,doctorWorkload:50}],efficiencyHistory:[{pattern:"high_sales_low_load"},{pattern:"high_sales_low_load"}]});assert.equal(repeated.meta.efficiency.reproducible,true);
});
