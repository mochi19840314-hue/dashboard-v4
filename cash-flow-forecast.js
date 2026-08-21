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
 function calculate({balance=0,otherIncome=0,cardReceipts={},today=new Date(),totalExpense=0,previousBalance=null}={}){
  const present=amount(balance),cards=cardSchedule(cardReceipts,today),cardTotal=Object.values(cards.values).reduce((sum,value)=>sum+(value??0),0),receipts={card:cardTotal,otherIncome:amount(otherIncome)};
  const incoming=receipts.card+receipts.otherIncome,outgoing=amount(totalExpense),cashDifference=incoming-outgoing,forecastBalance=present+cashDifference,rating=safety(forecastBalance);
  const previous=Number(previousBalance),monthOverMonth=Number.isFinite(previous)?forecastBalance-previous:null;
  let comment="現在口座残高を基準に、今後の入金予定と月間支出から月末残高を概算しています。";
  if(cards.missing.length)comment="現在口座残高を基準にした概算です。カード入金予定額が未入力です。";
  else if(forecastBalance<3000000)comment="月末予想残高が安全圏を下回ります。月間支出を確認してください。";
  else if(rating.level===5)comment="月末予想残高は非常に安定しています。";
  return{balance:present,receipts,cards,incoming,outgoing,cashDifference,forecastBalance,safety:rating,confidence:cards.confidence,monthOverMonth,comment};
 }
 return{calculate,cardSchedule,safety};
});
