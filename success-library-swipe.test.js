"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const css=fs.readFileSync("style.css","utf8"),app=fs.readFileSync("app.js","utf8");

test("AI経営ノート is an iPhone-compatible horizontal scroll area",()=>{
  const rule=css.match(/\.success-library-items\{([^}]*)\}/)?.[1]||"";
  for(const declaration of ["display:flex","overflow-x:auto","overflow-y:hidden","-webkit-overflow-scrolling:touch","touch-action:pan-x","scroll-snap-type:x proximity"]){
    assert.match(rule,new RegExp(declaration.replaceAll("-","\\-")));
  }
  assert.doesNotMatch(rule,/(?:^|;)overflow:hidden/);
});

test("AI経営ノート cards keep their horizontal size",()=>{
  const rule=css.match(/\.success-pattern\{([^}]*)\}/)?.[1]||"";
  assert.match(rule,/flex:0 0 min\(270px,82vw\)/);
  assert.match(rule,/flex-shrink:0/);
  assert.match(rule,/scroll-snap-align:start/);
});

test("page swipe handling yields to AI経営ノート native scrolling",()=>{
  const setup=app.match(/function setupSwipe\(\)[\s\S]*?\nfunction setupBusinessSimulator/)?.[0]||"";
  assert.match(setup,/closest\("[^"]*\.success-library-items/);
  assert.doesNotMatch(setup,/preventDefault/);
  assert.match(setup,/\{passive:true\}/);
});
