const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8"),css=fs.readFileSync("style.css","utf8");
const briefHeader=html.slice(html.indexOf('class="card strategy-card ai-management-brief"'),html.indexOf('class="management-compass"'));
const render=app.slice(app.indexOf("function renderStrategyIntelligence"),app.indexOf("function openSuccessLibrary"));

test("AI経営ブリーフのヘッダーは日本語タイトルだけを表示",()=>{assert.match(briefHeader,/🎯 AI経営ブリーフ/);assert.doesNotMatch(briefHeader,/Knowledge Core|DAILY EXECUTIVE BRIEF/)});
test("ブリーフは最優先・リスク・AIコメントの3項目だけを表示",()=>{for(const label of["今日の最優先","今日のリスク","AIコメント"])assert.match(render,new RegExp(label));for(const label of["追加期待利益","追加期待売上","今日意識する診療","AIコーチ"])assert.doesNotMatch(render,new RegExp(label));assert.match(render,/★★★★★/)});
test("AIコメントは2行に制限し、AIコーチは診療終了後レビューに表示",()=>{assert.match(css,/\.brief-comment p[^{]*\{[^}]*-webkit-line-clamp:2/);assert.match(html,/📋 診療終了後レビュー/);assert.match(html,/💬 AIコーチ/)});
test("月間レポートから成長診療の表示だけを削除",()=>{assert.doesNotMatch(html,/成長診療|growthRanking/);assert.doesNotMatch(render,/growthRanking/);for(const id of["successRanking","managementWarnings","strategyMap"])assert.match(html,new RegExp(`id="${id}"`));for(const id of["successRanking","managementWarnings","strategyMap"])assert.match(render,new RegExp(`\\$\\("${id}"\\)`))});
test("高スコア日の特徴を順位や項目内の注釈なしで簡潔に表示",()=>{assert.doesNotMatch(html,/AI成功率|🏆 成功ランキング|id="aiSuccessRates"/);assert.match(html,/高スコア日の特徴/);assert.match(html,/保存済み営業日の比較から算出しています。関連する傾向であり、因果関係を示すものではありません。/);assert.match(render,/item\.metric/);assert.match(render,/high-score-pattern/);assert.doesNotMatch(render,/successPatterns\.map\(\(item,index\)/);assert.doesNotMatch(render,/report\.scorePatterns\.reliability/)});
