const assert=require('node:assert/strict');
const VetRecruitmentSignal=require('./vet-recruitment-signal');

assert.equal(VetRecruitmentSignal.scoreSales(3999999),0);
assert.equal(VetRecruitmentSignal.scoreSales(4000000),10);
assert.equal(VetRecruitmentSignal.scoreSales(4500000),20);
assert.equal(VetRecruitmentSignal.scoreSales(5000000),30);
assert.equal(VetRecruitmentSignal.scorePatients(14.9),0);
assert.equal(VetRecruitmentSignal.scorePatients(15),8);
assert.equal(VetRecruitmentSignal.scorePatients(17),15);
assert.equal(VetRecruitmentSignal.scorePatients(19),20);
assert.equal(VetRecruitmentSignal.scorePatients(20),25);
assert.equal(VetRecruitmentSignal.scoreBooking(0),0);
assert.equal(VetRecruitmentSignal.scoreBooking(1),8);
assert.equal(VetRecruitmentSignal.scoreBooking(4),20);
assert.equal(VetRecruitmentSignal.scoreBooking(6),25);
assert.equal(VetRecruitmentSignal.scoreDeferred(0),0);
assert.equal(VetRecruitmentSignal.scoreDeferred(1),5);
assert.equal(VetRecruitmentSignal.scoreDeferred(3),15);
assert.equal(VetRecruitmentSignal.scoreDeferred(4),20);

const data={
 clinic:{closedDates:[]},
 historical:{
  '2026-05':{sales:5000000},
  '2026-06':{sales:5100000},
  '2026-07':{sales:5200000}
 },
 entries:[]
};
for(let day=1;day<=31;day++){
 const date=`2026-08-${String(day).padStart(2,'0')}`;
 const weight=VetRecruitmentSignal.dayWeight(date,data);
 if(weight>0)data.entries.push({date,patients:20*weight,sales:200000*weight});
}
const capacity={};
const operating=data.entries.slice(-30);
operating.slice(0,4).forEach(row=>capacity[row.date]={turnedAway:1,deferredProcedures:0});
operating.slice(4,7).forEach(row=>capacity[row.date]={turnedAway:0,deferredProcedures:1});
const result=VetRecruitmentSignal.analyze({data,capacity,today:'2026-08-31'});
assert.equal(result.sales.average,5100000);
assert.equal(result.patients.average,20);
assert.deepEqual(result.parts,{sales:30,patients:25,booking:20,deferred:15});
assert.equal(result.score,90);
assert.equal(result.status.key,'go');

console.log('vet-recruitment-signal tests passed');
