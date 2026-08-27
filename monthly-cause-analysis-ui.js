"use strict";
(()=>{
 const KEY="keitaDashboardSimpleV1";
 const $=id=>document.getElementById(id);
 const yen=value=>`${Math.round(Number(value)||0).toLocaleString("ja-JP")}円`;
 const signedYen=value=>`${Number(value)>=0?"＋":"−"}${yen(Math.abs(Number(value)||0))}`;
 const signed=value=>`${Number(value)>=0?"＋":"−"}${Math.abs(Number(value)||0).toFixed(1)}`;
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch{return {}}};
 const currentMonth=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`};
 function ensureCard(){
  let card=$("monthlyCauseAnalysisCard");if(card)return card;
  const anchor=document.querySelector(".sales-variance-card");if(!anchor)return null;
  card=document.createElement("article");card.id="monthlyCauseAnalysisCard";card.className="card monthly-cause-analysis-card";card.setAttribute("aria-live","polite");card.innerHTML='<header><div><span class="eyebrow">MONTHLY CAUSE ANALYSIS</span><h3>🧩 月間変動の原因分解</h3><p id="monthlyCauseComparison">比較データを確認しています。</p></div></header><div id="monthlyCauseContent"><p>月次データを分析しています。</p></div>';
  anchor.insertAdjacentElement("afterend",card);
  if(!$("monthlyCauseStyle")){const style=document.createElement("style");style.id="monthlyCauseStyle";style.textContent='.monthly-cause-analysis-card header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.monthly-cause-analysis-card h3{margin:.2rem 0}.monthly-cause-headline{font-size:1.05rem;font-weight:800;margin:.7rem 0 1rem}.monthly-cause-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.monthly-cause-grid article{padding:12px;border:1px solid rgba(0,143,131,.14);border-radius:12px;background:rgba(0,159,145,.04)}.monthly-cause-grid span,.monthly-cause-clinical small{display:block;font-size:.78rem;opacity:.72}.monthly-cause-grid strong{display:block;margin-top:5px;font-size:1.05rem}.monthly-cause-positive strong{color:#087f5b}.monthly-cause-negative strong{color:#b42318}.monthly-cause-profit{margin-top:12px;padding:12px;border-radius:12px;background:rgba(15,23,42,.035)}.monthly-cause-clinical{margin-top:14px}.monthly-cause-clinical ul{margin:.5rem 0 0;padding-left:1.25rem}.monthly-cause-note{margin-top:10px;font-size:.78rem;opacity:.68}@media(max-width:700px){.monthly-cause-grid{grid-template-columns:1fr}}';document.head.appendChild(style)}
  return card;
 }
 function render(){
  const card=ensureCard();if(!card||typeof SalesVarianceAnalysis==="undefined"||typeof MonthlyCauseAnalysis==="undefined")return;
  const data=read(),month=$("reportMonthPicker")?.value||currentMonth(),analysis=SalesVarianceAnalysis.analyze({month,entries:Array.isArray(data.entries)?data.entries:[]}),comparison=$("monthlyCauseComparison"),content=$("monthlyCauseContent");
  if(!analysis||analysis.empty||!analysis.comparison||!analysis.current||!analysis.baseline){comparison.textContent=analysis?.comparison?.text||"比較できる過去データがありません。";content.innerHTML='<p class="sales-variance-empty">比較可能な月次データが揃うと、原因を分解して表示します。</p>';return}
  const cause=MonthlyCauseAnalysis.build({month,current:analysis.current,baseline:analysis.baseline,comparison:analysis.comparison,financeByMonth:data.financeByMonth||{},historical:data.historical||{},currentFinance:data.finance||{},currentMonth:currentMonth()});comparison.textContent=analysis.comparison.text;
  if(!cause.ready){content.innerHTML='<p class="sales-variance-empty">売上構造を分解できるデータが不足しています。</p>';return}
  const bridge=cause.salesBridge.map(item=>`<article class="${item.amount>=0?"monthly-cause-positive":"monthly-cause-negative"}"><span>${item.label}</span><strong>${signedYen(item.amount)}</strong><small>${item.key==="days"?`${item.baseline.toFixed(0)}日 → ${item.current.toFixed(0)}日`:item.key==="unit"?`${yen(item.baseline)} → ${yen(item.current)}`:`${item.baseline.toFixed(1)}件 → ${item.current.toFixed(1)}件`}</small></article>`).join("");
  const clinical=cause.clinical.slice(0,5).map(item=>`<li><strong>${item.label}</strong> ${item.delta>=0?"＋":"−"}${Math.abs(item.delta).toFixed(0)}件${item.rate!==null?`（${signed(item.rate)}%）`:""}</li>`).join("");
  const profit=cause.profit?`<section class="monthly-cause-profit"><strong>利益差への支出影響</strong><p>売上差 ${signedYen(cause.salesDelta)} ／ 支出差 ${signedYen(cause.profit.expenseDelta)} ／ 推定利益差 <b>${signedYen(cause.profit.profitDelta)}</b></p><small>支出は月次入力値を比較しています。</small></section>`:'<section class="monthly-cause-profit"><strong>利益差への支出影響</strong><p>比較可能な支出データが不足しています。</p></section>';
  content.innerHTML=`<p class="monthly-cause-headline">${cause.headline}</p><div class="monthly-cause-grid">${bridge}</div>${profit}<section class="monthly-cause-clinical"><strong>同時に動いた診療構成</strong>${clinical?`<ul>${clinical}</ul>`:'<p>大きな診療構成の変化は検出していません。</p>'}<small>新患・健診・手術・トリミング・検査等は、売上への金額寄与を推定せず関連変化として表示します。</small></section><p class="monthly-cause-note">売上差は「営業日数 × 1営業日あたり患者数 × 客単価」を重複なく分解しています。診療構成との関係は因果関係を示すものではありません。</p>`;
 }
 function init(){ensureCard();render();$("reportMonthPicker")?.addEventListener("change",()=>setTimeout(render,0));const target=$("salesVarianceContent");if(target&&typeof MutationObserver!=="undefined")new MutationObserver(()=>render()).observe(target,{childList:true,subtree:true,characterData:true});window.addEventListener("storage",render)}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
