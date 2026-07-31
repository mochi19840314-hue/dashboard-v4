"use strict";
const assert=require("node:assert/strict");
const {calendarMonthRange,entriesForCalendarMonth}=require("./date-ranges.js");

const records=[
  {date:"2026-07-31",sales:700,patients:7},
  {date:"2026-08-01",sales:800,patients:8},
  {date:"2026-08-31",sales:831,patients:9},
  {date:"2026-09-01",sales:900,patients:10},
  {date:"",sales:999},
  {date:"invalid",sales:999}
];
assert.deepEqual(calendarMonthRange("2026-08","2026-08-01"),{from:"2026-08-01",to:"2026-08-01",monthEnd:"2026-08-31"},"進行中の月は今日まで表示");
assert.deepEqual(entriesForCalendarMonth(records,"2026-08").map(row=>row.date),["2026-08-01","2026-08-31"],"8月には8月の記録だけを含める");
assert.deepEqual(entriesForCalendarMonth(records,"2026-07").map(row=>row.date),["2026-07-31"],"7月の履歴は引き続き参照できる");
assert.equal(records.length,6,"元データを変更しない");
console.log("date range tests: 4 scenarios passed");
