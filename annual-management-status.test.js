const test=require("node:test");
const assert=require("node:assert/strict");
const AnnualManagementStatus=require("./annual-management-status");

test("uses annual totals and produces statuses from existing target pace",()=>{
  const result=AnnualManagementStatus.build({annualSales:31730000,annualExpense:25220000,activeMonths:6,annualTarget:60000000,monthTarget:5000000,hasAnnualData:true,todayHasData:true,todaySales:120000,todayTarget:180000,monthHasData:true,monthForecast:4700000,previousComparable:true,previousSales:30000000});
  assert.equal(result.profit,6510000);
  assert.equal(result.labels.today,"● 要確認");
  assert.equal(result.labels.month,"△ 注意");
  assert.equal(result.labels.annual,"○ 順調");
  assert.equal(result.comment,"今日は低調ですが、年間では順調な推移です。");
  assert.equal(Math.round(result.yoy*10)/10,5.8);
});

test("does not turn missing prior-year data into zero percent",()=>{
  const result=AnnualManagementStatus.build({annualSales:1000000,annualExpense:800000,activeMonths:1,annualTarget:60000000,monthTarget:5000000,hasAnnualData:true,previousComparable:false,previousSales:0});
  assert.equal(result.yoy,null);
  assert.equal(result.labels.today,"— データ不足");
});
