const test=require('node:test');
const assert=require('node:assert/strict');
const {normalize,clinicalCount,analyzeConditions}=require('./director-condition.js');

test('normalizes only supported condition values',()=>{
 assert.equal(normalize('good'),'good');
 assert.equal(normalize('normal'),'normal');
 assert.equal(normalize('low'),'low');
 assert.equal(normalize('tired'),null);
 assert.equal(normalize(null),null);
});

test('counts clinical blood and imaging metrics',()=>{
 const entry={clinical:{bloodTests:3,xrays:2,ultrasounds:1}};
 assert.equal(clinicalCount(entry,'bloodTests'),3);
 assert.equal(clinicalCount(entry,'imaging'),3);
});

test('summarizes sales, unit price and test rates by condition',()=>{
 const rows=[
  {date:'2026-09-01',directorCondition:'good',sales:200000,patients:20,clinical:{bloodTests:6,xrays:2,ultrasounds:1}},
  {date:'2026-09-02',directorCondition:'good',sales:180000,patients:15,clinical:{bloodTests:3,xrays:1,ultrasounds:1}},
  {date:'2026-09-03',directorCondition:'low',sales:120000,patients:15,clinical:{bloodTests:2,xrays:1,ultrasounds:0}},
  {date:'2026-09-04',sales:250000,patients:20,clinical:{bloodTests:10,xrays:5,ultrasounds:0}}
 ];
 const result=analyzeConditions(rows);
 assert.equal(result.good.days,2);
 assert.equal(result.good.patients,35);
 assert.equal(result.good.sales,380000);
 assert.equal(Math.round(result.good.unitPrice),10857);
 assert.equal(result.good.bloodTests,9);
 assert.equal(result.good.imaging,5);
 assert.equal(Math.round(result.good.bloodRate*10)/10,25.7);
 assert.equal(Math.round(result.good.imagingRate*10)/10,14.3);
 assert.equal(result.low.days,1);
 assert.equal(result.normal.days,0);
 assert.equal(result.normal.unitPrice,null);
});
