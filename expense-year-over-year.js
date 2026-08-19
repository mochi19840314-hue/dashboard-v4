(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.ExpenseYearOverYear=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 // 「毎月支払い表」2025年の月別総支出。原資料上でアプリ項目との対応を確定できない内訳は含めない。
 const BASELINE_2025=Object.freeze({"2025-01":{total:3412280},"2025-02":{total:3298450},"2025-03":{total:3589770},"2025-04":{total:3498210},"2025-05":{total:3677440},"2025-06":{total:3528160},"2025-07":{total:3719840},"2025-08":{total:3602330},"2025-09":{total:3456790},"2025-10":{total:3884120},"2025-11":{total:3765430},"2025-12":{total:3929753}});
 const ITEMS=Object.freeze([{key:"personnelExpense",label:"人件費",comparable:false},{key:"medicalExpense",label:"薬品・医療材料費",comparable:false},{key:"cardFee",label:"カード決済手数料",comparable:false}]);
 const amount=value=>Math.max(0,Number(value)||0);
 const difference=(current,previous)=>({current:amount(current),previous:amount(previous),difference:amount(current)-amount(previous),rate:amount(previous)>0?(amount(current)-amount(previous))/amount(previous)*100:null});
 const baselineTotal=()=>Object.values(BASELINE_2025).reduce((sum,row)=>sum+row.total,0);
 function analyze({selectedMonth,financeByMonth={},currentFinance={}}){
  const [year,month]=String(selectedMonth).split("-").map(Number),baselineMonth=BASELINE_2025[`2025-${String(month).padStart(2,"0")}`],record={...(currentFinance||{}),...(financeByMonth[selectedMonth]||{})},included=[];
  if(year===2026)for(let index=1;index<=month;index++){const key=`2026-${String(index).padStart(2,"0")}`,row=financeByMonth[key]||(key===selectedMonth?currentFinance:null);if(row&&Object.prototype.hasOwnProperty.call(row,"monthlyExpense")&&(amount(row.monthlyExpense)>0||row.entered?.monthlyExpense===true))included.push(index)}
  const currentTotal=included.reduce((sum,index)=>sum+amount((financeByMonth[`2026-${String(index).padStart(2,"0")}`]||(index===month?currentFinance:{})).monthlyExpense),0),previousTotal=included.reduce((sum,index)=>sum+(BASELINE_2025[`2025-${String(index).padStart(2,"0")}`]?.total||0),0);
  return {available:year===2026&&Boolean(baselineMonth),monthly:difference(record.monthlyExpense,baselineMonth?.total),cumulative:difference(currentTotal,previousTotal),includedMonths:included,items:ITEMS.map(item=>({...item,status:"前年比較対象外"})),increases:[],decreases:[]};
 }
 return {BASELINE_2025,ITEMS,baselineTotal,difference,analyze};
});
