(()=>{
  'use strict';
  const STORAGE_KEY='keitaDashboardSimpleV1';
  const FEEDBACK_KEY='keitaAIDirectorFeedbackV1';
  const BRIEFING_OPEN_KEY='keitaAIDirectorBriefingOpenedV1';
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
  const entryHasData=e=>e&&(Number(e.sales)||Number(e.patients)||Number(e.checkups)||Number(e.surgeries));
  const previousOperatingEntry=data=>{
    const today=TODAY();
    const rows=(Array.isArray(data.entries)?data.entries:[])
      .filter(e=>String(e.date||'')<today&&entryHasData(e))
      .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    return rows[0]||null;
  };
  const dailyTargetFor=data=>Number(data.clinic?.fullDayTarget)||180000;
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
    const previousEntry=previousOperatingEntry(data);
    const previousUnit=previousEntry&&Number(previousEntry.patients)?(Number(previousEntry.sales)||0)/Number(previousEntry.patients):0;
    const dailyTarget=dailyTargetFor(data);
    const targetGap=Math.max(0,target-cur.sales);
    const requiredDaily=remaining?targetGap/remaining:targetGap;
    return {...cur,profit,margin,target,businessDays,activeDays,remaining,forecast,balance,loan,netAssets:balance-loan,personnelExpense,medicalExpense,prev,previousEntry,previousUnit,dailyTarget,targetGap,requiredDaily};
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
    if(kind==='glb'){
      if(!m.expense)return block('まだ判断できません。','支出が未入力のため、毎月の余力を計算できません。','総支出と口座残高を入力してください。');
      const strong=m.profit>=1200000&&m.margin>=22&&m.netAssets>=2500000;
      const possible=m.profit>=800000&&m.margin>=18;
      return block(strong?'GLBはリースなら前向きに検討できます。':possible?'GLBは条件付きで検討可能です。':'今はもう少し待つのが安全です。',[
        `月間利益 ${yen(m.profit)}・利益率 ${pct(m.margin)}`,
        m.balance?`現預金 ${yen(m.balance)}・借入差引 ${yen(m.netAssets)}`:'口座残高は未入力です。'
      ],strong?'月額リース料・保険・維持費の合計を、月間利益の10%以内に収めて最終判断しましょう。':possible?'まず月間利益120万円以上を3か月維持し、手元資金を減らさないリース条件を確認しましょう。':'利益率20%前後と月間利益100万円以上が安定してから再検討しましょう。');
    }
    if(kind==='endoscopy'){
      if(!m.expense)return block('まだ判断できません。','総支出が未入力のため、設備投資後の余力を評価できません。','総支出と口座残高を入力してください。');
      const strong=m.profit>=1500000&&m.margin>=25&&m.netAssets>=4000000;
      const possible=m.profit>=1000000&&m.margin>=20&&m.netAssets>=2500000;
      return block(strong?'内視鏡は導入を前向きに検討できます。':possible?'条件を確認すれば検討可能です。':'今は資金を厚くする時期です。',[
        `月間利益 ${yen(m.profit)}・利益率 ${pct(m.margin)}`,
        m.balance?`現預金 ${yen(m.balance)}・借入差引 ${yen(m.netAssets)}`:'口座残高は未入力です。'
      ],strong?'本体価格・保守費・洗浄設備を含む総額を確認し、想定症例数で3〜4年以内に回収できるか試算しましょう。':possible?'中古機も含めて総額を確認し、月間利益150万円以上を3か月維持してから契約するのが安全です。':'ICU導入後の資金余力を優先し、現預金と利益の安定を待ちましょう。');
    }
    return block('経営データを確認します。','売上・来院数・支出をもとに判断します。','相談項目を選んでください。');
  };
  const consultationAnswer=(message,m)=>{
    const text=String(message||'').trim();
    if(/疲れ|疲れた/.test(text))return block('今日も本当にお疲れさまでした。',[
      m.previousEntry?`直近診療日は${Number(m.previousEntry.patients)||0}件・売上${yen(m.previousEntry.sales)}でした。`:'直近診療日のデータはまだありません。',
      m.sales?`今月の売上は${yen(m.sales)}、来院は${m.patients.toLocaleString('ja-JP')}件です。`:'今月の診療データはまだ入力されていません。'
    ],'数字を整えることより、まずは休息を優先してください。明日また一つずつ確認しましょう。');
    if(/売上/.test(text))return answer('month',m);
    if(/利益/.test(text))return answer('margin',m);
    if(/不安/.test(text))return block('不安を一人で抱えなくて大丈夫です。',[
      m.sales?`今月の売上は${yen(m.sales)}、目標達成率は${pct(m.target?m.sales/m.target*100:0)}です。`:'今月の売上データはまだありません。',
      m.expense?`現在の利益は${yen(m.profit)}、利益率は${pct(m.margin)}です。`:'支出を入力すると、現在の利益と安全性を確認できます。'
    ],m.forecast>=m.target?'今の診療品質を守りながら進めましょう。':'まず今日できる小さな改善を一つだけ選びましょう。');
    if(/看護師|スタッフ/.test(text))return block('教育と人員配置は、段階的に整えるのがおすすめです。',[
      m.personnelExpense?`現在の人件費は${yen(m.personnelExpense)}です。`:'人件費の内訳はまだ入力されていません。',
      m.expense?`月間利益は${yen(m.profit)}、利益率は${pct(m.margin)}です。`:'総支出を入力すると、増員余力を判断できます。'
    ],'業務を一つずつ標準化し、短い面談と教育チェックリストから始めましょう。採用判断は固定質問でも確認できます。');
    if(/広告|新患/.test(text))return block('集客は、広告だけでなく来院後の定着まで一緒に見ましょう。',[
      `今月の来院は${m.patients.toLocaleString('ja-JP')}件です。`,
      m.sales?`来院1件あたりの売上目安は${yen(m.patients?m.clinicalSales/m.patients:0)}です。`:'売上データを入力すると、集客効果を詳しく確認できます。'
    ],'広告媒体ごとの新患数を記録し、Googleマップ・口コミ・既存患者からの紹介を優先して改善しましょう。');
    if(/GLC|車/i.test(text))return answer('glc',m);
    return block('ご相談ありがとうございます。現在は試験版のため対応できる内容は限られていますが、今後さらに賢くなります。','「売上」「利益」「スタッフ」など、気になる言葉を含めて相談できます。','別の言葉でも相談してみてください。');
  };
  // 将来はこの関数の中をOpenAI API呼び出しに置き換える。
  const requestConsultationResponse=async message=>consultationAnswer(message,metrics());
  const recommendation=m=>{
    const e=m.previousEntry;
    if(e){
      const sales=Number(e.sales)||0,patients=Number(e.patients)||0,checkups=Number(e.checkups)||0,surgeries=Number(e.surgeries)||0;
      const unit=patients?sales/patients:0;
      const label=String(e.date||'').replaceAll('-','/');
      if(patients>=25)return {id:`busy-${e.date}`,title:'今日は無理に件数を増やさず、診療の質を優先',summary:`直近診療日（${label}）は${patients}件でした。`,detail:`売上${yen(sales)}、来院${patients}件、客単価${yen(unit)}でした。高負荷の翌日は、再診計画とスタッフ負担の確認を優先するのがおすすめです。`};
      if(sales<m.dailyTarget*.75)return {id:`sales-low-${e.date}`,title:'今日は再診・健診の案内漏れを減らしましょう',summary:`直近診療日の売上は${yen(sales)}でした。`,detail:`目安の日商${yen(m.dailyTarget)}に対して${yen(Math.max(0,m.dailyTarget-sales))}不足しています。来院${patients}件、健診${checkups}件でした。必要な検査・予防・健診を丁寧に案内しましょう。`};
      if(patients>=10&&unit<8000)return {id:`unit-low-${e.date}`,title:'必要な検査と再診計画を丁寧に提案',summary:`直近診療日の客単価は${yen(unit)}でした。`,detail:`売上${yen(sales)}、来院${patients}件、健診${checkups}件、手術${surgeries}件でした。単価を上げること自体ではなく、必要な検査・処置・再診案内の漏れを減らすことを意識しましょう。`};
      if(checkups===0&&patients>=10)return {id:`checkup-zero-${e.date}`,title:'今日は対象患者に健診を一言ご案内',summary:`直近診療日は${patients}件で、健診は0件でした。`,detail:`売上${yen(sales)}、客単価${yen(unit)}でした。シニア期や慢性疾患の患者さんに、無理のない範囲で健康診断の選択肢を一言添えるのがおすすめです。`};
      if(sales>=m.dailyTarget)return {id:`good-day-${e.date}`,title:'良い流れです。今日は診療品質を維持しましょう',summary:`直近診療日の売上は${yen(sales)}で目安を上回りました。`,detail:`来院${patients}件、客単価${yen(unit)}、健診${checkups}件、手術${surgeries}件でした。無理な上積みより、再診フォローと診療品質の維持を優先しましょう。`};
    }
    if(!m.sales)return {id:'start-input',title:'まず1日分を入力しましょう',summary:'今月の診療データがまだありません。',detail:'売上・来院数を入力すると、直近診療日の結果から具体的な提案を出せます。'};
    if(m.expense&&m.margin<20)return {id:'margin-low',title:'今月は支出の確認を優先',summary:`利益率は${pct(m.margin)}です。`,detail:'薬品費・外注費・人件費の増加要因を1つずつ確認しましょう。'};
    if(m.forecast<m.target&&m.remaining>0)return {id:'target-gap',title:'月目標に向けて案内漏れを減らしましょう',summary:`目標まであと${yen(m.targetGap)}です。`,detail:`残り${m.remaining}営業日は、1日${yen(m.requiredDaily)}が目安です。再診・健診・予防の案内を丁寧に行いましょう。`};
    return {id:'followup',title:'既存患者のフォローを優先',summary:'今月の流れは大きく崩れていません。',detail:'新しい施策を増やすより、再診・予防・検査フォローの案内漏れを減らすのがおすすめです。'};
  };

  const briefingFor=m=>{
    const now=new Date();
    const hour=now.getHours();
    const greeting=hour<11?'おはようございます。':hour<17?'こんにちは。':'お疲れさまです。';
    const e=m.previousEntry;
    const rate=m.target?m.sales/m.target*100:0;
    let recap='直近診療日のデータはまだありません。';
    if(e){
      const sales=Number(e.sales)||0,patients=Number(e.patients)||0;
      recap=`直近診療日は${patients}件・${yen(sales)}の診療でした。`;
    }
    let situation='今月の記録を入力すると、目標までの状況を確認できます。';
    if(m.sales){
      if(rate>=100)situation=`今月は目標を達成しています。達成率は${pct(rate)}です。`;
      else if(m.forecast>=m.target)situation=`今月は目標達成ペースです。目標まであと${yen(m.targetGap)}です。`;
      else if(m.remaining)situation=`目標まであと${yen(m.targetGap)}、残り${m.remaining}営業日です。`;
      else situation=`今月の達成率は${pct(rate)}です。`;
    }
    const rec=recommendation(m);
    let closing='今日も一件一件の診療を大切に進めましょう。';
    if(rate>=100)closing='目標達成後は、無理に件数を追わず診療品質を大切にしましょう。';
    else if(m.previousEntry&&Number(m.previousEntry.patients)>=25)closing='昨日の負荷が高かったため、スタッフへの声掛けも忘れずに。';
    else if(m.remaining&&m.requiredDaily>0&&m.requiredDaily<=m.dailyTarget)closing='十分に届く水準です。焦らず案内漏れを減らしましょう。';
    return {greeting,recap,situation,focus:rec.title,closing};
  };
  const briefingCard=m=>{
    const b=briefingFor(m);
    return `<section class="aiDirectorBriefing" aria-labelledby="aiDirectorBriefingTitle"><span class="aiDirectorBriefingEyebrow">☀️ 朝のブリーフィング</span><h3 id="aiDirectorBriefingTitle">${b.greeting}</h3><p>${b.recap}</p><p>${b.situation}</p><div class="aiDirectorBriefingFocus"><span>今日の重点</span><strong>${b.focus}</strong></div><p class="aiDirectorBriefingClosing">${b.closing}</p></section>`;
  };

  const previousDayCard=m=>{
    const e=m.previousEntry;
    if(!e)return '<div class="aiDirectorEmpty">前日の入力データがありません。</div>';
    const sales=Number(e.sales)||0,patients=Number(e.patients)||0,unit=patients?sales/patients:0;
    return `<div class="aiDirectorMetrics"><div><span>売上</span><strong>${yen(sales)}</strong></div><div><span>来院</span><strong>${patients}件</strong></div><div><span>客単価</span><strong>${yen(unit)}</strong></div><div><span>健診</span><strong>${Number(e.checkups)||0}件</strong></div><div><span>手術</span><strong>${Number(e.surgeries)||0}件</strong></div></div><p class="aiDirectorDate">直近診療日：${String(e.date||'').replaceAll('-','/')}</p>`;
  };
  const targetNavigator=m=>{
    const rate=m.target?m.sales/m.target*100:0;
    const status=m.forecast>=m.target?'目標達成ペースです。':m.remaining?'対策すれば十分狙えます。':'今月の営業日は終了しています。';
    return `<div class="aiDirectorMetrics aiDirectorTargetMetrics"><div><span>目標まで</span><strong>${yen(m.targetGap)}</strong></div><div><span>残り営業日</span><strong>${m.remaining}日</strong></div><div><span>必要日商</span><strong>${yen(m.requiredDaily)}</strong></div><div><span>達成率</span><strong>${pct(rate)}</strong></div></div><p class="aiDirectorTargetStatus">${status}</p>`;
  };
  function injectStyles(){
    const style=document.createElement('style');
    style.textContent=`
      #aiDirectorFab{position:fixed;right:18px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:9000;border:0;border-radius:999px;padding:13px 17px;background:#087f6b;color:#fff;font-weight:800;font-size:15px;box-shadow:0 10px 26px rgba(0,0,0,.22);-webkit-tap-highlight-color:transparent}
      #aiDirectorOverlay{position:fixed;inset:0;z-index:9998;background:rgba(13,27,25,.45);display:none;align-items:flex-end;justify-content:center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));box-sizing:border-box}
      #aiDirectorOverlay.is-open{display:flex}
      #aiDirectorPanel{width:min(100%,520px);max-height:84vh;overflow:auto;background:#f7faf9;border-radius:24px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);box-sizing:border-box}
      .aiDirectorHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.aiDirectorHead h2{margin:0;font-size:21px}.aiDirectorClose{width:38px;height:38px;border:0;border-radius:50%;font-size:24px;background:#e6efec;color:#24433e}
      .aiDirectorBriefing{background:linear-gradient(180deg,#ffffff,#f3f9f7);border:1px solid rgba(8,127,107,.18);border-radius:18px;padding:15px;margin-bottom:12px}.aiDirectorBriefingEyebrow{display:block;color:#087f6b;font-size:12px;font-weight:800;margin-bottom:7px}.aiDirectorBriefing h3{font-size:19px;margin:0 0 9px;color:#20332f}.aiDirectorBriefing p{font-size:14px;line-height:1.6;color:#50635f;margin:0 0 7px}.aiDirectorBriefingFocus{margin:12px 0 9px;padding:11px 12px;background:#eaf5f1;border-radius:12px}.aiDirectorBriefingFocus span{display:block;font-size:11px;color:#60716d;margin-bottom:4px}.aiDirectorBriefingFocus strong{font-size:15px;color:#08705f}.aiDirectorBriefingClosing{font-weight:700;color:#24433e!important;margin-bottom:0!important}.aiDirectorRecommend{background:#fff;border:1px solid rgba(8,127,107,.18);border-radius:18px;padding:15px;margin-bottom:12px}.aiDirectorEyebrow{display:block;color:#087f6b;font-size:12px;font-weight:800;margin-bottom:7px}.aiDirectorRecommend h3{font-size:17px;margin:0 0 7px}.aiDirectorRecommend p{font-size:14px;line-height:1.6;color:#50635f;margin:0}.aiDirectorReason{display:none;margin-top:10px;padding-top:10px;border-top:1px solid #e7eeec}.aiDirectorReason.is-open{display:block}.aiDirectorActions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.aiDirectorActions button{border:0;border-radius:11px;padding:9px 12px;font-weight:750}.aiDirectorReasonBtn{background:#eaf4f1;color:#08705f}.aiDirectorAccept{background:#087f6b;color:#fff}.aiDirectorLater{background:#edf1f0;color:#40534f}.aiDirectorStatus{font-size:12px;color:#687a76;margin-top:8px;min-height:1.2em}
      .aiDirectorSection{background:#fff;border:1px solid rgba(8,127,107,.14);border-radius:16px;padding:14px;margin-bottom:12px}.aiDirectorSectionTitle{font-size:14px;margin:0 0 10px;color:#24433e}.aiDirectorMetrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.aiDirectorMetrics div{background:#f1f6f4;border-radius:11px;padding:9px}.aiDirectorMetrics span{display:block;font-size:11px;color:#687a76;margin-bottom:4px}.aiDirectorMetrics strong{display:block;font-size:14px;color:#20332f}.aiDirectorDate,.aiDirectorTargetStatus{margin:9px 1px 0;font-size:12px;color:#60716d}.aiDirectorTargetMetrics{grid-template-columns:repeat(2,1fr)}.aiDirectorEmpty{font-size:13px;color:#687a76}.aiDirectorMessage{background:#fff;border:1px solid rgba(8,127,107,.15);border-radius:16px;padding:14px;line-height:1.65;color:#20332f;margin-bottom:12px}.aiDirectorMessage h3{font-size:15px;margin:0 0 5px}.aiDirectorMessage p{margin:0 0 10px}.aiDirectorMessage p:last-child{margin-bottom:0}.aiDirectorMessage ul{margin:0 0 10px;padding-left:20px}
      .aiDirectorQuick{display:grid;grid-template-columns:1fr 1fr;gap:10px}.aiDirectorQuick button{border:1px solid rgba(8,127,107,.22);background:#fff;color:#086f5e;border-radius:14px;padding:13px 10px;font-weight:750;font-size:14px}
      .aiDirectorConsultation{border-top:1px solid #dce8e4;margin-top:16px;padding-top:16px}.aiDirectorConsultation h3{font-size:17px;color:#20332f;margin:0 0 11px}.aiDirectorConsultation label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.aiDirectorConsultation textarea{display:block;width:100%;min-height:92px;resize:vertical;box-sizing:border-box;border:1px solid rgba(8,127,107,.28);border-radius:14px;background:#fff;padding:12px;font:inherit;font-size:16px;line-height:1.5;color:#20332f}.aiDirectorConsultation textarea:focus{outline:3px solid rgba(8,127,107,.14);border-color:#087f6b}.aiDirectorConsultationSubmit{display:block;width:100%;border:0;border-radius:13px;margin-top:10px;padding:13px;background:#087f6b;color:#fff;font-size:15px;font-weight:800}.aiDirectorConsultationSubmit:disabled{opacity:.6}.aiDirectorConsultationAnswer{display:none;margin-top:12px}.aiDirectorConsultationAnswer.is-visible{display:block}
      .aiDirectorNote{font-size:12px;color:#60716d;margin:12px 2px 0;line-height:1.5}
      @media(max-width:390px){.aiDirectorMetrics{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:600px){body{padding-bottom:calc(82px + env(safe-area-inset-bottom))}#aiDirectorFab{right:12px;bottom:calc(92px + env(safe-area-inset-bottom));max-width:calc(100vw - 24px)}}
      @media(max-width:360px){.aiDirectorQuick{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }
  const renderBlock=b=>`<h3>結論</h3><p>${b.conclusion}</p><h3>理由</h3><ul>${b.reasons.map(x=>`<li>${x}</li>`).join('')}</ul><h3>次の目安</h3><p>${b.next}</p>`;
  function build(){
    if(document.getElementById('aiDirectorFab'))return;
    injectStyles();
    const fab=document.createElement('button');
    fab.id='aiDirectorFab';fab.type='button';fab.setAttribute('aria-controls','aiDirectorOverlay');fab.setAttribute('aria-expanded','false');fab.textContent='💬 影武者に相談';
    const overlay=document.createElement('div');
    overlay.id='aiDirectorOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','aiDirectorTitle');
    overlay.innerHTML=`<div id="aiDirectorPanel">
      <div class="aiDirectorHead"><h2 id="aiDirectorTitle">💬 影武者</h2><button class="aiDirectorClose" type="button" aria-label="閉じる">×</button></div>
      <div id="aiDirectorBriefing"></div>
      <section class="aiDirectorRecommend" aria-labelledby="aiDirectorRecommendTitle">
        <span class="aiDirectorEyebrow">💡 今日のおすすめ</span><h3 id="aiDirectorRecommendTitle"></h3><p id="aiDirectorRecommendSummary"></p>
        <div id="aiDirectorReason" class="aiDirectorReason"></div>
        <div class="aiDirectorActions"><button class="aiDirectorReasonBtn" type="button">理由を見る</button><button class="aiDirectorAccept" type="button">👍 採用する</button><button class="aiDirectorLater" type="button">あとで見る</button></div>
        <div id="aiDirectorStatus" class="aiDirectorStatus" aria-live="polite"></div>
      </section>
      <section class="aiDirectorSection"><h3 class="aiDirectorSectionTitle">📅 昨日の振り返り</h3><div id="aiDirectorPreviousDay"></div></section>
      <section class="aiDirectorSection"><h3 class="aiDirectorSectionTitle">📈 月目標ナビ</h3><div id="aiDirectorTargetNavigator"></div></section>
      <div id="aiDirectorMessage" class="aiDirectorMessage">相談項目を選んでください。</div>
      <div class="aiDirectorQuick"><button type="button" data-ai-question="glc">🚗 GLC買える？</button><button type="button" data-ai-question="glb">🚙 GLBなら？</button><button type="button" data-ai-question="endoscopy">🔬 内視鏡導入できる？</button><button type="button" data-ai-question="hire">👩‍⚕️ 看護師採用できる？</button><button type="button" data-ai-question="month">📈 今月どう？</button><button type="button" data-ai-question="margin">💰 利益率は？</button></div>
      <section class="aiDirectorConsultation" aria-labelledby="aiDirectorConsultationTitle">
        <h3 id="aiDirectorConsultationTitle">🥷 影武者に相談（β）</h3>
        <form id="aiDirectorConsultationForm"><label class="sr-only" for="aiDirectorConsultationInput">今日の出来事や相談</label><textarea id="aiDirectorConsultationInput" placeholder="今日の出来事や相談を書いてください" required></textarea><button class="aiDirectorConsultationSubmit" type="submit">相談する</button></form>
        <div id="aiDirectorConsultationAnswer" class="aiDirectorMessage aiDirectorConsultationAnswer" aria-live="polite"></div>
      </section>
      <p class="aiDirectorNote">端末内に保存されたデータだけを使用します。外部サーバーには送信しません。</p>
    </div>`;
    document.body.append(fab,overlay);
    let currentRecommendation=null;
    const refresh=()=>{
      const m=metrics();currentRecommendation=recommendation(m);
      overlay.querySelector('#aiDirectorBriefing').innerHTML=briefingCard(m);
      overlay.querySelector('#aiDirectorRecommendTitle').textContent=currentRecommendation.title;
      overlay.querySelector('#aiDirectorRecommendSummary').textContent=currentRecommendation.summary||'今日、最初に意識する経営アクションです。';
      overlay.querySelector('#aiDirectorReason').textContent=currentRecommendation.detail;
      overlay.querySelector('#aiDirectorPreviousDay').innerHTML=previousDayCard(m);
      overlay.querySelector('#aiDirectorTargetNavigator').innerHTML=targetNavigator(m);
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
    overlay.querySelector('#aiDirectorConsultationForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const input=overlay.querySelector('#aiDirectorConsultationInput');
      const output=overlay.querySelector('#aiDirectorConsultationAnswer');
      const submit=e.currentTarget.querySelector('button[type="submit"]');
      if(!input.value.trim()){input.focus();return;}
      submit.disabled=true;submit.textContent='考えています…';
      const response=await requestConsultationResponse(input.value);
      output.innerHTML=renderBlock(response);output.classList.add('is-visible');
      submit.disabled=false;submit.textContent='相談する';
      output.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    const maybeOpenMorningBriefing=()=>{
      const hour=new Date().getHours();
      if(hour<5||hour>=12)return;
      let opened='';
      try{opened=localStorage.getItem(BRIEFING_OPEN_KEY)||'';}catch{}
      if(opened===TODAY())return;
      try{localStorage.setItem(BRIEFING_OPEN_KEY,TODAY());}catch{}
      setTimeout(open,450);
    };
    maybeOpenMorningBriefing();
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open'))close();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
