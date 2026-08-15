const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync(require.resolve("./app.js"),"utf8");
const render=app.slice(app.indexOf("function renderManagementCompass"),app.indexOf("function renderLearningInsight"));

test("コンパスはMission・期待利益・追加期待売上・理由・次点に集約",()=>{for(const label of["Mission","期待利益","追加期待売上","理由","次点"])assert.match(render,new RegExp(label));assert.doesNotMatch(render,/実績傾向|performanceTrend|今日の最優先/)});
test("手術などの売上差分は追加期待売上と表示",()=>{assert.match(render,/追加期待売上/);assert.match(render,/expectedIncrementalSales/);assert.doesNotMatch(render,/<h4>期待売上<\/h4>/)});
