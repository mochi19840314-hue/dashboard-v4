"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8");

assert.match(html,/新患率<\/span><strong id="todaySummaryNewRate">—<\/strong>/,"Today card renders the new-patient-rate label");
assert.doesNotMatch(html.match(/id="todaySummaryCard"[\s\S]*?<\/article>/)?.[0]||"",/再診率/,"Today card no longer renders revisit rate");
assert.match(app,/todaySummaryNewRate"\)\.textContent=patients\?`\$\{Math\.min\(100,Math\.max\(0,newPatients\/patients\*100\)\)\.toFixed\(1\)\}%`/,"renderTodaySummary writes the new-patient percentage");
assert.match(app,/function renderMonthlyReport\(\)[\s\S]*?renderBusinessHealthMonthReport\(m\);\s*\n}/,"renderMonthlyReport always refreshes the selected month's health report");
assert.match(app,/savedScore>0[\s\S]*?rows=\[\.\.\.rows,\{date:iso\(\),score:/,"a persisted Business Health Score is used when today's history row is absent");
assert.match(app,/average[\s\S]*?highest[\s\S]*?lowest[\s\S]*?improvement/,"the report renders all four health statistics");
console.log("Today and monthly report UI rendering checks passed");
