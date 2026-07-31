(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.MonthRollover=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const MONTHLY_FINANCE_FIELDS=["monthlyExpense","personnelExpense","medicalExpense","cardFee","loan","repayment","morikuboOnline","royalCanin","purina"];

  function validMonth(value){return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value||""))}

  function savedMonth(data){
    if(validMonth(data?.meta?.activeMonth))return data.meta.activeMonth;
    const updated=String(data?.meta?.lastUpdated||"").slice(0,7);
    if(validMonth(updated))return updated;
    const months=[];
    (Array.isArray(data?.entries)?data.entries:[]).forEach(entry=>{const month=String(entry?.date||"").slice(0,7);if(validMonth(month))months.push(month)});
    [data?.settings,data?.financeByMonth,data?.monthlyReports].forEach(group=>Object.keys(group||{}).filter(validMonth).forEach(month=>months.push(month)));
    return months.sort().at(-1)||null;
  }

  function needsConfirmation(data,currentMonth){
    const previous=savedMonth(data);
    return {show:Boolean(previous&&validMonth(currentMonth)&&previous!==currentMonth),previous,currentMonth};
  }

  function createMonth(data,currentMonth,options={}){
    if(!data||!validMonth(currentMonth))throw new TypeError("valid data and currentMonth are required");
    const next={...data};
    next.meta={...(data.meta||{}),activeMonth:currentMonth};
    next.settings={...(data.settings||{})};
    if(!Object.prototype.hasOwnProperty.call(next.settings,currentMonth))next.settings[currentMonth]={target:Number(options.target)||5000000,businessDays:Number(options.businessDays)||1};
    next.financeByMonth={...(data.financeByMonth||{})};
    if(!Object.prototype.hasOwnProperty.call(next.financeByMonth,currentMonth)){
      const previousMonth=options.previousMonth||savedMonth(data),previous=data.financeByMonth?.[previousMonth]||{};
      next.financeByMonth[currentMonth]={balance:Number(previous.balance??data.finance?.balance)||0,monthlyExpense:0,personnelExpense:0,medicalExpense:0,cardFee:0,loan:0,repayment:0,morikuboOnline:0,royalCanin:0,purina:0};
    }
    next.monthlyReports={...(data.monthlyReports||{})};
    const previousMonth=options.previousMonth||savedMonth(data);
    if(previousMonth&&String(data.memo||"").trim()&&!next.monthlyReports[previousMonth])next.monthlyReports[previousMonth]={memo:data.memo};
    if(!Object.prototype.hasOwnProperty.call(next.monthlyReports,currentMonth))next.monthlyReports[currentMonth]={aiComment:"初期状態",memo:""};
    next.memo=next.monthlyReports[currentMonth]?.memo||"";
    next.finance={...(data.finance||{})};
    MONTHLY_FINANCE_FIELDS.forEach(field=>{next.finance[field]=Number(next.financeByMonth[currentMonth]?.[field])||0});
    next.finance.balance=Number(next.financeByMonth[currentMonth]?.balance)||0;
    return next;
  }

  return {validMonth,savedMonth,needsConfirmation,createMonth,MONTHLY_FINANCE_FIELDS};
});
