const test=require("node:test");
const assert=require("node:assert/strict");
const AnnualManagementStatus=require("./annual-management-status");

const buildAtPace=(progress,timeProgressRate,overrides={})=>AnnualManagementStatus.build({
  annualSales:progress*1000000,
  annualExpense:0,
  activeMonths:6,
  annualTarget:100000000,
  hasAnnualData:true,
  timeProgressRate,
  ...overrides
});

test("case A: 60% progress at 60% of the year is on pace",()=>{
  const result=buildAtPace(60,60);
  assert.equal(result.annualPaceRatio,100);
  assert.equal(result.labels.annual,"○ 順調");
});

test("case B: 57.1% progress at 63% of the year needs attention",()=>{
  const result=buildAtPace(57.1,63,{monthHasData:true,monthForecast:900000,monthTarget:1000000});
  assert.equal(Math.round(result.annualPaceRatio*10)/10,90.6);
  assert.equal(result.labels.annual,"△ 注意");
  assert.equal(result.comment,"今月は弱めで、年間も目標ペースをやや下回っています。");
});

test("case C: 50% progress at 65% of the year requires review",()=>{
  const result=buildAtPace(50,65);
  assert.equal(Math.round(result.annualPaceRatio*10)/10,76.9);
  assert.equal(result.labels.annual,"● 要確認");
  assert.equal(result.comment,"年間の目標ペースを下回っています。売上・支出・必要日商を確認してください。");
});

test("case D: an unset annual target is insufficient data",()=>{
  const result=buildAtPace(60,60,{annualTarget:0});
  assert.equal(result.progress,null);
  assert.equal(result.annualPaceRatio,null);
  assert.equal(result.labels.annual,"— データ不足");
});

test("case E: 70% progress at 60% of the year is ahead of pace",()=>{
  const result=buildAtPace(70,60);
  assert.equal(Math.round(result.annualPaceRatio*10)/10,116.7);
  assert.equal(result.labels.annual,"○ 順調");
});

test("missing annual sales or time progress does not become zero percent",()=>{
  const noSales=buildAtPace(0,60);
  const noTime=buildAtPace(60,0);
  assert.equal(noSales.annualPaceRatio,null);
  assert.equal(noSales.labels.annual,"— データ不足");
  assert.equal(noTime.annualPaceRatio,null);
  assert.equal(noTime.labels.annual,"— データ不足");
});

test("keeps annual totals and prior-year comparison independent from pace",()=>{
  const result=AnnualManagementStatus.build({annualSales:31730000,annualExpense:25220000,activeMonths:6,annualTarget:60000000,timeProgressRate:50,hasAnnualData:true,previousComparable:true,previousSales:30000000});
  assert.equal(result.profit,6510000);
  assert.equal(Math.round(result.yoy*10)/10,5.8);
});

test("today-only decline uses the monthly and annual wording",()=>{
  const result=buildAtPace(60,60,{todayHasData:true,todaySales:60,todayTarget:100,monthHasData:true,monthForecast:100,monthTarget:100});
  assert.equal(result.comment,"今日は低調ですが、月間・年間では順調な推移です。");
});
