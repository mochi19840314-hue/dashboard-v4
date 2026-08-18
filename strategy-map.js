(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.StrategyMap=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const EMPTY=()=>({updated:null,themes:[],priorities:[],monthlyHistory:[]}),validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||"")),num=value=>Number.isFinite(Number(value))?Number(value):0,clamp=(value,min=0,max=100)=>Math.max(min,Math.min(max,value));
 const definitions=[
  {key:"imaging",theme:"画像検査",aliases:["画像検査","imaging","xray","ultrasound"],value:e=>num(e.imaging)+num(e.xrays)+num(e.ultrasounds)+num(e.clinical?.imaging)+num(e.clinical?.xrays)+num(e.clinical?.ultrasounds),rate:true,action:"画像検査提案率向上"},
  {key:"checkup",theme:"健診",aliases:["健診","checkup","healthcheck"],value:e=>num(e.checkups)+num(e.clinical?.checkups),rate:true,action:"健診案内"},
  {key:"revisit",theme:"再診率",aliases:["再診","revisit","continuation"],value:e=>num(e.revisits)+num(e.clinical?.revisits),rate:true,action:"再診予約確認"},
  {key:"newPatient",theme:"新患",aliases:["新患","newpatient"],value:e=>num(e.newPatients),rate:true,action:"新患受入体制の確認"},
  {key:"unitPrice",theme:"客単価",aliases:["客単価","unit"],value:e=>num(e.patients)?num(e.sales)/num(e.patients):0,action:"客単価構成の確認"},
  {key:"profitRate",theme:"利益率",aliases:["利益率","profit"],value:e=>num(e.sales)&&e.expense!==null&&e.expense!==undefined?(num(e.sales)-num(e.expense))/num(e.sales)*100:null,action:"利益率と原価の確認"},
  {key:"visits",theme:"診療件数",aliases:["診療件数","来院","visits","patients"],value:e=>num(e.patients),action:"診療件数の平準化"},
  {key:"season",theme:"季節変動",aliases:["季節","season"],value:e=>num(e.sales),action:"季節需要への準備"},
  {key:"weekday",theme:"曜日傾向",aliases:["曜日","weekday"],value:e=>num(e.sales),action:"曜日別の人員配置確認"}
 ];
 function normalize(value){const source=value&&typeof value==="object"&&!Array.isArray(value)?value:{};return {updated:typeof source.updated==="string"?source.updated:null,themes:Array.isArray(source.themes)?source.themes:[],priorities:Array.isArray(source.priorities)?source.priorities:[],monthlyHistory:Array.isArray(source.monthlyHistory)?source.monthlyHistory:[]}}
 function ratioValue(definition,entry){const value=definition.value(entry);return definition.rate?value/Math.max(1,num(entry.patients))*100:value}
 function trend(values){if(values.length<4)return "stable";const split=Math.floor(values.length/2),a=values.slice(0,split).reduce((s,v)=>s+v,0)/split,b=values.slice(split).reduce((s,v)=>s+v,0)/(values.length-split),change=a?((b-a)/Math.abs(a))*100:b?100:0;return change>5?"up":change< -5?"down":"stable"}
 function evidenceCount(definition,source){const needle=definition.aliases.map(x=>x.toLowerCase());return source.filter(item=>{const text=JSON.stringify(item||{}).toLowerCase();return needle.some(word=>text.includes(word))}).length}
 function analyze(options={}){
  const isClosed=typeof options.isClosed==="function"?options.isClosed:()=>false,all=(Array.isArray(options.entries)?options.entries:[]).filter(e=>validDate(e?.date)&&!isClosed(e.date)).sort((a,b)=>a.date.localeCompare(b.date)),entries=all.slice(-100),sources=[options.successLibrary,options.businessHealthHistory,options.learningHistory,options.optimizerHistory,Array.isArray(options.seasonLearning)?options.seasonLearning:options.seasonLearning?.patterns,options.forecastHistory].flatMap(x=>Array.isArray(x)?x:[]);
  const themes=definitions.map(def=>{const values=entries.map(e=>ratioValue(def,e)).filter(v=>v!==null&&Number.isFinite(v)),direction=trend(values),evidence=evidenceCount(def,sources),sample=values.length,confidence=sample>=60||evidence>=6?"high":sample>=15||evidence>=2?"medium":"low",recent=values.slice(-20),previous=values.slice(-40,-20),recentAvg=recent.length?recent.reduce((a,b)=>a+b,0)/recent.length:0,previousAvg=previous.length?previous.reduce((a,b)=>a+b,0)/previous.length:recentAvg,change=previousAvg?(recentAvg-previousAvg)/Math.abs(previousAvg)*100:0,score=Math.round(clamp(50+clamp(change,-25,25)+Math.min(20,evidence*3)+(confidence==="high"?10:confidence==="medium"?5:0)));
   let reason=sample<3?"データを蓄積して傾向を学習中":direction==="up"?`${def.theme}が直近の営業日で上昇傾向`:direction==="down"?`${def.theme}に改善余地が見られます`:`${def.theme}は安定して推移`;
   if(def.key==="profitRate"&&!values.length)reason="利益率未入力のため他の経営指標から推定";
   if(def.key==="season"&&evidence)reason="季節学習と予測履歴に継続的な傾向";if(def.key==="weekday"&&entries.length>=14){const groups={};entries.forEach(e=>{const w=new Date(`${e.date}T00:00:00Z`).getUTCDay();(groups[w]??=[]).push(num(e.sales))});const best=Object.entries(groups).sort((a,b)=>b[1].reduce((s,v)=>s+v,0)/b[1].length-a[1].reduce((s,v)=>s+v,0)/a[1].length)[0];reason=`${["日","月","火","水","木","金","土"][best[0]]}曜日の実績が最も高い傾向`}
   return {theme:def.theme,key:def.key,score,trend:direction,confidence,reason,priority:0,action:def.action}
  }).sort((a,b)=>b.score-a.score||a.theme.localeCompare(b.theme,"ja"));themes.forEach((item,index)=>item.priority=index+1);
  return {themes,priorities:themes.slice(0,3).map(({theme,priority,score,reason,action})=>({theme,priority,score,reason,action})),businessDaysUsed:entries.length,trimmedBusinessDays:Math.max(0,all.length-entries.length)}
 }
 function shouldUpdate({today,hour,businessDayEnded=false,knowledgeCoreUpdated=false,isClosed=()=>false,current}={}){if(!validDate(today)||isClosed(today)&&!knowledgeCoreUpdated)return false;if(normalize(current).updated?.slice(0,10)===today)return false;return Number(hour)>=18||businessDayEnded||knowledgeCoreUpdated}
 function update(options={}){const current=normalize(options.strategyMap),today=options.today||new Date().toISOString().slice(0,10);if(!shouldUpdate({...options,today,current}))return {...current,saved:false};const result=analyze(options),month=today.slice(0,7),history=[...current.monthlyHistory];if(result.trimmedBusinessDays>0&&!history.some(x=>x.month===month))history.push({month,archivedAt:today,themes:current.themes.length?current.themes:result.themes,businessDaysArchived:result.trimmedBusinessDays});return {updated:options.updatedAt||`${today}T18:00:00`,themes:result.themes,priorities:result.priorities,monthlyHistory:history,saved:true,businessDaysUsed:result.businessDaysUsed}}
 return {EMPTY,definitions,normalize,analyze,shouldUpdate,update};
});
