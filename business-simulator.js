(function(root,factory){
  const annualForecast=typeof module==="object"&&module.exports?require("./annual-profit-forecast.js"):root.AnnualProfitForecast;
  const api=factory(annualForecast);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.BusinessSimulator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(AnnualProfitForecast){
  "use strict";
  const ITEMS={
    unitPrice:{label:"客単価",unit:"円",step:100,max:5000,effect:30,difficulty:3},
    revisitRate:{label:"再診率",unit:"%",step:1,max:20,effect:24,difficulty:3},
    newPatients:{label:"新患数",unit:"件",step:1,max:30,effect:16,difficulty:4},
    imagingRate:{label:"画像検査率",unit:"%",step:1,max:30,effect:42,difficulty:2},
    checkups:{label:"健診件数",unit:"件",step:1,max:25,effect:31,difficulty:2},
    bloodTestRate:{label:"血液検査率",unit:"%",step:1,max:30,effect:22,difficulty:2},
    surgeries:{label:"手術件数",unit:"件",step:1,max:15,effect:29,difficulty:4},
    preventive:{label:"予防件数",unit:"件",step:1,max:30,effect:19,difficulty:2}
  };
  const number=value=>Number.isFinite(Number(value))?Number(value):0;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,number(value)));
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);
  const monthOf=date=>String(date||"").slice(0,7);
  function availableMonths(source={}){return [...new Set((source.entries||[]).map(e=>monthOf(e.date)).filter(m=>/^\d{4}-\d{2}$/.test(m)))].sort().reverse()}
  function aggregate(entries){
    const total=(key,nested=false)=>entries.reduce((sum,e)=>sum+(nested?number(e.clinical?.[key]):number(e[key])),0);
    const patients=total("patients"),sales=total("sales"),newPatients=total("newPatients");
    const recorded=(key,nested=false)=>entries.some(e=>nested?own(e.clinical,key):own(e,key));
    return {patients,sales,newPatients,checkups:total("checkups"),surgeries:total("surgeries"),preventive:total("preventive",true),xrays:total("xrays",true),ultrasounds:total("ultrasounds",true),bloodTests:total("bloodTests",true),recorded:{patients:recorded("patients"),sales:recorded("sales"),newPatients:recorded("newPatients"),checkups:recorded("checkups"),surgeries:recorded("surgeries"),preventive:recorded("preventive",true),imaging:recorded("xrays",true)||recorded("ultrasounds",true),bloodTests:recorded("bloodTests",true)}};
  }
  function monthBaseline(source={},month,options={}){
    const now=options.now?new Date(options.now):new Date(),currentMonth=monthOf(now.toISOString()),months=availableMonths(source),selected=month||source.selectedMonth||(months.includes(currentMonth)?currentMonth:months[0])||currentMonth;
    const entries=(source.entries||[]).filter(e=>monthOf(e.date)===selected),hasData=entries.length>0,totals=aggregate(entries);
    const current=selected===currentMonth,configured=number(source.settings?.[selected]?.businessDays),scheduled=Math.max(entries.length,configured||number(source.scheduledBusinessDays)||entries.length),elapsed=entries.length,projection=current&&elapsed>0&&scheduled>elapsed?scheduled/elapsed:1;
    const count=(value,key)=>hasData&&totals.recorded[key]?Math.round(value*projection):null;
    const expenseRecord=source.financeByMonth?.[selected],expense=number(expenseRecord?.hospitalCashExpense??expenseRecord?.monthlyExpense??source.finance?.hospitalCashExpense??source.finance?.monthlyExpense),actualProfit=totals.sales-expense,monthlyProfit=hasData?(current?totals.sales*projection-expense:actualProfit):null;
    return {month:selected,isCurrentMonth:current,hasData,label:current?"月末予測":"実績",elapsedBusinessDays:elapsed,scheduledBusinessDays:scheduled,
      unitPrice:hasData&&totals.recorded.sales&&totals.recorded.patients&&totals.patients?totals.sales/totals.patients:null,revisitRate:hasData&&totals.recorded.newPatients&&totals.patients?clamp((totals.patients-totals.newPatients)/totals.patients*100,0,100):null,
      newPatients:count(totals.newPatients,"newPatients"),imagingRate:hasData&&totals.recorded.imaging&&totals.patients?clamp((totals.xrays+totals.ultrasounds)/totals.patients*100,0,100):null,
      checkups:count(totals.checkups,"checkups"),bloodTestRate:hasData&&totals.recorded.bloodTests&&totals.patients?clamp(totals.bloodTests/totals.patients*100,0,100):null,surgeries:count(totals.surgeries,"surgeries"),preventive:count(totals.preventive,"preventive"),monthlyProfit,sampleDays:elapsed};
  }
  function baseline(source={},options={}){
    const monthly=monthBaseline(source,options.month||source.selectedMonth,options),stableAnnualProfitForecast=AnnualProfitForecast?.getStableAnnualProfitForecast(source.annualForecast);
    return {...monthly,annualProfit:number(stableAnnualProfitForecast)};
  }
  function modelFactor(key,source){const learned=number(source?.improvementModels?.[key]?.profitFactor);return learned>0?clamp(learned,.5,1.5):1}
  function improvementLimits(source={},options={}){const current=baseline(source,options),limits={};Object.entries(ITEMS).forEach(([key,item])=>{limits[key]=Math.max(0,Math.floor(Math.min(item.max,item.unit==="%"?100-number(current[key]):item.max)/item.step)*item.step)});return limits}
  function annualMultiplier(source,selectedMonth,mode){
    if(mode==="oneMonth")return {value:1,reliable:true};
    const rows=availableMonths(source).map(month=>({month,sales:aggregate((source.entries||[]).filter(e=>monthOf(e.date)===month)).sales})).filter(x=>x.sales>0),selected=rows.find(x=>x.month===selectedMonth);
    if(rows.length>=3&&selected?.sales)return {value:rows.reduce((s,x)=>s+x.sales/selected.sales,0)*(12/rows.length),reliable:true};
    return {value:12,reliable:false};
  }
  function simulate(source={},changes={},goal=20000000,options={}){
    const current=baseline(source,options),limits=improvementLimits(source,options),sampleConfidence=clamp(55+current.sampleDays*1.1,55,94),libraryBoost=clamp((source.successLibrary?.length||0)*.8,0,5),forecastBoost=clamp((source.forecastHistory?.length||0)*.15,0,3);
    const ranking=Object.entries(ITEMS).map(([key,item])=>{const change=clamp(changes[key],0,limits[key]),normalized=change/(item.max||1),profit=Math.round(item.effect*10000*normalized*modelFactor(key,source)),success=Math.round(clamp(sampleConfidence+libraryBoost+forecastBoost-item.difficulty*2+normalized*3,50,97));return {key,...item,change,profit,success,score:profit*(success/100)*(6-item.difficulty)/5}}).sort((a,b)=>b.score-a.score);
    const delta=ranking.reduce((s,item)=>s+item.profit,0),mode=options.annualMode||source.annualMode||"recurring",multiplier=annualMultiplier(source,current.month,mode),annualProfit=current.annualProfit+delta*multiplier.value,monthlyProfit=number(current.monthlyProfit),simulatedMonthlyProfit=monthlyProfit+delta,probability=Math.round(clamp(52+(annualProfit/Math.max(goal,1))*36+libraryBoost-(goal>annualProfit?5:0),35,96)),difficulty=Math.round(clamp(ranking.filter(x=>x.change>0).reduce((s,x)=>s+x.difficulty,0)/Math.max(1,ranking.filter(x=>x.change>0).length),1,5));
    return {current,goal,stableAnnualProfitForecast:current.annualProfit,baseMonthlyProfit:current.monthlyProfit,simulatedMonthlyProfit:current.hasData?simulatedMonthlyProfit:null,monthlyDelta:delta,simulatedAnnualProfit:annualProfit,annualProfit,annualMode:mode,annualMultiplier:multiplier.value,annualReliability:multiplier.reliable,goalDifference:annualProfit-goal,delta,probability,difficulty,ranking,comment:ranking[0]?.profit>0?`この病院では、${ranking[0].label}の改善が最も高い利益改善効果を期待できます。`:"改善したい項目のスライダーを動かすと、Knowledge Coreが効果を即時計算します。",dataStatus:current.hasData?`${current.month}の${current.sampleDays}営業日の病院データで分析`: `学習データなし（${current.month}はデータなし）`};
  }
  function reversePlan(source={},goal=20000000,options={}){const current=baseline(source,options),requiredProfit=goal-current.annualProfit,limits=improvementLimits(source,options),changes=Object.fromEntries(Object.keys(ITEMS).map(key=>[key,0]));if(requiredProfit<=0)return {changes,result:simulate(source,changes,goal,options),requiredProfit,status:"current"};const candidates=Object.entries(ITEMS).sort((a,b)=>b[1].effect/b[1].difficulty-a[1].effect/a[1].difficulty);let result=simulate(source,changes,goal,options);while(result.annualProfit<goal){let advanced=false;for(const [key,item] of candidates){if(changes[key]+item.step>limits[key])continue;changes[key]+=item.step;advanced=true;result=simulate(source,changes,goal,options);if(result.annualProfit>=goal)break}if(!advanced)break}return {changes,result,requiredProfit,status:result.annualProfit>=goal?"achieved":"unreachable"}}
  function updateAtNight(source={},options={}){const now=options.now?new Date(options.now):new Date(),date=(options.date||now.toISOString().slice(0,10)),history=Array.isArray(source.simulationHistory)?source.simulationHistory:[];if(now.getHours()<18||history.some(x=>x.date===date))return {saved:false,simulationHistory:history,improvementModels:source.improvementModels||{}};const result=simulate(source,source.businessSimulator?.changes||{},source.goalPlanner?.annualProfit||20000000);return {saved:true,simulationHistory:[...history,{date,annualProfit:result.annualProfit,probability:result.probability,changes:{...(source.businessSimulator?.changes||{})},knowledgeSamples:result.current.sampleDays}].slice(-365),improvementModels:{...(source.improvementModels||{}),updatedAt:now.toISOString()}}}
  return {ITEMS,availableMonths,monthBaseline,baseline,improvementLimits,simulate,reversePlan,updateAtNight};
});
