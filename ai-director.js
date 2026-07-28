(()=>{
  'use strict';
  const STORAGE_KEY='keitaDashboardSimpleV1';
  const TODAY=()=>{
    const d=new Date();
    return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  };
  const monthKey=()=>TODAY().slice(0,7);
  const yen=n=>`${Math.round(Number(n)||0).toLocaleString('ja-JP')}円`;
  const readData=()=>{
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch{return {};}
  };
  const metrics=()=>{
    const data=readData();
    const mk=monthKey();
    const entries=Array.isArray(data.entries)?data.entries.filter(e=>String(e.date||'').slice(0,7)===mk):[];
    const sales=entries.reduce((s,e)=>s+(Number(e.sales)||0),0);
    const patients=entries.reduce((s,e)=>s+(Number(e.patients)||0),0);
    const finance=(data.financeByMonth&&data.financeByMonth[mk])||data.finance||{};
    const expense=Number(finance.monthlyExpense)||0;
    const profit=sales-expense;
    const margin=sales>0?profit/sales*100:0;
    const target=Number(data.settings?.[mk]?.target)||5000000;
    return {sales,patients,unit:patients?sales/patients:0,expense,profit,margin,target};
  };
  const answer=(kind)=>{
    const m=metrics();
    if(kind==='month'){
      if(!m.sales)return '今月の売上データはまだありません。入力後に、売上・来院数・客単価をまとめて評価します。';
      const rate=m.target?m.sales/m.target*100:0;
      return `今月の売上は${yen(m.sales)}、目標達成率は${rate.toFixed(1)}%です。来院数は${m.patients.toLocaleString('ja-JP')}件、客単価は${yen(m.unit)}です。`;
    }
    if(kind==='margin'){
      if(!m.expense)return `今月の売上は${yen(m.sales)}です。総支出を入力すると、利益率を計算できます。`;
      return `今月の利益は${yen(m.profit)}、利益率は${m.margin.toFixed(1)}%です。売上${yen(m.sales)}に対し、総支出は${yen(m.expense)}です。`;
    }
    return '売上・来院数・客単価・支出を確認し、毎月の経営判断を支援します。';
  };

  function injectStyles(){
    const style=document.createElement('style');
    style.textContent=`
      #aiDirectorFab{position:fixed;right:18px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:9000;border:0;border-radius:999px;padding:13px 17px;background:#087f6b;color:#fff;font-weight:800;font-size:15px;box-shadow:0 10px 26px rgba(0,0,0,.22);-webkit-tap-highlight-color:transparent}
      #aiDirectorOverlay{position:fixed;inset:0;z-index:9998;background:rgba(13,27,25,.45);display:none;align-items:flex-end;justify-content:center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box}
      #aiDirectorOverlay.is-open{display:flex}
      #aiDirectorPanel{width:min(100%,520px);max-height:82vh;overflow:auto;background:#f7faf9;border-radius:24px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);box-sizing:border-box}
      .aiDirectorHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.aiDirectorHead h2{margin:0;font-size:21px}.aiDirectorClose{width:38px;height:38px;border:0;border-radius:50%;font-size:24px;background:#e6efec;color:#24433e}
      .aiDirectorMessage{background:#fff;border:1px solid rgba(8,127,107,.15);border-radius:16px;padding:14px;line-height:1.65;color:#20332f;margin-bottom:12px}
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
      <div id="aiDirectorMessage" class="aiDirectorMessage">こんにちは。今月の経営状況を一緒に確認しましょう。</div>
      <div class="aiDirectorQuick">
        <button type="button" data-ai-question="month">今月どう？</button>
        <button type="button" data-ai-question="margin">利益率は？</button>
      </div>
      <p class="aiDirectorNote">この第一段階では、端末内に保存されたデータだけを使用します。外部サーバーには送信しません。</p>
    </div>`;
    document.body.append(fab,overlay);

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
      btn.addEventListener('click',()=>{
        document.getElementById('aiDirectorMessage').textContent=answer(btn.dataset.aiQuestion);
      });
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open'))close();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});
  else build();
})();
