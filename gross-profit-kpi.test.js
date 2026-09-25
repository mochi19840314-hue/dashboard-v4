const assert=require("assert");
const GrossProfitKpi=require("./gross-profit-kpi.js");
{
 const r=GrossProfitKpi.calculate(5000000,1000000,true);
 assert.equal(r.grossProfit,4000000);assert.equal(r.grossMargin,80);assert.equal(r.entered,true);
}
{
 const data={entries:[{date:"2026-09-01",sales:1000000},{date:"2026-09-02",sales:500000}],financeByMonth:{"2026-09":{morikuboOnline:100000,royalCanin:50000,purina:0,costOfSales:330000,entered:{costOfSales:true}}}};
 const r=GrossProfitKpi.summarize(data,"2026-09");
 assert.equal(r.sales,1650000);assert.equal(r.costOfSales,330000);assert.equal(r.grossProfit,1320000);assert.equal(r.grossMargin,80);
}
{
 const r=GrossProfitKpi.summarize({historical:{"2026-08":{sales:4000000}},financeByMonth:{"2026-08":{}}},"2026-08");
 assert.equal(r.entered,false);assert.equal(r.grossMargin,100);
}
console.log("gross-profit-kpi tests passed");