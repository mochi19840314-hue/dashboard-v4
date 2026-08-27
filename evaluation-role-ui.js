(()=>{
  "use strict";
  const STYLE_ID="evaluationRoleUiStyles";
  const addStyles=()=>{if(document.getElementById(STYLE_ID))return;const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
    .today-hero-score .evaluation-role-label{display:inline-flex;align-items:center;gap:.35rem;font-size:.78rem;font-weight:700;color:#0b7f73;background:#e7f5f2;border-radius:999px;padding:.28rem .55rem;margin-bottom:.35rem}
    .today-hero-score .evaluation-role-note{display:block;margin:.45rem 0 .15rem;font-size:.76rem;line-height:1.45;color:#6f7f7d;font-weight:600}
    .phase1-director-heading .evaluation-role-note{display:block;margin-top:.2rem;font-size:.72rem;line-height:1.4;color:#6f7f7d;font-weight:600}
    .phase1-director-heading h3{line-height:1.25}
  `;document.head.appendChild(style)};
  const apply=()=>{
    addStyles();
    const scoreWrap=document.querySelector(".today-hero-score");
    if(scoreWrap){
      const label=scoreWrap.querySelector(":scope > span");
      if(label){label.textContent="総合評価（経営スコア）";label.classList.add("evaluation-role-label")}
      if(!scoreWrap.querySelector(".evaluation-role-note")){
        const note=document.createElement("small");note.className="evaluation-role-note";note.textContent="売上・患者数・客単価・診療内容などを総合評価した今日のトータルスコアです。";scoreWrap.appendChild(note)
      }
    }
    const directorTitle=document.getElementById("phase1DirectorTitle");
    if(directorTitle){directorTitle.textContent="本日の変動（直近比較）";const heading=directorTitle.parentElement;if(heading&&!heading.querySelector(".evaluation-role-note")){const note=document.createElement("small");note.className="evaluation-role-note";note.textContent="直近10営業日平均との比較";heading.appendChild(note)}}
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply();
})();
