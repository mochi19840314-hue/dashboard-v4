
function generateKagemushaGreeting({hour,patients=0,sales=0,profitRate=0,progress=0,hasProfitData=false}){
 const value=v=>Math.max(0,Number(v)||0);
 const formatYen=v=>`${Math.round(value(v)).toLocaleString("ja-JP")}円`;
 const formatPct=v=>`${value(v).toFixed(1)}%`;
 const h=Number(hour);
 const greeting=h>=5&&h<12?"おはようございます":h>=12&&h<18?"こんにちは":h>=18&&h<24?"こんばんは":"お疲れさまです";
 const patientComment=value(patients)>0?`今日の来院は${value(patients)}件`:`今日の来院件数はまだ未入力`;
 const salesComment=value(sales)>0?`売上は${formatYen(sales)}`:`売上はまだ未入力`;
 const profitComment=hasProfitData?`利益率は${formatPct(profitRate)}`:"利益率は支出入力後に確定";
 const progressComment=`目標達成率は${formatPct(progress)}`;
 const analysis=value(progress)>=100?"目標を達成した安定した推移です":hasProfitData&&value(profitRate)>=30?"利益を保ちながら着実に積み上がっています":"現在地が分かると、次の一手も冷静に選べます";
 return `${greeting}、先生。私が数字を確認します。${patientComment}、${salesComment}、${profitComment}、${progressComment}です。${analysis}。今日も一歩ずつ、前向きに進んでいきましょう。`;
}

function getKagemushaMood({patients=0,sales=0,profitRate=0,progress=0,hasProfitData=false}){
 if(!(Number(patients)>0)||!(Number(sales)>0))return "thinking";
 if(Number(progress)>=100)return "smile";
 if(hasProfitData&&Number(profitRate)<10)return "warning";
 return "normal";
}

(()=>{"use strict";
const KEY="keitaDashboardSimpleV1";
const KAGEMUSHA_DIARY_KEY="kagemushaDiaryV1";
const USE_KAGEMUSHA_IMAGES=true;
const KAGEMUSHA_MESSAGES={
 normal:["先生、数字は安定しています。私なら今の流れを維持します。","先生、私なら今日は大きく方針を変えません。数字を静かに見ておきます。","先生、今は落ち着いた推移です。最終判断は先生にお任せします。"],
 smile:["先生、目標に届きました。積み重ねの結果です。","先生、数字は良好です。今日は素直に評価してよいと思います。","先生、目標達成です。私なら守りながら次の一手を考えます。"],
 thinking:["先生、まだ判断材料が揃っていません。今日の数字が入れば正確に見られます。","先生、今日の実績は未入力です。私なら今は結論を急ぎません。","先生、数字を待っているところです。揃ってから冷静に判断しましょう。"],
 warning:["先生、少し慎重に見たい数字です。私なら支出と利益率を確認します。","先生、利益率に注意したい状態です。焦らず原因だけ確認しておきたいです。","先生、数字は否定しません。私なら支出の内訳を一度見直します。"]
};
const PAGE_IDS=["today","month","report","year","finance","simulator","memo","settings","data"];
const reducedMotion=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scoreAnimations=new WeakMap();
function setScoreRingValue(ring,value,property,number){
 const target=Math.max(0,Math.min(100,Number(value)||0));ring.style.setProperty(property,target);ring.dataset.animatedValue=target;if(number)number.textContent=value==null?"—":String(Math.round(target));
}
function animateScoreRing(ring,value,property,number){
 if(!ring)return;const target=Math.max(0,Math.min(100,Number(value)||0)),start=Number(ring.dataset.animatedValue)||0,existing=scoreAnimations.get(ring),finalText=value==null?"—":String(Math.round(target));
 if(existing)cancelAnimationFrame(existing);
 if(reducedMotion()||ring.dataset.animatedValue!==undefined&&start===target){ring.style.setProperty(property,target);ring.dataset.animatedValue=target;if(number)number.textContent=finalText;scoreAnimations.delete(ring);return}
 const began=performance.now(),duration=800,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 const frame=now=>{const progress=Math.min(1,(now-began)/duration),current=start+(target-start)*ease(progress);ring.style.setProperty(property,current);if(number)number.textContent=value==null?"—":String(Math.round(current));ring.dataset.animatedValue=current;if(progress<1)scoreAnimations.set(ring,requestAnimationFrame(frame));else{ring.style.setProperty(property,target);ring.dataset.animatedValue=target;if(number)number.textContent=finalText;scoreAnimations.delete(ring)}};
 scoreAnimations.set(ring,requestAnimationFrame(frame));
}
const insightScoreViewport={active:false,visible:false,played:false,pending:false,target:null,observer:null};
function showInsightScoreImmediately(){setScoreRingValue($("insightScoreRing"),insightScoreViewport.target,"--insight-score",$("insightScore"))}
function playInsightScore(){
 if(!insightScoreViewport.active||!insightScoreViewport.visible)return;
 insightScoreViewport.played=true;insightScoreViewport.pending=false;animateScoreRing($("insightScoreRing"),insightScoreViewport.target,"--insight-score",$("insightScore"));
}
function updateInsightScore(value){
 insightScoreViewport.target=value;insightScoreViewport.pending=true;
 if(reducedMotion()){insightScoreViewport.pending=false;showInsightScoreImmediately();return}
 if(insightScoreViewport.active&&insightScoreViewport.visible)playInsightScore();
}
function deactivateInsightScore(){
 const ring=$("insightScoreRing"),animation=ring&&scoreAnimations.get(ring);if(animation)cancelAnimationFrame(animation);if(ring)scoreAnimations.delete(ring);
 insightScoreViewport.observer?.disconnect();insightScoreViewport.active=false;insightScoreViewport.visible=false;insightScoreViewport.played=false;insightScoreViewport.pending=false;
}
function activateInsightScore(){
 const ring=$("insightScoreRing");if(!ring||insightScoreViewport.active)return;
 insightScoreViewport.active=true;insightScoreViewport.visible=false;insightScoreViewport.played=false;
 if(reducedMotion()){showInsightScoreImmediately();return}
 setScoreRingValue(ring,0,"--insight-score",$("insightScore"));
 if(typeof IntersectionObserver==="undefined"){insightScoreViewport.visible=true;playInsightScore();return}
 if(!insightScoreViewport.observer)insightScoreViewport.observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.target!==ring)return;
  insightScoreViewport.visible=entry.isIntersecting&&entry.intersectionRatio>=.25&&Boolean(ring.closest(".page.active"));
  if(insightScoreViewport.visible&&(!insightScoreViewport.played||insightScoreViewport.pending))playInsightScore();
 }),{threshold:.25});
 insightScoreViewport.observer.observe(ring);
}
function openOverlay(modal){if(!modal)return;modal.hidden=false;modal.classList.remove("is-closing");requestAnimationFrame(()=>modal.classList.add("is-open"))}
function closeOverlay(modal){if(!modal||modal.hidden)return;if(reducedMotion()){modal.hidden=true;modal.classList.remove("is-open","is-closing");return}modal.classList.remove("is-open");modal.classList.add("is-closing");setTimeout(()=>{modal.hidden=true;modal.classList.remove("is-closing")},200)}
const MONTHLY_TARGET=5000000;
const HISTORICAL={
  "2026-01":{sales:3442266,expense:3268225},
  "2026-02":{sales:3222540,expense:3235228},
  "2026-03":{sales:4034046,expense:3426718},
  "2026-04":{sales:5635647,expense:3761329},
  "2026-05":{sales:4973297,expense:3746638},
  "2026-06":{sales:4727145,expense:3666032}
};
const DEFAULT_CLINIC={fullDayTarget:180000,saturdayTarget:100000,fullDayPatients:17.5,saturdayPatients:9,closedDates:[]};
const base={entries:[],memoLearningHistory:[],memoKnowledge:{keywords:[],sampleCount:0},memoTrends:[],aiRecommendationHistory:[],successRateHistory:[],learningHistory:[],weeklyLearningHistory:[],successLibrary:[],clinicalSnapshots:[],successPatterns:[],failurePatterns:[],workloadHistory:[],dailyLearning:{},successScoreHistory:[],businessHealthScore:0,businessHealthHistory:[],meetingBrief:{},meetingHistory:[],strategyMap:{updated:null,themes:[],priorities:[],monthlyHistory:[]},seasonLearning:{},seasonForecast:{},forecastHistory:[],forecastModel:{},optimizer:{},optimizerHistory:[],dailyRecommendation:{},optimizerScore:{},coachHistory:[],businessSimulator:{changes:{}},simulationHistory:[],goalPlanner:{annualProfit:20000000},improvementModels:{},settings:{},weatherCache:null,uiState:{analysisExpanded:false},meta:{lastUpdated:null},finance:{balance:0,monthlyExpense:0,personnelExpense:0,medicalExpense:0,cardFee:0,loan:0,repayment:0,incomeTarget:0,morikuboOnline:0,royalCanin:0,purina:0},financeByMonth:{},monthlyReports:{},historical:{...HISTORICAL},clinic:{...DEFAULT_CLINIC},memo:""};
let data=load(),memoTimer;
let kagemushaCommentSignature="",kagemushaCommentTimer;
const $=id=>document.getElementById(id),num=id=>Math.max(0,Number($(id).value)||0);
const CLINICAL_INPUTS={bloodTests:"clinicalBloodTests",xrays:"clinicalXrays",ultrasounds:"clinicalUltrasounds",preventive:"clinicalPreventive"};
function clinicalFromForm(){return ClinicalData.normalizeClinical(Object.fromEntries(Object.entries(CLINICAL_INPUTS).map(([key,id])=>[key,$(id).value.trim()===""?null:$(id).value])))}
function clinicalFromFormMerged(existing={}){const raw=Object.fromEntries(Object.entries(CLINICAL_INPUTS).map(([key,id])=>{const value=$(id).value.trim();return [key,value===""?existing?.[key]??null:value]}));return ClinicalData.normalizeClinical(raw)}
function fillClinicalForm(value){const clinical=ClinicalData.normalizeClinical(value??{});Object.entries(CLINICAL_INPUTS).forEach(([key,id])=>$(id).value=clinical[key]??"");renderClinicalConsistencyWarning()}
function renderClinicalConsistencyWarning(){const warning=$("clinicalConsistencyWarning"),patientsRaw=$("patients").value.trim(),newPatientsRaw=$("newPatients").value.trim();if(warning)warning.hidden=!(patientsRaw!==""&&newPatientsRaw!==""&&Number(newPatientsRaw)>Number(patientsRaw))}
function stepClinicalInput(input,delta){const raw=input.value.trim(),current=raw===""?0:Number(raw),next=Math.min(99,Math.max(0,(Number.isFinite(current)?Math.trunc(current):0)+delta));input.value=String(next);input.dispatchEvent(new Event("input",{bubbles:true}))}
function clampClinicalInput(input){if(input.value.trim()==="")return;const value=Number(input.value);input.value=String(Number.isFinite(value)?Math.min(99,Math.max(0,Math.trunc(value))):0)}
function setupClinicalSteppers(){document.querySelectorAll("[data-clinical-step]").forEach(button=>button.onclick=()=>stepClinicalInput($(button.dataset.target),Number(button.dataset.clinicalStep)));Object.values(CLINICAL_INPUTS).forEach(id=>$(id).addEventListener("change",()=>clampClinicalInput($(id))))}
function getClinicalRates(entry){return ClinicalData.getClinicalRates(entry)}
const yen=v=>`${Math.round(Number(v)||0).toLocaleString("ja-JP")}円`,pct=v=>`${(Number(v)||0).toFixed(1)}%`;
const formatUpdated=v=>{if(!v)return "未記録";const d=new Date(v);return Number.isNaN(d.getTime())?"未記録":new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(d)};
const iso=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const monthNow=()=>iso().slice(0,7);
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||"{}"),settings={...(raw.settings||{})};Object.keys(settings).forEach(m=>{if(!settings[m].target||settings[m].target===4500000)settings[m].target=MONTHLY_TARGET});return {...base,...raw,settings,uiState:{...base.uiState,...(raw.uiState||{}),analysisExpanded:raw.uiState?.analysisExpanded===true},meta:{...base.meta,...(raw.meta||{})},meetingBrief:MorningExecutiveBrief.normalizeBrief(raw.meetingBrief),meetingHistory:MorningExecutiveBrief.normalizeHistory(raw.meetingHistory),strategyMap:StrategyMap.normalize(raw.strategyMap),finance:{...base.finance,...(raw.finance||{})},businessSimulator:{...base.businessSimulator,...(raw.businessSimulator||{}),changes:{...(raw.businessSimulator?.changes||{})}},simulationHistory:Array.isArray(raw.simulationHistory)?raw.simulationHistory:[],goalPlanner:{...base.goalPlanner,...(raw.goalPlanner||{})},improvementModels:{...(raw.improvementModels||{})},financeByMonth:{...(raw.financeByMonth||{})},monthlyReports:{...(raw.monthlyReports||{})},historical:{...HISTORICAL,...(raw.historical||{})},clinic:{...DEFAULT_CLINIC,...(raw.clinic||{}),closedDates:Array.isArray(raw.clinic?.closedDates)?raw.clinic.closedDates:[]},entries:(Array.isArray(raw.entries)?raw.entries:[]).map(entry=>DailyMemoLearning.normalizeEntry(entry)),memoLearningHistory:Array.isArray(raw.memoLearningHistory)?raw.memoLearningHistory:[],memoKnowledge:raw.memoKnowledge&&typeof raw.memoKnowledge==="object"?raw.memoKnowledge:{keywords:[],sampleCount:0},memoTrends:Array.isArray(raw.memoTrends)?raw.memoTrends:[],learningHistory:LearningInsights.normalizeHistory(raw.learningHistory),weeklyLearningHistory:WeeklyInsights.normalizeHistory(raw.weeklyLearningHistory),successLibrary:(typeof KnowledgeCore!=="undefined"?KnowledgeCore:SuccessLibrary).normalize(raw.successLibrary),seasonLearning:SeasonForecast.normalizeLearning(raw.seasonLearning),seasonForecast:SeasonForecast.normalizeForecast(raw.seasonForecast),forecastHistory:SeasonForecast.normalizeHistory(raw.forecastHistory)}}catch{return structuredClone(base)}}
function save(){data.meta={...(data.meta||{}),lastUpdated:new Date().toISOString()};localStorage.setItem(KEY,JSON.stringify(data));storage()}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout($("toast").t);$("toast").t=setTimeout(()=>$("toast").classList.remove("show"),1600)}
function currentProfitRate(){const s=monthSummary(monthNow());return s.sales&&s.expense?(s.sales-s.expense)/s.sales*100:null}
function preview(){const s=num("sales"),p=num("patients"),efficiency=ClinicalEfficiency.evaluate({patients:p,sales:s,profitRate:currentProfitRate()});$("todaySales").textContent=yen(s);$("todayPatients").textContent=`${p}件`;$("todayUnit").textContent=yen(p?s/p:0);$("todayNew").textContent=`${num("newPatients")}件`;$("todayEfficiency").textContent=p||s?efficiency.grade:"—";$("todayEfficiencyScore").textContent=p||s?`${efficiency.score}点・4指標で総合評価`:"4指標で総合評価";renderDailyReview()}
const WEATHER_CODES={0:["快晴","☀️"],1:["晴れ","🌤️"],2:["一部曇り","⛅"],3:["曇り","☁️"],45:["霧","🌫️"],48:["霧","🌫️"],51:["弱い霧雨","🌦️"],53:["霧雨","🌦️"],55:["強い霧雨","🌧️"],61:["小雨","🌦️"],63:["雨","🌧️"],65:["強い雨","🌧️"],71:["小雪","🌨️"],73:["雪","🌨️"],75:["大雪","❄️"],80:["にわか雨","🌦️"],81:["にわか雨","🌧️"],82:["激しいにわか雨","⛈️"],95:["雷雨","⛈️"],96:["雷雨・ひょう","⛈️"],99:["強い雷雨・ひょう","⛈️"]};
function showWeather(w,offline=false){
  if(!w)return;
  $("weatherIcon").textContent=w.icon||"🌤️";
  $("weatherTemp").textContent=`${Math.round(Number(w.temperature)||0)}°`;
  $("weatherCondition").textContent=w.condition+(offline?"（保存値）":"");
  $("weatherRain").textContent=`${Math.round(Number(w.rainProbability)||0)}%`;
  renderDailyReview();
}
async function fetchWeather(force=false){
  const cached=data.weatherCache,age=cached?Date.now()-Number(cached.fetchedAt||0):Infinity;
  if(!force&&cached&&age<30*60*1000){showWeather(cached);return}
  try{
    $("weatherCondition").textContent="天気を取得中";
    const url="https://api.open-meteo.com/v1/forecast?latitude=35.544&longitude=139.570&current=temperature_2m,weather_code,precipitation,rain,showers&hourly=precipitation_probability&daily=weather_code,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=1";
    const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("weather");
    const j=await r.json(),code=Number(j.current?.weather_code||0),desc=WEATHER_CODES[code]||["天気","🌤️"];
    const times=Array.isArray(j.hourly?.time)?j.hourly.time:[],probs=Array.isArray(j.hourly?.precipitation_probability)?j.hourly.precipitation_probability:[];
    const currentIso=String(j.current?.time||"");
    const currentMs=new Date(currentIso).getTime();
    let hourIndex=times.length?times.reduce((best,t,i)=>Math.abs(new Date(t).getTime()-currentMs)<Math.abs(new Date(times[best]).getTime()-currentMs)?i:best,0):-1;
    const nextProb=hourIndex>=0?Math.max(...probs.slice(hourIndex,Math.min(probs.length,hourIndex+2)).map(v=>Number(v)||0)):0;
    const currentRain=(Number(j.current?.precipitation)||0)+(Number(j.current?.rain)||0)+(Number(j.current?.showers)||0);
    const rainProbability=currentRain>0?Math.max(80,nextProb):nextProb;
    const dailyCode=Number(j.daily?.weather_code?.[0]??code),dailyDesc=WEATHER_CODES[dailyCode]||desc;
    const w={condition:desc[0],icon:desc[1],temperature:Number(j.current?.temperature_2m)||0,rainProbability,code,currentRain,dailyCondition:dailyDesc[0],dailyCode,dailyRainMax:Number(j.daily?.precipitation_probability_max?.[0])||0,fetchedAt:Date.now()};
    data.weatherCache=w;save();showWeather(w);
  }catch(e){
    if(cached)showWeather(cached,true);else{$("weatherIcon").textContent="—";$("weatherTemp").textContent="--°";$("weatherCondition").textContent="取得できません";$("weatherRain").textContent="--%"}
  }
}
function renderTodaySummary(){const today=iso(),e=data.entries.find(x=>x.date===today)||{sales:0,patients:0,newPatients:0},patients=Number(e.patients)||0,newPatients=Number(e.newPatients)||0,newPatientRate=patients?Math.max(0,Math.min(100,newPatients/patients*100)):0,profit=Number(e.profitRate),imaging=Number(e.clinical?.xrays||0)+Number(e.clinical?.ultrasounds||0);$("todaySales").textContent=yen(e.sales);$("todayPatients").textContent=`${patients}件`;$("todayUnit").textContent=yen(patients?e.sales/patients:0);$("todayNew").textContent=`${newPatients}件`;$("todaySummarySales").textContent=yen(e.sales);$("todaySummaryPatients").textContent=`${patients}件`;$("todaySummaryUnit").textContent=yen(patients?e.sales/patients:0);$("todaySummaryProfit").textContent=Number.isFinite(profit)?`${profit.toFixed(1)}%`:"—";$("todaySummaryNew").textContent=`${newPatients}件`;$("todaySummaryNewRate").textContent=`${Math.round(newPatientRate)}%`;$("todaySummaryImaging").textContent=`${imaging}件`;$("todaySummaryStatus").textContent=e.date?"✓ 入力済":"✏ 入力"}
function activityDateLabel(date){const value=new Date(`${date}T00:00:00`),weekday=value.toLocaleDateString("ja-JP",{weekday:"short"});return `${value.getMonth()+1}/${value.getDate()}(${weekday})`}
const RECENT_ACTIVITY_HEALTH_DEBUG=true;
let recentActivityHealthDiagnostics=[];
function healthDebugValue(value){if(value===null)return "null";if(value===undefined)return "undefined";if(typeof value==="object")return "[object]";return String(value)}
function recentHealthInputDiagnostics(entry,entries){
 const month=entry.date.slice(0,7),normalizedEntries=DateRanges.normalizedEntriesForCalendarMonth(entries,month).filter(item=>item.date<=entry.date),monthOperatingEntries=operatingEntries(normalizedEntries),allOperatingEntries=operatingEntries(entries.filter(item=>item.date<=entry.date));
 return {month,normalizedEntriesCount:normalizedEntries.length,operatingEntriesCount:monthOperatingEntries.length,businessDays:new Set(allOperatingEntries.map(item=>item.date)).size,financeAvailable:Boolean(data.financeByMonth?.[month]),historicalAvailable:Boolean(data.historical?.[month]),snapshotAvailable:Array.isArray(data.clinicalSnapshots)&&data.clinicalSnapshots.some(item=>String(item?.date||"")<=entry.date),successPatternAvailable:Array.isArray(data.successPatterns)&&data.successPatterns.some(item=>!item?.date||String(item.date)<=entry.date)};
}
function recentActivityRows(){
 const entries=(data.entries||[]).map(entry=>{const date=DateRanges.normalizeEntryDate(entry);return date?{...entry,date}:null}).filter(Boolean),diagnostics=new Map();
 const rows=RecentActivity.rows(entries,{closedDates:data.clinic?.closedDates,healthHistory:data.businessHealthHistory,calculateHealth:entry=>{
  const diagnostic={date:entry.date,healthResult:"returned",score:null,previewScore:null,selectedHealth:null,calculateHealthResult:null,errorName:null,errorMessage:null,sales:entry.sales??null,patients:entry.patients??null,profitRate:entry.profitRate??null,hasClinical:Boolean(entry.clinical),hasClinicalSnapshot:Boolean(entry.clinicalSnapshot),hasFinance:Boolean(entry.finance),hasHistorical:Boolean(entry.historical),entryKeys:Object.keys(entry).sort()};
  try{Object.assign(diagnostic,recentHealthInputDiagnostics(entry,entries))}catch(error){diagnostic.inputDiagnosticError=`${error?.name||"Error"}: ${error?.message||String(error)}`}
  try{const health=calculateBusinessHealth(entry.date,entries),selectedHealth=health?.score??health?.previewScore??null;Object.assign(diagnostic,{score:health?.score??null,previewScore:health?.previewScore??null,selectedHealth,calculateHealthResult:selectedHealth});diagnostics.set(entry.date,diagnostic);return selectedHealth}catch(error){Object.assign(diagnostic,{healthResult:"error",errorName:error?.name||"Error",errorMessage:error?.message||String(error)});diagnostics.set(entry.date,diagnostic);console.warn("[Recent Activity Health Failed]",{date:entry.date,errorName:diagnostic.errorName,errorMessage:diagnostic.errorMessage,error});return null}
 }});
 recentActivityHealthDiagnostics=rows.map(row=>({...diagnostics.get(row.date),rowHealth:row.health}));return rows;
}
function renderRecentActivityHealthDebug(){
 const details=$("recentActivityHealthDebug"),content=$("recentActivityHealthDebugContent");if(!details||!content)return;details.hidden=!RECENT_ACTIVITY_HEALTH_DEBUG;if(!RECENT_ACTIVITY_HEALTH_DEBUG)return;
 content.className="recent-activity-health-debug-content";content.innerHTML=recentActivityHealthDiagnostics.map(item=>`<section class="recent-health-debug-entry"><strong>${escapeHtml(item.date)}</strong>${[["result",item.healthResult],["score",item.score],["previewScore",item.previewScore],["selectedHealth",item.selectedHealth],["calculateHealth result",item.calculateHealthResult],["RecentActivity row.health",item.rowHealth],["error name",item.errorName],["error message",item.errorMessage],["sales",item.sales],["patients",item.patients],["profitRate",item.profitRate],["hasClinical",item.hasClinical],["hasClinicalSnapshot",item.hasClinicalSnapshot],["hasFinance",item.hasFinance],["hasHistorical",item.hasHistorical],["entry keys",item.entryKeys?.join(", ")],["month",item.month],["normalizedEntries count",item.normalizedEntriesCount],["operatingEntries count",item.operatingEntriesCount],["businessDays",item.businessDays],["finance available",item.financeAvailable],["historical available",item.historicalAvailable],["snapshot available",item.snapshotAvailable],["successPattern available",item.successPatternAvailable],["input diagnostic error",item.inputDiagnosticError]].map(([label,value])=>`<span>${escapeHtml(label)}: ${escapeHtml(healthDebugValue(value))}</span>`).join("")}</section>`).join("");
}
function closeActivitySummary(){const modal=$("activitySummaryModal");if(!modal||modal.hidden)return;modal.hidden=true;document.body.classList.remove("activity-summary-open")}
function openActivitySummary(date){const row=recentActivityRows().find(item=>item.date===date);if(!row)return;$("activitySummaryDate").textContent=activityDateLabel(row.date);$("activitySummaryContent").innerHTML=`<div class="activity-summary-grid"><section><span>売上</span><strong>${yen(row.sales)}</strong></section><section><span>患者数</span><strong>${row.patients}件</strong></section><section><span>新患</span><strong>${row.newPatients}件</strong></section><section><span>再診</span><strong>${row.revisits}件</strong></section><section><span>画像検査</span><strong>${row.imaging}件</strong></section><section><span>健診</span><strong>${row.checkups}件</strong></section><section><span>利益率</span><strong>${row.profitRate==null?"－":`${row.profitRate.toFixed(1)}%`}</strong></section><section><span>Business Health</span><strong>${row.health==null?"－":row.health}</strong></section></div><p class="activity-ai-comment"><strong>AIコメント</strong>${escapeHtml(row.aiComment||"この日のAIコメントはありません。")}</p><p class="activity-memo"><strong>今日のメモ</strong>${row.memo?escapeHtml(row.memo):"記録なし"}</p>`;$("activitySummaryModal").hidden=false;document.body.classList.add("activity-summary-open");$("closeActivitySummary").focus()}
function renderRecentActivity(){const list=$("recentActivityList");if(!list)return;const rows=recentActivityRows();list.innerHTML=rows.length?rows.map(row=>`<button class="recent-activity-row" type="button" data-activity-date="${row.date}" aria-label="${activityDateLabel(row.date)}のToday Summaryを表示"><span class="activity-date">${activityDateLabel(row.date)}</span><span>売上 ${yen(row.sales)}</span><span>${row.patients}件</span><span>客単価 ${yen(row.unitPrice)}</span><span>利益率 ${row.profitRate==null?"－":`${row.profitRate.toFixed(1)}%`}</span><span>Health ${row.health??"－"}</span></button>`).join(""):'<p class="recent-activity-empty">営業日の履歴はまだありません。</p>';list.querySelectorAll("[data-activity-date]").forEach(button=>button.onclick=()=>openActivitySummary(button.dataset.activityDate));renderRecentActivityHealthDebug()}
function setupRecentActivity(){const modal=$("activitySummaryModal");$("closeActivitySummary").onclick=closeActivitySummary;modal.onclick=event=>{if(event.target===modal)closeActivitySummary()}}
const TODAY_ENTRY_FIELDS={sales:"todayEntrySales",patients:"todayEntryPatients",newPatients:"todayEntryNewPatients",checkups:"todayEntryCheckups",surgeries:"todayEntrySurgeries",trimming:"todayEntryTrimming"};
function closeTodayEntry(){const modal=$("todayEntryModal");if(!modal||modal.hidden)return;closeOverlay(modal);document.body.classList.remove("today-entry-open");$("todaySummaryCard")?.focus()}
function openTodayEntry(){const entry=data.entries.find(item=>item.date===iso());Object.entries(TODAY_ENTRY_FIELDS).forEach(([key,id])=>$(id).value=entry?.[key]??(key==="trimming"?0:""));$("todayEntryMemo").value=entry?.memo??entry?.note??"";$("todayEntryMemoCount").textContent=`${$("todayEntryMemo").value.length} / 500`;$("todayEntryMemoPanel").hidden=true;$("todayEntryMemoToggle").setAttribute("aria-expanded","false");const patients=Number(entry?.patients)||0,newPatients=Number(entry?.newPatients)||0;$("todayEntryRevisits").value=entry?Math.max(0,patients-newPatients):"";$("todayEntryImaging").value=entry?Number(entry.clinical?.xrays||0)+Number(entry.clinical?.ultrasounds||0):"";$("todayEntryBloodTests").value=entry?.clinical?.bloodTests??"";const profit=Number(entry?.profitRate);$("todayEntryProfitRate").value=Number.isFinite(profit)?`${profit.toFixed(1)}%`:"—";$("todayEntryError").hidden=true;document.body.classList.add("today-entry-open");openOverlay($("todayEntryModal"));setTimeout(()=>$("todayEntrySales").focus(),0)}
function todayModalNumber(id){const raw=$(id).value.trim();return raw===""?0:Number(raw)}
function saveTodayEntry(event){event.preventDefault();const inputs=[...$("todayEntryForm").querySelectorAll('input[type="number"]')],invalid=inputs.some(input=>input.value!==""&&(!Number.isFinite(Number(input.value))||Number(input.value)<0));if(invalid){$("todayEntryError").textContent="0以上の数値を入力してください。";$("todayEntryError").hidden=false;return}const date=iso(),index=data.entries.findIndex(item=>item.date===date),existing=index>=0?data.entries[index]:{},patients=todayModalNumber("todayEntryPatients"),newPatients=Math.min(patients,todayModalNumber("todayEntryNewPatients")),entry={...existing,date,memo:DailyMemoLearning.clean($("todayEntryMemo").value),sales:todayModalNumber("todayEntrySales"),patients,newPatients,checkups:todayModalNumber("todayEntryCheckups"),surgeries:todayModalNumber("todayEntrySurgeries"),trimming:todayModalNumber("todayEntryTrimming"),clinical:{...(existing.clinical||{}),xrays:todayModalNumber("todayEntryImaging"),ultrasounds:0,bloodTests:todayModalNumber("todayEntryBloodTests")}};entry.note=entry.memo;if(index>=0)data.entries[index]=entry;else data.entries.push(entry);data.entries.sort((a,b)=>a.date.localeCompare(b.date));const rate=currentProfitRate();if(rate==null)delete entry.profitRate;else entry.profitRate=rate;learnClinicalEntry(entry,new Date().getHours()>=18);save();closeTodayEntry();render();toast(index>=0?"今日の診療実績を更新しました":"今日の診療実績を保存しました")}
function setupTodayEntry(){const card=$("todaySummaryCard"),modal=$("todayEntryModal"),patients=$("todayEntryPatients"),newPatients=$("todayEntryNewPatients"),revisits=$("todayEntryRevisits");card.onclick=openTodayEntry;card.onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openTodayEntry()}};$("closeTodayEntry").onclick=closeTodayEntry;$("cancelTodayEntry").onclick=closeTodayEntry;modal.onclick=event=>{if(event.target===modal)closeTodayEntry()};$("todayEntryForm").onsubmit=saveTodayEntry;$("todayEntryMemoToggle").onclick=()=>{const panel=$("todayEntryMemoPanel"),expanded=panel.hidden;panel.hidden=!expanded;$("todayEntryMemoToggle").setAttribute("aria-expanded",String(expanded));if(expanded)$("todayEntryMemo").focus()};const syncRevisits=()=>{if(patients.value===""&&newPatients.value==="")revisits.value="";else revisits.value=String(Math.max(0,todayModalNumber("todayEntryPatients")-todayModalNumber("todayEntryNewPatients")))};patients.addEventListener("input",syncRevisits);newPatients.addEventListener("input",syncRevisits);revisits.addEventListener("input",()=>{if(revisits.value!==""&&patients.value!=="")newPatients.value=String(Math.max(0,todayModalNumber("todayEntryPatients")-todayModalNumber("todayEntryRevisits")))});$("todayEntryMemo").addEventListener("input",event=>$("todayEntryMemoCount").textContent=`${event.target.value.length} / 500`)}
function renderDailyShadowBrief(){
 const emptyMessage=globalThis?.DailyShadowBrief?.EMPTY||"今日はまだ分析できるデータがありません。";
 const showEmpty=()=>{try{const list=$("dailyShadowInsights");if(list)list.innerHTML=`<li data-confidence="high">${emptyMessage}</li>`}catch(error){console.error(error)}};
 try{
  const list=$("dailyShadowInsights");if(!list)return;
  const todayDate=iso(),month=todayDate.slice(0,7),setting=data?.settings?.[month]??{},summary=monthSummary(month),elapsed=operatingEntries(summary.entries.filter(entry=>entry.date<todayDate)).length,total=Number(setting.businessDays)||expectedBusinessDays(month),remainingBusinessDays=Math.max(0,total-elapsed);
  const builder=globalThis?.DailyShadowBrief?.buildDailyShadowActions;if(typeof builder!=="function"){showEmpty();return}
  let anomalies=[];try{if(typeof BusinessAnomalies!=="undefined")anomalies=BusinessAnomalies.detectBusinessAnomalies(data,{today:todayDate,hour:new Date().getHours()})}catch(error){console.error(error)}
  let clinicalAnalysis=null;try{if(typeof ClinicalIntelligence!=="undefined")clinicalAnalysis=ClinicalIntelligence.analyze(data?.entries??[],{closedDates:data?.clinic?.closedDates??[]})}catch(error){console.error(error)}
  const todayInput=data.entries.find(entry=>entry.date===todayDate),themes=KnowledgeCore.getTopThemes(data.successLibrary,{limit:3});
  const coreInsights=themes.map(item=>({title:item.theme,category:"knowledge-core",level:item.trend==="down"?"warning":"normal",message:todayInput?`${item.comment||item.theme+"の傾向"} 今日の入力と照合しました。`:`${item.theme}を確認するには、今日の実績を入力してください。`}));
  const insights=coreInsights.length?coreInsights:builder({today:todayDate,entries:Array.isArray(data?.entries)?data.entries:[],clinicalAnalysis,monthlyTarget:Number(setting.target)||MONTHLY_TARGET,remainingBusinessDays,clinic:data?.clinic??{},anomalies});
  if(!Array.isArray(insights)||!insights.length){showEmpty();return}
  const emphasize=text=>escapeHtml(text).replace(/([↑↓+-]?\s*\d[\d,.]*(?:\.\d+)?(?:円|万円|件|%|営業日)?)/g,"<strong>$1</strong>");
  list.innerHTML=insights.map((item,index)=>`<li style="--brief-delay:${index*120}ms" data-level="${item.level||"normal"}" data-category="${item.category||""}"><span class="daily-shadow-marker" aria-hidden="true">${item.category==="goal"?"🎯":item.level==="danger"?"🔴":item.level==="warning"?"🟡":item.level==="good"?"✨":`${index+1}`}</span><div><h4>${index+1}. ${escapeHtml(item.title||"")}</h4><p>${emphasize(item.message||emptyMessage)}</p></div></li>`).join("");
 }catch(error){console.error(error);showEmpty()}
}
function managementCompassReadiness(result){
 const businessDays=Math.max(0,Math.floor(Number(result?.sampleDays)||0)),requiredDays=Math.max(1,Math.floor(Number(result?.requiredDays)||15));
 const hasProposal=Boolean(result?.ready&&Array.isArray(result.missions)&&result.missions[0]&&Array.isArray(result.missions[0].actions)&&result.missions[0].actions.length);
 return {businessDays,requiredDays,hasProposal,isLearning:!hasProposal&&businessDays<requiredDays};
}
function renderRecommendationOutcome(){
 const box=$("recommendationOutcome"),report=$("aiSuccessRates");if(typeof AIRecommendationOutcomes==="undefined")return;const today=iso(),entry=data.entries.find(x=>x.date===today),profit=entry?.profitRate??0,snapshot=AIRecommendationOutcomes.snapshot(entry||{},profit);
 if(entry){const evaluated=AIRecommendationOutcomes.evaluate({history:data.aiRecommendationHistory,today,result:snapshot,isClosed:date=>clinicDayInfo(date).type==="closed",successLibrary:data.successLibrary,successPatterns:data.successPatterns,failurePatterns:data.failurePatterns,knowledgeCore:KnowledgeCore});if(evaluated.saved){Object.assign(data,{aiRecommendationHistory:evaluated.history,successRateHistory:evaluated.successRateHistory,successLibrary:evaluated.successLibrary,successPatterns:evaluated.successPatterns,failurePatterns:evaluated.failurePatterns});save()}}
 const last=[...(data.aiRecommendationHistory||[])].filter(x=>x.evaluated).sort((a,b)=>b.evaluatedDate.localeCompare(a.evaluatedDate))[0],rate=(data.successRateHistory||[]).find(x=>x.recommendationType===last?.recommendationType);if(box){box.hidden=!last;if(last){const deltas=Object.entries(last.changes||{}).filter(([,v])=>v.improved).slice(0,2).map(([key,v])=>`<span>${{averageUnit:"客単価",profitRate:"利益率",imageRate:"画像検査率",checkupRate:"健診率",revisitRate:"再診率",surgeryRate:"手術率",bloodRate:"血液検査率"}[key]||key} ${v.change>=0?"+":""}${v.change}%</span>`).join("");box.innerHTML=`<small>昨日の提案結果</small><strong>${escapeHtml(last.title)}　${last.success?"成功":"効果なし"}</strong><div>${deltas}<span>成功率 ${rate?.successRate||0}%</span></div><p>${last.success?`昨日の${escapeHtml(last.title)}提案は成果につながりました。今後も優先度を高めます。`:"昨日の提案では十分な改善は確認できませんでした。別の施策を検討します。"}</p>`}}
 if(report){const rates=AIRecommendationOutcomes.rates(data.aiRecommendationHistory),total=rates.reduce((s,x)=>s+x.total,0),wins=rates.reduce((s,x)=>s+x.successes,0);report.innerHTML=`<strong>総成功率 ${total?Math.round(wins/total*100):0}%</strong>${rates.slice(0,5).map(x=>`<span>${escapeHtml(x.title)} ${x.successRate}%</span>`).join("")||"<span>評価データを蓄積中</span>"}`}
}
function processRecommendationOutcome(strategy){if(typeof AIRecommendationOutcomes==="undefined"||!strategy?.ready)return;const today=iso(),entry=data.entries.find(x=>x.date===today);if(!entry)return;const saved=AIRecommendationOutcomes.saveAtNight({history:data.aiRecommendationHistory,date:today,hour:new Date().getHours(),recommendation:{title:strategy.title,message:strategy.reason},baseline:AIRecommendationOutcomes.snapshot(entry,entry.profitRate)});if(saved.saved){data.aiRecommendationHistory=saved.history;save()}}
function renderManagementCompass(result){
 const content=$("managementCompassContent"),status=$("managementCompassStatus");if(!content||!result)return;const readiness=managementCompassReadiness(result);status.textContent=result.closed?"休診日":readiness.hasProposal?(result.isTomorrow?"明日の候補":"今日の1件"):readiness.isLearning?"学習中":"分析中";
 if(result.closed){content.innerHTML='<p class="compass-empty">本日は休診日です。必要な確認だけ行いましょう。</p>';return}
 if(readiness.isLearning){content.innerHTML=`<p class="compass-empty">学習中（${readiness.businessDays}/${readiness.requiredDays}営業日）です。昨日までの記録を続けてください。</p>`;return}
 if(!readiness.hasProposal){content.innerHTML=`<p class="compass-empty">${readiness.businessDays>=readiness.requiredDays?"現在も診療データを分析中です。":`学習中（${readiness.businessDays}/${readiness.requiredDays}営業日）です。昨日までの記録を続けてください。`}</p>`;return}
 processRecommendationOutcome(result);
 const mission=result.missions[0];
 content.innerHTML=`<p class="compass-analysis">${readiness.businessDays}営業日のデータから分析しています。</p><section class="compass-priority"><h4>${result.isTomorrow?"明日の候補":"今日の最優先"}</h4><strong>${escapeHtml(result.title||result.theme)}</strong></section><section><h4>Mission</h4><ul>${mission.actions.slice(0,3).map(action=>`<li>${escapeHtml(action)}</li>`).join("")}</ul></section><section class="compass-reason"><h4>理由</h4><p>${escapeHtml(result.reason)}</p></section>${result.next?`<section class="compass-next"><h4>次点</h4><strong>${escapeHtml(result.next.title)}</strong></section>`:""}`;
}
function updateDailyMemoLearning(){const result=DailyMemoLearning.learnAtNight({entries:data.entries,history:data.memoLearningHistory,today:iso(),hour:new Date().getHours()});data.memoKnowledge=result.knowledge;data.memoTrends=result.trends;if(result.saved){data.memoLearningHistory=result.history;const candidates=result.knowledge.keywords.map(item=>({id:`memo:${item.key}`,theme:item.label,confidence:Math.min(5,Math.max(1,item.count)),score:Math.min(100,item.count*10),count:item.count,firstSeen:result.record.date,lastSeen:result.record.date,comment:`今日のメモで${item.count}回記録`,category:"daily-memo"}));data.successLibrary=KnowledgeCore.update(data.successLibrary,candidates);save()}}
function renderLearningInsight(){
 updateDailyMemoLearning();
 const text=$("learningInsightText");if(!text||typeof LearningInsights==="undefined")return;
 const today=iso(),night=LearningInsights.learnAtNight({entries:data.entries,history:data.learningHistory,today,hour:new Date().getHours()});
 if(night.saved){data.learningHistory=night.history;const item=night.record;if(item?.key&&item.key!=="learning")data.successLibrary=KnowledgeCore.learn(data.successLibrary,{id:item.key.split(":")[0],theme:SuccessLibrary.THEMES[item.key.split(":")[0]]||item.key,confidence:3,importance:Math.abs(Number(item.difference)||1),count:1,firstSeen:item.date,lastSeen:item.date,metrics:{[item.key.split(":")[1]]:Math.round(Number(item.difference)||0)},comment:item.result,category:"recent-learning"});save()}
 const insight=LearningInsights.displayed({entries:data.entries,history:data.learningHistory,today});text.textContent=insight.text||LearningInsights.EMPTY;
}
function renderSeasonForecast(){
 const content=$("seasonForecastContent"),status=$("seasonForecastStatus");if(!content||typeof SeasonForecast==="undefined")return;
 const options={entries:data.entries,today:iso(),hour:new Date().getHours(),weather:data.weatherCache,seasonLearning:data.seasonLearning,seasonForecast:data.seasonForecast,forecastHistory:data.forecastHistory,strategyMap:data.strategyMap,successLibrary:data.successLibrary,learningHistory:data.learningHistory,weeklyLearningHistory:data.weeklyLearningHistory,clinic:data.clinic},night=SeasonForecast.updateAtNight(options);
 if(night.saved){data.seasonLearning=night.seasonLearning;data.seasonForecast=night.seasonForecast;data.forecastHistory=night.forecastHistory;save()}
 const current=night.saved?night.seasonForecast:SeasonForecast.build(options).forecast,items=current.items||[];
 if(!current.ready||!items.length){const remaining=Math.max(0,(current.requiredSamples||SeasonForecast.MIN_SAMPLES)-(current.sampleCount||0));status.textContent="学習中";content.innerHTML=remaining?`<p class="season-forecast-empty">現在学習中です。<br>あと<strong>${remaining}営業日</strong>で<br>季節分析を開始します。</p>`:`<p class="season-forecast-empty">${escapeHtml(current.message||"現在は十分な季節データがありません。")}</p>`;return}
 status.textContent=`${items.length}件`;content.innerHTML=`<div class="season-forecast-items">${items.map((item,index)=>`<section class="season-forecast-item"><div class="season-forecast-summary"><small>予測 ${index+1}</small><strong>${escapeHtml(item.label)}</strong><span>信頼度 <b>${item.confidence}%</b></span></div><p>${escapeHtml(item.reason)}</p><ul>${item.preparation.slice(0,3).map(action=>`<li>${escapeHtml(action)}</li>`).join("")}</ul></section>`).join("")}</div><footer>${escapeHtml(current.comment)}</footer>`;
}
function renderBusinessOptimizer(){
 const content=$("businessOptimizerContent"),status=$("businessOptimizerStatus");if(!content||typeof BusinessOptimizer==="undefined")return;const today=iso(),hour=new Date().getHours(),summary=monthSummary(monthNow()),options={...data,entries:data.entries,today,hour,monthlySummary:{sales:summary.sales,expense:summary.expense,profitRate:summary.sales?(summary.sales-summary.expense)/summary.sales*100:0}},night=BusinessOptimizer.updateAtNight(options);
 if(night.saved){data.optimizer=night.optimizer;data.dailyRecommendation=night.dailyRecommendation;data.optimizerScore=night.optimizerScore;data.optimizerHistory=night.optimizerHistory;save()}
 let current=night.saved?night.dailyRecommendation:data.dailyRecommendation;if(!current?.date||current.date!==today)current=BusinessOptimizer.build(options);
 if(hour>=18){const learned=BusinessOptimizer.learnOutcome({recommendation:current,entries:data.entries,today,optimizerHistory:data.optimizerHistory,successLibrary:data.successLibrary,improvementModels:data.improvementModels});if(learned.saved){data.optimizerHistory=learned.optimizerHistory;data.successLibrary=KnowledgeCore.normalize(learned.successLibrary);data.improvementModels=learned.improvementModels;save()}}
 const health=calculateBusinessHealth(),priority=new Set((health.opportunities||[]).slice(0,3).map(item=>item.key));
 const rankedCandidates=typeof AIRecommendationOutcomes!=="undefined"?AIRecommendationOutcomes.rank(current.candidates||[],data.successRateHistory):current.candidates||[];
 const items=rankedCandidates.filter(item=>priority.has(item.key)||item.key==="revisit").slice(0,3);if(!current.ready||!items.length){const remaining=Math.max(0,(current.requiredSamples||BusinessOptimizer.MIN_SAMPLES)-(current.sampleCount||0));status.textContent="学習中";content.innerHTML=`<p class="optimizer-empty">現在学習中です。<br>あと<strong>${remaining}営業日</strong>で最適化を開始します。</p>`;return}
 const primary=items[0],stars="★".repeat(primary.stars),baseScore=health.score??health.previewScore;status.textContent="90点への改善案";content.innerHTML=`<div class="optimizer-main"><section><small>今日の最優先</small><strong>${escapeHtml(primary.label)}</strong><span class="optimizer-stars stars-${primary.stars}" aria-label="AI評価 ${primary.stars}/5">${stars}</span></section><dl><div><dt>期待利益</dt><dd>＋${yen(primary.expectedProfit)}</dd></div><div><dt>指数予測</dt><dd>${Math.min(100,baseScore+2)}点</dd></div></dl></div><p class="optimizer-reason"><b>理由</b> AI経営指数を90点へ近付けます。${escapeHtml(primary.reason)}</p><ul class="optimizer-actions">${primary.actions.map(action=>`<li>${escapeHtml(action)}</li>`).join("")}</ul><ol class="optimizer-ranking">${items.map((item,index)=>`<li><b>${escapeHtml(item.label)}</b><span>あと${index+1}件 ↓ ${Math.min(100,baseScore+2+index*2)}点</span></li>`).join("")}</ol>`;
}

function calculateBusinessHealth(asOf=iso(),rawEntries=data.entries){
 const month=asOf.slice(0,7),normalized=(Array.isArray(rawEntries)?rawEntries:[]).map(entry=>{const date=DateRanges.normalizeEntryDate(entry);return date?{...entry,date}:null}).filter(entry=>entry&&entry.date<=asOf),monthEntries=operatingEntries(DateRanges.normalizedEntriesForCalendarMonth(normalized,month).filter(entry=>entry.date<=asOf)),daily=sum(monthEntries),hist=data.historical?.[month]||{},finance=data.financeByMonth?.[month]||{},clinicalSales=daily.sales||Number(hist.sales)||0,sales=clinicalSales+Number(finance.morikuboOnline||0)+Number(finance.royalCanin||0)+Number(finance.purina||0),expense=Number(finance.monthlyExpense??hist.expense??0)||0,patients=Number(daily.patients)||0,unitPrice=patients?sales/patients:0;
 const entries=operatingEntries(normalized),previous=normalized.filter(entry=>entry.date<`${month}-01`&&Number(entry.patients)>0),normalUnitPrice=previous.length?previous.reduce((total,entry)=>total+Number(entry.sales)/Number(entry.patients),0)/previous.length:unitPrice;
 const snapshot=(Array.isArray(data.clinicalSnapshots)?data.clinicalSnapshots:[]).filter(item=>String(item?.date||"")<=asOf).sort((a,b)=>String(a?.date||"").localeCompare(String(b?.date||""))).at(-1)||{},repeat=monthEntries.reduce((total,entry)=>total+Math.max(0,Number(entry.repeatPatients??(Number(entry.patients)-Number(entry.newPatients)))||0),0),pattern=(Array.isArray(data.successPatterns)?data.successPatterns:[]).filter(item=>!item?.date||String(item.date)<=asOf).at(-1),successPatternMatch=Number(snapshot.successScore)||Number(pattern?.score)||0,target=Number(data.settings?.[month]?.target)||MONTHLY_TARGET;
 return BusinessHealthScore.calculate({businessDays:new Set(entries.map(entry=>entry.date)).size,profitRate:sales?(sales-expense)/sales*100:0,salesAchievement:sales/target*100,unitPrice,normalUnitPrice,revisitRate:patients?repeat/patients*100:0,doctorWorkload:Number(snapshot.doctorWorkload)||100,successPatternMatch});
}
function renderBusinessHealth(){
 const calculated=calculateBusinessHealth(),card=$("businessHealthCard"),content=$("businessHealthContent"),detail=$("businessHealthDetail"),closed=clinicDayInfo(iso()).type==="closed",history=BusinessHealthScore.normalizeHistory(data.businessHealthHistory),result=BusinessHealthScore.displayScore(calculated,history,iso(),closed);card.dataset.tone=result.ready?result.grade.tone:"learning";
 if(!result.ready){content.innerHTML=`<span class="health-learning-status"><b>学習中</b><strong>${result.businessDays} / ${result.requiredDays}営業日</strong><small>あと${result.remainingDays}営業日</small></span>`;detail.innerHTML='<p>必要営業日のデータが揃うと、経営指標の詳細を表示します。</p>'}
 else{const previous=history.filter(item=>item.date<(result.asOf||iso())).at(-1)?.score??result.score,monthStats=BusinessHealthScore.summary(history,monthNow()),delta=result.score-previous,statusDot={excellent:"🟢",good:"🟢",stable:"🟡",attention:"🟠",action:"🔴"}[result.grade.tone];content.innerHTML=`<span class="health-score-line"><strong>${result.score}<small>点</small></strong><b>${statusDot} ${result.grade.label}</b></span><span class="health-meta"><span>前日比 <b>${delta>=0?"+":""}${delta}</b></span><span>今月平均 <b>${monthStats.average??"—"}</b></span>${closed?'<em>休診日・前営業日時点</em>':""}</span>`;const metrics=calculated.metrics;detail.innerHTML=`<h3>経営指標の詳細</h3><dl class="health-detail-metrics"><div><dt>利益率</dt><dd>${Number(metrics.profitRate).toFixed(1)}%</dd></div><div><dt>売上達成率</dt><dd>${Number(metrics.salesAchievement).toFixed(1)}%</dd></div><div><dt>客単価</dt><dd>${yen(metrics.unitPrice)}</dd></div><div><dt>再診率</dt><dd>${Number(metrics.revisitRate).toFixed(1)}%</dd></div><div><dt>診療負荷</dt><dd>${Math.round(Number(metrics.doctorWorkload))}</dd></div><div><dt>Success Pattern一致率</dt><dd>${Math.round(Number(metrics.successPatternMatch))}%</dd></div></dl><section class="health-opportunities"><h3>改善余地 TOP3</h3><ol>${calculated.opportunities.slice(0,3).map(item=>`<li>${escapeHtml(item.label)}</li>`).join("")}</ol></section>`}
 const hasToday=data.entries.some(entry=>entry.date===iso())&&!closed;if(hasToday){const next=BusinessHealthScore.updateHistory(data.businessHealthHistory,calculated,iso());if(JSON.stringify(next)!==JSON.stringify(data.businessHealthHistory)){data.businessHealthHistory=next;data.businessHealthScore=calculated.score;save()}}renderBusinessHealthReports(calculated)
}
function getManagementScoreForDailyEntry(entry,month,calculate=calcManagementScore){
 const result=calculate({...entry,entries:[entry]},month);
 if(typeof result==="number")return result;
 return result&&Number.isFinite(result.score)?result.score:null;
}
function getNormalizedMonthlyEntries(selectedMonth,rawEntries=data.entries){
 const monthlyEntries=DateRanges.normalizedEntriesForCalendarMonth(rawEntries,selectedMonth);
 console.log("[Monthly Data Debug]",{selectedMonth,rawCount:rawEntries.length,normalizedCount:monthlyEntries.length,rawDates:rawEntries.map(x=>x?.date),normalizedDates:monthlyEntries.map(x=>x.date)});
 return monthlyEntries;
}
function monthlyManagementScoreStats(month,monthlyEntries,calculate=calcManagementScore){
 const entries=[...monthlyEntries].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 const scoredEntries=entries.map(entry=>{
  let score=null;
  try{score=getManagementScoreForDailyEntry(entry,month,calculate)}catch(error){console.warn("[Monthly AI Score Failed]",{date:entry.date,entry,error});return null}
  if(!Number.isFinite(score)){console.warn("[Monthly AI Score Failed]",{date:entry.date,entry});return null}
  return {date:entry.date,score};
 }).filter(Boolean),scores=scoredEntries.map(item=>item.score);
 console.log("[Monthly AI Debug]",{monthlyEntriesCount:entries.length,scoredEntriesCount:scoredEntries.length,scoredEntries});
 if(!scores.length)return {count:0,average:null,highest:null,lowest:null,improvement:null};
 return {count:scores.length,average:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),highest:Math.max(...scores),lowest:Math.min(...scores),improvement:scores.length>=2?scores.at(-1)-scores[0]:null};
}
function renderMonthlyManagementScore(month,rawEntries){
 const monthlyEntries=getNormalizedMonthlyEntries(month,rawEntries),monthStats=monthlyManagementScoreStats(month,monthlyEntries),monthly=$("businessHealthMonthReport");
 if(!monthly)return monthlyEntries;
 const improvement=monthStats.improvement===null?"—":monthStats.improvement===0?"±0点":`${monthStats.improvement>0?"+":""}${monthStats.improvement}点`;
 monthly.innerHTML=`<span class="eyebrow">AI経営指数・月間レポート</span><div class="health-summary"><div><small>平均</small><strong>${monthStats.average??"—"}点</strong></div><div><small>最高</small><strong>${monthStats.highest??"—"}点</strong></div><div><small>最低</small><strong>${monthStats.lowest??"—"}点</strong></div><div><small>今月改善</small><strong>${improvement}</strong></div></div>`;
 return monthlyEntries;
}
function renderBusinessHealthReports(){
 const yearValue=$("yearPicker")?.value||String(new Date().getFullYear()),rows=BusinessHealthScore.normalizeHistory(data.businessHealthHistory).filter(item=>item.date.startsWith(yearValue)),stats=BusinessHealthScore.summary(rows),statsEl=$("businessHealthYearStats"),chart=$("businessHealthYearChart");if(!statsEl||!chart)return;
 statsEl.innerHTML=`<div><small>平均</small><strong>${stats.average??"—"}点</strong></div><div><small>最高</small><strong>${stats.highest??"—"}点</strong></div><div><small>最低</small><strong>${stats.lowest??"—"}点</strong></div>`;
 if(!rows.length){chart.innerHTML='<p class="chart-empty">指数データを学習中です。</p>';return}const w=700,h=230,p=30,x=index=>p+index*Math.max(1,(w-p*2)/Math.max(1,rows.length-1)),y=score=>h-p-score*(h-p*2)/100,points=rows.map((item,index)=>`${x(index)},${y(item.score)}`).join(" ");chart.innerHTML=`<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><line x1="${p}" y1="${y(stats.average)}" x2="${w-p}" y2="${y(stats.average)}" class="health-average"/><polyline points="${points}" class="health-line"/>${rows.map((item,index)=>`<circle cx="${x(index)}" cy="${y(item.score)}" r="4"><title>${item.date} ${item.score}点</title></circle>`).join("")}</svg>`;
}
function renderClinicalLearning(){
 const root=$("clinicalLearningContent");if(!root)return;
 root.innerHTML='<div class="clinical-learning-empty"><strong>診療データを学習中です</strong><p>診療データが蓄積されると、病院独自の診療傾向をここに表示します。</p></div>';
 if(typeof ClinicalLearningEngine==="undefined")return;
 const restored=syncClinicalLearningFromEntries(),today=iso(),entry=data.entries.find(item=>item.date===today);if(entry&&new Date().getHours()>=18){const alreadyTransferred=KnowledgeCore.find(data.successLibrary,`clinical-day:${today}`);learnClinicalEntry(entry,!alreadyTransferred);save()}else if(restored)save();
 const snapshots=Array.isArray(data.clinicalSnapshots)?data.clinicalSnapshots:[],snapshot=snapshots.find(item=>item?.date===today)||[...snapshots].filter(item=>item?.date).sort((a,b)=>b.date.localeCompare(a.date))[0],learning=data.dailyLearning&&typeof data.dailyLearning==="object"?data.dailyLearning:{};if(!snapshot)return;
 const stars="★".repeat(Math.max(1,Math.ceil(snapshot.successScore/20)))+"☆".repeat(Math.max(0,5-Math.ceil(snapshot.successScore/20))),match=ClinicalLearningEngine.patternMatch(snapshot,data.successPatterns),success=snapshot.successScore>=ClinicalLearningEngine.SUCCESS_THRESHOLD;
 root.innerHTML=`<div class="clinical-learning-score"><small>${snapshot.date===today?"今日":escapeHtml(snapshot.date)}</small><strong>${snapshot.successScore}</strong><span>${stars}</span></div><div class="clinical-learning-kpis"><section><small>診療負荷</small><strong>${snapshot.doctorWorkload}</strong></section><section><small>成功日</small><strong>${success?"YES":"NO"}</strong></section><section><small>成功パターン一致率</small><strong>${match}%</strong></section></div><section class="clinical-learning-features"><small>学習</small><div>${(learning.features||[]).map(item=>`<span>${escapeHtml(item)}</span>`).join("")||"記録を蓄積中"}</div></section><p>${escapeHtml(learning.comment||"")}</p><footer>${escapeHtml(learning.status||"学習中")}・${Number(learning.sampleDays)||0}営業日</footer>`;
}
function renderWeeklyInsights(){
 const list=$("weeklyInsightItems");if(!list||typeof WeeklyInsights==="undefined")return;
 const today=iso(),options={entries:data.entries,history:data.weeklyLearningHistory,today,learningHistory:data.learningHistory,compassLearning:data.aiCompassLearning||[]},night=WeeklyInsights.learnAtNight({...options,hour:new Date().getHours()});
 if(night.saved){data.weeklyLearningHistory=night.history;const candidates=(night.record?.insights||[]).map(item=>({id:item.key.split(":")[0],theme:SuccessLibrary.THEMES[item.key.split(":")[0]]||item.key,confidence:Math.max(1,Math.min(5,Math.ceil(Math.abs(Number(item.difference)||0)/10))),importance:Math.abs(Number(item.importance)||0),count:1,firstSeen:night.record.date,lastSeen:night.record.date,trend:Number(item.difference)>0?"up":Number(item.difference)<0?"down":"stable",metrics:{[item.key.split(":")[1]]:Math.round(Number(item.difference)||0)},comment:item.text,category:"weekly"}));data.successLibrary=KnowledgeCore.update(data.successLibrary,candidates,{weekly:true});save()}
 const result=WeeklyInsights.displayed({...options,history:data.weeklyLearningHistory});list.innerHTML=(result.insights?.length?result.insights:[{text:WeeklyInsights.EMPTY}]).map(item=>`<li>${escapeHtml(item.text)}</li>`).join("");
}
function updateSuccessLibrary(){if(typeof KnowledgeCore==="undefined")return;const normalized=KnowledgeCore.normalize(data.successLibrary);if(JSON.stringify(normalized)!==JSON.stringify(data.successLibrary)){data.successLibrary=normalized;save()}}
function renderSuccessLibrary(){
 const list=$("successLibraryItems");if(!list||typeof SuccessLibrary==="undefined")return;updateSuccessLibrary();const items=KnowledgeCore.rank(data.successLibrary);
 if(!items.length){list.innerHTML='<p class="success-library-empty">まだ十分なデータがありません。<br><br>AIは現在、<br>病院固有の成功パターンを学習しています。</p>';return}
 list.innerHTML=items.map(item=>`<button class="success-pattern" type="button" data-success-id="${escapeHtml(item.id)}"><span class="success-stars" data-confidence="${item.confidence}">${"★".repeat(item.confidence)}${"☆".repeat(5-item.confidence)}</span><h4>${escapeHtml(item.theme)}</h4><dl><div><dt>確認回数</dt><dd>${item.count}回</dd></div><div><dt>最近確認</dt><dd>${item.lastSeen}</dd></div></dl><div class="success-metrics">${Object.entries(item.metrics).map(([key,value])=>`<span>${escapeHtml(SuccessLibrary.METRICS[key]||key)} <b>${value>=0?"+":""}${value}%</b></span>`).join("")}</div></button>`).join("");
 list.querySelectorAll("[data-success-id]").forEach(button=>button.onclick=()=>openSuccessLibrary(button.dataset.successId));
}
function strategyDashboard(month=monthNow()){
 const summary=monthSummary(month),settings=data.settings?.[month]||{};
 return KnowledgeCore.buildStrategyDashboard({entries:data.entries,successLibrary:data.successLibrary,today:month===monthNow()?iso():`${month}-${String(new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate()).padStart(2,"0")}`,target:Number(settings.target)||MONTHLY_TARGET,expense:summary.expense,businessDays:Number(settings.businessDays)||expectedBusinessDays(month)});
}
function renderStrategyIntelligence(){
 if(typeof KnowledgeCore==="undefined"||!$("aiManagementBrief"))return;const result=strategyDashboard(),brief=result.brief;
 $("aiManagementBrief").innerHTML=`<section class="brief-priority"><h3>今日の最優先</h3><span class="brief-stars" aria-label="最優先">★★★★★</span><strong>${escapeHtml(brief.priority)}</strong></section><section><h3>今日のリスク</h3><strong>${escapeHtml(brief.risk)}</strong></section><section class="brief-comment"><h3>AIコメント</h3><p>${escapeHtml(brief.comment)}</p></section>`;
 const report=strategyDashboard(reportMonth());
 $("successRanking").innerHTML=(report.successRanking.length?report.successRanking.map((item,index)=>`<div class="strategy-row"><b>${index+1}</b><span>${escapeHtml(item.theme)}<br><small>信頼度 ${item.confidence}/5</small></span><strong>${item.profitImprovement>=0?"＋":""}${item.profitImprovement}%</strong></div>`):['<p>成功パターンを学習中です。</p>']).join("");
 $("growthRanking").innerHTML=report.growth.map(item=>`<div class="strategy-row"><b>${item.mom>=0?"↑":"↓"}</b><span>${escapeHtml(item.theme)}</span><strong>${item.mom>=0?"＋":""}${item.mom}%<small> / 前年 ${item.yoy}%</small></strong></div>`).join("");
 $("managementWarnings").innerHTML=(report.warnings.length?report.warnings.map(item=>`<div class="strategy-row"><b>⚠</b><span>${escapeHtml(item.theme)}</span><strong class="strategy-stars">${"★".repeat(item.priority)}${"☆".repeat(5-item.priority)}</strong></div>`):['<p>大きな低下は検出されていません。</p>']).join("");
 $("strategyMap").innerHTML=Object.entries(report.strategyMap).map(([key,items])=>`<div class="strategy-row"><b>${{strength:"強み",improvement:"改善",growth:"成長"}[key]}</b><span>${escapeHtml(items.join("・")||"学習中")}</span><strong></strong></div>`).join("");
 const f=report.forecast;$("futureForecast").innerHTML=[["月末売上",`約${yen(f.sales)}`],["月末利益",`約${yen(f.profit)}`],["利益率",`${f.profitRate.toFixed(1)}%`],["達成率",`${f.achievement.toFixed(1)}%`]].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join("");
 const healthPriority=calculateBusinessHealth().opportunities?.[0]?.label;$("tomorrowStrategy").textContent=`${healthPriority?`AI経営指数の改善を優先し、${healthPriority}を確認します。 `:""}${report.tomorrow.comment} 期待利益 約${yen(report.tomorrow.expectedProfit)}`;
 const findings=[...report.discoveries,...report.seasonLearning.map(item=>`${item.season}：${item.theme}（信頼度 ${item.confidence}/5）`)];$("aiDiscoveries").innerHTML=(findings.length?findings:["病院独自の傾向をKnowledge Coreで学習中です。"]).map(text=>`<div class="strategy-row"><b>✦</b><span>${escapeHtml(text)}</span><strong></strong></div>`).join("");
 data.seasonLearning=report.seasonLearning;data.forecastModel=report.forecast;
}

function updateStrategyMap(){
 if(typeof StrategyMap==="undefined")return;const today=iso(),result=StrategyMap.update({...data,today,hour:new Date().getHours(),businessDayEnded:new Date().getHours()>=18&&data.entries.some(e=>e.date===today),isClosed:date=>clinicDayInfo(date).type==="closed",strategyMap:data.strategyMap});
 if(result.saved){delete result.saved;delete result.businessDaysUsed;data.strategyMap=result;save()}
}
function renderStrategyMap(){
 const root=$("aiStrategyMap");if(!root||typeof StrategyMap==="undefined")return;const map=StrategyMap.normalize(data.strategyMap),themes=map.themes.slice(0,5),priorities=map.priorities.slice(0,3),stars=score=>Math.max(1,Math.min(5,Math.ceil((Number(score)||0)/20))),numbers=["①","②","③"];
 $("strategyMapUpdated").textContent=map.updated?`${map.updated.slice(0,10)} 更新`:"学習中";
 $("strategyMapThemes").innerHTML=themes.length?themes.map(item=>`<li><span class="strategy-map-stars">${"★".repeat(stars(item.score))}${"☆".repeat(5-stars(item.score))}</span><strong>${escapeHtml(item.theme)}</strong><small>${item.score}点・${escapeHtml(item.confidence)}</small></li>`).join(""):'<li class="strategy-map-empty">営業データを蓄積して重点戦略を学習しています。</li>';
 $("strategyMapPriorities").innerHTML=priorities.length?priorities.map((item,index)=>`<li><b>${numbers[index]}</b>${escapeHtml(item.theme)}</li>`).join(""):'<li>優先順位を学習中です。</li>';
 const top=priorities[0];$("strategyMapComment").textContent=top?`${top.theme}は「${top.reason}」。今月も重点施策として推奨します。`:"データが揃うと、今後1〜3か月の戦略コメントを表示します。";
 $("strategyMapActions").innerHTML=priorities.length?priorities.map(item=>`<li>${escapeHtml(item.action)}</li>`).join(""):'<li>改善提案を学習中です。</li>';
}
function openSuccessLibrary(id){const item=KnowledgeCore.find(data.successLibrary,id);if(!item)return;const metrics=Object.entries(item.metrics).map(([key,value])=>`${SuccessLibrary.METRICS[key]||key} ${value>=0?"+":""}${value}%`).join("・")||"—";$("successLibraryDetail").innerHTML=`<span class="eyebrow">SUCCESS LIBRARY</span><h2 id="successLibraryModalTitle">${escapeHtml(item.theme)}</h2><dl><div><dt>確認回数</dt><dd>${item.count}回</dd></div><div><dt>初回学習日</dt><dd>${item.firstSeen}</dd></div><div><dt>最終学習日</dt><dd>${item.lastSeen}</dd></div><div><dt>平均改善値</dt><dd>${escapeHtml(metrics)}</dd></div></dl><section><h3>AIコメント</h3><p>${escapeHtml(item.comment)}</p></section>`;openOverlay($("successLibraryModal"));$("closeSuccessLibrary").focus()}
function closeSuccessLibrary(){closeOverlay($("successLibraryModal"))}
function generateTodayStrategy(){
 if(typeof ManagementCompass==="undefined")return null;const today=iso(),closed=clinicDayInfo(today).type==="closed";
 if(closed)return {ready:true,closed:true,missions:[]};
 return ManagementCompass.build({knowledgeCore:typeof KnowledgeCore!=="undefined"?KnowledgeCore:null,successLibrary:data.successLibrary,weeklyLearningHistory:data.weeklyLearningHistory,learningHistory:data.learningHistory,clinicalIntelligence:typeof ClinicalIntelligence!=="undefined"?ClinicalIntelligence:null,entries:data.entries,closedDates:data.clinic?.closedDates,hour:new Date().getHours(),successRateHistory:data.successRateHistory});
}
function renderTodayStrategy(){
 const strategy=generateTodayStrategy();renderManagementCompass(strategy);if(!strategy)return;
 const today=iso(),entry=data.entries.find(row=>row.date===today),hour=new Date().getHours(),setting=data.settings?.[today.slice(0,7)]||{};let anomalies=[];try{anomalies=typeof BusinessAnomalies!=="undefined"?BusinessAnomalies.detectBusinessAnomalies(data,{today,hour}):[]}catch(error){console.error(error)}
 const result=typeof TodayResult!=="undefined"?TodayResult.build({hour,entry,history:data.entries,target:clinicDayInfo(today).type==="saturday"?Number(setting.saturdayTarget)||data.clinic?.saturdayTarget:Number(setting.dailyTarget)||data.clinic?.fullDayTarget,anomalies,prediction:strategy}):{visible:false},section=$("todayResult");section.hidden=!result.visible;
 if(result.learningUpdate&&!((data.aiCompassLearning||[]).some(row=>row.date===result.learningUpdate.date))){data.aiCompassLearning=[...(data.aiCompassLearning||[]),result.learningUpdate];save()}
 const shadowTitle=$("compassShadowTitle"),shadowComment=$("compassShadowComment");
 if(result.visible){$("todayResultItems").innerHTML=result.items.map(item=>`<div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join("");shadowTitle.textContent="影武者｜今日の振り返り";shadowComment.textContent=result.comment}
 else{shadowTitle.textContent="影武者｜今日の方針";shadowComment.textContent=strategy.closed?"本日は休診日です。直近営業日の振り返りだけ行いましょう。":strategy.ready?`今日は${strategy.theme}を意識しましょう。`:"昨日までの記録を続けましょう。"}
}
function renderBusinessAnomalies(){
 const card=$("businessAnomalyCard"),items=$("businessAnomalyItems");if(!card||!items)return;
 card.hidden=true;items.replaceChildren();
 if(typeof BusinessAnomalies==="undefined")return;
 const anomalies=BusinessAnomalies.detectBusinessAnomalies(data,{today:iso(),hour:new Date().getHours()}).filter(item=>item.level!=="normal");if(!anomalies.length)return;
 const danger=anomalies.some(item=>item.level==="danger");card.dataset.level=danger?"danger":"warning";$("businessAnomalyTitle").textContent=danger?"🔴 通常より大きな変化があります":"🟡 通常と少し違う動きがあります";
 const format=item=>item.format==="count"?`${Math.round(item.current).toLocaleString("ja-JP")}件`:item.format==="percent"?`${item.current.toFixed(1)}%`:yen(item.current);
 items.innerHTML=anomalies.map(item=>`<section><div><span>${escapeHtml(item.metric)}</span><strong>${format(item)}</strong></div><div><span>通常</span><strong>${item.format==="count"?`${Math.round(item.baseline).toLocaleString("ja-JP")}件`:item.format==="percent"?`${item.baseline.toFixed(1)}%`:yen(item.baseline)}</strong></div><b>${item.changePercent<0?"↓":"↑"} ${Math.abs(item.changePercent).toFixed(item.format==="percent"?1:0)}${item.format==="percent"?"ポイント":"%"}</b><p><em>影武者コメント：</em>${escapeHtml(item.message)}。${item.metric==="客単価"?"検査・処置内容や継続症例の比率を確認しましょう。":item.metric==="来院件数"?"予約状況と当日の来院動向を確認しましょう。":item.metric==="総支出"||item.metric==="利益率"?"支出の内訳と一時的な費用を確認しましょう。":"診療内容と来院件数の組み合わせを確認しましょう。"}</p></section>`).join("");card.hidden=false;
}
function stableKagemushaIndex(date,mood,length){return [...`${date}:${mood}`].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7)%length}
function generateKagemushaMessage(values){const templates=KAGEMUSHA_MESSAGES[values.mood]||KAGEMUSHA_MESSAGES.normal,baseMessage=templates[stableKagemushaIndex(values.date,values.mood,templates.length)],fact=values.mood==="thinking"?"":` 今月売上${yen(values.monthSales)}、達成率${pct(values.progress)}です。`;return `${baseMessage}${fact}`.slice(0,120)}
function isLastDayOfMonth(date=new Date()){const value=date instanceof Date?date:new Date(`${date}T12:00:00`);return !Number.isNaN(value.getTime())&&value.getDate()===new Date(value.getFullYear(),value.getMonth()+1,0).getDate()}
function generateMonthlyKagemushaSummary({sales=0,patients=0,expense=null,target=0,previousMonth=null,previousYear=null,events=[],diaries=[]}={}){
 const amount=Math.max(0,Number(sales)||0),visits=Math.max(0,Number(patients)||0),goal=Math.max(0,Number(target)||0),cost=expense==null?null:Math.max(0,Number(expense)||0);
 const unit=visits?amount/visits:0,profitRate=amount&&cost!=null?(amount-cost)/amount*100:null,progress=goal?amount/goal*100:null;
 const figures=[];
 if(amount)figures.push(`診療報酬は${yen(amount)}`);if(visits)figures.push(`来院件数は${visits.toLocaleString("ja-JP")}件`);if(unit)figures.push(`平均客単価は${yen(unit)}`);if(profitRate!=null)figures.push(`利益率は${pct(profitRate)}`);if(progress!=null)figures.push(`目標達成率は${pct(progress)}`);
 const numbers=figures.length?`${figures.join("、")}でした。`:"今月は集計できる数字がまだありません。記録された範囲で振り返ります。";
 let analysis="数字を確認しながら、診療品質を優先できた一か月でした。";
 if(progress!=null&&progress>=100&&profitRate!=null&&profitRate>=20)analysis="目標を達成し、利益率も安定していました。件数と内容のバランスが取れています。";
 else if(profitRate!=null&&profitRate<10)analysis="実績は否定せず、来月は支出の内訳を冷静に見直す余地があります。";
 else if(progress!=null&&progress<100&&unit>0)analysis="目標には届きませんでしたが、客単価が診療内容の濃さを支えています。";
 const closing=profitRate!=null&&profitRate<10?"私なら来月は診療品質を守りながら、利益率を一つずつ整えます。":"私なら来月も数字を冷静に見ながら、診療品質をさらに高めます。";
 const monthlyWord=progress!=null&&progress>=100?"積み重ねが目標達成につながった一か月でした。":profitRate!=null&&profitRate>=20?"守るべきものを守れた一か月でした。":"来月への土台を作れた一か月でした。";
 // 比較データ・イベント・日誌を引数に含め、将来の分析拡張時にも保存形式を変えずに利用できるようにする。
 void previousMonth;void previousYear;void events;void diaries;
 return `先生、今月もお疲れさまでした。\n\n${numbers}\n\n${analysis}\n\n${closing}\n\n今月の一言「${monthlyWord}」`;
}
function renderKagemusha(){
 const quote=$("kagemushaQuote"),greeting=$("kagemushaGreeting"),heading=$("kagemushaMessageTitle"),card=$("aiBriefCard"),button=$("kagemushaButton");if(!quote&&!greeting)return;
 const values=currentKagemushaData(),mood=values.mood;
 [card,button].forEach(element=>{if(element){element.dataset.mood=mood;if(element===button)element.className=`kagemusha-button kagemusha-character kagemusha--${mood}`}});
 const emoji=$("kagemushaEmoji"),symbols={normal:"🥷",smile:"🥷✨",thinking:"🥷💭",warning:"🥷⚠️"};if(emoji)emoji.textContent=symbols[mood];
 const monthEnd=isLastDayOfMonth(values.date);
 const nextHeading=monthEnd?"🥷 影武者 月間総括":"影武者のひとこと",nextGreeting=monthEnd?"":generateKagemushaGreeting({hour:new Date().getHours(),...values,hasProfitData:values.profitRate!==null}),nextQuote=monthEnd?generateMonthlyKagemushaSummary({sales:values.monthSales,patients:values.monthPatients,expense:values.monthExpense,target:values.monthTarget,diaries:loadKagemushaDiaries()}):generateKagemushaMessage(values),signature=`${nextHeading}\n${nextGreeting}\n${nextQuote}`;
 const setImage=source=>{if(!USE_KAGEMUSHA_IMAGES||!button)return;let image=$("kagemushaImage");if(!image){image=document.createElement("img");image.id="kagemushaImage";image.alt="";image.hidden=true;button.insertBefore(image,emoji)}image.onload=()=>{image.hidden=false;if(emoji)emoji.hidden=true};image.onerror=()=>{image.hidden=true;if(emoji)emoji.hidden=false};if(!decodeURI(image.src).endsWith(source))image.src=source};
 const applyComment=()=>{if(heading)heading.textContent=nextHeading;if(greeting){greeting.hidden=monthEnd;greeting.textContent=nextGreeting}if(quote)quote.textContent=nextQuote;kagemushaCommentSignature=signature};
 const originalImage=mood==="thinking"?"影武者思考.jpeg":`kagemusha-${mood}.jpeg`,reduceMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
 clearTimeout(kagemushaCommentTimer);
 if(!kagemushaCommentSignature||kagemushaCommentSignature===signature||reduceMotion){applyComment();setImage(originalImage);[greeting,quote].forEach(element=>element?.classList.remove("assistant-comment-fade"));return}
 [greeting,quote].forEach(element=>element?.classList.add("assistant-comment-fade"));
 kagemushaCommentTimer=setTimeout(()=>{setImage("影武者思考.jpeg");kagemushaCommentTimer=setTimeout(()=>{applyComment();setImage(originalImage);requestAnimationFrame(()=>requestAnimationFrame(()=>[greeting,quote].forEach(element=>element?.classList.remove("assistant-comment-fade"))))},500)},170)
}

function setupKpiAnimations(){
 const ids=["todaySales","monthSales","monthProfitSummary","monthProfit","monthProfitRate","profitRate","todayUnit","monthUnit","todayPatients","monthPatients","progressText"],values=new WeakMap(),elements=ids.map($).filter(Boolean);
 elements.forEach(element=>values.set(element,element.textContent));
 const observer=new MutationObserver(records=>{new Set(records.map(record=>record.target.nodeType===Node.TEXT_NODE?record.target.parentElement:record.target)).forEach(element=>{const previous=values.get(element),next=element.textContent;if(previous===next)return;values.set(element,next);element.classList.remove("kpi-value-updated");void element.offsetWidth;element.classList.add("kpi-value-updated")})});
 elements.forEach(element=>{observer.observe(element,{characterData:true,childList:true,subtree:true});element.addEventListener("animationend",()=>element.classList.remove("kpi-value-updated"))})
}
function loadKagemushaDiaries(){try{const value=JSON.parse(localStorage.getItem(KAGEMUSHA_DIARY_KEY)||"[]");return Array.isArray(value)?value:[]}catch{return []}}
function saveKagemushaDiaries(entries){localStorage.setItem(KAGEMUSHA_DIARY_KEY,JSON.stringify(entries))}
function currentKagemushaData(){const date=iso(),s=monthSummary(monthNow()),entry=data.entries.find(e=>e.date===date)||{},target=Number(data.settings[monthNow()]?.target)||MONTHLY_TARGET,profitRate=s.sales?(s.sales-s.expense)/s.sales*100:0,progress=target?s.sales/target*100:0,set=data.settings[monthNow()]||{},elapsed=operatingEntries(s.entries.filter(e=>e.date<=date)).length,remainingBusinessDays=Math.max(0,(Number(set.businessDays)||expectedBusinessDays(monthNow()))-elapsed),mood=getKagemushaMood({patients:entry.patients,sales:entry.sales,profitRate,progress,hasProfitData:Boolean(s.sales&&s.expense)});return {date,patients:Number(entry.patients)||0,newPatients:Number(entry.newPatients)||0,sales:Number(entry.sales)||0,monthSales:s.sales,monthPatients:s.patients,monthExpense:s.expense||null,monthTarget:target,profitRate:s.sales&&s.expense?profitRate:null,progress,remainingBusinessDays,mood,directorMemo:entry.note??entry.memo??""}}
function generateKagemushaDiaryMessage(values){const opening=values.patients?`本日は${values.patients}件、売上は${yen(values.sales)}でした。`:"本日の実績はまだ未入力です。";return `${opening}
月間目標への進捗は${pct(values.progress)}です。

${generateKagemushaMessage(values)}

今日もお疲れさまでした、先生。`}
function generateKagemushaDiaryEntry(values,existing){const now=new Date().toISOString();return {...values,message:generateKagemushaDiaryMessage(values),createdAt:existing?.createdAt||now,updatedAt:now}}
let kagemushaDiaryFeedbackTimer;
function showKagemushaDiaryFeedback(success){const button=$("saveKagemushaDiary");clearTimeout(kagemushaDiaryFeedbackTimer);if(button)button.textContent=success?"保存しました ✓":"日誌を保存できませんでした";toast(success?"影武者日誌を更新しました":"日誌を保存できませんでした");kagemushaDiaryFeedbackTimer=setTimeout(()=>{if(button)button.textContent="今日の日誌を今すぐ更新"},1500)}
function saveTodayKagemushaDiary(){try{const values=currentKagemushaData(),entries=loadKagemushaDiaries(),index=entries.findIndex(entry=>entry.date===values.date),next=generateKagemushaDiaryEntry(values,index>=0?entries[index]:null);if(index>=0)entries[index]=next;else entries.push(next);saveKagemushaDiaries(entries);renderKagemushaDiary();showKagemushaDiaryFeedback(true);return true}catch(error){console.error("影武者日誌を保存できませんでした",error);showKagemushaDiaryFeedback(false);return false}}
function escapeHtml(value){return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function renderKagemushaDiary(){const list=$("kagemushaDiaryList"),updated=$("kagemushaDiaryUpdated");if(!list)return;const today=iso(),entries=loadKagemushaDiaries().sort((a,b)=>a.date===today?-1:b.date===today?1:String(b.date).localeCompare(String(a.date))).slice(0,7),latest=entries.reduce((value,entry)=>String(entry.updatedAt||entry.createdAt||"")>value?String(entry.updatedAt||entry.createdAt):value,"");if(updated){const time=latest&&new Date(latest);updated.textContent=time&&!Number.isNaN(time.getTime())?`最終更新 ${time.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}`:""}list.innerHTML=entries.length?entries.map((entry,index)=>`<button type="button" data-diary-index="${index}" aria-label="${entry.date}の影武者日誌を開く"><span><strong>${entry.date}</strong><small>${entry.newPatients??0}新患・${yen(entry.sales)}・${{normal:"通常",smile:"笑顔",thinking:"思案",warning:"注意"}[entry.mood]||entry.mood}</small></span><p>${escapeHtml(String(entry.message||"").replace(/\n/g," ").slice(0,55))}</p></button>`).join(""):"<p class=\"empty\">保存した日誌はまだありません。</p>";list.querySelectorAll("button").forEach(button=>button.onclick=()=>openKagemushaDiary(entries[Number(button.dataset.diaryIndex)]))}
function openKagemushaDiary(entry){const modal=$("kagemushaDiaryModal"),full=$("kagemushaDiaryFull");if(!modal||!full)return;full.innerHTML=`<h2 id="kagemushaDiaryModalTitle">${new Date(`${entry.date}T00:00:00`).toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"})}</h2><dl><div><dt>来院 / 新患</dt><dd>${entry.patients}件 / ${entry.newPatients??0}件</dd></div><div><dt>売上 / 今月</dt><dd>${yen(entry.sales)} / ${yen(entry.monthSales)}</dd></div><div><dt>利益率 / 達成率</dt><dd>${entry.profitRate==null?"判定前":pct(entry.profitRate)} / ${pct(entry.progress)}</dd></div><div><dt>残営業日 / ムード</dt><dd>${entry.remainingBusinessDays}日 / ${entry.mood}</dd></div></dl><p>${escapeHtml(entry.message).replace(/\n/g,"<br>")}</p>${entry.directorMemo?`<aside><strong>院長メモ</strong><p>${escapeHtml(entry.directorMemo)}</p></aside>`:""}`;openOverlay(modal);$("closeKagemushaDiary").focus()}
function closeKagemushaDiary(){closeOverlay($("kagemushaDiaryModal"))}
function setupKagemusha(){
  const button=$("kagemushaButton"),message=$("kagemushaMessage"),close=$("kagemushaClose");if(!button||!message||!close)return;
  let closeTimer;const setOpen=open=>{clearTimeout(closeTimer);button.setAttribute("aria-expanded",String(open));button.setAttribute("aria-label",open?"影武者のひとことを閉じる":"影武者のひとことを開く");if(open){message.hidden=false;message.classList.remove("is-closing");renderKagemusha()}else if(reducedMotion())message.hidden=true;else{message.classList.add("is-closing");closeTimer=setTimeout(()=>{message.hidden=true;message.classList.remove("is-closing")},190)}};
  button.onclick=()=>setOpen(message.hidden);close.onclick=()=>{setOpen(false);button.focus()};
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!message.hidden){setOpen(false);button.focus()}});
}
function getAIDirectorStatus({sales,progress,left,need,pace}){return !sales?"入力待ち":progress>=100||(left&&pace>=need)?"順調":left&&pace>=need*.8?"要確認":"要改善"}
function generateAIDirectorComment({date,sales,target,progress,margin,left,need,pace,todaySales,todayPatients,unit}){
  const variantFor=templates=>{
    const dayNumber=Math.floor(Date.parse(`${date}T00:00:00Z`)/86400000);
    return templates[((dayNumber%templates.length)+templates.length)%templates.length];
  };
  if(!sales)return variantFor([
    ["院長、今月はまだ売上の記録がないようです。",`目標は${yen(target)}、残りは${left}営業日です。`,"まだ焦らなくて大丈夫です。","今日の診療後に、売上と来院件数を入力しましょう。"],
    ["院長、まずは今月の実績を待っている状態です。",`月目標${yen(target)}に対し、営業日はあと${left}日あります。`,"ここから記録を始めれば十分です。","今日は売上と来院件数だけでも残しておきましょう。"],
    ["院長、今は売上が未入力なので、ペースをまだ判断できません。",`今月の目標は${yen(target)}、残営業日は${left}日です。`,"数字が入れば、すぐに流れが見えてきます。","まず今日の実績を記録して、明日の判断材料を作りましょう。"],
    ["院長、今月の状況はまだ白紙です。",`目標${yen(target)}まで、残り${left}営業日です。`,"最初の一日を入れれば、そこから一緒に見ていけます。","今日の終わりに、売上と来院件数を記録しましょう。"]
  ]);
  if(progress>=100)return variantFor([
    ["院長、今月はもう目標を達成できています。",`売上は${yen(sales)}、利益率は${pct(margin)}、必要日商は0円です。`,"しっかり積み上げられましたね。","今日は無理に上積みせず、一件一件の診療品質を優先しましょう。"],
    ["院長、目標を超えて安定した運営に入っています。",`今月売上は${yen(sales)}で、利益率${pct(margin)}、残り${left}営業日です。`,"今の流れなら安心して進められます。","今日は予約の偏りとスタッフの負荷を一度確認しましょう。"],
    ["院長、今月の売上は目標をしっかり上回っています。",`実績${yen(sales)}、利益率${pct(margin)}で、追加の必要日商はありません。`,"ここまでの運営が数字に表れていますね。",`今日は${todayPatients?`${todayPatients}件の来院対応`:"目の前の診療"}を丁寧に進めましょう。`],
    ["院長、今月は余裕を持って目標クリアです。",`売上${yen(sales)}、客単価${yen(unit)}、必要日商は0円です。`,"良い状態を作れています。","今日は診療品質を保ちながら、明日以降の予約状況を整えましょう。"]
  ]);
  if(left&&pace>=need)return variantFor([
    ["院長、今月は目標に届くペースで進んでいます。",`売上${yen(sales)}、残り${left}営業日の必要日商は${yen(need)}です。`,"今の積み上げなら順調です。","今日は数字を追いすぎず、診療品質を大切にしましょう。"],
    ["院長、今のところ月目標への流れは良好です。",`現在の日商ペース${yen(pace)}に対し、必要日商は${yen(need)}です。`,"このまま落ち着いて進めば大丈夫です。","今日は案内漏れがないかだけ確認して、今のペースを保ちましょう。"],
    ["院長、今月は大きく崩れず順調に進んでいます。",`今月売上${yen(sales)}に対し、残り${left}日で一日${yen(need)}が目安です。`,"無理のないラインにいますね。",`今日は${todayPatients?`${todayPatients}件の来院対応`:"一件一件の診療"}を丁寧に進めましょう。`],
    ["院長、目標に向けた積み上げはうまくいっています。",`売上は${yen(sales)}、必要日商${yen(need)}に対し、現在のペースは${yen(pace)}です。`,"しっかり目安を上回れています。","今日は予約とスタッフ負荷のバランスを見ておきましょう。"]
  ]);
  if(left&&pace>=need*.8)return variantFor([
    ["院長、今月は目標までもう一歩のところです。",`売上${yen(sales)}で、必要日商${yen(need)}に対し現在のペースは${yen(pace)}です。`,"少しだけ意識すれば届く差です。","今日は必要な検査や再診の案内漏れを確認しましょう。"],
    ["院長、目標ペースにほぼ並んでいます。",`残り${left}営業日で必要な日商は${yen(need)}、現在は${yen(pace)}ペースです。`,"大きな心配はありませんが、今日は要確認です。","予約表を見て、必要なフォローを1つ確実に進めましょう。"],
    ["院長、今月の進み方は悪くありませんが、あと少し上積みが必要です。",`今月売上${yen(sales)}、残り${left}日の必要日商は${yen(need)}です。`,"焦って数字だけを追うほどの差ではありません。","今日は来院予定の内容を見直し、診療上必要な提案を丁寧に行いましょう。"],
    ["院長、今は目標ラインの少し手前にいます。",`現在の日商ペースは${yen(pace)}、ここから必要なのは${yen(need)}です。`,"十分に取り戻せる範囲です。",`今日は${todayPatients?`来院${todayPatients}件の診療内容`:"予約内容"}を確認し、案内漏れを防ぎましょう。`]
  ]);
  return variantFor([
    ["院長、今月は目標ペースから少し離れています。",`売上${yen(sales)}に対し、残り${left}営業日の必要日商は${yen(need)}です。`,"厳しい局面ですが、できることを一つずつ進めましょう。","今日は必要な検査と再診案内の漏れを確認してください。"],
    ["院長、今は目標に戻すための手入れが必要です。",`今月売上${yen(sales)}、必要日商${yen(need)}に対し、現在は${yen(pace)}ペースです。`,"焦りますよね。ただ、数字だけを追う必要はありません。","まず今日の予約を見直し、診療上必要な提案を確実に行いましょう。"],
    ["院長、今月の積み上げはやや遅れています。",`目標${yen(target)}に対し売上は${yen(sales)}、残り${left}日で一日${yen(need)}が目安です。`,"今は状況を正面から見て、小さく立て直すところです。",`今日は${todayPatients?`${todayPatients}件の来院内容`:"予約内容"}を確認し、必要なフォローを一つ進めましょう。`],
    ["院長、目標達成には残り営業日の積み上げが大切な状況です。",`売上${yen(sales)}、残営業日${left}日、必要日商は${yen(need)}です。`,"楽な数字ではありませんが、まず今日に集中しましょう。","今日は診療品質を守りながら、案内漏れと次回予約を確認しましょう。"]
  ]);
}
function renderPhase1Director(){
  const m=monthNow(),s=monthSummary(m),set=data.settings[m]||{target:MONTHLY_TARGET,businessDays:expectedBusinessDays(m)},target=Number(set.target)||MONTHLY_TARGET;
  const today=iso(),todayEntry=s.entries.find(e=>e.date===today)||{},todaySales=Number(todayEntry.sales)||0,todayPatients=Number(todayEntry.patients)||0,unit=todayPatients?todaySales/todayPatients:0;
  const elapsed=operatingEntries(s.entries.filter(e=>e.date<=today)).length,totalDays=Number(set.businessDays)||expectedBusinessDays(m),left=Math.max(0,totalDays-elapsed),need=Math.max(0,target-s.sales)/Math.max(1,left);
  const progress=target?s.sales/target*100:0,profit=s.sales-s.expense,margin=s.sales?profit/s.sales*100:0,pace=elapsed?s.sales/elapsed:0;
  const status=getAIDirectorStatus({sales:s.sales,progress,left,need,pace});
  const comment=generateAIDirectorComment({date:today,sales:s.sales,target,progress,margin,left,need,pace,todaySales,todayPatients,unit});
  $("phase1DirectorStatus").textContent=status;$("phase1DirectorStatus").dataset.status=status;
  $("phase1DirectorComment").innerHTML=comment.map(line=>`<p>${line}</p>`).join("");
  $("phase1MonthSales").textContent=yen(s.sales);$("phase1NeedDaily").textContent=yen(left?need:0);$("phase1DaysLeft").textContent=`${left}日`;
}
function renderManagementInsight(){
  const m=monthNow(),s=monthSummary(m),set=data.settings[m]||{target:MONTHLY_TARGET,businessDays:expectedBusinessDays(m)};
  const target=Number(set.target)||MONTHLY_TARGET,progress=target?s.sales/target*100:0,profit=s.sales-s.expense,profitRate=s.sales?profit/s.sales*100:0;
  const today=iso(),elapsed=operatingEntries(s.entries.filter(e=>e.date<=today)).length,totalDays=Number(set.businessDays)||expectedBusinessDays(m),left=Math.max(0,totalDays-elapsed);
  const needDaily=Math.max(0,target-s.sales)/Math.max(1,left),paceRate=elapsed?((s.sales/elapsed)*totalDays/target)*100:progress,profitScore=s.expense?Math.max(0,Math.min(100,(profitRate/30)*100)):50;
  const score=s.sales?Math.round(Math.max(0,Math.min(100,Math.min(100,progress)*.45+profitScore*.35+Math.min(100,paceRate)*.2))):null;
  const rows=operatingEntries(s.entries.filter(e=>e.date<=today&&Number(e.sales)>0)).sort((a,b)=>b.date.localeCompare(a.date)),current=rows.find(e=>e.date===today)||rows[0],previous=rows.find(e=>current&&e.date<current.date);
  $("insightPeriod").textContent=`${Number(m.slice(5))}月`;
  updateInsightScore(score);
  $("insightProgress").textContent=pct(progress);$("insightNeedDaily").textContent=left?yen(needDaily):progress>=100?"達成済み":"営業日終了";
  let rating="データ待ち";if(s.sales&&s.expense)rating=profitRate>=30?"良好":profitRate>=20?"標準":"要改善";
  $("insightProfitRating").textContent=rating;$("insightProfitRating").className=rating==="良好"?"positive":rating==="要改善"?"negative":"";$("insightProfitRate").textContent=s.sales&&s.expense?`利益率 ${pct(profitRate)}`:"支出データ入力後に評価";
  if(current&&previous){const delta=Number(current.sales)-Number(previous.sales),rate=previous.sales?delta/previous.sales*100:0;$("insightPrevious").textContent=`${delta>=0?"↑":"↓"} ${Math.abs(rate).toFixed(1)}%`;$("insightPrevious").className=delta>=0?"positive":"negative";$("insightPreviousDetail").textContent=`${yen(current.sales)}（${previous.date.slice(5).replace("-","/")}比 ${delta>=0?"+":"−"}${yen(Math.abs(delta))}）`}
  else{$("insightPrevious").textContent="比較データなし";$("insightPrevious").className="";$("insightPreviousDetail").textContent="2営業日分の売上から比較"}
  let todo="今日の記録を入力して、月間の進捗を確認しましょう。";
  if(left&&progress<85)todo=`目標に向け、再診・健診の案内漏れを確認し、今日の日商${yen(needDaily)}を意識しましょう。`;
  else if(rating==="要改善")todo="支出の大きい項目を確認し、診療品質を保ちながら不要なコストを1つ見直しましょう。";
  else if(progress>=100)todo="目標達成済みです。予約の偏りとスタッフの負荷を確認し、診療品質を優先しましょう。";
  $("insightTodo").textContent=todo;
  $("insightComment").textContent=!s.sales?"今月の売上を記録すると、目標・利益・前営業日の実績をまとめて評価します。":progress>=100&&rating==="良好"?`目標を達成し、利益率も良好です。現在の運営を維持しながら、無理な上積みより診療品質を優先しましょう。`:`目標達成率は${pct(progress)}、利益率は${s.expense?pct(profitRate):"支出入力待ち"}です。${left?`残り${left}営業日は、必要日商${yen(needDaily)}が判断の目安です。`:"今月の実績を振り返り、次月の行動につなげましょう。"}`;
}
function setNoteStatus(editing=false){const status=$("noteStatus");if(status)status.textContent=editing?"保存済みメモを編集中":""}
function clearForm(date=iso()){$("entryDate").value=date;["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).value="");fillClinicalForm({});$("note").value="";setNoteStatus(false);$("saveEntry").textContent="保存する";renderTodaySummary()}
function entryNumberValue(id,existing){const raw=$(id).value.trim();return raw===""&&existing?Number(existing[id])||0:num(id)}
function buildEntry(date,existing){const performanceFields=["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"],merged={...(existing||{}),date};performanceFields.forEach(id=>merged[id]=entryNumberValue(id,existing));merged.clinical=existing?clinicalFromFormMerged(existing.clinical??{}):clinicalFromForm();merged.weather=existing?.weather??(data.weatherCache?{condition:data.weatherCache.condition,temperature:data.weatherCache.temperature,rainProbability:data.weatherCache.rainProbability,code:data.weatherCache.code,dailyCondition:data.weatherCache.dailyCondition,dailyCode:data.weatherCache.dailyCode,dailyRainMax:data.weatherCache.dailyRainMax}:null);merged.memo=DailyMemoLearning.clean($("note").value);merged.note=merged.memo;return merged}
function learnClinicalEntry(entry,transferToCore=false){if(typeof ClinicalLearningEngine==="undefined"||!entry)return;const summary=monthSummary(entry.date.slice(0,7)),days=Math.max(1,operatingEntries(summary.entries).length),result=ClinicalLearningEngine.learnDaily(data,entry,{dailyExpense:summary.expense/days,weather:entry.weather||data.weatherCache,staffCount:data.clinic?.staffCount,benchmarks:{sales:clinicDayInfo(entry.date).target,unitPrice:10000,profitRate:30}});["clinicalSnapshots","successPatterns","failurePatterns","workloadHistory","dailyLearning","successScoreHistory"].forEach(key=>data[key]=result[key]);if(transferToCore&&result.knowledgeCandidates.length)data.successLibrary=KnowledgeCore.update(data.successLibrary,result.knowledgeCandidates)}
function syncClinicalLearningFromEntries(){
 if(typeof ClinicalLearningEngine==="undefined")return false;
 const learnedDates=new Set((Array.isArray(data.clinicalSnapshots)?data.clinicalSnapshots:[]).map(item=>item?.date).filter(Boolean)),missing=(Array.isArray(data.entries)?data.entries:[]).filter(entry=>/^\d{4}-\d{2}-\d{2}$/.test(String(entry?.date||""))&&!learnedDates.has(entry.date)).sort((a,b)=>a.date.localeCompare(b.date));
 missing.forEach(entry=>learnClinicalEntry(entry));return missing.length>0;
}
function saveEntry(){const date=$("entryDate").value;if(!date)return toast("日付を入力してください");const performanceFields=["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"],hasPerformanceInput=performanceFields.some(id=>$(id).value.trim()!=="");const i=data.entries.findIndex(x=>x.date===date),existing=i>=0?data.entries[i]:null,e=buildEntry(date,existing);if(i>=0)data.entries[i]=e;else data.entries.push(e);data.entries.sort((a,b)=>a.date.localeCompare(b.date));learnClinicalEntry(e,date===iso()&&new Date().getHours()>=18);save();const diaryAttempted=date===iso()&&hasPerformanceInput;if(diaryAttempted)saveTodayKagemushaDiary();render();clearForm();if(!diaryAttempted)toast(i>=0?"更新しました":"保存しました")}
function edit(date){const e=data.entries.find(x=>x.date===date);if(!e)return;["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).value=e[id]??"");fillClinicalForm(e.clinical??{});$("entryDate").value=e.date;$("note").value=e.memo??e.note??"";setNoteStatus(Boolean((e.note??e.memo??"").length));$("saveEntry").textContent="更新する";preview();switchPage("today");setTimeout(()=>$("entryDate").scrollIntoView({behavior:"smooth",block:"center"}),150)}
function del(date){if(!String(date).startsWith(monthNow()))return toast("過去月は閲覧のみです");if(!confirm(`${date}の記録を削除しますか？`))return;data.entries=data.entries.filter(x=>x.date!==date);save();render();toast("削除しました")}
function sum(entries){return entries.reduce((a,e)=>{["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(k=>a[k]+=(Number(e[k])||0));return a},{sales:0,patients:0,newPatients:0,surgeries:0,checkups:0,trimmings:0,secondOpinions:0})}
function monthSummary(m){
  const entries=DateRanges.entriesForCalendarMonth(data.entries,m),daily=sum(entries),hist=data.historical[m]||{},mf=data.financeByMonth[m]||{};
  const clinicalSales=daily.sales||Number(hist.sales)||0;
  const morikuboOnline=Number(mf.morikuboOnline)||0;
  const royalCanin=Number(mf.royalCanin)||0;
  const purina=Number(mf.purina)||0;
  const ecSales=morikuboOnline+royalCanin+purina;
  return {...daily,clinicalSales,ecSales,morikuboOnline,royalCanin,purina,sales:clinicalSales+ecSales,entries,expense:Number(mf.monthlyExpense ?? hist.expense ?? 0)||0,personnelExpense:Number(mf.personnelExpense)||0,medicalExpense:Number(mf.medicalExpense)||0,cardFee:Number(mf.cardFee)||0}
}
function recent(){const t=$("recent"),rows=[...data.entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);t.innerHTML=rows.length?rows.map(e=>`<tr><td>${e.date}</td><td>${yen(e.sales)}</td><td>${e.patients}件</td><td>${e.newPatients||0}件</td><td class="record-actions"><button class="edit-record" data-edit="${e.date}">編集</button><button data-del="${e.date}">削除</button></td></tr>`).join(""):'<tr><td colspan="5">まだ記録がありません。</td></tr>';t.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(b.dataset.edit));t.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>del(b.dataset.del))}

const WEEKDAYS=["日","月","火","水","木","金","土"];
const avg=(rows,key)=>rows.length?rows.reduce((a,e)=>a+(Number(e[key])||0),0)/rows.length:0;
function weekdayName(date){return WEEKDAYS[new Date(`${date}T12:00:00`).getDay()]+"曜日"}
function clinicDayInfo(date){
  const day=new Date(`${date}T12:00:00`).getDay(),c=data.clinic||DEFAULT_CLINIC;
  if((c.closedDates||[]).includes(date))return {type:"closed",label:"臨時休診",weight:0,target:0,patientsTarget:0};
  if(day===1)return {type:"closed",label:"月曜休診",weight:0,target:0,patientsTarget:0};
  if(day===6)return {type:"half",label:"土曜・午後診療",weight:.5,target:Number(c.saturdayTarget)||100000,patientsTarget:Number(c.saturdayPatients)||9};
  return {type:"full",label:"通常診療",weight:1,target:Number(c.fullDayTarget)||180000,patientsTarget:Number(c.fullDayPatients)||17.5};
}
function operatingEntries(entries){return entries.filter(e=>clinicDayInfo(e.date).type!=="closed")}
function operatingUnits(entries){return operatingEntries(entries).reduce((a,e)=>a+clinicDayInfo(e.date).weight,0)}
function expectedBusinessDays(month){
  const [y,m]=month.split("-").map(Number),last=new Date(y,m,0).getDate();let n=0;
  for(let d=1;d<=last;d++){const date=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;if(clinicDayInfo(date).type!=="closed")n++}
  return n;
}
function isRainy(e){const w=e.weather||{},code=Number(w.code??w.dailyCode),condition=w.condition||w.dailyCondition||"";return [51,53,55,61,63,65,80,81,82,95,96,99].includes(code)||/雨|雷/.test(condition)}
function isSunny(e){const w=e.weather||{},code=Number(w.code??w.dailyCode),condition=w.condition||w.dailyCondition||"";return [0,1].includes(code)||/快晴|晴れ/.test(condition)}
function analysisFor(entries){
  const usable=operatingEntries(entries).filter(e=>e.sales||e.patients||e.weather);
  const groups={};usable.forEach(e=>{const k=weekdayName(e.date);(groups[k]??=[]).push(e)});
  const weekdayRows=Object.entries(groups).map(([name,rows])=>{
    const targetRate=rows.length?rows.reduce((a,e)=>a+(Number(e.sales)||0)/Math.max(1,clinicDayInfo(e.date).target),0)/rows.length:0;
    return {name,rows,sales:avg(rows,"sales"),patients:avg(rows,"patients"),targetRate};
  }).sort((a,b)=>b.targetRate-a.targetRate);
  const rain=usable.filter(isRainy),sunny=usable.filter(isSunny),hot=usable.filter(e=>Number(e.weather?.temperature)>=30),weatherKnown=usable.filter(e=>e.weather);
  return {usable,weekdayRows,rain,sunny,hot,weatherKnown,overallSales:avg(usable,"sales"),overallPatients:avg(usable,"patients")};
}
function renderDailyAI(){
  const date=$("entryDate")?.value||iso(),saved=data.entries.find(e=>e.date===date),w=date===iso()?data.weatherCache:saved?.weather,day=clinicDayInfo(date);
  const sales=num("sales")||Number(saved?.sales)||0,patients=num("patients")||Number(saved?.patients)||0,newP=num("newPatients")||Number(saved?.newPatients)||0,second=num("secondOpinions")||Number(saved?.secondOpinions)||0;
  const history=operatingEntries(data.entries.filter(e=>e.date!==date)),sameType=history.filter(e=>clinicDayInfo(e.date).type===day.type);
  const basePatients=avg(sameType.length?sameType:history,"patients"),baseSales=avg(sameType.length?sameType:history,"sales");
  let title="今日のデータを待っています",text="天気と入力内容を組み合わせて、今日の評価と行動提案を表示します。",tags=[day.label];
  if(day.type==="closed"){
    title=`${day.label}です`;text="休診日は売上・来院件数・経営スコアの評価対象から除外します。今月全体の状況確認や院長メモにご利用ください。";
  }else if(w||sales||patients){
    const weatherText=w?`${w.condition}・${Math.round(Number(w.temperature)||0)}℃`:"天気未記録",notes=[],rate=day.target?sales/day.target:0;
    const efficiency=ClinicalEfficiency.evaluate({patients,sales,profitRate:currentProfitRate()});
    if(sales)notes.push(`${day.label}の目標${yen(day.target)}に対し、達成率${Math.round(rate*100)}%です。`);
    if(patients)notes.push(`診療効率は${efficiency.grade}（${efficiency.score}点）です。${efficiency.comment}`);
    if(sales&&baseSales){const d=(sales/baseSales-1)*100;notes.push(`売上は同じ診療区分の実績より${Math.abs(d).toFixed(0)}%${d>=0?"上振れ":"下振れ"}しています。`)}
    if(w&&Number(w.temperature)>=30)notes.push("高温日です。熱中症注意喚起と、涼しい時間帯の来院案内が適しています。");
    else if(w&&isRainy({weather:w}))notes.push("雨天です。空き枠があればLINEやストーリーズで当日受診を案内する余地があります。");
    if(second>0)notes.push(`セカンドオピニオン${second}件は、専門相談先としての信頼蓄積につながっています。`);
    if(newP===0&&patients>=10)notes.push("新患がないため、口コミ返信や症例発信を1つ行うと新患導線を維持できます。");
    title=`${weatherText}・${day.label}`;text=notes.slice(0,3).join(" ")||"データは安定しています。予約状況と診療負荷を確認し、無理のない運営を優先しましょう。";
    tags=[day.label,w?.condition,patients?`来院${patients}件`:null,sales?`目標${Math.round(rate*100)}%`:null,second?`専門相談${second}件`:null].filter(Boolean);
  }
  $("dailyAiTitle").textContent=title;$("dailyAiText").textContent=text;$("dailyAiTags").innerHTML=tags.map(t=>`<span>${t}</span>`).join("");
}
function renderDailyReview(){
 const empty=$("dailyReviewEmpty"),content=$("dailyReviewContent");if(!empty||!content||typeof DailyReview==="undefined")return;const date=$("entryDate")?.value||iso(),saved=data.entries.find(entry=>entry.date===date),formEntry=buildEntry(date,saved||null),entry=Number(formEntry.patients)>0||Number(formEntry.sales)>0?formEntry:saved;let anomalies=[];try{anomalies=typeof BusinessAnomalies!=="undefined"?BusinessAnomalies.detectBusinessAnomalies(data,{today:date,hour:23}):[]}catch(error){console.error(error)}const result=DailyReview.build({entries:data.entries,date,entry,profitRate:currentProfitRate(),anomalies});empty.hidden=result.ready;content.hidden=!result.ready;if(!result.ready){empty.textContent=result.reason==="today-data"?"今日の診療データ入力後に採点します。":"診療データ蓄積中です。十分なデータが集まると採点を開始します。";return}$("dailyReviewScore").textContent=result.score;$("dailyReviewStars").textContent="★".repeat(result.stars)+"☆".repeat(5-result.stars);$("dailyReviewStars").setAttribute("aria-label",`5段階中${result.stars}`);$("dailyReviewBest").textContent=result.best;$("dailyReviewImprovement").textContent=result.improvement;$("dailyReviewPriority").textContent=result.priority;$("dailyReviewEffectLabel").textContent=result.effect.label;$("dailyReviewEffect").textContent=`＋約${yen(result.effect.value)}`;$("dailyReviewComment").textContent=result.comment;
}
function renderWeatherBusiness(entries,s,forecast,set,left){
  const a=analysisFor(entries),sample=a.usable.length;$("analysisSample").textContent=`${sample}日分`;
  const best=a.weekdayRows[0];$("bestWeekday").textContent=best?best.name:"—";$("bestWeekdaySub").textContent=best?`目標達成 ${Math.round(best.targetRate*100)}%・平均 ${yen(best.sales)}`:"3日以上で分析";
  $("rainAvgSales").textContent=a.rain.length?yen(avg(a.rain,"sales")):"—";
  $("rainImpact").textContent=a.rain.length&&a.overallSales?`全体比 ${((avg(a.rain,"sales")/a.overallSales-1)*100).toFixed(0)}%（${a.rain.length}日）`:"雨データ待ち";
  $("sunnyAvgPatients").textContent=a.sunny.length?`${avg(a.sunny,"patients").toFixed(1)}件`:"—";
  $("sunnyImpact").textContent=a.sunny.length&&a.overallPatients?`全体比 ${((avg(a.sunny,"patients")/a.overallPatients-1)*100).toFixed(0)}%（${a.sunny.length}日）`:"晴天データ待ち";
  $("hotAvgPatients").textContent=a.hot.length?`${avg(a.hot,"patients").toFixed(1)}件`:"—";$("hotImpact").textContent=a.hot.length?`全体比 ${a.overallPatients?((avg(a.hot,"patients")/a.overallPatients-1)*100).toFixed(0):0}%（${a.hot.length}日）`:"30℃以上のデータ待ち";
  const actions=[];
  if(sample<3)actions.push({p:"データ蓄積",t:"まず3営業日以上を入力すると、曜日・天気別の比較が始まります。"});
  if(a.rain.length>=2&&a.overallSales&&avg(a.rain,"sales")<a.overallSales*.9)actions.push({p:"雨天対策",t:`雨の日の売上は全体平均より約${Math.abs((avg(a.rain,"sales")/a.overallSales-1)*100).toFixed(0)}%低めです。雨予報の前日にLINEで予約確認と当日枠を案内しましょう。`});
  if(a.hot.length>=2&&a.overallPatients&&avg(a.hot,"patients")<a.overallPatients*.9)actions.push({p:"高温日対策",t:"30℃以上の日は来院が減る傾向です。午前・夕方の受診案内と熱中症注意喚起を組み合わせましょう。"});
  if(best&&a.weekdayRows.length>=2){const worst=a.weekdayRows[a.weekdayRows.length-1];if(best.targetRate>worst.targetRate*1.2)actions.push({p:"曜日最適化",t:`診療時間補正後では${best.name}が好調、${worst.name}が弱めです。弱い曜日に健診・再診フォロー・当日枠告知を集中すると効率的です。`})}
  if((s.secondOpinions||0)>=3)actions.push({p:"専門性を発信",t:`セカンドオピニオンが${s.secondOpinions}件あります。匿名化した症例解説や「相談できる疾患」を発信し、強みを明確にしましょう。`});
  if(s.checkups<Math.max(2,Math.ceil(sample*.2)))actions.push({p:"健診を底上げ",t:"健診件数が少なめです。天気の良い日にLINE・Instagramで健診枠を案内すると動きやすくなります。"});
  if(forecast<set.target&&left>0)actions.push({p:"目標差を埋める",t:`月末予測は${yen(forecast)}です。新規施策を増やすより、健診・再診・予防の案内漏れを減らすことを優先しましょう。`});
  $("aiActionList").innerHTML=actions.slice(0,3).map((x,i)=>`<article><b>${i+1}</b><div><strong>${x.p}</strong><p>${x.t}</p></div></article>`).join("")||"<p>大きな弱点は見られません。現在の診療品質と負荷管理を維持しましょう。</p>";
}
function month(){
  const m=$("monthPicker").value||monthNow(),s=monthSummary(m),entries=operatingEntries(s.entries),set=data.settings[m]||{target:MONTHLY_TARGET,businessDays:expectedBusinessDays(m)};
  const profit=s.sales-s.expense,profitRate=s.sales?profit/s.sales*100:0;
  $("target").value=set.target;$("businessDays").value=set.businessDays;
  $("monthLastUpdated").textContent=formatUpdated(data.meta?.lastUpdated);
  $("monthSales").textContent=yen(s.sales);$("monthProfitSummary").textContent=yen(profit);$("monthProfitRate").textContent=pct(profitRate);
  $("monthProfitSummary").className=profit>=0?"positive":"negative";$("monthProfitRate").className=profitRate>=20?"positive":profitRate<0?"negative":"";
  $("monthClinicalSales").textContent=yen(s.clinicalSales);$("monthEcSales").textContent=yen(s.ecSales);
  $("monthEcBreakdown").textContent=`森久保 ${yen(s.morikuboOnline)}・ロイヤルカナン ${yen(s.royalCanin)}・ピュリナ ${yen(s.purina)}`;
  $("monthPatients").textContent=`${s.patients}件`;$("monthUnit").textContent=yen(s.patients?s.sales/s.patients:0);$("monthNew").textContent=`${s.newPatients}件`;$("monthSurgery").textContent=`${s.surgeries}件`;$("monthCheckup").textContent=`${s.checkups}件`;$("monthTrim").textContent=`${s.trimmings}件`;$("monthSecond").textContent=`${s.secondOpinions||0}件`;
  const days=Math.max(1,set.businessDays||expectedBusinessDays(m)),done=new Set(entries.map(e=>e.date)).size,left=Math.max(0,days-done),progress=set.target?s.sales/set.target*100:0,need=left?Math.max(0,set.target-s.sales)/left:Math.max(0,set.target-s.sales),avgDaily=done?s.sales/done:0,forecast=done?avgDaily*days:s.sales,gap=set.target-forecast;
  $("progressText").textContent=pct(progress);$("needDaily").textContent=yen(need);$("forecast").textContent=yen(forecast);$("progressBar").style.width=`${Math.min(100,progress)}%`;$("monthComment").textContent=done?`記録 ${done}営業日／設定 ${days}営業日。残り${left}営業日です。`:(s.sales?"過去の月間売上データを表示しています。日次内訳はありません。":"記録はまだありません。");
  $("aiForecastValue").textContent=yen(forecast);$("aiForecastComment").textContent=done?(forecast>=set.target?`現在の日商${yen(avgDaily)}を維持すると、目標を約${yen(forecast-set.target)}上回る見込みです。`:`現在のペースでは目標まで約${yen(Math.max(0,gap))}不足する見込みです。残り${left}営業日の必要日商は${yen(need)}です。`):(s.sales?"この月は確定済みの月間売上です。":"まだ今月の記録がありません。1日分入力すると予測が始まります。");
  const a=analysisFor(entries);let title="データ待ち",text="記録を入力すると、天気と曜日を含めた提案を表示します。";
  if(done>0){const second=s.secondOpinions||0,best=a.weekdayRows[0];if(a.rain.length>=2&&a.overallSales&&avg(a.rain,"sales")<a.overallSales*.9){title="雨の日の来院導線を強化";text="雨天日の実績が全体平均を下回っています。前日の予約確認と当日枠の告知を組み合わせましょう。"}else if(second>=Math.max(3,Math.ceil(done*.3))){title="専門相談の増加が強み";text=`今月のセカンドオピニオンは${second}件です。専門的な相談先としての認知を、症例発信でさらに定着させましょう。`}else if(best){title=`${best.name}の強みを活用`;text=`${best.name}は平均売上${yen(best.sales)}で最も好調です。弱い曜日への再診・健診誘導に、この傾向を活かしましょう。`}else{title="現在のペースを維持";text="売上・来院・天気を継続記録すると、提案精度がさらに上がります。"}}
  $("aiSuggestionTitle").textContent=title;$("aiSuggestionText").textContent=text;renderWeatherBusiness(entries,s,forecast,set,left);
}
function saveSettings(){const m=$("monthPicker").value||monthNow();if(m!==monthNow())return toast("過去月は閲覧のみです");data.settings[m]={target:num("target"),businessDays:Math.max(1,num("businessDays")||expectedBusinessDays(m))};save();month();toast("目標を保存しました")}
function years(){const ys=new Set([...data.entries.map(e=>e.date.slice(0,4)),...Object.keys(data.historical).map(m=>m.slice(0,4))]);ys.add(String(new Date().getFullYear()));$("yearPicker").innerHTML=[...ys].sort().reverse().map(y=>`<option>${y}</option>`).join("")}
function smoothPath(points){
  if(!points.length)return "";
  const n=points.map(([px,py])=>[Number(px),Number(py)]);
  if(n.length===1)return `M${n[0][0].toFixed(1)},${n[0][1].toFixed(1)}`;
  let d=`M${n[0][0].toFixed(1)},${n[0][1].toFixed(1)}`;
  for(let i=0;i<n.length-1;i++){
    const [x0,y0]=n[i],[x1,y1]=n[i+1];
    const mid=(x0+x1)/2;
    d+=` C${mid.toFixed(1)},${y0.toFixed(1)} ${mid.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}
function monthDetailState(month,row){
  const entries=data.entries.filter(e=>e.date.startsWith(month)),hist=data.historical[month]||{},mf=data.financeByMonth[month]||{};
  const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key),hasEntry=entries.length>0;
  const hasEc=["morikuboOnline","royalCanin","purina"].some(k=>own(mf,k))||(month===monthNow()&&["morikuboOnline","royalCanin","purina"].some(k=>Number(data.finance[k])>0));
  const hasSales=hasEntry||own(hist,"sales")||hasEc,hasExpense=own(mf,"monthlyExpense")||own(hist,"expense")||(month===monthNow()&&Number(data.finance.monthlyExpense)>0);
  return {hasData:hasEntry||Object.keys(hist).length>0||Object.keys(mf).length>0||hasEc||hasExpense,hasSales,hasExpense,hasClinical:hasEntry,row};
}
function monthlyAiComment(state){
  const {row,hasSales,hasExpense,hasClinical}=state;
  if(!hasSales&&!hasExpense&&!hasClinical)return "入力データがないため、コメントはまだ生成できません。";
  const notes=[],profit=row.sales-row.expense,rate=row.sales?profit/row.sales*100:null;
  if(hasSales&&hasExpense&&rate!==null){
    if(rate>=25)notes.push("利益率は良好な水準です");
    else if(rate>=15)notes.push("利益を確保しながら安定して運営できています");
    else if(rate>=0)notes.push("利益率が低めのため、支出の大きい項目を確認しましょう");
    else notes.push("支出が売上を上回っているため、費用の内訳を優先して確認しましょう");
  }else if(hasSales)notes.push("支出を入力すると、利益面も含めて評価できます");
  if(hasClinical){
    if(row.patients>0)notes.push(`来院${Math.round(row.patients).toLocaleString("ja-JP")}件、客単価${yen(row.sales/row.patients)}の実績です`);
    else notes.push("来院件数を入力すると、客単価と診療動向を確認できます");
    if(row.newPatients>0)notes.push(`新患${Math.round(row.newPatients).toLocaleString("ja-JP")}件を次回の再診につなげましょう`);
    if(row.surgeries>0)notes.push(`手術${Math.round(row.surgeries).toLocaleString("ja-JP")}件を安全に実施できています`);
  }else notes.push("来院数などの診療データは未入力です");
  return `${notes.join("。")}。`;
}
function japaneseEraYear(year){
  const y=Number(year);
  return y>=2019?`R${y-2018}`:String(y);
}
function availableChartYears(selectedYear){
  const years=new Set([...data.entries.map(e=>e.date.slice(0,4)),...Object.keys(data.historical).map(m=>m.slice(0,4))]);
  years.add(String(selectedYear));
  return [...years].filter(y=>/^\d{4}$/.test(y)).sort((a,b)=>Number(a)-Number(b)).slice(-4);
}
function annualChartSummary(rows,states){
  const annualTop=typeof KnowledgeCore!=="undefined"?KnowledgeCore.rank(data.successLibrary,{limit:10}).map(item=>item.theme).join("・"):"";
  const available=states.map((state,index)=>state.hasData?index:-1).filter(index=>index>=0);
  if(!available.length)return `年間データが揃うと、ここに推移の要約を表示します。${annualTop?` 年間テーマ TOP10：${annualTop}`:""}`;
  const best=available.reduce((best,index)=>rows[index].sales>rows[best].sales?index:best,available[0]);
  const recent=available.slice(-3).map(index=>rows[index].sales);
  if(recent.length<3)return `${best+1}月が年間最高です。直近の推移は、3か月分のデータが揃うと表示します。${annualTop?` 年間テーマ TOP10：${annualTop}`:""}`;
  const average=recent.reduce((sum,value)=>sum+value,0)/recent.length;
  const change=recent[2]-recent[0];
  const direction=Math.abs(change)<=average*.1?"緩やかに推移しています":change>0?"上向きに推移しています":"落ち着く傾向です";
  return `${best+1}月が年間最高、直近3か月は${direction}。${annualTop?` 年間テーマ TOP10：${annualTop}`:""}`;
}
function renderYearChart(rows,yearValue){
  const el=$("yearChart"),detail=$("chartDetail"),legend=$("yearChartLegend"),summary=$("yearChartSummary"),w=760,h=320,pad={l:58,r:18,t:18,b:38};
  const currentYear=String(new Date().getFullYear()),pastColors=["#aeb7bc","#89959b","#66757c"],years=availableChartYears(yearValue);
  const series=years.map(year=>{
    const yearRows=year===String(yearValue)?rows:Array.from({length:12},(_,i)=>monthSummary(`${year}-${String(i+1).padStart(2,"0")}`));
    const states=yearRows.map((row,i)=>monthDetailState(`${year}-${String(i+1).padStart(2,"0")}`,row));
    const isCurrent=year===currentYear;
    const pastIndex=years.filter(candidate=>candidate!==currentYear).indexOf(year);
    return {year,rows:yearRows,states,isCurrent,color:isCurrent?"#009f91":pastColors[pastIndex%pastColors.length]};
  });
  const populated=series.filter(s=>s.states.some(state=>state.hasData));
  legend.innerHTML=series.map(s=>`<span><i class="annual-legend" style="background:${s.color}"></i>${japaneseEraYear(s.year)}</span>`).join("");
  const selectedSeries=series.find(s=>s.year===String(yearValue));
  summary.textContent=annualChartSummary(selectedSeries.rows,selectedSeries.states);
  if(!populated.length){
    el.innerHTML='<div class="chart-empty">年間データがまだありません。</div>';$('chartDetailMonth').textContent=`${yearValue}年`;
    ['chartDetailSales','chartDetailExpense','chartDetailProfit','chartDetailRate','chartDetailPatients','chartDetailUnit','chartDetailSurgeries','chartDetailNewPatients'].forEach(id=>$(id).textContent='—');
    $('chartDetailAi').textContent='入力データがないため、コメントはまだ生成できません。';return
  }
  const maxValue=Math.max(...populated.flatMap(s=>s.rows.map((r,i)=>s.states[i].hasData?r.sales:0)),1),step=1000000,max=Math.max(step,Math.ceil(maxValue/step)*step);
  const plotW=w-pad.l-pad.r,plotH=h-pad.t-pad.b,x=i=>pad.l+i*plotW/11,y=v=>pad.t+plotH*(1-Math.max(0,v)/max);
  const grid=`<line x1="${pad.l}" y1="${y(0)}" x2="${w-pad.r}" y2="${y(0)}" class="chart-grid chart-baseline"/>`+Array.from({length:max/step},(_,i)=>{const value=step*(i+1),py=y(value),label=`${(i+1)*100}万`;return `<line x1="${pad.l}" y1="${py}" x2="${w-pad.r}" y2="${py}" class="chart-grid"/><text x="${pad.l-9}" y="${py+4}" text-anchor="end" class="chart-axis-label">${label}</text>`}).join('');
  const months=Array.from({length:12},(_,i)=>`<text x="${x(i)}" y="${h-13}" text-anchor="middle" class="chart-month">${i+1}月</text>`).join('');
  const drawings=populated.map(s=>{
    const last=s.states.reduce((value,state,i)=>state.hasData?i:value,-1),points=s.rows.slice(0,last+1).map((row,i)=>[x(i),y(row.sales)]);
    // Deliberately use only straight SVG line segments: no Bezier/spline interpolation.
    const lines=points.slice(1).map((point,i)=>`<line pathLength="1" x1="${points[i][0]}" y1="${points[i][1]}" x2="${point[0]}" y2="${point[1]}" class="annual-line${s.isCurrent?' current-year-line':' past-year-line'}" stroke="${s.color}"/>`).join('');
    const hits=points.map((point,i)=>{const isLatest=s.isCurrent&&i===last;return `<g class="chart-hit${isLatest?' latest-month':''}" tabindex="0" role="button" aria-label="${s.year}年${i+1}月の数値を表示" data-year="${s.year}" data-index="${i}"><rect x="${Math.max(pad.l,x(i)-plotW/24)}" y="${pad.t}" width="${plotW/12}" height="${plotH}" fill="transparent"/><line x1="${x(i)}" y1="${pad.t}" x2="${x(i)}" y2="${h-pad.b}" class="focus-line"/><circle cx="${point[0]}" cy="${point[1]}" r="${isLatest?8:5}" class="annual-dot${s.isCurrent?' current-year-dot':' past-year-dot'}" fill="${s.color}"/></g>`}).join('');
    const valid=s.states.slice(0,last+1).map((state,i)=>state.hasData?i:-1).filter(i=>i>=0);
    const best=valid.reduce((best,i)=>s.rows[i].sales>s.rows[best].sales?i:best,valid[0]);
    const peak=s.year===String(yearValue)&&best!==undefined?points[best]:null;
    const labelWidth=124,labelX=peak?Math.max(pad.l,Math.min(peak[0]-labelWidth/2,w-pad.r-labelWidth)):0,labelY=peak?(peak[1]<48?peak[1]+10:peak[1]-29):0;
    const peakLabel=peak?`<g class="annual-peak-label" aria-hidden="true"><rect x="${labelX}" y="${labelY}" width="${labelWidth}" height="21" rx="10.5"/><text x="${labelX+labelWidth/2}" y="${labelY+14}" text-anchor="middle">最高 ${yen(s.rows[best].sales)}</text></g>`:'';
    return `<g class="annual-series">${lines}${hits}${peakLabel}</g>`;
  }).join('');
  el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${grid}${months}${drawings}</svg>`;
  const select=g=>{
    el.querySelectorAll('.chart-hit').forEach(node=>node.classList.toggle('selected',node===g));
    const i=Number(g.dataset.index),selected=series.find(s=>s.year===g.dataset.year),row=selected.rows[i],state=selected.states[i],profit=row.sales-row.expense,rate=row.sales?profit/row.sales*100:null;
    detail.classList.remove('detail-updating');void detail.offsetWidth;
    $('chartDetailMonth').textContent=`${japaneseEraYear(selected.year)}（${selected.year}年） ${i+1}月`;
    $('chartDetailSales').textContent=state.hasSales?yen(row.sales):'—';$('chartDetailExpense').textContent=state.hasExpense?yen(row.expense):'—';
    $('chartDetailProfit').textContent=state.hasSales&&state.hasExpense?yen(profit):'—';$('chartDetailRate').textContent=state.hasSales&&state.hasExpense&&rate!==null?pct(rate):'—';
    $('chartDetailPatients').textContent=state.hasClinical?`${Math.round(row.patients).toLocaleString("ja-JP")}件`:'—';$('chartDetailUnit').textContent=state.hasClinical&&state.hasSales&&row.patients>0?yen(row.sales/row.patients):'—';
    $('chartDetailSurgeries').textContent=state.hasClinical?`${Math.round(row.surgeries).toLocaleString("ja-JP")}件`:'—';$('chartDetailNewPatients').textContent=state.hasClinical?`${Math.round(row.newPatients).toLocaleString("ja-JP")}件`:'—';
    $('chartDetailAi').textContent=monthlyAiComment(state);detail.classList.add('detail-updating');
  };
  el.querySelectorAll('.chart-hit').forEach(g=>{g.addEventListener('click',e=>{e.stopPropagation();select(g)});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g)}})});
  const preferred=[...el.querySelectorAll(`.chart-hit[data-year="${yearValue}"]`)].at(-1)||el.querySelector('.chart-hit:last-of-type');select(preferred);
}

function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function animateNumber(el,to,formatter,duration=650){
  if(!el)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from=Number(el.dataset.value)||0,target=Number(to)||0;
  el.dataset.value=String(target);
  if(reduce||Math.abs(target-from)<1){el.textContent=formatter(target);return}
  const start=performance.now(),ease=t=>1-Math.pow(1-t,3);
  const tick=now=>{const t=clamp((now-start)/duration,0,1),v=from+(target-from)*ease(t);el.textContent=formatter(v);if(t<1)requestAnimationFrame(tick)};
  requestAnimationFrame(tick)
}
function renderBusinessInsights(rows,total,active,profit,rate,salesForecast,profitForecast,forecastContext=null){
  const activeRows=rows.filter(r=>r.sales>0||r.expense>0);
  const avgSales=active?total.sales/active:0;
  const salesScore=Math.round(clamp(avgSales/MONTHLY_TARGET*35,0,35));
  const profitScore=Math.round(clamp(rate/25*30,0,30));
  const recent=activeRows.slice(-3),previous=activeRows.slice(-6,-3);
  const recentAvg=recent.length?recent.reduce((a,r)=>a+r.sales,0)/recent.length:0;
  const previousAvg=previous.length?previous.reduce((a,r)=>a+r.sales,0)/previous.length:recentAvg;
  const growthRate=previousAvg?(recentAvg-previousAvg)/previousAvg*100:0;
  const growthScore=Math.round(clamp(8+growthRate*.7,0,15));
  const patientRatio=total.patients?total.newPatients/total.patients:0;
  const newScore=total.patients?Math.round(clamp(patientRatio/.08*10,0,10)):5;
  const checkupScore=total.patients?Math.round(clamp(total.checkups/Math.max(1,active*4)*8,0,8)):4;
  const secondScore=Math.round(clamp((total.secondOpinions||0)/Math.max(1,active*4)*4,0,4));
  const clinicalScore=Math.min(20,newScore+checkupScore+secondScore);
  const score=clamp(salesScore+profitScore+growthScore+clinicalScore,0,100);
  animateScoreRing($('scoreRing'),score,'--score',$('businessScore'));
  $('scoreSales').textContent=salesScore;$('scoreProfit').textContent=profitScore;$('scoreGrowth').textContent=growthScore;$('scoreClinical').textContent=clinicalScore;
  const grade=score>=85?'非常に好調':score>=70?'好調':score>=55?'安定':score>=40?'改善余地あり':'要確認';
  $('scoreSummary').textContent=`${grade}。売上・利益・成長性・診療KPI・専門相談を総合評価しています。`;
  let title='現在のペースを維持',comment='',tags=[];
  if(!active){title='データを入力してください';comment='月間売上と支出が登録されると、年間の経営コメントを自動生成します。';tags=['データ待ち']}
  else if(rate<10){title='利益率の立て直しを優先';comment=`年間利益率は${rate.toFixed(1)}%です。売上を追う前に、検査原価・薬品原価・人件費・単発支出を月別に確認すると改善点を見つけやすくなります。`;tags=['利益率','支出確認']}
  else if(avgSales<MONTHLY_TARGET*.9){title='500万円への差を小さくする';comment=`平均月商は${yen(avgSales)}です。年末売上予測は${yen(salesForecast)}。健診・予防・再診フォローを毎月1つずつ定例化すると、無理なく底上げしやすい状態です。`;tags=['売上目標','再診','健診']}
  else if(growthRate<-5){title='直近3か月の減速を確認';comment=`直近3か月の平均売上は、その前の3か月より約${Math.abs(growthRate).toFixed(1)}%低下しています。季節要因か予約枠の問題かを切り分け、来院件数と客単価のどちらが動いたか確認しましょう。`;tags=['トレンド','来院件数','客単価']}
  else if(rate>=20&&avgSales>=MONTHLY_TARGET){title='質の高い成長を維持';comment=`平均月商は${yen(avgSales)}、年間利益率は${rate.toFixed(1)}%です。売上と利益の両方が良好なので、新しい設備投資よりも診療負荷とスタッフ体制の安定を優先する局面です。`;tags=['好調','利益確保','負荷管理']}
  else{title='売上は順調、利益をもう一段';comment=`年末利益予測は${yen(profitForecast)}、年間利益率は${rate.toFixed(1)}%です。高単価施策を増やすより、既存の健診・画像検査・再診提案を漏れなく行うほうが安定した改善につながります。`;tags=['安定成長','利益率','既存施策']}
  if(forecastContext&&forecastContext.confidence.level<=2&&forecastContext.stableForecast>profitForecast){comment+=`${comment?' ':''}短期利益予測だけでなく、安定利益予測との差を確認してください。`;tags.push('予測差')}
  $('yearAiTitle').textContent=title;$('yearAiComment').textContent=comment;$('yearAiTags').innerHTML=tags.map(t=>`<span>${t}</span>`).join('');
}

function renderMonthlyProfitForecast(){
  const m=monthNow(),s=monthSummary(m),today=iso(),entries=operatingEntries(s.entries.filter(entry=>entry.date<=today)).sort((a,b)=>a.date.localeCompare(b.date));
  const businessDays=entries.length,scheduledBusinessDays=Number(data.settings[m]?.businessDays)||expectedBusinessDays(m),currentProfit=s.sales-s.expense;
  const historicalMonths=Array.from({length:6},(_,index)=>monthSummary(monthShift(m,index-6))).map(past=>{
    const sameDayEntries=operatingEntries(past.entries).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,businessDays),sameDaySales=sum(sameDayEntries).sales;
    return{sales:past.sales,expense:past.expense,profit:past.sales-past.expense,sameDayProfitRate:sameDaySales?(sameDaySales-past.expense)/sameDaySales:undefined};
  });
  const configuredAnnualTarget=Number(data.finance.incomeTarget)||0,targetProfit=configuredAnnualTarget?configuredAnnualTarget/12:0;
  const calculate=(visibleEntries,previousForecast=null)=>{const entrySales=sum(visibleEntries).sales,currentSales=entrySales+s.ecSales;return MonthlyProfitForecast.calculate({currentProfit:currentSales-s.expense,currentSales,currentExpense:s.expense,fixedExpense:Math.max(0,s.expense-s.cardFee),variableExpense:s.cardFee,businessDays:visibleEntries.length,scheduledBusinessDays,historicalMonths,targetProfit,previousForecast})};
  const previousEntries=entries.slice(0,-1),previous=previousEntries.length?calculate(previousEntries):null,result=calculate(entries,previous?.forecastProfit),formatApprox=value=>`約${Math.round((Number(value)||0)/10000).toLocaleString("ja-JP")}万円`;
  $("monthEndCurrentProfit").textContent=yen(result.currentProfit);$("monthEndForecastProfit").textContent=formatApprox(result.forecastProfit);$("monthEndTargetProfit").textContent=yen(result.targetProfit);$("monthEndAchievement").textContent=`${Math.round(result.achievementRate)}%`;
  $("monthEndForecastType").textContent=result.confidence.label;$("monthEndConfidence").textContent=result.confidence.stars;$("monthEndConfidence").setAttribute("aria-label",`5段階中${result.confidence.level}`);$("monthEndConfidenceSub").textContent=`営業日 ${result.confidence.days}日`;
  $("monthEndModel").textContent=result.method;
  if(result.difference===null){$("monthEndDifference").textContent="比較データなし";$("monthEndPreviousForecast").textContent=""}else{const improved=result.difference>=0;$("monthEndDifference").textContent=`${improved?"＋":"−"}${Math.round(Math.abs(result.difference)/10000).toLocaleString("ja-JP")}万円${improved?"改善":"悪化"}`;$("monthEndPreviousForecast").textContent=`昨日予測 ${formatApprox(previous.forecastProfit)}`}
  $("monthEndKagemushaComment").textContent=`🥷 ${result.comment}`;
  return result;
}

function renderCashFlowForecast(profitForecast){
  const m=monthNow(),mf=data.financeByMonth[m]||{},f=data.finance||{},s=monthSummary(m),prev=financeSnapshot(monthShift(m,-1));
  const value=key=>Number(mf[key]??f[key])||0,salary=value("personnelExpense"),medical=value("medicalExpense"),card=value("cardFee"),lease=value("leaseExpense")||value("repayment"),rent=value("rentExpense"),tax=value("taxExpense");
  const itemized=salary+medical+card+lease+rent+tax,other=value("otherExpense")||Math.max(0,value("monthlyExpense")-itemized);
  const result=CashFlowForecast.calculate({balance:value("balance"),currentSales:s.sales,projectedSales:profitForecast.projectedSales,uncollected:value("uncollectedIncome"),otherIncome:value("otherIncome"),payments:{salary,rent,medical,card,lease,tax,other},previousBalance:(prev.balance||Object.prototype.hasOwnProperty.call(data.financeByMonth,monthShift(m,-1)))?prev.balance:null,currentProfit:profitForecast.currentProfit,previousMedicalExpense:Number(data.financeByMonth[monthShift(m,-1)]?.medicalExpense)||0,dayOfMonth:new Date().getDate()});
  $("cashFlowBalance").textContent=yen(result.balance);$("cashFlowIncoming").textContent=yen(result.incoming);$("cashFlowOutgoing").textContent=yen(result.outgoing);$("cashFlowForecastBalance").textContent=yen(result.forecastBalance);
  $("cashFlowIncomingDetail").textContent=`売上予測 ${yen(result.receipts.salesForecast)}・未回収 ${yen(result.receipts.uncollected)}・その他 ${yen(result.receipts.otherIncome)}`;
  $("cashFlowOutgoingDetail").textContent=`給与 ${yen(salary)}・家賃 ${yen(rent)}・薬品 ${yen(medical)}・カード ${yen(card)}・リース ${yen(lease)}・税金 ${yen(tax)}・その他 ${yen(other)}`;
  const comparison=result.monthOverMonth===null?"前月比 比較データなし":`前月比 ${result.monthOverMonth>=0?"＋":"−"}${Math.round(Math.abs(result.monthOverMonth)/10000).toLocaleString("ja-JP")}万円`;
  $("cashFlowComparison").textContent=comparison;$("cashFlowStars").textContent=result.safety.stars;$("cashFlowStars").setAttribute("aria-label",`5段階中${result.safety.level}`);$("cashFlowSafetyBadge").textContent=`安全度 ${result.safety.level}/5`;
  document.querySelector(".cash-flow-forecast").dataset.tone=result.safety.tone;$("cashFlowComment").textContent=`🥷 ${result.comment}`;
}

function annualForecastSource(y=String(new Date().getFullYear())){
  const rows=Array.from({length:12},(_,i)=>monthSummary(`${y}-${String(i+1).padStart(2,"0")}`)),total=rows.reduce((a,r)=>({sales:a.sales+(Number(r.sales)||0),expense:a.expense+(Number(r.expense)||0)}),{sales:0,expense:0}),active=rows.filter(r=>r.sales>0||r.expense>0).length;
  const latestIndex=rows.reduce((last,row,index)=>row.sales>0||row.expense>0?index:last,-1),latestMonth=latestIndex>=0?`${y}-${String(latestIndex+1).padStart(2,"0")}`:null;
  const recentMonths=[...new Set([...Object.keys(data.historical||{}),...data.entries.map(entry=>entry.date.slice(0,7))])].filter(month=>!latestMonth||month<=latestMonth).sort().map(month=>monthSummary(month)).filter(row=>row.sales>0);
  const recordedDays=latestMonth?new Set(data.entries.filter(entry=>entry.date.startsWith(latestMonth)).map(entry=>entry.date)).size:0,businessDays=latestMonth&&latestMonth<monthNow()?21:recordedDays;
  return {yearSales:total.sales,yearExpense:total.expense,activeMonths:active,recentMonths,businessDays};
}
function renderAnnualManagementStatus(){
  if(typeof AnnualManagementStatus==="undefined"||!$("annualManagementCard"))return;
  const today=iso(),yearValue=today.slice(0,4),month=monthNow(),monthIndex=Number(month.slice(5)),todayEntry=data.entries.find(entry=>entry.date===today),current=monthSummary(month);
  const rows=Array.from({length:12},(_,index)=>monthSummary(`${yearValue}-${String(index+1).padStart(2,"0")}`));
  const total=rows.reduce((value,row)=>({sales:value.sales+row.sales,expense:value.expense+row.expense}),{sales:0,expense:0}),activeMonths=rows.filter(row=>row.sales>0||row.expense>0).length;
  const monthTarget=Number(data.settings[month]?.target)||MONTHLY_TARGET,annualTarget=Array.from({length:12},(_,index)=>Number(data.settings[`${yearValue}-${String(index+1).padStart(2,"0")}`]?.target)||MONTHLY_TARGET).reduce((value,target)=>value+target,0);
  const monthDays=Math.max(1,Number(data.settings[month]?.businessDays)||expectedBusinessDays(month)),done=new Set(operatingEntries(current.entries.filter(entry=>entry.date<=today)).map(entry=>entry.date)).size,monthForecast=done?current.sales/done*monthDays:current.sales;
  const previousYear=String(Number(yearValue)-1),priorCompleted=Array.from({length:monthIndex-1},(_,index)=>`${previousYear}-${String(index+1).padStart(2,"0")}`),hasStoredMonth=value=>Object.prototype.hasOwnProperty.call(data.historical||{},value)||data.entries.some(entry=>entry.date.startsWith(`${value}-`));
  const comparableDate=`${previousYear}${today.slice(4)}`,priorCurrentEntries=data.entries.filter(entry=>entry.date.startsWith(`${previousYear}-${today.slice(5,7)}-`)&&entry.date<=comparableDate),previousComparable=priorCompleted.every(hasStoredMonth)&&priorCurrentEntries.length>0;
  const previousSales=previousComparable?priorCompleted.reduce((value,period)=>value+monthSummary(period).sales,0)+sum(priorCurrentEntries).sales:0,currentComparableSales=rows.slice(0,monthIndex-1).reduce((value,row)=>value+row.sales,0)+sum(current.entries.filter(entry=>entry.date<=today)).sales;
  const result=AnnualManagementStatus.build({annualSales:total.sales,annualExpense:total.expense,currentComparableSales,activeMonths,annualTarget,monthTarget,hasAnnualData:activeMonths>0,todayHasData:Boolean(todayEntry&&(Number(todayEntry.sales)>0||Number(todayEntry.patients)>0)),todaySales:Number(todayEntry?.sales)||0,todayTarget:clinicDayInfo(today).target,monthHasData:done>0||current.sales>0,monthForecast,previousComparable,previousSales});
  const shortLabel=key=>result.status[key]==="insufficient"?"—":result.labels[key].split(" ")[0],formatMan=value=>`${Math.round(value/10000).toLocaleString("ja-JP")}万円`;
  $("annualTodayStatus").textContent=shortLabel("today");$("annualMonthStatus").textContent=shortLabel("month");$("annualYearStatus").textContent=shortLabel("annual");$("annualManagementBadge").textContent=result.labels.annual;
  $("annualManagementCard").dataset.tone=result.status.annual;$("annualManagementSales").textContent=activeMonths?formatMan(result.sales):"—";$("annualManagementProfit").textContent=activeMonths?formatMan(result.profit):"—";
  $("annualManagementYoY").textContent=result.yoy==null?"—":`${result.yoy>=0?"＋":"−"}${Math.abs(result.yoy).toFixed(1)}%`;$("annualManagementProgress").textContent=result.progress==null?"—":`${result.progress.toFixed(1)}%`;$("annualManagementComment").textContent=result.comment;
}
function year(){
  const y=$("yearPicker").value||String(new Date().getFullYear()),rows=Array.from({length:12},(_,i)=>monthSummary(`${y}-${String(i+1).padStart(2,"0")}`));
  const total=rows.reduce((a,r)=>{["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(k=>a[k]+=Number(r[k])||0);a.expense+=Number(r.expense)||0;return a},{sales:0,expense:0,patients:0,newPatients:0,surgeries:0,checkups:0,trimmings:0,secondOpinions:0});
  const activeRows=rows.filter(r=>r.sales>0||r.expense>0),active=activeRows.length,profit=total.sales-total.expense,rate=total.sales?profit/total.sales*100:0;
  const annualFactor=active?12/active:0,salesForecast=total.sales*annualFactor,profitForecast=profit*annualFactor;
  const forecastContext=AnnualProfitForecast.calculate(annualForecastSource(y));
  const best=activeRows.reduce((a,r)=>r.sales>a.sales?r:a,{sales:0});
  const incomeTarget=Number(data.finance.incomeTarget)||0;
  animateNumber($("yearSales"),total.sales,yen);animateNumber($("yearProfit"),profit,yen);animateNumber($("yearProfitRate"),rate,pct);animateNumber($("yearAvg"),active?total.sales/active:0,yen);
  $("yearSalesSub").textContent=`${active}か月分の集計`;$("yearProfitSub").textContent=`年間支出 ${yen(total.expense)}`;$("yearProfitRateSub").textContent=rate>=20?'良好な水準':rate>=10?'安定圏':'要確認';$("yearAvgSub").textContent=`月平均利益 ${yen(active?profit/active:0)}`;
  animateNumber($("estimatedIncome"),profitForecast,yen);$("estimatedIncomeSub").textContent=active?`${active}か月の実績から年換算`:'データ入力後に表示';
  animateNumber($("yearSalesForecast"),salesForecast,yen);animateNumber($("yearProfitForecast"),profitForecast,yen);animateNumber($("yearStableProfitForecast"),forecastContext.stableForecast,yen);animateNumber($("bestMonthSales"),best.sales,yen);
  $("yearStableProfitSub").textContent=forecastContext.stableMonths?`直近${forecastContext.stableMonths}か月平均利益率から予測`:'利益率データ入力後に表示';
  $("yearForecastConfidence").textContent=forecastContext.confidence.stars;$("yearForecastConfidence").setAttribute("aria-label",`5段階中${forecastContext.confidence.level}`);$("yearForecastConfidenceSub").textContent=`営業日 ${forecastContext.confidence.days}日`;
  if(incomeTarget>0){const progress=Math.max(0,Math.min(100,profitForecast/incomeTarget*100));$("incomeProgressText").textContent=`目標 ${yen(incomeTarget)}に対して ${progress.toFixed(0)}%`;$("incomeProgressBar").style.width=`${progress}%`}else{$("incomeProgressText").textContent='目標年収は財務タブで設定できます';$("incomeProgressBar").style.width='0%'}
  const monthlyProfitForecast=renderMonthlyProfitForecast();
  renderCashFlowForecast(monthlyProfitForecast);
  renderBusinessInsights(rows,total,active,profit,rate,salesForecast,profitForecast,forecastContext);
  renderYearChart(rows,y);renderStrategyMap()
}

function financeSnapshot(month){
  const mf=data.financeByMonth[month]||{},f=data.finance;
  return {
    balance:Number(mf.balance ?? (month===monthNow()?f.balance:0))||0,
    loan:Number(mf.loan ?? (month===monthNow()?f.loan:0))||0,
    repayment:Number(mf.repayment ?? (month===monthNow()?f.repayment:0))||0
  };
}
function calcManagementScore(s,month){
  const setting=data.settings[month]||{},target=Number(setting.target)||MONTHLY_TARGET;
  const sales=Number(s.sales)||0,patients=Number(s.patients)||0,newPatients=Number(s.newPatients)||0;
  const second=Number(s.secondOpinions)||0,checkups=Number(s.checkups)||0;
  const activeDays=new Set((s.entries||[]).map(e=>e.date)).size;
  const expense=Number(s.expense)||0,profit=sales-expense,rate=sales?profit/sales*100:0;
  const snap=financeSnapshot(month),prevSnap=financeSnapshot(monthShift(month,-1));
  const netAssets=snap.balance-snap.loan,prevNetAssets=prevSnap.balance-prevSnap.loan;
  const salesScore=Math.round(clamp(sales/Math.max(1,target)*25,0,25));
  const profitScore=Math.round(clamp(rate/25*15,0,15));
  const opEntries=operatingEntries(s.entries||[]);const patientTarget=Math.max(1,opEntries.reduce((a,e)=>a+clinicDayInfo(e.date).patientsTarget,0)||activeDays*(Number(data.clinic.fullDayPatients)||17.5));
  const averagePatients=activeDays?patients/activeDays:0;
  const patientScore=Math.round(ClinicalEfficiency.patientScore(averagePatients)/100*15);
  const newTarget=Math.max(1,activeDays*0.8);
  const newScore=Math.round(clamp(newPatients/newTarget*10,0,10));
  const secondTarget=Math.max(1,activeDays*0.3);
  const secondScore=Math.round(clamp(second/secondTarget*10,0,10));
  const checkupTarget=Math.max(1,activeDays*0.45);
  const checkupScore=Math.round(clamp(checkups/checkupTarget*10,0,10));
  let assetScore=0;
  if(snap.balance||snap.loan){
    assetScore=netAssets>0?5:Math.round(clamp((netAssets+5000000)/5000000*5,0,5));
    if(prevSnap.balance||prevSnap.loan){assetScore+=Math.round(clamp((netAssets-prevNetAssets)/1000000*5+2.5,0,5))}
    else assetScore+=netAssets>0?3:0;
  }
  const consistencyScore=activeDays>=20?5:activeDays>=12?4:activeDays>=6?3:activeDays>=3?2:activeDays?1:0;
  const breakdown={sales:salesScore,profit:profitScore,patients:patientScore,newPatients:newScore,second:secondScore,checkups:checkupScore,assets:assetScore,consistency:consistencyScore};
  const score=Math.round(clamp(Object.values(breakdown).reduce((a,b)=>a+b,0),0,100));
  return {score,breakdown,rate,activeDays,netAssets,profit,target};
}
function calcBrandScore(s,month){return calcManagementScore(s,month).score}
function monthShift(m,delta){const [y,mo]=m.split("-").map(Number),d=new Date(y,mo-1+delta,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function renderBrandSparkline(month,score){
  const months=Array.from({length:6},(_,i)=>monthShift(month,i-5)),values=months.map(x=>calcBrandScore(monthSummary(x),x));values[5]=score;
  const svg=$("brandSparkline"),w=190,h=72,p=6,min=Math.min(...values,30),max=Math.max(...values,70),range=Math.max(1,max-min);
  const pts=values.map((v,i)=>[p+i*(w-p*2)/(values.length-1),h-p-(v-min)/range*(h-p*2)]);
  const line=smoothPath(pts),area=`${line} L${pts.at(-1)[0]},${h-p} L${pts[0][0]},${h-p} Z`;
  svg.innerHTML=`<defs><linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#009f91" stop-opacity=".22"/><stop offset="1" stop-color="#009f91" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#brandFill)"/><path d="${line}" fill="none" stroke="#008f83" stroke-width="3" stroke-linecap="round"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="5" fill="#008f83"/>`;
  return values.at(-2)||0;
}
function renderBrandScore(s,m){
  const result=calcManagementScore(s,m),score=result.score,prev=renderBrandSparkline(m,score),delta=score-prev,b=result.breakdown;
  animateNumber($("brandScore"),score,v=>String(Math.round(v)),600);
  $("brandDelta").textContent=`${delta>0?"+":delta<0?"−":"±"}${Math.abs(delta)}`;
  $("brandDelta").className=delta>0?"positive":delta<0?"negative":"";
  const rank=score>=95?"S":score>=90?"A+":score>=80?"A":score>=70?"B":score>=60?"C":"D";
  $("managementRank").textContent=rank;
  $("managementBreakdown").innerHTML=[
    ["売上",b.sales,25],["利益",b.profit,15],["来院",b.patients,15],["新患",b.newPatients,10],
    ["SO",b.second,10],["健診",b.checkups,10],["純資産",b.assets,10],["継続入力",b.consistency,5]
  ].map(x=>`<span>${x[0]} <b>${x[1]}</b>/${x[2]}</span>`).join("");
  let comment="日次記録と財務情報を入力すると、病院経営を100点満点で評価します。";
  if(result.activeDays){
    const weak=Object.entries(b).sort((a,c)=>a[1]/({sales:25,profit:15,patients:15,newPatients:10,second:10,checkups:10,assets:10,consistency:5}[a[0]])-c[1]/({sales:25,profit:15,patients:15,newPatients:10,second:10,checkups:10,assets:10,consistency:5}[c[0]]))[0]?.[0];
    const labels={sales:"売上目標",profit:"利益率",patients:"来院件数",newPatients:"新患数",second:"セカンドオピニオン",checkups:"健診件数",assets:"実質純資産",consistency:"入力日数"};
    comment=`${rank}ランク。現在は「${labels[weak]}」が最も改善余地の大きい項目です。`;
  }
  $("brandComment").textContent=comment;
}
function finance(){
  const m=$("monthPicker").value||monthNow(),f=data.finance,mf=data.financeByMonth[m]||{},hist=data.historical[m]||{},expense=Number(mf.monthlyExpense ?? hist.expense ?? (m===monthNow()?f.monthlyExpense:0))||0;
  const snap=financeSnapshot(m);$("balance").value=snap.balance||"";$("monthlyExpense").value=expense||"";$("personnelExpense").value=Number(mf.personnelExpense ?? (m===monthNow()?f.personnelExpense:0))||"";$("medicalExpense").value=Number(mf.medicalExpense ?? (m===monthNow()?f.medicalExpense:0))||"";$("cardFee").value=Number(mf.cardFee ?? (m===monthNow()?f.cardFee:0))||"";$("loan").value=snap.loan||"";$("repayment").value=snap.repayment||"";$("incomeTarget").value=f.incomeTarget||"";
  const s=monthSummary(m);$("morikuboOnline").value=s.morikuboOnline||"";$("royalCanin").value=s.royalCanin||"";$("purina").value=s.purina||"";
  const profit=s.sales-expense,rate=s.sales?profit/s.sales*100:0,prevM=monthShift(m,-1),prevS=monthSummary(prevM),prevProfit=prevS.sales-prevS.expense,prevRate=prevS.sales?prevProfit/prevS.sales*100:0;
  renderBrandScore(s,m);$("financeTotalSales").textContent=yen(s.sales);$("financeEcSales").textContent=yen(s.ecSales);$("monthProfit").textContent=yen(profit);$("profitRate").textContent=pct(rate);$("netAssets").textContent=yen(snap.balance-snap.loan);
  const pd=profit-prevProfit,rd=rate-prevRate;$("profitDelta").textContent=prevS.sales?`前月比 ${pd>=0?"+":"−"}${yen(Math.abs(pd))}`:"前月比 —";$("rateDelta").textContent=prevS.sales?`前月比 ${rd>=0?"+":"−"}${Math.abs(rd).toFixed(1)}pt`:"前月比 —";
  $("profitDelta").className=pd>0?"positive":pd<0?"negative":"";$("rateDelta").className=rd>0?"positive":rd<0?"negative":"";
}
function saveFinance(){const m=$("monthPicker").value||monthNow();if(m!==monthNow())return toast("過去月は閲覧のみです");const ec={morikuboOnline:num("morikuboOnline"),royalCanin:num("royalCanin"),purina:num("purina")},expenses={personnelExpense:num("personnelExpense"),medicalExpense:num("medicalExpense"),cardFee:num("cardFee")},entered={personnelExpense:$("personnelExpense").value.trim()!=="",medicalExpense:$("medicalExpense").value.trim()!=="",cardFee:$("cardFee").value.trim()!==""};data.finance={balance:num("balance"),monthlyExpense:num("monthlyExpense"),loan:num("loan"),repayment:num("repayment"),incomeTarget:num("incomeTarget"),...ec,...expenses};data.financeByMonth[m]={...(data.financeByMonth[m]||{}),monthlyExpense:num("monthlyExpense"),balance:num("balance"),loan:num("loan"),repayment:num("repayment"),...ec,...expenses,entered};save();finance();month();renderMonthlyReport();year();toast(`${m}の財務・EC売上を保存しました`)}

function reportMonth(){return $("reportMonthPicker")?.value||$("monthPicker").value||monthNow()}
function monthLabel(m){const [y,mo]=m.split("-").map(Number);return `${y}年${mo}月`}
function expenseItem(label,current,previous,reason){
  if(!current.entered)return `<article><div><span>⚪</span><strong>${label}</strong></div><b>—</b><p>未入力です。財務画面から入力すると分析できます。</p></article>`;
  const hasPrev=previous.entered,diff=hasPrev?current.value-previous.value:0,mark=!hasPrev?"⚪":diff<=Math.max(previous.value*.12,30000)?"🟢":"🟡";
  const detail=current.value===0?"0円として入力されています。":reason;
  return `<article><div><span>${mark}</span><strong>${label}</strong></div><b>${yen(Math.abs(current.value))}</b><p>${detail}${hasPrev?` 前月比${diff>=0?"＋":"−"}${yen(Math.abs(diff))}です。`:""}</p></article>`
}
function clamp(v,min,max){return Math.min(max,Math.max(min,v))}
function scoreByRatio(ratio,max,neutral=.67){
  if(!Number.isFinite(ratio)||ratio<=0)return Math.round(max*neutral);
  return Math.round(clamp(ratio,0,1)*max)
}
function reportScoreModel(s,prev,target,current){
  const profit=s.sales-s.expense,rate=s.sales?profit/s.sales*100:0,unit=s.patients?s.sales/s.patients:0;
  const prevProfit=prev.sales-prev.expense,prevRate=prev.sales?prevProfit/prev.sales*100:0,prevUnit=prev.patients?prev.sales/prev.patients:0;
  const progress=target?s.sales/target:0;
  const salesScore=Math.round(clamp(progress,0,1)*30);
  const profitScore=Math.round(clamp(rate/30,0,1)*25);
  const activeDays=Math.max(1,new Set((s.entries||[]).map(e=>e.date)).size),averagePatients=s.patients/activeDays;
  const patientsScore=Math.round(ClinicalEfficiency.patientScore(averagePatients)/100*15);
  const unitScore=prevUnit?scoreByRatio(unit/prevUnit,15):Math.round(15*.67);
  const categorized=s.personnelExpense+s.medicalExpense+s.cardFee,prevCategorized=prev.personnelExpense+prev.medicalExpense+prev.cardFee;
  let expenseScore=7;
  if(s.sales&&categorized){
    const expenseRatio=categorized/s.sales,prevExpenseRatio=prev.sales&&prevCategorized?prevCategorized/prev.sales:null;
    if(expenseRatio<=.45)expenseScore=10;else if(expenseRatio<=.55)expenseScore=8;else if(expenseRatio<=.65)expenseScore=6;else expenseScore=3;
    if(prevExpenseRatio!==null&&expenseRatio>prevExpenseRatio+.05)expenseScore=Math.max(0,expenseScore-2);
  }
  let growthScore=3;
  if(prev.sales){
    const signals=[s.newPatients>=prev.newPatients,s.checkups>=prev.checkups,s.surgeries>=prev.surgeries];
    growthScore=signals.filter(Boolean).length>=2?5:signals.filter(Boolean).length===1?3:1;
  }
  const raw=salesScore+profitScore+patientsScore+unitScore+expenseScore+growthScore;
  const score=clamp(Math.round(raw),0,100);
  const grade=score>=95?'S':score>=90?'A':score>=80?'B':score>=70?'C':'D';
  let phrase='改善点を整理した月';
  if(progress>=1&&rate>=30&&unit>=prevUnit)phrase='診療の質で利益を伸ばした月';
  else if(progress>=1&&rate>=30)phrase='売上と利益を両立できた月';
  else if(progress>=1)phrase='売上目標を達成した月';
  else if(rate>=30)phrase='利益をしっかり守れた月';
  else if(prev.sales&&s.sales>prev.sales)phrase='成長の手応えが見えた月';
  const status=current?'途中経過・暫定評価':'確定月の評価';
  const comment=score>=90?'売上と利益率を中心に、経営の質が高い状態です。':score>=80?'全体として良好です。未達項目を一つずつ改善すると、さらに安定します。':score>=70?'一定の成果があります。売上・利益率・来院数のうち弱い項目を優先して確認しましょう。':'数字に改善余地があります。まず利益率と売上目標との差を確認しましょう。';
  return {score,grade,phrase,status,comment,parts:{sales:salesScore,profit:profitScore,patients:patientsScore,unit:unitScore,expense:expenseScore,growth:growthScore},rate,prevRate,unit,prevUnit};
}
function setKpiTone(id,tone){const el=$(id)?.closest('article');if(el){el.classList.remove('kpi-good','kpi-watch','kpi-neutral');el.classList.add(tone)}}

function advisorModel(s,prev,target,memoAnalysis){
  const profit=s.sales-s.expense,rate=s.sales?profit/s.sales*100:0,progress=target?s.sales/target*100:0;
  const unit=s.patients?s.sales/s.patients:0,prevUnit=prev.patients?prev.sales/prev.patients:0;
  const salesChange=prev.sales?(s.sales-prev.sales)/prev.sales*100:null;
  const patientChange=prev.patients?(s.patients-prev.patients)/prev.patients*100:null;
  const unitChange=prevUnit?(unit-prevUnit)/prevUnit*100:null;
  const used=new Set();
  const take=(items,fallback)=>{const item=items.find(x=>!used.has(x.key));if(!item)return fallback;used.add(item.key);return item.text};
  const discovery=[];
  if(salesChange!==null&&patientChange!==null&&unitChange!==null){
    if(salesChange>=0&&patientChange<0&&unitChange>0)discovery.push({key:"patients",text:"売上は客単価に支えられています。今の診療価値は保てていますが、来院数の減少を単価だけで補う経営にはしないことが大切です。"});
    if(salesChange<0&&patientChange>=0&&unitChange<0)discovery.push({key:"unit",text:"患者さんは来ているのに売上が伸びていません。件数不足より、検査・処置を含む診療内容が適切に提案できているかを見る月です。"});
    if(salesChange>0&&patientChange>0&&unitChange>0)discovery.push({key:"growth",text:"来院数と客単価がそろって伸びています。無理な値上げや一部の高額診療に偏らない、再現性のある成長に近づいています。"});
  }
  if(s.sales&&s.expense&&salesChange!==null&&salesChange>0&&rate<30)discovery.push({key:"margin",text:"売上の伸びが、そのまま利益の伸びにはつながっていません。今月は『いくら売ったか』より『何が利益を残さなかったか』を見極めるべきです。"});
  if(memoAnalysis.top[0])discovery.push({key:"memo-theme",text:`数字だけを見るより、院長メモで「${memoAnalysis.top[0].label}」が目立ったことに注目してください。今月の変化を説明する現場の手掛かりです。`});
  if(prev.sales&&Math.abs(salesChange)<=3)discovery.push({key:"flat-sales",text:"売上は前月とほぼ同じです。安定と見るだけでなく、来院数や客単価の中身が入れ替わっていないかを確認する時期です。"});

  const good=[];
  if(progress>=100&&rate>=30)good.push({key:"target",text:"目標を達成しながら利益率も守れました。売上を追うだけで診療現場を疲弊させず、今の運営水準を標準にできる状態です。"});
  if(rate>=35)good.push({key:"margin",text:"十分な利益を残せています。設備、人材、教育に投資できる余力をつくれたことが、今月いちばんの成果です。"});
  if(prev.newPatients&&s.newPatients>prev.newPatients)good.push({key:"new-patients",text:"新患が増えています。将来の再診につながる入口が広がっており、今月だけでなく数か月先の経営にも効く良い動きです。"});
  if(prev.surgeries&&s.surgeries>prev.surgeries)good.push({key:"surgery",text:"手術件数が伸びました。必要な治療を院内で完結できる力が、患者さんの信頼と病院の収益基盤の両方につながっています。"});
  if(prev.patients&&s.patients>=prev.patients)good.push({key:"patients",text:"来院件数を前月以上に保てました。既存患者さんとの関係が維持できていることは、売上額以上に安定経営を支える成果です。"});

  const caution=[];
  if(s.sales&&rate<20)caution.push({key:"margin",text:"利益率が低く、忙しさの割に手元へ利益が残りにくい状態です。支出を一律に削る前に、増えた費目と診療内容の対応を確認してください。"});
  if(patientChange!==null&&patientChange<=-10)caution.push({key:"patients",text:"来院数の落ち込みを見過ごさないでください。単月の季節要因で片づけず、再診漏れ、予約の取りづらさ、離脱の兆候を確認しましょう。"});
  if(unitChange!==null&&unitChange<=-10)caution.push({key:"unit",text:"客単価が下がっています。安易な単価引き上げではなく、必要な検査や予防提案が忙しさの中で抜けていないかを確認してください。"});
  if(progress<80&&s.sales)caution.push({key:"target",text:"目標との差が大きいままです。残り日数だけで無理に取り返そうとすると診療品質を崩します。まず不足の原因が来院数か客単価かを分けて考えましょう。"});
  if(!s.expense)caution.push({key:"missing-expense",text:"支出が未入力のため、売上が残る経営かどうか判断できません。売上だけで好不調を決めず、月次の支出を確認してから意思決定してください。"});

  const action=[];
  if(prev.newPatients&&s.newPatients>prev.newPatients)action.push({key:"new-patients",text:"増えた新患が次の来院につながったか、翌月に再診率を確認しましょう。受付時の次回案内までを一つの流れとして整えてください。"});
  if(s.checkups<10)action.push({key:"checkups",text:"来月は健診の案内対象を決め、会計時に声をかける運用を優先しましょう。全員に広く勧めるより、対象患者を確実に拾う方が続きます。"});
  if(rate<30&&s.expense)action.push({key:"margin",text:"来月の最初に支出上位3項目を確認し、売上に連動した増加か、見直せる固定的な支出かを分けてください。削減額より判断の習慣を作りましょう。"});
  if(patientChange!==null&&patientChange<0)action.push({key:"patients",text:"来月は来院が途切れている患者さんを一度洗い出し、必要な再診・予防の案内漏れをなくすことを優先しましょう。"});
  if(unitChange!==null&&unitChange<0)action.push({key:"unit",text:"診察から検査・治療説明までの流れを一度振り返り、必要な提案を遠慮なく伝えられる共通手順をスタッフと確認しましょう。"});
  if(progress>=100&&rate>=30)action.push({key:"target",text:"来月は売上の上積みより、予約の偏りとスタッフ負荷を確認してください。今の利益を守りながら診療品質を安定させることを優先しましょう。"});

  return {
    discovery:take(discovery,"今月は判断材料がまだ十分ではありません。まず日々の入力をそろえ、売上を来院数と客単価に分けて見るところから始めましょう。"),
    good:take(good,"大きな成果を急いで決める段階ではありません。それでも記録を続けていることが、感覚ではなく数字で経営判断する土台になっています。"),
    caution:take(caution,"今のところ強い警告はありません。ただし、好調な月ほど予約の偏りやスタッフの負荷が隠れやすいので、現場の無理がないか確認してください。"),
    action:take(action,"来月は新しい施策を増やすより、売上・来院数・客単価・支出を同じ日に確認する月次レビューを定着させましょう。")
  };
}

const NOTE_THEMES=[
  {key:"emergency",label:"救急・重症",words:["救急","緊急","重症","時間外","入院","ICU","熱中症","呼吸困難","ショック"]},
  {key:"surgery",label:"手術・処置",words:["手術","オペ","避妊","去勢","抜歯","歯科","麻酔","処置"]},
  {key:"new",label:"新患・集患",words:["新患","初診","Google","広告","口コミ","Instagram","インスタ","LINE","紹介"]},
  {key:"highValue",label:"高額・検査",words:["高額","検査","エコー","レントゲン","CT","MRI","内視鏡","健診","スクリーニング"]},
  {key:"staff",label:"スタッフ・採用",words:["看護師","スタッフ","実習","採用","応募","面接","教育","研修","トリマー"]},
  {key:"capacity",label:"混雑・診療負荷",words:["満枠","混雑","待ち","忙しい","キャパ","残業","予約外","飛び込み"]},
  {key:"seasonal",label:"季節性症例",words:["熱中症","皮膚","外耳炎","下痢","嘔吐","フィラリア","ノミ","ダニ","ワクチン"]},
  {key:"issue",label:"トラブル・課題",words:["クレーム","トラブル","ミス","キャンセル","機会損失","故障","不具合"]}
];
function cleanNoteText(v){return String(v||"").replace(/\s+/g," ").trim()}
function analyzeMonthNotes(entries){
  const rows=entries.map(e=>({date:e.date,note:cleanNoteText(e.note??e.memo)})).filter(x=>x.note);
  const themes=NOTE_THEMES.map(t=>({...t,count:rows.reduce((n,r)=>n+(t.words.some(w=>r.note.toLowerCase().includes(w.toLowerCase()))?1:0),0)})).filter(t=>t.count>0).sort((a,b)=>b.count-a.count);
  const top=themes.slice(0,3),excerpts=rows.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  let trend="今月はメモの記録がありません。日々の出来事を一言残すと、数値と診療内容を結び付けて振り返れます。";
  if(rows.length){
    if(top.length){
      const labels=top.map(t=>`${t.label}${t.count}日`).join("、");
      trend=`${rows.length}日分のメモを分析しました。特に「${labels}」の記録が目立ちます。数値の変化と重ねて、売上や診療負荷の背景を確認できます。`;
    }else{
      trend=`${rows.length}日分のメモがあります。特定テーマへの偏りは小さく、日々の診療内容が幅広く記録されています。`;
    }
  }
  return {rows,themes,top,excerpts,trend};
}
function renderReportMemoAnalysis(entries){
  const a=analyzeMonthNotes(entries),trendEl=$("reportMemoTrend"),tagsEl=$("reportMemoTags"),listEl=$("reportMemoExcerpts");
  if(trendEl)trendEl.textContent=a.trend;
  if(tagsEl){
    tagsEl.textContent="";
    a.top.forEach(t=>{const span=document.createElement("span");span.textContent=`${t.label} ${t.count}`;tagsEl.appendChild(span)});
  }
  if(listEl){
    listEl.textContent="";
    const items=a.excerpts.length?a.excerpts:[{date:"",note:"メモが蓄積されると、ここに今月の主な記録が表示されます。"}];
    items.forEach(x=>{const li=document.createElement("li");li.textContent=x.date?`${x.date.slice(5).replace("-","/")}　${x.note}`:x.note;listEl.appendChild(li)});
  }
  return a;
}

function renderMonthlyReport(){
  if(!$("reportMonthPicker"))return;
  const m=reportMonth(),s=monthSummary(m),previousMonth=monthShift(m,-1),prev=monthSummary(previousMonth),selectedFinance=ReportMonth.selectedFinance(data.financeByMonth,m),previousFinance=ReportMonth.selectedFinance(data.financeByMonth,previousMonth),cfg=data.settings[m]||{},target=Number(cfg.target)||MONTHLY_TARGET,profit=s.sales-s.expense,rate=s.sales?profit/s.sales*100:0,unit=s.patients?s.sales/s.patients:0,progress=target?s.sales/target*100:0;
  const monthlyEntries=renderMonthlyManagementScore(m,data.entries),availability=ReportMonth.reportAvailability({...s,entries:monthlyEntries});
  $("reportSales").textContent=yen(s.sales);$("reportProgress").textContent=pct(progress);$("reportProfit").textContent=yen(profit);$("reportProfitRate").textContent=pct(rate);$("reportPatients").textContent=`${s.patients}件`;$("reportUnit").textContent=yen(unit);$("reportNew").textContent=`${s.newPatients}件`;$("reportClinical").textContent=`${s.surgeries}件 / ${s.checkups}件`;
  const current=m===monthNow(),days=monthlyEntries.length,period=DateRanges.calendarMonthRange(m,iso());$("reportPeriod").textContent=`集計期間：${period.from}〜${period.to}`;$("reportStatus").textContent=availability.empty?`${monthLabel(m)}は集計途中です。入力データを待っています。`:current?`${monthLabel(m)}は集計途中です。${days}日分の入力データをもとに表示しています。`:`${monthLabel(m)}の月間レポート`;
  const model=availability.empty?null:reportScoreModel(s,prev,target,current||availability.provisional);
  const memoAnalysis=renderReportMemoAnalysis(s.entries);
  const advisor=availability.empty?{discovery:`${monthLabel(m)}は集計途中です。入力後に分析を表示します。`,good:"データ入力後に良かった点を表示します",caution:"データ入力後に改善点を表示します",action:"入力データを待っています。"}:advisorModel(s,prev,target,memoAnalysis);$("advisorDiscovery").textContent=advisor.discovery;$("advisorGood").textContent=advisor.good;$("advisorCaution").textContent=advisor.caution;$("advisorAction").textContent=advisor.action;
  $("reportPhrase").textContent=model?`「${model.phrase}」`:"「データ待ち」";$("reportGrade").textContent=model?model.grade:"—";animateScoreRing($("reportScoreRing"),model?model.score:null,"--report-score",$("reportScore"));$("reportScoreStatus").textContent=model?(availability.provisional?"少数データ・暫定評価":model.status):"集計途中";$("reportScoreComment").textContent=model?model.comment:`${Number(m.slice(5))}月の入力データがまだないため、評価は保留です。`;
  const parts=model?model.parts:{sales:"—",profit:"—",patients:"—",unit:"—",expense:"—",growth:"—"};$("reportScoreSales").textContent=parts.sales;$("reportScoreProfit").textContent=parts.profit;$("reportScorePatients").textContent=parts.patients;$("reportScoreUnit").textContent=parts.unit;$("reportScoreExpense").textContent=parts.expense;$("reportScoreGrowth").textContent=parts.growth;
  setKpiTone('reportSales',progress>=100?'kpi-good':progress>=85?'kpi-watch':'kpi-neutral');setKpiTone('reportProfitRate',rate>=30?'kpi-good':rate>=20?'kpi-watch':'kpi-neutral');setKpiTone('reportPatients',prev.patients&&s.patients>=prev.patients?'kpi-good':'kpi-neutral');setKpiTone('reportUnit',model?.prevUnit&&unit>=model.prevUnit?'kpi-good':'kpi-neutral');
  const salesDiff=s.sales-prev.sales,patientDiff=s.patients-prev.patients,unitPrev=prev.patients?prev.sales/prev.patients:0,unitDiff=unit-unitPrev;
  let driver="来院数と客単価の両方";if(Math.abs(patientDiff)>0&&Math.abs(unitDiff)<500)driver="主に来院件数";else if(Math.abs(unitDiff)>=500&&Math.abs(patientDiff)<5)driver="主に客単価";
  $("reportSalesAnalysis").textContent=availability.empty?`${monthLabel(m)}は集計途中です。入力後に前月比較を表示します。`:prev.sales?`総売上は${yen(s.sales)}で、前月比${salesDiff>=0?"＋":"−"}${yen(Math.abs(salesDiff))}です。${driver}が売上を支えています。月間目標に対する達成率は${pct(progress)}です。`:`総売上は${yen(s.sales)}、目標達成率は${pct(progress)}です。前月データがないため前月比較は表示していません。`;
  $("reportExpenseAnalysis").innerHTML=expenseItem("人件費",selectedFinance.personnelExpense,previousFinance.personnelExpense,"ベースアップや勤務体制の変化と、売上に対する人件費率を確認します。")+expenseItem("薬品・医療材料費",selectedFinance.medicalExpense,previousFinance.medicalExpense,"診療件数や検査・治療内容の増加に伴う変動かを確認します。")+expenseItem("カード決済手数料",selectedFinance.cardFee,previousFinance.cardFee,"カード売上の増加に比例した範囲かを確認します。");
  const good=[];if(progress>=100)good.push("月間売上目標を達成しました");if(rate>=30)good.push("利益率30%以上を維持しました");if(prev.patients&&s.patients>=prev.patients)good.push("来院件数が前月以上でした");if(unitPrev&&unit>=unitPrev)good.push("客単価が前月を上回りました");if(prev.checkups&&s.checkups>prev.checkups)good.push("健診件数が増加しました");
  const improve=[];if(progress<100)improve.push(`目標まであと${yen(Math.max(0,target-s.sales))}です`);if(rate<30&&s.sales)improve.push("利益率30%に向けて支出率を確認する余地があります");if(prev.patients&&s.patients<prev.patients)improve.push("来院件数が前月を下回っています");if(unitPrev&&unit<unitPrev)improve.push("客単価が前月を下回っています");if(!s.checkups)improve.push("健診件数を増やす余地があります");
  $("reportGoodPoints").innerHTML=(availability.empty?["データ入力後に良かった点を表示します"]:good.slice(0,3).length?good.slice(0,3):["データが増えると良かった点を表示します"]).map(x=>`<li>${x}</li>`).join("");$("reportImprovePoints").innerHTML=(availability.empty?["データ入力後に改善点を表示します"]:improve.slice(0,3).length?improve.slice(0,3):["現時点で大きな改善警告はありません"]).map(x=>`<li>${x}</li>`).join("");
  const autoLearning=rate>=30?"支出が増えても、売上と利益率を同時に確認することで、成長投資か利益圧迫かを判断できた月でした。":"売上だけでなく支出構成を確認し、利益率を保つことの重要性が見えた月でした。";const saved=data.monthlyReports?.[m]?.learningText;$("reportLearning").value=saved||autoLearning;$("reportLearningStatus").textContent=saved?"保存済み":"自動案";
  const goals=[];goals.push(`月間売上${yen(target)}以上`);goals.push("利益率30%以上を維持");if(s.checkups<10)goals.push("健診10件以上");else if(unit)goals.push(`客単価${yen(Math.round(unit/1000)*1000)}以上を維持`);$("reportNextGoals").innerHTML=goals.slice(0,3).map(x=>`<li>${x}</li>`).join("");
  const condition=progress>=100&&rate>=30?"売上と利益の両面で好調":"改善余地を確認しながら前進",memoContext=memoAnalysis.top.length?` 日々のメモでは${memoAnalysis.top.map(x=>x.label).join("・")}の記録が目立ち、数値変化の背景として注目されます。`:"",monthlyTop=KnowledgeCore.rank(data.successLibrary,{limit:5}).map(item=>item.theme).join("・");$("reportSummary").textContent=availability.empty?`${monthLabel(m)}は集計途中です。入力データがそろうまで月間総括を保留します。`:`${monthLabel(m)}は「${condition}」な月です。${driver}が売上を支え、利益率は${pct(rate)}でした。${memoContext}支出では人件費・薬品医療材料費・カード決済手数料の3項目に絞って変化を確認し、来月は売上目標と利益率を両立させることが重点です。${monthlyTop?` Knowledge Core TOP5：${monthlyTop}。`:""}`;
}

function renderClinicalIntelligence(){
 try{
  const list=$("clinicalIntelligenceInsights");if(!list||typeof ClinicalIntelligence==="undefined")return;
  const analysis=ClinicalIntelligence.analyze(data?.entries??[],{closedDates:data?.clinic?.closedDates??[]}),r=analysis.readiness;
  const titles={collecting:"診療データ蓄積中",preliminary:"参考提案",ready:"改善提案",mature:"直近60営業日から提案"};
  $("clinicalIntelligenceStatus").textContent=titles[r.status];
  const guidance={collecting:"10営業日から参考分析を開始します。",preliminary:"30営業日から本格分析を開始します。",ready:"分析中",mature:"直近60営業日を中心に継続分析中"};
  $("clinicalIntelligenceProgress").textContent=`診療データ：${r.sampleDays}営業日 · ${guidance[r.status]}`;
  if(!analysis.insights.length){list.innerHTML='<p class="management-insights-empty">診療データが蓄積されると、<br>改善ポイントを自動提案します。</p>';return}
  list.innerHTML=analysis.insights.slice(0,3).map(insight=>`<section class="management-insight"><div class="management-insight-heading"><h4>📈 ${escapeHtml(insight.title)}</h4><span class="management-importance" aria-label="重要度 ${insight.importance} / 5">${"★".repeat(insight.importance)}${"☆".repeat(5-insight.importance)}</span></div><p class="management-evidence">${escapeHtml(insight.message)}</p><div class="management-actions"><strong>おすすめ</strong><ul>${insight.actions.map(action=>`<li>${escapeHtml(action)}</li>`).join("")}</ul></div><div class="management-effect"><span>期待効果</span><strong>${escapeHtml(insight.effect)}</strong></div></section>`).join("");
 }catch(error){console.error(error)}
}
function clinicalTrendAnalysis(){return ClinicalTrends.analyzeClinicalTrends(data.entries,{periodDays:90,today:iso(),closedDates:data.clinic?.closedDates})}
function trendValue(value,suffix=""){return value==null?"—":`${Math.round(value).toLocaleString("ja-JP")}${suffix}`}
function renderClinicalTrends(){
  if(!$("clinicalTrendInsights"))return;const analysis=clinicalTrendAnalysis();
  $("clinicalTrendConfidence").textContent=`信頼度：${analysis.confidence}`;
  $("clinicalTrendPeriod").textContent=`${analysis.period.from.replaceAll("-","/")}〜${analysis.period.to.replaceAll("-","/")} · ${analysis.dataDays}営業日 · ${analysis.status}`;
  $("clinicalTrendInsights").innerHTML=analysis.insights.map(text=>`<li>${escapeHtml(text)}</li>`).join("");
}
function openClinicalTrends(){
  const analysis=clinicalTrendAnalysis(),weekdayRows=analysis.weekday.rows.filter(row=>row.weekday!=="月曜日"&&row.days>0),half=analysis.firstHalfVsSecondHalf,volume=analysis.volumeVsUnitPrice,np=analysis.newPatients,weather=analysis.weather;
  const rowHtml=weekdayRows.length?weekdayRows.map(row=>`<tr><th>${row.weekday}${row.weekday==="土曜日"?"<small>午後のみ</small>":""}</th><td>${row.days}日</td><td>${trendValue(row.averagePatients,"件")}</td><td>${trendValue(row.averageSales,"円")}</td><td>${trendValue(row.averageUnitPrice,"円")}</td></tr>`).join(""):"<tr><td colspan=\"5\">判断にはもう少しデータが必要です</td></tr>";
  const halfRow=item=>`<tr><th>${item.label}</th><td>${item.days}日</td><td>${trendValue(item.averagePatients,"件")}</td><td>${trendValue(item.averageSales,"円")}</td><td>${trendValue(item.averageUnitPrice,"円")}</td></tr>`;
  $("clinicalTrendDetail").innerHTML=`<h2 id="clinicalTrendModalTitle">🧠 診療傾向</h2><p class="trend-detail-meta">${analysis.period.from}〜${analysis.period.to} · ${analysis.dataDays}営業日 · 信頼度：${analysis.confidence}</p><section><h3>影武者の見立て</h3><ul class="clinical-trend-insights">${analysis.insights.map(text=>`<li>${escapeHtml(text)}</li>`).join("")}</ul></section><section><h3>曜日別</h3><div class="table"><table><thead><tr><th>曜日</th><th>日数</th><th>平均来院</th><th>平均売上</th><th>平均客単価</th></tr></thead><tbody>${rowHtml}</tbody></table></div><p class="trend-note">月曜日は休診日のため除外。土曜日は午後診療のみとして表示しています。最多来院：${analysis.weekday.busiestWeekdays.join("・")||"—"}／最高売上：${analysis.weekday.highestSalesWeekdays.join("・")||"—"}</p></section><section><h3>月前半・後半</h3><div class="table"><table><tbody>${halfRow(half.first)}${halfRow(half.second)}</tbody></table></div>${half.comparisonReady?"":"<p class=\"trend-note\">比較判断には各期間3営業日以上が必要です。</p>"}</section><section class="trend-detail-grid"><article><h3>件数 × 客単価</h3><p>高件数・高売上 ${volume.highVolumeHighSales.length}日</p><p>低件数・高客単価 ${volume.lowVolumeHighUnit.length}日</p><p>高件数・低客単価 ${volume.highVolumeLowUnit.length}日</p></article><article><h3>新患</h3>${np.available?`<p>新患比率 ${np.ratio==null?"—":(np.ratio*100).toFixed(1)+"%"}</p><p>多い曜日 ${np.topWeekdays.join("・")||"—"}</p><p>多い月 ${np.topMonths.join("・")||"—"}</p>`:"<p>新患データなし。判断にはもう少しデータが必要です。</p>"}</article><article><h3>天気</h3>${weather.available?`<p>雨：平均来院 ${trendValue(weather.rain.averagePatients,"件")}／平均売上 ${trendValue(weather.rain.averageSales,"円")}</p><p>晴：平均来院 ${trendValue(weather.sunny.averagePatients,"件")}／平均売上 ${trendValue(weather.sunny.averageSales,"円")}</p>${weather.comparisonReady?"":"<p>比較判断には雨・晴れ各3日以上が必要です。</p>"}`:"<p>天気データなし。判断にはもう少しデータが必要です。</p>"}</article></section>`;
  openOverlay($("clinicalTrendModal"));$("closeClinicalTrends").focus();
}
function closeClinicalTrends(){closeOverlay($("clinicalTrendModal"))}
function saveReportLearning(){const m=reportMonth();if(m!==monthNow())return toast("過去月は閲覧のみです");data.monthlyReports={...(data.monthlyReports||{}),[m]:{...(data.monthlyReports?.[m]||{}),learningText:$("reportLearning").value.trim(),updatedAt:new Date().toISOString()}};save();$("reportLearningStatus").textContent="保存済み";toast(`${monthLabel(m)}の学びを保存しました`)}
function moveReportMonth(delta){const [y,m]=reportMonth().split("-").map(Number),d=new Date(y,m-1+delta,1);$("reportMonthPicker").value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;renderMonthlyReport();renderStrategyIntelligence()}

function renderClinicSettings(){
  const c=data.clinic||DEFAULT_CLINIC;
  $("fullDayTarget").value=c.fullDayTarget;$("saturdayTarget").value=c.saturdayTarget;$("fullDayPatients").value=c.fullDayPatients;$("saturdayPatients").value=c.saturdayPatients;$("closedDates").value=(c.closedDates||[]).join("\n");
}
function saveClinicSettings(){
  const dates=$("closedDates").value.split(/\s+/).map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));
  data.clinic={fullDayTarget:num("fullDayTarget")||180000,saturdayTarget:num("saturdayTarget")||100000,fullDayPatients:Number($("fullDayPatients").value)||17.5,saturdayPatients:Number($("saturdayPatients").value)||9,closedDates:[...new Set(dates)].sort()};
  save();render();toast("病院設定を保存しました");
}
function storage(){const size=new Blob([JSON.stringify(data)]).size;$("storage").textContent=`日別記録 ${data.entries.length}件、月間過去データ ${Object.keys(data.historical).length}か月、使用容量 約${(size/1024).toFixed(1)}KB`}
function download(name,text,type){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([text],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function exportJson(){download(`dashboard-backup-${iso()}.json`,JSON.stringify({...data,kagemushaDiary:loadKagemushaDiaries()},null,2),"application/json")}
function exportCsv(){const esc=v=>`"${String(v??"").replaceAll('"','""')}"`,head=["date","sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions","weatherCondition","temperature","rainProbability","note"],rows=data.entries.map(e=>head.map(k=>esc(k==="weatherCondition"?e.weather?.condition:k==="temperature"?e.weather?.temperature:k==="rainProbability"?e.weather?.rainProbability:e[k])).join(",")),months=[...new Set([...Object.keys(data.historical),...Object.keys(data.financeByMonth)])].sort(),monthly=[["month","clinicalSales","morikuboOnline","royalCanin","purina","ecSales","totalSales","expense","profit"],...months.map(m=>{const s=monthSummary(m);return [m,s.clinicalSales,s.morikuboOnline,s.royalCanin,s.purina,s.ecSales,s.sales,s.expense,s.sales-s.expense]})];download(`dashboard-${iso()}.csv`,"\uFEFF"+[head.join(","),...rows,"",...monthly.map(r=>r.map(esc).join(","))].join("\n"),"text/csv;charset=utf-8")}
async function importJson(file){
  const input=$("importJson"),previousData=data,previousDashboard=localStorage.getItem(KEY),previousDiary=localStorage.getItem(KAGEMUSHA_DIARY_KEY);
  let saved=false,stage="file read";
  const step=async(name,operation)=>{stage=name;try{return await operation()}catch(error){error.restoreStage=name;throw error}};
  const restoreStorage=()=>{
    if(previousDashboard===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,previousDashboard);
    if(previousDiary===null)localStorage.removeItem(KAGEMUSHA_DIARY_KEY);else localStorage.setItem(KAGEMUSHA_DIARY_KEY,previousDiary);
  };
  try{
    const text=await step("file read",async()=>(await file.text()).replace(/^\uFEFF/,"").trim());
    const parsed=await step("JSON Parse Error",()=>JSON.parse(text));
    const restored=await step("normalizeBackup failed",()=>BackupRestore.normalizeBackup(parsed,base,KEY));
    const nextData=await step("financeByMonth merge failed",()=>({...restored.data,financeByMonth:{...(restored.data.financeByMonth||{})}}));
    await step("monthlyReports merge failed",()=>{nextData.monthlyReports={...(restored.data.monthlyReports||{})}});
    const nextDiaries=await step("merge failed",()=>{const merged=new Map(loadKagemushaDiaries().map(entry=>[entry.date,entry]));restored.kagemushaDiary.forEach(entry=>{if(entry?.date)merged.set(entry.date,entry)});return [...merged.values()]});
    await step("save failed",()=>{
      nextData.meta={...(nextData.meta||{}),lastUpdated:new Date().toISOString()};
      try{localStorage.setItem(KEY,JSON.stringify(nextData));localStorage.setItem(KAGEMUSHA_DIARY_KEY,JSON.stringify(nextDiaries))}
      catch(error){try{restoreStorage()}catch(rollbackError){console.error(rollbackError)}throw error}
      data=nextData;saved=true;
    });
    await step("render failed",()=>render());
    toast("✅ Restore completed successfully");
  }catch(error){
    console.error(error);
    if(saved){
      try{restoreStorage()}catch(rollbackError){console.error(rollbackError)}
      data=previousData;
      try{render()}catch(rollbackRenderError){console.error(rollbackRenderError)}
    }
    const details=error?.stack||String(error);
    alert(`❌ ${error?.restoreStage||stage}\n\n${details}`);
  }finally{input.value=""}
}
function deleteAll(){if(confirm("全データを削除しますか？")&&confirm("元に戻せません。よろしいですか？")){data=structuredClone(base);save();clearForm();render()}}
function updateIndicator(id){const active=PAGE_IDS.indexOf(id);$("pageIndicator").innerHTML=PAGE_IDS.map((_,i)=>`<i class="${i===active?'active':''}"></i>`).join('')}
const pageScrollPositions=new Map();let pageTransitionTimer;
const playedCharts=new WeakSet(),chartEntranceTimers=new WeakMap();
let chartObserver,observedChartPage;
function finishChartEntrance(chart){
 chart.classList.remove("chart-awaiting","chart-animating");
 const timer=chartEntranceTimers.get(chart);if(timer)clearTimeout(timer);chartEntranceTimers.delete(chart);
}
function disconnectChartObserver(resetPlayed=false){
 if(chartObserver)chartObserver.disconnect();
 if(observedChartPage)observedChartPage.querySelectorAll(".chart-card").forEach(chart=>{finishChartEntrance(chart);if(resetPlayed)playedCharts.delete(chart)});
 observedChartPage=null;
}
function playChartEntrance(page){
 disconnectChartObserver(true);if(!page)return;
 const charts=[...page.querySelectorAll(".chart-card")];
 if(reducedMotion()||typeof IntersectionObserver==="undefined"){charts.forEach(finishChartEntrance);return}
 observedChartPage=page;
 if(!chartObserver)chartObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const chart=entry.target;
  if(!entry.isIntersecting||entry.intersectionRatio<.25||playedCharts.has(chart)||!chart.closest(".page.active"))return;
  playedCharts.add(chart);chartObserver.unobserve(chart);chart.classList.remove("chart-awaiting");chart.classList.add("chart-animating");
  chartEntranceTimers.set(chart,setTimeout(()=>finishChartEntrance(chart),800));
 }),{threshold:.25});
 charts.forEach(chart=>{chart.classList.add("chart-awaiting");chartObserver.observe(chart)});
}
function switchPage(id){
 const current=document.querySelector(".page.active");if(current?.id===id&&!current.classList.contains("page-leaving"))return;
 const reveal=()=>{disconnectChartObserver(true);deactivateInsightScore();document.querySelectorAll(".page").forEach(p=>{p.classList.toggle("active",p.id===id);p.classList.remove("page-leaving")});document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===id));updateIndicator(id);document.querySelector(`.tab[data-page="${id}"]`)?.scrollIntoView({behavior:reducedMotion()?"auto":"smooth",inline:"center",block:"nearest"});if(id==="month")month();if(id==="report")renderMonthlyReport();if(id==="year"){years();year()}if(id==="finance")finance();if(id==="settings")renderClinicSettings();window.scrollTo({top:pageScrollPositions.get(id)||0,behavior:"auto"});if(id==="today")renderDailyShadowBrief();if(id==="today")activateInsightScore();playChartEntrance($(id))};
 clearTimeout(pageTransitionTimer);if(!current||reducedMotion()){reveal();return}pageScrollPositions.set(current.id,window.scrollY);current.classList.add("page-leaving");pageTransitionTimer=setTimeout(reveal,120);
}
function moveMonth(delta){const [y,m]=($("monthPicker").value||monthNow()).split("-").map(Number),d=new Date(y,m-1+delta,1);$("monthPicker").value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;month();finance()}
function setupSwipe(){let sx=0,sy=0,tracking=false;const root=$("pageContainer");root.addEventListener("touchstart",e=>{const t=e.target;if(t.closest("input,textarea,select,button,.table,nav,.recent-activity-card"))return;const p=e.touches[0];sx=p.clientX;sy=p.clientY;tracking=true},{passive:true});root.addEventListener("touchend",e=>{if(!tracking)return;tracking=false;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.25)return;const current=document.querySelector(".page.active")?.id,index=PAGE_IDS.indexOf(current),next=dx<0?index+1:index-1;if(next>=0&&next<PAGE_IDS.length)switchPage(PAGE_IDS[next])},{passive:true})}
function simulatorSource(){return {...data,selectedMonth:data.businessSimulator?.month||monthNow(),annualMode:data.businessSimulator?.annualMode||"recurring",annualForecast:annualForecastSource()}}
function setupBusinessSimulator(){
 if(typeof BusinessSimulator==="undefined"||!$("simControls"))return;
 const months=BusinessSimulator.availableMonths(data),selected=months.includes(data.businessSimulator?.month)?data.businessSimulator.month:(months.includes(monthNow())?monthNow():months[0]);data.businessSimulator={...(data.businessSimulator||{}),month:selected,annualMode:data.businessSimulator?.annualMode||"recurring"};
 const monthSelect=$("simMonth");monthSelect.innerHTML=months.length?months.map(month=>`<option value="${month}">${monthLabel(month)}</option>`).join(""):`<option value="">データなし</option>`;monthSelect.value=selected||"";monthSelect.onchange=()=>{data.businessSimulator={...data.businessSimulator,month:monthSelect.value,changes:{},reverseStatus:null};setupBusinessSimulator();save()};
 document.querySelectorAll('[name="simAnnualMode"]').forEach(input=>{input.checked=input.value===data.businessSimulator.annualMode;input.onchange=()=>{data.businessSimulator={...data.businessSimulator,annualMode:input.value,reverseStatus:null};renderBusinessSimulator();save()}});
 const source=simulatorSource(),current=BusinessSimulator.baseline(source),limits=BusinessSimulator.improvementLimits(source),previous=BusinessSimulator.monthBaseline(source,monthShift(selected||monthNow(),-1));
 $("simControls").innerHTML=Object.entries(BusinessSimulator.ITEMS).map(([key,item])=>{const value=current[key],prior=previous[key],display=value===null?"データなし":`${Math.round(value).toLocaleString("ja-JP")}${item.unit}`,comparison=prior===null?"前月 データなし":`${monthLabel(previous.month)}実績 ${Math.round(prior).toLocaleString("ja-JP")}${item.unit}${Number(prior)!==0?`（${value>=prior?"+":""}${Math.round((value-prior)/prior*100)}%）`:""}`;return `<label class="sim-control" for="sim-${key}"><span><b>${item.label}</b><small>${current.label} ${display}</small><small class="sim-previous">${comparison}</small></span><output id="sim-output-${key}">+0${item.unit}</output><input id="sim-${key}" data-sim-key="${key}" type="range" min="0" max="${limits[key]}" step="${item.step}" value="${Number(data.businessSimulator?.changes?.[key])||0}"></label>`}).join("");
 document.querySelectorAll("[data-sim-key]").forEach(input=>{
  input.addEventListener("input",()=>{data.businessSimulator={...(data.businessSimulator||{}),changes:{...(data.businessSimulator?.changes||{}),[input.dataset.simKey]:Number(input.value)},reverseStatus:null};renderBusinessSimulator()});
  input.addEventListener("change",save);
 });
 document.querySelectorAll('[name="simGoal"]').forEach(input=>{input.checked=Number(input.value)===Number(data.goalPlanner?.annualProfit||20000000);input.onchange=()=>{data.goalPlanner={...(data.goalPlanner||{}),annualProfit:Number(input.value)};data.businessSimulator.reverseStatus=null;renderBusinessSimulator();save()}});
 $("simReset").onclick=()=>{data.businessSimulator={...data.businessSimulator,changes:{},reverseStatus:null};setupBusinessSimulator();save()};
 $("simReverse").onclick=()=>{const plan=BusinessSimulator.reversePlan(simulatorSource(),Number(data.goalPlanner?.annualProfit)||20000000);data.businessSimulator={...data.businessSimulator,changes:plan.changes,reverseStatus:plan.status};setupBusinessSimulator();save();toast(plan.status==="current"?"現在の予測で目標達成圏内です":"目標から必要改善量を逆算しました")};
 renderBusinessSimulator();
}
function renderBusinessSimulator(){
 if(typeof BusinessSimulator==="undefined"||!$("simRanking"))return;const goal=Number(data.goalPlanner?.annualProfit)||20000000,result=BusinessSimulator.simulate(simulatorSource(),data.businessSimulator?.changes||{},goal),formatMan=value=>`${Math.round(value/10000).toLocaleString("ja-JP")}万円`;
 Object.entries(BusinessSimulator.ITEMS).forEach(([key,item])=>{const input=$(`sim-${key}`),output=$(`sim-output-${key}`),value=Number(data.businessSimulator?.changes?.[key])||0;if(input)input.value=value;if(output)output.textContent=`+${value.toLocaleString("ja-JP")}${item.unit}`});
 $("simBaseMonthlyProfit").textContent=result.baseMonthlyProfit===null?"データなし":formatMan(result.baseMonthlyProfit);$("simMonthlyProfit").textContent=result.simulatedMonthlyProfit===null?"データなし":formatMan(result.simulatedMonthlyProfit);$("simSelectedMonth").textContent=`対象月：${monthLabel(result.current.month)}`;const monthlyDelta=$("simMonthlyDelta");monthlyDelta.textContent=result.delta?`月間改善額 +${formatMan(result.delta)}`:"変化なし";monthlyDelta.className=result.delta?"increase":"neutral";
 $("simBaseAnnualProfit").textContent=formatMan(result.current.annualProfit);$("simAnnualProfit").textContent=formatMan(result.annualProfit);$("simGoalProfit").textContent=formatMan(goal);const goalDifference=result.annualProfit-goal;$("simGoalDifference").textContent=`${goalDifference>=0?"+":"−"}${formatMan(Math.abs(goalDifference))}`;$("simGoalDifference").className=goalDifference>=0?"increase":"decrease";$("simProbability").textContent=`${result.probability}%`;$("simDifficulty").textContent=`${"★".repeat(result.difficulty)}${"☆".repeat(5-result.difficulty)}`;$("simDataStatus").textContent=result.dataStatus;$("simComment").textContent=result.comment;$("simAnnualNote").textContent=result.annualMode==="oneMonth"?"年間利益には対象月の改善額だけを反映します。":result.annualReliability?"月別売上の季節係数を使って年間換算しています。":"年間換算の信頼性が低いため参考値です。";
 const delta=$("simProfitDelta"),annualDelta=result.annualProfit-result.current.annualProfit;delta.textContent=annualDelta?`年間 ${annualDelta>0?"+":""}${formatMan(annualDelta)}`:"変化なし";delta.className=annualDelta>0?"increase":annualDelta<0?"decrease":"neutral";
 $("simRanking").innerHTML=result.ranking.slice(0,5).map((item,index)=>`<li><b>${index+1}</b><span><strong>${item.label}</strong><small>成功率 ${item.success}% ・ 難易度 ${"★".repeat(item.difficulty)}${"☆".repeat(5-item.difficulty)}</small></span><em class="${item.profit>0?"increase":"neutral"}">${item.profit>0?"+":""}${Math.round(item.profit/10000)}万円</em></li>`).join("");
 const recommendation=$("simRecommendation"),status=data.businessSimulator?.reverseStatus;if(recommendation){recommendation.hidden=!status;if(status){const rows=result.ranking.filter(item=>item.change>0).map(item=>`<li>${item.label}　+${item.change.toLocaleString("ja-JP")}${item.unit}${item.unit==="件"?"/月":""}</li>`).join("");const message=status==="current"?"現在の予測で目標達成圏内です":status==="unreachable"?"現在設定している改善上限では目標利益に届きません":"目標達成見込み";recommendation.innerHTML=`<h3>目標${formatMan(goal)}への推奨改善案</h3>${rows?`<ul>${rows}</ul>`:""}<p>→ 年間予測利益 ${formatMan(result.annualProfit)}<br>→ ${message}</p>`}}
}
function updateSimulatorLearning(){if(typeof BusinessSimulator==="undefined")return;const learned=BusinessSimulator.updateAtNight(simulatorSource());if(learned.saved){data.simulationHistory=learned.simulationHistory;data.improvementModels=learned.improvementModels;save()}}
function renderMorningExecutiveBrief(){
 if(typeof MorningExecutiveBrief==="undefined"||!$("morningBriefContent"))return;const today=iso(),summary=monthSummary(monthNow()),target=Number(data.settings[monthNow()]?.target)||MONTHLY_TARGET,closed=clinicDayInfo(today).type==="closed",hour=new Date().getHours(),optimizer=BusinessOptimizer.build({...data,today,monthlySummary:{sales:summary.sales,expense:summary.expense,profitRate:summary.sales?(summary.sales-summary.expense)/summary.sales*100:0}}),learning=KnowledgeCore.rank(data.successLibrary,{limit:1})[0]||null,entry=data.entries.find(item=>item.date===today),previousHealth=BusinessHealthScore.normalizeHistory(data.businessHealthHistory).filter(item=>item.date<today).at(-1)?.score,review=entry?{healthFrom:previousHealth??data.businessHealthScore,healthTo:data.businessHealthScore,imaging:Number(entry.clinical?.xrays||0)+Number(entry.clinical?.ultrasounds||0),checkups:Number(entry.checkups)||0,profitRate:Number(entry.profitRate)||0}:null,brief=MorningExecutiveBrief.build({date:today,hour,closed,health:calculateBusinessHealth(),healthHistory:data.businessHealthHistory,optimizer,strategyMap:data.strategyMap,learning,memoTrends:data.memoTrends,target,sales:summary.sales,review});
 if(JSON.stringify(data.meetingBrief)!==JSON.stringify(brief)){data.meetingBrief=brief;data.meetingHistory=MorningExecutiveBrief.normalizeHistory([...(data.meetingHistory||[]).filter(item=>item.date!==today),brief]);save()}
 $("morningBriefDate").textContent=new Date(`${today}T00:00:00`).toLocaleDateString("ja-JP",{month:"long",day:"numeric"});const delta=value=>value==null?"—":`${value>=0?"+":""}${value}`;
 $("morningBriefContent").innerHTML=`<section><small>今日の最優先</small><strong>${escapeHtml(brief.priority.label)}</strong><em>${escapeHtml(brief.priority.reason)}</em></section><section><small>Business Health</small><strong>${brief.score==null?"学習中":`${brief.score}点　${escapeHtml(brief.grade)}`}</strong><span>前日比 ${delta(brief.previousDelta)}</span></section><section><small>今日の期待利益</small><strong>${brief.priority.expectedProfit?`+${yen(brief.priority.expectedProfit)}`:"算出中"}</strong><span>${brief.priority.successRate!=null?`成功率 ${brief.priority.successRate}%`:"データを学習中"}</span></section><section><small>今日のリスク</small><strong>${escapeHtml(brief.warning.label)}</strong><span>${escapeHtml(brief.warning.detail)}</span></section><section><small>AIコメント</small><strong>${escapeHtml(brief.comment)}</strong></section>`;
}
function setupAIAnalysis(){const button=$("aiAnalysisToggle"),content=$("aiAnalysisContent");if(!button||!content)return;const apply=open=>{button.setAttribute("aria-expanded",String(open));content.setAttribute("aria-hidden",String(!open));data.uiState={...(data.uiState||{}),analysisExpanded:open};button.querySelector("i").textContent=open?"▲":"▼"};apply(data.uiState?.analysisExpanded===true);button.onclick=()=>{apply(button.getAttribute("aria-expanded")!=="true");save()};content.onclick=event=>{const target=event.target.closest("[data-analysis-target]")?.dataset.analysisTarget;if(!target)return;event.preventDefault();if(target==="optimizer")switchPage("simulator");else if(target==="strategy"){switchPage("report");$("aiStrategyMap")?.scrollIntoView({behavior:"smooth"})}else if(["knowledge","success","failure"].includes(target)){switchPage("report");$("successLibraryItems")?.scrollIntoView({behavior:"smooth"})}else{document.body.classList.add("analysis-detail-open");$(target==="season"?"seasonForecastCard":"learningInsightCard")?.scrollIntoView({behavior:"smooth"})}}}
function setupMorningBriefDetail(){const button=$("morningBriefDetail"),links=$("morningBriefLinks");button.onclick=()=>{const open=button.getAttribute("aria-expanded")!=="true";button.setAttribute("aria-expanded",String(open));links.hidden=!open;button.textContent=open?"閉じる":"詳細を見る"};links.onclick=event=>{const target=event.target.dataset.briefTarget;if(target==="optimizer"){switchPage("today");$("businessOptimizerCard")?.scrollIntoView({behavior:"smooth"})}else if(target==="strategy"){switchPage("report");$("aiStrategyMap")?.scrollIntoView({behavior:"smooth"})}else if(target==="knowledge")openSuccessLibrary(KnowledgeCore.rank(data.successLibrary,{limit:1})[0]?.id)}}
function render(){
 const sections=[renderRecommendationOutcome,recent,renderRecentActivity,month,renderMonthlyReport,renderStrategyIntelligence,renderClinicalIntelligence,renderClinicalTrends,updateStrategyMap,years,year,finance,renderClinicSettings,renderBusinessSimulator,storage,renderTodaySummary,renderAnnualManagementStatus,renderDailyShadowBrief,renderTodayStrategy,renderBusinessHealth,renderBusinessOptimizer,renderMorningExecutiveBrief,renderSeasonForecast,renderLearningInsight,renderWeeklyInsights,renderSuccessLibrary,renderClinicalLearning,renderBusinessAnomalies,renderDailyReview,renderKagemusha,renderKagemushaDiary,renderPhase1Director,renderManagementInsight];
 sections.forEach(section=>{try{section()}catch(error){console.error(error)}});
 try{const memo=$("memoText");if(memo)memo.value=data?.memo??""}catch(error){console.error(error)}
}
function setupMonthRollover(){
  if(typeof MonthRollover==="undefined")return;
  const current=monthNow(),state=MonthRollover.needsConfirmation(data,current),modal=$("monthRolloverModal");
  if(!state.previous){data.meta={...(data.meta||{}),activeMonth:current};save();return}
  if(!state.show)return;
  $("monthRolloverMessage").textContent=`${Number(current.slice(5))}月のデータへ切り替えますか？`;
  $("confirmMonthRollover").onclick=()=>{data=MonthRollover.createMonth(data,current,{previousMonth:state.previous,target:MONTHLY_TARGET,businessDays:expectedBusinessDays(current)});save();$("monthPicker").value=current;$("reportMonthPicker").value=current;closeOverlay(modal);render();toast(`${Number(current.slice(5))}月へ切り替えました`)};
  $("deferMonthRollover").onclick=()=>closeOverlay(modal);
  openOverlay(modal);$("confirmMonthRollover").focus();
}
function setupBusinessHealthDetail(){const button=$("businessHealthToggle"),detail=$("businessHealthDetail");if(!button||!detail)return;button.onclick=()=>{const open=button.getAttribute("aria-expanded")!=="true";button.setAttribute("aria-expanded",String(open));detail.hidden=!open;button.querySelector(".health-toggle-label").textContent=open?"詳細を閉じる":"詳細を見る"}}
function setupAIBriefFold(){const card=$("aiBriefCard");if(!card)return;const saved=localStorage.getItem("v9AlphaBriefOpen");if(saved!==null)card.open=saved==="1";card.addEventListener("toggle",()=>localStorage.setItem("v9AlphaBriefOpen",card.open?"1":"0"))}
function setupSuccessLibrary(){$("closeSuccessLibrary").onclick=closeSuccessLibrary;$("successLibraryModal").onclick=event=>{if(event.target===$("successLibraryModal"))closeSuccessLibrary()}}
function init(){$("todayLabel").textContent=new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"});$("entryDate").value=iso();$("monthPicker").value=monthNow();$("reportMonthPicker").value=monthNow();document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).oninput=preview);["patients","newPatients",...Object.values(CLINICAL_INPUTS)].forEach(id=>$(id).addEventListener("input",renderClinicalConsistencyWarning));$("entryDate").onchange=()=>{const date=$("entryDate").value,e=data.entries.find(x=>x.date===date);if(e)edit(e.date);else clearForm(date)};$("saveEntry").onclick=saveEntry;$("clearEntry").onclick=()=>clearForm();$("saveSettings").onclick=saveSettings;$("monthPicker").onchange=()=>{month();finance()};$("prevMonth").onclick=()=>moveMonth(-1);$("nextMonth").onclick=()=>moveMonth(1);$("yearPicker").onchange=year;$("saveFinance").onclick=saveFinance;$("reportMonthPicker").onchange=()=>{renderMonthlyReport();renderStrategyIntelligence()};$("reportPrevMonth").onclick=()=>moveReportMonth(-1);$("reportNextMonth").onclick=()=>moveReportMonth(1);$("saveReportLearning").onclick=saveReportLearning;$("openClinicalTrends").onclick=openClinicalTrends;$("closeClinicalTrends").onclick=closeClinicalTrends;$("clinicalTrendModal").onclick=e=>{if(e.target===$("clinicalTrendModal"))closeClinicalTrends()};$("saveClinicSettings").onclick=saveClinicSettings;$("memoText").oninput=()=>{clearTimeout(memoTimer);$("memoStatus").textContent="保存中…";memoTimer=setTimeout(()=>{data.memo=$("memoText").value;save();$("memoStatus").textContent="保存済み"},500)};$("exportJson").onclick=exportJson;$("exportCsv").onclick=exportCsv;$("importJson").onchange=e=>e.target.files[0]&&importJson(e.target.files[0]);$("deleteAll").onclick=deleteAll;setupClinicalSteppers();setupTodayEntry();setupRecentActivity();setupSwipe();setupAIBriefFold();setupBusinessHealthDetail();setupMorningBriefDetail();setupAIAnalysis();setupKagemusha();setupKpiAnimations();setupBusinessSimulator();updateSimulatorLearning();$("saveKagemushaDiary").onclick=saveTodayKagemushaDiary;$("closeKagemushaDiary").onclick=closeKagemushaDiary;$("kagemushaDiaryModal").onclick=e=>{if(e.target===$("kagemushaDiaryModal"))closeKagemushaDiary()};document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeKagemushaDiary();closeClinicalTrends();closeTodayEntry();closeActivitySummary()}});$("refreshWeather").onclick=()=>fetchWeather(true);switchPage("today");render();setupMonthRollover();activateInsightScore();renderTodaySummary();fetchWeather();if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
setupSuccessLibrary();init();
})();
