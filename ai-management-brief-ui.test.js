const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8"),css=fs.readFileSync("style.css","utf8");
const briefHeader=html.slice(html.indexOf('class="card strategy-card ai-management-brief"'),html.indexOf('class="management-compass"'));
const render=app.slice(app.indexOf("function renderStrategyIntelligence"),app.indexOf("function openSuccessLibrary"));

test("AI経営ブリーフのヘッダーは日本語タイトルだけを表示",()=>{assert.match(briefHeader,/🎯 AI経営ブリーフ/);assert.doesNotMatch(briefHeader,/Knowledge Core|DAILY EXECUTIVE BRIEF/)});
test("ブリーフは最優先・リスク・AIコメントの3項目だけを表示",()=>{for(const label of["今日の最優先","今日のリスク","AIコメント"])assert.match(render,new RegExp(label));for(const label of["追加期待利益","追加期待売上","今日意識する診療","AIコーチ"])assert.doesNotMatch(render,new RegExp(label));assert.match(render,/★★★★★/)});
test("AIコメントは2行に制限し、AIコーチは診療終了後レビューに表示",()=>{assert.match(css,/\.brief-comment p[^{]*\{[^}]*-webkit-line-clamp:2/);assert.match(html,/📋 診療終了後レビュー/);assert.match(html,/💬 AIコーチ/)});
