const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("app.js","utf8"),html=fs.readFileSync("index.html","utf8"),style=fs.readFileSync("style.css","utf8"),sw=fs.readFileSync("sw.js","utf8"),pkg=fs.readFileSync("package.json","utf8");

test("月末キャッシュフロー予測のUIと専用処理を公開しない",()=>{
  for(const source of [app,html,style,sw,pkg]){
    assert.doesNotMatch(source,/CashFlowForecast|cash-flow-forecast|cashFlow(?:Balance|Incoming|Outgoing|Forecast|Difference|Safety|Confidence|Comment|Smbc|Jcb|OtherIncome|TotalExpense)/);
  }
  for(const label of ["月末キャッシュフロー予測","現在口座残高","今月入金見込","今月支出合計","月間資金差額","月末予想残高","安全度","内訳・入力"]){
    assert.doesNotMatch(html,new RegExp(label));
  }
});

test("財務保存と既存のカード入金データを変更せず維持する",()=>{
  assert.match(app,/data\.finance=\{\.\.\.data\.finance,balance:/);
  assert.match(app,/cardReceiptsByMonth:\{\.\.\.\(raw\.cardReceiptsByMonth\|\|\{\}\)\}/);
  assert.match(app,/financeByMonth:\{\.\.\.\(raw\.financeByMonth\|\|\{\}\)\}/);
  for(const id of ["personnelExpense","medicalExpense","cardFee","hospitalCashExpense","householdExpense"]){
    assert.match(html,new RegExp(`id="${id}"`));
  }
});

test("年間集計・事業所得・AI分析・経営スコアを引き続き表示する",()=>{
  for(const label of ["年間集計","推定年収（事業所得目安）","AI MANAGEMENT INSIGHTS","経営スコア"]){
    assert.match(html,new RegExp(label));
  }
  assert.match(app,/renderMonthlyProfitForecast\(\)/);
  assert.match(app,/renderBusinessInsights\(rows,total,active,profit,rate,salesForecast,profitForecast,forecastContext\)/);
});
