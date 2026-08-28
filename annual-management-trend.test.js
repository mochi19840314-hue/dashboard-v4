"use strict";
const assert=require("node:assert/strict");
const A=require("./annual-management-trend.js");
const data={entries:[
 {date:"2025-01-10",sales:100000,patients:10,newPatients:1,checkups:1},{date:"2025-02-10",sales:100000,patients:10,newPatients:1,checkups:1},
 {date:"2026-01-10",sales:130000,patients:10,newPatients:2,checkups:2},{date:"2026-02-10",sales:130000,patients:10,newPatients:2,checkups:2}
],financeByMonth:{"2025-01":{monthlyExpense:70000},"2025-02":{monthlyExpense:70000},"2026-01":{monthlyExpense:80000},"2026-02":{monthlyExpense:80000}}};
let r=A.annual(data,2026,{today:"2026-02-28"});
assert.equal(r.throughMonth,2);assert.equal(r.metrics[0].label,"売上");assert.equal(Math.round(r.metrics[0].change),30);assert.equal(r.metrics[2].trend,"up");assert.match(r.conclusion,/客単価/);assert.equal(r.sampleDays,2);assert.equal(r.previousSampleDays,2);
r=A.annual({entries:[{date:"2026-01-10",sales:100000,patients:10}]},2026,{today:"2026-02-28"});assert.equal(r.metrics[0].comparable,false);assert.match(r.conclusion,/蓄積中/);
console.log("annual management trend: 2 scenarios passed");
