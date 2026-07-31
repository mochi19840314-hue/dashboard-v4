"use strict";
const assert=require("node:assert/strict");
const {savedMonth,needsConfirmation,createMonth}=require("./month-rollover.js");

assert.equal(savedMonth({meta:{activeMonth:"2026-07"}}),"2026-07");
assert.equal(needsConfirmation({meta:{activeMonth:"2026-07"}},"2026-08").show,true);
assert.equal(needsConfirmation({meta:{activeMonth:"2026-08"}},"2026-08").show,false,"同じ月には再表示しない");
assert.equal(needsConfirmation({},"2026-08").show,false,"新規データでは確認不要");

const old={
  entries:[{date:"2026-07-31",sales:900}],historical:{"2026-07":{sales:900}},settings:{"2026-07":{target:1}},
  finance:{balance:1200,monthlyExpense:500,incomeTarget:999},financeByMonth:{"2026-07":{balance:1200,monthlyExpense:500}},
  monthlyReports:{"2026-07":{memo:"過去メモ"}},memo:"前月メモ",meta:{activeMonth:"2026-07"},clinic:{name:"設定"},weatherCache:{condition:"晴れ"}
};
const next=createMonth(old,"2026-08",{target:5000000,businessDays:25});
assert.equal(next.meta.activeMonth,"2026-08");
assert.deepEqual(next.entries,old.entries,"日次・過去月データを保持");
assert.deepEqual(next.historical,old.historical,"年間データを保持");
assert.deepEqual(next.clinic,old.clinic,"設定を保持");
assert.deepEqual(next.weatherCache,old.weatherCache,"天気設定を保持");
assert.equal(next.financeByMonth["2026-08"].balance,1200,"口座残高を引き継ぐ");
assert.equal(next.financeByMonth["2026-08"].monthlyExpense,0);
assert.equal(next.finance.monthlyExpense,0);
assert.equal(next.finance.incomeTarget,999,"年間設定を保持");
assert.deepEqual(next.monthlyReports["2026-08"],{aiComment:"初期状態",memo:""});
assert.equal(next.memo,"","当月メモを空欄にする");
assert.equal(old.finance.monthlyExpense,500,"入力データを変更しない");

const existing={...old,financeByMonth:{...old.financeByMonth,"2026-08":{balance:77,monthlyExpense:42}},monthlyReports:{...old.monthlyReports,"2026-08":{memo:"既存"}}};
const preserved=createMonth(existing,"2026-08");
assert.equal(preserved.financeByMonth["2026-08"].monthlyExpense,42,"現在月に既存データがあっても上書きしない");
assert.equal(preserved.monthlyReports["2026-08"].memo,"既存");
console.log("month rollover tests: 18 checks passed");
