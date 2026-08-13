"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("app.js","utf8");
const html=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");

assert.match(app,/insightScoreViewport\.observer=new IntersectionObserver/,"AI score uses a reusable IntersectionObserver");
assert.match(app,/intersectionRatio>=\.25/,"AI score waits for 25% visibility");
assert.match(app,/visible&&\(!insightScoreViewport\.played\|\|insightScoreViewport\.pending\)/,"entrance is one-shot unless an off-screen update is pending");
assert.match(app,/updateInsightScore\(score\)/,"score updates are routed through the viewport lifecycle");
assert.match(app,/active&&insightScoreViewport\.visible\)playInsightScore/,"visible updates animate immediately");
assert.match(app,/insightScoreViewport\.target=value/,"off-screen updates retain the latest target");
assert.match(app,/deactivateInsightScore\(\).*if\(id==="today"\)activateInsightScore\(\)/,"page changes reset and reactivate the lifecycle");
assert.match(app,/reducedMotion\(\)\){showInsightScoreImmediately\(\);return}/,"reduced motion renders the final value immediately");
assert.match(app,/duration=800/,"the existing 800ms animation is preserved");
assert.match(html,/app\.js\?v=1077/);assert.match(html,/style\.css\?v=1077/);
assert.match(sw,/keita-dashboard-v1079-clinical-insight-filter/);assert.match(sw,/app\.js\?v=1077/);assert.match(sw,/style\.css\?v=1077/);
console.log("score ring animation tests: 13 checks passed");
