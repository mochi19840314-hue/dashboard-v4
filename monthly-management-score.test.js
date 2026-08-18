"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");

const source=fs.readFileSync("app.js","utf8");
const start=source.indexOf("function getManagementScoreForDailyEntry(");
const end=source.indexOf("\nfunction renderBusinessHealthReports",start);
const context={console:{log(){},warn(){}},DateRanges:require("./date-ranges.js"),data:{entries:[]}};
vm.runInNewContext(`${source.slice(start,end)};this.monthlyManagementScoreStats=monthlyManagementScoreStats;this.getNormalizedMonthlyEntries=getNormalizedMonthlyEntries`,context);

test("monthly management report recalculates every daily entry without a minimum-day threshold",()=>{
 const seen=[];
 const stats=context.monthlyManagementScoreStats("2026-08",[
  {date:"2026-08-18",sales:180000},
  {date:"2026-08-01",sales:100000}
 ],(summary,month)=>{seen.push({summary,month});return {score:summary.sales/10000}});
 assert.equal(seen.length,2);
 assert.deepEqual(Array.from(seen[0].summary.entries),[{date:"2026-08-01",sales:100000}]);
 assert.equal(seen[0].month,"2026-08");
 assert.deepEqual({...stats},{count:2,average:14,highest:18,lowest:10,improvement:8});
});

test("one valid daily score shows summary values but not improvement",()=>{
 const stats=context.monthlyManagementScoreStats("2026-08",[{date:"2026-08-01"}],()=>73);
 assert.deepEqual({...stats},{count:1,average:73,highest:73,lowest:73,improvement:null});
});

test("failed and non-numeric daily calculations are excluded",()=>{
 const entries=[{date:"2026-08-01",kind:"valid"},{date:"2026-08-02",kind:"invalid"},{date:"2026-08-03",kind:"failed"}];
 const stats=context.monthlyManagementScoreStats("2026-08",entries,summary=>{
  if(summary.kind==="failed")throw new Error("bad entry");
  return summary.kind==="valid"?{score:81}:{score:NaN};
 });
 assert.deepEqual({...stats},{count:1,average:81,highest:81,lowest:81,improvement:null});
});

test("twelve saved August entries remain twelve instead of being inferred as closed days",()=>{
 const entries=Array.from({length:12},(_,index)=>({date:`2026-08-${String(index+1).padStart(2,"0")}`,sales:index?0:100}));
 assert.equal(context.getNormalizedMonthlyEntries("2026-08",entries).length,12);
});

test("monthly normalization keeps one and multiple saved entries during a partial month",()=>{
 assert.equal(context.getNormalizedMonthlyEntries("2026-08",[{date:"2026-08-01",sales:0}]).length,1);
 assert.equal(context.getNormalizedMonthlyEntries("2026-08",[{date:"2026-08-01"},{date:"2026-08-03"},{date:"2026-08-18"}]).length,3);
});

test("monthly normalization extracts and sorts mixed supported date representations",()=>{
 const entries=[{createdAt:"2026-08-12T09:30:00Z"},{date:"2026/08/01"},{day:"2026-08-05"},{date:Date.UTC(2026,7,8)},{date:"2026-07-31"}];
 const normalized=context.getNormalizedMonthlyEntries("2026-08",entries);
 assert.deepEqual(Array.from(normalized,x=>x.date),["2026-08-01","2026-08-05","2026-08-08","2026-08-12"]);
});
