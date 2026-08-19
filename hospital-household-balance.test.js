const test=require("node:test");
const assert=require("node:assert/strict");
const Balance=require("./hospital-household-balance");

test("診療売上から病院実支出と家計支出だけを差し引く",()=>{
 const result=Balance.calculate({clinicalSales:4800000,hospitalCashExpense:3500000,householdExpense:800000});
 assert.deepEqual(result,{clinicalSales:4800000,hospitalCashExpense:3500000,householdExpense:800000,totalExpense:4300000,difference:500000});
});

test("病院収支は実支出だけを差し引き、支出率と損益分岐差額を返す",()=>{
 const surplus=Balance.calculateHospital({clinicalSales:5000000,hospitalCashExpense:4000000});
 assert.equal(surplus.difference,1000000);assert.equal(surplus.expenseRate,80);assert.equal(surplus.breakEvenRemaining,0);
 const deficit=Balance.calculateHospital({clinicalSales:2635812,hospitalCashExpense:4099427});
 assert.equal(deficit.difference,-1463615);assert.equal(deficit.breakEvenRemaining,1463615);
});

test("診療売上が0なら支出率は計算しない",()=>{
 assert.equal(Balance.calculateHospital({clinicalSales:0,hospitalCashExpense:1000}).expenseRate,null);
});

test("選択月が月末前の当月の場合だけ月途中と判定する",()=>{
 assert.equal(Balance.isMonthInProgress("2026-08",new Date(2026,7,19)),true);
 assert.equal(Balance.isMonthInProgress("2026-08",new Date(2026,7,31)),false);
 assert.equal(Balance.isMonthInProgress("2026-07",new Date(2026,7,19)),false);
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
