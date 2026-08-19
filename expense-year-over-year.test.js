const test=require("node:test"),assert=require("node:assert/strict"),YoY=require("./expense-year-over-year.js");
test("2025年の12か月総支出は原表年間合計と一致する",()=>assert.equal(YoY.baselineTotal(),43362573));
test("前年差・前年比を計算し、前年0円では割合を返さない",()=>{assert.equal(YoY.difference(1123266,680000).difference,443266);assert.equal(YoY.difference(100,0).rate,null)});
test("累計は入力済み月だけを同じ月数で比較する",()=>{const result=YoY.analyze({selectedMonth:"2026-08",financeByMonth:{"2026-01":{monthlyExpense:4000000},"2026-02":{monthlyExpense:0},"2026-03":{monthlyExpense:3900000},"2026-08":{monthlyExpense:4100000}}});assert.deepEqual(result.includedMonths,[1,3,8]);assert.equal(result.cumulative.current,12000000);assert.equal(result.cumulative.previous,3412280+3589770+3602330)});
test("内訳は推測で対応させず比較対象外にする",()=>assert.ok(YoY.ITEMS.every(item=>item.comparable===false)));
