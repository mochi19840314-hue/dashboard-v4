const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync(require.resolve("./app.js"),"utf8");
const render=app.slice(app.indexOf("function renderManagementCompass"),app.indexOf("function generateTodayStrategy"));

test("院長画面に成功率100%を表示せず3段階の実績傾向を表示",()=>{assert.doesNotMatch(render,/成功率/);assert.doesNotMatch(render,/successRate/);assert.match(render,/実績傾向/);assert.match(render,/performanceTrend/)});
test("手術などの売上差分は追加期待売上と表示",()=>{assert.match(render,/追加期待売上/);assert.match(render,/expectedIncrementalSales/);assert.doesNotMatch(render,/<h4>期待売上<\/h4>/)});
