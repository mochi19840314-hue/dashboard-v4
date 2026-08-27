"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const TodayOneAction=require("./today-one-action.js");
const weekdays=[
 {date:"2026-07-30",sales:200000,patients:20},
 {date:"2026-08-06",sales:220000,patients:22},
 {date:"2026-08-13",sales:180000,patients:18},
 {date:"2026-08-20",sales:200000,patients:20}
];
let result=TodayOneAction.build({today:"2026-08-27",hour:8,entries:weekdays,monthlyTarget:5000000,monthSales:4000000,remainingBusinessDays:5});
assert.equal(result.phase,"morning");
assert.equal(result.shadowTitle,"影武者｜朝の作戦");
assert.match(result.reason,/過去4回の同曜日平均/);
assert.equal(result.evidence.metric,"patients");
result=TodayOneAction.build({today:"2026-08-27",hour:8,entries:[],monthlyTarget:5000000,monthSales:4000000,remainingBusinessDays:5});
assert.equal(result.shadowTitle,"影武者｜朝の作戦");
assert.doesNotMatch(result.action,/検査|健診|手術|治療|投薬/);
assert.match(result.reason,/朝は診療内容を指示せず/);
result=TodayOneAction.build({today:"2026-08-27",hour:14,entries:[...weekdays,{date:"2026-08-27",sales:80000,patients:24}],monthlyTarget:5000000,monthSales:4000000,remainingBusinessDays:5});
assert.equal(result.phase,"midday");
assert.equal(result.shadowTitle,"影武者｜診療中の判断");
assert.match(result.reason,/同曜日平均/);
result=TodayOneAction.build({today:"2026-08-27",hour:19,entries:[...weekdays,{date:"2026-08-27",sales:280000,patients:20}]});
assert.equal(result.phase,"evening");
assert.equal(result.shadowTitle,"影武者｜今日の振り返り");
assert.match(result.action,/メモ/);
assert.ok(result.evidence);
assert.doesNotThrow(()=>TodayOneAction.build({get entries(){throw Error("bad")}}));
assert.equal(TodayOneAction.build({entries:null,hour:8}).title,"今日の一手");
const ui=fs.readFileSync("today-one-action-ui.js","utf8");
assert.match(ui,/compassShadowTitle/);
assert.match(ui,/compassShadowComment/);
assert.match(ui,/今日の一手は/);
assert.doesNotMatch(ui,/new MutationObserver/);
const bootstrap=fs.readFileSync("today-dashboard-data.js","utf8");
assert.match(bootstrap,/today-one-action\.js\?v=1014/);
assert.match(bootstrap,/today-one-action-ui\.js\?v=1014/);
const sw=fs.readFileSync("sw.js","utf8");
assert.match(sw,/\.\/today-one-action\.js\?v=1014/);
assert.match(sw,/\.\/today-one-action-ui\.js\?v=1014/);
console.log("Today One Action / Kagemusha: 14 scenarios passed");
