(()=>{
  'use strict';
  const STORAGE_KEY='keitaDashboardSimpleV1';
  const CAPACITY_KEY='keitaVetRecruitmentCapacityV1';
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
  const man=value=>value==null?'データ不足':`${Math.round(Number(value)/10000).toLocaleString('ja-JP')}万円`;
  const answer=()=>{
    if(typeof VetRecruitmentSignal==='undefined')return null;
    const result=VetRecruitmentSignal.analyze({data:read(STORAGE_KEY,{}),capacity:read(CAPACITY_KEY,{})});
    const conclusion=result.status.key==='go'?'獣医師増員のGOサインです。':result.status.key==='prepare'?'非常勤獣医師の候補者探しを始めてよい段階です。':'現時点は1人獣医師体制を維持する方が合理的です。';
    const patients=result.patients.average==null?'データ不足':`${result.patients.average.toFixed(1)}件/日`;
    return {result,html:`<h3>結論</h3><p>${conclusion}</p><h3>理由</h3><ul><li>直近3か月平均月商 ${man(result.sales.average)}（${result.parts.sales}/30点）</li><li>平均外来数 ${patients}（${result.parts.patients}/25点）</li><li>予約を断った件数 ${result.pressure.turnedAway}件（${result.parts.booking}/25点）</li><li>オペ・歯科延期 ${result.pressure.deferred}件（${result.parts.deferred}/20点）</li></ul><h3>採用シグナル</h3><p><strong>${result.score}/100｜${result.status.label}</strong></p><h3>次の目安</h3><p>${result.comment}</p>`};
  };
  const install=()=>{
    const quick=document.querySelector('#aiDirectorOverlay .aiDirectorQuick'),message=document.getElementById('aiDirectorMessage');
    if(!quick||!message||document.getElementById('aiDirectorVetRecruitment'))return false;
    const button=document.createElement('button');button.id='aiDirectorVetRecruitment';button.type='button';button.textContent='🩺 獣医師増員は？';
    button.addEventListener('click',()=>{const response=answer();if(response)message.innerHTML=response.html;else message.textContent='採用シグナルを読み込めませんでした。'});
    quick.appendChild(button);return true;
  };
  const start=()=>{
    if(install())return;
    const observer=new MutationObserver(()=>{if(install())observer.disconnect()});observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>{install();observer.disconnect()},5000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
