(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.FinanceCashflowBars=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const amount=value=>Math.max(0,Number(value)||0);
 const yen=value=>Math.round(value).toLocaleString("ja-JP")+"円";
 const signed=value=>(value<0?"−":value>0?"+":"±")+yen(Math.abs(value));
 function model({clinicalSales=0,hospitalExpense=0,householdExpense=0}={}){
  const sales=amount(clinicalSales),hospital=amount(hospitalExpense),household=amount(householdExpense);
  return {sales,hospital,household,total:hospital+household,hospitalBalance:sales-hospital,combinedBalance:sales-hospital-household};
 }
 function widths(values){
  const max=Math.max(1,...values.map(amount));
  return values.map(value=>amount(value)/max*100);
 }
 function readYen(id){
  return Number((document.getElementById(id)?.textContent||"").replace(/[^0-9]/g,""))||0;
 }
 function bar(label,value,width,kind){
  return `<div class="finance-flow-line"><div><span>${label}</span><strong>${yen(value)}</strong></div><div class="finance-flow-track"><i class="finance-flow-${kind}" style="width:${width}%"></i></div></div>`;
 }
 function render(){
  const anchor=document.querySelector("#finance .hospital-household-card");
  if(!anchor)return;
  let card=document.getElementById("financeCashflowBars");
  if(!card){card=document.createElement("section");card.id="financeCashflowBars";card.className="card";card.setAttribute("aria-label","財務収支の棒グラフ");anchor.insertAdjacentElement("afterend",card);}
  const row=model({clinicalSales:readYen("hospitalClinicalSales"),hospitalExpense:readYen("hospitalActualExpense"),householdExpense:readYen("householdExpenseBreakdown")});
  const month=document.getElementById("monthPicker")?.value||"";
  const [hwSales,hwExpense]=widths([row.sales,row.hospital]);
  const [cwSales,cwExpense]=widths([row.sales,row.total]);
  const balance=(value)=>`<strong class="finance-flow-result ${value<0?"negative":"positive"}">${signed(value)}</strong>`;
  card.innerHTML=`<header class="finance-flow-header"><div><small>FINANCIAL CASH FLOW</small><h3>財務収支の比較</h3></div><span>${month?month.replace("-","年")+"月":""}</span></header>
   <div class="finance-flow-group"><h4>病院収支</h4>${balance(row.hospitalBalance)}
   ${bar("診療売上",row.sales,hwSales,"sales")}${bar("病院実支出",row.hospital,hwExpense,"hospital")}</div>
   <div class="finance-flow-group"><h4>病院＋家計 収支</h4>${balance(row.combinedBalance)}
   ${bar("診療売上",row.sales,cwSales,"sales")}${bar("家計込み総支出",row.total,cwExpense,"total")}
   <p class="finance-flow-note">内訳：病院実支出 ${yen(row.hospital)} ＋ 家計支出 ${yen(row.household)}</p></div>
   <p class="finance-flow-note">上の既存「病院収支」「病院＋家計 収支」と同じ診療売上ベースです。EC売上は含みません。家計支出を病院実支出に重複加算しません。減価償却費は含まない現金ベースの概算です。</p>`;
 }
 function setup(){
  if(document.getElementById("financeCashflowBarsStyle"))return;
  const css=document.createElement("style");css.id="financeCashflowBarsStyle";css.textContent=`
  #financeCashflowBars{padding:22px;margin:16px 0;border-radius:24px}
  .finance-flow-header,.finance-flow-line>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .finance-flow-header small{color:#087d72;font-size:10px;letter-spacing:.14em;font-weight:700}
  .finance-flow-header h3{margin:4px 0;font-size:19px}.finance-flow-header>span{font-size:12px;color:#647773}
  .finance-flow-group{padding:18px 0;border-bottom:1px solid #e4ecea}.finance-flow-group h4{margin:0 0 6px;font-size:15px}
  .finance-flow-result{display:block;font-size:clamp(26px,7vw,39px);font-variant-numeric:tabular-nums;margin-bottom:17px}
  .finance-flow-result.positive{color:#087d72}.finance-flow-result.negative{color:#bd4b4b}
  .finance-flow-line{margin:12px 0}.finance-flow-line>div:first-child{font-size:13px;margin-bottom:7px}
  .finance-flow-line strong{font-variant-numeric:tabular-nums}
  .finance-flow-track{height:15px;background:#edf2f1;border-radius:20px;overflow:hidden}
  .finance-flow-track i{display:block;height:100%;border-radius:20px}
  .finance-flow-sales{background:#087d72}.finance-flow-hospital{background:#d8a34b}.finance-flow-total{background:#d8a34b}
  .finance-flow-note{font-size:12px;color:#687b78;line-height:1.6;margin:12px 0 0}`;
  document.head.appendChild(css);
  render();
 }
 if(typeof document!=="undefined"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
 }
 return {model,widths,render};
});
