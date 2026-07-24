(()=>{"use strict";
const KEY="keitaDashboardSimpleV1";
const PAGE_IDS=["today","month","year","finance","memo","data"];
const MONTHLY_TARGET=5000000;
const HISTORICAL={
  "2026-01":{sales:3442266,expense:3268225},
  "2026-02":{sales:3222540,expense:3235228},
  "2026-03":{sales:4034046,expense:3426718},
  "2026-04":{sales:5635647,expense:3761329},
  "2026-05":{sales:4973297,expense:3746638},
  "2026-06":{sales:4727145,expense:3666032}
};
const base={entries:[],settings:{},weatherCache:null,finance:{balance:0,monthlyExpense:0,loan:0,repayment:0,incomeTarget:0},financeByMonth:{},historical:{...HISTORICAL},memo:""};
let data=load(),memoTimer;
const $=id=>document.getElementById(id),num=id=>Math.max(0,Number($(id).value)||0);
const yen=v=>`${Math.round(Number(v)||0).toLocaleString("ja-JP")}円`,pct=v=>`${(Number(v)||0).toFixed(1)}%`;
const iso=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const monthNow=()=>iso().slice(0,7);
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||"{}");const settings={...(raw.settings||{})};Object.keys(settings).forEach(m=>{if(!settings[m].target||settings[m].target===4500000)settings[m].target=MONTHLY_TARGET});return {...base,...raw,settings,finance:{...base.finance,...(raw.finance||{})},financeByMonth:{...(raw.financeByMonth||{})},historical:{...HISTORICAL,...(raw.historical||{})},entries:Array.isArray(raw.entries)?raw.entries:[]}}catch{return structuredClone(base)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));storage()}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout($("toast").t);$("toast").t=setTimeout(()=>$("toast").classList.remove("show"),1600)}
function preview(){const s=num("sales"),p=num("patients");$("todaySales").textContent=yen(s);$("todayPatients").textContent=`${p}件`;$("todayUnit").textContent=yen(p?s/p:0);$("todayNew").textContent=`${num("newPatients")}件`;renderDailyAI()}
const WEATHER_CODES={0:["快晴","☀️"],1:["晴れ","🌤️"],2:["一部曇り","⛅"],3:["曇り","☁️"],45:["霧","🌫️"],48:["霧","🌫️"],51:["弱い霧雨","🌦️"],53:["霧雨","🌦️"],55:["強い霧雨","🌧️"],61:["小雨","🌦️"],63:["雨","🌧️"],65:["強い雨","🌧️"],71:["小雪","🌨️"],73:["雪","🌨️"],75:["大雪","❄️"],80:["にわか雨","🌦️"],81:["にわか雨","🌧️"],82:["激しいにわか雨","⛈️"],95:["雷雨","⛈️"],96:["雷雨・ひょう","⛈️"],99:["強い雷雨・ひょう","⛈️"]};
function showWeather(w,offline=false){
  if(!w)return;
  $("weatherIcon").textContent=w.icon||"🌤️";
  $("weatherTemp").textContent=`${Math.round(Number(w.temperature)||0)}°`;
  $("weatherCondition").textContent=w.condition+(offline?"（保存値）":"");
  $("weatherRain").textContent=`${Math.round(Number(w.rainProbability)||0)}%`;
  renderDailyAI();
}
async function fetchWeather(force=false){
  const cached=data.weatherCache,age=cached?Date.now()-Number(cached.fetchedAt||0):Infinity;
  if(!force&&cached&&age<30*60*1000){showWeather(cached);return}
  try{
    $("weatherCondition").textContent="天気を取得中";
    const url="https://api.open-meteo.com/v1/forecast?latitude=35.544&longitude=139.570&current=temperature_2m,weather_code&daily=precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=1";
    const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error("weather");
    const j=await r.json(),code=Number(j.current?.weather_code||0),desc=WEATHER_CODES[code]||["天気","🌤️"];
    const w={condition:desc[0],icon:desc[1],temperature:Number(j.current?.temperature_2m)||0,rainProbability:Number(j.daily?.precipitation_probability_max?.[0])||0,code,fetchedAt:Date.now()};
    data.weatherCache=w;save();showWeather(w);
  }catch(e){
    if(cached)showWeather(cached,true);else{$("weatherIcon").textContent="—";$("weatherTemp").textContent="--°";$("weatherCondition").textContent="取得できません";$("weatherRain").textContent="--%"}
  }
}
function renderTodaySummary(){const e=data.entries.find(x=>x.date===iso())||{sales:0,patients:0,newPatients:0};$("todaySales").textContent=yen(e.sales);$("todayPatients").textContent=`${Number(e.patients)||0}件`;$("todayUnit").textContent=yen(e.patients?e.sales/e.patients:0);$("todayNew").textContent=`${Number(e.newPatients)||0}件`}
function clearForm(){$("entryDate").value=iso();["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).value="");$("note").value="";$("saveEntry").textContent="保存する";renderTodaySummary()}
function saveEntry(){const date=$("entryDate").value;if(!date)return toast("日付を入力してください");const e={date,sales:num("sales"),patients:num("patients"),newPatients:num("newPatients"),surgeries:num("surgeries"),checkups:num("checkups"),trimmings:num("trimmings"),secondOpinions:num("secondOpinions"),weather:data.weatherCache?{condition:data.weatherCache.condition,temperature:data.weatherCache.temperature,rainProbability:data.weatherCache.rainProbability,code:data.weatherCache.code}:null,note:$("note").value.trim()};const i=data.entries.findIndex(x=>x.date===date);if(i>=0)data.entries[i]=e;else data.entries.push(e);data.entries.sort((a,b)=>a.date.localeCompare(b.date));save();render();clearForm();toast(i>=0?"更新しました":"保存しました")}
function edit(date){const e=data.entries.find(x=>x.date===date);if(!e)return;["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).value=e[id]||"");$("entryDate").value=e.date;$("note").value=e.note||"";$("saveEntry").textContent="更新する";preview();switchPage("today");setTimeout(()=>$("entryDate").scrollIntoView({behavior:"smooth",block:"center"}),150)}
function del(date){if(!confirm(`${date}の記録を削除しますか？`))return;data.entries=data.entries.filter(x=>x.date!==date);save();render();toast("削除しました")}
function sum(entries){return entries.reduce((a,e)=>{["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(k=>a[k]+=(Number(e[k])||0));return a},{sales:0,patients:0,newPatients:0,surgeries:0,checkups:0,trimmings:0,secondOpinions:0})}
function monthSummary(m){
  const entries=data.entries.filter(e=>e.date.startsWith(m)),daily=sum(entries),hist=data.historical[m]||{};
  const fallbackCurrent=(m===monthNow()?data.finance.monthlyExpense:0);
  return {...daily,sales:daily.sales||Number(hist.sales)||0,entries,expense:Number(data.financeByMonth[m]?.monthlyExpense ?? hist.expense ?? fallbackCurrent ?? 0)||0}
}
function recent(){const t=$("recent"),rows=[...data.entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);t.innerHTML=rows.length?rows.map(e=>`<tr><td>${e.date}</td><td>${yen(e.sales)}</td><td>${e.patients}件</td><td>${e.newPatients||0}件</td><td class="record-actions"><button class="edit-record" data-edit="${e.date}">編集</button><button data-del="${e.date}">削除</button></td></tr>`).join(""):'<tr><td colspan="5">まだ記録がありません。</td></tr>';t.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(b.dataset.edit));t.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>del(b.dataset.del))}

const WEEKDAYS=["日","月","火","水","木","金","土"];
const avg=(rows,key)=>rows.length?rows.reduce((a,e)=>a+(Number(e[key])||0),0)/rows.length:0;
function weekdayName(date){return WEEKDAYS[new Date(`${date}T12:00:00`).getDay()]+"曜日"}
function isRainy(e){const code=Number(e.weather?.code);return [51,53,55,61,63,65,80,81,82,95,96,99].includes(code)||(Number(e.weather?.rainProbability)||0)>=50||/雨|雷/.test(e.weather?.condition||"")}
function isSunny(e){const code=Number(e.weather?.code);return [0,1].includes(code)||/快晴|晴れ/.test(e.weather?.condition||"")}
function analysisFor(entries){
  const usable=entries.filter(e=>e.sales||e.patients||e.weather);
  const groups={};usable.forEach(e=>{const k=weekdayName(e.date);(groups[k]??=[]).push(e)});
  const weekdayRows=Object.entries(groups).map(([name,rows])=>({name,rows,sales:avg(rows,"sales"),patients:avg(rows,"patients")})).sort((a,b)=>b.sales-a.sales);
  const rain=usable.filter(isRainy),sunny=usable.filter(isSunny),hot=usable.filter(e=>Number(e.weather?.temperature)>=30),weatherKnown=usable.filter(e=>e.weather);
  return {usable,weekdayRows,rain,sunny,hot,weatherKnown,overallSales:avg(usable,"sales"),overallPatients:avg(usable,"patients")};
}
function renderDailyAI(){
  const date=$("entryDate")?.value||iso(),saved=data.entries.find(e=>e.date===date),w=date===iso()?data.weatherCache:saved?.weather;
  const sales=num("sales")||Number(saved?.sales)||0,patients=num("patients")||Number(saved?.patients)||0,newP=num("newPatients")||Number(saved?.newPatients)||0,second=num("secondOpinions")||Number(saved?.secondOpinions)||0;
  const history=data.entries.filter(e=>e.date!==date),sameDay=history.filter(e=>weekdayName(e.date)===weekdayName(date));
  const basePatients=avg(sameDay.length?sameDay:history,"patients"),baseSales=avg(sameDay.length?sameDay:history,"sales");
  let title="今日のデータを待っています",text="天気と入力内容を組み合わせて、今日の評価と行動提案を表示します。",tags=[];
  if(w||sales||patients){
    const weatherText=w?`${w.condition}・${Math.round(Number(w.temperature)||0)}℃`:"天気未記録";
    const notes=[];
    if(patients&&basePatients){const d=(patients/basePatients-1)*100;notes.push(`来院数は同じ曜日の平均より${Math.abs(d).toFixed(0)}%${d>=0?"多め":"少なめ"}です。`)}
    if(sales&&baseSales){const d=(sales/baseSales-1)*100;notes.push(`売上は比較基準より${Math.abs(d).toFixed(0)}%${d>=0?"上振れ":"下振れ"}しています。`)}
    if(w&&Number(w.temperature)>=30)notes.push("高温日です。熱中症注意喚起と、涼しい時間帯の来院案内が適しています。");
    else if(w&&isRainy({weather:w}))notes.push("雨天です。空き枠があればLINEやストーリーズで当日受診を案内する余地があります。");
    if(second>0)notes.push(`セカンドオピニオン${second}件は、専門相談先としての信頼蓄積につながっています。`);
    if(newP===0&&patients>=10)notes.push("新患がないため、口コミ返信や症例発信を1つ行うと新患導線を維持できます。");
    title=`${weatherText}の経営コメント`;
    text=notes.slice(0,3).join(" ")||"データは安定しています。予約状況と診療負荷を確認し、無理のない運営を優先しましょう。";
    tags=[weekdayName(date),w?.condition,patients?`来院${patients}件`:null,second?`専門相談${second}件`:null].filter(Boolean);
  }
  $("dailyAiTitle").textContent=title;$("dailyAiText").textContent=text;$("dailyAiTags").innerHTML=tags.map(t=>`<span>${t}</span>`).join("");
}
function renderWeatherBusiness(entries,s,forecast,set,left){
  const a=analysisFor(entries),sample=a.usable.length;$("analysisSample").textContent=`${sample}日分`;
  const best=a.weekdayRows[0];$("bestWeekday").textContent=best?best.name:"—";$("bestWeekdaySub").textContent=best?`平均 ${yen(best.sales)}・${best.patients.toFixed(1)}件`:"3日以上で分析";
  $("rainAvgSales").textContent=a.rain.length?yen(avg(a.rain,"sales")):"—";
  $("rainImpact").textContent=a.rain.length&&a.overallSales?`全体比 ${((avg(a.rain,"sales")/a.overallSales-1)*100).toFixed(0)}%（${a.rain.length}日）`:"雨データ待ち";
  $("sunnyAvgPatients").textContent=a.sunny.length?`${avg(a.sunny,"patients").toFixed(1)}件`:"—";
  $("sunnyImpact").textContent=a.sunny.length&&a.overallPatients?`全体比 ${((avg(a.sunny,"patients")/a.overallPatients-1)*100).toFixed(0)}%（${a.sunny.length}日）`:"晴天データ待ち";
  $("hotAvgPatients").textContent=a.hot.length?`${avg(a.hot,"patients").toFixed(1)}件`:"—";$("hotImpact").textContent=a.hot.length?`全体比 ${a.overallPatients?((avg(a.hot,"patients")/a.overallPatients-1)*100).toFixed(0):0}%（${a.hot.length}日）`:"30℃以上のデータ待ち";
  const actions=[];
  if(sample<3)actions.push({p:"データ蓄積",t:"まず3営業日以上を入力すると、曜日・天気別の比較が始まります。"});
  if(a.rain.length>=2&&a.overallSales&&avg(a.rain,"sales")<a.overallSales*.9)actions.push({p:"雨天対策",t:`雨の日の売上は全体平均より約${Math.abs((avg(a.rain,"sales")/a.overallSales-1)*100).toFixed(0)}%低めです。雨予報の前日にLINEで予約確認と当日枠を案内しましょう。`});
  if(a.hot.length>=2&&a.overallPatients&&avg(a.hot,"patients")<a.overallPatients*.9)actions.push({p:"高温日対策",t:"30℃以上の日は来院が減る傾向です。午前・夕方の受診案内と熱中症注意喚起を組み合わせましょう。"});
  if(best&&a.weekdayRows.length>=2){const worst=a.weekdayRows[a.weekdayRows.length-1];if(best.sales>worst.sales*1.25)actions.push({p:"曜日最適化",t:`${best.name}は好調、${worst.name}は弱めです。弱い曜日に健診・再診フォロー・当日枠告知を集中すると効率的です。`})}
  if((s.secondOpinions||0)>=3)actions.push({p:"専門性を発信",t:`セカンドオピニオンが${s.secondOpinions}件あります。匿名化した症例解説や「相談できる疾患」を発信し、強みを明確にしましょう。`});
  if(s.checkups<Math.max(2,Math.ceil(sample*.2)))actions.push({p:"健診を底上げ",t:"健診件数が少なめです。天気の良い日にLINE・Instagramで健診枠を案内すると動きやすくなります。"});
  if(forecast<set.target&&left>0)actions.push({p:"目標差を埋める",t:`月末予測は${yen(forecast)}です。新規施策を増やすより、健診・再診・予防の案内漏れを減らすことを優先しましょう。`});
  $("aiActionList").innerHTML=actions.slice(0,3).map((x,i)=>`<article><b>${i+1}</b><div><strong>${x.p}</strong><p>${x.t}</p></div></article>`).join("")||"<p>大きな弱点は見られません。現在の診療品質と負荷管理を維持しましょう。</p>";
}
function month(){
  const m=$("monthPicker").value||monthNow(),s=monthSummary(m),entries=s.entries,set=data.settings[m]||{target:MONTHLY_TARGET,businessDays:26};
  $("target").value=set.target;$("businessDays").value=set.businessDays;$("monthSales").textContent=yen(s.sales);$("monthPatients").textContent=`${s.patients}件`;$("monthUnit").textContent=yen(s.patients?s.sales/s.patients:0);$("monthNew").textContent=`${s.newPatients}件`;$("monthSurgery").textContent=`${s.surgeries}件`;$("monthCheckup").textContent=`${s.checkups}件`;$("monthTrim").textContent=`${s.trimmings}件`;$("monthSecond").textContent=`${s.secondOpinions||0}件`;
  const days=Math.max(1,set.businessDays||26),done=new Set(entries.map(e=>e.date)).size,left=Math.max(0,days-done),progress=set.target?s.sales/set.target*100:0,need=left?Math.max(0,set.target-s.sales)/left:Math.max(0,set.target-s.sales),avgDaily=done?s.sales/done:0,forecast=done?avgDaily*days:s.sales,gap=set.target-forecast;
  $("progressText").textContent=pct(progress);$("needDaily").textContent=yen(need);$("forecast").textContent=yen(forecast);$("progressBar").style.width=`${Math.min(100,progress)}%`;$("monthComment").textContent=done?`記録 ${done}営業日／設定 ${days}営業日。残り${left}営業日です。`:(s.sales?"過去の月間売上データを表示しています。日次内訳はありません。":"記録はまだありません。");
  $("aiForecastValue").textContent=yen(forecast);$("aiForecastComment").textContent=done?(forecast>=set.target?`現在の日商${yen(avgDaily)}を維持すると、目標を約${yen(forecast-set.target)}上回る見込みです。`:`現在のペースでは目標まで約${yen(Math.max(0,gap))}不足する見込みです。残り${left}営業日の必要日商は${yen(need)}です。`):(s.sales?"この月は確定済みの月間売上です。":"まだ今月の記録がありません。1日分入力すると予測が始まります。");
  const a=analysisFor(entries);let title="データ待ち",text="記録を入力すると、天気と曜日を含めた提案を表示します。";
  if(done>0){const second=s.secondOpinions||0,best=a.weekdayRows[0];if(a.rain.length>=2&&a.overallSales&&avg(a.rain,"sales")<a.overallSales*.9){title="雨の日の来院導線を強化";text="雨天日の実績が全体平均を下回っています。前日の予約確認と当日枠の告知を組み合わせましょう。"}else if(second>=Math.max(3,Math.ceil(done*.3))){title="専門相談の増加が強み";text=`今月のセカンドオピニオンは${second}件です。専門的な相談先としての認知を、症例発信でさらに定着させましょう。`}else if(best){title=`${best.name}の強みを活用`;text=`${best.name}は平均売上${yen(best.sales)}で最も好調です。弱い曜日への再診・健診誘導に、この傾向を活かしましょう。`}else{title="現在のペースを維持";text="売上・来院・天気を継続記録すると、提案精度がさらに上がります。"}}
  $("aiSuggestionTitle").textContent=title;$("aiSuggestionText").textContent=text;renderWeatherBusiness(entries,s,forecast,set,left);
}
function saveSettings(){const m=$("monthPicker").value||monthNow();data.settings[m]={target:num("target"),businessDays:Math.max(1,num("businessDays")||26)};save();month();toast("目標を保存しました")}
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
  const salesPath=smoothPath(salesPts),profitPath=smoothPath(profitPts),area=`${salesPath} L${x(visible.length-1).toFixed(1)},${(h-pad.b).toFixed(1)} L${x(0).toFixed(1)},${(h-pad.b).toFixed(1)} Z`;
  const targetY=y(target),months=visible.map((r,i)=>`<text x="${x(i)}" y="${h-12}" text-anchor="middle" class="chart-month">${i+1}月</text>`).join('');
  const hits=visible.map((r,i)=>{const profit=r.sales-r.expense,rate=r.sales?profit/r.sales*100:0,left=i?((x(i-1)+x(i))/2):pad.l,right=i<visible.length-1?((x(i)+x(i+1))/2):w-pad.r;return `<g class="chart-hit" tabindex="0" data-month="${i+1}" data-sales="${r.sales}" data-profit="${profit}" data-rate="${rate.toFixed(1)}"><rect x="${left}" y="${pad.t}" width="${Math.max(24,right-left)}" height="${plotH}" fill="transparent"/><line x1="${x(i)}" y1="${pad.t}" x2="${x(i)}" y2="${h-pad.b}" class="focus-line"/><circle cx="${x(i)}" cy="${y(r.sales)}" r="5.5" class="chart-dot sales-dot"/><circle cx="${x(i)}" cy="${y(Math.max(0,profit))}" r="4.5" class="chart-dot profit-dot"/></g>`}).join('');
  el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00a99d" stop-opacity=".28"/><stop offset="62%" stop-color="#00a99d" stop-opacity=".08"/><stop offset="100%" stop-color="#00a99d" stop-opacity="0"/></linearGradient><filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><line x1="${pad.l}" y1="${targetY}" x2="${w-pad.r}" y2="${targetY}" class="target-line"/><text x="${w-pad.r}" y="${targetY-8}" text-anchor="end" class="target-label">目標 500万円</text><path d="${area}" class="sales-area"/><path d="${salesPath}" class="sales-line premium-line"/><path d="${profitPath}" class="profit-line"/>${months}${hits}</svg>`;
  const select=g=>{el.querySelectorAll('.chart-hit').forEach(x=>x.classList.toggle('selected',x===g));detail.innerHTML=`<strong>${g.dataset.month}月</strong><span>売上 ${yen(g.dataset.sales)}</span><span>利益 ${yen(g.dataset.profit)}</span><span>利益率 ${g.dataset.rate}%</span>`};
  el.querySelectorAll('.chart-hit').forEach(g=>{g.addEventListener('click',()=>select(g));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g)}})});select(el.querySelector('.chart-hit:last-of-type'));
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

function renderBrandScore(s){
  const patients=Math.max(0,Number(s.patients)||0),activeDays=new Set((s.entries||[]).map(e=>e.date)).size;
  const newRate=patients?(Number(s.newPatients)||0)/patients:0;
  const second=Number(s.secondOpinions)||0,checkups=Number(s.checkups)||0,surgeries=Number(s.surgeries)||0;
  const score=Math.round(clamp(35+clamp(newRate/.08*25,0,25)+clamp(second/Math.max(1,activeDays*.3)*25,0,25)+clamp((checkups+surgeries)/Math.max(1,activeDays*.35)*15,0,15),0,100));
  animateNumber($("brandScore"),score,v=>String(Math.round(v)),600);
  let comment="新患・健診・手術・セカンドオピニオンから算出します。";
  if(activeDays){
    if(second>=Math.max(3,activeDays*.3))comment=`セカンドオピニオン${second}件。専門的な相談先としての認知が強まっています。`;
    else if(newRate>=.08)comment=`新患比率は${(newRate*100).toFixed(1)}%。地域での新しい接点が順調です。`;
    else comment="現在は安定運用です。信頼指標は月ごとの推移で見るのがおすすめです。";
  }
  $("brandComment").textContent=comment;
}
function finance(){const m=$("monthPicker").value||monthNow(),f=data.finance,mf=data.financeByMonth[m]||{},hist=data.historical[m]||{},expense=Number(mf.monthlyExpense ?? hist.expense ?? (m===monthNow()?f.monthlyExpense:0))||0;$("balance").value=f.balance||"";$("monthlyExpense").value=expense||"";$("loan").value=f.loan||"";$("repayment").value=f.repayment||"";$("incomeTarget").value=f.incomeTarget||"";const s=monthSummary(m),profit=s.sales-expense;renderBrandScore(s);$("monthProfit").textContent=yen(profit);$("profitRate").textContent=pct(s.sales?profit/s.sales*100:0);$("netAssets").textContent=yen(f.balance-f.loan)}
function saveFinance(){const m=$("monthPicker").value||monthNow();data.finance={balance:num("balance"),monthlyExpense:num("monthlyExpense"),loan:num("loan"),repayment:num("repayment"),incomeTarget:num("incomeTarget")};data.financeByMonth[m]={monthlyExpense:num("monthlyExpense")};save();finance();month();year();toast(`${m}の財務情報を保存しました`)}
function storage(){const size=new Blob([JSON.stringify(data)]).size;$("storage").textContent=`日別記録 ${data.entries.length}件、月間過去データ ${Object.keys(data.historical).length}か月、使用容量 約${(size/1024).toFixed(1)}KB`}
function download(name,text,type){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([text],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function exportJson(){download(`dashboard-backup-${iso()}.json`,JSON.stringify(data,null,2),"application/json")}
function exportCsv(){const esc=v=>`"${String(v??"").replaceAll('"','""')}"`,head=["date","sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions","weatherCondition","temperature","rainProbability","note"],rows=data.entries.map(e=>head.map(k=>esc(k==="weatherCondition"?e.weather?.condition:k==="temperature"?e.weather?.temperature:k==="rainProbability"?e.weather?.rainProbability:e[k])).join(",")),monthly=[["month","sales","expense"],...Object.keys(data.historical).sort().map(m=>[m,data.historical[m].sales||0,data.financeByMonth[m]?.monthlyExpense??data.historical[m].expense??0])];download(`dashboard-${iso()}.csv`,"\uFEFF"+[head.join(","),...rows,"",...monthly.map(r=>r.map(esc).join(","))].join("\n"),"text/csv;charset=utf-8")}
async function importJson(file){try{const x=JSON.parse(await file.text());if(!Array.isArray(x.entries))throw 0;data={...base,...x,finance:{...base.finance,...(x.finance||{})},financeByMonth:{...(x.financeByMonth||{})},historical:{...HISTORICAL,...(x.historical||{})}};save();render();toast("復元しました")}catch{alert("読み込めませんでした")}}
function deleteAll(){if(confirm("全データを削除しますか？")&&confirm("元に戻せません。よろしいですか？")){data=structuredClone(base);save();clearForm();render()}}
function updateIndicator(id){const active=PAGE_IDS.indexOf(id);$("pageIndicator").innerHTML=PAGE_IDS.map((_,i)=>`<i class="${i===active?'active':''}"></i>`).join('')}
function switchPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===id));updateIndicator(id);document.querySelector(`.tab[data-page="${id}"]`)?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});if(id==="month")month();if(id==="year"){years();year()}if(id==="finance")finance();window.scrollTo({top:0,behavior:"smooth"})}
function moveMonth(delta){const [y,m]=($("monthPicker").value||monthNow()).split("-").map(Number),d=new Date(y,m-1+delta,1);$("monthPicker").value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;month();finance()}
function setupSwipe(){let sx=0,sy=0,tracking=false;const root=$("pageContainer");root.addEventListener("touchstart",e=>{const t=e.target;if(t.closest("input,textarea,select,button,.table,nav"))return;const p=e.touches[0];sx=p.clientX;sy=p.clientY;tracking=true},{passive:true});root.addEventListener("touchend",e=>{if(!tracking)return;tracking=false;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.25)return;const current=document.querySelector(".page.active")?.id,index=PAGE_IDS.indexOf(current),next=dx<0?index+1:index-1;if(next>=0&&next<PAGE_IDS.length)switchPage(PAGE_IDS[next])},{passive:true})}
function render(){recent();month();years();year();finance();storage();renderTodaySummary();renderDailyAI();$("memoText").value=data.memo||""}
function init(){$("todayLabel").textContent=new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"});$("entryDate").value=iso();$("monthPicker").value=monthNow();document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].forEach(id=>$(id).oninput=preview);$("entryDate").onchange=()=>{const e=data.entries.find(x=>x.date===$("entryDate").value);if(e)edit(e.date)};$("saveEntry").onclick=saveEntry;$("clearEntry").onclick=clearForm;$("saveSettings").onclick=saveSettings;$("monthPicker").onchange=()=>{month();finance()};$("prevMonth").onclick=()=>moveMonth(-1);$("nextMonth").onclick=()=>moveMonth(1);$("yearPicker").onchange=year;$("saveFinance").onclick=saveFinance;$("memoText").oninput=()=>{clearTimeout(memoTimer);$("memoStatus").textContent="保存中…";memoTimer=setTimeout(()=>{data.memo=$("memoText").value;save();$("memoStatus").textContent="保存済み"},500)};$("exportJson").onclick=exportJson;$("exportCsv").onclick=exportCsv;$("importJson").onchange=e=>e.target.files[0]&&importJson(e.target.files[0]);$("deleteAll").onclick=deleteAll;setupSwipe();$("refreshWeather").onclick=()=>fetchWeather(true);switchPage("today");render();renderTodaySummary();fetchWeather();if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
init();
})();