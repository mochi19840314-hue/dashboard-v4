(()=>{
  "use strict";
  const STORAGE_KEY="keitaDashboardSimpleV1";
  const MONTHLY_TARGET=5000000;
  const iso=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
  const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")||{}}catch{return {}}};
  const businessDay=(date,clinic={})=>{const d=new Date(`${date}T12:00:00`),day=d.getDay();return day!==1&&!(Array.isArray(clinic.closedDates)&&clinic.closedDates.includes(date))};
  const remainingBusinessDays=(today,clinic={})=>{const d=new Date(`${today}T12:00:00`),last=new Date(d.getFullYear(),d.getMonth()+1,0,12);let count=0;for(const cursor=new Date(d);cursor<=last;cursor.setDate(cursor.getDate()+1)){const key=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`;if(businessDay(key,clinic))count++}return count};
  const monthSales=(data,month)=>{
    const entries=Array.isArray(data.entries)?data.entries:[];
    const daily=entries.filter(e=>String(e?.date||"").startsWith(month)).reduce((sum,e)=>sum+(Number(e.sales)||0),0);
    const hist=Number(data.historical?.[month]?.sales)||0;
    const finance=data.financeByMonth?.[month]||{};
    const current=month===iso().slice(0,7)?data.finance||{}:{};
    const ec=["morikuboOnline","royalCanin","purina"].reduce((sum,key)=>sum+(Number(finance[key]??current[key])||0),0);
    return (daily||hist)+ec;
  };
  const build=()=>{
    const data=read(),today=iso(),month=today.slice(0,7),target=Number(data.settings?.[month]?.target)||MONTHLY_TARGET;
    return globalThis.TodayOneAction?.build({today,hour:new Date().getHours(),entries:Array.isArray(data.entries)?data.entries:[],monthlyTarget:target,monthSales:monthSales(data,month),remainingBusinessDays:remainingBusinessDays(today,data.clinic||{})});
  };
  let applying=false;
  const render=()=>{
    if(applying||!globalThis.TodayOneAction)return;
    const text=document.getElementById("todayInsightText"),action=document.getElementById("todayInsightAction");
    if(!text||!action)return;
    const result=build();if(!result)return;
    applying=true;
    try{
      const card=text.closest(".today-insight-widget");const heading=card?.querySelector("h2");if(heading)heading.textContent="今日の一手";
      if(text.textContent!==result.reason)text.textContent=result.reason;
      const next=`→ ${result.action}`;if(action.textContent!==next)action.textContent=next;
      if(card)card.dataset.actionPhase=result.phase||"unknown";
    }finally{applying=false}
  };
  const start=()=>{
    render();
    const card=document.querySelector(".today-insight-widget");if(card&&typeof MutationObserver!=="undefined")new MutationObserver(()=>render()).observe(card,{childList:true,subtree:true,characterData:true});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
    window.addEventListener("focus",render);
    setInterval(render,5*60*1000);
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
