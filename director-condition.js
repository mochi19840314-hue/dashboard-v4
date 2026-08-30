(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DirectorCondition=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const STORAGE_KEY='keitaDashboardSimpleV1';
 const VALID=['good','normal','low'];
 const todayIso=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
 const normalize=value=>VALID.includes(String(value||''))?String(value):null;
 const n=value=>Math.max(0,Number(value)||0);
 const clinicalCount=(entry,metric)=>{
  const clinical=entry?.clinical||{};
  if(metric==='bloodTests')return n(clinical.bloodTests);
  if(metric==='imaging')return n(clinical.xrays)+n(clinical.ultrasounds);
  return 0;
 };
 const analyzeConditions=entries=>{
  const groups={good:{days:0,patients:0,sales:0,bloodTests:0,imaging:0},normal:{days:0,patients:0,sales:0,bloodTests:0,imaging:0},low:{days:0,patients:0,sales:0,bloodTests:0,imaging:0}};
  (Array.isArray(entries)?entries:[]).forEach(entry=>{
   const condition=normalize(entry?.directorCondition);if(!condition)return;
   const g=groups[condition],patients=n(entry?.patients),sales=n(entry?.sales);g.days++;g.patients+=patients;g.sales+=sales;g.bloodTests+=clinicalCount(entry,'bloodTests');g.imaging+=clinicalCount(entry,'imaging');
  });
  Object.values(groups).forEach(g=>{g.avgSales=g.days?g.sales/g.days:null;g.unitPrice=g.patients?g.sales/g.patients:null;g.bloodRate=g.patients?g.bloodTests/g.patients*100:null;g.imagingRate=g.patients?g.imaging/g.patients*100:null});
  return groups;
 };
 const readDashboard=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'')||{}}catch{return {}}};
 const writeDashboard=data=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true}catch{return false}};
 let targetDate=todayIso();
 function injectStyles(){
  if(document.getElementById('directorConditionStyle'))return;
  const style=document.createElement('style');style.id='directorConditionStyle';style.textContent=`
   .director-condition-input{grid-column:1/-1;padding:12px;border-radius:14px;background:#f7f9fa;border:1px solid rgba(60,82,88,.12)}
   .director-condition-input>span{display:block;font-size:12px;font-weight:800;color:#425955;margin-bottom:8px}
   .director-condition-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.director-condition-options input{position:absolute;opacity:0;pointer-events:none}
   .director-condition-options label{display:flex;align-items:center;justify-content:center;min-height:44px;margin:0;border:1px solid #d8e2e4;border-radius:12px;background:#fff;color:#4e6160;font-size:13px;font-weight:800;cursor:pointer}
   .director-condition-options input:checked+label{border-color:#2f8f7d;box-shadow:0 0 0 2px rgba(47,143,125,.12);background:#eef8f5;color:#1d6f61}
   .director-condition-options input[value="low"]:checked+label{border-color:#b66565;background:#fff2f2;color:#9b3f3f;box-shadow:0 0 0 2px rgba(182,101,101,.1)}
   .director-condition-input small{display:block;margin-top:7px;font-size:10px;line-height:1.45;color:#7a8986}
   @media(max-width:430px){.director-condition-options{gap:6px}.director-condition-options label{font-size:12px;min-height:42px}}
  `;document.head.appendChild(style);
 }
 function ensureInputs(){
  if(document.getElementById('directorConditionBox'))return;
  const fields=document.querySelector('#todayEntryForm .today-entry-fields');if(!fields)return;
  const clinical=fields.querySelector('.today-entry-clinical');
  const box=document.createElement('section');box.id='directorConditionBox';box.className='director-condition-input';box.setAttribute('aria-label','院長コンディション');box.innerHTML=`<span>院長コンディション</span><div class="director-condition-options"><input type="radio" name="directorCondition" id="directorConditionGood" value="good"><label for="directorConditionGood">🟢 良好</label><input type="radio" name="directorCondition" id="directorConditionNormal" value="normal"><label for="directorConditionNormal">🟡 普通</label><input type="radio" name="directorCondition" id="directorConditionLow" value="low"><label for="directorConditionLow">🔴 低調</label></div><small>診療終了時の主観でOK。将来、血液検査率・画像検査率・客単価との関係を比較します。</small>`;
  if(clinical)fields.insertBefore(box,clinical);else fields.appendChild(box);
 }
 function populate(){
  const data=readDashboard(),entry=(Array.isArray(data.entries)?data.entries:[]).find(item=>item?.date===targetDate),value=normalize(entry?.directorCondition);
  document.querySelectorAll('input[name="directorCondition"]').forEach(input=>{input.checked=input.value===value});
 }
 function selected(){return normalize(document.querySelector('input[name="directorCondition"]:checked')?.value)};
 function patchEntry(date,condition,attempt=0){
  if(!condition)return;
  const data=readDashboard(),entries=Array.isArray(data.entries)?data.entries:null,entry=entries?.find(item=>item?.date===date);
  if(entry){entry.directorCondition=condition;entry.directorConditionUpdatedAt=new Date().toISOString();writeDashboard(data);return;}
  if(attempt<3)setTimeout(()=>patchEntry(date,condition,attempt+1),[40,120,260][attempt]||260);
 }
 function onSubmit(){const condition=selected(),date=targetDate;if(condition)setTimeout(()=>patchEntry(date,condition),0)};
 function trackTarget(event){
  const edit=event.target?.closest?.('[data-edit]');if(edit?.dataset?.edit){targetDate=edit.dataset.edit;return;}
  if(event.target?.closest?.('#editActivitySummary')){targetDate=document.getElementById('activitySummaryModal')?.dataset?.date||targetDate;return;}
  const activity=event.target?.closest?.('[data-activity-date]');if(activity?.dataset?.activityDate){targetDate=activity.dataset.activityDate;return;}
  if(event.target?.closest?.('#todayHeroEdit,#todaySummaryCard'))targetDate=todayIso();
 }
 function observeModal(){const modal=document.getElementById('todayEntryModal');if(!modal)return;new MutationObserver(()=>{if(!modal.hidden)populate()}).observe(modal,{attributes:true,attributeFilter:['hidden','class']})}
 function build(){
  injectStyles();ensureInputs();observeModal();
  document.addEventListener('pointerdown',trackTarget,true);document.addEventListener('click',trackTarget,true);document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target?.closest?.('#todaySummaryCard'))targetDate=todayIso()},true);
  document.getElementById('todayEntryForm')?.addEventListener('submit',onSubmit,true);
 }
 if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build()}
 return {normalize,clinicalCount,analyzeConditions};
});
