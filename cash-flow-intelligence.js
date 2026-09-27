(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 else root.CashFlowIntelligence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const KEY="keitaDashboardCashFlowV104";
 const TARGET=10000000;
 const valid=v=>v!==""&&v!==null&&v!==undefined&&Number.isFinite(Number(v))&&Number(v)>=0;
 const yen=v=>Math.round(v).toLocaleString("ja-JP")+"円";
 function calculate(record={}){
  const opening=valid(record.opening)?Number(record.opening):null;
  const closing=valid(record.closing)?Number(record.closing):null;
  const estimate=valid(record.estimate)?Number(record.estimate):null;
  const actual=opening===null||closing===null?null:closing-opening;
  return {opening,closing,estimate,actual,difference:actual===null||estimate===null?null:actual-estimate,gap:closing===null?null:Math.max(0,TARGET-closing),progress:closing===null?null:Math.min(100,closing/TARGET*100)};
 }
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}
 function month(){return document.getElementById("monthPicker")?.value||new Date().toLocaleDateString("sv-SE").slice(0,7)}
 function ensure(){
  const anchor=document.querySelector("#finance .hospital-household-card")||document.querySelector("#finance .card");
  if(!anchor||document.getElementById("cashFlowIntelligence"))return;
  const card=document.createElement("section");card.id="cashFlowIntelligence";card.className="card";
  card.innerHTML='<h3>預金1,000万円への進捗</h3><p class="cashflow-note">病院口座の月初・月末残高を入力してください。口座間振替は合計残高で相殺します。</p><div class="cashflow-fields"><label>月初残高（円）<input id="cashFlowOpening" type="number" min="0" step="1" inputmode="numeric" placeholder="未入力"></label><label>月末残高（円）<input id="cashFlowClosing" type="number" min="0" step="1" inputmode="numeric" placeholder="未入力"></label></div><button type="button" id="cashFlowSave">残高を保存</button><p id="cashFlowError" role="alert"></p><div id="cashFlowResults" aria-live="polite"></div><p class="cashflow-note">病院キャッシュ利益は推計値です。実際の預金増減とは入金日・税金・借入・事業主貸借等で異なります。未照合差額を利益として扱わないでください。</p>';
  anchor.insertAdjacentElement("afterend",card);
  const style=document.createElement("style");style.textContent='#cashFlowIntelligence{margin:16px 0;padding:20px}#cashFlowIntelligence .cashflow-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}#cashFlowIntelligence label{display:grid;gap:6px}#cashFlowIntelligence input{max-width:100%;min-width:0;box-sizing:border-box;padding:10px;font-size:16px}#cashFlowIntelligence button{margin:12px 0;padding:10px 16px}#cashFlowIntelligence .cashflow-note{font-size:12px;line-height:1.6;color:#687b78}#cashFlowResults p{margin:8px 0}#cashFlowError{color:#b33}';document.head.appendChild(style);
  document.getElementById("cashFlowSave").addEventListener("click",save);
 }
 function render(){
  ensure();const card=document.getElementById("cashFlowIntelligence");if(!card)return;
  const r=read()[month()]||{},m=calculate(r);
  document.getElementById("cashFlowOpening").value=m.opening??"";
  document.getElementById("cashFlowClosing").value=m.closing??"";
  document.getElementById("cashFlowResults").innerHTML='<p>月間預金増減：<strong>'+(m.actual===null?"未入力":(m.actual>=0?"+":"")+yen(m.actual))+'</strong></p><p>現在の病院預金：<strong>'+(m.closing===null?"未入力":yen(m.closing))+'</strong></p><p>目標まで：<strong>'+(m.gap===null?"確認できません":yen(m.gap))+'</strong></p><p>達成率：<strong>'+(m.progress===null?"確認できません":m.progress.toFixed(1)+"%")+'</strong></p><p>到達予測：<strong>算出不可（継続的な実績が必要）</strong></p>';
 }
 function save(){
  const a=document.getElementById("cashFlowOpening").value,b=document.getElementById("cashFlowClosing").value;
  const error=document.getElementById("cashFlowError");
  if((a!==""&&!valid(a))||(b!==""&&!valid(b))){error.textContent="0以上の金額を入力してください。";return}
  const all=read();all[month()]={opening:a===""?null:Number(a),closing:b===""?null:Number(b)};
  try{localStorage.setItem(KEY,JSON.stringify(all));error.textContent="";render()}catch{error.textContent="保存できませんでした。端末の保存領域を確認してください。"}
 }
 function setup(){
  ensure();render();
  document.getElementById("monthPicker")?.addEventListener("change",render);
  ["prevMonth","nextMonth"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>requestAnimationFrame(render)));
  document.querySelector('[data-page="finance"]')?.addEventListener("click",render);
  window.addEventListener("storage",e=>{if(e.key===KEY)render()});
 }
 if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup()}
 return {calculate,TARGET};
});
