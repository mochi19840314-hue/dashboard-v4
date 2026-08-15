const test=require("node:test"),assert=require("node:assert/strict"),Insights=require("./learning-insights.js");
const Backup=require("./backup-normalizer.js");
const date=index=>`2026-06-${String(index+1).padStart(2,"0")}`;
function entries(count=20){return Array.from({length:count},(_,index)=>({date:date(index),patients:10,newPatients:0,sales:index%2?100000:200000,clinical:{xrays:index%2,ultrasounds:0,bloodTests:0,preventive:0}}))}
test("実データから安全な学習結果を生成する",()=>{const result=Insights.analyze(entries(),{today:"2026-07-01"});assert.equal(result.ready,true);assert.match(result.result,/平均より/);assert.match(result.suggestion,/適応/);assert.doesNotMatch(result.text,/手術を増や/)});
test("データ不足",()=>assert.equal(Insights.analyze(entries(5),{today:"2026-07-01"}).text,Insights.EMPTY));
test("夜間保存と30件上限",()=>{const old=Array.from({length:30},(_,i)=>({date:`2026-05-${String(i+1).padStart(2,"0")}`,key:`old:${i}`,result:"結果",text:"結果"}));assert.equal(Insights.learnAtNight({entries:entries(),history:old,today:"2026-06-30",hour:17}).saved,false);const night=Insights.learnAtNight({entries:entries(),history:old,today:"2026-06-30",hour:18});assert.equal(night.saved,true);assert.equal(night.history.length,30)});
test("7日重複禁止",()=>{const first=Insights.analyze(entries(),{today:"2026-07-01"}),second=Insights.analyze(entries(),{today:"2026-07-01",history:[{date:"2026-06-30",key:first.key,result:first.result,text:first.text}]});assert.notEqual(second.key,first.key)});
test("翌朝に前夜の学習を表示",()=>{const night=Insights.learnAtNight({entries:entries(),history:[],today:"2026-06-30",hour:20});assert.equal(Insights.displayed({entries:entries(),history:night.history,today:"2026-07-01"}).date,"2026-06-30")});

test("JSONバックアップで履歴を維持し旧形式も復元する",()=>{const record={date:"2026-06-30",key:"imaging:unit",result:"結果",text:"結果"},defaults={entries:[],learningHistory:[],finance:{},clinic:{closedDates:[]},historical:{},settings:{},monthlyReports:{},memo:""};assert.deepEqual(Backup.normalizeBackup({entries:[],learningHistory:[record]},defaults,"key").data.learningHistory,[record]);assert.deepEqual(Backup.normalizeBackup({entries:[]},defaults,"key").data.learningHistory,[])});
