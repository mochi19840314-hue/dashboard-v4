"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");

const source=fs.readFileSync("app.js","utf8");
const start=source.indexOf("function getNormalizedMonthlyEntries(");
const end=source.indexOf("\nfunction renderBusinessHealthReports",start);
const context={console:{log(){},warn(){}},DateRanges:require("./date-ranges.js"),data:{entries:[]}};
vm.runInNewContext(`${source.slice(start,end)};this.monthlyManagementScoreStats=monthlyManagementScoreStats;this.getNormalizedMonthlyEntries=getNormalizedMonthlyEntries;this.officialBusinessHealthHistory=officialBusinessHealthHistory`,context);

test("monthly report uses the official daily business-health calculation for every entry",()=>{
 const entries=[{date:"2026-07-31",sales:90000},{date:"2026-08-01",sales:100000},{date:"2026-08-21",sales:820000}],seen=[];
 const calculate=(date,allEntries)=>{seen.push({date,count:allEntries.length});return {score:null,previewScore:allEntries.find(entry=>entry.date===date).sales/10000}};
 const stats=context.monthlyManagementScoreStats("2026-08",entries,calculate);
 assert.deepEqual(seen.map(item=>item.date),["2026-07-31","2026-08-01","2026-08-21"]);
 assert.ok(seen.every(item=>item.count===3));
 assert.deepEqual({...stats},{count:2,average:46,highest:82,lowest:10,improvement:72});
});

test("one valid daily score shows summary values but not improvement",()=>{
 const stats=context.monthlyManagementScoreStats("2026-08",[{date:"2026-08-01"}],()=>({previewScore:73}));
 assert.deepEqual({...stats},{count:1,average:73,highest:73,lowest:73,improvement:null});
});

test("failed and non-numeric official calculations are excluded",()=>{
 const entries=[{date:"2026-08-01",kind:"valid"},{date:"2026-08-02",kind:"invalid"},{date:"2026-08-03",kind:"failed"}];
 const stats=context.monthlyManagementScoreStats("2026-08",entries,date=>{
  const kind=entries.find(entry=>entry.date===date).kind;if(kind==="failed")throw new Error("bad entry");return kind==="valid"?{score:81}:{previewScore:NaN};
 });
 assert.deepEqual({...stats},{count:1,average:81,highest:81,lowest:81,improvement:null});
});

test("saved legacy health never overrides official recalculation",()=>{
 const entries=[{date:"2026-08-21",businessHealthScore:25}];
 assert.deepEqual(Array.from(context.officialBusinessHealthHistory(entries,()=>({previewScore:82})),item=>({...item})),[{date:"2026-08-21",score:82}]);
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

test("recent history, monthly report, and score-pattern analysis share the same official score source",()=>{
 const app=fs.readFileSync("app.js","utf8");
 assert.match(app,/RecentActivity\.rows\([\s\S]*?calculateHealth:entry=>\{[\s\S]*?calculateBusinessHealth\(entry\.date,entries\)/);
 assert.match(app,/monthlyManagementScoreStats\(month,rawEntries,calculate=calculateBusinessHealth\)/);
 assert.match(app,/scoreHistory:officialBusinessHealthHistory\(data\.entries\)/);
 const scores=context.officialBusinessHealthHistory([{date:"2026-08-21"}],()=>({previewScore:82}));
 assert.equal(scores[0].score,82);
});
