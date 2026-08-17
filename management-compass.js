(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ManagementCompass=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const LABELS={imaging:"画像検査の適応確認",xray:"画像検査の適応確認",ultrasound:"画像検査の適応確認",blood:"血液検査の必要性確認",surgery:"手術適応の確認",checkup:"健康診断後のフォロー確認",revisit:"再診フォロー予定の確認",prevention:"予防診療の適応確認",senior:"シニア症例の必要性確認",newPatient:"新患の再診予定確認"};
 const list=value=>Array.isArray(value)?value.filter(Boolean):[];
 function keyOf(item={}){return String(item.key||item.id||item.category||item.themeKey||"").split(":")[0]}
 function textOf(item={}){return item.reason||item.result||item.text||item.message||item.comment||item.title||item.theme||""}
 function titleOf(item={}){const key=keyOf(item),raw=String(item.theme||item.title||"");if(LABELS[key])return LABELS[key];if(/画像|レントゲン|エコー/.test(raw+textOf(item)))return LABELS.imaging;if(/血液/.test(raw+textOf(item)))return LABELS.blood;if(/手術/.test(raw+textOf(item)))return LABELS.surgery;return raw?`${raw}の適応・必要性確認`:"診療上の適応確認"}
 function actionsFor(item){const title=titleOf(item);if(/画像/.test(title))return["画像検査の適応症例を確認","必要な画像評価の見逃しがないか確認","再診時の画像評価予定を確認"];if(/手術/.test(title))return["手術適応を確認","術前評価の必要性を確認","術後フォロー予定を確認"];return[`${title.replace(/確認$/,'')}を確認`,"診療上の必要性と見逃しがないか確認","必要なフォロー予定を確認"]}
 function weeklyItems(history){return list(history).slice().reverse().flatMap(record=>list(record?.insights))}
 function learningItems(history){return list(history).slice().reverse().filter(item=>item.key!=="learning"&&textOf(item))}
 function build({knowledgeCore,successLibrary,weeklyLearningHistory,learningHistory,clinicalIntelligence,entries=[],closedDates=[],hour=0,successRateHistory=[]}={}){
  let core=[];try{core=list(knowledgeCore?.getTopThemes?.(successLibrary,{limit:10}));if(typeof AIRecommendationOutcomes!=="undefined")core=AIRecommendationOutcomes.rank(core,successRateHistory);core=core.slice(0,2)}catch{}
  let clinical=[];try{clinical=list(clinicalIntelligence?.analyze?.(entries,{closedDates})?.insights)}catch{}
  const sources=[core,list(successLibrary),weeklyItems(weeklyLearningHistory),learningItems(learningHistory),clinical],selected=sources.find(items=>items.length)||[],primary=selected[0],next=selected[1];
  if(!primary)return{ready:false,sampleDays:list(entries).length,requiredDays:15,missions:[]};
  return{ready:true,sampleDays:list(entries).length,requiredDays:15,title:titleOf(primary),theme:titleOf(primary),missions:[{actions:actionsFor(primary)}],reason:textOf(primary)||`${titleOf(primary)}につながる傾向が確認されています。`,expectedIncrementalSales:0,expectedProfit:0,next:next?{title:titleOf(next),expectedIncrementalSales:0,expectedProfit:0}:null,isTomorrow:Number(hour)>=18};
 }
 return{build,titleOf};
});
