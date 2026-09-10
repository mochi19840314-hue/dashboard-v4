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
