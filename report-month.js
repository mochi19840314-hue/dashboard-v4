(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.ReportMonth=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object||{},key);

  function financeValue(monthFinance,field){
    const record=monthFinance&&typeof monthFinance==="object"?monthFinance:{};
    const explicitlyEntered=record.entered&&own(record.entered,field)?record.entered[field]===true:own(record,field);
    const raw=record[field];
    if(!explicitlyEntered||raw===undefined||raw===null||raw==="")return {entered:false,value:null};
    const value=Number(raw);
    return Number.isFinite(value)?{entered:true,value}:{entered:false,value:null};
  }

  function selectedFinance(financeByMonth,month){
    const record=financeByMonth&&financeByMonth[month];
    return {
      month,
      personnelExpense:financeValue(record,"personnelExpense"),
      medicalExpense:financeValue(record,"medicalExpense"),
      cardFee:financeValue(record,"cardFee")
    };
  }

  function reportAvailability(summary){
    const days=Array.isArray(summary&&summary.entries)?summary.entries.length:0;
    return {days,empty:days===0,provisional:days>0&&days<7};
  }

  return {financeValue,selectedFinance,reportAvailability};
});
