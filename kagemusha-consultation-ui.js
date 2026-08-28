(()=>{
 "use strict";
 const STORAGE_KEY="keitaDashboardSimpleV1",FEEDBACK_KEY="kagemushaConsultationFeedbackV1";
 const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{}}catch{return {}}};
 const readFeedback=()=>{try{return JSON.parse(localStorage.getItem(FEEDBACK_KEY)||"[]")||[]}catch{return []}};
 const saveFeedback=row=>{try{const all=readFeedback();all.push(row);localStorage.setItem(FEEDBACK_KEY,JSON.stringify(all.slice(-100)))}catch{}};
 const labels={month:"今月の経営",salesCause:"売上の原因",profit:"利益・支出",volumeUnit:"来院数・客単価",clinicalMix:"診療構成",hiring:"採用",investment:"設備投資",vehicle:"大型支出",unknown:"未分類"};
 const render=(output,result)=>{
  output.replaceChildren();output.classList.add("is-visible");
  const meta=document.createElement("div");meta.className="kagemushaConsultMeta";meta.textContent=`Dashboard分析｜${labels[result.intent]||result.intent}`;output.append(meta);
  const h1=document.createElement("h3");h1.textContent="結論";const p1=document.createElement("p");p1.textContent=result.conclusion;output.append(h1,p1);
  const h2=document.createElement("h3");h2.textContent="数字の根拠";const ul=document.createElement("ul");(result.reasons||[]).forEach(x=>{const li=document.createElement("li");li.textContent=x;ul.append(li)});output.append(h2,ul);
  const h3=document.createElement("h3");h3.textContent="次の一手";const p3=document.createElement("p");p3.textContent=result.next;output.append(h3,p3);
  const fb=document.createElement("div");fb.className="kagemushaConsultFeedback";fb.innerHTML='<span>この回答は？</span><button type="button" data-kc-feedback="good">✓ 妥当</button><button type="button" data-kc-feedback="off">△ 違和感</button>';output.append(fb);
  fb.addEventListener("click",e=>{const b=e.target.closest("button[data-kc-feedback]");if(!b)return;saveFeedback({at:new Date().toISOString(),question:result.question,intent:result.intent,handled:result.handled,assessment:b.dataset.kcFeedback});fb.innerHTML=`<span>${b.dataset.kcFeedback==="good"?"評価を記録しました":"違和感を記録しました"}</span>`});
 };
 const injectStyle=()=>{if(document.getElementById("kagemushaConsultationV103Style"))return;const s=document.createElement("style");s.id="kagemushaConsultationV103Style";s.textContent='.kagemushaConsultMeta{display:inline-block;margin:0 0 10px;padding:5px 8px;border-radius:999px;background:#eaf5f1;color:#08705f;font-size:11px;font-weight:800}.kagemushaConsultFeedback{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid #e7eeec}.kagemushaConsultFeedback span{font-size:12px;color:#60716d}.kagemushaConsultFeedback button{border:0;border-radius:10px;padding:8px 10px;background:#edf4f2;color:#08705f;font-weight:800}';document.head.append(s)};
 document.addEventListener("submit",async e=>{
  const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=="aiDirectorConsultationForm")return;
  if(!globalThis.KagemushaConsultationEngine)return;
  e.preventDefault();e.stopImmediatePropagation();
  const input=form.querySelector("#aiDirectorConsultationInput"),output=document.getElementById("aiDirectorConsultationAnswer"),submit=form.querySelector('button[type="submit"]');if(!input?.value.trim()||!output)return;
  injectStyle();submit.disabled=true;submit.textContent="Dashboardを分析中…";
  try{const result=globalThis.KagemushaConsultationEngine.answer(input.value,read());render(output,result);output.scrollIntoView({behavior:"smooth",block:"nearest"})}finally{submit.disabled=false;submit.textContent="相談する"}
 },true);
})();
