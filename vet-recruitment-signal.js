(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VetRecruitmentSignal=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const STORAGE_KEY='keitaDashboardSimpleV1';
  const CAPACITY_KEY='keitaVetRecruitmentCapacityV1';
  const RECENT_PATIENT_DAYS=60;
  const RECENT_PRESSURE_DAYS=30;
  const MONTHLY_TARGET=5000000;

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const todayIso=()=>{
    const date=new Date();
    return new Date(date-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
  };
  const shiftMonth=(month,offset)=>{
    const [year,value]=String(month).split('-').map(Number),date=new Date(year,value-1+offset,1);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  };
  const own=(object,key)=>object!=null&&Object.prototype.hasOwnProperty.call(object,key);
  const readJson=(key,fallback)=>{
    try{return JSON.parse(localStorage.getItem(key)||'')||fallback;}catch{return fallback;}
  };
  const readDashboard=()=>readJson(STORAGE_KEY,{});
  const readCapacity=()=>readJson(CAPACITY_KEY,{});
  const saveCapacity=value=>{try{localStorage.setItem(CAPACITY_KEY,JSON.stringify(value));}catch{}};
  const dayWeight=(date,data)=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return 0;
    if((data?.clinic?.closedDates||[]).includes(date))return 0;
    const day=new Date(`${date}T12:00:00`).getDay();
    if(day===1)return 0;
    if(day===6)return .5;
    return 1;
  };
  const monthSales=(data,month)=>{
    const entries=(Array.isArray(data?.entries)?data.entries:[]).filter(entry=>String(entry?.date||'').slice(0,7)===month);
    const dailySales=entries.reduce((sum,entry)=>sum+(Number(entry?.sales)||0),0);
    const historical=data?.historical?.[month]||{},finance=data?.financeByMonth?.[month]||{};
    const current=month===todayIso().slice(0,7)?data?.finance||{}:{};
    const clinicalSales=dailySales||Number(historical.sales)||0;
    const ecSales=['morikuboOnline','royalCanin','purina'].reduce((sum,key)=>sum+(Number(finance[key]??current[key])||0),0);
    return clinicalSales+ecSales;
  };
  const hasSalesData=(data,month)=>{
    const entries=Array.isArray(data?.entries)?data.entries:[];
    if(entries.some(entry=>String(entry?.date||'').slice(0,7)===month))return true;
    if(own(data?.historical?.[month]||{},'sales'))return true;
    const finance=data?.financeByMonth?.[month]||{};
    return ['morikuboOnline','royalCanin','purina'].some(key=>own(finance,key));
  };
  const recentThreeMonthSales=(data,currentMonth)=>{
    const months=[-3,-2,-1].map(offset=>shiftMonth(currentMonth,offset));
    const rows=months.map(month=>({month,sales:monthSales(data,month),hasData:hasSalesData(data,month)}));
    if(!rows.every(row=>row.hasData&&Number.isFinite(row.sales)))return {months,rows,average:null};
    return {months,rows,average:rows.reduce((sum,row)=>sum+row.sales,0)/rows.length};
  };
  const operatingRows=(data,today)=>{
    return (Array.isArray(data?.entries)?data.entries:[])
      .filter(entry=>String(entry?.date||'')<=today&&dayWeight(entry?.date,data)>0&&entry?.patients!==undefined&&entry?.patients!==null&&entry?.patients!=='')
      .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  };
  const patientLoad=(data,today)=>{
    const rows=operatingRows(data,today).slice(-RECENT_PATIENT_DAYS);
    const units=rows.reduce((sum,row)=>sum+dayWeight(row.date,data),0);
    const patients=rows.reduce((sum,row)=>sum+(Number(row.patients)||0),0);
    return {days:rows.length,units,patients,average:units>0?patients/units:null};
  };
  const pressureTotals=(data,capacity,today)=>{
    const dates=new Set();
    operatingRows(data,today).forEach(row=>dates.add(row.date));
    Object.keys(capacity||{}).filter(date=>date<=today&&dayWeight(date,data)>0).forEach(date=>dates.add(date));
    const recent=[...dates].sort().slice(-RECENT_PRESSURE_DAYS);
    return recent.reduce((result,date)=>{
      const row=capacity?.[date]||{};
      result.turnedAway+=Math.max(0,Number(row.turnedAway)||0);
      result.deferred+=Math.max(0,Number(row.deferredProcedures)||0);
      return result;
    },{days:recent.length,turnedAway:0,deferred:0,dates:recent});
  };
  const scoreSales=average=>average==null?0:average<4000000?0:average<4500000?10:average<5000000?20:30;
  const scorePatients=average=>average==null?0:average<15?0:average<17?8:average<19?15:average<20?20:25;
  const scoreBooking=count=>count<=0?0:count===1?8:count<=3?15:count<=5?20:25;
  const scoreDeferred=count=>count<=0?0:count===1?5:count===2?10:count===3?15:20;
  const statusFor=score=>score>=75?{key:'go',label:'採用GO',tone:'red'}:score>=50?{key:'prepare',label:'採用準備',tone:'yellow'}:{key:'hold',label:'1人獣医師体制',tone:'green'};
  function analyze({data={},capacity={},today=todayIso()}={}){
    const currentMonth=today.slice(0,7),sales=recentThreeMonthSales(data,currentMonth),patients=patientLoad(data,today),pressure=pressureTotals(data,capacity,today);
    const parts={sales:scoreSales(sales.average),patients:scorePatients(patients.average),booking:scoreBooking(pressure.turnedAway),deferred:scoreDeferred(pressure.deferred)};
    const score=clamp(Object.values(parts).reduce((sum,value)=>sum+value,0),0,100),status=statusFor(score);
    const confidence=patients.days>=30&&sales.average!=null?'判定':patients.days>=10||sales.average!=null?'参考':'学習中';
    let comment='現在は1人獣医師体制を維持する方が合理的です。月商500万円の安定化と、診療枠の余力を確認します。';
    if(status.key==='prepare')comment='非常勤獣医師の採用準備を始める段階です。候補者探しを進めつつ、予約逼迫とオペ枠の機会損失が続くか確認します。';
    if(status.key==='go')comment='需要超過のサインが重なっています。常勤採用を急ぐより、まず週2〜3日の勤務医導入を推奨します。';
    if(sales.average==null)comment='直近3か月の確定売上が揃うと、採用判断の売上スコアを確定できます。';
    return {score,status,confidence,parts,sales,patients,pressure,comment,thresholds:{monthlySales:MONTHLY_TARGET,patientsPerDay:20,turnedAway:4,deferred:3}};
  }

  const man=value=>`${Math.round((Number(value)||0)/10000).toLocaleString('ja-JP')}万円`;
  let targetDate=todayIso();

  function injectStyles(){
    if(document.getElementById('vetRecruitmentSignalStyle'))return;
    const style=document.createElement('style');style.id='vetRecruitmentSignalStyle';style.textContent=`
      .vet-recruitment-card{margin:16px 0;padding:18px;border:1px solid rgba(33,104,95,.18);border-radius:20px;background:linear-gradient(180deg,#fff,#f7fbfa);box-shadow:0 8px 26px rgba(23,60,55,.06)}
      .vet-recruitment-card[data-tone="yellow"]{border-color:rgba(180,126,20,.28);background:linear-gradient(180deg,#fff,#fffaf0)}
      .vet-recruitment-card[data-tone="red"]{border-color:rgba(182,68,68,.25);background:linear-gradient(180deg,#fff,#fff7f7)}
      .vet-recruitment-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.vet-recruitment-head small{display:block;font-size:11px;letter-spacing:.08em;color:#738480;font-weight:800}.vet-recruitment-head h2{margin:4px 0 0;font-size:19px;color:#233936}.vet-recruitment-badge{white-space:nowrap;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:850;background:#e7f4ef;color:#18725f}.vet-recruitment-card[data-tone="yellow"] .vet-recruitment-badge{background:#fff0c8;color:#8b650d}.vet-recruitment-card[data-tone="red"] .vet-recruitment-badge{background:#fde2e2;color:#a03d3d}
      .vet-recruitment-main{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center}.vet-recruitment-score{width:92px;height:92px;border-radius:50%;display:grid;place-content:center;text-align:center;background:conic-gradient(#2b8c78 calc(var(--vet-score,0)*1%),#e8efed 0);position:relative}.vet-recruitment-score:before{content:"";position:absolute;inset:8px;border-radius:50%;background:#fff}.vet-recruitment-score strong,.vet-recruitment-score span{position:relative;z-index:1}.vet-recruitment-score strong{font-size:30px;line-height:1;color:#213936}.vet-recruitment-score span{font-size:11px;color:#738480;margin-top:2px}.vet-recruitment-comment{margin:0;color:#415753;font-size:14px;line-height:1.6}.vet-recruitment-confidence{display:inline-block;margin-top:8px;font-size:11px;color:#71827e}
      .vet-recruitment-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px}.vet-recruitment-grid section{padding:11px 12px;border-radius:13px;background:rgba(236,244,242,.75)}.vet-recruitment-grid span,.vet-recruitment-grid small{display:block;color:#70817d;font-size:11px}.vet-recruitment-grid strong{display:block;margin:4px 0 2px;font-size:16px;color:#233936}.vet-recruitment-grid b{font-size:11px;color:#17715f}.vet-recruitment-note{margin:12px 0 0;font-size:11px;line-height:1.5;color:#7a8986}
      .vet-capacity-inputs{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border-radius:14px;background:#f5f9f8;border:1px solid rgba(33,104,95,.12)}.vet-capacity-inputs label{display:block}.vet-capacity-inputs span{display:block;font-size:12px;font-weight:750;color:#425955;margin-bottom:6px}.vet-capacity-inputs input{width:100%;box-sizing:border-box}.vet-capacity-inputs small{display:block;margin-top:5px;font-size:10px;line-height:1.4;color:#7a8986}
      @media(max-width:520px){.vet-recruitment-main{grid-template-columns:78px 1fr;gap:12px}.vet-recruitment-score{width:78px;height:78px}.vet-recruitment-grid{grid-template-columns:1fr 1fr}.vet-capacity-inputs{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }
  function ensureCard(){
    if(document.getElementById('vetRecruitmentCard'))return;
    const anchor=document.getElementById('annualManagementCard')||document.getElementById('todaySummaryCard');if(!anchor)return;
    const card=document.createElement('article');card.id='vetRecruitmentCard';card.className='vet-recruitment-card';card.setAttribute('aria-labelledby','vetRecruitmentTitle');card.innerHTML=`
      <div class="vet-recruitment-head"><div><small>CAPACITY & HIRING</small><h2 id="vetRecruitmentTitle">獣医師採用シグナル</h2></div><span class="vet-recruitment-badge" id="vetRecruitmentBadge">判定中</span></div>
      <div class="vet-recruitment-main"><div class="vet-recruitment-score" id="vetRecruitmentScoreRing"><strong id="vetRecruitmentScore">—</strong><span>/ 100</span></div><div><p class="vet-recruitment-comment" id="vetRecruitmentComment">診療データを確認しています。</p><span class="vet-recruitment-confidence" id="vetRecruitmentConfidence"></span></div></div>
      <div class="vet-recruitment-grid">
        <section><span>直近3か月平均月商</span><strong id="vetRecruitmentSales">—</strong><b id="vetRecruitmentSalesPoints">0 / 30点</b><small>基準 500万円</small></section>
        <section><span>平均外来数</span><strong id="vetRecruitmentPatients">—</strong><b id="vetRecruitmentPatientsPoints">0 / 25点</b><small>直近60営業日・診療時間補正</small></section>
        <section><span>予約逼迫</span><strong id="vetRecruitmentBooking">0件</strong><b id="vetRecruitmentBookingPoints">0 / 25点</b><small>過去30営業日の予約お断り</small></section>
        <section><span>オペ・歯科の機会損失</span><strong id="vetRecruitmentDeferred">0件</strong><b id="vetRecruitmentDeferredPoints">0 / 20点</b><small>過去30営業日の延期</small></section>
      </div><p class="vet-recruitment-note">経営健康度とは別の「増員タイミング」専用指標です。50点以上で採用準備、75点以上で週2〜3日の勤務医導入を検討します。</p>`;
    anchor.insertAdjacentElement('afterend',card);
  }
  function ensureInputs(){
    if(document.getElementById('todayEntryTurnedAway'))return;
    const fields=document.querySelector('#todayEntryForm .today-entry-fields');if(!fields)return;
    const clinical=fields.querySelector('.today-entry-clinical');
    const box=document.createElement('section');box.className='vet-capacity-inputs';box.setAttribute('aria-label','診療キャパシティ');box.innerHTML=`
      <label><span>予約を断った件数</span><input id="todayEntryTurnedAway" type="number" min="0" step="1" inputmode="numeric" placeholder="0"><small>満枠などで受けられなかった外来</small></label>
      <label><span>外来都合でオペ・歯科を延期</span><input id="todayEntryDeferredProcedures" type="number" min="0" step="1" inputmode="numeric" placeholder="0"><small>外来枠のため後ろ倒しした件数</small></label>`;
    if(clinical)fields.insertBefore(box,clinical);else fields.appendChild(box);
  }
  function populateInputs(){
    const capacity=readCapacity(),row=capacity[targetDate]||{};
    const turned=document.getElementById('todayEntryTurnedAway'),deferred=document.getElementById('todayEntryDeferredProcedures');
    if(turned)turned.value=row.turnedAway??'';if(deferred)deferred.value=row.deferredProcedures??'';
  }
  function storeInputs(){
    const form=document.getElementById('todayEntryForm');if(!form)return;
    const invalid=[...form.querySelectorAll('input[type="number"]')].some(input=>input.value!==''&&(!Number.isFinite(Number(input.value))||Number(input.value)<0));if(invalid)return;
    const capacity=readCapacity(),turned=Math.max(0,Number(document.getElementById('todayEntryTurnedAway')?.value)||0),deferred=Math.max(0,Number(document.getElementById('todayEntryDeferredProcedures')?.value)||0);
    capacity[targetDate]={turnedAway:turned,deferredProcedures:deferred,updatedAt:new Date().toISOString()};saveCapacity(capacity);setTimeout(renderCard,0);
  }
  function renderCard(){
    ensureCard();const card=document.getElementById('vetRecruitmentCard');if(!card)return;
    const result=analyze({data:readDashboard(),capacity:readCapacity(),today:todayIso()});card.dataset.tone=result.status.tone;card.style.setProperty('--vet-score',result.score);
    document.getElementById('vetRecruitmentScore').textContent=String(result.score);document.getElementById('vetRecruitmentBadge').textContent=result.status.label;document.getElementById('vetRecruitmentComment').textContent=result.comment;document.getElementById('vetRecruitmentConfidence').textContent=`判定精度：${result.confidence}（外来 ${result.patients.days}営業日・逼迫 ${result.pressure.days}営業日）`;
    document.getElementById('vetRecruitmentSales').textContent=result.sales.average==null?'データ不足':man(result.sales.average);document.getElementById('vetRecruitmentSalesPoints').textContent=`${result.parts.sales} / 30点`;
    document.getElementById('vetRecruitmentPatients').textContent=result.patients.average==null?'データ不足':`${result.patients.average.toFixed(1)}件/日`;document.getElementById('vetRecruitmentPatientsPoints').textContent=`${result.parts.patients} / 25点`;
    document.getElementById('vetRecruitmentBooking').textContent=`${result.pressure.turnedAway}件`;document.getElementById('vetRecruitmentBookingPoints').textContent=`${result.parts.booking} / 25点`;
    document.getElementById('vetRecruitmentDeferred').textContent=`${result.pressure.deferred}件`;document.getElementById('vetRecruitmentDeferredPoints').textContent=`${result.parts.deferred} / 20点`;
  }
  function trackTarget(event){
    const edit=event.target?.closest?.('[data-edit]');if(edit?.dataset?.edit){targetDate=edit.dataset.edit;return;}
    if(event.target?.closest?.('#editActivitySummary')){targetDate=document.getElementById('activitySummaryModal')?.dataset?.date||targetDate;return;}
    const activity=event.target?.closest?.('[data-activity-date]');if(activity?.dataset?.activityDate){targetDate=activity.dataset.activityDate;return;}
    if(event.target?.closest?.('#todayHeroEdit,#todaySummaryCard'))targetDate=todayIso();
  }
  function observeModal(){
    const modal=document.getElementById('todayEntryModal');if(!modal)return;
    new MutationObserver(()=>{if(!modal.hidden)populateInputs();}).observe(modal,{attributes:true,attributeFilter:['hidden','class']});
  }
  function build(){
    injectStyles();ensureInputs();ensureCard();renderCard();observeModal();
    document.addEventListener('pointerdown',trackTarget,true);document.addEventListener('click',trackTarget,true);document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target?.closest?.('#todaySummaryCard'))targetDate=todayIso();},true);
    document.getElementById('todayEntryForm')?.addEventListener('submit',storeInputs,true);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderCard();});window.addEventListener('focus',renderCard);window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY||event.key===CAPACITY_KEY)renderCard();});
  }
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();}
  return {analyze,scoreSales,scorePatients,scoreBooking,scoreDeferred,recentThreeMonthSales,patientLoad,pressureTotals,dayWeight};
});
