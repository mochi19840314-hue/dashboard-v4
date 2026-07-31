"use strict";
const assert=require("node:assert/strict");
const {selectedFinance,reportAvailability}=require("./report-month.js");

const financeByMonth={
  "2026-07":{personnelExpense:971449,medicalExpense:230000,cardFee:45000},
  "2026-08":{}
};
let august=selectedFinance(financeByMonth,"2026-08");
const july=selectedFinance(financeByMonth,"2026-07");
assert.equal(august.personnelExpense.entered,false,"August does not inherit July personnel expense");
assert.deepEqual(july.personnelExpense,{entered:true,value:971449},"July keeps its own expense");

financeByMonth["2026-08"]={personnelExpense:800000,medicalExpense:0,cardFee:"",entered:{personnelExpense:true,medicalExpense:true,cardFee:false}};
august=selectedFinance(financeByMonth,"2026-08");
assert.deepEqual(august.personnelExpense,{entered:true,value:800000},"entered August amount is selected");
assert.deepEqual(august.medicalExpense,{entered:true,value:0},"explicit zero remains entered");
assert.equal(august.cardFee.entered,false,"empty value remains missing");
assert.equal(july.personnelExpense.value,971449,"reading August cannot mutate or leak comparison data");

assert.deepEqual(reportAvailability({entries:[]}),{days:0,empty:true,provisional:false},"empty month withholds grade");
assert.deepEqual(reportAvailability({entries:[{date:"2026-08-01"}]}),{days:1,empty:false,provisional:true},"small sample is provisional");
assert.deepEqual(reportAvailability({entries:Array.from({length:7},(_,i)=>({date:String(i)}))}),{days:7,empty:false,provisional:false},"sufficient sample is not provisional");

const backup=JSON.parse(JSON.stringify({financeByMonth}));
assert.equal(selectedFinance(backup.financeByMonth,"2026-07").personnelExpense.value,971449,"legacy JSON records without entered flags restore safely");
console.log("selected month report tests: 10 scenarios passed");
