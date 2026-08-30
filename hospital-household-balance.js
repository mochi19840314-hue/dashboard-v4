(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.HospitalHouseholdBalance=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const amount=value=>Math.max(0,Number(value)||0);
 function calculate({clinicalSales=0,hospitalCashExpense=0,householdExpense=0}={}){
  const sales=amount(clinicalSales),hospital=amount(hospitalCashExpense),household=amount(householdExpense),totalExpense=hospital+household;
  return {clinicalSales:sales,hospitalCashExpense:hospital,householdExpense:household,totalExpense,difference:sales-totalExpense};
 }
 function forMonth(financeByMonth,month,clinicalSales=0){
  const saved=financeByMonth?.[month]||{};
  const hospitalCashExpense=typeof FinanceExpenses!=="undefined"?FinanceExpenses.resolve(saved).hospitalCashExpense:saved.hospitalCashExpense??saved.monthlyExpense;
  return calculate({clinicalSales,hospitalCashExpense,householdExpense:saved.householdExpense});
 }
 function calculateHospital({clinicalSales=0,hospitalCashExpense=0}={}){
  const sales=amount(clinicalSales),expense=amount(hospitalCashExpense),difference=sales-expense;
  return {clinicalSales:sales,hospitalCashExpense:expense,difference,expenseRate:sales?expense/sales*100:null,breakEvenRemaining:Math.max(0,-difference)};
 }
 function isMonthInProgress(month,today=new Date()){
  if(!/^\d{4}-\d{2}$/.test(String(month)))return false;
  const current=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`,lastDay=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
  return month===current&&today.getDate()<lastDay;
 }
 return {calculate,forMonth,calculateHospital,isMonthInProgress};
});

if(typeof document!=="undefined"&&!document.querySelector('script[data-vet-recruitment-signal]')){
 const script=document.createElement("script");
 script.src="./vet-recruitment-signal.js?v=9600";
 script.dataset.vetRecruitmentSignal="1";
 script.onload=()=>{
  if(document.querySelector('script[data-vet-recruitment-director]'))return;
  const bridge=document.createElement("script");
  bridge.src="./vet-recruitment-director-bridge.js?v=9600";
  bridge.dataset.vetRecruitmentDirector="1";
  document.head.appendChild(bridge);
 };
 document.head.appendChild(script);
}

if(typeof document!=="undefined"&&!document.querySelector('script[data-dashboard-focus-mode]')){
 const focus=document.createElement("script");
 focus.src="./dashboard-focus-mode.js?v=9601";
 focus.dataset.dashboardFocusMode="1";
 document.head.appendChild(focus);
}

if(typeof document!=="undefined"&&!document.querySelector('script[data-director-condition]')){
 const condition=document.createElement("script");
 condition.src="./director-condition.js?v=9602";
 condition.dataset.directorCondition="1";
 document.head.appendChild(condition);
}
