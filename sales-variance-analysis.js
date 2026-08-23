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
  function managementSummary(month,current,baseline,impacts){
    const compared=key=>current[key]!==null&&baseline[key]!==null,direction=key=>!compared(key)?0:Math.sign(current[key]-baseline[key]);
    const patients=direction("patients"),unit=direction("unit"),newPatients=direction("newPatients"),revisits=direction("revisits"),days=direction("days");
    const clinicalDown=[["imaging","画像検査"],["bloodTests","血液検査"],["checkups","健康診断"],["preventive","予防"],["surgeries","手術"]].filter(([key])=>direction(key)<0).map(([,name])=>name);
    const unitImpact=Math.abs(impacts.find(item=>impactKey(item.name)==="unit")?.amount||0),patientImpact=Math.abs(impacts.find(item=>impactKey(item.name)==="patients")?.amount||0);
    let judgment;
    if(patients<0&&unit<0&&unitImpact>=patientImpact)judgment=`${label(month)}は患者数の減少以上に、客単価低下への対応が重要です。`;
    else if(patients>=0&&unit<0)judgment="患者数は維持できているため、集患よりも診療内容や診療構成の変化を優先して確認する必要があります。";
    else if(patients<0&&unit>=0)judgment="診療単価よりも、来院数と継続診療の動きを優先して確認する必要があります。";
    else if(patients>0&&unit>0)judgment="来院数と診療単価の両面が良い方向に動いています。現在の診療パターンを維持し、再現性を確認する月と考えます。";
    else if(unit<0)judgment="今月は集患だけでなく、客単価と診療構成の変化を優先して確認する必要があります。";
    else if(patients<0)judgment="今月は診療単価よりも、来院数と継続診療の動きを優先して確認する必要があります。";
    else judgment="大きな方向転換を急がず、患者構成と診療構成の動きに再現性があるかを確認する月と考えます。";
    if(newPatients>0&&(patients<0||revisits<0))judgment+=" 一方、新患は確保できているため、集患全体の弱さよりも再診患者の動きと継続診療への移行を確認してください。";
    const points=[];
    if(unit<0&&clinicalDown.length>=2)points.push(`${clinicalDown.slice(0,3).join("・")}など複数の診療項目の変化が、客単価低下と同時に起きていないか確認する価値があります。`);
    else if(unit<0)points.push("客単価低下の背景として、画像検査・血液検査・健康診断など診療構成の変化を確認する価値があります。");
    if(newPatients>0&&(patients<0||revisits<0))points.push("新患獲得後の再来院状況を追い、継続診療への移行に変化がないか確認する価値があります。");
    else if(patients<0)points.push("患者構成を新患と再診に分け、再診患者の来院間隔に変化がないか確認する価値があります。");
    else if(patients>0&&unit>0)points.push("良い動きが特定の症例や一時的な需要に偏っていないか、診療内訳を確認する価値があります。");
    if(days<0&&points.length<2)points.push("営業日数の違いを分けて見ることで、患者の来院傾向そのものが変化したか確認できます。");
    if(!points.length)points.push("患者構成と診療構成を比較し、現在の傾向が一時的なものか確認する価値があります。");
    const priorities=[],add=item=>{if(!priorities.includes(item)&&priorities.length<3)priorities.push(item)};
    if(newPatients>0&&(patients<0||revisits<0))add("再診患者数の推移を確認");else if(patients<0)add("新患・再診別の来院数と再診率を確認");
    if(unit<0)add("必要症例への検査・健診提案状況を確認");
    if(newPatients>0)add("新患が継続診療につながっているか確認");
    if(patients>0&&unit>0)add("好調日の患者構成と診療内容を確認");
    if(days<0)add("営業日数の影響を除いた来院傾向を確認");
    add("患者構成と診療構成の推移を確認");
    return {judgment,points:points.slice(0,2),priorities};
  }
  function analyze({month,entries=[]}={}){
    const comparison=chooseComparison(month,entries),currentRows=entries.filter(e=>String(e.date||"").startsWith(month));if(!currentRows.length)return {empty:true,comparison:null,missing:["選択月の保存済み日次データがありません"]};
    if(!comparison)return {empty:false,comparison:null,current:aggregate(currentRows),positive:[],negative:[],missing:["比較できる過去データがありません"]};
    const count=currentRows.length,sets=comparison.months.map(m=>aggregate(entries.filter(e=>String(e.date||"").startsWith(m)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,count))),baseline=averageMetrics(sets),current=aggregate(currentRows),factors=[],missing=[];
    definitions.forEach(([key,name,,unit])=>{const a=current[key],b=baseline[key];if(a===null||b===null){missing.push(`${name}は比較元または選択月のデータがないため比較できません`);return}const delta=a-b;if(Math.abs(delta)<1e-9)return;const relative=b?Math.abs(delta/b*100):Math.abs(delta)*10;factors.push({key,name,delta,unit,strength:relative>=15?"強":relative>=5?"中":"弱",score:relative})});
    factors.sort((a,b)=>b.score-a.score);const salesDelta=current.sales!==null&&baseline.sales!==null?current.sales-baseline.sales:null,salesPct=salesDelta!==null&&baseline.sales?salesDelta/baseline.sales*100:null;
    const impacts=[];if(current.unit!==null&&baseline.unit!==null&&current.patients!==null)impacts.push({name:"客単価変化",amount:(current.unit-baseline.unit)*current.patients});if(current.patients!==null&&baseline.patients!==null&&baseline.unit!==null)impacts.push({name:"患者数変化",amount:(current.patients-baseline.patients)*baseline.unit});if(current.days&&baseline.days&&baseline.patientsPerDay!==null&&baseline.unit!==null)impacts.push({name:"営業日数変化",amount:(current.days-baseline.days)*baseline.patientsPerDay*baseline.unit});
    const positive=factors.filter(x=>x.delta>0).slice(0,4),negative=factors.filter(x=>x.delta<0).slice(0,4);
    const summary=managementSummary(month,current,baseline,impacts);
    const seasonalEvidence=[1,2,3].map(n=>{const same=`${Number(month.slice(0,4))-n}-${month.slice(5)}`,sameValue=aggregate(entries.filter(e=>String(e.date||"").startsWith(same))).patients,neighbors=[shift(same,-1),shift(same,1)].map(m=>aggregate(entries.filter(e=>String(e.date||"").startsWith(m))).patients).filter(v=>v!==null);return sameValue!==null&&neighbors.length===2&&sameValue<neighbors.reduce((a,b)=>a+b,0)/2*.9}).filter(Boolean).length;
    const seasonality=seasonalEvidence>=2?`${Number(month.slice(5))}月は過去にも来院数が前後月より低く、季節要因の可能性が示唆されます。`:null;
    return {empty:false,comparison,current,baseline,salesDelta,salesPct,positive,negative,impacts,missing,seasonality,summary};
  }
  return {aggregate,chooseComparison,analyze};
});
