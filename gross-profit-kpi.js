(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.GrossProfitKpi=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const KEY="keitaDashboardSimpleV1";
  const amount=v=>Math.max(0,Number(v)||0);
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  const yen=n=>Math.round(amount(n)).toLocaleString("ja-JP")+"円";

  function calculate(sales,directMedicalCost,entered=true){
    sales=amount(sales);directMedicalCost=amount(directMedicalCost);
    const grossProfit=Math.max(0,sales-directMedicalCost);
    return {sales,directMedicalCost,grossProfit,grossMargin:sales?grossProfit/sales*100:null,entered:Boolean(entered)};
  }
  function monthSales(data,month){
    const entries=(Array.isArray(data.entries)?data.entries:[]).filter(e=>e&&typeof e.date==="string"&&e.date.slice(0,7)===month);
    const dailySales=entries.reduce((sum,e)=>sum+amount(e.sales),0),hist=data.historical?.[month]||{},mf=data.financeByMonth?.[month]||{};
    const clinicalSales=dailySales||amount(hist.sales);
    return clinicalSales+amount(mf.morikuboOnline)+amount(mf.royalCanin)+amount(mf.purina);
  }
  function summarize(data,month){
    const mf=data.financeByMonth?.[month]||{},current=new Date().toLocaleDateString("sv-SE").slice(0,7)===month?data.finance||{}:{};
    const entered=mf.entered?.medicalExpense===true||own(mf,"medicalExpense")||own(current,"medicalExpense");
    const cost=own(mf,"medicalExpense")?mf.medicalExpense:current.medicalExpense;
    return calculate(monthSales(data,month),cost,entered);
  }
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
  function selectedMonth(){return document.getElementById("monthPicker")?.value||new Date().toLocaleDateString("sv-SE").slice(0,7)}
  function ensureUi(){
    const legacy=document.getElementById("costOfSales")?.closest("label");if(legacy)legacy.remove();
    const host=document.querySelector("#month .month-primary-kpis"),salesCard=host?.querySelector(".month-total-card");
    if(host&&!document.getElementById("monthGrossProfit")){
      const profit=document.createElement("article");profit.className="month-gross-card";profit.innerHTML='<span>粗利</span><strong id="monthGrossProfit">—</strong><small>総売上 − 薬品・医療材料費</small>';
      const rate=document.createElement("article");rate.className="month-gross-rate-card";rate.innerHTML='<span>粗利率</span><strong id="monthGrossMargin">—</strong><small>粗利 ÷ 総売上</small>';
      salesCard?.insertAdjacentElement("afterend",rate);salesCard?.insertAdjacentElement("afterend",profit);
    }
    const profit=document.getElementById("monthGrossProfit")?.closest("article"),rate=document.getElementById("monthGrossMargin")?.closest("article");
    profit?.querySelector("small")&&(profit.querySelector("small").textContent="総売上 − 薬品・医療材料費");
    rate?.querySelector("small")&&(rate.querySelector("small").textContent="粗利 ÷ 総売上");
  }
  function render(){
    ensureUi();const result=summarize(read(),selectedMonth()),profit=document.getElementById("monthGrossProfit"),margin=document.getElementById("monthGrossMargin");
    if(profit)profit.textContent=result.entered?yen(result.grossProfit):"—";
    if(margin)margin.textContent=result.entered&&result.grossMargin!==null?result.grossMargin.toFixed(1)+"%":"—";
  }
  function setup(){
    ensureUi();render();
    const rerender=()=>requestAnimationFrame(()=>requestAnimationFrame(render));
    document.getElementById("monthPicker")?.addEventListener("change",rerender);
    ["prevMonth","nextMonth"].forEach(id=>document.getElementById(id)?.addEventListener("click",rerender));
    document.querySelector('[data-page="finance"]')?.addEventListener("click",rerender);
    document.querySelector('[data-page="month"]')?.addEventListener("click",rerender);
    document.getElementById("saveFinance")?.addEventListener("click",rerender);
    window.addEventListener("storage",event=>{if(event.key===KEY)render()});
  }
  if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup()}
  return {calculate,summarize};
});