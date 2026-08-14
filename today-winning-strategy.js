(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TodayWinningStrategy=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const number=value=>Number.isFinite(Number(value))?Number(value):0;
const average=(rows,getter)=>rows.length?rows.reduce((total,row)=>total+number(getter(row)),0)/rows.length:0;
const ACTIONS={
 blood:{title:"血液検査を積極提案",effects:["利益率","客単価","検査率"],revenue:11000,metric:"血液検査率"},
 ultrasound:{title:"超音波検査を積極提案",effects:["客単価","診断精度","検査率"],revenue:9000,metric:"画像検査率"},
 checkup:{title:"健康診断を案内",effects:["再診率","客単価","診療効率"],revenue:8000,metric:"健診率"},
 line:{title:"LINE配信を実施",effects:["再診率","来院件数"],revenue:6000,metric:"再診率"},
 review:{title:"Google口コミへ返信",effects:["新患","来院件数"],revenue:5000,metric:"新患率"},
 newPatient:{title:"新患フォローを実施",effects:["再診率","新患"],revenue:7000,metric:"新患率"},
 booking:{title:"予約枠を整理",effects:["診療効率","来院件数"],revenue:6000,metric:"来院件数"},
 imaging:{title:"画像検査の適応を確認",effects:["診断精度","客単価","検査率"],revenue:10000,metric:"画像検査率"},
 inventory:{title:"薬品在庫を確認",effects:["キャッシュフロー","薬品補充率"],revenue:0,metric:"薬品補充率"},
 fixedCost:{title:"固定費を確認",effects:["利益率","キャッシュフロー"],revenue:0,metric:"利益率"}
};
function rate(value,total){return total>0?value/total*100:0}
function profitRate(context,entries){
 const configured=Number(context.configuredProfitRate);if(Number.isFinite(configured)&&configured>=0)return{value:configured,source:"病院設定"};
 const currentSales=number(context.currentMonthSales),currentExpense=number(context.currentMonthExpense);if(currentSales>0&&currentExpense>0)return{value:(currentSales-currentExpense)/currentSales*100,source:"現在月"};
 const months=(Array.isArray(context.recentMonths)?context.recentMonths:[]).filter(row=>number(row.sales)>0&&number(row.expense)>0).slice(-3);if(months.length){const sales=months.reduce((sum,row)=>sum+number(row.sales),0),expense=months.reduce((sum,row)=>sum+number(row.expense),0);return{value:Math.max(0,(sales-expense)/sales*100),source:"直近3か月平均"}}
 const sales=entries.reduce((sum,row)=>sum+number(row.sales),0);return{value:sales>0?30:0,source:"参考利益率"};
}
function build(context={}){
 const today=String(context.today||""),entries=(Array.isArray(context.entries)?context.entries:[]).filter(row=>(!today||String(row.date)<today)&&number(row.patients)>0).sort((a,b)=>String(a.date).localeCompare(String(b.date)));if(context.closed)return{ready:true,closed:true,sampleDays:entries.length};if(context.readinessStatus==="collecting"||entries.length<5)return{ready:false,sampleDays:entries.length};
 const recent=entries.slice(-5),baseline=entries.slice(-30,-5),patients=recent.reduce((sum,row)=>sum+number(row.patients),0),metrics={blood:rate(recent.reduce((sum,row)=>sum+number(row.clinical?.bloodTests),0),patients),ultrasound:rate(recent.reduce((sum,row)=>sum+number(row.clinical?.ultrasounds),0),patients),checkup:rate(recent.reduce((sum,row)=>sum+number(row.checkups),0),patients),newPatient:rate(recent.reduce((sum,row)=>sum+number(row.newPatients),0),patients)},candidates=[];
 const add=(key,score,reason)=>candidates.push({key,score,reason});
 const compare=(key,current,getter,fallback)=>{const base=baseline.length?average(baseline,getter):fallback;if(current<base)add(key,70+(base-current)*2,`最近5営業日の${ACTIONS[key].metric}が平均より低下しています。`)};
 compare("blood",metrics.blood,row=>rate(number(row.clinical?.bloodTests),number(row.patients)),20);compare("ultrasound",metrics.ultrasound,row=>rate(number(row.clinical?.ultrasounds),number(row.patients)),12);compare("checkup",metrics.checkup,row=>rate(number(row.checkups),number(row.patients)),10);compare("newPatient",metrics.newPatient,row=>rate(number(row.newPatients),number(row.patients)),10);
 const latestPatients=average(recent,row=>row.patients),basePatients=average(baseline,row=>row.patients);if(basePatients&&latestPatients<basePatients*.9)add("booking",84,"最近5営業日の来院件数が平均を下回っています。");
 for(const anomaly of context.anomalies||[]){if(anomaly.metric==="利益率"||anomaly.metric==="総支出")add("fixedCost",110,"利益率または支出の異常を検知しています。");if(anomaly.metric==="来院件数")add("booking",108,"来院件数の異常を検知しています。");if(anomaly.metric==="客単価")add("blood",109,"客単価の異常を検知しています。")}
 if(number(context.cashFlowLevel)>0&&number(context.cashFlowLevel)<=2)add("inventory",105,"キャッシュフロー予測の安全度が低下しています。");if(number(context.profitForecastRate)>0&&number(context.profitForecastRate)<80)add("fixedCost",103,"利益予測が目標を下回っています。");
 if(!candidates.length)add("line",55,"主要指標は安定しています。再診機会を着実に増やす行動が有効です。");
 const selected=candidates.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key))[0],action=ACTIONS[selected.key],margin=profitRate(context,entries),estimatedProfit=Math.round(action.revenue*Math.max(0,margin.value)/100/100)*100;
 return{ready:true,title:action.title,impact:Math.max(1,Math.min(5,Math.ceil(selected.score/22))),effects:action.effects,expectedRevenue:action.revenue,estimatedProfit,profitRate:margin.value,profitRateSource:margin.source,reason:selected.reason.slice(0,100)};
}
return{build};
});
