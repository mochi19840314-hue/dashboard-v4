const test=require("node:test");
const assert=require("node:assert/strict");
const Balance=require("./hospital-household-balance");

test("診療売上から病院実支出と家計支出だけを差し引く",()=>{
 const result=Balance.calculate({clinicalSales:4800000,hospitalCashExpense:3500000,householdExpense:800000});
 assert.deepEqual(result,{clinicalSales:4800000,hospitalCashExpense:3500000,householdExpense:800000,totalExpense:4300000,difference:500000});
});

test("選択した月ごとに保存値を復元する",()=>{
 const months={
  "2026-07":{hospitalCashExpense:3500000,householdExpense:800000},
  "2026-08":{hospitalCashExpense:3100000,householdExpense:650000}
 };
 assert.equal(Balance.forMonth(months,"2026-07",4800000).difference,500000);
 assert.equal(Balance.forMonth(months,"2026-08",4200000).difference,450000);
 assert.equal(Balance.forMonth(months,"2026-07",4800000).householdExpense,800000);
});
