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
 function calculate({balance=0,currentSales=0,projectedSales=0,uncollected=0,otherIncome=0,cardReceipts={},today=new Date(),payments={},previousBalance=null,currentProfit=0,previousMedicalExpense=0,dayOfMonth}={}){
  const date=today instanceof Date?today:new Date(today),currentDay=Number(dayOfMonth??date.getDate()),present=amount(balance),cards=cardSchedule(cardReceipts,date),receipts={salesForecast:Math.max(0,amount(projectedSales)-amount(currentSales)),card:cards.total,uncollected:amount(uncollected),otherIncome:amount(otherIncome)};
  const scheduled={salary:amount(payments.salary),rent:amount(payments.rent),medical:amount(payments.medical),card:amount(payments.card),lease:amount(payments.lease),tax:amount(payments.tax),other:amount(payments.other)};
  const events=[],paymentDays={},unscheduled=[];
  cards.futureKeys.forEach(key=>events.push({day:key.endsWith("15")?15:cards.lastDay,incoming:cards.values[key]??0,outgoing:0}));
  Object.entries(scheduled).forEach(([key,value])=>{const configured=Number(payments[`${key}Day`]);if(!Number.isInteger(configured)||configured<1||configured>31){if(value>0)unscheduled.push(key);return}const day=Math.min(configured,cards.lastDay);paymentDays[key]=day;if(day>=currentDay)events.push({day,incoming:0,outgoing:value})});
  events.push({day:cards.lastDay,incoming:receipts.uncollected+receipts.otherIncome,outgoing:0});
  const daily=Array.from(events.reduce((days,event)=>{const value=days.get(event.day)||{day:event.day,incoming:0,outgoing:0};value.incoming+=event.incoming;value.outgoing+=event.outgoing;days.set(event.day,value);return days},new Map()).values()).sort((a,b)=>a.day-b.day);
  let runningBalance=present,minimumBalance=present;daily.forEach(event=>{runningBalance+=event.incoming-event.outgoing;event.balance=runningBalance;minimumBalance=Math.min(minimumBalance,runningBalance)});
  const incoming=receipts.card+receipts.uncollected+receipts.otherIncome,scheduledOutgoing=daily.reduce((sum,event)=>sum+event.outgoing,0),unscheduledOutgoing=unscheduled.reduce((sum,key)=>sum+scheduled[key],0),outgoing=scheduledOutgoing+unscheduledOutgoing,forecastBalance=present+incoming-outgoing,rating=safety(minimumBalance);
  const previous=Number(previousBalance),monthOverMonth=Number.isFinite(previous)?forecastBalance-previous:null;
  let comment="資金繰りは安定しています。";
  if(unscheduled.length)comment=`未設定の支払日があります。今月最低予想残高は概算です。${cards.missing.length?" カード入金予定額が未入力です。":""}`;
  else if(cards.missing.length)comment="カード入金予定額が未入力です。";
  else if(minimumBalance<3000000)comment="今月の最低予想残高が安全圏を下回ります。支払い時期を確認してください。";
  else if(currentDay<27&&scheduled.salary)comment="27日に給与支払いがあります。";
  else if(scheduled.medical>amount(previousMedicalExpense)*1.15&&amount(previousMedicalExpense)>0)comment="薬品仕入れが増加しています。";
  else if(Number(currentProfit)<0&&rating.level>=4)comment="利益は低めですが資金繰りは安定しています。";
  else if(rating.level===5)comment="資金繰りは非常に安定しています。大型投資を予定しても安全圏です。";
  return{balance:present,receipts,cards,scheduled,paymentDays,unscheduled,hasUnscheduledPayments:unscheduled.length>0,incoming,outgoing,minimumBalance,forecastBalance,timeline:daily,safety:rating,confidence:cards.confidence,monthOverMonth,comment};
 }
 return{calculate,cardSchedule,safety};
});
