(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.MonthlyCashflowChart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const KEY="keitaDashboardSimpleV1";
  const amount=v=>Math.max(0,Number(v)||0);
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  const yen=n=>Math.round(n).toLocaleString("ja-JP")+"円";
  function summarize(data,month){
    if(!/^\\d{4}-(0[1-9]|1[0-2])$/.test(month))return null;
    const entries=(Array.isArray(data.entries)?data.entries:[]).filter(e=>e&&typeof e.date==="string"&&e.date.slice(0,7)===month);
    const dailySales=entries.reduce((sum,e)=>sum+amount(e.sales),0);
    const hist=data.historical?.[month]||{},mf=data.financeByMonth?.[month]||{};
    const clinicalSales=dailySales||amount(hist.sales);
    const sales=clinicalSales+amount(mf.morikuboOnline)+amount(mf.royalCanin)+amount(mf.purina);
    const current=new Date().toLocaleDateString("sv-SE").slice(0,7)===month?data.finance||{}:{};
    const hasExpense=own(mf,"hospitalCashExpense")||own(mf,"monthlyExpense")||own(hist,"expense")||own(current,"hospitalCashExpense")||own(current,"monthlyExpense");
    const expense=own(mf,"hospitalCashExpense")?amount(mf.hospitalCashExpense):own(mf,"monthlyExpense")?amount(mf.monthlyExpense):own(hist,"expense")?amount(hist.expense):amount(own(current,"hospitalCashExpense")?current.hospitalCashExpense:current.monthlyExpense);
    return {month,sales,expense,balance:sales-expense,hasSales:entries.length>0||own(hist,"sales")||sales>0,hasExpense};
  }
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
  function render(){
    const host=document.querySelector("#month .month-primary-kpis");
    if(!host)return;
    let card=document.getElementById("monthlyCashflowChart");
    if(!card){
      card=document.createElement("section");card.id="monthlyCashflowChart";card.className="card";card.setAttribute("aria-label","月間収支グラフ");
      host.insertAdjacentElement("afterend",card);
    }
    const month=document.getElementById("monthPicker")?.value||new Date().toLocaleDateString("sv-SE").slice(0,7);
    const row=summarize(read(),month);
    if(!row||!row.hasSales||!row.hasExpense){
      card.innerHTML='<h3>月間収支</h3><p>売上・病院実支出の入力後に表示します。</p>';return;
    }
    const max=Math.max(row.sales,row.expense,1);
    const salesWidth=row.sales/max*100,expenseWidth=row.expense/max*100;
    const tone=row.balance>=0?"positive":"negative";
    card.innerHTML=`<div class="cashflow-heading"><div><small>MONTHLY CASH FLOW</small><h3>月間収支</h3></div><span>${month.replace("-","年")}月</span></div>
      <div class="cashflow-balance ${tone}">${row.balance>=0?"+":"−"}${yen(Math.abs(row.balance))}</div>
      <p class="cashflow-formula">月商 − 病院実支出</p>
      <div class="cashflow-item"><div><span>月商</span><strong>${yen(row.sales)}</strong></div><div class="cashflow-track"><i class="cashflow-sales" style="width:${salesWidth}%"></i></div></div>
      <div class="cashflow-item"><div><span>病院実支出</span><strong>${yen(row.expense)}</strong></div><div class="cashflow-track"><i class="cashflow-expense" style="width:${expenseWidth}%"></i></div></div>
      <p class="cashflow-foot">収支率 ${row.sales?(row.balance/row.sales*100).toFixed(1)+"%":"—"} ・ 減価償却を含まない現金ベースの概算</p>`;
  }
  function setup(){
    const css=document.createElement("style");css.textContent=`
      #monthlyCashflowChart{margin:16px 0;padding:22px;border-radius:24px}
      .cashflow-heading,.cashflow-item>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .cashflow-heading small{font-size:10px;letter-spacing:.14em;color:#087d72;font-weight:700}
      .cashflow-heading h3{margin:4px 0 0;font-size:19px}.cashflow-heading>span{font-size:12px;color:#647773}
      .cashflow-balance{font-size:clamp(30px,7vw,44px);font-weight:800;line-height:1.3;margin-top:16px;font-variant-numeric:tabular-nums}
      .cashflow-balance.positive{color:#087d72}.cashflow-balance.negative{color:#bd4b4b}
      .cashflow-formula,.cashflow-foot{color:#687b78;font-size:12px;margin:2px 0 18px}
      .cashflow-item{margin:14px 0}.cashflow-item>div:first-child{font-size:13px;margin-bottom:7px}
      .cashflow-item strong{font-variant-numeric:tabular-nums}
      .cashflow-track{height:15px;background:#edf2f1;border-radius:20px;overflow:hidden}
      .cashflow-track i{display:block;height:100%;border-radius:20px}
      .cashflow-sales{background:#087d72}.cashflow-expense{background:#d8a34b}
      .cashflow-foot{margin:18px 0 0}`;
    document.head.appendChild(css);render();
    const rerender=()=>requestAnimationFrame(()=>requestAnimationFrame(render));
    document.getElementById("monthPicker")?.addEventListener("change",rerender);
    ["prevMonth","nextMonth","saveSettings"].forEach(id=>document.getElementById(id)?.addEventListener("click",rerender));
    document.querySelector('[data-page="month"]')?.addEventListener("click",rerender);
    window.addEventListener("storage",event=>{if(event.key===KEY)render()});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
    root.MonthlyCashflowChart.render=render;
  }
  if(typeof document!=="undefined"){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
  }
  return {summarize,render};
});