
function renderAIBrief(){
 const el=document.getElementById('aiBrief');
 if(!el)return;
 const sales=(typeof monthSummary==='function')?monthSummary(monthNow()).sales:0;
 let msg='おはようございます。';
 if(sales===0){
   msg+=' 今日のデータ入力をお願いします。';
 }else{
   msg+=' 今日も落ち着いて丁寧な診療を心がけましょう。';
 }
 msg+='<br><br><b>今日やること</b><br>①必要な検査提案を丁寧に<br>②午後の予約状況を確認<br>③今日の出来事を一言メモ';
 el.innerHTML=msg;
}

(()=>{"use strict";
const KEY="keitaDashboardSimpleV1";
const PAGE_IDS=["today","month","report","year","finance","memo","settings","data"];
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
const base={entries:[],settings:{},weatherCache:null,meta:{lastUpdated:null},finance:{balance:0,monthlyExpense:0,personnelExpense:0,medicalExpense:0,cardFee:0,loan:0,repayment:0,incomeTarget:0,morikuboOnline:0,royalCanin:0,purina:0},financeByMonth:{},monthlyReports:{},historical:{...HISTORICAL},clinic:{...DEFAULT_CLINIC},memo:""};
let data=load(),memoTimer;
const $=id=>document.getElementById(id),num=id=>Math.max(0,Number($(id).value)||0);
const yen=v=>`${Math.round(Number(v)||0).toLocaleString("ja-JP")}円`,pct=v=>`${(Number(v)||0).toFixed(1)}%`;
const formatUpdated=v=>{if(!v)return "未記録";const d=new Date(v);return Number.isNaN(d.getTime())?"未記録":new Intl.DateTimeFormat("ja-JP",{year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(d)};
const iso=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const monthNow=()=>iso().slice(0,7);
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||"{}");const settings={...(raw.settings||{})};Object.keys(settings).forEach(m=>{if(!settings[m].target||settings[m].target===4500000)settings[m].target=MONTHLY_TARGET});return {...base,...raw,settings,meta:{...base.meta,...(raw.meta||{})},finance:{...base.finance,...(raw.finance||{})},financeByMonth:{...(raw.financeByMonth||{})},monthlyReports:{...(raw.monthlyReports||{})},historical:{...HISTORICAL,...(raw.historical||{})},clinic:{...DEFAULT_CLINIC,...(raw.clinic||{}),closedDates:Array.isArray(raw.clinic?.closedDates)?raw.clinic.closedDates:[]},entries:Array.isArray(raw.entries)?raw.entries:[]}}catch{return structuredClone(base)}}
function save(){data.meta={...(data.meta||{}),lastUpdated:new Date().toISOString()};localStorage.setItem(KEY,JSON.stringify(data));storage()}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout($("toast").t);$("toast").t=setTimeout(()=>$("toast").classList.remove("show"),1600)}
function preview(){const s=num("sales"),p=num("patients");$("todaySales").textContent=yen(s);$("todayPatients").textContent=`${p}件`;$("todayUnit").textContent=yen(p?s/p:0);$("todayNew").textContent=`${num("newPatients")}件`;renderDailyAI()}
const WEATHER_CODES={0:["快晴","☀️"],1:["晴れ","🌤️"],2:["一部曇り","⛅"],3:["曇り","☁️"],45:["霧","🌫️"],48:["霧","🌫️"],51:["弱い霧雨","🌦️"],53:["霧雨","🌦️"],55:["強い霧雨","🌧️"],61:["小雨","🌦️"],63:["雨","🌧️"],65:["強い雨","🌧️"],71:["小雪","🌨️"],73:["雪","🌨️"],75:["大雪","❄️"],80:["にわか雨","🌦️"],81:["にわか雨","🌧️"],82:["激しいにわか雨","⛈️"],95:["雷雨","⛈️"],96:["雷雨・ひょう","⛈️"],99:["強い雷雨・ひょう","⛈️"]};
function showWeather(w,offline=false){
  if(!w)return;
  $("weatherIcon").textContent=w.icon||"🌤️";
  $("weatherTemp").textContent=`${Math.round(Number(w.temperature)||0)}°`;
  $("weatherCondition").textContent=w.condition+(offline?"（保存値）":"");
  $("weatherRain").textContent=`${Math.round(Number(w.rainProbability)||0)}%`;
  renderDailyAI();renderAIBrief();
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
function renderTodaySummary(){const e=data.entries.find(x=>x.date===iso())||{sales:0,patients:0,newPatients:0};$("todaySales").textContent=yen(e.sales);$("todayPatients").textContent=`${Number(e.patients)||0}件`;$("todayUnit").textContent=yen(e.patients?e.sales/e.patients:0);$("todayNew").textContent=`${Number(e.newPatients)||0}件`}
function renderManagementInsight(){
  const m=monthNow(),s=monthSummary(m),set=data.settings[m]||{target:MONTHLY_TARGET,businessDays:expectedBusinessDays(m)};
  const target=Number(set.target)||MONTHLY_TARGET,progress=target?s.sales/target*100:0,profit=s.sales-s.expense,profitRate=s.sales?profit/s.sales*100:0;
  const today=iso(),elapsed=operatingEntries(s.entries.filter(e=>e.date<=today)).length,totalDays=Number(set.businessDays)||expectedBusinessDays(m),left=Math.max(0,totalDays-elapsed);
  const needDaily=Math.max(0,target-s.sales)/Math.max(1,left),paceRate=elapsed?((s.sales/elapsed)*totalDays/target)*100:progress,profitScore=s.expense?Math.max(0,Math.min(100,(profitRate/30)*100)):50;
  const score=s.sales?Math.round(Math.max(0,Math.min(100,Math.min(100,progress)*.45+profitScore*.35+Math.min(100,paceRate)*.2))):null;
  const rows=operatingEntries(s.entries.filter(e=>e.date<=today&&Number(e.sales)>0)).sort((a,b)=>b.date.localeCompare(a.date)),current=rows.find(e=>e.date===today)||rows[0],previous=rows.find(e=>current&&e.date<current.date);
  $("insightPeriod").textContent=`${Number(m.slice(5))}月`;
  $("insightScore").textContent=score??"—";$("insightScoreRing").style.setProperty("--insight-score",score||0);
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
function clearForm(){$("entryDate").value=iso();["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).value="");$("note").value="";$("saveEntry").textContent="保存する";renderTodaySummary()}
function saveEntry(){const date=$("entryDate").value;if(!date)return toast("日付を入力してください");const e={date,sales:num("sales"),patients:num("patients"),newPatients:num("newPatients"),surgeries:num("surgeries"),checkups:num("checkups"),trimmings:num("trimmings"),secondOpinions:num("secondOpinions"),weather:data.weatherCache?{condition:data.weatherCache.condition,temperature:data.weatherCache.temperature,rainProbability:data.weatherCache.rainProbability,code:data.weatherCache.code,dailyCondition:data.weatherCache.dailyCondition,dailyCode:data.weatherCache.dailyCode,dailyRainMax:data.weatherCache.dailyRainMax}:null,note:$("note").value.trim()};const i=data.entries.findIndex(x=>x.date===date);if(i>=0)data.entries[i]=e;else data.entries.push(e);data.entries.sort((a,b)=>a.date.localeCompare(b.date));save();render();clearForm();toast(i>=0?"更新しました":"保存しました")}
function edit(date){const e=data.entries.find(x=>x.date===date);if(!e)return;["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).value=e[id]||"");$("entryDate").value=e.date;$("note").value=e.note||"";$("saveEntry").textContent="更新する";preview();switchPage("today");setTimeout(()=>$("entryDate").scrollIntoView({behavior:"smooth",block:"center"}),150)}
function del(date){if(!confirm(`${date}の記録を削除しますか？`))return;data.entries=data.entries.filter(x=>x.date!==date);save();render();toast("削除しました")}
function sum(entries){return entries.reduce((a,e)=>{["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(k=>a[k]+=(Number(e[k])||0));return a},{sales:0,patients:0,newPatients:0,surgeries:0,checkups:0,trimmings:0,secondOpinions:0})}
function monthSummary(m){
  const entries=data.entries.filter(e=>e.date.startsWith(m)),daily=sum(entries),hist=data.historical[m]||{},mf=data.financeByMonth[m]||{};
  const fallbackCurrent=(m===monthNow()?data.finance.monthlyExpense:0);
  const clinicalSales=daily.sales||Number(hist.sales)||0;
  const morikuboOnline=Number(mf.morikuboOnline ?? (m===monthNow()?data.finance.morikuboOnline:0))||0;
  const royalCanin=Number(mf.royalCanin ?? (m===monthNow()?data.finance.royalCanin:0))||0;
  const purina=Number(mf.purina ?? (m===monthNow()?data.finance.purina:0))||0;
  const ecSales=morikuboOnline+royalCanin+purina;
  return {...daily,clinicalSales,ecSales,morikuboOnline,royalCanin,purina,sales:clinicalSales+ecSales,entries,expense:Number(mf.monthlyExpense ?? hist.expense ?? fallbackCurrent ?? 0)||0,personnelExpense:Number(mf.personnelExpense ?? (m===monthNow()?data.finance.personnelExpense:0))||0,medicalExpense:Number(mf.medicalExpense ?? (m===monthNow()?data.finance.medicalExpense:0))||0,cardFee:Number(mf.cardFee ?? (m===monthNow()?data.finance.cardFee:0))||0}
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
    if(sales)notes.push(`${day.label}の目標${yen(day.target)}に対し、達成率${Math.round(rate*100)}%です。`);
    if(patients&&basePatients){const d=(patients/basePatients-1)*100;notes.push(`来院数は同じ診療区分の平均より${Math.abs(d).toFixed(0)}%${d>=0?"多め":"少なめ"}です。`)}
    else if(patients)notes.push(`基準来院数${day.patientsTarget}件に対し${patients}件です。`);
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
function saveSettings(){const m=$("monthPicker").value||monthNow();data.settings[m]={target:num("target"),businessDays:Math.max(1,num("businessDays")||expectedBusinessDays(m))};save();month();toast("目標を保存しました")}
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
function renderYearChart(rows){
  const el=$("yearChart"),detail=$("chartDetail"),w=760,h=340,pad={l:30,r:18,t:20,b:38},target=MONTHLY_TARGET;
  const lastIndex=rows.reduce((last,r,i)=>(r.sales>0||r.expense>0)?i:last,-1);
  if(lastIndex<0){el.innerHTML='<div class="chart-empty">年間データがまだありません。</div>';detail.innerHTML='<span>データを入力するとグラフを表示します</span>';return}
  const visible=rows.slice(0,lastIndex+1),profits=visible.map(r=>r.sales-r.expense),maxValue=Math.max(target,...visible.map(r=>r.sales),...profits,1);
  const max=Math.ceil(maxValue/1000000)*1000000+500000,plotW=w-pad.l-pad.r,plotH=h-pad.t-pad.b;
  const x=i=>visible.length===1?pad.l+plotW/2:pad.l+i*plotW/(visible.length-1),y=v=>pad.t+plotH*(1-v/max);
  const salesPts=visible.map((r,i)=>[x(i),y(r.sales)]),profitPts=visible.map((r,i)=>[x(i),y(Math.max(0,r.sales-r.expense))]);
  const salesPath=salesPts.map((p,i)=>(i?" L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(""),profitPath=profitPts.map((p,i)=>(i?" L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(""),area=`${salesPath} L${x(visible.length-1).toFixed(1)},${(h-pad.b).toFixed(1)} L${x(0).toFixed(1)},${(h-pad.b).toFixed(1)} Z`;
  const targetY=y(target),months=visible.map((r,i)=>`<text x="${x(i)}" y="${h-12}" text-anchor="middle" class="chart-month">${i+1}月</text>`).join('');
  const hits=visible.map((r,i)=>{const profit=r.sales-r.expense,rate=r.sales?profit/r.sales*100:0,left=i?((x(i-1)+x(i))/2):pad.l,right=i<visible.length-1?((x(i)+x(i+1))/2):w-pad.r;return `<g class="chart-hit" tabindex="0" role="button" aria-label="${i+1}月の数値を表示" data-month="${i+1}" data-sales="${r.sales}" data-profit="${profit}" data-rate="${rate.toFixed(1)}" data-x="${x(i)}" data-y="${y(r.sales)}"><rect x="${left}" y="${pad.t}" width="${Math.max(30,right-left)}" height="${plotH}" fill="transparent"/><line x1="${x(i)}" y1="${pad.t}" x2="${x(i)}" y2="${h-pad.b}" class="focus-line"/><circle cx="${x(i)}" cy="${y(r.sales)}" r="7" class="chart-dot sales-dot"/><circle cx="${x(i)}" cy="${y(Math.max(0,profit))}" r="6" class="chart-dot profit-dot"/></g>`}).join('');
  el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00a99d" stop-opacity=".28"/><stop offset="62%" stop-color="#00a99d" stop-opacity=".08"/><stop offset="100%" stop-color="#00a99d" stop-opacity="0"/></linearGradient><filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><line x1="${pad.l}" y1="${targetY}" x2="${w-pad.r}" y2="${targetY}" class="target-line"/><text x="${w-pad.r}" y="${targetY-8}" text-anchor="end" class="target-label">目標 500万円</text><path d="${area}" class="sales-area"/><path d="${salesPath}" class="sales-line premium-line"/><path d="${profitPath}" class="profit-line"/>${months}${hits}</svg>`;
  const select=g=>{
    el.querySelectorAll('.chart-hit').forEach(x=>x.classList.toggle('selected',x===g));
    detail.classList.remove('detail-updating');
    void detail.offsetWidth;
    detail.innerHTML=`<strong>${g.dataset.month}月</strong><span>売上 ${yen(g.dataset.sales)}</span><span>利益 ${yen(g.dataset.profit)}</span><span>利益率 ${g.dataset.rate}%</span>`;
    detail.classList.add('detail-updating');
  };
  el.querySelectorAll('.chart-hit').forEach(g=>{g.addEventListener('click',e=>{e.stopPropagation();select(g)});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g)}})});
  select(el.querySelector('.chart-hit:last-of-type'));
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
function renderBusinessInsights(rows,total,active,profit,rate,salesForecast,profitForecast){
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
  animateNumber($('businessScore'),score,v=>String(Math.round(v)),700);
  $('scoreRing').style.setProperty('--score',score);
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
  $('yearAiTitle').textContent=title;$('yearAiComment').textContent=comment;$('yearAiTags').innerHTML=tags.map(t=>`<span>${t}</span>`).join('');
}

function year(){
  const y=$("yearPicker").value||String(new Date().getFullYear()),rows=Array.from({length:12},(_,i)=>monthSummary(`${y}-${String(i+1).padStart(2,"0")}`));
  const total=rows.reduce((a,r)=>{["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(k=>a[k]+=Number(r[k])||0);a.expense+=Number(r.expense)||0;return a},{sales:0,expense:0,patients:0,newPatients:0,surgeries:0,checkups:0,trimmings:0,secondOpinions:0});
  const activeRows=rows.filter(r=>r.sales>0||r.expense>0),active=activeRows.length,profit=total.sales-total.expense,rate=total.sales?profit/total.sales*100:0;
  const annualFactor=active?12/active:0,salesForecast=total.sales*annualFactor,profitForecast=profit*annualFactor;
  const best=activeRows.reduce((a,r)=>r.sales>a.sales?r:a,{sales:0});
  const incomeTarget=Number(data.finance.incomeTarget)||0;
  animateNumber($("yearSales"),total.sales,yen);animateNumber($("yearProfit"),profit,yen);animateNumber($("yearProfitRate"),rate,pct);animateNumber($("yearAvg"),active?total.sales/active:0,yen);
  $("yearSalesSub").textContent=`${active}か月分の集計`;$("yearProfitSub").textContent=`年間支出 ${yen(total.expense)}`;$("yearProfitRateSub").textContent=rate>=20?'良好な水準':rate>=10?'安定圏':'要確認';$("yearAvgSub").textContent=`月平均利益 ${yen(active?profit/active:0)}`;
  animateNumber($("estimatedIncome"),profitForecast,yen);$("estimatedIncomeSub").textContent=active?`${active}か月の実績から年換算`:'データ入力後に表示';
  animateNumber($("yearSalesForecast"),salesForecast,yen);animateNumber($("yearProfitForecast"),profitForecast,yen);animateNumber($("bestMonthSales"),best.sales,yen);
  if(incomeTarget>0){const progress=Math.max(0,Math.min(100,profitForecast/incomeTarget*100));$("incomeProgressText").textContent=`目標 ${yen(incomeTarget)}に対して ${progress.toFixed(0)}%`;$("incomeProgressBar").style.width=`${progress}%`}else{$("incomeProgressText").textContent='目標年収は財務タブで設定できます';$("incomeProgressBar").style.width='0%'}
  renderBusinessInsights(rows,total,active,profit,rate,salesForecast,profitForecast);
  renderYearChart(rows)
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
  const patientScore=Math.round(clamp(patients/patientTarget*15,0,15));
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
function saveFinance(){const m=$("monthPicker").value||monthNow(),ec={morikuboOnline:num("morikuboOnline"),royalCanin:num("royalCanin"),purina:num("purina")},expenses={personnelExpense:num("personnelExpense"),medicalExpense:num("medicalExpense"),cardFee:num("cardFee")};data.finance={balance:num("balance"),monthlyExpense:num("monthlyExpense"),loan:num("loan"),repayment:num("repayment"),incomeTarget:num("incomeTarget"),...ec,...expenses};data.financeByMonth[m]={...(data.financeByMonth[m]||{}),monthlyExpense:num("monthlyExpense"),balance:num("balance"),loan:num("loan"),repayment:num("repayment"),...ec,...expenses};save();finance();month();renderMonthlyReport();year();toast(`${m}の財務・EC売上を保存しました`)}

function reportMonth(){return $("reportMonthPicker")?.value||$("monthPicker").value||monthNow()}
function monthLabel(m){const [y,mo]=m.split("-").map(Number);return `${y}年${mo}月`}
function expenseItem(label,current,previous,reason){
  const diff=current-previous,hasPrev=previous>0,mark=!hasPrev?"⚪":diff<=Math.max(previous*.12,30000)?"🟢":"🟡";
  const delta=!hasPrev?"比較データ不足":`${diff>=0?"＋":"−"}${yen(Math.abs(diff))}`;
  return `<article><div><span>${mark}</span><strong>${label}</strong></div><b>${delta}</b><p>${current?reason:"未入力です。財務画面から入力すると分析できます。"}</p></article>`
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
  const patientsScore=prev.patients?scoreByRatio(s.patients/prev.patients,15):Math.round(15*.67);
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
  const rows=entries.map(e=>({date:e.date,note:cleanNoteText(e.note)})).filter(x=>x.note);
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
  const m=reportMonth(),s=monthSummary(m),prev=monthSummary(monthShift(m,-1)),cfg=data.settings[m]||{},target=Number(cfg.target)||MONTHLY_TARGET,profit=s.sales-s.expense,rate=s.sales?profit/s.sales*100:0,unit=s.patients?s.sales/s.patients:0,progress=target?s.sales/target*100:0;
  $("reportSales").textContent=yen(s.sales);$("reportProgress").textContent=pct(progress);$("reportProfit").textContent=yen(profit);$("reportProfitRate").textContent=pct(rate);$("reportPatients").textContent=`${s.patients}件`;$("reportUnit").textContent=yen(unit);$("reportNew").textContent=`${s.newPatients}件`;$("reportClinical").textContent=`${s.surgeries}件 / ${s.checkups}件`;
  const current=m===monthNow(),days=s.entries.length;$("reportStatus").textContent=current?`${monthLabel(m)}は集計途中です。${days}日分の入力データをもとに表示しています。`:`${monthLabel(m)}の月間レポート`;
  const model=reportScoreModel(s,prev,target,current);
  const memoAnalysis=renderReportMemoAnalysis(s.entries);
  const advisor=advisorModel(s,prev,target,memoAnalysis);$("advisorDiscovery").textContent=advisor.discovery;$("advisorGood").textContent=advisor.good;$("advisorCaution").textContent=advisor.caution;$("advisorAction").textContent=advisor.action;
  $("reportPhrase").textContent=`「${model.phrase}」`;$("reportGrade").textContent=model.grade;$("reportScore").textContent=model.score;$("reportScoreStatus").textContent=model.status;$("reportScoreComment").textContent=model.comment;$("reportScoreRing").style.setProperty('--report-score',model.score);
  $("reportScoreSales").textContent=model.parts.sales;$("reportScoreProfit").textContent=model.parts.profit;$("reportScorePatients").textContent=model.parts.patients;$("reportScoreUnit").textContent=model.parts.unit;$("reportScoreExpense").textContent=model.parts.expense;$("reportScoreGrowth").textContent=model.parts.growth;
  setKpiTone('reportSales',progress>=100?'kpi-good':progress>=85?'kpi-watch':'kpi-neutral');setKpiTone('reportProfitRate',rate>=30?'kpi-good':rate>=20?'kpi-watch':'kpi-neutral');setKpiTone('reportPatients',prev.patients&&s.patients>=prev.patients?'kpi-good':'kpi-neutral');setKpiTone('reportUnit',model.prevUnit&&unit>=model.prevUnit?'kpi-good':'kpi-neutral');
  const salesDiff=s.sales-prev.sales,patientDiff=s.patients-prev.patients,unitPrev=prev.patients?prev.sales/prev.patients:0,unitDiff=unit-unitPrev;
  let driver="来院数と客単価の両方";if(Math.abs(patientDiff)>0&&Math.abs(unitDiff)<500)driver="主に来院件数";else if(Math.abs(unitDiff)>=500&&Math.abs(patientDiff)<5)driver="主に客単価";
  $("reportSalesAnalysis").textContent=prev.sales?`総売上は${yen(s.sales)}で、前月比${salesDiff>=0?"＋":"−"}${yen(Math.abs(salesDiff))}です。${driver}が売上を支えています。月間目標に対する達成率は${pct(progress)}です。`:`総売上は${yen(s.sales)}、目標達成率は${pct(progress)}です。前月データがないため前月比較は表示していません。`;
  $("reportExpenseAnalysis").innerHTML=expenseItem("人件費",s.personnelExpense,prev.personnelExpense,"ベースアップや勤務体制の変化と、売上に対する人件費率を確認します。")+expenseItem("薬品・医療材料費",s.medicalExpense,prev.medicalExpense,"診療件数や検査・治療内容の増加に伴う変動かを確認します。")+expenseItem("カード決済手数料",s.cardFee,prev.cardFee,"カード売上の増加に比例した範囲かを確認します。");
  const good=[];if(progress>=100)good.push("月間売上目標を達成しました");if(rate>=30)good.push("利益率30%以上を維持しました");if(prev.patients&&s.patients>=prev.patients)good.push("来院件数が前月以上でした");if(unitPrev&&unit>=unitPrev)good.push("客単価が前月を上回りました");if(prev.checkups&&s.checkups>prev.checkups)good.push("健診件数が増加しました");
  const improve=[];if(progress<100)improve.push(`目標まであと${yen(Math.max(0,target-s.sales))}です`);if(rate<30&&s.sales)improve.push("利益率30%に向けて支出率を確認する余地があります");if(prev.patients&&s.patients<prev.patients)improve.push("来院件数が前月を下回っています");if(unitPrev&&unit<unitPrev)improve.push("客単価が前月を下回っています");if(!s.checkups)improve.push("健診件数を増やす余地があります");
  $("reportGoodPoints").innerHTML=(good.slice(0,3).length?good.slice(0,3):["データが増えると良かった点を表示します"]).map(x=>`<li>${x}</li>`).join("");$("reportImprovePoints").innerHTML=(improve.slice(0,3).length?improve.slice(0,3):["現時点で大きな改善警告はありません"]).map(x=>`<li>${x}</li>`).join("");
  const autoLearning=rate>=30?"支出が増えても、売上と利益率を同時に確認することで、成長投資か利益圧迫かを判断できた月でした。":"売上だけでなく支出構成を確認し、利益率を保つことの重要性が見えた月でした。";const saved=data.monthlyReports?.[m]?.learningText;$("reportLearning").value=saved||autoLearning;$("reportLearningStatus").textContent=saved?"保存済み":"自動案";
  const goals=[];goals.push(`月間売上${yen(target)}以上`);goals.push("利益率30%以上を維持");if(s.checkups<10)goals.push("健診10件以上");else if(unit)goals.push(`客単価${yen(Math.round(unit/1000)*1000)}以上を維持`);$("reportNextGoals").innerHTML=goals.slice(0,3).map(x=>`<li>${x}</li>`).join("");
  const condition=progress>=100&&rate>=30?"売上と利益の両面で好調":"改善余地を確認しながら前進",memoContext=memoAnalysis.top.length?` 日々のメモでは${memoAnalysis.top.map(x=>x.label).join("・")}の記録が目立ち、数値変化の背景として注目されます。`:"";$("reportSummary").textContent=`${monthLabel(m)}は「${condition}」な月です。${driver}が売上を支え、利益率は${pct(rate)}でした。${memoContext}支出では人件費・薬品医療材料費・カード決済手数料の3項目に絞って変化を確認し、来月は売上目標と利益率を両立させることが重点です。`;
}
function saveReportLearning(){const m=reportMonth();data.monthlyReports={...(data.monthlyReports||{}),[m]:{...(data.monthlyReports?.[m]||{}),learningText:$("reportLearning").value.trim(),updatedAt:new Date().toISOString()}};save();$("reportLearningStatus").textContent="保存済み";toast(`${monthLabel(m)}の学びを保存しました`)}
function moveReportMonth(delta){const [y,m]=reportMonth().split("-").map(Number),d=new Date(y,m-1+delta,1);$("reportMonthPicker").value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;renderMonthlyReport()}

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
function exportJson(){download(`dashboard-backup-${iso()}.json`,JSON.stringify(data,null,2),"application/json")}
function exportCsv(){const esc=v=>`"${String(v??"").replaceAll('"','""')}"`,head=["date","sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions","weatherCondition","temperature","rainProbability","note"],rows=data.entries.map(e=>head.map(k=>esc(k==="weatherCondition"?e.weather?.condition:k==="temperature"?e.weather?.temperature:k==="rainProbability"?e.weather?.rainProbability:e[k])).join(",")),months=[...new Set([...Object.keys(data.historical),...Object.keys(data.financeByMonth)])].sort(),monthly=[["month","clinicalSales","morikuboOnline","royalCanin","purina","ecSales","totalSales","expense","profit"],...months.map(m=>{const s=monthSummary(m);return [m,s.clinicalSales,s.morikuboOnline,s.royalCanin,s.purina,s.ecSales,s.sales,s.expense,s.sales-s.expense]})];download(`dashboard-${iso()}.csv`,"\uFEFF"+[head.join(","),...rows,"",...monthly.map(r=>r.map(esc).join(","))].join("\n"),"text/csv;charset=utf-8")}
function normalizeBackup(raw){
  let x=raw;
  if(x&&typeof x==="object"&&!Array.isArray(x)){
    if(x.data&&typeof x.data==="object")x=x.data;
    else if(x.payload&&typeof x.payload==="object")x=x.payload;
    else if(x.state&&typeof x.state==="object")x=x.state;
    else if(x[KEY]){try{x=typeof x[KEY]==="string"?JSON.parse(x[KEY]):x[KEY]}catch{}}
  }
  if(Array.isArray(x))x={entries:x};
  if(!x||typeof x!=="object")throw new Error("invalid backup");
  const entries=Array.isArray(x.entries)?x.entries:Array.isArray(x.records)?x.records:Array.isArray(x.dailyEntries)?x.dailyEntries:Array.isArray(x.dailyRecords)?x.dailyRecords:[];
  const hasRecognizedData=entries.length||Array.isArray(x.entries)||x.settings||x.finance||x.financeByMonth||x.historical||x.memo!==undefined;
  if(!hasRecognizedData)throw new Error("unsupported backup");
  return {...base,...x,entries,settings:{...(x.settings||{})},finance:{...base.finance,...(x.finance||{})},financeByMonth:{...(x.financeByMonth||{})},monthlyReports:{...(x.monthlyReports||{})},historical:{...HISTORICAL,...(x.historical||{})},clinic:{...DEFAULT_CLINIC,...(x.clinic||{}),closedDates:Array.isArray(x.clinic?.closedDates)?x.clinic.closedDates:[]}};
}
async function importJson(file){
  try{
    const text=(await file.text()).replace(/^\uFEFF/,"").trim();
    const parsed=JSON.parse(text);
    const restored=normalizeBackup(parsed);
    data=restored;save();render();toast(`復元しました（${data.entries.length}件）`);
    $("importJson").value="";
  }catch(err){
    console.error("backup import failed",err);
    alert("バックアップを読み込めませんでした。JSON形式の完全バックアップを選択してください。");
    $("importJson").value="";
  }
}
function deleteAll(){if(confirm("全データを削除しますか？")&&confirm("元に戻せません。よろしいですか？")){data=structuredClone(base);save();clearForm();render()}}
function updateIndicator(id){const active=PAGE_IDS.indexOf(id);$("pageIndicator").innerHTML=PAGE_IDS.map((_,i)=>`<i class="${i===active?'active':''}"></i>`).join('')}
function switchPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===id));updateIndicator(id);document.querySelector(`.tab[data-page="${id}"]`)?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});if(id==="month")month();if(id==="report")renderMonthlyReport();if(id==="year"){years();year()}if(id==="finance")finance();if(id==="settings")renderClinicSettings();window.scrollTo({top:0,behavior:"smooth"})}
function moveMonth(delta){const [y,m]=($("monthPicker").value||monthNow()).split("-").map(Number),d=new Date(y,m-1+delta,1);$("monthPicker").value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;month();finance()}
function setupSwipe(){let sx=0,sy=0,tracking=false;const root=$("pageContainer");root.addEventListener("touchstart",e=>{const t=e.target;if(t.closest("input,textarea,select,button,.table,nav"))return;const p=e.touches[0];sx=p.clientX;sy=p.clientY;tracking=true},{passive:true});root.addEventListener("touchend",e=>{if(!tracking)return;tracking=false;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.25)return;const current=document.querySelector(".page.active")?.id,index=PAGE_IDS.indexOf(current),next=dx<0?index+1:index-1;if(next>=0&&next<PAGE_IDS.length)switchPage(PAGE_IDS[next])},{passive:true})}
function render(){recent();month();renderMonthlyReport();years();year();finance();renderClinicSettings();storage();renderTodaySummary();renderDailyAI();renderAIBrief();renderManagementInsight();$("memoText").value=data.memo||""}
function setupAIBriefFold(){const card=$("aiBriefCard");if(!card)return;const saved=localStorage.getItem("v9AlphaBriefOpen");if(saved!==null)card.open=saved==="1";card.addEventListener("toggle",()=>localStorage.setItem("v9AlphaBriefOpen",card.open?"1":"0"))}
function init(){$("todayLabel").textContent=new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"});$("entryDate").value=iso();$("monthPicker").value=monthNow();$("reportMonthPicker").value=monthNow();document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).oninput=preview);$("entryDate").onchange=()=>{const e=data.entries.find(x=>x.date===$("entryDate").value);if(e)edit(e.date)};$("saveEntry").onclick=saveEntry;$("clearEntry").onclick=clearForm;$("saveSettings").onclick=saveSettings;$("monthPicker").onchange=()=>{month();finance()};$("prevMonth").onclick=()=>moveMonth(-1);$("nextMonth").onclick=()=>moveMonth(1);$("yearPicker").onchange=year;$("saveFinance").onclick=saveFinance;$("reportMonthPicker").onchange=renderMonthlyReport;$("reportPrevMonth").onclick=()=>moveReportMonth(-1);$("reportNextMonth").onclick=()=>moveReportMonth(1);$("saveReportLearning").onclick=saveReportLearning;$("saveClinicSettings").onclick=saveClinicSettings;$("memoText").oninput=()=>{clearTimeout(memoTimer);$("memoStatus").textContent="保存中…";memoTimer=setTimeout(()=>{data.memo=$("memoText").value;save();$("memoStatus").textContent="保存済み"},500)};$("exportJson").onclick=exportJson;$("exportCsv").onclick=exportCsv;$("importJson").onchange=e=>e.target.files[0]&&importJson(e.target.files[0]);$("deleteAll").onclick=deleteAll;setupSwipe();setupAIBriefFold();$("refreshWeather").onclick=()=>fetchWeather(true);switchPage("today");render();renderTodaySummary();fetchWeather();if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
init();
})();
