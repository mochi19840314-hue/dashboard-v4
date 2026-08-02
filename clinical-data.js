(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.ClinicalData=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const FIELDS=["bloodTests","xrays","ultrasounds","surgeries","newPatients","revisits","preventive"];
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
    return Object.fromEntries(FIELDS.map(key=>[key,patients>0&&clinical[key]!==null?clinical[key]/patients*100:null]));
  }
  return {FIELDS,normalizeClinical,getClinicalRates};
});
