"use strict";
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TodayOneAction=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
const n=value=>{const parsed=Number(value);return Number.isFinite(parsed)?Math.max(0,parsed):0};
const date=value=>{const [y,m,d]=String(value||"").split("-").map(Number);return new Date(y,m-1,d,12)};
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
const pct=value=>`${Math.abs(Math.round(Number(value)||0))}%`;
const yen=value=>`${Math.round(n(value)).toLocaleString("ja-JP")}円`;
const recorded=e=>e&&/^\d{4}-\d{2}-\d{2}$/.test(String(e.date||""))&&(n(e.sales)>0||n(e.patients)>0);
const unit=e=>n(e.patients)>0?n(e.sales)/n(e.patients):0;
function sameWeekday(entries,today){const weekday=date(today).getDay();return entries.filter(e=>recorded(e)&&e.date<today&&date(e.date).getDay()===weekday).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4)}
function evidenceFor(entries,today,metric){const rows=sameWeekday(entries,today),values=rows.map(e=>metric==="sales"?n(e.sales):metric==="patients"?n(e.patients):unit(e)).filter(v=>v>0);if(values.length<2)return null;return {sampleSize:values.length,average:mean(values)} }
function build(input={}){try{
 const today=input.today||new Date().toLocaleDateString("sv-SE"),hour=Number.isFinite(Number(input.hour))?Number(input.hour):new Date().getHours(),entries=Array.isArray(input.entries)?input.entries.filter(e=>e&&typeof e==="object"):[],todayEntry=entries.find(e=>e.date===today)||{},phase=hour<12?"morning":hour<18?"midday":"evening",monthlyTarget=n(input.monthlyTarget),monthSales=n(input.monthSales),remainingBusinessDays=Math.max(0,Number(input.remainingBusinessDays)||0),requiredDaily=remainingBusinessDays&&monthlyTarget>monthSales?(monthlyTarget-monthSales)/remainingBusinessDays:0;
 const salesEvidence=evidenceFor(entries,today,"sales"),patientEvidence=evidenceFor(entries,today,"patients"),unitEvidence=evidenceFor(entries,today,"unitPrice");
 if(phase==="morning"){
  if(patientEvidence){return {phase,title:"今日の一手",action:`予約と来院の流れを確認し、${Math.round(patientEvidence.average)}件前後を無理なく診られる体制を先に整える`,reason:`過去${patientEvidence.sampleSize}回の同曜日平均は${Math.round(patientEvidence.average)}件です。`,evidence:{metric:"patients",...patientEvidence}}}
  if(requiredDaily>0)return {phase,title:"今日の一手",action:`今日の日商${yen(requiredDaily)}を目安に、必要な検査・健診の案内漏れをなくす`,reason:`月間目標までを残り${remainingBusinessDays}営業日で割ると、1日平均${yen(requiredDaily)}が目安です。`,evidence:{metric:"requiredDailySales",value:requiredDaily,remainingBusinessDays}};
  return {phase,title:"今日の一手",action:"今日の診療実績を正確に1回入力する",reason:"比較に必要な同曜日データを蓄積中です。",evidence:{metric:"learning",sampleSize:0}};
 }
 if(phase==="midday"){
  const currentPatients=n(todayEntry.patients),currentSales=n(todayEntry.sales),currentUnit=unit(todayEntry);
  if(patientEvidence&&currentPatients>0){const ratio=(currentPatients/patientEvidence.average-1)*100;if(ratio>=15)return {phase,title:"今日の一手",action:"午後は診療負荷を上げすぎず、必要な検査・説明の抜けを防ぐ",reason:`午前時点の来院${currentPatients}件は、同曜日平均${Math.round(patientEvidence.average)}件に対して${pct(ratio)}多い水準です。`,evidence:{metric:"patients",current:currentPatients,changePercent:ratio,...patientEvidence}}}
  if(unitEvidence&&currentUnit>0){const ratio=(currentUnit/unitEvidence.average-1)*100;if(ratio<=-15)return {phase,title:"今日の一手",action:"午後は診療内容を見直し、医学的に必要な検査・健診の提案漏れだけ確認する",reason:`午前の客単価${yen(currentUnit)}は同曜日平均${yen(unitEvidence.average)}より${pct(ratio)}低い水準です。`,evidence:{metric:"unitPrice",current:currentUnit,changePercent:ratio,...unitEvidence}}}
  if(requiredDaily>0&&currentSales<requiredDaily*.45)return {phase,title:"今日の一手",action:"午後は売上を追うのではなく、未実施の必要検査・健診提案がないか1件ずつ確認する",reason:`午前売上${yen(currentSales)}に対し、今日の目安は${yen(requiredDaily)}です。`,evidence:{metric:"sales",current:currentSales,target:requiredDaily}};
  return {phase,title:"今日の一手",action:"午後も今の診療ペースを維持し、記録だけ正確に残す",reason:"午前時点では大きな偏りを検出していません。",evidence:{metric:"stable"}};
 }
 const currentSales=n(todayEntry.sales),currentPatients=n(todayEntry.patients),currentUnit=unit(todayEntry);
 if(salesEvidence&&currentSales>0){const ratio=(currentSales/salesEvidence.average-1)*100;if(Math.abs(ratio)>=15)return {phase,title:"今日の一手",action:"今日の差が来院数・客単価・診療構成のどこから出たかメモを1行残す",reason:`今日の売上${yen(currentSales)}は同曜日平均${yen(salesEvidence.average)}より${pct(ratio)}${ratio>=0?"高い":"低い"}結果です。`,evidence:{metric:"sales",current:currentSales,changePercent:ratio,...salesEvidence}}}
 if(unitEvidence&&currentUnit>0){const ratio=(currentUnit/unitEvidence.average-1)*100;if(Math.abs(ratio)>=15)return {phase,title:"今日の一手",action:"客単価の差につながった診療内容を1つ記録する",reason:`今日の客単価${yen(currentUnit)}は同曜日平均${yen(unitEvidence.average)}より${pct(ratio)}${ratio>=0?"高い":"低い"}結果です。`,evidence:{metric:"unitPrice",current:currentUnit,changePercent:ratio,...unitEvidence}}}
 return {phase,title:"今日の一手",action:"今日の特徴を1行メモして終了する",reason:currentPatients?`本日は${currentPatients}件、売上${yen(currentSales)}でした。大きな偏りは検出していません。`:"本日の実績が未入力です。",evidence:{metric:"summary",patients:currentPatients,sales:currentSales}};
 }catch(error){return {phase:"unknown",title:"今日の一手",action:"今日の診療実績を入力する",reason:"安全に分析できるデータが不足しています。",evidence:{metric:"fallback"}}}}
return {build};
});
