"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8"),css=fs.readFileSync("style.css","utf8");
test("past detail offers a prominent edit action",()=>{assert.match(html,/id="editActivitySummary"[^>]*>編集する<\/button>/);assert.match(app,/openTodayEntry\(date\)/);assert.match(app,/dataset\.date=row\.date/)});
test("entry modal loads and saves the selected date instead of today",()=>{assert.match(app,/function openTodayEntry\(date=iso\(\)\)/);assert.match(app,/data\.entries\.find\(item=>item\.date===date\)/);assert.match(app,/const date=todayEntryTargetDate\|\|iso\(\)/)});
test("past values, memo, profit rate and five clinical counts are loaded",()=>{for(const metric of ["preventive","imaging","bloodTests","surgeries","trimming"])assert.match(html,new RegExp(`data-modal-clinical-output="${metric}"`));assert.match(app,/TodayClinicalCounts\.value\(entry,metric\)/);assert.match(app,/entry\?\.memo\?\?entry\?\.note/);assert.match(app,/entry\?\.profitRate/)});
test("mobile edit action and steppers fit the sheet",()=>{assert.match(css,/@media\(max-width:430px\)[^{]*\{\.activity-summary-dialog>header/);assert.match(css,/\.today-entry-steppers\{grid-template-columns:1fr\}/);assert.match(css,/\.activity-summary-actions \.primary\{min-height:40px/)});
