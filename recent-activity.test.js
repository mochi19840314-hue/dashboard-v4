const test=require("node:test"),assert=require("node:assert/strict"),RecentActivity=require("./recent-activity.js");
const entry=(day,extra={})=>({date:`2026-08-${String(day).padStart(2,"0")}`,sales:100000+day,patients:10,newPatients:2,...extra});
test("returns at most ten business entries in descending date order",()=>{const rows=RecentActivity.rows(Array.from({length:12},(_,index)=>entry(index+1)));assert.equal(rows.length,10);assert.equal(rows[0].date,"2026-08-12");assert.equal(rows.at(-1).date,"2026-08-03")});
test("returns all five available business entries",()=>assert.equal(RecentActivity.rows([1,2,3,4,5].map(entry)).length,5));
test("excludes closed dates and empty entries",()=>{const rows=RecentActivity.rows([entry(1),entry(2),entry(3,{sales:0,patients:0})],{closedDates:["2026-08-02"]});assert.deepEqual(rows.map(row=>row.date),["2026-08-01"])});
test("keeps old JSON compatible and resolves optional health",()=>{const rows=RecentActivity.rows([entry(1),entry(2,{businessHealthScore:91})],{healthHistory:[{date:"2026-08-01",score:89}]});assert.equal(rows[0].health,91);assert.equal(rows[1].health,89);assert.equal(RecentActivity.rows([entry(1)])[0].health,null)});
