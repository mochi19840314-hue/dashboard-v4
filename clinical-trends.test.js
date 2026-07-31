"use strict";
const assert=require("node:assert/strict");
const {analyzeClinicalTrends}=require("./clinical-trends.js");
const today="2026-07-31";
function entries(count,extra={}){const rows=[];for(let i=0;rows.length<count;i++){const d=new Date("2026-07-31T00:00:00Z");d.setUTCDate(d.getUTCDate()-i);if(d.getUTCDay()===1)continue;rows.push({date:d.toISOString().slice(0,10),sales:10000+i*100,patients:10,newPatients:1,...extra});}return rows;}
assert.equal(analyzeClinicalTrends([],{today}).dataDays,0,"0件");
assert.equal(analyzeClinicalTrends(entries(6),{today}).status,"データ不足","7件未満");
assert.equal(analyzeClinicalTrends(entries(7),{today}).confidence,"暫定","7〜29件");
assert.equal(analyzeClinicalTrends(entries(30),{today}).status,"通常傾向","30件以上");
const saturday=analyzeClinicalTrends([{date:"2026-07-25",sales:100,patients:2}],{today});assert.equal(saturday.weekday.rows[6].days,1);assert.equal(saturday.weekday.saturdayAfternoonOnly,true,"土曜午後診療");
assert.equal(analyzeClinicalTrends([{date:"2026-07-27",sales:999,patients:9}],{today}).dataDays,0,"月曜除外");
const zero=analyzeClinicalTrends([{date:"2026-07-28",sales:0,patients:5},{date:"2026-07-29",sales:100,patients:0}],{today});assert.equal(zero.weekday.rows[2].averageSales,0,"0円");assert.equal(zero.weekday.rows[3].averagePatients,0,"0件");
const absent=analyzeClinicalTrends(entries(7).map(({newPatients,weather,...e})=>e),{today});assert.equal(absent.newPatients.available,false,"新患なし");assert.equal(absent.weather.available,false,"天気なし");
const tie=analyzeClinicalTrends([{date:"2026-07-28",sales:100,patients:2},{date:"2026-07-29",sales:100,patients:2}],{today});assert.deepEqual(tie.weekday.busiestWeekdays,["火曜日","水曜日"],"同率");
const bad=analyzeClinicalTrends([{date:"2026-07-28",sales:"x",patients:"NaN",newPatients:-1}],{today});assert.equal(bad.weekday.rows[2].averageSales,null,"不正値");
console.log("clinical trend tests: 12 scenarios passed");
