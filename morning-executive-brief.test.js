const test=require("node:test"),assert=require("node:assert/strict"),Brief=require("./morning-executive-brief");
const date=index=>`2026-08-${String(index+1).padStart(2,"0")}`;
const row=(index,values={})=>({date:date(index),sales:200000,patients:20,newPatients:3,checkups:1,surgeries:0,clinical:{bloodTests:1,xrays:0,ultrasounds:0,preventive:2},...values});
const history=()=>Array.from({length:10},(_,index)=>row(index,{sales:index>=5?220000:200000,patients:20}));

test("朝の0件状態は予測せず、目標から今日の目安を逆算する",()=>{const r=Brief.build({date:"2026-08-18",hour:8,entries:history(),target:5000000,sales:2400000,remainingBusinessDays:9});assert.equal(r.mode,"morning");assert.equal(r.guide.amount,288889);assert.equal(r.guide.note,"月間目標から逆算");assert.doesNotMatch(JSON.stringify(r),/期待利益|成功率/);assert.match(r.comment,/直近|今日は/)});

test("朝のAIコメントは傾向と観察に限定し、診療行為を指示しない",()=>{const r=Brief.build({date:"2026-08-18",hour:8,entries:history()});assert.match(r.comment,/記録|観察|確認/);assert.doesNotMatch(r.comment,/提案しましょう|優先しましょう|行ってください|案内しましょう|必要な診療/);assert.ok(r.comment.split("。").filter(Boolean).length<=3)});

test("必要日商と直近平均の差は進捗低下と断定しない",()=>{const options={date:"2026-08-18",hour:8,entries:history(),target:6000000,sales:2000000};const normal=Brief.build({...options,remainingBusinessDays:10}),monthEnd=Brief.build({...options,remainingBusinessDays:4});assert.equal(normal.warning.label,"必要日商が上昇");assert.equal(monthEnd.warning.label,"月末目標に注意");assert.doesNotMatch(`${normal.warning.label}${monthEnd.warning.label}`,/目標達成ペース低下/)});

test("通常営業日は直近平均と同曜日を比較して自然に要約する",()=>{const rows=history(),today={...row(17),date:"2026-08-18"},r=Brief.build({date:today.date,hour:17,entries:[...rows,today],todayEntry:today});assert.equal(r.mode,"review");assert.match(r.comment,/今日は20件/);assert.ok(r.comment.split("。").filter(Boolean).length<=3);assert.equal(r.warning.label,"特になし")});

test("高客単価日は患者数でなく診療構成の可能性を示す",()=>{const rows=history(),today={...row(17),date:"2026-08-18",sales:400000,patients:20,clinical:{bloodTests:4,xrays:2,ultrasounds:1}},r=Brief.build({date:today.date,entries:[...rows,today],todayEntry:today});assert.match(r.comment,/客単価.*高く/);assert.match(r.comment,/診療構成が売上を支えた可能性/);assert.doesNotMatch(r.priority.reason,/増や/) });

test("低来院日は明確な注意として表示する",()=>{const rows=history(),today={...row(17),date:"2026-08-18",sales:80000,patients:6},r=Brief.build({date:today.date,entries:[...rows,today],todayEntry:today});assert.equal(r.warning.label,"来院数低下");assert.equal(r.priority.label,"来院数");assert.match(r.comment,/少なく/) });

test("LearningはKPIとの再現性がある場合だけ採用する",()=>{const rows=Array.from({length:8},(_,i)=>row(i,i%2?{clinicalTags:["腎臓"],sales:300000,clinical:{bloodTests:4}}:{})),r=Brief.build({date:"2026-08-18",entries:rows,learning:{theme:"腎臓"}});assert.match(r.comment,/腎臓.*(客単価|血液検査|売上)/)});

test("Learningなし・データ不足は不明と認める",()=>{const r=Brief.build({date:"2026-08-18",entries:[row(0)]});assert.match(r.comment,/判断材料が不足|関連を確認できません/);assert.equal(r.priority.label,"判断材料の蓄積")});

test("休診日は無理をしないテーマへ切り替える",()=>{const r=Brief.build({date:"2026-08-18",closed:true,entries:history()});assert.equal(r.mode,"closed");assert.equal(r.priority.label,"無理をしない")});
test("保存履歴のJSON互換を維持する",()=>{assert.equal(Brief.normalizeHistory(null).length,0);assert.deepEqual(Brief.normalizeBrief({items:[1,2,3,4,5,6]}).items,[1,2,3,4,5])});
