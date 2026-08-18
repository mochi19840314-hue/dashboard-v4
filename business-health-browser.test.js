const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");

const html=fs.readFileSync("index.html","utf8");
const scripts=[...html.matchAll(/<script\s+src="([^"?]+)(?:\?[^\"]*)?"[^>]*><\/script>/g)].map(match=>match[1]);
const healthScript="business-health-score.js",appScript="app.js";

function browserCalculator(overrides={}){
 const healthIndex=scripts.indexOf(healthScript),appIndex=scripts.indexOf(appScript);
 assert.ok(healthIndex>=0,"Business Health implementation is loaded by index.html");
 assert.ok(healthIndex<appIndex,"Business Health implementation loads before app.js");
 const context={console};
 context.window=context;
 context.globalThis=context;
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(healthScript,"utf8"),context,{filename:healthScript});
 assert.equal(vm.runInContext("typeof BusinessHealthScore",context),"object");
 assert.equal(context.window.BusinessHealthScore,context.BusinessHealthScore);
 const source=fs.readFileSync(appScript,"utf8"),start=source.indexOf("function calculateBusinessHealth("),end=source.indexOf("function renderBusinessHealth(",start);
 Object.assign(context,{DateRanges:require("./date-ranges.js"),MONTHLY_TARGET:5000000,data:{historical:{},financeByMonth:{},settings:{},clinicalSnapshots:[],successPatterns:[],clinic:{closedDates:[]},...overrides},sum:entries=>entries.reduce((total,entry)=>({sales:total.sales+(Number(entry.sales)||0),patients:total.patients+(Number(entry.patients)||0)}),{sales:0,patients:0}),operatingEntries:entries=>entries.filter(entry=>new Date(`${entry.date}T12:00:00Z`).getUTCDay()!==1)});
 vm.runInContext(`${source.slice(start,end)};globalThis.calculateBusinessHealth=calculateBusinessHealth`,context,{filename:appScript});
 return context;
}

test("classic browser scripts publish BusinessHealthScore before app.js",()=>{
 const context=browserCalculator();
 assert.equal(vm.runInContext("typeof BusinessHealthScore !== 'undefined'",context),true);
 assert.equal(typeof context.calculateBusinessHealth,"function");
});

test("Safari/PWA-equivalent August 18 activity has a finite recalculated health",()=>{
 const profitRate=-61.42639602310659,sales=158340,patients=15;
 const entries=[{date:"2026-08-18",sales,patients,newPatients:3,profitRate,clinical:{xrays:1,ultrasounds:0}}];
 const monthlyExpense=sales*(1-profitRate/100);
 const context=browserCalculator({financeByMonth:{"2026-08":{monthlyExpense}}});
 const health=context.calculateBusinessHealth("2026-08-18",entries);
 const selectedHealth=health.score??health.previewScore;
 assert.equal(health.score,null);
 assert.ok(Number.isFinite(selectedHealth));
 const RecentActivity=require("./recent-activity.js");
 const row=RecentActivity.rows(entries,{calculateHealth:()=>selectedHealth})[0];
 assert.ok(Number.isFinite(row.health));
 assert.deepEqual({previewScore:health.previewScore,rowHealth:row.health},{previewScore:25,rowHealth:25});
});
