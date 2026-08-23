const test=require("node:test"),assert=require("node:assert/strict"),Summary=require("./daily-ai-summary");
const row=(date,sales,patients,extra={})=>({date,sales,patients,newPatients:2,clinical:{bloodTests:1,imaging:1,preventive:2},...extra});
test("好調日は少数の理由と対応不要を返し、未入力の利益率に触れない",()=>{const entries=[row("2026-08-11",180000,15),row("2026-08-12",190000,16),row("2026-08-13",170000,14),row("2026-08-14",230000,14)];const result=Summary.build({date:"2026-08-14",entries});assert.equal(result.evaluation,"好調");assert.ok(result.reasons.length<=3);assert.match(result.actions.join(""),/特に対応は必要ありません/);assert.equal(result.meta.profitRateUsed,false);assert.doesNotMatch(JSON.stringify(result),/利益率/)});
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
