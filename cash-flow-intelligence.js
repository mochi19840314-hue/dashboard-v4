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
  const estimate=record.estimate===""||record.estimate===null||record.estimate===undefined?null:Number.isFinite(Number(record.estimate))?Number(record.estimate):null;
  const actual=opening===null||closing===null?null:closing-opening;
  return {opening,closing,estimate,actual,difference:actual===null||estimate===null?null:actual-estimate,gap:closing===null?null:Math.max(0,TARGET-closing),progress:closing===null?null:Math.min(100,closing/TARGET*100)};
 }
 function advise(record={}){const m=calculate(record);if(m.actual===null)return "影武者・現金チェック：月初と月末の病院口座残高を入力すると、実際の現金増減を確認できます。";if(m.estimate===null)return "影武者・現金チェック：預金増減は確認できました。病院キャッシュ利益を入力すると差額を照合できます。";if(m.difference!==0)return "影武者・現金チェック：推計利益と預金増減に差額があります。カード入金日、税金、借入返済、設備投資、事業主貸借を確認してください。原因が分かるまでは余剰資金とみなしません。";return "影武者・現金チェック：入力された推計利益と預金増減は一致しています。ただし今後の税金・支払予定も確認してください。"}
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}
 function month(){return document.getElementById("monthPicker")?.value||new Date().toLocaleDateString("sv-SE").slice(0,7)}
 function ensure(){
  const anchor=document.querySelector("#finance .hospital-household-card")||document.querySelector("#finance .card");
  if(!anchor||document.getElementById("cashFlowIntelligence"))return;
  const card=document.createElement("section");card.id="cashFlowIntelligence";card.className="card";
  card.innerHTML='<h3>預金1,000万円への進捗</h3><p class="cashflow-note">病院口座の月初・月末残高を入力してください。口座間振替は合計残高で相殺します。</p><div class="cashflow-fields"><label>月初残高（円）<input id="cashFlowOpening" type="number" min="0" step="1" inputmode="numeric" placeholder="未入力"></label><label>月末残高（円）<input id="cashFlowClosing" type="number" min="0" step="1" inputmode="numeric" placeholder="未入力"></label><label>病院キャッシュ利益（任意・円）<input id="cashFlowEstimate" type="number" step="1" inputmode="numeric" placeholder="未入力"></label></div><button type="button" id="cashFlowSave">残高を保存</button><p id="cashFlowError" role="alert"></p><div id="cashFlowResults" aria-live="polite"></div><p class="cashflow-note">病院キャッシュ利益は推計値です。実際の預金増減とは入金日・税金・借入・事業主貸借等で異なります。未照合差額を利益として扱わないでください。</p>';
  anchor.insertAdjacentElement("afterend",card);
  const style=document.createElement("style");style.textContent='#cashFlowIntelligence{margin:16px 0;padding:20px}#cashFlowIntelligence .cashflow-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}#cashFlowIntelligence label{display:grid;gap:6px}#cashFlowIntelligence input{max-width:100%;min-width:0;box-sizing:border-box;padding:10px;font-size:16px}#cashFlowIntelligence button{margin:12px 0;padding:10px 16px}#cashFlowIntelligence .cashflow-note{font-size:12px;line-height:1.6;color:#687b78}#cashFlowResults p{margin:8px 0}#cashFlowError{color:#b33}';document.head.appendChild(style);
  document.getElementById("cashFlowSave").addEventListener("click",save);
 }
 function render(){
  ensure();const card=document.getElementById("cashFlowIntelligence");if(!card)return;
  const r=read()[month()]||{},m=calculate(r);
  document.getElementById("cashFlowOpening").value=m.opening??"";
  document.getElementById("cashFlowClosing").value=m.closing??"";document.getElementById("cashFlowEstimate").value=m.estimate??"";
  document.getElementById("cashFlowResults").innerHTML='<p>月間預金増減：<strong>'+(m.actual===null?"未入力":(m.actual>=0?"+":"")+yen(m.actual))+'</strong></p><p>現在の病院預金：<strong>'+(m.closing===null?"未入力":yen(m.closing))+'</strong></p><p>目標まで：<strong>'+(m.gap===null?"確認できません":yen(m.gap))+'</strong></p><p>達成率：<strong>'+(m.progress===null?"確認できません":m.progress.toFixed(1)+"%")+'</strong></p><p>病院キャッシュ利益（推計）：<strong>'+(m.estimate===null?"未入力":yen(m.estimate))+'</strong></p><p>預金増減との差額（未照合）：<strong>'+(m.difference===null?"確認できません":yen(m.difference))+'</strong></p><p>到達予測：<strong>算出不可（継続的な実績が必要）</strong></p><p id="cashFlowAdvice"></p>';
 }
  const advice=document.getElementById("cashFlowAdvice");if(advice)advice.textContent=advise(r);
 }
 function save(){
  const a=document.getElementById("cashFlowOpening").value,b=document.getElementById("cashFlowClosing").value,c=document.getElementById("cashFlowEstimate").value;
  const error=document.getElementById("cashFlowError");
  if((a!==""&&!valid(a))||(b!==""&&!valid(b))||(c!==""&&!Number.isFinite(Number(c)))){error.textContent="残高は0以上、推計値は有効な金額を入力してください。";return}
  const all=read();all[month()]={opening:a===""?null:Number(a),closing:b===""?null:Number(b),estimate:c===""?null:Number(c)};
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
 return {calculate,advise,TARGET};
});
