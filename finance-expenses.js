(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.FinanceExpenses=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const amount=value=>Math.max(0,Number(value)||0),own=(value,key)=>Object.prototype.hasOwnProperty.call(value||{},key);
 function resolve(record={},legacyRecord={},currentRecord={}){
  const canonical=own(record,"hospitalCashExpense")?record.hospitalCashExpense:own(record,"monthlyExpense")?record.monthlyExpense:own(legacyRecord,"expense")?legacyRecord.expense:own(currentRecord,"hospitalCashExpense")?currentRecord.hospitalCashExpense:currentRecord.monthlyExpense;
  const hospitalCashExpense=amount(canonical),depreciationExpense=amount(record.depreciationExpense);
  return {hospitalCashExpense,depreciationExpense,accountingExpense:hospitalCashExpense+depreciationExpense,source:own(record,"hospitalCashExpense")?"hospitalCashExpense":own(record,"monthlyExpense")?"monthlyExpense":own(legacyRecord,"expense")?"historicalExpense":"currentFinance"};
 }
 return {resolve};
});
