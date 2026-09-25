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

  function calculate(sales,costOfSales,entered=true){
    sales=amount(sales);costOfSales=amount(costOfSales);
    const grossProfit=Math.max(0,sales-costOfSales);
    return {sales,costOfSales,grossProfit,grossMargin:sales?grossProfit/sales*100:null,entered:Boolean(entered)};
  }
  function monthSales(data,month){
    const entries=(Array.isArray(data.entries)?data.entries:[]).filter(e=>e&&typeof e.date==="string"&&e.date.slice(0,7)===month);
    const dailySales=entries.reduce((sum,e)=>sum+amount(e.sales),0),hist=data.historical?.[month]||{},mf=data.financeByMonth?.[month]||{};
    const clinicalSales=dailySales||amount(hist.sales);
    return clinicalSales+amount(mf.morikuboOnline)+amount(mf.royalCanin)+amount(mf.purina);
  }
  function summarize(data,month){
    const mf=data.financeByMonth?.[month]||{},current=new Date().toLocaleDateString("sv-SE").slice(0,7)===month?data.finance||{}:{};
    const entered=mf.entered?.costOfSales===true||own(mf,"costOfSales")||own(current,"costOfSales");
    const cost=own(mf,"costOfSales")?mf.costOfSales:current.costOfSales;
    return calculate(monthSales(data,month),cost,entered);
  }
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
  function write(data){localStorage.setItem(KEY,JSON.stringify(data))}
  function selectedMonth(){return document.getElementById("monthPicker")?.value||new Date().toLocaleDateString("sv-SE").slice(0,7)}
  function ensureUi(){
    const form=document.querySelector("#finance .card.form"),medical=document.getElementById("medicalExpense");
    if(form&&!document.getElementById("costOfSales")){
      const label=document.createElement("label");
      label.innerHTML='売上原価（円）<input id="costOfSales" type="number" min="0" inputmode="numeric"><small>薬品・医療材料・フード等、売上に直接対応する仕入原価。人件費・家賃・減価償却費は含めません</small>';
      (medical?.closest("label")||form.firstElementChild)?.insertAdjacentElement("afterend",label);
    }
    const host=document.querySelector("#month .month-primary-kpis"),salesCard=host?.querySelector(".month-total-card");
    if(host&&!document.getElementById("monthGrossProfit")){
      const profit=document.createElement("article");profit.className="month-gross-card";profit.innerHTML='<span>粗利</span><strong id="monthGrossProfit">—</strong><small>総売上 − 売上原価</small>';
      const rate=document.createElement("article");rate.className="month-gross-rate-card";rate.innerHTML='<span>粗利率</span><strong id="monthGrossMargin">—</strong><small>粗利 ÷ 総売上</small>';
      salesCard?.insertAdjacentElement("afterend",rate);salesCard?.insertAdjacentElement("afterend",profit);
    }
  }
  function loadInput(){
    const input=document.getElementById("costOfSales");if(!input)return;
    const data=read(),month=selectedMonth(),mf=data.financeByMonth?.[month]||{},current=new Date().toLocaleDateString("sv-SE").slice(0,7)===month?data.finance||{}:{};
    const entered=mf.entered?.costOfSales===true||own(mf,"costOfSales")||own(current,"costOfSales");
    input.value=entered?String(amount(own(mf,"costOfSales")?mf.costOfSales:current.costOfSales)):"";
  }
  function saveInput(){
    const input=document.getElementById("costOfSales");if(!input)return;
    const data=read(),month=selectedMonth(),value=amount(input.value),entered=input.value.trim()!=="";
    data.financeByMonth=data.financeByMonth||{};data.financeByMonth[month]={...(data.financeByMonth[month]||{}),costOfSales:value,entered:{...(data.financeByMonth[month]?.entered||{}),costOfSales:entered}};
    if(new Date().toLocaleDateString("sv-SE").slice(0,7)===month)data.finance={...(data.finance||{}),costOfSales:value};
    data.meta={...(data.meta||{}),lastUpdated:new Date().toISOString()};write(data);render();
  }
  function render(){
    ensureUi();const result=summarize(read(),selectedMonth()),profit=document.getElementById("monthGrossProfit"),margin=document.getElementById("monthGrossMargin");
    if(profit)profit.textContent=result.entered?yen(result.grossProfit):"—";
    if(margin)margin.textContent=result.entered&&result.grossMargin!==null?result.grossMargin.toFixed(1)+"%":"—";
  }
  function setup(){
    ensureUi();loadInput();render();
    const rerender=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{loadInput();render()}));
    document.getElementById("monthPicker")?.addEventListener("change",rerender);
    ["prevMonth","nextMonth"].forEach(id=>document.getElementById(id)?.addEventListener("click",rerender));
    document.querySelector('[data-page="finance"]')?.addEventListener("click",rerender);
    document.querySelector('[data-page="month"]')?.addEventListener("click",rerender);
    document.getElementById("saveFinance")?.addEventListener("click",()=>requestAnimationFrame(saveInput));
    window.addEventListener("storage",event=>{if(event.key===KEY){loadInput();render()}});
  }
  if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup()}
  return {calculate,summarize};
});