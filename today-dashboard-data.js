(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.TodayDashboardData=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 function build({entries=[],date,clinicalValue,isOperating=()=>true}={}){const savedEntries=Array.isArray(entries)?entries:[],entry=savedEntries.find(item=>item?.date===date)||{date,clinical:{}},value=typeof clinicalValue==="function"?clinicalValue:()=>0;return {entry,entries:savedEntries,clinical:{preventive:value(entry,"preventive"),checkups:value(entry,"checkups"),imaging:value(entry,"imaging"),bloodTests:value(entry,"bloodTests"),surgeries:value(entry,"surgeries"),trimming:value(entry,"trimming"),secondOpinions:value(entry,"secondOpinions")},businessDays:savedEntries.filter(item=>String(item?.date||"")<=date&&isOperating(item)).length}}
 return {build};
});

// v10.2.1: sequential, cache-busted bootstrap. No observers or background AI calls.
if(typeof document!=="undefined"&&typeof window!=="undefined"){
 const load=(src,next)=>{if(document.querySelector(`script[data-today-module="${src}"]`)){next?.();return}const script=document.createElement("script");script.src=src;script.dataset.todayModule=src;script.onload=()=>next?.();script.onerror=()=>console.warn("today module load failed",src);document.head.appendChild(script)};
 load("./today-one-action.js?v=1021",()=>load("./kagemusha-intelligence.js?v=1021",()=>load("./today-one-action-ui.js?v=1021")));
}
