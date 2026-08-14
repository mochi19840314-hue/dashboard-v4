"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const CI=require("./clinical-intelligence");
function rows(n,fn=()=>({})){const out=[];for(let i=0;out.length<n;i++){const d=new Date(2024,0,2+i,12);if(d.getDay()===1)continue;const j=out.length,x=fn(j)||{};out.push({date:d.toLocaleDateString("sv-SE"),patients:10+j%7,sales:(10+j%7)*(10000+j*100),newPatients:j%4,surgeries:j%3,clinical:{bloodTests:j%8,xrays:j%6,ultrasounds:j%5,revisits:5+j%4,preventive:j%7},...x})}return out}
for(const n of [0,1,9,10,29,30,59,60,61,90,100,200,300]){const expected=n<10?"collecting":n<30?"preliminary":n<60?"ready":"mature";assert.equal(CI.getClinicalAnalysisReadiness(rows(n)).status,expected,`${n}-day phase`)}
assert.deepEqual(CI.getClinicalAnalysisReadiness(rows(10,()=>({clinical:undefined}))),{status:"preliminary",sampleDays:10,ready:false,referenceOnly:true,primaryWindow:10},"ten saved patient days start preliminary analysis without clinical input");
let rate=CI.getClinicalRates({patients:20,newPatients:3,surgeries:2,clinical:{bloodTests:4,xrays:2,ultrasounds:1,revisits:15,preventive:5,newPatients:20,surgeries:20}});assert.equal(rate.bloodTestRate,20);assert.equal(rate.newPatientRate,15);assert.equal(rate.surgeryRate,10,"top-level canonical values win");assert.equal(rate.revisitRate,85,"revisits are calculated from canonical fields");assert.equal(CI.getClinicalRates({patients:20,newPatients:null,clinical:{revisits:15}}).revisitRate,75,"legacy revisit is the fallback");
for(const patients of [0,-1,"",null,"NaN",NaN])assert.ok(Object.values(CI.getClinicalRates({patients,clinical:{bloodTests:2}})).every(x=>x===null),`invalid patients ${patients}`);
const validDay=(clinical,extra={})=>({date:"2026-01-06",patients:20,clinical,...extra});
for(const clinical of [{bloodTests:0,xrays:0,ultrasounds:0,preventive:0},{bloodTests:null,xrays:null,ultrasounds:null,preventive:null},{bloodTests:3},undefined])assert.equal(CI.getClinicalAnalysisReadiness([validDay(clinical)]).sampleDays,1,"a saved patient day counts regardless of clinical input");
const zeroRates=CI.getRollingClinicalAnalysis([validDay(undefined)]).rows[0];for(const key of ["bloodTestRate","xrayRate","ultrasoundRate","preventiveRate"])assert.equal(zeroRates[key],0,`${key} treats missing input as zero for analysis`);
for(const entry of [{date:"2026-01-06"},{date:"2026-01-06",patients:0},{date:"bad",patients:20},{date:"2026-02-30",patients:20},{date:"2026-01-05",patients:20},{date:"2026-01-06",patients:20}]){const options=entry.date==="2026-01-06"&&entry.patients===20?{closedDates:[entry.date]}:{};assert.equal(CI.getClinicalAnalysisReadiness([entry],options).sampleDays,0,"missing/zero patients and closed or invalid dates do not count")}
assert.doesNotThrow(()=>CI.analyze([{date:"2026-01-06",patients:2,clinical:{bloodTests:1,newPatients:9,surgeries:9}}]));
assert.equal(CI.getClinicalRates({patients:20,newPatients:-1,clinical:{revisits:15}}).revisitRate,75,"invalid canonical new-patient input uses legacy revisit fallback");
const perfect=Array.from({length:40},(_,i)=>[i,i*3]),negative=Array.from({length:40},(_,i)=>[i,100-i]);assert.equal(CI.pearson(perfect).correlation,1);assert.equal(CI.pearson(negative).correlation,-1);assert.equal(CI.pearson([[1,2],[1,3]]).correlation,null,"zero variance");assert.equal(CI.pearson([[1,2]]).correlation,null,"insufficient sample");
for(const n of [60,61,100,200]){const a=CI.getRollingClinicalAnalysis(rows(n));assert.equal(a.windows.last60.days,60);assert.equal(a.windows.last60.from,a.rows.at(-60).date,`${n} uses latest 60`);assert.equal(a.windows.last30.days,30);assert.equal(a.windows.last90.days,Math.min(90,n));assert.equal(a.windows.all.days,n)}
const changed=rows(60,i=>({clinical:{bloodTests:i<30?1:8,xrays:i%6,ultrasounds:i%5,revisits:5,preventive:2}}));assert.ok(CI.getRollingClinicalAnalysis(changed).trendChanges.some(x=>x.metric==="bloodTestRate"),"30 vs prior 30 change");
const profiles=rows(60);const analysis=CI.getRollingClinicalAnalysis(profiles);assert.equal(analysis.windows.last60.profile,"full","full and Saturday half-days are not mixed");assert.ok(analysis.windows.last60.profileDays<60);assert.equal(CI.dayProfile({date:"2026-08-03"}),"closed");assert.equal(CI.dayProfile({date:"2026-08-01"}),"half");assert.equal(CI.dayProfile({date:"2026-08-04"}),"full");assert.equal(CI.dayProfile({date:"2026-08-04"},{closedDates:["2026-08-04"]}),"closed");
assert.deepEqual(CI.analyze(rows(9)).insights,[],"collecting is never shown");
const correlation=(metric,target,correlation=.5,sampleSize=30)=>({metric,target,correlation,sampleSize,strength:"moderate",direction:correlation>0?"positive":"negative"});
const readyInsights=correlations=>CI.buildClinicalInsights({readiness:{status:"ready",sampleDays:40},primary:{correlations},trendChanges:[],windows:{}});
const filtered=readyInsights([
  correlation("newPatientRate","patients",.99),correlation("revisitRate","patients",.98),correlation("bloodTestRate","patients",.97),
  correlation("ultrasoundRate","unitPrice",.7),correlation("surgeryRate","unitPrice",.6),correlation("preventiveRate","sales",.5),correlation("xrayRate","sales",.4)
]);
assert.equal(filtered.length,3,"at most three insights are displayed");
assert.ok(filtered.some(x=>x.evidence.metric==="ultrasoundRate"&&x.evidence.target==="unitPrice"),"qualified ultrasound rate x unit price is displayed");
assert.ok(filtered.some(x=>x.evidence.metric==="surgeryRate"&&x.evidence.target==="unitPrice"),"qualified surgery rate x unit price is displayed");
assert.ok(filtered.some(x=>x.evidence.metric==="preventiveRate"&&x.evidence.target==="sales"),"qualified preventive rate x sales is displayed and avoids a single target");
for(const metric of ["newPatientRate","revisitRate","bloodTestRate"])assert.ok(!filtered.some(x=>x.evidence.metric===metric&&x.evidence.target==="patients"),`${metric} x patients is excluded from display`);
assert.deepEqual(readyInsights([correlation("ultrasoundRate","unitPrice",.8,29)]),[],"ready requires at least 30 samples");
assert.deepEqual(readyInsights([correlation("ultrasoundRate","unitPrice",.2999,40)]),[],"correlations below 0.30 are not displayed");
const targetPriority=readyInsights([correlation("preventiveRate","sales",.5,50),correlation("ultrasoundRate","unitPrice",.5,30)]);assert.equal(targetPriority[0].evidence.target,"unitPrice","unit price wins equal-correlation target priority before sample size");
const prelim=CI.analyze(rows(18,i=>({patients:10,sales:100000+i*i*1000,clinical:{bloodTests:i,xrays:i%3,ultrasounds:i%4,revisits:5,preventive:2}})));
for(const item of prelim.insights)assert.match(item.message,/参考|参考値/);
for(const item of CI.analyze(rows(80)).insights)assert.ok(item.evidence,"every sentence retains evidence");
const html=fs.readFileSync("index.html","utf8"),sw=fs.readFileSync("sw.js","utf8"),app=fs.readFileSync("app.js","utf8");assert.match(html,/診療構成インサイト/);assert.match(html,/clinical-intelligence\.js\?v=1079/);assert.match(sw,/clinical-intelligence\.js\?v=1079/);assert.match(sw,/keita-dashboard-v1081-monthly-profit-forecast/);assert.match(app,/function renderClinicalIntelligence\(\)[\s\S]*?catch\(error\)\{console\.error\(error\)\}/,"render failure is isolated");assert.doesNotMatch(app,/localStorage[^\n]*clinicalAnalysis|clinicalAnalysis[^\n]*localStorage/,"analysis isn't persisted");
const start=performance.now();for(let i=0;i<30;i++)CI.analyze(rows(1000));assert.ok((performance.now()-start)/30<50,"1000 days remains practical");
console.log("Clinical Intelligence: phases, quality, correlations, rolling windows, profiles, compatibility and performance passed");
