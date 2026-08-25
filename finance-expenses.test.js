const test=require("node:test"),assert=require("node:assert/strict"),FinanceExpenses=require("./finance-expenses.js");
test("病院実支出を正規値として旧月間支出より優先する",()=>{assert.deepEqual(FinanceExpenses.resolve({hospitalCashExpense:400,monthlyExpense:999,depreciationExpense:50}),{hospitalCashExpense:400,depreciationExpense:50,accountingExpense:450,source:"hospitalCashExpense"})});
test("旧月間支出と過去データを読み込み、減価償却を二重計上しない",()=>{assert.equal(FinanceExpenses.resolve({monthlyExpense:300},{expense:200}).hospitalCashExpense,300);assert.equal(FinanceExpenses.resolve({}, {expense:200}).accountingExpense,200)});
