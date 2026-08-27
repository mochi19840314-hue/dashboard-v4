const test=require("node:test"),assert=require("node:assert/strict"),Cause=require("./monthly-cause-analysis");

test("売上差を営業日数・1日患者数・客単価へ重複なく分解する",()=>{
 const baseline={days:20,patientsPerDay:10,unit:10000,sales:2000000};
 const current={days:22,patientsPerDay:11,unit:11000,sales:2662000};
 const result=Cause.build({month:"2026-08",current,baseline,comparison:{months:["2025-08"]}});
 const total=result.salesBridge.reduce((sum,item)=>sum+item.amount,0);
 assert.ok(Math.abs(total-662000)<1e-6);
 assert.equal(result.salesBridge.length,3);
 assert.equal(result.salesDelta,662000);
});

test("支出増は利益差を押し下げる",()=>{
 const result=Cause.build({month:"2026-08",currentMonth:"2026-08",current:{days:20,patientsPerDay:10,unit:11000,sales:2200000},baseline:{days:20,patientsPerDay:10,unit:10000,sales:2000000},comparison:{months:["2025-08"]},financeByMonth:{"2026-08":{hospitalCashExpense:1800000},"2025-08":{hospitalCashExpense:1500000}}});
 assert.equal(result.salesDelta,200000);
 assert.equal(result.profit.expenseDelta,300000);
 assert.equal(result.profit.profitDelta,-100000);
});

test("診療項目は金額換算せず関連変化として保持する",()=>{
 const current={days:20,patientsPerDay:10,unit:10000,sales:2000000,newPatients:30,checkups:8,surgeries:4,trimming:10};
 const baseline={days:20,patientsPerDay:10,unit:10000,sales:2000000,newPatients:20,checkups:16,surgeries:2,trimming:10};
 const result=Cause.build({month:"2026-08",current,baseline,comparison:{months:["2025-08"]}});
 assert.ok(result.clinical.some(item=>item.key==="newPatients"&&item.delta===10));
 assert.ok(result.clinical.some(item=>item.key==="checkups"&&item.delta===-8));
 assert.ok(result.clinical.some(item=>item.key==="surgeries"&&item.delta===2));
 assert.ok(result.clinical.every(item=>item.amount===undefined));
});

test("比較データ不足でも落ちない",()=>{
 assert.deepEqual(Cause.build({month:"2026-08"}).salesBridge,[]);
 assert.doesNotThrow(()=>Cause.build({month:"2026-08",current:{},baseline:{}}));
});
