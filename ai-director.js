(()=>{
  'use strict';
  const STORAGE_KEY='keitaDashboardSimpleV1';
  const FEEDBACK_KEY='keitaAIDirectorFeedbackV1';
  const TODAY=()=>{
    const d=new Date();
    return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  };
  const monthKey=()=>TODAY().slice(0,7);
  const yen=n=>`${Math.round(Number(n)||0).toLocaleString('ja-JP')}円`;
  const pct=n=>`${(Number(n)||0).toFixed(1)}%`;
  const readData=()=>{
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}
  };
  const readFeedback=()=>{
    try{return JSON.parse(localStorage.getItem(FEEDBACK_KEY)||'{}')||{};}catch{return {};}
  };
  const saveFeedback=value=>{
    try{localStorage.setItem(FEEDBACK_KEY,JSON.stringify(value));}catch{}
  };
  const monthShift=(key,delta)=>{
    const [y,m]=String(key).split('-').map(Number);
    const d=new Date(y,m-1+delta,1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };
  const summaryFor=(data,mk)=>{
    const entries=Array.isArray(data.entries)?data.entries.filter(e=>String(e.date||'').slice(0,7)===mk):[];
    const daily=entries.reduce((a,e)=>{
      a.sales+=Number(e.sales)||0;
      a.patients+=Number(e.patients)||0;
      a.checkups+=Number(e.checkups)||0;
      return a;
    },{sales:0,patients:0,checkups:0});
    const hist=(data.historical&&data.historical[mk])||{};
    const finance=(data.financeByMonth&&data.financeByMonth[mk])||{};
    const current=mk===monthKey()?(data.finance||{}):{};
    const clinicalSales=daily.sales||Number(hist.sales)||0;
    const ecSales=['morikuboOnline','royalCanin','purina'].reduce((s,k)=>s+(Number(finance[k]??current[k])||0),0);
    const sales=clinicalSales+ecSales;
    const expense=Number(finance.monthlyExpense??hist.expense??current.monthlyExpense)||0;
    return {...daily,clinicalSales,ecSales,sales,expense};
  };
  const metrics=()=>{
    const data=readData();
    const mk=monthKey();
    const cur=summaryFor(data,mk);
    const prev=summaryFor(data,monthShift(mk,-1));
    const finance=(data.financeByMonth&&data.financeByMonth[mk])||data.finance||{};
    const profit=cur.sales-cur.expense;
    const margin=cur.sales>0?profit/cur.sales*100:0;
    const target=Number(data.settings?.[mk]?.target)||5000000;
    const businessDays=Number(data.settings?.[mk]?.businessDays)||26;
    const activeDays=new Set((Array.isArray(data.entries)?data.entries:[]).filter(e=>String(e.date||'').slice(0,7)===mk&&(Number(e.sales)||Number(e.patients))).map(e=>e.date)).size;
    const remaining=Math.max(0,businessDays-activeDays);
    const forecast=activeDays?cur.sales/activeDays*businessDays:cur.sales;
    const balance=Number(finance.balance)||0;
    const loan=Number(finance.loan)||0;
    const personnelExpense=Number(finance.personnelExpense)||0;
    const medicalExpense=Number(finance.medicalExpense)||0;
    return {...cur,profit,margin,target,businessDays,activeDays,remaining,forecast,balance,loan,netAssets:balance-loan,personnelExpense,medicalExpense,prev};
  };
  const block=(conclusion,reasons,next)=>({conclusion,reasons:Array.isArray(reasons)?reasons:[reasons],next});
  const answer=(kind,m)=>{
    if(kind==='month'){
      if(!m.sales)return block('まだ評価できません','今月の売上データが未入力です。','1日分入力すると、目標達成率と月末予測を表示できます。');
      const rate=m.target?m.sales/m.target*100:0;
      const good=m.forecast>=m.target;
      return block(good?'今月は目標達成ペースです。':'今月は少し対策が必要です。',[
        `売上 ${yen(m.sales)}・目標達成率 ${pct(rate)}`,
        `月末予測 ${yen(m.forecast)}・来院 ${m.patients.toLocaleString('ja-JP')}件`
      ],good?'今の診療品質を維持し、無理な詰め込みは避けましょう。':m.remaining?`残り${m.remaining}営業日で、1日あたり${yen(Math.max(0,m.target-m.sales)/m.remaining)}が目安です。`:'次月は再診・健診・予防の案内漏れを減らしましょう。');
    }
    if(kind==='margin'){
      if(!m.expense)return block('支出入力が必要です。',`売上は${yen(m.sales)}ですが、総支出が未入力です。`,'財務ページで総支出を入力してください。');
      const status=m.margin>=30?'良好です。':m.margin>=20?'安定圏です。':'改善余地があります。';
      return block(status,[`利益 ${yen(m.profit)}・利益率 ${pct(m.margin)}`,`総支出 ${yen(m.expense)}`],m.margin>=30?'投資判断は、現預金と3か月の継続性も確認して進めましょう。':m.medicalExpense?'薬品・医療材料費と人件費の売上比率を確認しましょう。':'支出の内訳を入力すると、改善点を絞り込めます。');
    }
    if(kind==='hire'){
      if(!m.expense)return block('判断材料が不足しています。','総支出が未入力のため、採用後の固定費を評価できません。','総支出と人件費を入力してから再確認しましょう。');
      const safe=m.profit>=1000000&&m.margin>=20;
      const strong=m.profit>=1500000&&m.margin>=25;
      return block(strong?'採用を前向きに進められます。':safe?'条件付きで採用可能です。':'今は慎重に進めましょう。',[
        `月間利益 ${yen(m.profit)}・利益率 ${pct(m.margin)}`,
        m.personnelExpense?`現在の人件費 ${yen(m.personnelExpense)}`:'人件費の内訳は未入力です。'
      ],strong?'常勤採用も検討可能です。試用期間と教育計画を明確にしましょう。':safe?'まずは週2〜3日勤務や段階的な採用が安全です。':'利益100万円以上を数か月維持してから再検討するのが安全です。');
    }
    if(kind==='glc'){
      if(!m.expense)return block('まだ判断できません。','支出が未入力のため、毎月の余力を計算できません。','総支出と口座残高を入力してください。');
      const strong=m.profit>=1500000&&m.margin>=25&&m.netAssets>=3000000;
      const possible=m.profit>=1000000&&m.margin>=20;
      return block(strong?'リースなら前向きに検討できます。':possible?'あと少しです。':'今は見送りが安全です。',[
        `月間利益 ${yen(m.profit)}・利益率 ${pct(m.margin)}`,
        m.balance?`現預金 ${yen(m.balance)}・借入差引 ${yen(m.netAssets)}`:'口座残高は未入力です。'
      ],strong?'同水準を3か月維持し、頭金・保険・維持費を含む月額で最終判断しましょう。':possible?'利益150万円前後を3か月維持できれば、検討しやすくなります。':'設備投資後の資金余力を優先し、利益率20%以上の安定を待ちましょう。');
    }
    return block('経営データを確認します。','売上・来院数・支出をもとに判断します。','相談項目を選んでください。');
  };
  const recommendation=m=>{
    if(!m.sales)return {id:'start-input',title:'まず1日分を入力しましょう',detail:'今月の売上・来院数を入力すると、月末予測と具体的な優先事項を出せます。'};
    if(m.expense&&m.margin<20)return {id:'margin-low',title:'今月は支出の確認を優先',detail:`利益率は${pct(m.margin)}です。薬品費・外注費・人件費の増加要因を1つずつ確認しましょう。`};
    if(m.forecast<m.target&&m.remaining>0)return {id:'target-gap',title:'再診・健診の案内漏れを減らす',detail:`月末予測は${yen(m.forecast)}です。残り${m.remaining}営業日は、1日${yen(Math.max(0,m.target-m.sales)/m.remaining)}が目安です。`};
    if(m.checkups<10)return {id:'checkups',title:'健診の提案を意識しましょう',detail:`今月の健診は${m.checkups}件です。対象患者への案内を診察時に一言添えるのがおすすめです。`};
    if(m.margin>=30)return {id:'quality',title:'無理に件数を増やさず質を維持',detail:`利益率${pct(m.margin)}で良好です。診療の質とスタッフ負担のバランスを優先しましょう。`};
    return {id:'followup',title:'既存患者のフォローを優先',detail:'新しい施策を増やすより、再診・予防・検査フォローの案内漏れを減らすのがおすすめです。'};
  };
  function injectStyles(){
    const style=document.createElement('style');
    style.textContent=`
      #aiDirectorFab{position:fixed;right:18px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:9000;border:0;border-radius:999px;padding:13px 17px;background:#087f6b;color:#fff;font-weight:800;font-size:15px;box-shadow:0 10px 26px rgba(0,0,0,.22);-webkit-tap-highlight-color:transparent}
      #aiDirectorOverlay{position:fixed;inset:0;z-index:9998;background:rgba(13,27,25,.45);display:none;align-items:flex-end;justify-content:center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box}
      #aiDirectorOverlay.is-open{display:flex}
      #aiDirectorPanel{width:min(100%,520px);max-height:84vh;overflow:auto;background:#f7faf9;border-radius:24px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);box-sizing:border-box}
      .aiDirectorHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.aiDirectorHead h2{margin:0;font-size:21px}.aiDirectorClose{width:38px;height:38px;border:0;border-radius:50%;font-size:24px;background:#e6efec;color:#24433e}
      .aiDirectorRecommend{background:#fff;border:1px solid rgba(8,127,107,.18);border-radius:18px;padding:15px;margin-bottom:12px}.aiDirectorEyebrow{display:block;color:#087f6b;font-size:12px;font-weight:800;margin-bottom:7px}.aiDirectorRecommend h3{font-size:17px;margin:0 0 7px}.aiDirectorRecommend p{font-size:14px;line-height:1.6;color:#50635f;margin:0}.aiDirectorReason{display:none;margin-top:10px;padding-top:10px;border-top:1px solid #e7eeec}.aiDirectorReason.is-open{display:block}.aiDirectorActions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.aiDirectorActions button{border:0;border-radius:11px;padding:9px 12px;font-weight:750}.aiDirectorReasonBtn{background:#eaf4f1;color:#08705f}.aiDirectorAccept{background:#087f6b;color:#fff}.aiDirectorLater{background:#edf1f0;color:#40534f}.aiDirectorStatus{font-size:12px;color:#687a76;margin-top:8px;min-height:1.2em}
      .aiDirectorMessage{background:#fff;border:1px solid rgba(8,127,107,.15);border-radius:16px;padding:14px;line-height:1.65;color:#20332f;margin-bottom:12px}.aiDirectorMessage h3{font-size:15px;margin:0 0 5px}.aiDirectorMessage p{margin:0 0 10px}.aiDirectorMessage p:last-child{margin-bottom:0}.aiDirectorMessage ul{margin:0 0 10px;padding-left:20px}
      .aiDirectorQuick{display:grid;grid-template-columns:1fr 1fr;gap:10px}.aiDirectorQuick button{border:1px solid rgba(8,127,107,.22);background:#fff;color:#086f5e;border-radius:14px;padding:13px 10px;font-weight:750;font-size:14px}
      .aiDirectorNote{font-size:12px;color:#60716d;margin:12px 2px 0;line-height:1.5}
      @media(max-width:360px){.aiDirectorQuick{grid-template-columns:1fr}#aiDirectorFab{right:12px}}
    `;
    document.head.appendChild(style);
  }
  const renderBlock=b=>`<h3>結論</h3><p>${b.conclusion}</p><h3>理由</h3><ul>${b.reasons.map(x=>`<li>${x}</li>`).join('')}</ul><h3>次の目安</h3><p>${b.next}</p>`;
  function build(){
    if(document.getElementById('aiDirectorFab'))return;
    injectStyles();
    const fab=document.createElement('button');
    fab.id='aiDirectorFab';fab.type='button';fab.setAttribute('aria-controls','aiDirectorOverlay');fab.setAttribute('aria-expanded','false');fab.textContent='💬 AI院長';
    const overlay=document.createElement('div');
    overlay.id='aiDirectorOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','aiDirectorTitle');
    overlay.innerHTML=`<div id="aiDirectorPanel">
      <div class="aiDirectorHead"><h2 id="aiDirectorTitle">💬 AI院長</h2><button class="aiDirectorClose" type="button" aria-label="閉じる">×</button></div>
      <section class="aiDirectorRecommend" aria-labelledby="aiDirectorRecommendTitle">
        <span class="aiDirectorEyebrow">💡 今日のおすすめ</span><h3 id="aiDirectorRecommendTitle"></h3><p id="aiDirectorRecommendSummary"></p>
        <div id="aiDirectorReason" class="aiDirectorReason"></div>
        <div class="aiDirectorActions"><button class="aiDirectorReasonBtn" type="button">理由を見る</button><button class="aiDirectorAccept" type="button">👍 採用する</button><button class="aiDirectorLater" type="button">あとで見る</button></div>
        <div id="aiDirectorStatus" class="aiDirectorStatus" aria-live="polite"></div>
      </section>
      <div id="aiDirectorMessage" class="aiDirectorMessage">相談項目を選んでください。</div>
      <div class="aiDirectorQuick"><button type="button" data-ai-question="glc">🚗 GLC買える？</button><button type="button" data-ai-question="hire">👩‍⚕️ 看護師採用できる？</button><button type="button" data-ai-question="month">📈 今月どう？</button><button type="button" data-ai-question="margin">💰 利益率は？</button></div>
      <p class="aiDirectorNote">端末内に保存されたデータだけを使用します。外部サーバーには送信しません。</p>
    </div>`;
    document.body.append(fab,overlay);
    let currentRecommendation=null;
    const refresh=()=>{
      const m=metrics();currentRecommendation=recommendation(m);
      overlay.querySelector('#aiDirectorRecommendTitle').textContent=currentRecommendation.title;
      overlay.querySelector('#aiDirectorRecommendSummary').textContent='今日、最初に意識する経営アクションです。';
      overlay.querySelector('#aiDirectorReason').textContent=currentRecommendation.detail;
      overlay.querySelector('#aiDirectorReason').classList.remove('is-open');
      overlay.querySelector('.aiDirectorReasonBtn').textContent='理由を見る';
      const fb=readFeedback()[TODAY()];
      overlay.querySelector('#aiDirectorStatus').textContent=fb?.id===currentRecommendation.id?(fb.action==='accepted'?'今日は「採用する」を選択済みです。':'あとで確認する設定です。'):'';
    };
    const close=()=>{overlay.classList.remove('is-open');fab.setAttribute('aria-expanded','false');document.body.style.overflow='';};
    const open=()=>{refresh();overlay.classList.add('is-open');fab.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';overlay.querySelector('.aiDirectorClose')?.focus();};
    fab.addEventListener('click',open);overlay.querySelector('.aiDirectorClose').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    overlay.querySelector('.aiDirectorReasonBtn').addEventListener('click',e=>{const reason=overlay.querySelector('#aiDirectorReason');const opened=reason.classList.toggle('is-open');e.currentTarget.textContent=opened?'理由を閉じる':'理由を見る';});
    const record=action=>{if(!currentRecommendation)return;const all=readFeedback();all[TODAY()]={id:currentRecommendation.id,action,at:new Date().toISOString()};saveFeedback(all);overlay.querySelector('#aiDirectorStatus').textContent=action==='accepted'?'おすすめを採用しました。':'あとで確認する設定にしました。';};
    overlay.querySelector('.aiDirectorAccept').addEventListener('click',()=>record('accepted'));overlay.querySelector('.aiDirectorLater').addEventListener('click',()=>record('later'));
    overlay.querySelectorAll('[data-ai-question]').forEach(btn=>btn.addEventListener('click',()=>{overlay.querySelector('#aiDirectorMessage').innerHTML=renderBlock(answer(btn.dataset.aiQuestion,metrics()));}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open'))close();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
