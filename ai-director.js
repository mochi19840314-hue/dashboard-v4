(()=>{
  'use strict';

  const STORAGE_KEY='keitaDashboardSimpleV1';
  const MONTHLY_TARGET_DEFAULT=5000000;
  const yen=n=>`${Math.round(Number(n)||0).toLocaleString('ja-JP')}円`;
  const pct=n=>`${(Number(n)||0).toFixed(1)}%`;
  const today=()=>{
    const d=new Date();
    return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  };
  const monthKey=()=>today().slice(0,7);

  function readData(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}
    catch{return {};}
  }

  function getMetrics(){
    const data=readData();
    const mk=monthKey();
    const entries=Array.isArray(data.entries)
      ? data.entries.filter(e=>String(e.date||'').slice(0,7)===mk)
      : [];

    const clinicalSales=entries.reduce((s,e)=>s+(Number(e.sales)||0),0);
    const patients=entries.reduce((s,e)=>s+(Number(e.patients)||0),0);
    const activeDays=new Set(entries.map(e=>e.date).filter(Boolean)).size;
    const finance=(data.financeByMonth&&data.financeByMonth[mk])||{};
    const currentFinance=data.finance||{};
    const ecSales=['morikuboOnline','royalCanin','purina'].reduce((sum,key)=>{
      const value=finance[key] ?? currentFinance[key] ?? 0;
      return sum+(Number(value)||0);
    },0);
    const sales=clinicalSales+ecSales;
    const expense=Number(finance.monthlyExpense ?? currentFinance.monthlyExpense ?? 0)||0;
    const personnelExpense=Number(finance.personnelExpense ?? currentFinance.personnelExpense ?? 0)||0;
    const balance=Number(finance.balance ?? currentFinance.balance ?? 0)||0;
    const loan=Number(finance.loan ?? currentFinance.loan ?? 0)||0;
    const profit=sales-expense;
    const margin=sales>0?profit/sales*100:0;
    const target=Number(data.settings?.[mk]?.target)||MONTHLY_TARGET_DEFAULT;
    const unit=patients?sales/patients:0;
    const netAssets=balance-loan;
    return {sales,clinicalSales,ecSales,patients,activeDays,unit,expense,personnelExpense,balance,loan,netAssets,profit,margin,target};
  }

  function block(title,lines){
    return `<strong>${title}</strong><br>${lines.join('<br>')}`;
  }

  function answer(kind){
    const m=getMetrics();

    if(kind==='month'){
      if(!m.sales){
        return block('結論',['今月の売上データはまだありません。','売上と来院数を入力すると評価できます。']);
      }
      const rate=m.target?m.sales/m.target*100:0;
      let conclusion='順調です。';
      if(rate<60)conclusion='まだ判断途中です。';
      if(rate>=90)conclusion='目標達成が見えてきました。';
      return block('結論',[conclusion,'',`売上：${yen(m.sales)}`,`目標達成率：${pct(rate)}`,`来院数：${m.patients.toLocaleString('ja-JP')}件`,`客単価：${yen(m.unit)}`,'',m.expense?`利益率：${pct(m.margin)}`:'支出入力後に利益率も評価できます。']);
    }

    if(kind==='margin'){
      if(!m.sales)return block('結論',['売上データがまだありません。']);
      if(!m.expense)return block('結論',['総支出が未入力です。','財務ページで月間支出を入力してください。']);
      let judgement='改善余地があります。';
      if(m.margin>=25)judgement='良好です。';
      else if(m.margin>=20)judgement='まずまずです。';
      else if(m.margin<10)judgement='注意が必要です。';
      return block('結論',[judgement,'',`利益：${yen(m.profit)}`,`利益率：${pct(m.margin)}`,'',m.margin>=25?'次の目安：25%以上を安定して維持しましょう。':'次の目安：まず20〜25%を目指しましょう。']);
    }

    if(kind==='glc'){
      if(!m.expense)return block('結論',['まだ判断できません。','','理由：月間支出が未入力です。','次の目安：財務ページを入力してから再判定してください。']);
      let conclusion='現時点では慎重です。';
      let next='月間利益150万円以上を3か月維持できたら、前向きに再検討しましょう。';
      if(m.profit>=1500000&&m.margin>=25&&m.balance>=3000000){
        conclusion='条件付きで検討できます。';
        next='リース料を含めても月間利益100万円以上が残るか確認しましょう。';
      }else if(m.profit<500000||m.margin<15||m.balance<1500000){
        conclusion='今は見送るのが安全です。';
      }
      return block('結論',[conclusion,'',`理由：利益 ${yen(m.profit)}／利益率 ${pct(m.margin)}`,`口座残高：${yen(m.balance)}`,'',`次の目安：${next}`]);
    }

    if(kind==='hire'){
      if(!m.sales)return block('結論',['まだ判断できません。','売上・来院数・支出の入力が必要です。']);
      let conclusion='慎重に検討しましょう。';
      let reason=`来院数 ${m.patients.toLocaleString('ja-JP')}件、利益率 ${pct(m.margin)}です。`;
      let next='月350件または月商550万円を3か月維持できると安心です。';
      if(m.patients>=350&&m.margin>=20&&m.profit>=1000000){
        conclusion='採用を前向きに検討できます。';
        next='採用後の人件費を加えても利益率15%以上が残るか確認しましょう。';
      }else if(m.margin<10||m.profit<300000){
        conclusion='今は採用時期を少し待つ方が安全です。';
      }
      if(!m.expense)reason=`来院数は${m.patients.toLocaleString('ja-JP')}件ですが、支出未入力のため利益面は未評価です。`;
      return block('結論',[conclusion,'',`理由：${reason}`,'',`次の目安：${next}`]);
    }

    return block('AI院長',['今月の数字をもとに、短く安全側に判断します。']);
  }

  function injectStyles(){
    const style=document.createElement('style');
    style.textContent=`
      #aiDirectorFab{position:fixed;right:18px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:9000;border:0;border-radius:999px;padding:13px 17px;background:#087f6b;color:#fff;font-weight:800;font-size:15px;box-shadow:0 10px 26px rgba(0,0,0,.22);-webkit-tap-highlight-color:transparent}
      #aiDirectorOverlay{position:fixed;inset:0;z-index:9998;background:rgba(13,27,25,.45);display:none;align-items:flex-end;justify-content:center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box}
      #aiDirectorOverlay.is-open{display:flex}
      #aiDirectorPanel{width:min(100%,520px);max-height:82vh;overflow:auto;background:#f7faf9;border-radius:24px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);box-sizing:border-box}
      .aiDirectorHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.aiDirectorHead h2{margin:0;font-size:21px}.aiDirectorClose{width:38px;height:38px;border:0;border-radius:50%;font-size:24px;background:#e6efec;color:#24433e}
      .aiDirectorMessage{background:#fff;border:1px solid rgba(8,127,107,.15);border-radius:16px;padding:14px;line-height:1.65;color:#20332f;margin-bottom:12px;min-height:88px}
      .aiDirectorQuick{display:grid;grid-template-columns:1fr 1fr;gap:10px}.aiDirectorQuick button{border:1px solid rgba(8,127,107,.22);background:#fff;color:#086f5e;border-radius:14px;padding:13px 10px;font-weight:750;font-size:14px}
      .aiDirectorNote{font-size:12px;color:#60716d;margin:12px 2px 0;line-height:1.5}
      @media(max-width:360px){.aiDirectorQuick{grid-template-columns:1fr}#aiDirectorFab{right:12px}}
    `;
    document.head.appendChild(style);
  }

  function build(){
    if(document.getElementById('aiDirectorFab'))return;
    injectStyles();
    const fab=document.createElement('button');
    fab.id='aiDirectorFab';
    fab.type='button';
    fab.setAttribute('aria-controls','aiDirectorOverlay');
    fab.setAttribute('aria-expanded','false');
    fab.textContent='💬 AI院長';

    const overlay=document.createElement('div');
    overlay.id='aiDirectorOverlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-labelledby','aiDirectorTitle');
    overlay.innerHTML=`<div id="aiDirectorPanel">
      <div class="aiDirectorHead"><h2 id="aiDirectorTitle">💬 AI院長</h2><button class="aiDirectorClose" type="button" aria-label="閉じる">×</button></div>
      <div id="aiDirectorMessage" class="aiDirectorMessage">こんにちは。何を相談しますか？</div>
      <div class="aiDirectorQuick">
        <button type="button" data-ai-question="glc">🚗 GLC買える？</button>
        <button type="button" data-ai-question="hire">👩‍⚕️ 看護師採用できる？</button>
        <button type="button" data-ai-question="month">📈 今月どう？</button>
        <button type="button" data-ai-question="margin">💰 利益率は？</button>
      </div>
      <p class="aiDirectorNote">端末内のデータだけを使用するルールベースβ版です。外部サーバーには送信しません。</p>
    </div>`;
    document.body.append(fab,overlay);

    const message=overlay.querySelector('#aiDirectorMessage');
    const close=()=>{
      overlay.classList.remove('is-open');
      fab.setAttribute('aria-expanded','false');
      document.body.style.overflow='';
    };
    const open=()=>{
      overlay.classList.add('is-open');
      fab.setAttribute('aria-expanded','true');
      document.body.style.overflow='hidden';
      overlay.querySelector('.aiDirectorClose')?.focus();
    };

    fab.addEventListener('click',open);
    overlay.querySelector('.aiDirectorClose').addEventListener('click',close);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    overlay.querySelectorAll('[data-ai-question]').forEach(btn=>{
      btn.addEventListener('click',()=>{message.innerHTML=answer(btn.dataset.aiQuestion);});
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open'))close();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});
  else build();
})();
