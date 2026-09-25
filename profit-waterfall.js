(function(){
"use strict";
const KEY="keitaDashboardSimpleV1",amount=v=>Math.max(0,Number(v)||0),yen=v=>Math.round(amount(v)).toLocaleString("ja-JP")+"円";
function read(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
function month(){return document.getElementById("monthPicker")?.value||new Date().toLocaleDateString("sv-SE").slice(0,7)}
function sales(data,m){return window.GrossProfitKpi?.summarize(data,m)?.sales||0}
function model(data,m){
 const mf=data.financeByMonth?.[m]||{},current=new Date().toLocaleDateString("sv-SE").slice(0,7)===m?data.finance||{}:{},pick=k=>amount(Object.prototype.hasOwnProperty.call(mf,k)?mf[k]:current[k]);
 const total=sales(data,m),medical=pick("medicalExpense"),personnel=pick("personnelExpense"),card=pick("cardFee");
 const hospital=amount(Object.prototype.hasOwnProperty.call(mf,"hospitalCashExpense")?mf.hospitalCashExpense:(data.historical?.[m]?.expense??current.hospitalCashExpense));
 const gross=Math.max(0,total-medical),other=Math.max(0,hospital-medical-personnel-card),cash=total-hospital;
 return {total,medical,gross,personnel,card,other,hospital,cash};
}
function render(){
 const host=document.getElementById("profitWaterfall");if(!host)return;const m=month(),x=model(read(),m);document.getElementById("profitWaterfallMonth").textContent=m.replace("-","年")+"月";
 if(!x.total||!x.hospital){host.innerHTML='<p class="empty">財務画面で病院実支出と内訳を入力すると表示します。</p>';return}
 const rows=[["総売上",x.total,"start"],["薬品・医療材料費",x.medical,"cost"],["粗利",x.gross,"subtotal"],["人件費",x.personnel,"cost"],["カード決済手数料",x.card,"cost"],["その他の病院実支出",x.other,"cost"],["病院キャッシュ利益",x.cash,"final"]];
 const max=Math.max(x.total,1);host.innerHTML=rows.map(([label,value,type])=>'<div class="profit-waterfall-row '+type+'"><div><span>'+label+'</span><strong>'+(type==="cost"?"−":"")+(type==="final"&&value<0?"−":"")+yen(Math.abs(value))+'</strong></div><i style="--w:'+Math.max(2,Math.min(100,Math.abs(value)/max*100)).toFixed(1)+'%"></i></div>').join("");
}
function setup(){render();const again=()=>requestAnimationFrame(()=>requestAnimationFrame(render));document.getElementById("monthPicker")?.addEventListener("change",again);["prevMonth","nextMonth"].forEach(id=>document.getElementById(id)?.addEventListener("click",again));document.querySelector('[data-page="month"]')?.addEventListener("click",again);document.getElementById("saveFinance")?.addEventListener("click",again);window.addEventListener("storage",e=>{if(e.key===KEY)render()})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();