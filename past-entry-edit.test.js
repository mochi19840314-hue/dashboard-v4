"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8"),css=fs.readFileSync("style.css","utf8");
test("past detail offers a prominent edit action",()=>{assert.match(html,/id="editActivitySummary"[^>]*>編集する<\/button>/);assert.match(app,/openTodayEntry\(date\)/);assert.match(app,/dataset\.date=row\.date/)});
test("entry modal loads and saves the selected date instead of today",()=>{assert.match(app,/function openTodayEntry\(date=iso\(\)\)/);assert.match(app,/data\.entries\.find\(item=>item\.date===date\)/);assert.match(app,/const date=todayEntryTargetDate\|\|iso\(\)/)});
test("past business values and memo are loaded without duplicating clinical controls",()=>{const modal=html.match(/<div class="today-entry-modal"[\s\S]*?<\/form>/)[0];assert.doesNotMatch(modal,/data-modal-clinical-(?:step|output)/);assert.match(app,/entry\?\.memo\?\?entry\?\.note/);assert.match(app,/entry\?\.profitRate/)});
test("mobile edit action and entry sheet fit the iPhone viewport",()=>{assert.match(css,/@media\(max-width:430px\)[^{]*\{\.activity-summary-dialog>header/);assert.match(css,/@media\(max-width:430px\),\(max-height:650px\)/);assert.match(css,/\.activity-summary-actions \.primary\{min-height:40px/)});
