(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.BackupRestore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const isObject=value=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  const definedObject=value=>isObject(value)?Object.fromEntries(Object.entries(value).filter(([,item])=>item!==undefined)):{};
  const cleanArray=value=>Array.isArray(value)?value.filter(isObject):[];
  const cleanDatedArray=value=>cleanArray(value).filter(item=>typeof item.date==="string"&&item.date.trim()).map(item=>({...definedObject(item),date:item.date.trim()}));
  const cleanObjectMap=value=>Object.fromEntries(Object.entries(definedObject(value)).filter(([,item])=>isObject(item)).map(([key,item])=>[key,definedObject(item)]));
  const mergeObjectMap=(defaults,value)=>{
    const fallback=cleanObjectMap(defaults),source=cleanObjectMap(value);
    return Object.fromEntries([...new Set([...Object.keys(fallback),...Object.keys(source)])].map(key=>[key,{...definedObject(fallback[key]),...definedObject(source[key])}]));
  };
  function unwrapBackup(raw,storageKey){
    if(Array.isArray(raw))return {entries:raw};
    if(!isObject(raw))throw new Error("invalid backup");
    if(isObject(raw.data))return raw.data;
    if(isObject(raw.payload))return raw.payload;
    if(isObject(raw.state))return raw.state;
    if(raw[storageKey]!==undefined){
      const stored=typeof raw[storageKey]==="string"?JSON.parse(raw[storageKey]):raw[storageKey];
      if(!isObject(stored))throw new Error("invalid stored backup");
      return stored;
    }
    return raw;
  }
  function normalizeBackup(raw,defaults,storageKey){
    const source=unwrapBackup(raw,storageKey),outer=isObject(raw)?raw:{};
    const entrySource=[source.entries,source.records,source.dailyEntries,source.dailyRecords].find(Array.isArray)||[];
    const entries=cleanArray(entrySource).map(entry=>({...definedObject(entry),memo:String(entry.memo??entry.note??"")}));
    const financeDefaults=definedObject(defaults.finance);
    const financeByMonth=Object.fromEntries(Object.entries(cleanObjectMap(source.financeByMonth)).map(([month,value])=>[month,{...financeDefaults,...value}]));
    const clinicSource=definedObject(source.clinic);
    const clinic={...definedObject(defaults.clinic),...clinicSource,closedDates:Array.isArray(clinicSource.closedDates)?clinicSource.closedDates.filter(value=>typeof value==="string"):[...(defaults.clinic?.closedDates||[])]};
    const kagemushaDiary=cleanDatedArray([source.kagemushaDiary,outer.kagemushaDiary].find(Array.isArray)||[]);
    const strategySource=definedObject(source.strategyMap),strategyMap={updated:typeof strategySource.updated==="string"?strategySource.updated:null,themes:cleanArray(strategySource.themes),priorities:cleanArray(strategySource.priorities),monthlyHistory:cleanArray(strategySource.monthlyHistory)};
    const businessSimulatorSource=definedObject(source.businessSimulator),goalPlannerSource=definedObject(source.goalPlanner);
    const data={
      ...definedObject(defaults),
      ...definedObject(source),
      entries,
      aiFeedback:definedObject(source.aiFeedback),
      memoLearningHistory:cleanArray(source.memoLearningHistory),
      memoKnowledge:definedObject(source.memoKnowledge),
      memoTrends:cleanArray(source.memoTrends),
      aiRecommendationHistory:cleanArray(source.aiRecommendationHistory),
      successRateHistory:cleanArray(source.successRateHistory),
      businessHealthScore:Number(source.businessHealthScore)||0,
      businessHealthHistory:cleanArray(source.businessHealthHistory),
      learningHistory:cleanArray(source.learningHistory),
      weeklyLearningHistory:cleanArray(source.weeklyLearningHistory),
      successLibrary:cleanArray(source.successLibrary),
      clinicalSnapshots:cleanArray(source.clinicalSnapshots),
      successPatterns:cleanArray(source.successPatterns),
      failurePatterns:cleanArray(source.failurePatterns),
      workloadHistory:cleanArray(source.workloadHistory),
      efficiencyHistory:cleanArray(source.efficiencyHistory),
      dailyLearning:definedObject(source.dailyLearning),
      successScoreHistory:cleanArray(source.successScoreHistory),
      aiCompassLearning:cleanArray(source.aiCompassLearning),
      meetingBrief:definedObject(source.meetingBrief),
      meetingHistory:cleanArray(source.meetingHistory),
      strategyMap,
      seasonLearning:Array.isArray(source.seasonLearning)?{patterns:cleanArray(source.seasonLearning)}:definedObject(source.seasonLearning),
      seasonForecast:definedObject(source.seasonForecast),
      forecastHistory:cleanArray(source.forecastHistory),
      forecastModel:definedObject(source.forecastModel),
      optimizer:definedObject(source.optimizer),
      optimizerHistory:cleanArray(source.optimizerHistory),
      dailyRecommendation:definedObject(source.dailyRecommendation),
      optimizerScore:definedObject(source.optimizerScore),
      coachHistory:cleanArray(source.coachHistory),
      finance:{...financeDefaults,...definedObject(source.finance)},
      financeByMonth,
      cardReceiptsByMonth:mergeObjectMap(defaults.cardReceiptsByMonth,source.cardReceiptsByMonth),
      monthlyReports:mergeObjectMap(defaults.monthlyReports,source.monthlyReports),
      clinic,
      weatherCache:source.weatherCache===undefined?defaults.weatherCache:(isObject(source.weatherCache)||source.weatherCache===null?source.weatherCache:defaults.weatherCache),
      historical:mergeObjectMap(defaults.historical,source.historical),
      settings:mergeObjectMap(defaults.settings,source.settings),
      uiState:{...definedObject(defaults.uiState),...definedObject(source.uiState)},
      meta:{...definedObject(defaults.meta),...definedObject(source.meta)},
      businessSimulator:{...definedObject(defaults.businessSimulator),...businessSimulatorSource,changes:definedObject(businessSimulatorSource.changes)},
      simulationHistory:cleanArray(source.simulationHistory),
      goalPlanner:{...definedObject(defaults.goalPlanner),...goalPlannerSource},
      improvementModels:definedObject(source.improvementModels),
      memo:source.memo===undefined?defaults.memo:String(source.memo??"")
    };
    delete data.kagemushaDiary;
    return {data,kagemushaDiary};
  }
  return {normalizeBackup};
});
