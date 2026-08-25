(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else{root.BusinessAnomalies=api;root.detectBusinessAnomalies=api.detectBusinessAnomalies}})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const RULES={
 unitPrice:{metric:"客単価",direction:"low",warning:10,danger:20,format:"yen"},
 patients:{metric:"来院件数",direction:"low",warning:15,danger:30,format:"count"},
 sales:{metric:"日商",direction:"low",warning:15,danger:25,format:"yen"}
};
const day=date=>new Date(`${date}T12:00:00`).getDay();
const average=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
function profile(date,clinic={}){if((clinic.closedDates||[]).includes(date)||day(date)===1)return "closed";return day(date)===6?"half":"full"}
function values(entry){const sales=Number(entry.sales),patients=Number(entry.patients);return {sales,patients,unitPrice:patients>0?sales/patients:null}}
function classify(rule,current,baseline){
 const delta=rule.direction==="points"?current-baseline:(current/baseline-1)*100;
 const adverse=rule.direction==="high"?delta:rule.direction==="points"?-delta:-delta;
 return {level:adverse>=rule.danger?"danger":adverse>=rule.warning?"warning":"normal",change:delta};
}
function detectBusinessAnomalies(source={},options={}){
 const today=options.today||new Date().toLocaleDateString("sv-SE"),hour=Number(options.hour??new Date().getHours()),clinic=source.clinic||{},todayProfile=profile(today,clinic);
 if(todayProfile==="closed"||hour<(todayProfile==="half"?12:9))return [];
 const entries=Array.isArray(source.entries)?source.entries:[],current=entries.find(entry=>entry&&entry.date===today);
 // A saved positive sales/patient pair distinguishes completed input from untouched zero-value fields.
 if(!current||!(Number(current.sales)>0)||!(Number(current.patients)>0))return [];
 const eligible=entries.filter(entry=>entry&&entry.date&&entry.date<=today&&profile(entry.date,clinic)!=="closed"&&Number(entry.sales)>0&&Number(entry.patients)>0);
 const currentTime=new Date(`${today}T12:00:00`).getTime(),earliest=currentTime-56*864e5;
 let comparison=eligible.filter(entry=>entry.date<today&&day(entry.date)===day(today)&&new Date(`${entry.date}T12:00:00`).getTime()>=earliest).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
 // Fallback keeps half-day Saturdays separate from full clinic days.
 if(comparison.length<3)comparison=eligible.filter(entry=>entry.date<today&&profile(entry.date,clinic)===todayProfile).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
 if(comparison.length<3)return [];
 const currentValues=values(current);
 return Object.entries(RULES).flatMap(([key,rule])=>{
  const samples=comparison.map(entry=>values(entry)[key]).filter(value=>Number.isFinite(value)&&value>0);
  const currentValue=currentValues[key];if(samples.length<3||!Number.isFinite(currentValue)||currentValue<0)return [];
  const baseline=average(samples);if(!(baseline>0))return [];
  const result=classify(rule,currentValue,baseline),amount=Math.abs(result.change),word=rule.direction==="high"?"増加":"低下";
  return [{level:result.level,metric:rule.metric,current:currentValue,baseline,changePercent:Number(result.change.toFixed(1)),format:rule.format,message:rule.direction==="points"?`${rule.metric}が通常より${Math.abs(result.change).toFixed(1)}ポイント低下しています`:`${rule.metric}が通常より${amount.toFixed(1)}%${word}しています`,sampleSize:samples.length}];
 });
}
return {detectBusinessAnomalies,RULES};
});
