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

// v10.1 Phase 4: Today One Action は既存Todayデータモジュールから安全に起動する。
// index.html の巨大な既存構造を直接変更せず、読み込み漏れをここで補完する。
if(typeof document!=="undefined"&&typeof window!=="undefined"){
 const load=(src,next)=>{if(document.querySelector(`script[data-v101-one-action="${src}"]`)){next?.();return}const script=document.createElement("script");script.src=src;script.dataset.v101OneAction=src;script.onload=()=>next?.();script.onerror=()=>console.warn("today one action load failed",src);document.head.appendChild(script)};
 load("./today-one-action.js?v=1012",()=>load("./today-one-action-ui.js?v=1012"));
}
