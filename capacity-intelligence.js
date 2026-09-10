(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.CapacityIntelligence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const DEFAULT_WEIGHTS={
    patients:1.0,
    bloodTests:0.25,
    imaging:0.35,
    checkups:0.50,
    secondOpinions:0.50,
    surgeries:2.0,
    trimming:0.35,
    preventive:0.10
  };
  const DEFAULT_CAPACITY_POINTS=22;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const value=v=>Math.max(0,Number(v)||0);

  function normalizeInput(input={}){
    return {
      patients:value(input.patients),
      bloodTests:value(input.bloodTests),
      imaging:value(input.imaging),
      checkups:value(input.checkups),
      secondOpinions:value(input.secondOpinions),
      surgeries:value(input.surgeries),
      trimming:value(input.trimming),
      preventive:value(input.preventive)
    };
  }

  function statusFor(percent){
    const p=value(percent);
    if(p<55)return {key:"spare",label:"余力あり"};
    if(p<80)return {key:"appropriate",label:"適正"};
    if(p<100)return {key:"high",label:"やや高負荷"};
    return {key:"over",label:"高負荷"};
  }

  function evaluate(input={},options={}){
    const metrics=normalizeInput(input);
    const weights={...DEFAULT_WEIGHTS,...(options.weights||{})};
    const capacityPoints=Math.max(1,value(options.capacityPoints)||DEFAULT_CAPACITY_POINTS);
    const contributions={};
    let points=0;
    Object.keys(DEFAULT_WEIGHTS).forEach(key=>{
      const contribution=metrics[key]*value(weights[key]);
      contributions[key]=Number(contribution.toFixed(2));
      points+=contribution;
    });
    points=Number(points.toFixed(2));
    const percent=Math.round(points/capacityPoints*100);
    const status=statusFor(percent);
    const ranked=Object.entries(contributions)
      .map(([key,contribution])=>({key,contribution}))
      .filter(item=>item.contribution>0)
      .sort((a,b)=>b.contribution-a.contribution);
    return {
      points,
      percent,
      boundedPercent:clamp(percent,0,200),
      status,
      capacityPoints,
      contributions,
      dominantFactors:ranked.slice(0,3),
      metrics,
      weights
    };
  }

  return {DEFAULT_WEIGHTS,DEFAULT_CAPACITY_POINTS,normalizeInput,statusFor,evaluate};
});

(function(root){
  "use strict";
  if(typeof document==="undefined"||!root?.CapacityIntelligence)return;
  const STORAGE_KEY="keitaDashboardSimpleV1";
  const METRICS=["bloodTests","imaging","checkups","secondOpinions","surgeries","trimming","preventive"];

  function localDate(){
    const d=new Date();
    return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  }

  function readData(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}
    catch{return {}}
  }

  function metricValue(entry,metric){
    if(root.TodayClinicalCounts?.value)return root.TodayClinicalCounts.value(entry,metric);
    const clinical=entry?.clinical||{};
    if(metric==="imaging")return Math.max(0,Number(clinical.xrays)||0)+Math.max(0,Number(clinical.ultrasounds)||0);
    if(["surgeries","trimming","checkups","secondOpinions"].includes(metric))return Math.max(0,Number(entry?.[metric])||0);
    return Math.max(0,Number(clinical[metric])||0);
  }

  function evaluateToday(){
    const data=readData(),date=localDate(),entry=Array.isArray(data.entries)?data.entries.find(item=>item?.date===date):null;
    if(!entry)return null;
    const input={patients:Math.max(0,Number(entry.patients)||0)};
    METRICS.forEach(metric=>input[metric]=metricValue(entry,metric));
    return root.CapacityIntelligence.evaluate(input);
  }

  function render(){
    const valueEl=document.getElementById("todayWidgetWorkload"),labelEl=document.getElementById("todayWidgetWorkloadLabel");
    if(!valueEl||!labelEl)return;
    const result=evaluateToday();
    if(!result){valueEl.textContent="—";labelEl.textContent="算出中";valueEl.removeAttribute("title");return}
    valueEl.textContent=`${result.percent}%`;
    labelEl.textContent=result.status.label;
    valueEl.title=`負荷ポイント ${result.points} / ${result.capacityPoints}`;
    valueEl.dataset.capacityStatus=result.status.key;
  }

  function setup(){
    render();
    const form=document.getElementById("todayEntryForm");
    if(form&&!form.dataset.capacityBound){
      form.dataset.capacityBound="1";
      form.addEventListener("submit",()=>setTimeout(render,0));
    }
    document.querySelector('[data-page="today"]')?.addEventListener("click",()=>setTimeout(render,0));
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)render()});
    window.addEventListener("focus",render);
    root.CapacityIntelligence.renderToday=render;
    root.CapacityIntelligence.evaluateToday=evaluateToday;
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});
  else setup();
})(typeof globalThis!=="undefined"?globalThis:this);
