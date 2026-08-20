(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CashFlowForecast=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const amount=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
 const CARD_FIELDS=["smbc15","smbcEnd","jcb15","jcbEnd"];
 function enteredAmount(value){return value===null||value===undefined||value===""?null:amount(value)}
 function safety(balance){const level=balance>=20000000?5:balance>=10000000?4:balance>=5000000?3:balance>=3000000?2:1;return{level,stars:`${"★".repeat(level)}${"☆".repeat(5-level)}`,tone:["red","orange","yellow","blue","green"][level-1]}}
 function cardSchedule(cardReceipts={},today=new Date()){
  const date=today instanceof Date?today:new Date(today),year=date.getFullYear(),month=date.getMonth(),day=date.getDate(),lastDay=new Date(year,month+1,0).getDate();
  const values=Object.fromEntries(CARD_FIELDS.map(key=>[key,enteredAmount(cardReceipts[key])]));
  const futureKeys=[...(day<=15?["smbc15","jcb15"]:[]),...(day<=lastDay?["smbcEnd","jcbEnd"]:[])];
  const entered=futureKeys.filter(key=>values[key]!==null),missing=futureKeys.filter(key=>values[key]===null);
  const total=entered.reduce((sum,key)=>sum+values[key],0),level=missing.length===0?"high":entered.length?"medium":"low";
  return{values,futureKeys,entered,missing,total,lastDay,confidence:{level,label:{high:"高",medium:"中",low:"低"}[level]}};
 }
 function calculate({balance=0,currentSales=0,projectedSales=0,uncollected=0,otherIncome=0,cardReceipts={},today=new Date(),payments={},previousBalance=null,currentProfit=0,previousMedicalExpense=0}={}){
  const present=amount(balance),cards=cardSchedule(cardReceipts,today),receipts={salesForecast:Math.max(0,amount(projectedSales)-amount(currentSales)),card:cards.total,uncollected:amount(uncollected),otherIncome:amount(otherIncome)};
  const scheduled={salary:amount(payments.salary),rent:amount(payments.rent),medical:amount(payments.medical),card:amount(payments.card),lease:amount(payments.lease),tax:amount(payments.tax),other:amount(payments.other)};
  const incoming=receipts.card+receipts.uncollected+receipts.otherIncome,outgoing=Object.values(scheduled).reduce((sum,value)=>sum+value,0),forecastBalance=present+incoming-outgoing,rating=safety(present);
  const previous=Number(previousBalance),monthOverMonth=Number.isFinite(previous)?forecastBalance-previous:null;
  let comment="現在口座残高を基準に、今後の入金予定と月間支出から月末残高を概算しています。";
  if(cards.missing.length)comment="現在口座残高を基準にした概算です。カード入金予定額が未入力です。";
  else if(forecastBalance<3000000)comment="月末予想残高が安全圏を下回ります。月間支出を確認してください。";
  else if(scheduled.medical>amount(previousMedicalExpense)*1.15&&amount(previousMedicalExpense)>0)comment="薬品仕入れが増加しています。";
  else if(Number(currentProfit)<0&&rating.level>=4)comment="利益は低めですが、現在の口座残高には余裕があります。";
  else if(rating.level===5)comment="現在の口座残高は非常に安定しています。";
  return{balance:present,receipts,cards,scheduled,incoming,outgoing,forecastBalance,safety:rating,confidence:cards.confidence,monthOverMonth,comment};
 }
 return{calculate,cardSchedule,safety};
});
