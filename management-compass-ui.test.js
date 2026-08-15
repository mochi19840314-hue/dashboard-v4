const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync(require.resolve("./app.js"),"utf8");
const render=app.slice(app.indexOf("function renderManagementCompass"),app.indexOf("function renderLearningInsight"));
const readinessSource=app.slice(app.indexOf("function managementCompassReadiness"),app.indexOf("function renderManagementCompass"));
function renderResult(result){
 const elements={managementCompassContent:{innerHTML:""},managementCompassStatus:{textContent:""}},$=id=>elements[id],yen=value=>`${value}円`,escapeHtml=value=>String(value);
 Function("$","yen","escapeHtml","result",`${readinessSource}${render};renderManagementCompass(result)`)($,yen,escapeHtml,result);
 return {content:elements.managementCompassContent.innerHTML,status:elements.managementCompassStatus.textContent};
}

test("コンパスはMission・期待利益・追加期待売上・理由・次点に集約",()=>{for(const label of["Mission","期待利益","追加期待売上","理由","次点"])assert.match(render,new RegExp(label));assert.doesNotMatch(render,/実績傾向|performanceTrend|今日の最優先/)});
test("手術などの売上差分は追加期待売上と表示",()=>{assert.match(render,/追加期待売上/);assert.match(render,/expectedIncrementalSales/);assert.doesNotMatch(render,/<h4>期待売上<\/h4>/)});
test("必要営業日未満だけ学習中と判定する",()=>{
 for(const businessDays of[10,14]){const output=renderResult({ready:false,sampleDays:businessDays,requiredDays:15,missions:[]});assert.equal(output.status,"学習中");assert.match(output.content,new RegExp(`学習中（${businessDays}/15営業日）`))}
 for(const businessDays of[15,40]){const output=renderResult({ready:false,sampleDays:businessDays,requiredDays:15,missions:[]});assert.equal(output.status,"分析中");assert.equal(output.content,`<p class="compass-empty">${businessDays}営業日のデータから分析しています。</p>`);assert.doesNotMatch(output.content,/学習中/)}
});
test("有効な戦略はreadinessより優先する",()=>{
 const output=renderResult({ready:true,sampleDays:10,requiredDays:15,missions:[{actions:["対象を確認"]}],reason:"有効な戦略",expectedIncrementalSales:0});
 assert.equal(output.status,"今日の1件");assert.match(output.content,/有効な戦略/);assert.doesNotMatch(output.content,/学習中/);
});
test("必要営業日達成後に学習中の分数を表示しない",()=>{
 const output=renderResult({ready:false,sampleDays:40,requiredDays:15,missions:[]});
 assert.doesNotMatch(output.content,/40\/15|学習中/);
});
