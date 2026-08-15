(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.LearningInsights=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const EMPTY="現在も診療データを学習中です。\n明確な傾向が確認できると表示します。",MIN_DAYS=15,MIN_DIFFERENCE=8,MIN_GROUP_DAYS=3;
 const number=value=>Number.isFinite(Number(value))?Number(value):0,average=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
 const clinical=(entry,key)=>number(entry?.clinical?.[key]),unit=entry=>number(entry.patients)>0?number(entry.sales)/number(entry.patients):0;
 const SIGNALS=[
  {key:"surgery",label:"手術を実施した",test:e=>number(e.surgeries)>0,hint:"外科適応がある症例や術前検査の必要性を改めて確認しましょう。"},
  {key:"checkup",label:"健康診断を実施した",test:e=>number(e.checkups)>0,hint:"健診後のフォロー予定や、必要な再診案内に漏れがないか確認しましょう。"},
  {key:"imaging",label:"画像検査を実施した",test:e=>clinical(e,"xrays")+clinical(e,"ultrasounds")>0,hint:"画像検査の適応がある症例を見逃していないか確認しましょう。"},
  {key:"blood",label:"血液検査を実施した",test:e=>clinical(e,"bloodTests")>0,hint:"血液検査の適応がある症例で、必要性の確認に漏れがないか見直しましょう。"},
  {key:"revisit",label:"再診の来院があった",test:e=>number(e.patients)>number(e.newPatients),hint:"フォローが必要な症例の再診予定や案内に漏れがないか確認しましょう。"},
  {key:"senior",label:"シニア診療の記録があった",test:e=>number(e.seniorPatients)>0,hint:"高齢動物で必要な検査やフォローの適応を見逃していないか確認しましょう。"},
  {key:"newPatient",label:"新患があった",test:e=>number(e.newPatients)>0,hint:"新患対応を丁寧に行い、必要な再診や予防案内に漏れがないか確認しましょう。"},
  {key:"prevention",label:"予防診療を実施した",test:e=>clinical(e,"preventive")>0,hint:"予防の適応や実施時期を確認し、必要な案内に漏れがないか見直しましょう。"}
 ];
 const OUTCOMES=[{key:"unit",label:"客単価",value:unit},{key:"visits",label:"来院件数",value:e=>number(e.patients)}];
 function formatText(result,hint){return result&&hint?`最近わかったこと\n\n${result}\n\n今日へのヒント\n\n${hint}`:EMPTY}
 function normalizeHistory(history){return Array.isArray(history)?history.filter(item=>item&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&typeof item.key==="string"&&typeof item.result==="string").map(item=>({...item,text:formatText(item.result,item.hint||item.suggestion)})).sort((a,b)=>a.date.localeCompare(b.date)).slice(-30):[]}
 function dateMinus(date,days){const value=new Date(`${date}T00:00:00Z`);value.setUTCDate(value.getUTCDate()-days);return value.toISOString().slice(0,10)}
 function analyze(entries,{today="9999-12-31",history=[]}={}){
  const all=(Array.isArray(entries)?entries:[]).filter(entry=>entry&&entry.date<today&&number(entry.patients)>0).sort((a,b)=>a.date.localeCompare(b.date)),periodDays=all.length>=60?60:30,rows=all.slice(-periodDays);
  if(rows.length<MIN_DAYS)return {ready:false,text:EMPTY,sampleDays:rows.length,periodDays};
  const recentKeys=new Set(normalizeHistory(history).filter(item=>item.date>=dateMinus(today,7)).map(item=>item.key)),candidates=[];
  for(const signal of SIGNALS){
   const selected=rows.filter(signal.test),unselected=rows.filter(entry=>!signal.test(entry));
   if(selected.length<MIN_GROUP_DAYS||unselected.length<MIN_GROUP_DAYS)continue;
   for(const outcome of OUTCOMES){
    const baseline=average(rows.map(outcome.value)),selectedAverage=average(selected.map(outcome.value));
    if(baseline<=0)continue;
    const difference=(selectedAverage-baseline)/baseline*100,key=`${signal.key}:${outcome.key}`;
    candidates.push({key,signal,outcome,difference});
   }
  }
  const best=candidates.filter(item=>!recentKeys.has(item.key)&&Math.abs(item.difference)>=MIN_DIFFERENCE).sort((a,b)=>Math.abs(b.difference)-Math.abs(a.difference)||a.key.localeCompare(b.key))[0];
  if(!best)return {ready:false,text:EMPTY,sampleDays:rows.length,periodDays};
  const direction=best.difference>=0?"高い":"低い",percent=Math.round(Math.abs(best.difference)),result=`直近${rows.length}営業日では、${best.signal.label}日は${best.outcome.label}が平均より${percent}%${direction}傾向でした。`,hint=best.signal.hint;
  return {ready:true,key:best.key,result,hint,suggestion:hint,text:formatText(result,hint),difference:best.difference,sampleDays:rows.length,periodDays};
 }
 function learnAtNight({entries,history,today,hour}){const normalized=normalizeHistory(history);if(Number(hour)<18||normalized.some(item=>item.date===today))return {history:normalized,saved:false};const insight=analyze(entries,{today:dateMinus(today,-1),history:normalized}),record={date:today,key:insight.key||"learning",result:insight.result||EMPTY,hint:insight.hint||"",suggestion:insight.hint||"",text:insight.text||EMPTY,sampleDays:insight.sampleDays||0,periodDays:insight.periodDays||30};return {history:[...normalized,record].slice(-30),saved:true,record}}
 function displayed({entries,history,today}){const normalized=normalizeHistory(history),learned=[...normalized].reverse().find(item=>item.date<today);return learned||analyze(entries,{today,history:normalized})}
 return {EMPTY,MIN_DAYS,MIN_DIFFERENCE,MIN_GROUP_DAYS,normalizeHistory,formatText,analyze,learnAtNight,displayed};
});
