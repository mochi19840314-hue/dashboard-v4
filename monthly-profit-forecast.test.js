const assert=require("node:assert/strict"),Forecast=require("./monthly-profit-forecast.js");
const calculate=(days,profits,extra={})=>Forecast.calculate({businessDays:days,scheduledBusinessDays:25,currentProfit:profits.reduce((a,b)=>a+b,0),dailyProfits:profits,targetProfit:1000,...extra});
assert.equal(calculate(4,[100,100,100,100]).forecastProfit,2500,"4日以下は現在利益の日割り");
assert.equal(calculate(5,[10,20,30,40,50]).method,"last5","5日以上は直近5日");
assert.equal(calculate(10,[1,2,3,4,5,6,7,8,9,10]).dailyAverage,5.5,"10日以上は直近10日平均");
assert.equal(calculate(20,Array(20).fill(100)).method,"ewma","20日以上はEWMA");
assert.equal(Forecast.confidence(25).stars,"★★★★★","25日以上は最高信頼度");
assert.match(calculate(5,[100,100,100,100,100]).comment,/目標達成圏/,"影武者コメントを自動生成");
console.log("monthly profit forecast tests passed");
