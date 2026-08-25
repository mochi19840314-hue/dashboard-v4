"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("app.js","utf8"),html=fs.readFileSync("index.html","utf8"),sw=fs.readFileSync("sw.js","utf8");
test("clinical learning browser asset is served as JavaScript and cached by the PWA",()=>{
 assert.match(html,/src="clinical-learning-engine\.js\?v=7002"/);
 assert.doesNotMatch(html,/clinical-learning-engine\.ts/);
 assert.match(sw,/clinical-learning-engine\.js\?v=7002/);
});
test("clinical learning always renders an empty state and restores missing snapshots",()=>{
 assert.match(app,/診療データを学習中です/);
 assert.match(app,/診療データが蓄積されると、病院独自の診療傾向をここに表示します/);
 assert.match(app,/function syncClinicalLearningFromEntries\(\)/);
 assert.match(app,/Array\.isArray\(data\.clinicalSnapshots\)/);
});
