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

test("Recent Activity renders a closed, removable Health diagnostic panel",()=>{
  const html=fs.readFileSync("index.html","utf8");
  assert.match(app,/const RECENT_ACTIVITY_HEALTH_DEBUG=true/);
  assert.match(html,/<details id="recentActivityHealthDebug"[^>]*><summary>Health診断<\/summary>/);
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
