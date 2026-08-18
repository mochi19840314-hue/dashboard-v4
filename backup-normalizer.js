(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.BackupRestore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const isObject=value=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
  const definedObject=value=>isObject(value)?Object.fromEntries(Object.entries(value).filter(([,item])=>item!==undefined)):{};
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
    const entries=[source.entries,source.records,source.dailyEntries,source.dailyRecords].find(Array.isArray)||[];
    const financeDefaults=definedObject(defaults.finance);
    const financeByMonth=Object.fromEntries(Object.entries(definedObject(source.financeByMonth)).map(([month,value])=>[month,{...financeDefaults,...definedObject(value)}]));
    const clinicSource=definedObject(source.clinic);
    const clinic={...definedObject(defaults.clinic),...clinicSource,closedDates:Array.isArray(clinicSource.closedDates)?clinicSource.closedDates:[...(defaults.clinic?.closedDates||[])]};
    const kagemushaDiary=[source.kagemushaDiary,outer.kagemushaDiary].find(Array.isArray)||[];
    const strategySource=definedObject(source.strategyMap),strategyMap={updated:typeof strategySource.updated==="string"?strategySource.updated:null,themes:Array.isArray(strategySource.themes)?strategySource.themes:[],priorities:Array.isArray(strategySource.priorities)?strategySource.priorities:[],monthlyHistory:Array.isArray(strategySource.monthlyHistory)?strategySource.monthlyHistory:[]};
    const data={...definedObject(defaults),...definedObject(source),entries,aiRecommendationHistory:Array.isArray(source.aiRecommendationHistory)?source.aiRecommendationHistory:[],successRateHistory:Array.isArray(source.successRateHistory)?source.successRateHistory:[],businessHealthScore:Number(source.businessHealthScore)||0,businessHealthHistory:Array.isArray(source.businessHealthHistory)?source.businessHealthHistory:[],learningHistory:Array.isArray(source.learningHistory)?source.learningHistory:[],weeklyLearningHistory:Array.isArray(source.weeklyLearningHistory)?source.weeklyLearningHistory:[],successLibrary:Array.isArray(source.successLibrary)?source.successLibrary:[],clinicalSnapshots:Array.isArray(source.clinicalSnapshots)?source.clinicalSnapshots:[],successPatterns:Array.isArray(source.successPatterns)?source.successPatterns:[],failurePatterns:Array.isArray(source.failurePatterns)?source.failurePatterns:[],workloadHistory:Array.isArray(source.workloadHistory)?source.workloadHistory:[],dailyLearning:definedObject(source.dailyLearning),successScoreHistory:Array.isArray(source.successScoreHistory)?source.successScoreHistory:[],strategyMap,seasonLearning:Array.isArray(source.seasonLearning)?{patterns:[...source.seasonLearning]}:definedObject(source.seasonLearning),seasonForecast:definedObject(source.seasonForecast),forecastHistory:Array.isArray(source.forecastHistory)?source.forecastHistory:[],forecastModel:definedObject(source.forecastModel),optimizer:definedObject(source.optimizer),optimizerHistory:Array.isArray(source.optimizerHistory)?source.optimizerHistory:[],dailyRecommendation:definedObject(source.dailyRecommendation),optimizerScore:definedObject(source.optimizerScore),coachHistory:Array.isArray(source.coachHistory)?source.coachHistory:[],finance:{...financeDefaults,...definedObject(source.finance)},financeByMonth,monthlyReports:{...definedObject(defaults.monthlyReports),...definedObject(source.monthlyReports)},clinic,weatherCache:source.weatherCache===undefined?defaults.weatherCache:source.weatherCache,historical:{...definedObject(defaults.historical),...definedObject(source.historical)},settings:{...definedObject(defaults.settings),...definedObject(source.settings)},businessSimulator:{...definedObject(defaults.businessSimulator),...definedObject(source.businessSimulator),changes:definedObject(source.businessSimulator?.changes)},simulationHistory:Array.isArray(source.simulationHistory)?source.simulationHistory:[],goalPlanner:{...definedObject(defaults.goalPlanner),...definedObject(source.goalPlanner)},improvementModels:definedObject(source.improvementModels),memo:source.memo===undefined?defaults.memo:source.memo};
    delete data.kagemushaDiary;
    return {data,kagemushaDiary};
  }
  return {normalizeBackup};
});
