(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.ClinicalData=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Clinical owns only procedure/category counts; top-level entry fields are canonical for new patients and surgeries.
  const FIELDS=["bloodTests","xrays","ultrasounds","revisits","preventive"];
  function normalizeClinical(value={}){
    const source=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
    return Object.fromEntries(FIELDS.map(key=>{
      if(source[key]===null||source[key]===undefined||source[key]==="")return [key,null];
      const number=Number(source[key]);
      return [key,Number.isFinite(number)?Math.min(99,Math.max(0,Math.trunc(number))):null];
    }));
  }
  function getClinicalRates(entry={}){
    const patients=Number(entry.patients),clinical=normalizeClinical(entry.clinical);
    const validPatients=Number.isFinite(patients)&&patients>0;
    const rate=value=>{
      const number=Number(value);
      return validPatients&&value!==null&&value!==undefined&&value!==""&&Number.isFinite(number)&&number>=0?number/patients*100:null;
    };
    return {...Object.fromEntries(FIELDS.map(key=>[key,rate(clinical[key])])),newPatients:rate(entry.newPatients),surgeries:rate(entry.surgeries)};
  }
  return {FIELDS,normalizeClinical,getClinicalRates};
});
