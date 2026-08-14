(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CashFlowForecast=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const amount=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
 function safety(balance){const level=balance>=20000000?5:balance>=10000000?4:balance>=5000000?3:balance>=3000000?2:1;return{level,stars:`${"★".repeat(level)}${"☆".repeat(5-level)}`,tone:["red","orange","yellow","blue","green"][level-1]}}
 function calculate({balance=0,currentSales=0,projectedSales=0,uncollected=0,otherIncome=0,payments={},previousBalance=null,currentProfit=0,previousMedicalExpense=0,dayOfMonth=1}={}){
  const present=amount(balance),receipts={salesForecast:Math.max(0,amount(projectedSales)-amount(currentSales)),uncollected:amount(uncollected),otherIncome:amount(otherIncome)};
  const scheduled={salary:amount(payments.salary),rent:amount(payments.rent),medical:amount(payments.medical),card:amount(payments.card),lease:amount(payments.lease),tax:amount(payments.tax),other:amount(payments.other)};
  const incoming=Object.values(receipts).reduce((sum,value)=>sum+value,0),outgoing=Object.values(scheduled).reduce((sum,value)=>sum+value,0),forecastBalance=present+incoming-outgoing,rating=safety(forecastBalance);
  const previous=Number(previousBalance),monthOverMonth=Number.isFinite(previous)?forecastBalance-previous:null;
  let comment="資金繰りは安定しています。";
  if(forecastBalance<3000000)comment="月末残高が安全圏を下回る予測です。支払い時期を確認してください。";
  else if(Number(dayOfMonth)<25&&scheduled.salary)comment="25日に給与支払いがあります。";
  else if(scheduled.medical>amount(previousMedicalExpense)*1.15&&amount(previousMedicalExpense)>0)comment="薬品仕入れが増加しています。";
  else if(Number(currentProfit)<0&&rating.level>=4)comment="利益は低めですが資金繰りは安定しています。";
  else if(rating.level===5)comment="資金繰りは非常に安定しています。大型投資を予定しても安全圏です。";
  return{balance:present,receipts,scheduled,incoming,outgoing,forecastBalance,safety:rating,monthOverMonth,comment};
 }
 return{calculate,safety};
});
