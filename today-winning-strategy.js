(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TodayWinningStrategy=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const number=value=>Number.isFinite(Number(value))?Number(value):0;
const average=(rows,getter)=>rows.length?rows.reduce((total,row)=>total+number(getter(row)),0)/rows.length:0;
const rate=(value,total)=>total>0?value/total*100:0;
const ACTIONS={
 blood:{theme:"血液検査",title:"血液検査を積極提案",actions:["血液検査の対象症例を確認","健診・術前症例へ血液検査を提案"],effects:["利益率","客単価","検査率"],sales:11000,metric:"血液検査率"},
 ultrasound:{theme:"画像検査",title:"画像検査の適応を確認",actions:["超音波検査の対象症例を確認","画像検査枠を確保"],effects:["客単価","診断精度","検査率"],sales:9000,metric:"画像検査率"},
 checkup:{theme:"健康診断",title:"健康診断を案内",actions:["健康診断対象を確認","血液検査を提案","腹部エコーを提案"],effects:["再診率","客単価","診療効率"],sales:8000,metric:"健診率"},
 revisit:{theme:"再診率",title:"再診フォローを実施",actions:["再診予定の未予約症例を確認","次回来院日を案内"],effects:["再診率","来院件数"],sales:6000,metric:"再診率"},
 newPatient:{theme:"新患フォロー",title:"新患フォローを実施",actions:["新患の次回来院予定を確認","未予約症例へ連絡"],effects:["再診率","新患"],sales:7000,metric:"新患率"},
 booking:{theme:"来院機会",title:"予約枠を整理",actions:["当日の空き枠を確認","再診予定へ空き枠を案内"],effects:["診療効率","来院件数"],sales:6000,metric:"来院件数"},
 inventory:{theme:"キャッシュフロー",title:"薬品在庫を確認",actions:["薬品在庫数を確認","必要量だけを発注"],effects:["キャッシュフロー","薬品補充率"],sales:0,metric:"薬品補充率"},
 fixedCost:{theme:"利益率",title:"固定費を確認",actions:["支出の内訳を確認","一時費用と固定費を区分"],effects:["利益率","キャッシュフロー"],sales:0,metric:"利益率"}
};
function median(values){const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2}
function validMargins(months){return (Array.isArray(months)?months:[]).map(row=>{const sales=number(row?.sales),expense=number(row?.expense);return sales>0?(sales-expense)/sales*100:null}).filter(value=>value!==null&&value>=-30&&value<=60)}
function stableProfitRate(context={}){
 const margins=validMargins(context.recentMonths);
 for(const count of [6,3,1])if(margins.length>=count)return{value:median(margins.slice(-count)),source:`直近${count}か月`,description:`直近${count}か月平均利益率で推定`};
 const annual=Number(context.annualProfitRate);if(Number.isFinite(annual)&&annual>=-30&&annual<=60)return{value:annual,source:"年間",description:"年間利益率で推定"};
 const sales=number(context.currentMonthSales),expense=number(context.currentMonthExpense),current=sales>0?(sales-expense)/sales*100:null;
 if(current!==null&&current>=-30&&current<=60)return{value:current,source:"当月",description:"当月利益率で推定"};
 return{value:0,source:"利用可能な実績なし",description:"利益率を算出できる実績がありません"};
}
function supportMissions(primary,candidates){
 const picked=[primary],seen=new Set([primary.key]);
 for(const candidate of candidates){if(seen.has(candidate.key))continue;seen.add(candidate.key);picked.push(candidate);if(picked.length===3)break}
 const defaults=[{key:"revisit",score:0,reason:"再診機会を増やします。"},{key:"booking",score:0,reason:"実行時間を確保します。"},{key:"inventory",score:0,reason:"支出を安定させます。"}];
 for(const item of defaults){if(picked.length===3)break;if(!seen.has(item.key)){seen.add(item.key);picked.push(item)}}
 return picked.map((item,index)=>{const action=ACTIONS[item.key];return{key:item.key,title:index===0?action.title:`${action.theme}の補助行動`,actions:action.actions,effects:action.effects,reason:item.reason,source:index===0?"今日の勝ち筋":"勝ち筋の補助"}});
}
function generateTodayStrategy(context={}){
 const today=String(context.today||""),entries=(Array.isArray(context.entries)?context.entries:[]).filter(row=>(!today||String(row.date)<today)&&number(row.patients)>0).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 if(context.closed)return{ready:true,closed:true,sampleDays:entries.length,missions:[]};
 if(context.readinessStatus==="collecting"||entries.length<5)return{ready:false,sampleDays:entries.length,missions:[]};
 const recent=entries.slice(-5),baseline=entries.slice(-30,-5),patients=recent.reduce((sum,row)=>sum+number(row.patients),0),candidates=[];
 const add=(key,score,reason)=>candidates.push({key,score,reason});
 const compare=(key,current,getter,fallback)=>{const base=baseline.length?average(baseline,getter):fallback;if(current<base)add(key,70+(base-current)*2,`最近5営業日の${ACTIONS[key].metric}が平均より低下しています。今日は${ACTIONS[key].title}ことが最も改善効果があります。`)};
 compare("blood",rate(recent.reduce((sum,row)=>sum+number(row.clinical?.bloodTests),0),patients),row=>rate(number(row.clinical?.bloodTests),number(row.patients)),20);
 compare("ultrasound",rate(recent.reduce((sum,row)=>sum+number(row.clinical?.ultrasounds),0),patients),row=>rate(number(row.clinical?.ultrasounds),number(row.patients)),12);
 compare("checkup",rate(recent.reduce((sum,row)=>sum+number(row.checkups),0),patients),row=>rate(number(row.checkups),number(row.patients)),10);
 compare("newPatient",rate(recent.reduce((sum,row)=>sum+number(row.newPatients),0),patients),row=>rate(number(row.newPatients),number(row.patients)),10);
 const latestPatients=average(recent,row=>row.patients),basePatients=average(baseline,row=>row.patients);if(basePatients&&latestPatients<basePatients*.9)add("booking",84,"最近5営業日の来院件数が平均を下回っています。今日は予約枠の整理が来院機会の改善に有効です。");
 for(const anomaly of context.anomalies||[]){if(anomaly.metric==="利益率"||anomaly.metric==="総支出")add("fixedCost",110,"利益率または支出の異常を検知しています。今日は固定費の確認が利益改善に有効です。");if(anomaly.metric==="来院件数")add("booking",108,"来院件数の異常を検知しています。今日は予約枠の整理を優先してください。");if(anomaly.metric==="客単価")add("blood",109,"客単価の異常を検知しています。今日は血液検査の適応確認が改善に有効です。")}
 if(number(context.cashFlowLevel)>0&&number(context.cashFlowLevel)<=2)add("inventory",105,"キャッシュフロー予測の安全度が低下しています。今日は在庫確認を優先してください。");
 if(number(context.profitForecastRate)>0&&number(context.profitForecastRate)<80)add("fixedCost",103,"利益予測が目標を下回っています。今日は固定費の確認が利益改善に有効です。");
 if(!candidates.length)add("revisit",55,"主要指標は安定しています。今日は再診フォローが継続的な来院につながります。");
 const ranked=candidates.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key)),selected=ranked[0],action=ACTIONS[selected.key],margin=stableProfitRate(context),expectedProfit=Math.round(action.sales*margin.value/100/100)*100,missions=supportMissions(selected,ranked.slice(1));
 return{ready:true,theme:action.theme,title:action.title,impact:Math.max(1,Math.min(5,Math.ceil(selected.score/22))),reason:selected.reason,effects:action.effects,missions,expectedSales:action.sales,expectedRevenue:action.sales,expectedProfit,estimatedProfit:expectedProfit,profitRate:margin.value,profitRateSource:margin.source,profitRateDescription:margin.description,comment:{quote:action.title,reason:selected.reason.replace(/[。]+$/,""),effect:action.effects[0]}};
}
return{build:generateTodayStrategy,generateTodayStrategy,stableProfitRate};
});
