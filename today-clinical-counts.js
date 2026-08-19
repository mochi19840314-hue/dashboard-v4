(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.TodayClinicalCounts=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const number=value=>Math.max(0,Number.isFinite(Number(value))?Math.trunc(Number(value)):0);
 const value=(entry,metric)=>{const clinical=entry?.clinical||{};return metric==="imaging"?number(clinical.xrays)+number(clinical.ultrasounds):number(clinical[metric])};
 function update(entries,date,metric,delta){
  if(!Array.isArray(entries)||!/^\d{4}-\d{2}-\d{2}$/.test(String(date))||!["preventive","imaging","bloodTests"].includes(metric))return null;
  let entry=entries.find(item=>item?.date===date);
  if(!entry){entry={date,clinical:{}};entries.push(entry);entries.sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
  entry.clinical={...(entry.clinical||{})};
  const current=value(entry,metric),next=Math.max(0,current+(Number(delta)>0?1:-1));
  if(metric==="imaging"){
   const xrays=number(entry.clinical.xrays),ultrasounds=number(entry.clinical.ultrasounds);
   if(next>current)entry.clinical.xrays=xrays+1;
   else if(xrays>0)entry.clinical.xrays=xrays-1;
   else entry.clinical.ultrasounds=Math.max(0,ultrasounds-1);
  }else entry.clinical[metric]=next;
  return {entry,value:next};
 }
 return {update,value};
});
