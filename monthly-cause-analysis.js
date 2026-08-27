"use strict";
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.MonthlyCauseAnalysis=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const number=value=>value!==""&&value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):null;
 const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
 const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 const product=values=>values.reduce((a,b)=>a*b,1);
 const metricLabels={days:"営業日数",patientsPerDay:"1営業日あたり患者数",unit:"客単価"};
 const clinicalLabels={newPatients:"新患数",revisits:"再診数",checkups:"健康診断",surgeries:"手術",trimming:"トリミング",bloodTests:"血液検査",imaging:"画像検査",preventive:"予防"};
 function shapleyProduct(current,baseline){
  const keys=["days","patientsPerDay","unit"],c=keys.map(key=>number(current?.[key])),b=keys.map(key=>number(baseline?.[key]));
  if(c.some(v=>v===null)||b.some(v=>v===null))return [];
  const totals=[0,0,0];
  permutations.forEach(order=>{const state=[...b];order.forEach(index=>{const before=product(state);state[index]=c[index];totals[index]+=product(state)-before})});
  return keys.map((key,index)=>({key,label:metricLabels[key],amount:totals[index]/permutations.length,current:c[index],baseline:b[index]}));
 }
 function clinicalChanges(current,baseline){
  return Object.entries(clinicalLabels).flatMap(([key,label])=>{const c=number(current?.[key]),b=number(baseline?.[key]);if(c===null||b===null||c===b)return[];const delta=c-b,rate=b!==0?delta/b*100:null;return[{key,label,delta,rate,current:c,baseline:b,direction:Math.sign(delta),score:rate===null?Math.abs(delta):Math.abs(rate)}]}).sort((a,b)=>b.score-a.score);
 }
 function expenseForMonth({month,financeByMonth={},historical={},currentFinance={},currentMonth}={}){
  const finance=financeByMonth?.[month]&&typeof financeByMonth[month]==="object"?financeByMonth[month]:{},history=historical?.[month]&&typeof historical[month]==="object"?historical[month]:{},current=month===currentMonth&&currentFinance&&typeof currentFinance==="object"?currentFinance:{};
  for(const source of [finance,history,current])for(const key of ["hospitalCashExpense","monthlyExpense","expense"]){const value=number(source?.[key]);if(value!==null)return value}
  return null;
 }
 function baselineExpense({comparison,financeByMonth,historical,currentFinance,currentMonth}={}){
  const values=(comparison?.months||[]).map(month=>expenseForMonth({month,financeByMonth,historical,currentFinance,currentMonth})).filter(v=>v!==null);return mean(values);
 }
 function build({month,current,baseline,comparison,financeByMonth={},historical={},currentFinance={},currentMonth}={}){
  if(!current||!baseline)return {ready:false,reason:"比較できる月次データが不足しています。",salesBridge:[],clinical:[],profit:null};
  const salesBridge=shapleyProduct(current,baseline),salesDelta=number(current.sales)!==null&&number(baseline.sales)!==null?number(current.sales)-number(baseline.sales):salesBridge.length?salesBridge.reduce((a,b)=>a+b.amount,0):null;
  const currentExpense=expenseForMonth({month,financeByMonth,historical,currentFinance,currentMonth}),baseExpense=baselineExpense({comparison,financeByMonth,historical,currentFinance,currentMonth});
  const expenseDelta=currentExpense!==null&&baseExpense!==null?currentExpense-baseExpense:null;
  const profit=salesDelta!==null&&expenseDelta!==null?{currentExpense,baselineExpense:baseExpense,expenseDelta,profitDelta:salesDelta-expenseDelta}:null;
  const clinical=clinicalChanges(current,baseline);
  const ranked=[...salesBridge].sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount));
  const strongest=ranked[0]||null;
  let headline="売上差の主要因を分析中です。";
  if(strongest)headline=`売上差への最大の構造要因は「${strongest.label}」です。`;
  if(profit&&Math.abs(profit.expenseDelta)>Math.abs(salesDelta||0))headline+=" 利益面では支出差の影響も大きくなっています。";
  return {ready:Boolean(salesBridge.length),salesDelta,salesBridge,clinical,profit,headline,comparison};
 }
 return {build,shapleyProduct,clinicalChanges,expenseForMonth};
});
