const assert=require("node:assert/strict");
const {model,widths}=require("./finance-cashflow-bars.js");
assert.deepEqual(model({clinicalSales:3407449,hospitalExpense:3670846,householdExpense:800000}),{sales:3407449,hospital:3670846,household:800000,total:4470846,hospitalBalance:-263397,combinedBalance:-1063397});
assert.equal(model({clinicalSales:100,hospitalExpense:60,householdExpense:20}).combinedBalance,20);
assert.equal(model({clinicalSales:100,hospitalExpense:60,householdExpense:20}).total,80);
assert.deepEqual(widths([0,0]),[0,0]);
assert.deepEqual(widths([50,100]),[50,100]);
console.log("finance cashflow bars tests passed");
