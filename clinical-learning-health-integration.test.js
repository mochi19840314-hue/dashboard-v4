const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");

test("AI診療学習は独自successScoreでなく日別診療経営スコアを表示する",()=>{
 const source=fs.readFileSync("app.js","utf8"),start=source.indexOf("function renderClinicalLearning("),end=source.indexOf("function renderWeeklyInsights(",start),render=source.slice(start,end);
 assert.match(render,/calculateBusinessHealth\(snapshot\.date,data\.entries\)/);
 assert.match(render,/診療経営スコア/);
 assert.match(render,/BusinessHealthScore\.explain\(health\)/);
 assert.match(render,/今日の評価理由/);
 assert.doesNotMatch(render,/<strong>\$\{snapshot\.successScore\}/);
 assert.match(render,/evaluateSuccessDay\(snapshot,score\)/);
});

test("今日・履歴・月間レポート・Knowledge Coreは共通の日別診療経営スコア履歴を使う",()=>{
 const source=fs.readFileSync("app.js","utf8");
 assert.match(source,/function officialBusinessHealthHistory[\s\S]*calculate\(entry\.date,entries\)/);
 assert.match(source,/monthlyManagementScoreStats[\s\S]*officialBusinessHealthHistory\(rawEntries,calculate\)/);
 assert.match(source,/scoreHistory:officialBusinessHealthHistory\(data\.entries\)/);
 assert.match(source,/calculateHealth:entry=>/);
});
