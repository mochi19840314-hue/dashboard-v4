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
  function analyze({month,entries=[]}={}){
    const comparison=chooseComparison(month,entries),currentRows=entries.filter(e=>String(e.date||"").startsWith(month));if(!currentRows.length)return {empty:true,comparison:null,missing:["選択月の保存済み日次データがありません"]};
    if(!comparison)return {empty:false,comparison:null,current:aggregate(currentRows),positive:[],negative:[],missing:["比較できる過去データがありません"]};
    const count=currentRows.length,sets=comparison.months.map(m=>aggregate(entries.filter(e=>String(e.date||"").startsWith(m)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,count))),baseline=averageMetrics(sets),current=aggregate(currentRows),factors=[],missing=[];
    definitions.forEach(([key,name,,unit])=>{const a=current[key],b=baseline[key];if(a===null||b===null){missing.push(`${name}は比較元または選択月のデータがないため比較できません`);return}const delta=a-b;if(Math.abs(delta)<1e-9)return;const relative=b?Math.abs(delta/b*100):Math.abs(delta)*10;factors.push({key,name,delta,unit,strength:relative>=15?"強":relative>=5?"中":"弱",score:relative})});
    factors.sort((a,b)=>b.score-a.score);const salesDelta=current.sales!==null&&baseline.sales!==null?current.sales-baseline.sales:null,salesPct=salesDelta!==null&&baseline.sales?salesDelta/baseline.sales*100:null;
    const impacts=[];if(current.unit!==null&&baseline.unit!==null&&current.patients!==null)impacts.push({name:"客単価変化",amount:(current.unit-baseline.unit)*current.patients});if(current.patients!==null&&baseline.patients!==null&&baseline.unit!==null)impacts.push({name:"患者数変化",amount:(current.patients-baseline.patients)*baseline.unit});if(current.days&&baseline.days&&baseline.patientsPerDay!==null&&baseline.unit!==null)impacts.push({name:"営業日数変化",amount:(current.days-baseline.days)*baseline.patientsPerDay*baseline.unit});
    const positive=factors.filter(x=>x.delta>0).slice(0,4),negative=factors.filter(x=>x.delta<0).slice(0,4),main=[...factors].sort((a,b)=>b.score-a.score)[0];
    const direction=salesDelta>=0?"上回っています":"下回っています",judgment=Math.abs(salesPct||0)<5?"大きな問題は確認されず、通常の変動範囲と考えられます。現在の診療構成を維持してください。":main?`${main.name}の変化が相対的に大きい月と考えられます。診療項目と売上の関係は傾向であり、因果関係を示すものではありません。`:"現時点では変動を説明する十分な指標がありません。";
    const seasonalEvidence=[1,2,3].map(n=>{const same=`${Number(month.slice(0,4))-n}-${month.slice(5)}`,sameValue=aggregate(entries.filter(e=>String(e.date||"").startsWith(same))).patients,neighbors=[shift(same,-1),shift(same,1)].map(m=>aggregate(entries.filter(e=>String(e.date||"").startsWith(m))).patients).filter(v=>v!==null);return sameValue!==null&&neighbors.length===2&&sameValue<neighbors.reduce((a,b)=>a+b,0)/2*.9}).filter(Boolean).length;
    const seasonality=seasonalEvidence>=2?`${Number(month.slice(5))}月は過去にも来院数が前後月より低く、季節要因の可能性が示唆されます。`:null;
    return {empty:false,comparison,current,baseline,salesDelta,salesPct,positive,negative,impacts,missing,seasonality,summary:{conclusion:`${label(month)}の診療報酬は比較期間を${direction}。`,increase:positive.length?`${positive[0].name}が売上を下支えする方向に動いています。`:"明確な増加方向の指標は確認できません。",decrease:negative.length?`${negative[0].name}が売上を押し下げる方向に動いています。`:"明確な減少方向の指標は確認できません。",judgment,next:main?.key==="patients"||main?.key==="patientsPerDay"?"来月は患者数が通常水準へ戻るかを優先して確認してください。":"来月も現在の診療構成と患者動向を確認してください。"}};
  }
  return {aggregate,chooseComparison,analyze};
});
