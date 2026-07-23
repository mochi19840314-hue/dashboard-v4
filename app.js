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
const base={entries:[],settings:{},finance:{balance:0,monthlyExpense:0,loan:0,repayment:0,incomeTarget:0},financeByMonth:{},historical:{...HISTORICAL},memo:""};
let data=load(),memoTimer;
const $=id=>document.getElementById(id),num=id=>Math.max(0,Number($(id).value)||0);
const yen=v=>`${Math.round(Number(v)||0).toLocaleString("ja-JP")}円`,pct=v=>`${(Number(v)||0).toFixed(1)}%`;
const iso=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const monthNow=()=>iso().slice(0,7);
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||"{}");const settings={...(raw.settings||{})};Object.keys(settings).forEach(m=>{if(!settings[m].target||settings[m].target===4500000)settings[m].target=MONTHLY_TARGET});return {...base,...raw,settings,finance:{...base.finance,...(raw.finance||{})},financeByMonth:{...(raw.financeByMonth||{})},historical:{...HISTORICAL,...(raw.historical||{})},entries:Array.isArray(raw.entries)?raw.entries:[]}}catch{return structuredClone(base)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));storage()}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");clearTimeout($("toast").t);$("toast").t=setTimeout(()=>$("toast").classList.remove("show"),1600)}
function preview(){const s=num("sales"),p=num("patients");$("todaySales").textContent=yen(s);$("todayPatients").textContent=`${p}件`;$("todayUnit").textContent=yen(p?s/p:0);$("todayNew").textContent=`${num("newPatients")}件`}
function renderTodaySummary(){const e=data.entries.find(x=>x.date===iso())||{sales:0,patients:0,newPatients:0};$("todaySales").textContent=yen(e.sales);$("todayPatients").textContent=`${Number(e.patients)||0}件`;$("todayUnit").textContent=yen(e.patients?e.sales/e.patients:0);$("todayNew").textContent=`${Number(e.newPatients)||0}件`}
function clearForm(){$("entryDate").value=iso();["sales","patients","newPatients","surgeries","checkups","trimmings"].forEach(id=>$(id).value="");$("note").value="";$("saveEntry").textContent="保存する";renderTodaySummary()}
function saveEntry(){const date=$("entryDate").value;if(!date)return toast("日付を入力してください");const e={date,sales:num("sales"),patients:num("patients"),newPatients:num("newPatients"),surgeries:num("surgeries"),checkups:num("checkups"),trimmings:num("trimmings"),note:$("note").value.trim()};const i=data.entries.findIndex(x=>x.date===date);if(i>=0)data.entries[i]=e;else data.entries.push(e);data.entries.sort((a,b)=>a.date.localeCompare(b.date));save();render();clearForm();toast(i>=0?"更新しました":"保存しました")}
function edit(date){const e=data.entries.find(x=>x.date===date);if(!e)return;["sales","patients","newPatients","surgeries","checkups","trimmings"].forEach(id=>$(id).value=e[id]||"");$("entryDate").value=e.date;$("note").value=e.note||"";$("saveEntry").textContent="更新する";preview();switchPage("today");setTimeout(()=>$("entryDate").scrollIntoView({behavior:"smooth",block:"center"}),150)}
function del(date){if(!confirm(`${date}の記録を削除しますか？`))return;data.entries=data.entries.filter(x=>x.date!==date);save();render();toast("削除しました")}
function sum(entries){return entries.reduce((a,e)=>{["sales","patients","newPatients","surgeries","checkups","trimmings"].forEach(k=>a[k]+=(Number(e[k])||0));return a},{sales:0,patients:0,newPatients:0,surgeries:0,checkups:0,trimmings:0})}
function monthSummary(m){
  const entries=data.entries.filter(e=>e.date.startsWith(m)),daily=sum(entries),hist=data.historical[m]||{};
  const fallbackCurrent=(m===monthNow()?data.finance.monthlyExpense:0);
  return {...daily,sales:daily.sales||Number(hist.sales)||0,entries,expense:Number(data.financeByMonth[m]?.monthlyExpense ?? hist.expense ?? fallbackCurrent ?? 0)||0}
}
function recent(){const t=$("recent"),rows=[...data.entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);t.innerHTML=rows.length?rows.map(e=>`<tr><td>${e.date}</td><td>${yen(e.sales)}</td><td>${e.patients}件</td><td>${e.newPatients||0}件</td><td class="record-actions"><button class="edit-record" data-edit="${e.date}">編集</button><button data-del="${e.date}">削除</button></td></tr>`).join(""):'<tr><td colspan="5">まだ記録がありません。</td></tr>';t.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(b.dataset.edit));t.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>del(b.dataset.del))}
function month(){const m=$("monthPicker").value||monthNow(),s=monthSummary(m),entries=s.entries,set=data.settings[m]||{target:MONTHLY_TARGET,businessDays:26};$("target").value=set.target;$("businessDays").value=set.businessDays;$("monthSales").textContent=yen(s.sales);$("monthPatients").textContent=`${s.patients}件`;$("monthUnit").textContent=yen(s.patients?s.sales/s.patients:0);$("monthNew").textContent=`${s.newPatients}件`;$("monthSurgery").textContent=`${s.surgeries}件`;$("monthCheckup").textContent=`${s.checkups}件`;$("monthTrim").textContent=`${s.trimmings}件`;const days=Math.max(1,set.businessDays||26),done=new Set(entries.map(e=>e.date)).size,left=Math.max(0,days-done),progress=set.target?s.sales/set.target*100:0,need=left?Math.max(0,set.target-s.sales)/left:Math.max(0,set.target-s.sales),avgDaily=done?s.sales/done:0,forecast=done?avgDaily*days:s.sales,gap=set.target-forecast;$("progressText").textContent=pct(progress);$("needDaily").textContent=yen(need);$("forecast").textContent=yen(forecast);$("progressBar").style.width=`${Math.min(100,progress)}%`;$("monthComment").textContent=done?`記録 ${done}営業日／設定 ${days}営業日。残り${left}営業日です。`:(s.sales?"過去の月間売上データを表示しています。日次内訳はありません。":"記録はまだありません。");$("aiForecastValue").textContent=yen(forecast);let fc=done?(forecast>=set.target?`現在の日商${yen(avgDaily)}を維持すると、目標を約${yen(forecast-set.target)}上回る見込みです。`:`現在のペースでは目標まで約${yen(Math.max(0,gap))}不足する見込みです。残り${left}営業日の必要日商は${yen(need)}です。`):(s.sales?"この月は確定済みの月間売上です。":"まだ今月の記録がありません。1日分入力すると予測が始まります。");$("aiForecastComment").textContent=fc;let title="データ待ち",text="記録を入力すると、優先度の高い提案を1つ表示します。";if(done>0){const npp=s.newPatients/done,unit=s.patients?s.sales/s.patients:0;if(s.checkups<Math.max(2,Math.ceil(done*0.25))){title="健診の案内を優先";text=`今月の健診は${s.checkups}件です。現在の診療日数に対して少なめなので、LINEで健康診断のお知らせを配信するのがおすすめです。`}else if(forecast<set.target&&left>0){title="目標との差を確認";text=`月末予測は${yen(forecast)}です。目標との差は約${yen(Math.max(0,gap))}。健診・予防・再診フォローの案内を1つ実行しましょう。`}else if(npp<0.08){title="新患導線を見直し";text=`新患は${s.newPatients}件です。Google口コミへの返信やInstagram更新など、来院前の接点を1つ整えるとよい時期です。`}else if(unit>0&&unit<9000){title="客単価を確認";text=`平均客単価は${yen(unit)}です。必要な血液検査・画像検査・予防提案が十分に伝わっているか、診療後に軽く振り返りましょう。`}else{title="現在のペースを維持";text=`売上予測は${yen(forecast)}、健診${s.checkups}件、新患${s.newPatients}件です。大きな弱点は見られないため、予約枠と術後フォローを優先しましょう。`}}else if(s.sales){title="確定済みデータ";text="この月は月間売上・支出のみ登録済みです。日次の診療件数は未登録です。"}$("aiSuggestionTitle").textContent=title;$("aiSuggestionText").textContent=text}
function saveSettings(){const m=$("monthPicker").value||monthNow();data.settings[m]={target:num("target"),businessDays:Math.max(1,num("businessDays")||26)};save();month();toast("目標を保存しました")}
function years(){const ys=new Set([...data.entries.map(e=>e.date.slice(0,4)),...Object.keys(data.historical).map(m=>m.slice(0,4))]);ys.add(String(new Date().getFullYear()));$("yearPicker").innerHTML=[...ys].sort().reverse().map(y=>`<option>${y}</option>`).join("")}
function smoothPath(points){
  if(!points.length)return "";
  if(points.length===1)return `M${points[0][0]},${points[0][1]}`;
  let d=`M${points[0][0]},${points[0][1]}`;
  for(let i=0;i<points.length-1;i++){
    const [x0,y0]=points[i],[x1,y1]=points[i+1],mid=(x0+x1)/2;
    d+=` C${mid},${y0} ${mid},${y1} ${x1},${y1}`;
  }
  return d;
}
function renderYearChart(rows){
  const el=$("yearChart"),detail=$("chartDetail"),w=760,h=360,pad={l:58,r:20,t:28,b:46},target=MONTHLY_TARGET;
  const lastIndex=rows.reduce((last,r,i)=>(r.sales>0||r.expense>0)?i:last,-1);
  if(lastIndex<0){el.innerHTML='<div class="chart-empty">年間データがまだありません。</div>';detail.innerHTML='<span>データを入力するとグラフを表示します</span>';return}
  const visible=rows.slice(0,lastIndex+1);
  const profits=visible.map(r=>r.sales-r.expense);
  const values=[...visible.map(r=>r.sales),...profits,target,0];
  let rawMin=Math.min(...values),rawMax=Math.max(...values);
  const range=Math.max(1000000,rawMax-rawMin),padding=range*.12;
  let min=Math.min(0,rawMin-padding),max=rawMax+padding;
  const step=max<=6500000?1000000:2000000;
  max=Math.ceil(max/step)*step;
  min=Math.floor(min/step)*step;
  if(max===min)max=min+step;
  const plotW=w-pad.l-pad.r,plotH=h-pad.t-pad.b;
  const x=i=>visible.length===1?pad.l+plotW/2:pad.l+i*plotW/(visible.length-1);
  const y=v=>pad.t+plotH*(max-v)/(max-min);
  const salesPts=visible.map((r,i)=>[x(i).toFixed(1),y(r.sales).toFixed(1)]);
  const profitPts=visible.map((r,i)=>[x(i).toFixed(1),y(r.sales-r.expense).toFixed(1)]);
  let grid='';
  for(let v=min;v<=max;v+=step){
    const yy=y(v),label=v===0?'0':`${Math.round(v/10000)}万`;
    grid+=`<line x1="${pad.l}" y1="${yy}" x2="${w-pad.r}" y2="${yy}" class="chart-grid ${v===0?'zero-line':''}"/><text x="${pad.l-9}" y="${yy+4}" text-anchor="end" class="chart-axis">${label}</text>`;
  }
  const months=visible.map((r,i)=>`<text x="${x(i)}" y="${h-15}" text-anchor="middle" class="chart-month">${i+1}月</text>`).join('');
  const zeroY=y(0);
  const area=`${smoothPath(salesPts)} L${salesPts.at(-1)[0]},${zeroY} L${salesPts[0][0]},${zeroY} Z`;
  const band=plotW/Math.max(visible.length,1);
  const hitAreas=visible.map((r,i)=>{
    const profit=r.sales-r.expense,rate=r.sales?profit/r.sales*100:0,left=Math.max(pad.l,x(i)-band/2),right=Math.min(w-pad.r,x(i)+band/2);
    return `<g class="chart-hit" tabindex="0" data-month="${i+1}" data-sales="${r.sales}" data-profit="${profit}" data-rate="${rate.toFixed(1)}"><rect x="${left}" y="${pad.t}" width="${Math.max(24,right-left)}" height="${plotH}" fill="transparent"/><line x1="${x(i)}" y1="${pad.t}" x2="${x(i)}" y2="${h-pad.b}" class="focus-line"/><circle cx="${x(i)}" cy="${y(r.sales)}" r="5" class="chart-dot sales-dot"/><circle cx="${x(i)}" cy="${y(profit)}" r="4.5" class="chart-dot profit-dot"/></g>`;
  }).join('');
  const targetMarkup=target>=min&&target<=max?`<line x1="${pad.l}" y1="${y(target)}" x2="${w-pad.r}" y2="${y(target)}" class="target-line"/><text x="${w-pad.r}" y="${y(target)-8}" text-anchor="end" class="target-label">500万円</text>`:'';
  el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="salesArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00a99d" stop-opacity=".20"/><stop offset="100%" stop-color="#00a99d" stop-opacity="0"/></linearGradient><filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${grid}${targetMarkup}<path d="${area}" class="sales-area"/><path d="${smoothPath(salesPts)}" class="sales-line" filter="url(#softGlow)"/><path d="${smoothPath(profitPts)}" class="profit-line"/>${months}${hitAreas}</svg>`;
  const select=g=>{el.querySelectorAll('.chart-hit').forEach(x=>x.classList.toggle('selected',x===g));detail.innerHTML=`<strong>${g.dataset.month}月</strong><span>売上 ${yen(g.dataset.sales)}</span><span>利益 ${yen(g.dataset.profit)}</span><span>利益率 ${g.dataset.rate}%</span>`};
  el.querySelectorAll('.chart-hit').forEach(g=>{g.addEventListener('click',()=>select(g));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g)}})});
  select(el.querySelector('.chart-hit:last-of-type'));
}
function year(){
  const y=$("yearPicker").value||String(new Date().getFullYear()),rows=Array.from({length:12},(_,i)=>monthSummary(`${y}-${String(i+1).padStart(2,"0")}`));
  const total=rows.reduce((a,r)=>{["sales","patients","newPatients","surgeries","checkups","trimmings"].forEach(k=>a[k]+=Number(r[k])||0);a.expense+=Number(r.expense)||0;return a},{sales:0,expense:0,patients:0,newPatients:0,surgeries:0,checkups:0,trimmings:0});
  const activeRows=rows.filter(r=>r.sales>0||r.expense>0),active=activeRows.length,profit=total.sales-total.expense,rate=total.sales?profit/total.sales*100:0;
  const annualFactor=active?12/active:0,salesForecast=total.sales*annualFactor,profitForecast=profit*annualFactor;
  const best=activeRows.reduce((a,r)=>r.sales>a.sales?r:a,{sales:0});
  const incomeTarget=Number(data.finance.incomeTarget)||0;
  $("yearSales").textContent=yen(total.sales);$("yearProfit").textContent=yen(profit);$("yearProfitRate").textContent=pct(rate);$("yearAvg").textContent=yen(active?total.sales/active:0);
  $("yearSalesSub").textContent=`${active}か月分の集計`;$("yearProfitSub").textContent=`年間支出 ${yen(total.expense)}`;$("yearProfitRateSub").textContent=rate>=20?'良好な水準':rate>=10?'安定圏':'要確認';$("yearAvgSub").textContent=`月平均利益 ${yen(active?profit/active:0)}`;
  $("estimatedIncome").textContent=yen(profitForecast);$("estimatedIncomeSub").textContent=active?`${active}か月の実績から年換算`:'データ入力後に表示';
  $("yearSalesForecast").textContent=yen(salesForecast);$("yearProfitForecast").textContent=yen(profitForecast);$("bestMonthSales").textContent=yen(best.sales);
  if(incomeTarget>0){const progress=Math.max(0,Math.min(100,profitForecast/incomeTarget*100));$("incomeProgressText").textContent=`目標 ${yen(incomeTarget)}に対して ${progress.toFixed(0)}%`;$("incomeProgressBar").style.width=`${progress}%`}else{$("incomeProgressText").textContent='目標年収は財務タブで設定できます';$("incomeProgressBar").style.width='0%'}
  renderYearChart(rows)
}
function finance(){const m=$("monthPicker").value||monthNow(),f=data.finance,mf=data.financeByMonth[m]||{},hist=data.historical[m]||{},expense=Number(mf.monthlyExpense ?? hist.expense ?? (m===monthNow()?f.monthlyExpense:0))||0;$("balance").value=f.balance||"";$("monthlyExpense").value=expense||"";$("loan").value=f.loan||"";$("repayment").value=f.repayment||"";$("incomeTarget").value=f.incomeTarget||"";const s=monthSummary(m),profit=s.sales-expense;$("monthProfit").textContent=yen(profit);$("profitRate").textContent=pct(s.sales?profit/s.sales*100:0);$("netAssets").textContent=yen(f.balance-f.loan)}
function saveFinance(){const m=$("monthPicker").value||monthNow();data.finance={balance:num("balance"),monthlyExpense:num("monthlyExpense"),loan:num("loan"),repayment:num("repayment"),incomeTarget:num("incomeTarget")};data.financeByMonth[m]={monthlyExpense:num("monthlyExpense")};save();finance();month();year();toast(`${m}の財務情報を保存しました`)}
function storage(){const size=new Blob([JSON.stringify(data)]).size;$("storage").textContent=`日別記録 ${data.entries.length}件、月間過去データ ${Object.keys(data.historical).length}か月、使用容量 約${(size/1024).toFixed(1)}KB`}
function download(name,text,type){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([text],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function exportJson(){download(`dashboard-backup-${iso()}.json`,JSON.stringify(data,null,2),"application/json")}
function exportCsv(){const esc=v=>`"${String(v??"").replaceAll('"','""')}"`,head=["date","sales","patients","newPatients","surgeries","checkups","trimmings","note"],rows=data.entries.map(e=>head.map(k=>esc(e[k])).join(",")),monthly=[["month","sales","expense"],...Object.keys(data.historical).sort().map(m=>[m,data.historical[m].sales||0,data.financeByMonth[m]?.monthlyExpense??data.historical[m].expense??0])];download(`dashboard-${iso()}.csv`,"\uFEFF"+[head.join(","),...rows,"",...monthly.map(r=>r.map(esc).join(","))].join("\n"),"text/csv;charset=utf-8")}
async function importJson(file){try{const x=JSON.parse(await file.text());if(!Array.isArray(x.entries))throw 0;data={...base,...x,finance:{...base.finance,...(x.finance||{})},financeByMonth:{...(x.financeByMonth||{})},historical:{...HISTORICAL,...(x.historical||{})}};save();render();toast("復元しました")}catch{alert("読み込めませんでした")}}
function deleteAll(){if(confirm("全データを削除しますか？")&&confirm("元に戻せません。よろしいですか？")){data=structuredClone(base);save();clearForm();render()}}
function updateIndicator(id){const active=PAGE_IDS.indexOf(id);$("pageIndicator").innerHTML=PAGE_IDS.map((_,i)=>`<i class="${i===active?'active':''}"></i>`).join('')}
function switchPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===id));updateIndicator(id);document.querySelector(`.tab[data-page="${id}"]`)?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});if(id==="month")month();if(id==="year"){years();year()}if(id==="finance")finance();window.scrollTo({top:0,behavior:"smooth"})}
function moveMonth(delta){const [y,m]=($("monthPicker").value||monthNow()).split("-").map(Number),d=new Date(y,m-1+delta,1);$("monthPicker").value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;month();finance()}
function setupSwipe(){let sx=0,sy=0,tracking=false;const root=$("pageContainer");root.addEventListener("touchstart",e=>{const t=e.target;if(t.closest("input,textarea,select,button,.table,nav"))return;const p=e.touches[0];sx=p.clientX;sy=p.clientY;tracking=true},{passive:true});root.addEventListener("touchend",e=>{if(!tracking)return;tracking=false;const p=e.changedTouches[0],dx=p.clientX-sx,dy=p.clientY-sy;if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.25)return;const current=document.querySelector(".page.active")?.id,index=PAGE_IDS.indexOf(current),next=dx<0?index+1:index-1;if(next>=0&&next<PAGE_IDS.length)switchPage(PAGE_IDS[next])},{passive:true})}
function render(){recent();month();years();year();finance();storage();renderTodaySummary();$("memoText").value=data.memo||""}
function init(){$("todayLabel").textContent=new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"});$("entryDate").value=iso();$("monthPicker").value=monthNow();document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));["sales","patients","newPatients"].forEach(id=>$(id).oninput=preview);$("entryDate").onchange=()=>{const e=data.entries.find(x=>x.date===$("entryDate").value);if(e)edit(e.date)};$("saveEntry").onclick=saveEntry;$("clearEntry").onclick=clearForm;$("saveSettings").onclick=saveSettings;$("monthPicker").onchange=()=>{month();finance()};$("prevMonth").onclick=()=>moveMonth(-1);$("nextMonth").onclick=()=>moveMonth(1);$("yearPicker").onchange=year;$("saveFinance").onclick=saveFinance;$("memoText").oninput=()=>{clearTimeout(memoTimer);$("memoStatus").textContent="保存中…";memoTimer=setTimeout(()=>{data.memo=$("memoText").value;save();$("memoStatus").textContent="保存済み"},500)};$("exportJson").onclick=exportJson;$("exportCsv").onclick=exportCsv;$("importJson").onchange=e=>e.target.files[0]&&importJson(e.target.files[0]);$("deleteAll").onclick=deleteAll;setupSwipe();switchPage("today");render();renderTodaySummary();if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
init();
})();