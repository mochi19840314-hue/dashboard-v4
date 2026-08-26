const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const css=fs.readFileSync("style.css","utf8");

test("AI経営会議カードは内容に応じて伸び、詳細ボタンも通常フローに置く",()=>{
 const card=css.match(/\.morning-brief-card\{[^}]+\}/)?.[0]||"",button=css.match(/\.morning-brief-card>button\{[^}]+\}/)?.[0]||"",nav=css.match(/\.morning-brief-card>nav\{[^}]+\}/)?.[0]||"";
 assert.match(card,/height:auto/);assert.doesNotMatch(card,/max-height|min-height|overflow:hidden/);
 assert.doesNotMatch(button,/position:absolute/);assert.doesNotMatch(nav,/position:absolute/);
});

for(const width of [375,390,430])test(`${width}px幅で注目サブテキストを2行表示できる`,()=>{
 const mobile=css.match(/@media\(max-width:600px\)\{\.morning-brief-card[\s\S]*?\.brief-review h3\{[^}]+\}\}/)?.[0]||"";
 assert.ok(width<=600);assert.match(mobile,/grid-template-columns:1fr 1fr/);
 assert.match(mobile,/\.morning-brief-card section em\{[^}]*-webkit-line-clamp:2[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
 assert.doesNotMatch(mobile,/text-overflow:ellipsis|white-space:nowrap/);
});
