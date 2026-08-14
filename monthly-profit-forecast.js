(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.MonthlyProfitForecast=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 const finite=value=>Number.isFinite(Number(value))?Number(value):0;
 const average=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
 function weights(businessDays){const days=Math.max(0,Math.floor(finite(businessDays)));if(days<=5)return{past:.9,current:.1,model:"過去6か月補正"};if(days<=10)return{past:.7,current:.3,model:"過去6か月70%＋今月30%"};if(days<=20)return{past:.4,current:.6,model:"過去3か月40%＋今月60%"};return{past:.1,current:.9,model:"今月実績90%＋過去実績10%"}}
 function confidence(businessDays,historyCount=0){const days=Math.max(0,Math.floor(finite(businessDays))),history=Math.max(0,Math.floor(finite(historyCount)));let level=days>=21?5:days>=11?4:days>=6?3:days?2:0;if(days<=5&&history>=3)level=4;return{days,level,stars:`${"★".repeat(level)}${"☆".repeat(5-level)}`,label:level>=4?"高信頼":level===3?"通常予測":level?"参考値":"データ待ち"}}
 function commentForDays(days){if(days<=0)return"営業データを記録すると、月末利益を予測します。";if(days<=5)return"月初は固定費計上の影響で利益が低く見える時期です。過去実績を優先して予測しています。";if(days<=10)return"現在利益は参考値です。予測は過去実績を多く反映しています。";if(days>=20)return"今月実績を主体として予測しています。";return"過去実績と今月の売上・支出推移を組み合わせて予測しています。"}
 function normalizeHistory(history,limit){return(Array.isArray(history)?history:[]).map(row=>{const sales=finite(row.sales),expense=finite(row.expense),profit=Number.isFinite(Number(row.profit))?Number(row.profit):sales-expense;return{sales,expense,profit,profitRate:Number.isFinite(Number(row.sameDayProfitRate))?Number(row.sameDayProfitRate):sales?profit/sales:0}}).filter(row=>row.sales>0).slice(-limit)}
 function calculate({currentProfit=0,currentSales=0,currentExpense=0,fixedExpense=0,variableExpense=0,businessDays=0,scheduledBusinessDays=0,historicalMonths=[],targetProfit=0,previousForecast=null}={}){
  const days=Math.max(0,Math.floor(finite(businessDays))),scheduled=Math.max(days,Math.floor(finite(scheduledBusinessDays))),current=finite(currentProfit),sales=finite(currentSales),expense=finite(currentExpense),fixed=clamp(finite(fixedExpense),0,Math.max(0,expense)),variable=Math.max(0,Number.isFinite(Number(variableExpense))?Number(variableExpense):expense-fixed),blend=weights(days),history=normalizeHistory(historicalMonths,days<=10?6:3);
  const historicalSales=average(history.map(row=>row.sales)),historicalProfit=average(history.map(row=>row.profit)),historicalRate=average(history.map(row=>row.profitRate));
  const salesPace=days?sales/days*scheduled:sales,projectedSales=salesPace&&historicalSales?salesPace*blend.current+historicalSales*blend.past:salesPace||historicalSales;
  // 人件費・家賃・リース・一括購入薬品等は据え置き、日々増えるカード手数料等だけを営業日で予測する。
  const projectedExpense=fixed+(days?variable/days*scheduled:variable),currentProjection=projectedSales-projectedExpense;
  const rateProjection=projectedSales*historicalRate,historicalProjection=history.length?(historicalProfit+rateProjection)/2:currentProjection;
  const forecastProfit=days?(history.length?historicalProjection*blend.past+currentProjection*blend.current:currentProjection):0,target=finite(targetProfit),previous=Number(previousForecast),difference=Number.isFinite(previous)?forecastProfit-previous:null;
  return{currentProfit:current,forecastProfit,targetProfit:target,achievementRate:target?clamp(forecastProfit/target*100,-999,999):0,method:blend.model,weights:blend,confidence:confidence(days,history.length),comment:commentForDays(days),difference,projectedSales,projectedExpense,historicalRate,historyCount:history.length};
 }
 return{weights,confidence,commentForDays,calculate};
});
