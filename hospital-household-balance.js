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
  return calculate({clinicalSales,hospitalCashExpense:saved.hospitalCashExpense,householdExpense:saved.householdExpense});
 }
 return {calculate,forMonth};
});
