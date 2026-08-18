"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");

const source=fs.readFileSync("app.js","utf8");
const start=source.indexOf("function monthlyManagementScoreStats(");
const end=source.indexOf("\nfunction renderBusinessHealthReports",start);
const context={console:{log(){},warn(){}}};
vm.runInNewContext(`${source.slice(start,end)};this.monthlyManagementScoreStats=monthlyManagementScoreStats`,context);

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
