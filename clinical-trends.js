(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.ClinicalTrends=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const WEEKDAYS=["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"];
  const number=value=>{if(value===""||value==null)return null;const n=Number(value);return Number.isFinite(n)&&n>=0?n:null};
  const mean=values=>{const valid=values.filter(v=>v!==null);return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null};
  const unit=entry=>{const patients=number(entry.patients),sales=number(entry.sales);return patients>0&&sales!==null?sales/patients:null};
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value))&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  const weekdayIndex=date=>new Date(`${date}T00:00:00Z`).getUTCDay();
  const hasClinicalData=entry=>["sales","patients","newPatients","surgeries","checkups","trimmings","secondOpinions"].some(key=>number(entry[key])!==null);
  function rollingBusinessRange(today,days,closedDates){
    const closed=new Set(Array.isArray(closedDates)?closedDates.filter(validDate):[]),cursor=new Date(`${today}T00:00:00Z`);let counted=0,from=today;
    while(counted<days){const date=cursor.toISOString().slice(0,10);if(cursor.getUTCDay()!==1&&!closed.has(date)){counted++;from=date}cursor.setUTCDate(cursor.getUTCDate()-1)}
    return {from,to:today,days};
  }
  const summarize=rows=>({
    days:rows.length,
    averagePatients:mean(rows.map(e=>number(e.patients))),
    averageSales:mean(rows.map(e=>number(e.sales))),
    averageUnitPrice:mean(rows.map(unit))
  });
  const leaders=(rows,key)=>{const usable=rows.filter(row=>row[key]!==null);if(!usable.length)return[];const max=Math.max(...usable.map(row=>row[key]));return usable.filter(row=>Math.abs(row[key]-max)<1e-9).map(row=>row.weekday);};
  function analyzeWeekdayTrends(entries){
    const rows=WEEKDAYS.map((weekday,index)=>({weekday,index,...summarize(entries.filter(e=>weekdayIndex(e.date)===index))}));
    const compared=rows.filter(row=>row.days>0);
    return {rows,busiestWeekdays:leaders(compared,"averagePatients"),highestSalesWeekdays:leaders(compared,"averageSales"),saturdayAfternoonOnly:true,mondayExcluded:true,comparisonDays:compared.reduce((n,row)=>n+row.days,0)};
  }
  function analyzeMonthHalfTrends(entries){
    const first=entries.filter(e=>Number(e.date.slice(8,10))<=15),second=entries.filter(e=>Number(e.date.slice(8,10))>=16);
    return {first:{label:"1〜15日",...summarize(first)},second:{label:"16日〜月末",...summarize(second)},comparisonReady:first.length>=3&&second.length>=3};
  }
  function analyzeVolumeUnitRelationship(entries){
    const usable=entries.filter(e=>number(e.patients)!==null&&number(e.sales)!==null),patientAvg=mean(usable.map(e=>number(e.patients))),salesAvg=mean(usable.map(e=>number(e.sales))),unitAvg=mean(usable.map(unit));
    const decorate=e=>({date:e.date,patients:number(e.patients),sales:number(e.sales),unitPrice:unit(e)});
    if(patientAvg===null||salesAvg===null)return {sampleDays:usable.length,patientAverage:patientAvg,salesAverage:salesAvg,unitPriceAverage:unitAvg,highVolumeHighSales:[],lowVolumeHighUnit:[],highVolumeLowUnit:[]};
    return {sampleDays:usable.length,patientAverage:patientAvg,salesAverage:salesAvg,unitPriceAverage:unitAvg,
      highVolumeHighSales:usable.filter(e=>number(e.patients)>patientAvg&&number(e.sales)>salesAvg).map(decorate),
      lowVolumeHighUnit:unitAvg===null?[]:usable.filter(e=>number(e.patients)<patientAvg&&unit(e)!==null&&unit(e)>unitAvg).map(decorate),
      highVolumeLowUnit:unitAvg===null?[]:usable.filter(e=>number(e.patients)>patientAvg&&unit(e)!==null&&unit(e)<unitAvg).map(decorate)};
  }
  function analyzeNewPatientTrends(entries){
    const usable=entries.filter(e=>number(e.newPatients)!==null),total=usable.reduce((n,e)=>n+number(e.newPatients),0),patients=usable.reduce((n,e)=>n+(number(e.patients)||0),0);
    const weekday=WEEKDAYS.map((name,index)=>({weekday:name,total:usable.filter(e=>weekdayIndex(e.date)===index).reduce((n,e)=>n+number(e.newPatients),0)})).filter(x=>x.weekday!=="月曜日");
    const monthTotals={};usable.forEach(e=>monthTotals[e.date.slice(0,7)]=(monthTotals[e.date.slice(0,7)]||0)+number(e.newPatients));
    const maxDay=weekday.length?Math.max(...weekday.map(x=>x.total)):0,maxMonth=Math.max(0,...Object.values(monthTotals));
    return {available:usable.length>0,sampleDays:usable.length,total,ratio:patients?total/patients:null,weekday,topWeekdays:weekday.filter(x=>x.total===maxDay&&maxDay>0).map(x=>x.weekday),topMonths:Object.keys(monthTotals).filter(m=>monthTotals[m]===maxMonth&&maxMonth>0)};
  }
  const weatherKind=e=>{const w=e.weather;if(!w)return null;const text=String(w.condition||w.dailyCondition||"");const code=number(w.code??w.dailyCode);if(/雨|雷|霧雨/.test(text)||code!==null&&code>=51)return"rain";if(/晴/.test(text)||code===0||code===1)return"sunny";return null;};
  function analyzeWeatherTrends(entries){
    const rain=entries.filter(e=>weatherKind(e)==="rain"),sunny=entries.filter(e=>weatherKind(e)==="sunny");
    return {available:rain.length+sunny.length>0,rain:{...summarize(rain)},sunny:{...summarize(sunny)},comparisonReady:rain.length>=3&&sunny.length>=3};
  }
  function confidenceFor(days,minComparison){if(days<7)return"低";if(days<30)return"暫定";if(minComparison<3)return"暫定";if(days<90||minComparison<7)return"中";return"高";}
  const pctDiff=(a,b)=>b?Math.abs((a/b-1)*100):0;
  function generateKagemushaTrendInsights(result){
    if(result.dataDays<7)return["先生、判断にはもう少しデータが必要です。7営業日分がそろってから、私が傾向を確認します。"];const insights=[],w=result.weekday;
    const busy=w.rows.filter(r=>w.busiestWeekdays.includes(r.weekday));
    if(busy.length&&w.busiestWeekdays.length<=2){const names=w.busiestWeekdays.join("・");insights.push(`先生、${names}は平均来院数が高い傾向です。${names.includes("土曜日")?"午後診療のみのため、診療密度も高めと考えられます。":"予約配置の参考として冷静に見ておきましょう。"}`);}
    const h=result.firstHalfVsSecondHalf;if(h.comparisonReady&&h.first.averageSales!==null&&h.second.averageSales!==null&&pctDiff(h.second.averageSales,h.first.averageSales)>=10)insights.push(`先生、月${h.second.averageSales>h.first.averageSales?"後半":"前半"}の平均売上が約${pctDiff(h.second.averageSales,h.first.averageSales).toFixed(0)}%高い傾向です。私なら予約案内の時期を確認します。`);
    const v=result.volumeVsUnitPrice;if(v.lowVolumeHighUnit.length)insights.push(`先生、来院数が平均未満でも客単価が高い日が${v.lowVolumeHighUnit.length}日あります。診療内容で売上を維持できた可能性があります。`);
    if(insights.length<3&&result.weather.comparisonReady){const r=result.weather.rain.averagePatients,s=result.weather.sunny.averagePatients;if(r!==null&&s!==null&&pctDiff(r,s)>=10)insights.push(`先生、雨の日の平均来院数は晴れの日より約${pctDiff(r,s).toFixed(0)}%${r>s?"多め":"少なめ"}です。天候だけで断定せず、今後も確認します。`);}
    if(!insights.length)insights.push("先生、現時点では大きな偏りは見えていません。私なら結論を急がず、記録を続けて推移を確認します。");return insights.slice(0,3);
  }
  function analyzeClinicalTrends(entries,options={}){
    const periodDays=Math.min(90,Math.max(30,Number(options.periodDays)||90)),today=validDate(options.today)?options.today:new Date().toISOString().slice(0,10);
    const closedDates=Array.isArray(options.closedDates)?options.closedDates:[],closed=new Set(closedDates),window=rollingBusinessRange(today,periodDays,closedDates);
    const source=Array.isArray(entries)?entries:[],clean=source.filter(e=>e&&validDate(e.date)&&hasClinicalData(e)&&e.date>=window.from&&e.date<=today&&weekdayIndex(e.date)!==1&&!closed.has(e.date)).sort((a,b)=>a.date.localeCompare(b.date)),from=clean[0]?.date||window.from;
    const weekday=analyzeWeekdayTrends(clean),firstHalfVsSecondHalf=analyzeMonthHalfTrends(clean),volumeVsUnitPrice=analyzeVolumeUnitRelationship(clean),newPatients=analyzeNewPatientTrends(clean),weather=analyzeWeatherTrends(clean);
    const comparisons=[...weekday.rows.filter(r=>r.days).map(r=>r.days),firstHalfVsSecondHalf.first.days,firstHalfVsSecondHalf.second.days].filter(Boolean),confidence=confidenceFor(clean.length,comparisons.length?Math.min(...comparisons):0);
    const result={dataDays:clean.length,period:{from,to:today,days:periodDays,windowFrom:window.from},confidence,status:clean.length<7?"データ不足":clean.length<30?"暫定傾向":clean.length<90?"通常傾向":"中期傾向",weekday,firstHalfVsSecondHalf,volumeVsUnitPrice,newPatients,weather,insights:[]};result.insights=generateKagemushaTrendInsights(result);return result;
  }
  return {analyzeClinicalTrends,analyzeWeekdayTrends,analyzeMonthHalfTrends,analyzeVolumeUnitRelationship,analyzeNewPatientTrends,analyzeWeatherTrends,generateKagemushaTrendInsights};
});
