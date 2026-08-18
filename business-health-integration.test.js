const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const DateRanges=require("./date-ranges.js"),BusinessHealthScore=require("./business-health-score.ts");

const source=fs.readFileSync("app.js","utf8"),start=source.indexOf("function calculateBusinessHealth("),end=source.indexOf("function renderBusinessHealth(",start);
function calculator(overrides={}){
 const context={DateRanges,BusinessHealthScore,MONTHLY_TARGET:5000000,data:{historical:{},financeByMonth:{},settings:{},clinicalSnapshots:[],successPatterns:[],clinic:{closedDates:[]},...overrides},sum:entries=>entries.reduce((total,entry)=>({sales:total.sales+(Number(entry.sales)||0),patients:total.patients+(Number(entry.patients)||0)}),{sales:0,patients:0}),operatingEntries:entries=>entries.filter(entry=>new Date(`${entry.date}T12:00:00Z`).getUTCDay()!==1)};
 vm.runInNewContext(`${source.slice(start,end)};this.calculateBusinessHealth=calculateBusinessHealth`,context);
 return context.calculateBusinessHealth;
}
const augustEntries=[
 {date:"2026-08-16",sales:223930,patients:22,newPatients:4},
 {date:"2026-08-18",sales:158340,patients:15,newPatients:3},
 {date:"2026-08-19",sales:999999,patients:99,newPatients:99}
];
const priorEntries=Array.from({length:18},(_,index)=>({date:`2026-07-${String(index+1).padStart(2,"0")}`,sales:170000,patients:17,newPatients:3}));

test("saved August activity produces finite as-of preview scores and excludes later entries",()=>{
 const calculate=calculator(),entries=[...priorEntries,...augustEntries];
 const health18=calculate("2026-08-18",entries),health16=calculate("2026-08-16",entries);
 assert.equal(health18.businessDays,18);
 assert.equal(health16.businessDays,17);
 assert.equal(health18.score,null);
 assert.ok(Number.isFinite(health18.score??health18.previewScore));
 assert.ok(Number.isFinite(health16.score??health16.previewScore));
 assert.deepEqual({health18:health18.previewScore,health16:health16.previewScore},{health18:50,health16:50});
});

test("50 operating days produce a finite confirmed score",()=>{
 const entries=Array.from({length:62},(_,index)=>{const date=new Date(Date.UTC(2026,4,1+index));return {date:date.toISOString().slice(0,10),sales:170000,patients:17,newPatients:3}});
 const health=calculator()("2026-07-01",entries);
 assert.ok(health.businessDays>=50);
 assert.ok(Number.isFinite(health.score));
});

test("missing monthly finance, snapshots, and patterns do not throw",()=>{
 const calculate=calculator({historical:undefined,financeByMonth:undefined,settings:undefined,clinicalSnapshots:undefined,successPatterns:undefined});
 const health=calculate("2026-08-18",augustEntries);
 assert.ok(Number.isFinite(health.score??health.previewScore));
});

test("legacy non-array snapshot and pattern containers do not throw",()=>{
 const calculate=calculator({clinicalSnapshots:{date:"2026-08-18",successScore:90},successPatterns:{score:90}});
 assert.doesNotThrow(()=>calculate("2026-08-18",augustEntries));
 assert.ok(Number.isFinite(calculate("2026-08-18",augustEntries).previewScore));
});
