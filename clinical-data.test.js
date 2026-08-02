"use strict";
const assert=require("node:assert/strict");
const {FIELDS,normalizeClinical,getClinicalRates}=require("./clinical-data");

assert.deepEqual(FIELDS,["bloodTests","xrays","ultrasounds","revisits","preventive"]);
const clinical=normalizeClinical({bloodTests:5,xrays:2,ultrasounds:3,revisits:16,preventive:4,newPatients:98,surgeries:97});
assert.deepEqual(clinical,{bloodTests:5,xrays:2,ultrasounds:3,revisits:16,preventive:4},"legacy duplicate fields are safely ignored");
assert.equal(normalizeClinical({bloodTests:0}).bloodTests,0,"zero remains distinct from blank");
assert.equal(normalizeClinical({bloodTests:""}).bloodTests,null,"blank remains unentered");
assert.equal(normalizeClinical().xrays,null,"missing clinical data is safe");
assert.equal(normalizeClinical({bloodTests:120}).bloodTests,99,"clinical values are capped at 99");
assert.equal(normalizeClinical({preventive:-4}).preventive,0,"clinical values are capped at 0");

const rates=getClinicalRates({patients:20,newPatients:3,surgeries:2,clinical});
assert.deepEqual(rates,{bloodTests:25,xrays:10,ultrasounds:15,revisits:80,preventive:20,newPatients:15,surgeries:10});
const legacyRates=getClinicalRates({patients:20,newPatients:3,surgeries:2,clinical:{newPatients:19,surgeries:18,revisits:17}});
assert.equal(legacyRates.newPatients,15,"entry.newPatients is canonical");
assert.equal(legacyRates.surgeries,10,"entry.surgeries is canonical");
for(const patients of [0,"",null,-1,"invalid"]){
  const invalid=getClinicalRates({patients,newPatients:3,surgeries:2,clinical});
  assert.equal(invalid.newPatients,null);assert.equal(invalid.surgeries,null);assert.equal(invalid.bloodTests,null);
}
assert.equal(getClinicalRates({patients:20}).bloodTests,null);
assert.equal(getClinicalRates({patients:20}).newPatients,null);
console.log("clinical data tests: canonical fields, rates, invalid patients, and legacy compatibility passed");
