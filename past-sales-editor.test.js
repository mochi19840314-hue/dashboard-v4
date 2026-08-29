"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const ui=fs.readFileSync("past-sales-editor.js","utf8"),bootstrap=fs.readFileSync("evaluation-role-ui.js","utf8");
test("past sales editor is loaded by the lightweight bootstrap",()=>{assert.match(bootstrap,/past-sales-editor\.js\?v=1033/);assert.doesNotMatch(ui,/MutationObserver/)});
test("past sales editor adds a prominent history action and date selector",()=>{assert.match(ui,/過去日の売上を入力/);assert.match(ui,/id=\"pastSalesDate\" type=\"date\"/);assert.match(ui,/date\.max=iso\(\)/)});
test("editing sales preserves the rest of an existing entry",()=>{assert.match(ui,/entries\[index\]=\{\.\.\.entries\[index\],sales\}/);assert.match(ui,/else entries\.push\(\{date,sales,patients:0,newPatients:0\}\)/)});
test("invalid future dates or negative sales are rejected",()=>{assert.match(ui,/selected>iso\(\)/);assert.match(ui,/amount<0/)});
