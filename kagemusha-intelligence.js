"use strict";
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.KagemushaIntelligence=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const n=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
 const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
 const date=v=>{const [y,m,d]=String(v||"").split("-").map(Number);return new Date(y,m-1,d,12)};
 const unit=e=>n(e?.patients)?n(e?.sales)/n(e?.patients):0;
 const clinical=(e,...keys)=>keys.reduce((s,k)=>s+n(e?.[k]??e?.clinical?.[k]),0);
 const recorded=e=>e&&/^\d{4}-\d{2}-\d{2}$/.test(String(e.date||""))&&(n(e.sales)>0||n(e.patients)>0);
 function context(entries,today){
  const rows=(Array.isArray(entries)?entries:[]).filter(recorded).filter(e=>e.date<today).sort((a,b)=>b.date.localeCompare(a.date));
  const weekday=date(today).getDay(),same=rows.filter(e=>date(e.date).getDay()===weekday).slice(0,8),recent=rows.slice(0,10);
  const base=same.length>=3?same:recent;
  return {sampleSize:base.length,patients:avg(base.map(e=>n(e.patients)).filter(Boolean)),sales:avg(base.map(e=>n(e.sales)).filter(Boolean)),unitPrice:avg(base.map(unit).filter(Boolean)),clinical:{bloodTests:avg(base.map(e=>clinical(e,"bloodTests"))),imaging:avg(base.map(e=>clinical(e,"imaging","xrays","ultrasounds"))),checkups:avg(base.map(e=>clinical(e,"healthChecks","healthCheck","checkups"))),surgeries:avg(base.map(e=>clinical(e,"surgeries"))),trimming:avg(base.map(e=>clinical(e,"trimming","trimmings")))}};
 }
 function analyze({entries=[],today,monthlyTarget=0,monthSales=0,remainingBusinessDays=0,workload=null}={}){
  today=today||new Date().toLocaleDateString("sv-SE");const current=(Array.isArray(entries)?entries:[]).find(e=>e?.date===today)||{},base=context(entries,today),signals=[];
  const patients=n(current.patients),sales=n(current.sales),price=unit(current),required=remainingBusinessDays>0&&n(monthlyTarget)>n(monthSales)?(n(monthlyTarget)-n(monthSales))/remainingBusinessDays:0;
  if(base.sampleSize>=3&&patients&&base.patients){const d=(patients/base.patients-1)*100;if(Math.abs(d)>=15)signals.push({key:"patients",severity:Math.abs(d),direction:d>0?"high":"low",text:`来院数が基準比${Math.round(Math.abs(d))}%${d>0?"多い":"少ない"}`})}
  if(base.sampleSize>=3&&price&&base.unitPrice){const d=(price/base.unitPrice-1)*100;if(Math.abs(d)>=12)signals.push({key:"unitPrice",severity:Math.abs(d)*1.1,direction:d>0?"high":"low",text:`客単価が基準比${Math.round(Math.abs(d))}%${d>0?"高い":"低い"}`})}
  if(Number.isFinite(Number(workload))&&Number(workload)>80)signals.push({key:"workload",severity:35,direction:"high",text:`診療負荷${Math.round(Number(workload))}ptで高負荷`});
  if(required&&sales<required*.55)signals.push({key:"progress",severity:25,direction:"low",text:`売上は必要日商の${Math.round(sales/required*100)}%`});
  const composition={bloodTests:clinical(current,"bloodTests"),imaging:clinical(current,"imaging","xrays","ultrasounds"),checkups:clinical(current,"healthChecks","healthCheck","checkups"),surgeries:clinical(current,"surgeries"),trimming:clinical(current,"trimming","trimmings")};
  if(base.sampleSize>=3)Object.keys(composition).forEach(key=>{const b=base.clinical[key],v=composition[key];if(b>=1&&v<b*.5)signals.push({key:`clinical:${key}`,severity:15,direction:"low",text:`${key}が通常より少ない`})});
  signals.sort((a,b)=>b.severity-a.severity);const primary=signals[0]||null;
  let action="今の診療ペースを維持し、記録を正確に残す";
  if(primary?.key==="workload"||primary?.key==="patients"&&primary.direction==="high")action="診療負荷を上げず、必要な検査・説明時間を確保する";
  else if(primary?.key==="unitPrice"&&primary.direction==="low")action="医学的に必要な検査・健診の提案漏れだけ確認する";
  else if(primary?.key==="progress")action="売上を追わず、未実施の必要検査・再診フォローを確認する";
  else if(primary?.key?.startsWith("clinical:"))action="診療構成の偏りが症例構成によるものか、提案漏れによるものか1回確認する";
  return {ready:base.sampleSize>=3,baseline:base,current:{patients,sales,unitPrice:price,workload:Number.isFinite(Number(workload))?Number(workload):null,composition},signals:signals.slice(0,3),primary,action,reason:primary?primary.text:`比較可能な${base.sampleSize}営業日では大きな偏りを検出していません。`};
 }
 return {analyze,context};
});
