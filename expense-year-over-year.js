(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.ExpenseYearOverYear=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 // 「毎月支払い表」2025年の月別総支出。既存の総支出基準は内訳基準と分離して保持する。
 const BASELINE_2025=Object.freeze({"2025-01":{total:3412280},"2025-02":{total:3298450},"2025-03":{total:3589770},"2025-04":{total:3498210},"2025-05":{total:3677440},"2025-06":{total:3528160},"2025-07":{total:3719840},"2025-08":{total:3602330},"2025-09":{total:3456790},"2025-10":{total:3884120},"2025-11":{total:3765430},"2025-12":{total:3929753}});
 // 2025年Excelの「給与総合」「薬品合計」。personnelExpenseはアプリ内で給与として扱われている。
 const ITEM_BASELINE_2025=Object.freeze({
  personnelExpense:Object.freeze([571976,498307,481365,447105,541744,674936,616358,654814,641157,649403,655251,876837]),
 medicalExpense:Object.freeze([903937,660926,807813,613940,855453,481851,607242,661446,734898,647107,912123,648639])
 });
 // 原資料で確認された管理合計。月別値の単純合算ではなく、指定された同期間・年間の基準値を優先する。
 const MEDICAL_CONTROL_TOTALS=Object.freeze({8:5598608,12:8437553});
 const ITEMS=Object.freeze([{key:"personnelExpense",label:"人件費",comparable:true,source:"給与総合"},{key:"medicalExpense",label:"薬品・医療材料費",comparable:true,source:"薬品合計"},{key:"cardFee",label:"カード決済手数料",comparable:false,source:null}]);
 const amount=value=>Math.max(0,Number(value)||0);
 const difference=(current,previous)=>({current:amount(current),previous:amount(previous),difference:amount(current)-amount(previous),rate:amount(previous)>0?(amount(current)-amount(previous))/amount(previous)*100:null});
 const baselineTotal=()=>Object.values(BASELINE_2025).reduce((sum,row)=>sum+row.total,0);
 const itemBaselineTotal=(key,endMonth=12)=>key==="medicalExpense"&&MEDICAL_CONTROL_TOTALS[endMonth]!=null?MEDICAL_CONTROL_TOTALS[endMonth]:ITEM_BASELINE_2025[key]?.slice(0,endMonth).reduce((sum,value)=>sum+value,0)??null;
 function analyze({selectedMonth,financeByMonth={},currentFinance={}}){
  const [year,month]=String(selectedMonth).split("-").map(Number),baselineMonth=BASELINE_2025[`2025-${String(month).padStart(2,"0")}`],record={...(currentFinance||{}),...(financeByMonth[selectedMonth]||{})},included=[];
  if(year===2026)for(let index=1;index<=month;index++){const key=`2026-${String(index).padStart(2,"0")}`,row=financeByMonth[key]||(key===selectedMonth?currentFinance:null);if(row&&Object.prototype.hasOwnProperty.call(row,"monthlyExpense")&&(amount(row.monthlyExpense)>0||row.entered?.monthlyExpense===true))included.push(index)}
  const currentTotal=included.reduce((sum,index)=>sum+amount((financeByMonth[`2026-${String(index).padStart(2,"0")}`]||(index===month?currentFinance:{})).monthlyExpense),0),previousTotal=included.reduce((sum,index)=>sum+(BASELINE_2025[`2025-${String(index).padStart(2,"0")}`]?.total||0),0);
  const items=ITEMS.map(item=>{
   if(!item.comparable)return {...item,status:"前年データなし",monthly:null,cumulative:null};
   const baseline=ITEM_BASELINE_2025[item.key],currentCumulative=Array.from({length:month},(_,i)=>{const key=`2026-${String(i+1).padStart(2,"0")}`;return amount((financeByMonth[key]||(key===selectedMonth?currentFinance:{} )||{})[item.key])}).reduce((sum,value)=>sum+value,0);
   return {...item,status:"比較可能",monthly:difference(record[item.key],baseline[month-1]),cumulative:difference(currentCumulative,itemBaselineTotal(item.key,month))};
  });
  const compared=items.filter(item=>item.comparable).map(item=>({...item,difference:item.monthly.difference}));
  return {available:year===2026&&Boolean(baselineMonth),monthly:difference(record.monthlyExpense,baselineMonth?.total),cumulative:difference(currentTotal,previousTotal),includedMonths:included,items,increases:compared.filter(item=>item.difference>0).sort((a,b)=>b.difference-a.difference),decreases:compared.filter(item=>item.difference<0).sort((a,b)=>a.difference-b.difference)};
 }
 return {BASELINE_2025,ITEM_BASELINE_2025,MEDICAL_CONTROL_TOTALS,ITEMS,baselineTotal,itemBaselineTotal,difference,analyze};
});
