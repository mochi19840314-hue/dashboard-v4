"use strict";
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.WorkloadEfficiencyAnalysis=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const num=value=>value!==""&&value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):null;
 const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
 const median=values=>{const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return null;const mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2};
 const clinical=(entry,...keys)=>keys.reduce((sum,key)=>sum+(num(entry?.[key]??entry?.clinical?.[key])||0),0);
 function workloadSource(entry={}){
  const patients=num(entry.patients)||0,newPatients=num(entry.newPatients??entry.clinical?.newPatients)||0;
  return {patients,newPatients,bloodTests:clinical(entry,"bloodTests"),imaging:clinical(entry,"imaging","xrays","ultrasounds"),healthChecks:clinical(entry,"healthChecks","healthCheck","checkups"),vaccines:clinical(entry,"vaccines","preventive"),trimming:clinical(entry,"trimming","trimmings"),secondOpinions:clinical(entry,"secondOpinions","secondOpinion"),surgeries:clinical(entry,"surgeries"),ICU:clinical(entry,"ICU","icu"),hospitalization:clinical(entry,"hospitalization"),emergency:clinical(entry,"emergency"),afterHours:clinical(entry,"afterHours"),consultationMinutes:num(entry.consultationMinutes)||0};
 }
 function daily(entry={},workloadResolver){
  const patients=num(entry.patients),sales=num(entry.sales);if(!entry.date||patients===null||patients<=0||sales===null||sales<0||typeof workloadResolver!=="function")return null;
  const workload=num(workloadResolver(workloadSource(entry)));if(workload===null||workload<=0)return null;
  const profitRate=num(entry.profitRate),unitPrice=sales/patients,salesPerLoad=sales/workload;
  // Existing dashboard semantics: >20 patients is already treated as high load in ClinicalEfficiency,
  // while ClinicalLearningEngine flags workload >80 as a workload-risk condition.
  const highLoad=patients>20||workload>80;
  return {date:String(entry.date),patients,sales,unitPrice,workload,salesPerLoad,profitRate,highLoad};
 }
 function analyze({month,entries=[],workloadResolver}={}){
  const rows=(Array.isArray(entries)?entries:[]).filter(entry=>String(entry?.date||"").startsWith(month||"")).map(entry=>daily(entry,workloadResolver)).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
  if(rows.length<4)return {ready:false,reason:`診療負荷と売上効率の比較には4営業日以上が必要です（現在${rows.length}営業日）。`,rows,highLoadDays:[],efficientDays:[],lowReturnDays:[]};
  const baseline={sales:median(rows.map(x=>x.sales)),workload:median(rows.map(x=>x.workload)),salesPerLoad:median(rows.map(x=>x.salesPerLoad)),unitPrice:median(rows.map(x=>x.unitPrice))};
  const highLoadDays=rows.filter(x=>x.highLoad);
  const lowReturnDays=highLoadDays.filter(x=>baseline.salesPerLoad!==null&&x.salesPerLoad<baseline.salesPerLoad*.9).sort((a,b)=>a.salesPerLoad-b.salesPerLoad);
  const efficientDays=rows.filter(x=>!x.highLoad&&baseline.salesPerLoad!==null&&x.salesPerLoad>=baseline.salesPerLoad*1.1).sort((a,b)=>b.salesPerLoad-a.salesPerLoad);
  const highLoadEfficiency=mean(highLoadDays.map(x=>x.salesPerLoad)),normalRows=rows.filter(x=>!x.highLoad),normalEfficiency=mean(normalRows.map(x=>x.salesPerLoad));
  let headline="診療負荷と売上効率は概ね均衡しています。",status="balanced";
  if(lowReturnDays.length){headline=`高負荷日のうち${lowReturnDays.length}日で、売上/負荷ptが月内中央値を10%以上下回りました。`;status="overload-low-return"}
  else if(highLoadDays.length&&highLoadEfficiency!==null&&normalEfficiency!==null&&highLoadEfficiency<normalEfficiency*.9){headline="高負荷日は、通常負荷日より売上/負荷ptが低い傾向です。";status="overload-efficiency-down"}
  else if(efficientDays.length){headline=`負荷を高めずに売上/負荷ptが高かった日を${efficientDays.length}日確認できました。`;status="efficient-pattern"}
  const best=efficientDays[0]||[...rows].sort((a,b)=>b.salesPerLoad-a.salesPerLoad)[0]||null,worst=lowReturnDays[0]||null;
  return {ready:true,rows,baseline,highLoadDays,efficientDays,lowReturnDays,highLoadEfficiency,normalEfficiency,best,worst,headline,status,notes:["売上/負荷ptは利益ではなく、保存済み売上を既存の診療負荷ポイントで割った運営効率の参考値です。","高負荷は既存仕様に合わせ、来院21件超または診療負荷80pt超で判定します。"]};
 }
 return {analyze,daily,workloadSource,median};
});
