(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.SuccessLibrary=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const MIN_COUNT=3,MAX_ITEMS=10,WINDOW_DAYS=30;
 const THEMES={checkup:"健康診断",imaging:"画像検査",surgery:"手術",blood:"血液検査",revisit:"継続診療",newPatient:"新患",prevention:"予防診療",senior:"シニア診療"};
 const METRICS={unit:"客単価",revisitRate:"再診率",profitRate:"利益率",visits:"来院件数"};
 const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||""));
 const number=value=>Number.isFinite(Number(value))?Number(value):null;
 function normalize(library){
  return Array.isArray(library)?library.filter(item=>item&&typeof item.id==="string"&&typeof item.theme==="string"&&Number(item.count)>=MIN_COUNT&&validDate(item.firstSeen)&&validDate(item.lastSeen)).map(item=>({...item,count:Number(item.count),sampleCount:Number(item.sampleCount??item.count),confidence:Math.max(1,Math.min(5,Number(item.confidence)||3)),score:Math.max(0,Math.min(100,Number(item.score)||Number(item.confidence||3)*20)),trend:String(item.trend||"stable"),season:String(item.season||"通年"),weekday:String(item.weekday||"全曜日"),lastUpdated:item.lastUpdated||item.lastSeen,metrics:item.metrics&&typeof item.metrics==="object"?item.metrics:{},comment:String(item.comment||"")})).sort(sortItems).slice(0,MAX_ITEMS):[];
 }
 function sortItems(a,b){return b.count-a.count||b.confidence-a.confidence||b.lastSeen.localeCompare(a.lastSeen)||a.id.localeCompare(b.id)}
 function observations(learningHistory,weeklyLearningHistory){
  const found=[];
  for(const item of Array.isArray(learningHistory)?learningHistory:[]){if(!validDate(item?.date)||!item.key||item.key==="learning"||number(item.difference)===null)continue;found.push({...item,date:item.date})}
  for(const record of Array.isArray(weeklyLearningHistory)?weeklyLearningHistory:[])for(const item of Array.isArray(record?.insights)?record.insights:[]){if(validDate(record.date)&&item?.key&&number(item.difference)!==null)found.push({...item,date:record.date})}
  const dates=[...new Set(found.map(item=>item.date))].sort().slice(-WINDOW_DAYS),allowed=new Set(dates),unique=new Map();
  for(const item of found)if(allowed.has(item.date)){const [themeKey,metricKey]=String(item.key).split(":"),importance=Math.abs(number(item.importance)??number(item.difference)??0);if(THEMES[themeKey]&&importance>=5)unique.set(`${item.date}:${item.key}`,{date:item.date,themeKey,metricKey,difference:number(item.difference)??importance,importance})}
  return [...unique.values()];
 }
 function build({learningHistory=[],weeklyLearningHistory=[],existing=[]}={}){
  const groups=new Map();for(const item of observations(learningHistory,weeklyLearningHistory)){const group=groups.get(item.themeKey)||[];group.push(item);groups.set(item.themeKey,group)}
  const previous=new Map(normalize(existing).map(item=>[item.id,item])),result=[];
  for(const [themeKey,items] of groups){if(items.length<MIN_COUNT)continue;const byMetric={};for(const item of items)if(METRICS[item.metricKey]){(byMetric[item.metricKey]??=[]).push(item.difference)}const metrics={};for(const [key,values] of Object.entries(byMetric))metrics[key]=Math.round(values.reduce((sum,value)=>sum+value,0)/values.length);const dates=items.map(item=>item.date).sort(),averageImportance=items.reduce((sum,item)=>sum+item.importance,0)/items.length,confidence=Math.max(3,Math.min(5,Math.ceil(averageImportance/10)+2)),metricNames=Object.keys(metrics).map(key=>METRICS[key]);const theme=THEMES[themeKey],comment=metricNames.length?`${theme}では、${metricNames.slice(0,2).join("と")}が高い傾向を複数回確認しています。`:`${theme}に関する同じ傾向を複数回確認しています。`;result.push({...previous.get(themeKey),id:themeKey,theme,count:items.length,firstSeen:dates[0],lastSeen:dates.at(-1),confidence,metrics,comment})}
  return normalize(result);
 }
 function learnAtNight({learningHistory,weeklyLearningHistory,existing,hour}={}){const library=normalize(existing);if(Number(hour)<18)return {library,saved:false};const next=build({learningHistory,weeklyLearningHistory,existing:library});return {library:next,saved:JSON.stringify(next)!==JSON.stringify(library)}}
 return {MIN_COUNT,MAX_ITEMS,WINDOW_DAYS,THEMES,METRICS,normalize,observations,build,learnAtNight};
});
