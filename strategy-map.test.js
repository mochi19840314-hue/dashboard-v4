"use strict";
const assert=require("node:assert/strict"),StrategyMap=require("./strategy-map");
const date=index=>{const d=new Date(Date.UTC(2026,0,index+1));return d.toISOString().slice(0,10)},entry=(index,extra={})=>({date:date(index),sales:100000+index*1000,patients:10,newPatients:2,checkups:2,clinical:{xrays:1,ultrasounds:1,revisits:6},...extra});

const insufficient=StrategyMap.analyze({entries:[entry(0)]});
assert.equal(insufficient.themes.length,9,"all requested themes exist with sparse data");
assert.ok(insufficient.themes.every(item=>item.confidence==="low"));

const closed=date(4),closedResult=StrategyMap.analyze({entries:Array.from({length:8},(_,i)=>entry(i)),isClosed:value=>value===closed});
assert.equal(closedResult.businessDaysUsed,7,"closed days are excluded");
assert.equal(StrategyMap.update({today:closed,hour:20,entries:[],isClosed:value=>value===closed}).saved,false,"closed days do not trigger an update");

const missingProfit=StrategyMap.analyze({entries:Array.from({length:20},(_,i)=>entry(i))}).themes.find(item=>item.key==="profitRate");
assert.match(missingProfit.reason,/利益率未入力/);

const many=Array.from({length:115},(_,i)=>entry(i,{expense:70000})),trimmed=StrategyMap.update({today:"2026-05-01",hour:18,entries:many,strategyMap:StrategyMap.EMPTY()});
assert.equal(trimmed.businessDaysUsed,100,"only the latest 100 business days are learned");
assert.equal(trimmed.monthlyHistory.length,1,"older learning is archived monthly");

assert.equal(StrategyMap.update({today:"2026-05-02",hour:17,entries:many}).saved,false,"daytime does not update");
assert.equal(StrategyMap.update({today:"2026-05-02",hour:18,entries:many}).saved,true,"18:00 updates");
assert.equal(StrategyMap.update({today:"2026-05-03",hour:12,businessDayEnded:true,entries:many}).saved,true,"business-day end updates");
assert.equal(StrategyMap.update({today:"2026-05-04",hour:12,knowledgeCoreUpdated:true,entries:many}).saved,true,"Knowledge Core update triggers learning");

const restored=StrategyMap.normalize({updated:"2026-05-01T18:00:00",themes:[{theme:"健診"}],priorities:[{theme:"健診"}],monthlyHistory:[{month:"2026-04"}]});
assert.equal(restored.monthlyHistory[0].month,"2026-04");
assert.deepEqual(StrategyMap.normalize({strength:["legacy"]}),StrategyMap.EMPTY(),"legacy strategy maps remain compatible");
console.log("strategy map tests: sparse, closed, missing profit, 100-day, restore, and update timing passed");
