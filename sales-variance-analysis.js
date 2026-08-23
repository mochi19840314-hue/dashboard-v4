(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.SalesVarianceAnalysis=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value||{},key);
  const number=(value)=>value!==""&&value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):null;
  const shift=(month,amount)=>{const [year,index]=month.split("-").map(Number),date=new Date(Date.UTC(year,index-1+amount,1));return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}`};
  const label=month=>`${Number(month.slice(0,4))}年${Number(month.slice(5))}月`;
  const valueOf=(entry,keys)=>{for(const key of keys){const source=key.startsWith("clinical.")?entry.clinical:entry,k=key.replace("clinical.","");if(own(source,k)){const value=number(source[k]);if(value!==null)return value}}return null};
  const definitions=[
    ["patients","患者数",["patients"],"件"],["patientsPerDay","1営業日あたり患者数",[],"件"],["unit","客単価",[],"%"],
    ["newPatients","新患数",["newPatients","clinical.newPatients"],"件"],["newRate","新患率",[],"pt"],["revisits","再診数",["clinical.revisits"],"件"],["revisitRate","再診率",[],"pt"],
    ["preventive","予防件数",["clinical.preventive"],"件"],["preventiveRate","予防率",[],"pt"],["checkups","健康診断件数",["checkups","clinical.checkups"],"件"],["checkupRate","健康診断率",[],"pt"],
    ["bloodTests","血液検査件数",["clinical.bloodTests"],"件"],["bloodRate","血液検査率",[],"pt"],["imaging","画像検査件数",["clinical.imaging"],"件"],["imageRate","画像検査率",[],"pt"],
    ["surgeries","手術件数",["surgeries","clinical.surgeries"],"件"],["trimming","トリミング件数",["trimmings","clinical.trimmings","clinical.trimming"],"件"],["workload","診療負荷",[],"%"],["profitRate","利益率",["profitRate"],"pt"]
  ];
  function aggregate(rows){
    const entries=[...(rows||[])].sort((a,b)=>a.date.localeCompare(b.date)),result={days:entries.length};
    const total=keys=>{const values=entries.map(e=>valueOf(e,keys)).filter(v=>v!==null);return values.length?values.reduce((a,b)=>a+b,0):null};
    result.sales=total(["sales"]);result.patients=total(["patients"]);result.newPatients=total(["newPatients","clinical.newPatients"]);result.revisits=total(["clinical.revisits"]);result.preventive=total(["clinical.preventive"]);result.checkups=total(["checkups","clinical.checkups"]);result.bloodTests=total(["clinical.bloodTests"]);
    const xrays=total(["clinical.xrays"]),ultrasounds=total(["clinical.ultrasounds"]),direct=total(["clinical.imaging"]);result.imaging=direct!==null?direct:(xrays!==null||ultrasounds!==null?(xrays||0)+(ultrasounds||0):null);
    result.surgeries=total(["surgeries","clinical.surgeries"]);result.trimming=total(["trimmings","clinical.trimmings","clinical.trimming"]);
    result.unit=result.sales!==null&&result.patients?result.sales/result.patients:null;result.patientsPerDay=result.patients!==null&&result.days?result.patients/result.days:null;
    [["newRate","newPatients"],["revisitRate","revisits"],["preventiveRate","preventive"],["checkupRate","checkups"],["bloodRate","bloodTests"],["imageRate","imaging"]].forEach(([rate,key])=>result[rate]=result[key]!==null&&result.patients?result[key]/result.patients*100:null);
    const profitValues=entries.map(e=>valueOf(e,["profitRate"])).filter(v=>v!==null);result.profitRate=profitValues.length?profitValues.reduce((a,b)=>a+b,0)/profitValues.length:null;
    result.workload=result.patientsPerDay!==null?result.patientsPerDay:null;return result;
  }
  function chooseComparison(month,entries){
    const rowsFor=m=>(entries||[]).filter(e=>String(e.date||"").startsWith(m));
    const year=shift(month,-12),previous=shift(month,-1);if(rowsFor(year).length)return {type:"year",months:[year],text:`${label(month)} vs ${label(year)}`};
    if(rowsFor(previous).length)return {type:"previous",months:[previous],text:`前年データなし：${label(previous)}と比較`};
    const months=[shift(month,-1),shift(month,-2),shift(month,-3)].filter(m=>rowsFor(m).length);return months.length?{type:"average",months,text:`前年・前月データなし：直近${months.length}か月平均と比較`}:null;
  }
  const averageMetrics=sets=>{const result={};definitions.concat([["sales"] , ["days"]]).forEach(def=>{const key=def[0],values=sets.map(s=>s[key]).filter(v=>v!==null&&v!==undefined);result[key]=values.length?values.reduce((a,b)=>a+b,0)/values.length:null});return result};
  const impactKey=name=>name.startsWith("客単価")?"unit":name.startsWith("患者数")?"patients":"days";
  const man=value=>`約${(Math.abs(value)/10000).toLocaleString("ja-JP",{maximumFractionDigits:1})}万円`;
  const percent=value=>`${Math.abs(value).toLocaleString("ja-JP",{maximumFractionDigits:1})}%`;
  const amountSentence=(impact,current,baseline)=>{
    const key=impactKey(impact.name),delta=current[key]-baseline[key],rate=baseline[key]?delta/baseline[key]*100:null,change=impact.amount<0?"マイナス":"プラス";
    if(key==="unit")return `客単価は${rate===null?"低下":`${percent(rate)}${rate<0?"低下":"上昇"}`}し、推定${man(impact.amount)}の${change}影響がありました。`;
    if(key==="patients")return `患者数は${Math.abs(delta).toLocaleString("ja-JP",{maximumFractionDigits:1})}件${delta<0?"減少":"増加"}し、推定${man(impact.amount)}の${change}影響がありました。`;
    return `営業日数は${Math.abs(delta).toLocaleString("ja-JP",{maximumFractionDigits:1})}日${delta<0?"少なく":"多く"}、推定${man(impact.amount)}の${change}影響がありました。`;
  };
  const metricSentence=(item,baseline)=>{
    const value=Math.abs(item.delta).toLocaleString("ja-JP",{maximumFractionDigits:1}),direction=item.delta>0?"増加":"減少";
    if(item.unit==="pt")return `${item.name}は${value}ポイント${item.delta>0?"上昇":"低下"}しています。`;
    if(item.unit==="%")return `${item.name}は${baseline[item.key]?percent(item.delta/baseline[item.key]*100):value+"%"}${item.delta>0?"上昇":"低下"}しています。`;
    return `${item.name}は${value}${item.unit}${direction}しています。`;
  };
  function managementSummary(month,current,baseline,salesDelta,salesPct,factors,impacts){
    const relevantImpacts=impacts.filter(x=>Math.abs(x.amount)>=1&&Math.sign(x.amount)===Math.sign(salesDelta)).sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount)),main=relevantImpacts[0];
    let conclusion=`${label(month)}の診療報酬は比較期間を${salesDelta>=0?"上回っています":"下回っています"}（${salesPct===null?"変化率算出不可":`${percent(salesPct)}${salesDelta>=0?"増":"減"}`}）。`;
    if(main)conclusion+=`${main.name.replace("変化","")}の影響が最も大きい主因候補と推定されます。`;
    else conclusion+="比較可能な指標から、変化の背景を確認する必要があります。";
    const negativeImpacts=impacts.filter(x=>x.amount< -1).sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount)),used=new Set(negativeImpacts.map(x=>impactKey(x.name)));
    const decreases=[...negativeImpacts.map(x=>amountSentence(x,current,baseline)),...factors.filter(x=>x.delta<0&&!used.has(x.key)).map(x=>metricSentence(x,baseline))].slice(0,3);
    const positiveImpacts=impacts.filter(x=>x.amount>1).sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount)),positiveUsed=new Set(positiveImpacts.map(x=>impactKey(x.name)));
    const supports=[...positiveImpacts.map(x=>amountSentence(x,current,baseline)),...factors.filter(x=>x.delta>0&&!positiveUsed.has(x.key)).map(x=>metricSentence(x,baseline))].slice(0,3);
    let next=[];
    const unitDown=current.unit<baseline.unit,patientsDown=current.patients<baseline.patients,daysDown=current.days<baseline.days,newUp=current.newPatients!==null&&baseline.newPatients!==null&&current.newPatients>baseline.newPatients;
    if(unitDown)next.push("客単価低下の背景として、画像検査・血液検査・健康診断など診療構成の変化を確認してください。");
    if(patientsDown)next.push(newUp?"新患は確保できているため、再診患者の減少がないか確認してください。":"新患・再診のどちらが減少したかを確認してください。");
    if(daysDown&&next.length<2)next.push("営業日数の違いによる影響を分離して評価してください。");
    if(!next.length)next.push("改善した指標が継続するか、患者構成と診療構成を次月も確認してください。");
    return {conclusion,decrease:decreases.join(" ")||"明確な減少方向の指標は確認できません。",increase:(supports.join(" ")||"明確なプラス方向の動きは確認できません。")+(supports.length?" 売上を支えた可能性のある動きですが、直接的な因果関係は断定できません。":""),next:next.slice(0,2).join(" ")};
  }
  function analyze({month,entries=[]}={}){
    const comparison=chooseComparison(month,entries),currentRows=entries.filter(e=>String(e.date||"").startsWith(month));if(!currentRows.length)return {empty:true,comparison:null,missing:["選択月の保存済み日次データがありません"]};
    if(!comparison)return {empty:false,comparison:null,current:aggregate(currentRows),positive:[],negative:[],missing:["比較できる過去データがありません"]};
    const count=currentRows.length,sets=comparison.months.map(m=>aggregate(entries.filter(e=>String(e.date||"").startsWith(m)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,count))),baseline=averageMetrics(sets),current=aggregate(currentRows),factors=[],missing=[];
    definitions.forEach(([key,name,,unit])=>{const a=current[key],b=baseline[key];if(a===null||b===null){missing.push(`${name}は比較元または選択月のデータがないため比較できません`);return}const delta=a-b;if(Math.abs(delta)<1e-9)return;const relative=b?Math.abs(delta/b*100):Math.abs(delta)*10;factors.push({key,name,delta,unit,strength:relative>=15?"強":relative>=5?"中":"弱",score:relative})});
    factors.sort((a,b)=>b.score-a.score);const salesDelta=current.sales!==null&&baseline.sales!==null?current.sales-baseline.sales:null,salesPct=salesDelta!==null&&baseline.sales?salesDelta/baseline.sales*100:null;
    const impacts=[];if(current.unit!==null&&baseline.unit!==null&&current.patients!==null)impacts.push({name:"客単価変化",amount:(current.unit-baseline.unit)*current.patients});if(current.patients!==null&&baseline.patients!==null&&baseline.unit!==null)impacts.push({name:"患者数変化",amount:(current.patients-baseline.patients)*baseline.unit});if(current.days&&baseline.days&&baseline.patientsPerDay!==null&&baseline.unit!==null)impacts.push({name:"営業日数変化",amount:(current.days-baseline.days)*baseline.patientsPerDay*baseline.unit});
    const positive=factors.filter(x=>x.delta>0).slice(0,4),negative=factors.filter(x=>x.delta<0).slice(0,4);
    const summary=managementSummary(month,current,baseline,salesDelta,salesPct,factors,impacts);
    const seasonalEvidence=[1,2,3].map(n=>{const same=`${Number(month.slice(0,4))-n}-${month.slice(5)}`,sameValue=aggregate(entries.filter(e=>String(e.date||"").startsWith(same))).patients,neighbors=[shift(same,-1),shift(same,1)].map(m=>aggregate(entries.filter(e=>String(e.date||"").startsWith(m))).patients).filter(v=>v!==null);return sameValue!==null&&neighbors.length===2&&sameValue<neighbors.reduce((a,b)=>a+b,0)/2*.9}).filter(Boolean).length;
    const seasonality=seasonalEvidence>=2?`${Number(month.slice(5))}月は過去にも来院数が前後月より低く、季節要因の可能性が示唆されます。`:null;
    return {empty:false,comparison,current,baseline,salesDelta,salesPct,positive,negative,impacts,missing,seasonality,summary};
  }
  return {aggregate,chooseComparison,analyze};
});
