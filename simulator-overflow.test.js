const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const css=fs.readFileSync("style.css","utf8"),app=fs.readFileSync("app.js","utf8");

test("simulator's visually hidden radio controls cannot expand the viewport",()=>{
 for(const selector of [".sim-goals input",".sim-mode input"]){
  const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  assert.match(css,new RegExp(`${escaped}\\{[^}]*position:absolute[^}]*width:1px[^}]*height:1px[^}]*margin:0[^}]*opacity:0`));
 }
});

test("viewport diagnostics reports every horizontal overflow candidate sorted by right edge",()=>{
 assert.match(app,/document\.querySelectorAll\("\*"\)/);
 assert.match(app,/rect\.right>clientWidth\|\|rect\.left<0\|\|scrollWidth>clientWidth/);
 assert.match(app,/sort\(\(a,b\)=>b\.rect\.right-a\.rect\.right\)/);
 assert.match(app,/横はみ出し要素/);
});
