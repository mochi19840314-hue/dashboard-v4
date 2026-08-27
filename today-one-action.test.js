"use strict";
const assert=require("node:assert/strict");
const TodayOneAction=require("./today-one-action.js");
const weekdays=[
 {date:"2026-07-30",sales:200000,patients:20},
 {date:"2026-08-06",sales:220000,patients:22},
 {date:"2026-08-13",sales:180000,patients:18},
 {date:"2026-08-20",sales:200000,patients:20}
];
let result=TodayOneAction.build({today:"2026-08-27",hour:8,entries:weekdays,monthlyTarget:5000000,monthSales:4000000,remainingBusinessDays:5});
assert.equal(result.phase,"morning");
assert.match(result.reason,/過去4回の同曜日平均/);
assert.equal(result.evidence.metric,"patients");
result=TodayOneAction.build({today:"2026-08-27",hour:14,entries:[...weekdays,{date:"2026-08-27",sales:80000,patients:24}],monthlyTarget:5000000,monthSales:4000000,remainingBusinessDays:5});
assert.equal(result.phase,"midday");
assert.match(result.reason,/同曜日平均/);
result=TodayOneAction.build({today:"2026-08-27",hour:19,entries:[...weekdays,{date:"2026-08-27",sales:280000,patients:20}]});
assert.equal(result.phase,"evening");
assert.match(result.action,/メモ/);
assert.ok(result.evidence);
assert.doesNotThrow(()=>TodayOneAction.build({get entries(){throw Error("bad")}}));
assert.equal(TodayOneAction.build({entries:null,hour:8}).title,"今日の一手");
console.log("Today One Action: 6 scenarios passed");
