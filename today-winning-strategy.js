(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TodayWinningStrategy=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const SCORE_WEIGHTS=Object.freeze({expectedProfit:.45,successRate:.30,revisitImprovement:.15,unitPriceImprovement:.10});
const MIN_BUSINESS_DAYS=15;
const number=value=>Number.isFinite(Number(value))?Number(value):0;
const mean=values=>values.length?values.reduce((sum,value)=>sum+number(value),0)/values.length:0;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const DEFINITIONS=Object.freeze([
 {key:"checkup",theme:"健康診断",count:r=>r.checkups,actions:["対象確認","血液検査提案","超音波提案"]},
 {key:"blood",theme:"血液検査",count:r=>r.clinical?.bloodTests,actions:["対象症例を確認","血液検査を提案","結果説明と再診予定を確認"]},
 {key:"ultrasound",theme:"超音波検査",count:r=>r.clinical?.ultrasounds,actions:["対象症例を確認","超音波検査を提案","検査枠を確認"]},
 {key:"imaging",theme:"画像検査",count:r=>number(r.clinical?.xrays)+number(r.clinical?.ultrasounds),actions:["画像検査の適応を確認","画像検査を提案","検査枠を確保"]},
 {key:"dental",theme:"歯科",count:r=>number(r.clinical?.dental)+number(r.dental),actions:["口腔状態を確認","歯科処置を提案","術前検査を案内"]},
 {key:"surgery",theme:"手術",count:r=>r.surgeries,actions:["手術候補症例を確認","術前検査を提案","術後再診を予約"]},
 {key:"revisit",theme:"再診フォロー",count:r=>r.clinical?.revisits??Math.max(0,number(r.patients)-number(r.newPatients)),actions:["再診予定の未予約症例を確認","次回来院日を案内","未予約症例をフォロー"]},
 {key:"senior",theme:"シニア健診",count:r=>number(r.clinical?.seniorCheckups)+number(r.seniorCheckups),actions:["シニア対象を確認","血液検査を提案","超音波検査を提案"]},
 {key:"vaccine",theme:"ワクチン",count:r=>number(r.clinical?.vaccines)+number(r.vaccines),actions:["接種対象を確認","ワクチンを案内","次回予定を登録"]},
 {key:"preventive",theme:"予防",count:r=>r.clinical?.preventive,actions:["予防対象を確認","予防プランを案内","次回予定を登録"]}
]);
function validEntries(entries,today=""){return (Array.isArray(entries)?entries:[]).filter(row=>row&&(!today||String(row.date)<today)&&number(row.patients)>0&&number(row.sales)>0).sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
function metrics(row){const patients=Math.max(1,number(row.patients)),sales=number(row.sales),profit=sales-number(row.expense);return{salesPerPatient:sales/patients,profitPerPatient:profit/patients,revisitRate:clamp((patients-number(row.newPatients))/patients*100,0,100)}}
function learnFromWindow(rows,definition){
 const active=rows.filter(row=>number(definition.count(row))>0),inactive=rows.filter(row=>number(definition.count(row))===0);if(!active.length)return null;const control=inactive.length?inactive:rows;
 const baseSales=mean(control.map(row=>metrics(row).salesPerPatient)),baseProfit=mean(control.map(row=>metrics(row).profitPerPatient)),baseRevisit=mean(control.map(row=>metrics(row).revisitRate));
 const activeMetrics=active.map(metrics),averageAdditionalSales=mean(activeMetrics.map(value=>value.salesPerPatient-baseSales)),averageProfit=mean(activeMetrics.map(value=>value.profitPerPatient-baseProfit)),revisitImprovement=mean(activeMetrics.map(value=>value.revisitRate-baseRevisit)),unitPriceImprovement=baseSales?averageAdditionalSales/baseSales*100:0;
 const successRate=activeMetrics.filter(value=>value.profitPerPatient>baseProfit).length/activeMetrics.length*100;
 return{sampleCount:active.length,averageAdditionalSales:Math.max(0,averageAdditionalSales),averageProfit:Math.max(0,averageProfit),successRate,revisitImprovement,unitPriceImprovement};
}
function learnCandidate(entries,definition){
 const windows=[{size:30,label:"直近30営業日"},{size:90,label:"直近90営業日"},{size:Infinity,label:"全期間"}];
 for(const window of windows){const rows=window.size===Infinity?entries:entries.slice(-window.size),learned=learnFromWindow(rows,definition);if(learned&&learned.sampleCount>=2)return{...definition,...learned,window:window.label,windowDays:rows.length}}
 return null;
}
function feedbackAdjustment(candidate,history){const rows=(Array.isArray(history)?history:[]).filter(row=>row.key===candidate.key),recent=rows.slice(-30);return recent.length?mean(recent.map(row=>number(row.successRateDelta))):0}
function rankCandidates(entries,learningHistory=[]){
 const candidates=DEFINITIONS.map(definition=>learnCandidate(entries,definition)).filter(Boolean).map(candidate=>{
  const successRate=clamp(candidate.successRate+feedbackAdjustment(candidate,learningHistory),0,100);
  const score=candidate.averageProfit*SCORE_WEIGHTS.expectedProfit+successRate*SCORE_WEIGHTS.successRate+candidate.revisitImprovement*SCORE_WEIGHTS.revisitImprovement+candidate.unitPriceImprovement*SCORE_WEIGHTS.unitPriceImprovement;
  return{...candidate,successRate,score};
 });return candidates.sort((a,b)=>b.score-a.score||b.successRate-a.successRate||a.key.localeCompare(b.key));
}
function stableProfitRate(context={}){const margins=(context.recentMonths||[]).map(row=>number(row.sales)>0?(number(row.sales)-number(row.expense))/number(row.sales)*100:null).filter(value=>value!==null&&value>=-30&&value<=60);for(const count of [6,3,1])if(margins.length>=count){const values=margins.slice(-count).sort((a,b)=>a-b),middle=Math.floor(values.length/2),value=values.length%2?values[middle]:(values[middle-1]+values[middle])/2;return{value,source:`直近${count}か月`,description:`直近${count}か月平均利益率で推定`}}return{value:0,source:"利用可能な実績なし",description:"利益率を算出できる実績がありません"}}
function generateTodayStrategy(context={}){
 const entries=validEntries(context.entries,context.today);if(context.closed)return{ready:true,closed:true,sampleDays:entries.length,missions:[]};
 if(entries.length<MIN_BUSINESS_DAYS)return{ready:false,learning:true,status:"学習中",sampleDays:entries.length,requiredDays:MIN_BUSINESS_DAYS,missions:[]};
 const ranking=rankCandidates(entries,context.learningHistory);if(!ranking.length)return{ready:false,learning:true,status:"学習中",sampleDays:entries.length,requiredDays:MIN_BUSINESS_DAYS,missions:[]};
 const primary=ranking[0],next=ranking[1],expectedSales=Math.round(primary.averageAdditionalSales/100)*100,expectedProfit=Math.round(primary.averageProfit/100)*100,impact=clamp(Math.ceil(primary.successRate/20),1,5),margin=stableProfitRate(context);
 const reason=`${primary.window}では\n${primary.theme}提案日の利益が\n最も高くなっています。`,mission={key:primary.key,theme:primary.theme,title:primary.theme,actions:primary.actions.slice(0,3),effects:["利益","客単価","再診率"],reason,source:"実績学習"};
 return{ready:true,learning:false,sampleDays:entries.length,theme:primary.theme,title:primary.theme,impact,reason,effects:mission.effects,missions:[mission],expectedSales,expectedRevenue:expectedSales,expectedProfit,estimatedProfit:expectedProfit,profitRate:margin.value,profitRateSource:margin.source,profitRateDescription:margin.description,successRate:primary.successRate,score:primary.score,weights:SCORE_WEIGHTS,learningWindow:primary.window,ranking:ranking.map(item=>({key:item.key,theme:item.theme,score:item.score,expectedProfit:Math.round(item.averageProfit),expectedSales:Math.round(item.averageAdditionalSales),successRate:item.successRate,window:item.window})),next:next?{key:next.key,theme:next.theme,title:next.theme,expectedProfit:Math.round(next.averageProfit)}:null,comment:{quote:primary.theme,reason:reason.replace(/\n/g,""),effect:"期待利益"}};
}
return{SCORE_WEIGHTS,MIN_BUSINESS_DAYS,DEFINITIONS,build:generateTodayStrategy,generateTodayStrategy,rankCandidates,learnCandidate,stableProfitRate};
});
