"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const TodayDashboardData=require("./today-dashboard-data"),TodayClinicalCounts=require("./today-clinical-counts"),DailyAISummary=require("./daily-ai-summary");

test("2026/8/25の保存済み日次データをToday全表示とAIが共有する",()=>{
 const saved={date:"2026-08-25",sales:248890,patients:14,newPatients:1,checkups:0,surgeries:0,trimming:4,clinical:{bloodTests:4,xrays:1,ultrasounds:0,preventive:2}};
 const entries=[{date:"2026-08-22",sales:100000,patients:8},{date:"2026-08-23",sales:0,patients:0},saved];
 const today=TodayDashboardData.build({entries,date:"2026-08-25",clinicalValue:TodayClinicalCounts.value,isOperating:entry=>entry.date!=="2026-08-23"});
 assert.equal(today.entry,saved);
 assert.deepEqual(today.clinical,{preventive:2,checkups:0,imaging:1,bloodTests:4,surgeries:0,trimming:4,secondOpinions:0});
 assert.equal(today.businessDays,2);
 assert.equal(today.entries,entries);
 const insightMetrics=DailyAISummary.metrics(today.entry);
 assert.deepEqual({blood:insightMetrics.blood,imaging:insightMetrics.imaging,preventive:insightMetrics.preventive,checkups:insightMetrics.checkups,surgeries:insightMetrics.surgeries,trimming:insightMetrics.trimming},{blood:4,imaging:1,preventive:2,checkups:0,surgeries:0,trimming:4});
});

test("上部、下部、AI INSIGHT、AI LEARNINGは共有Todayモデルだけを参照する",()=>{
 const app=fs.readFileSync("app.js","utf8"),html=fs.readFileSync("index.html","utf8");
 assert.ok(app.includes("return TodayDashboardData.build({entries:data.entries"));
 assert.match(app,/function renderTodaySummary\(\)\{[^\n]*today=todayDashboardData\(date\)/);
 assert.match(app,/function renderTodayWidgets\(\)\{\n const date=summaryTargetDate\(\),today=todayDashboardData\(date\)/);
 assert.match(app,/DailyAISummary\.build\(\{date,entry,entries:today\.entries/);
 assert.match(app,/const days=today\.businessDays/);
 assert.match(app,/\[\["Blood","bloodTests"\]/);
 assert.doesNotMatch(app,/todayWidgetBloodTests/);
 assert.doesNotMatch(app,/localStorage\.getItem\([^)]*today/i);
 assert.match(html,/today-dashboard-data\.js\?v=9507[\s\S]*app\.js\?v=9506/);
});
