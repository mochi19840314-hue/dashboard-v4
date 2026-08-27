"use strict";
(()=>{
 const KEY="keitaDashboardSimpleV1";
 const $=id=>document.getElementById(id);
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch{return {}}};
 const currentMonth=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`};
 const yen=value=>`${Math.round(Number(value)||0).toLocaleString("ja-JP")}円`;
 const dateLabel=date=>{const d=new Date(`${date}T12:00:00`);return Number.isNaN(d.getTime())?date:`${d.getMonth()+1}/${d.getDate()}`};
 function ensureCard(){
  let card=$("workloadEfficiencyCard");if(card)return card;
  const anchor=$("monthlyCauseAnalysisCard")||document.querySelector(".sales-variance-card");if(!anchor)return null;
  card=document.createElement("article");card.id="workloadEfficiencyCard";card.className="card workload-efficiency-card";card.setAttribute("aria-live","polite");
  card.innerHTML='<header><div><span class="eyebrow">WORKLOAD × REVENUE EFFICIENCY</span><h3>⚖️ 診療負荷と売上効率</h3><p id="workloadEfficiencyPeriod">保存済み日次データを確認しています。</p></div></header><div id="workloadEfficiencyContent"><p>診療負荷を分析しています。</p></div>';
  anchor.insertAdjacentElement("afterend",card);
  if(!$("workloadEfficiencyStyle")){const style=document.createElement("style");style.id="workloadEfficiencyStyle";style.textContent='.workload-efficiency-card h3{margin:.2rem 0}.workload-efficiency-headline{font-size:1.05rem;font-weight:800;margin:.7rem 0 1rem}.workload-efficiency-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.workload-efficiency-kpis article{padding:12px;border:1px solid rgba(0,143,131,.14);border-radius:12px;background:rgba(0,159,145,.04)}.workload-efficiency-kpis span{display:block;font-size:.78rem;opacity:.72}.workload-efficiency-kpis strong{display:block;margin-top:5px;font-size:1.05rem}.workload-efficiency-panels{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.workload-efficiency-panel{padding:12px;border-radius:12px;background:rgba(15,23,42,.035)}.workload-efficiency-panel h4{margin:0 0 6px}.workload-efficiency-panel p{margin:.3rem 0}.workload-efficiency-good strong{color:#087f5b}.workload-efficiency-warn strong{color:#b42318}.workload-efficiency-list{margin:.5rem 0 0;padding-left:1.25rem}.workload-efficiency-note{margin-top:10px;font-size:.78rem;opacity:.68}@media(max-width:700px){.workload-efficiency-kpis,.workload-efficiency-panels{grid-template-columns:1fr}}';document.head.appendChild(style)}
  return card;
 }
 function rowText(row){return `${dateLabel(row.date)}：${row.patients}件・売上${yen(row.sales)}・負荷${Math.round(row.workload)}pt・売上/負荷pt ${yen(row.salesPerLoad)}`}
 function render(){
  const card=ensureCard(),period=$("workloadEfficiencyPeriod"),content=$("workloadEfficiencyContent");if(!card||!period||!content)return;
  const month=$("reportMonthPicker")?.value||currentMonth(),data=read();period.textContent=`${Number(month.slice(0,4))}年${Number(month.slice(5))}月`;
  if(typeof WorkloadEfficiencyAnalysis==="undefined"||typeof ClinicalLearningEngine==="undefined"){content.innerHTML='<p class="sales-variance-empty">診療負荷分析モジュールを読み込んでいます。</p>';return}
  const result=WorkloadEfficiencyAnalysis.analyze({month,entries:Array.isArray(data.entries)?data.entries:[],workloadResolver:source=>ClinicalLearningEngine.calculateWorkload(source)});
  if(!result.ready){content.innerHTML=`<p class="sales-variance-empty">${result.reason}</p>`;return}
  const highAvg=result.highLoadEfficiency===null?"—":yen(result.highLoadEfficiency),normalAvg=result.normalEfficiency===null?"—":yen(result.normalEfficiency);
  const good=result.efficientDays.slice(0,3),warn=result.lowReturnDays.slice(0,3);
  content.innerHTML=`<p class="workload-efficiency-headline">${result.headline}</p><div class="workload-efficiency-kpis"><article><span>高負荷日</span><strong>${result.highLoadDays.length}日 / ${result.rows.length}日</strong><small>21件超 または 負荷80pt超</small></article><article><span>月内中央値 売上/負荷pt</span><strong>${yen(result.baseline.salesPerLoad)}</strong><small>利益ではなく運営効率の参考値</small></article><article><span>高負荷日 vs 通常負荷日</span><strong>${highAvg} / ${normalAvg}</strong><small>1負荷ptあたり売上</small></article></div><div class="workload-efficiency-panels"><section class="workload-efficiency-panel workload-efficiency-good"><h4>✓ 負荷を抑えて効率が高かった日</h4>${good.length?`<ul class="workload-efficiency-list">${good.map(row=>`<li><strong>${rowText(row)}</strong></li>`).join("")}</ul>`:'<p>月内中央値を10%以上上回る明確な低〜通常負荷日はありません。</p>'}</section><section class="workload-efficiency-panel workload-efficiency-warn"><h4>⚠ 高負荷なのに効率が低かった日</h4>${warn.length?`<ul class="workload-efficiency-list">${warn.map(row=>`<li><strong>${rowText(row)}</strong></li>`).join("")}</ul>`:'<p>高負荷かつ売上/負荷ptが中央値を10%以上下回る日はありません。</p>'}</section></div><p class="workload-efficiency-note">${result.notes.join(" ")} 症例の重症度や医学的必要性を評価する指標ではなく、診療体制と経営負荷を振り返るための参考値です。</p>`;
 }
 function init(){ensureCard();render();$("reportMonthPicker")?.addEventListener("change",()=>setTimeout(render,0));const target=$("monthlyCauseContent")||$("salesVarianceContent");if(target&&typeof MutationObserver!=="undefined")new MutationObserver(()=>render()).observe(target,{childList:true,subtree:true,characterData:true});window.addEventListener("storage",render)}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
