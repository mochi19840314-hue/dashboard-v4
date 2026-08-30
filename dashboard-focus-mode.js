(()=>{
  'use strict';
  const HIDDEN_SELECTORS=[
    '#today .ai-management-brief',
    '#today #managementCompass',
    '#today #businessOptimizerCard',
    '#today #seasonForecastCard',
    '#today #learningInsightCard',
    '#today #weeklyInsightCard',
    '#today #aiAnalysisCard',
    '#today .today-support-grid',
    '#recentActivityHealthDebug'
  ];
  const DYNAMIC_IDS=['clinicalLearningContent','successLibraryItems'];
  const hideElement=element=>{if(element)element.classList.add('dashboard-focus-hidden')};
  const hideDynamic=()=>DYNAMIC_IDS.forEach(id=>{
    const node=document.getElementById(id);if(!node||!node.closest('#today'))return;
    hideElement(node.closest('article,section')||node);
  });
  const injectStyles=()=>{
    if(document.getElementById('dashboardFocusModeStyle'))return;
    const style=document.createElement('style');style.id='dashboardFocusModeStyle';style.textContent=`
      body.dashboard-focus-mode ${HIDDEN_SELECTORS.join(',body.dashboard-focus-mode ')}{display:none!important}
      body.dashboard-focus-mode .dashboard-focus-hidden{display:none!important}
      body.dashboard-focus-mode #today{padding-bottom:18px}
    `;document.head.appendChild(style);
  };
  const apply=()=>{
    injectStyles();document.body.classList.add('dashboard-focus-mode');
    HIDDEN_SELECTORS.forEach(selector=>document.querySelectorAll(selector).forEach(hideElement));
    hideDynamic();
    const details=document.getElementById('morningBriefLinks');if(details)details.querySelectorAll('[data-brief-target="optimizer"]').forEach(button=>button.remove());
  };
  const start=()=>{
    apply();
    const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),8000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
