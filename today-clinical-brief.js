(function(){
 "use strict";
 if(typeof window==="undefined"||typeof document==="undefined")return;

 const id=(name)=>document.getElementById(name);
 const text=(name)=>String(id(name)?.textContent||"").trim();
 const numberFrom=(value)=>{const n=Number(String(value||"").replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0};
 const count=(name)=>numberFrom(text(name));
 const yen=(name)=>numberFrom(text(name));
 const esc=(value)=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));

 function ensureStyles(){
  if(id("todayClinicalBriefStyle"))return;
  const style=document.createElement("style");
  style.id="todayClinicalBriefStyle";
  style.textContent=`
  .today-clinical-brief{margin:14px 0;padding:18px;border:1px solid rgba(0,128,116,.16);border-radius:18px;background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(240,250,248,.98));box-shadow:0 10px 28px rgba(19,71,66,.08)}
  .today-clinical-brief header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.today-clinical-brief h2{margin:2px 0 0;font-size:1.08rem}.today-clinical-brief .brief-eyebrow{display:block;font-size:.69rem;letter-spacing:.12em;font-weight:800;color:#59827e}.today-clinical-brief .brief-date{font-size:.74rem;color:#6c7d7b;white-space:nowrap}.today-clinical-brief .brief-lead{margin:0 0 12px;font-weight:800;line-height:1.65;color:#173d39}.today-clinical-brief .brief-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:0 0 13px}.today-clinical-brief .brief-kpis span{display:flex;flex-direction:column;gap:3px;padding:9px 8px;border-radius:12px;background:rgba(255,255,255,.72);font-size:.68rem;color:#6d7a79}.today-clinical-brief .brief-kpis b{font-size:.89rem;color:#203b38;overflow-wrap:anywhere}.today-clinical-brief .brief-actions{margin:0;padding:0;list-style:none;display:grid;gap:8px}.today-clinical-brief .brief-actions li{position:relative;padding-left:22px;line-height:1.55;color:#304744;font-size:.86rem}.today-clinical-brief .brief-actions li:before{content:'→';position:absolute;left:2px;color:#008f82;font-weight:900}.today-clinical-brief .brief-note{margin:13px 0 0;padding-top:11px;border-top:1px solid rgba(0,128,116,.12);font-size:.78rem;color:#59706d}.today-clinical-brief[data-tone="busy"]{border-color:rgba(198,116,24,.24);background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(255,248,237,.98))}.today-clinical-brief[data-tone="caution"]{border-color:rgba(177,74,60,.22);background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(255,244,242,.98))}
  @media(max-width:620px){.today-clinical-brief{padding:15px}.today-clinical-brief .brief-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.today-clinical-brief header{align-items:center}}
  `;
  document.head.appendChild(style);
 }

 function ensureCard(){
  let card=id("todayClinicalBrief");
  if(card)return card;
  const anchor=id("morningExecutiveBrief")||id("todaySummaryCard");
  if(!anchor?.parentNode)return null;
  card=document.createElement("article");
  card.id="todayClinicalBrief";
  card.className="today-clinical-brief today-primary-card";
  card.setAttribute("aria-labelledby","todayClinicalBriefTitle");
  card.setAttribute("aria-live","polite");
  anchor.parentNode.insertBefore(card,anchor);
  return card;
 }

 function formatDate(){
  const raw=text("todayLabel");
  if(raw)return raw;
  return new Intl.DateTimeFormat("ja-JP",{month:"numeric",day:"numeric",weekday:"short"}).format(new Date());
 }
 function workloadInfo(){
  const main=text("todayWidgetWorkload");
  const sub=text("todayWidgetWorkloadLabel");
  return `${main} ${sub}`.trim();
 }
 function toneFor({score,grade,workload}){
  const s=`${grade} ${workload}`;
  if(/注意|警戒|過負荷|非常に高|逼迫/.test(s)||(score>0&&score<45))return "caution";
  if(/高|混雑|多忙/.test(s))return "busy";
  return "normal";
 }
 function leadFor({sales,patients,score,grade,workload,surgeries}){
  if(!sales&&!patients){
   if(/高|混雑|多忙|逼迫/.test(workload))return "今日は予約負荷が高めです。売上より、診療の流れと待ち時間を優先する日です。";
   if(surgeries>0)return "今日は手術を軸に、外来の詰め込みを避けて安全に回す日です。";
   return "診療開始前です。予約の流れを見ながら、無理に枠を埋めず質を保つ日です。";
  }
  if(score>0&&score<45)return `現時点の診療経営スコアは${score}です。追加件数より、単価・検査・診療負荷のバランスを確認します。`;
  if(/好調|良好/.test(grade))return "今日は良い流れです。件数を追い過ぎず、現在の診療品質を維持するのが最優先です。";
  if(/高|混雑|多忙/.test(workload))return "診療負荷が上がっています。追加予約を増やすより、現在の患者さんに時間を確保する日です。";
  return "今日は大きく攻め過ぎず、売上・来院数・診療内容のバランスを整える日です。";
 }
 function actionsFor(data){
  const actions=[];
  if(!data.sales&&!data.patients)actions.push("午前の予約密度を見て、当日予約を受ける余地を判断する。");
  if(data.surgeries>0)actions.push(`手術${data.surgeries}件あり。処置前後の時間帯は追加外来を詰め込み過ぎない。`);
  if(/高|混雑|多忙|逼迫/.test(data.workload))actions.push("診療負荷が高め。待ち時間とスタッフ負担を優先し、追加予約は慎重にする。");
  else if(data.patients>0&&data.patients<10)actions.push("まだ診療余力あり。健診・再診・当日相談を無理のない範囲で受け入れる。");
  if(data.checkups>0)actions.push(`健診${data.checkups}件。結果説明と次回予約までつなげて再診導線を作る。`);
  if(data.blood+data.imaging>=4)actions.push("検査件数が増えているため、検査説明と会計前の抜け漏れを確認する。");
  if(data.unit>0&&data.unit<9000)actions.push("客単価はやや低め。必要な検査や再診提案が不足していないかだけ確認する。");
  if(data.patients>=15)actions.push("来院数は十分。ここからは件数を追わず、診療の質と終了時刻を優先する。");
  if(!actions.length)actions.push("大きな警戒材料はありません。普段どおりの診療ペースを守る。");
  return actions.slice(0,3);
 }

 function render(){
  ensureStyles();
  const card=ensureCard();
  if(!card)return;
  const data={
   sales:yen("todayHeroSales"),patients:count("todayHeroPatients"),unit:yen("todayHeroUnit"),
   score:numberFrom(text("todayHeroScore")),grade:text("todayHeroGrade"),workload:workloadInfo(),
   preventive:count("todayWidgetPreventive"),checkups:count("todayWidgetCheckups"),surgeries:count("todayWidgetSurgeries"),
   blood:count("todayWidgetBlood"),imaging:count("todayWidgetImaging")
  };
  const tone=toneFor(data),lead=leadFor(data),actions=actionsFor(data);
  card.dataset.tone=tone;
  const workloadLabel=data.workload&&!/^—|算出中/.test(data.workload)?data.workload:"算出中";
  const scoreLabel=data.score?`${data.score} ${data.grade||""}`.trim():(data.grade||"学習中");
  card.innerHTML=`<header><div><span class="brief-eyebrow">KAGEMUSHA MORNING BRIEF</span><h2 id="todayClinicalBriefTitle">🥷 今日の診療ブリーフ</h2></div><span class="brief-date">${esc(formatDate())}</span></header><p class="brief-lead">${esc(lead)}</p><div class="brief-kpis"><span>売上<b>${esc(text("todayHeroSales")||"0円")}</b></span><span>来院<b>${esc(text("todayHeroPatients")||"0件")}</b></span><span>客単価<b>${esc(text("todayHeroUnit")||"0円")}</b></span><span>診療負荷<b>${esc(workloadLabel)}</b></span></div><ul class="brief-actions">${actions.map(a=>`<li>${esc(a)}</li>`).join("")}</ul><p class="brief-note">影武者判断：診療経営スコア ${esc(scoreLabel)}。既存Dashboardの当日データだけを使い、診療方針を短く整理しています。</p>`;
 }

 function scheduleRender(){setTimeout(render,0);setTimeout(render,350)}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",scheduleRender,{once:true});else scheduleRender();
 window.addEventListener("load",scheduleRender,{once:true});
 window.addEventListener("pageshow",scheduleRender);
 window.addEventListener("focus",()=>setTimeout(render,100));
 document.addEventListener("submit",event=>{if(event.target?.id==="todayEntryForm")setTimeout(render,250)},true);
 document.addEventListener("click",event=>{if(event.target?.closest?.("#tabs button,[data-page='today'],#todayHeroEdit,#todaySummaryCard"))setTimeout(render,120)},true);
 window.TodayClinicalBrief={render};
})();
