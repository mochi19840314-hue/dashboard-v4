"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8"),sw=fs.readFileSync("sw.js","utf8");
test("mobile Today markup contains no legacy vertical form and exactly one entry form",()=>{
 for(const id of ["entryDate","sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions","saveEntry","clearEntry"])assert.doesNotMatch(html,new RegExp(`id="${id}"`));
 assert.equal((html.match(/id="todayEntryForm"/g)||[]).length,1);
 assert.equal((html.match(/id="todaySummaryTitle">今日の診療実績/g)||[]).length,1);
});
test("legacy listeners and value readers are removed",()=>{
 assert.doesNotMatch(app,/function (?:saveEntry|buildEntry|clearForm|preview|setupClinicalSteppers)\b/);
 assert.doesNotMatch(app,/\$\("(?:entryDate|sales|patients|newPatients|saveEntry|clearEntry)"\)/);
 assert.match(app,/function saveTodayEntry\(event\)/);
});
test("date remains internal and compatible entry fields are saved",()=>{
 assert.match(app,/const date=todayEntryTargetDate\|\|iso\(\)/);
 assert.match(app,/entry=\{\.\.\.existing,date,/);
 assert.match(app,/if\(index>=0\)data\.entries\[index\]=entry/);
});
test("HTML, CSS and JS use the same cache release and service worker is network first",()=>{
 const assets=[...html.matchAll(/(?:src|href)="([^"?]+\.(?:css|js)\?v=[^"]+)"/g)].map(match=>match[1]);
 for(const name of ["style.css","app.js","business-health-score.js"]){
  const asset=assets.find(value=>value.startsWith(name+"?"));
  assert.ok(asset,`${name} has a versioned HTML reference`);
  assert.ok(sw.includes(`"./${asset}"`),`${asset} is precached with the same version`);
 }
 assert.match(html,/style\.css\?v=9509/);assert.match(html,/app\.js\?v=9506/);
 assert.match(sw,/style\.css\?v=9509/);assert.match(sw,/app\.js\?v=9506/);
 assert.match(sw,/keita-dashboard-v\d+-[a-z0-9-]+/);
 assert.match(sw,/fetch\(e\.request\).*catch\(\(\)=>caches\.match\(e\.request\)\)/);
});
