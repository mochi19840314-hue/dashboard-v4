(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.RecentActivity=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const number=value=>Number.isFinite(Number(value))?Number(value):0;
function rows(entries,options={}){
 const closedDates=new Set(Array.isArray(options.closedDates)?options.closedDates:[]),healthByDate=new Map((Array.isArray(options.healthHistory)?options.healthHistory:[]).map(item=>[item?.date,item?.score]));
 return (Array.isArray(entries)?entries:[]).filter(entry=>entry&&/^\d{4}-\d{2}-\d{2}$/.test(entry.date)&&!closedDates.has(entry.date)&&(number(entry.sales)>0||number(entry.patients)>0)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10).map(entry=>{const patients=Math.max(0,number(entry.patients)),newPatients=Math.max(0,number(entry.newPatients)),clinical=entry.clinical||{},profit=Number(entry.profitRate),storedHealth=entry.businessHealth??entry.businessHealthScore??healthByDate.get(entry.date),health=Number(storedHealth);return {entry,date:entry.date,sales:Math.max(0,number(entry.sales)),patients,newPatients,revisits:Math.max(0,number(entry.repeatPatients??(patients-newPatients))),imaging:Math.max(0,number(clinical.xrays)+number(clinical.ultrasounds)),checkups:Math.max(0,number(entry.checkups)),unitPrice:patients?Math.max(0,number(entry.sales))/patients:0,profitRate:Number.isFinite(profit)?profit:null,health:Number.isFinite(health)?Math.round(health):null,aiComment:String(entry.aiComment??entry.ai?.comment??entry.dailyReview?.comment??entry.note??entry.memo??"").trim()}});
}
return {rows};
});
