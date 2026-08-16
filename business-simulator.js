(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.BusinessSimulator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const ITEMS={
    unitPrice:{label:"客単価",unit:"円",step:100,max:5000,effect:30,difficulty:3},
    revisitRate:{label:"再診率",unit:"%",step:1,max:20,effect:24,difficulty:3},
    newPatients:{label:"新患数",unit:"件",step:1,max:30,effect:16,difficulty:4},
    imagingRate:{label:"画像検査率",unit:"%",step:1,max:30,effect:42,difficulty:2},
    checkups:{label:"健診件数",unit:"件",step:1,max:25,effect:31,difficulty:2},
    bloodTestRate:{label:"血液検査率",unit:"%",step:1,max:30,effect:22,difficulty:2},
    surgeries:{label:"手術件数",unit:"件",step:1,max:15,effect:29,difficulty:4},
    vaccines:{label:"ワクチン件数",unit:"件",step:1,max:30,effect:19,difficulty:2}
  };
  const number=value=>Number.isFinite(Number(value))?Number(value):0;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,number(value)));
  const average=(list,key)=>list.length?list.reduce((sum,item)=>sum+number(item[key]),0)/list.length:0;
  function baseline(source={}){
    const entries=Array.isArray(source.entries)?source.entries.slice(-90):[],patients=entries.reduce((s,e)=>s+number(e.patients),0),sales=entries.reduce((s,e)=>s+number(e.sales),0);
    const clinical=key=>entries.reduce((s,e)=>s+number(e.clinical?.[key]),0);
    const expense=number(source.finance?.monthlyExpense),monthlySales=entries.length?average(entries,"sales")*26:0;
    return {unitPrice:patients?sales/patients:10000,revisitRate:patients?clamp((patients-entries.reduce((s,e)=>s+number(e.newPatients),0))/patients*100,0,100):70,newPatients:average(entries,"newPatients"),imagingRate:patients?clamp((clinical("xrays")+clinical("ultrasounds"))/patients*100,0,100):15,checkups:average(entries,"checkups"),bloodTestRate:patients?clamp(clinical("bloodTests")/patients*100,0,100):20,surgeries:average(entries,"surgeries"),vaccines:patients?clinical("preventive")/Math.max(1,entries.length):2,annualProfit:Math.max(0,(monthlySales-expense)*12),sampleDays:entries.length};
  }
  function modelFactor(key,source){const learned=number(source?.improvementModels?.[key]?.profitFactor);return learned>0?clamp(learned,.5,1.5):1}
  function simulate(source={},changes={},goal=20000000){
    const current=baseline(source),sampleConfidence=clamp(55+current.sampleDays*1.1,55,94),libraryBoost=clamp((source.successLibrary?.length||0)*.8,0,5),forecastBoost=clamp((source.forecastHistory?.length||0)*.15,0,3);
    const ranking=Object.entries(ITEMS).map(([key,item])=>{const change=clamp(changes[key],0,item.max),normalized=change/(item.max||1),profit=Math.round(item.effect*10000*normalized*modelFactor(key,source)),success=Math.round(clamp(sampleConfidence+libraryBoost+forecastBoost-item.difficulty*2+normalized*3,50,97));return {key,...item,change,profit,success,score:profit*(success/100)*(6-item.difficulty)/5}}).sort((a,b)=>b.score-a.score);
    const delta=ranking.reduce((s,item)=>s+item.profit,0),annualProfit=current.annualProfit+delta*12,probability=Math.round(clamp(52+(annualProfit/Math.max(goal,1))*36+libraryBoost-(goal>annualProfit?5:0),35,96)),difficulty=Math.round(clamp(ranking.filter(x=>x.change>0).reduce((s,x)=>s+x.difficulty,0)/Math.max(1,ranking.filter(x=>x.change>0).length),1,5));
    return {current,goal,annualProfit,delta,probability,difficulty,ranking,comment:ranking[0]?.profit>0?`この病院では、${ranking[0].label}の改善が最も高い利益改善効果を期待できます。`:"改善したい項目のスライダーを動かすと、Knowledge Coreが効果を即時計算します。",dataStatus:current.sampleDays<10?`学習データ蓄積中（${current.sampleDays}/10営業日）`: `${current.sampleDays}営業日の病院データで分析`};
  }
  function reversePlan(source={},goal=20000000){const current=baseline(source),gap=Math.max(0,goal-current.annualProfit),changes={};let remaining=gap/12;Object.entries(ITEMS).sort((a,b)=>b[1].effect/a[1].difficulty-a[1].effect/b[1].difficulty).forEach(([key,item])=>{const use=Math.min(1,remaining/(item.effect*10000));changes[key]=Math.round(item.max*use/item.step)*item.step;remaining-=item.effect*10000*use});return {changes,result:simulate(source,changes,goal)} }
  function updateAtNight(source={},options={}){const now=options.now?new Date(options.now):new Date(),date=(options.date||now.toISOString().slice(0,10)),history=Array.isArray(source.simulationHistory)?source.simulationHistory:[];if(now.getHours()<18||history.some(x=>x.date===date))return {saved:false,simulationHistory:history,improvementModels:source.improvementModels||{}};const result=simulate(source,source.businessSimulator?.changes||{},source.goalPlanner?.annualProfit||20000000),record={date,annualProfit:result.annualProfit,probability:result.probability,changes:{...(source.businessSimulator?.changes||{})},knowledgeSamples:result.current.sampleDays};return {saved:true,simulationHistory:[...history,record].slice(-365),improvementModels:{...(source.improvementModels||{}),updatedAt:now.toISOString()}}}
  return {ITEMS,baseline,simulate,reversePlan,updateAtNight};
});
