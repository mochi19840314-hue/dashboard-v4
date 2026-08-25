(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.TodayDashboardData=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 function build({entries=[],date,clinicalValue,isOperating=()=>true}={}){
  const savedEntries=Array.isArray(entries)?entries:[],entry=savedEntries.find(item=>item?.date===date)||{date,clinical:{}},value=typeof clinicalValue==="function"?clinicalValue:()=>0;
  return {entry,entries:savedEntries,clinical:{preventive:value(entry,"preventive"),checkups:value(entry,"checkups"),imaging:value(entry,"imaging"),bloodTests:value(entry,"bloodTests"),surgeries:value(entry,"surgeries"),trimming:value(entry,"trimming"),secondOpinions:value(entry,"secondOpinions")},businessDays:savedEntries.filter(item=>String(item?.date||"")<=date&&isOperating(item)).length};
 }
 return {build};
});
