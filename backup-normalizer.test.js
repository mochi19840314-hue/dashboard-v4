"use strict";
const assert=require("node:assert/strict");
const {normalizeBackup}=require("./backup-normalizer");
const KEY="keitaDashboardSimpleV1";
const defaults={entries:[],aiFeedback:{},meetingBrief:{},meetingHistory:[],aiCompassLearning:[],finance:{balance:0,monthlyExpense:0},financeByMonth:{},cardReceiptsByMonth:{},monthlyReports:{},clinic:{fullDayTarget:180000,closedDates:[]},weatherCache:null,historical:{"2026-01":{sales:10}},settings:{},uiState:{analysisExpanded:false},meta:{lastUpdated:null},businessSimulator:{changes:{}},goalPlanner:{annualProfit:20000000},memo:""};

const old=normalizeBackup({records:[{date:"2025-01-01"}],finance:{balance:12}},defaults,KEY);
assert.equal(old.data.entries.length,1);
assert.deepEqual(old.data.finance,{balance:12,monthlyExpense:0});
assert.deepEqual(old.data.monthlyReports,{});
assert.equal(old.data.clinic.fullDayTarget,180000);
assert.equal(old.data.weatherCache,null);

const complete={entries:[{date:"2026-07-31"}],successLibrary:[{id:"checkup"}],financeByMonth:{"2026-07":{balance:99}},monthlyReports:{"2026-07":{memo:"report"}},clinic:{fullDayTarget:200000,closedDates:["2026-08-01"]},weatherCache:{condition:"sunny"},historical:{"2025-12":{sales:20}},settings:{"2026-07":{target:5}},kagemushaDiary:[{date:"2026-07-31"}],memo:"note",finance:{monthlyExpense:7}};
const current=normalizeBackup({data:complete},defaults,KEY);
assert.equal(current.data.financeByMonth["2026-07"].monthlyExpense,0);
assert.equal(current.data.monthlyReports["2026-07"].memo,"report");
assert.equal(current.data.clinic.fullDayTarget,200000);
assert.equal(current.data.weatherCache.condition,"sunny");
assert.equal(current.data.historical["2025-12"].sales,20);
assert.equal(current.data.settings["2026-07"].target,5);
assert.equal(current.data.memo,"note");
assert.equal(current.data.successLibrary[0].id,"checkup");
assert.equal(current.data.finance.balance,0);
assert.equal(current.kagemushaDiary.length,1);

const stored=normalizeBackup({[KEY]:JSON.stringify({dailyRecords:[]}),kagemushaDiary:[{date:"legacy"}]},defaults,KEY);
assert.equal(stored.kagemushaDiary[0].date,"legacy");
const oldWithoutClinical=normalizeBackup({entries:[{date:"2026-08-01",sales:100}]},defaults,KEY);
assert.equal(oldWithoutClinical.data.entries[0].clinical,undefined);
const newWithClinical=normalizeBackup({entries:[{date:"2026-08-02",clinical:{bloodTests:5,xrays:2,ultrasounds:1,revisits:12,preventive:3}}]},defaults,KEY);
assert.deepEqual(newWithClinical.data.entries[0].clinical,{bloodTests:5,xrays:2,ultrasounds:1,revisits:12,preventive:3});
const legacySevenClinical=normalizeBackup({entries:[{date:"2026-08-01",newPatients:3,surgeries:2,clinical:{bloodTests:5,xrays:2,ultrasounds:1,newPatients:3,surgeries:2,revisits:14,preventive:3}}]},defaults,KEY);
assert.equal(legacySevenClinical.data.entries[0].clinical.newPatients,3,"legacy seven-field clinical backup remains restorable");
assert.equal(legacySevenClinical.data.entries[0].newPatients,3,"canonical entry field remains intact");
assert.deepEqual(normalizeBackup({},defaults,KEY).data.finance,defaults.finance);
const strategyBackup=normalizeBackup({strategyMap:{updated:"2026-08-18T18:00:00",themes:[{theme:"画像検査"}],priorities:[{theme:"画像検査"}],monthlyHistory:[{month:"2026-07"}]}},defaults,KEY);
assert.equal(strategyBackup.data.strategyMap.monthlyHistory[0].month,"2026-07");
assert.deepEqual(normalizeBackup({strategyMap:{strength:["legacy"]}},defaults,KEY).data.strategyMap,{updated:null,themes:[],priorities:[],monthlyHistory:[]});

const malformed=normalizeBackup({
  entries:[null,"bad",{date:"2026-08-03",sales:100}],
  historical:{"2026-07":null,"2026-08":{sales:123}},
  settings:{"2026-08":null,"2026-09":{target:500}},
  monthlyReports:{"2026-08":null},
  cardReceiptsByMonth:{"2026-08":null,"2026-09":{amount:10}},
  meetingHistory:[null,{date:"2026-08-03"}],
  aiCompassLearning:[null,{date:"2026-08-03"}],
  kagemushaDiary:[null,"bad",{date:"2026-08-03",message:"ok"}],
  uiState:null,
  meta:"bad",
  weatherCache:"bad"
},defaults,KEY);
assert.equal(malformed.data.entries.length,1,"invalid daily records are skipped instead of crashing restore");
assert.equal(malformed.data.historical["2026-01"].sales,10,"default historical data survives malformed month values");
assert.equal(malformed.data.historical["2026-08"].sales,123);
assert.equal(malformed.data.settings["2026-09"].target,500);
assert.deepEqual(malformed.data.monthlyReports,{});
assert.equal(malformed.data.cardReceiptsByMonth["2026-09"].amount,10);
assert.equal(malformed.data.meetingHistory.length,1);
assert.equal(malformed.data.aiCompassLearning.length,1);
assert.equal(malformed.kagemushaDiary.length,1,"invalid diary rows are skipped before shadow rendering");
assert.deepEqual(malformed.data.uiState,defaults.uiState);
assert.deepEqual(malformed.data.meta,defaults.meta);
assert.equal(malformed.data.weatherCache,null);
assert.throws(()=>normalizeBackup("bad",defaults,KEY));
console.log("backup normalizer tests: 35 checks passed");
