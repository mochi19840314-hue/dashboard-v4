"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Clinical=require("./clinical-intelligence"),Winning=require("./today-winning-strategy"),Mission=require("./today-mission"),Review=require("./daily-review");
const today="2026-08-15";
const history=Array.from({length:46},(_,index)=>{const date=new Date("2026-06-20T12:00:00Z");date.setUTCDate(date.getUTCDate()+index);return{date:date.toISOString().slice(0,10),sales:120000,patients:12,newPatients:1,surgeries:1,checkups:1,clinical:{bloodTests:2,xrays:1,ultrasounds:1,preventive:2}}}).filter(row=>new Date(`${row.date}T12:00:00Z`).getUTCDay()!==1).slice(0,38);
const readiness=Clinical.getClinicalAnalysisReadiness(history);
function morning(entries){return{winning:Winning.build({entries,today,readinessStatus:readiness.status}),mission:Mission.build({entries,today,readinessStatus:readiness.status})}}

test("朝0件でも38営業日の履歴から提案し採点だけ待機する",()=>{const entries=[...history,{date:today,sales:0,patients:0}],result=morning(entries);assert.equal(result.winning.ready,true);assert.equal(result.mission.ready,true);assert.deepEqual(Review.build({entries,date:today,entry:entries.at(-1)}),{ready:false,reason:"today-data"})});
test("today entryがなくても提案し採点だけ待機する",()=>{const result=morning(history);assert.equal(result.winning.ready,true);assert.equal(result.mission.ready,true);assert.deepEqual(Review.build({entries:history,date:today}),{ready:false,reason:"today-data"})});
test("今日入力後は提案とDaily Reviewを表示する",()=>{const entry={...history[0],date:today,patients:10,sales:150000},result=morning([...history,entry]);assert.equal(result.winning.ready,true);assert.equal(result.mission.ready,true);assert.equal(Review.build({entries:[...history,entry],date:today,entry}).ready,true)});
test("Clinical Intelligence collectingなら長期データ不足にする",()=>{assert.equal(Winning.build({entries:history.slice(0,5),today,readinessStatus:"collecting"}).ready,false);assert.equal(Mission.build({entries:history.slice(0,5),today,readinessStatus:"collecting"}).ready,false)});
test("休診日は通常営業提案を返さない",()=>{assert.equal(Winning.build({entries:history,today,readinessStatus:"ready",closed:true}).closed,true);const result=Mission.build({entries:history,today,readinessStatus:"ready",closed:true});assert.equal(result.closed,true);assert.deepEqual(result.missions,[])});
