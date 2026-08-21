"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const css=fs.readFileSync("style.css","utf8"),app=fs.readFileSync("app.js","utf8");

test("Recent Activity uses the Business Health preview while learning",()=>{
  const activityRows=app.match(/function recentActivityRows\(\)[\s\S]*?\nfunction renderRecentActivityHealthDebug/)?.[0]||"";
  assert.match(activityRows,/health\?\.score\?\?health\?\.previewScore\?\?null/);
});

test("Recent Activity isolates a Business Health exception per entry",()=>{
  const activityRows=app.match(/function recentActivityRows\(\)[\s\S]*?\nfunction renderRecentActivityHealthDebug/)?.[0]||"";
  assert.match(activityRows,/try\{const health=calculateBusinessHealth\(entry\.date,entries\)/);
  assert.match(activityRows,/errorName:error\?\.name/);
  assert.match(activityRows,/errorMessage:error\?\.message/);
  assert.match(activityRows,/console\.warn\("\[Recent Activity Health Failed\]"/);
  assert.doesNotMatch(activityRows,/\bsave\s*\(/);
});

test("Recent Activity renders a closed, removable 診療経営スコア diagnostic panel",()=>{
  const html=fs.readFileSync("index.html","utf8");
  assert.match(app,/const RECENT_ACTIVITY_HEALTH_DEBUG=true/);
  assert.match(html,/<details id="recentActivityHealthDebug"[^>]*><summary>診療経営スコア診断<\/summary>/);
  for(const label of ["score","previewScore","selectedHealth","calculateHealth result","RecentActivity row.health","error name","error message","entry keys","businessDays"]){
    assert.match(app,new RegExp(label.replace(".","\\.")));
  }
});

test("Recent Activity card is an iPhone-compatible vertical scroll area",()=>{
  const rule=css.match(/\.recent-activity-card\{([^}]*)\}/)?.[1]||"";
  for(const declaration of ["max-height:260px","overflow-y:auto","overflow-x:hidden","-webkit-overflow-scrolling:touch","overscroll-behavior:contain","touch-action:auto"]){
    assert.match(rule,new RegExp(declaration.replace("-","\\-")));
  }
  assert.doesNotMatch(rule,/position:(?:fixed|sticky)|overflow:hidden/);
});

test("page swipe handling yields to Recent Activity scrolling",()=>{
  const setup=app.match(/function setupSwipe\(\)[\s\S]*?\nfunction setupBusinessSimulator/)?.[0]||"";
  assert.match(setup,/closest\("[^"]*\.recent-activity-card/);
  assert.doesNotMatch(setup,/preventDefault/);
  assert.match(setup,/\{passive:true\}/);
});


test("診療経営スコアの表示評価と算出不能表示を分類する",()=>{
  const source=app.match(/function businessHealthDisplay\(score\)\{[^\n]+/)?.[0];
  assert.ok(source);
  const display=Function(`${source}; return businessHealthDisplay`)();
  assert.deepEqual(display(82),{score:82,label:"好調",text:"診療経営スコア 82｜好調"});
  assert.deepEqual(display(67),{score:67,label:"良好",text:"診療経営スコア 67｜良好"});
  assert.deepEqual(display(41),{score:41,label:"注意",text:"診療経営スコア 41｜注意"});
  assert.deepEqual(display(35),{score:35,label:"要改善",text:"診療経営スコア 35｜要改善"});
  for(const value of [null,undefined,NaN])assert.deepEqual(display(value),{score:null,label:null,text:"診療経営スコア —"});
});

test("履歴の診療経営スコアは日付付近で折り返せる",()=>{
  assert.match(app,/activity-date[^\n]+activity-health-score/);
  assert.match(css,/\.recent-activity-row \.activity-health-score\{[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
});
