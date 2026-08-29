"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("app.js","utf8"),past=fs.readFileSync("past-sales-editor.js","utf8"),evalUi=fs.readFileSync("evaluation-role-ui.js","utf8");
test("recent records already route edit to the selected date",()=>{assert.match(app,/function edit\(date\).*openTodayEntry\(date\)/s);assert.match(app,/class="edit-record" data-edit="\$\{e\.date\}">編集<\/button>/)});
test("past sales editor decorates the recent records card",()=>{assert.match(past,/card\.id="recentRecordsCard"/);assert.match(past,/recent-record-toolbar/);assert.match(past,/button\.textContent="✎ 過去日の売上を入力"/)});
test("mobile recent records keep edit visible without horizontal scrolling",()=>{assert.match(past,/#recentRecordsCard table\{min-width:0/);assert.match(past,/#recentRecordsCard th:nth-child\(4\),#recentRecordsCard td:nth-child\(4\)\{display:none\}/);assert.match(past,/#recentRecordsCard \.record-actions \[data-del\]\{display:none\}/);assert.match(past,/button\.textContent="✎ 編集"/)});
test("no continuous DOM observer is introduced",()=>{assert.doesNotMatch(past,/MutationObserver/);assert.match(evalUi,/past-sales-editor\.js\?v=1033/)});
