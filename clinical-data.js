(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.ClinicalData=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Clinical owns only procedure/category counts; top-level entry fields are canonical for new patients and surgeries.
  const FIELDS=["bloodTests","xrays","ultrasounds","preventive"];
  const LEGACY_FIELDS=[...FIELDS,"revisits"];
  function normalizeClinical(value={}){
    const source=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
    return Object.fromEntries(LEGACY_FIELDS.map(key=>{
      if(source[key]===null||source[key]===undefined||source[key]==="")return [key,null];
      const number=Number(source[key]);
      return [key,Number.isFinite(number)?Math.min(99,Math.max(0,Math.trunc(number))):null];
    }));
  }
  function calculateRevisits(entry={}){
    const patientValue=entry.patients,newPatientValue=entry.newPatients;
    if(patientValue===null||patientValue===undefined||patientValue===""||newPatientValue===null||newPatientValue===undefined||newPatientValue==="")return null;
    const patients=Number(patientValue),newPatients=Number(newPatientValue);
    return Number.isFinite(patients)&&Number.isFinite(newPatients)&&patients>0&&newPatients>=0&&newPatients<=patients?patients-newPatients:null;
  }
  function getClinicalRates(entry={}){
    const patients=Number(entry.patients),clinical=normalizeClinical(entry.clinical);
    const validPatients=Number.isFinite(patients)&&patients>0;
    const rate=value=>{
      const number=Number(value);
      return validPatients&&value!==null&&value!==undefined&&value!==""&&Number.isFinite(number)&&number>=0?number/patients*100:null;
    };
    const hasCanonicalRevisitInputs=entry.patients!==null&&entry.patients!==undefined&&entry.patients!==""&&entry.newPatients!==null&&entry.newPatients!==undefined&&entry.newPatients!=="";
    const calculated=calculateRevisits(entry),revisits=hasCanonicalRevisitInputs?calculated:clinical.revisits;
    return {...Object.fromEntries(FIELDS.map(key=>[key,rate(clinical[key])])),revisits:rate(revisits),newPatients:rate(entry.newPatients),surgeries:rate(entry.surgeries)};
  }
  return {FIELDS,LEGACY_FIELDS,normalizeClinical,calculateRevisits,getClinicalRates};
});
