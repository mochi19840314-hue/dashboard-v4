(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.DailyAISummary=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const number=value=>{const n=Number(value);return Number.isFinite(n)?n:null},average=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
 const operating=entry=>entry&&String(entry.date||"")&&number(entry.patients)>0;
 const yen=value=>`${Math.round(number(value)||0).toLocaleString("ja-JP")}円`,rate=(part,total)=>total>0?part/total*100:null,weekday=date=>new Date(`${date}T00:00:00Z`).getUTCDay();
 const clinicalValue=(entry,...keys)=>{for(const key of keys){const value=entry?.clinical?.[key]??entry?.[key];if(value!==undefined&&value!==null&&value!=="")return Math.max(0,number(value)||0)}return null};
 function metrics(entry,snapshot){const patients=number(entry.patients)||0,sales=number(entry.sales)||0,newPatients=clinicalValue(entry,"newPatients")??0,revisits=clinicalValue(entry,"repeatPatients","revisits")??Math.max(0,patients-newPatients),preventive=clinicalValue(entry,"preventive","vaccines"),checkups=clinicalValue(entry,"checkups","healthChecks","healthCheck"),blood=clinicalValue(entry,"bloodTests"),parts=[clinicalValue(entry,"imaging"),clinicalValue(entry,"xrays"),clinicalValue(entry,"ultrasounds")],imaging=parts[0]??(parts.slice(1).some(v=>v!==null)?(parts[1]||0)+(parts[2]||0):null);return {sales,patients,unit:sales/patients,newPatients,newRate:rate(newPatients,patients),revisitRate:rate(revisits,patients),preventive,preventiveRate:preventive===null?null:rate(preventive,patients),checkups,checkupRate:checkups===null?null:rate(checkups,patients),blood,bloodRate:blood===null?null:rate(blood,patients),imaging,imagingRate:imaging===null?null:rate(imaging,patients),surgeries:clinicalValue(entry,"surgeries"),trimming:clinicalValue(entry,"trimming","trimmings"),profitRate:Object.prototype.hasOwnProperty.call(entry,"profitRate")&&entry.profitRate!==""?number(entry.profitRate):null,workload:number(snapshot?.doctorWorkload)}}
 function checkupEvidence(entry,past){
  const current=metrics(entry),withRates=past.map(row=>({date:row.date,rate:metrics(row).checkupRate})).filter(row=>row.rate!==null),historical=withRates.slice(-30),historicalAverage=average(historical.map(row=>row.rate)),difference=historicalAverage>0&&current.checkupRate!==null?(current.checkupRate-historicalAverage)/historicalAverage*100:null;
  const previousYearDate=`${Number(String(entry.date).slice(0,4))-1}${String(entry.date).slice(4)}`,previousYear=withRates.find(row=>row.date===previousYearDate),yearOverYear=previousYear?.rate>0&&current.checkupRate!==null?(current.checkupRate-previousYear.rate)/previousYear.rate*100:null;
  const seasonal=withRates.filter(row=>row.date.slice(0,4)<String(entry.date).slice(0,4)&&row.date.slice(5,7)===String(entry.date).slice(5,7)).slice(-12),seasonalAverage=average(seasonal.map(row=>row.rate)),seasonalDifference=seasonalAverage>0&&current.checkupRate!==null?(current.checkupRate-seasonalAverage)/seasonalAverage*100:null,recent=[...withRates.slice(-3).map(row=>row.rate),current.checkupRate].filter(value=>value!==null),sustainedDecline=recent.length>=4&&recent.every((value,index)=>index===0||value<recent[index-1]);
  const corroborated=difference!==null&&difference<=-20&&(yearOverYear<=-15||seasonalDifference<=-20||sustainedDecline);return {rate:current.checkupRate,historicalAverage,difference,yearOverYear,seasonalDifference,sustainedDecline,corroborated};
 }
 const avgMetrics=rows=>{const values=rows.map(row=>metrics(row));return Object.fromEntries(Object.keys(values[0]||{}).map(key=>[key,average(values.map(value=>value[key]).filter(value=>value!==null))]))},comparison=(label,rows)=>rows.length?{label,count:rows.length,metrics:avgMetrics(rows)}:null;
 function efficiencyPattern(deltas,load){
  const {sales,patients,unit}=deltas,high=value=>value!==null&&value>=.12,low=value=>value!==null&&value<=-.12;
  if(high(sales)&&patients!==null&&patients<=-.08&&high(unit)&&!(load>=80))return "high_sales_low_load";
  if(high(sales)&&patients!==null&&patients>=.12&&(load===null||load>=65))return "high_sales_high_load";
  if(low(sales)&&patients!==null&&Math.abs(patients)<.12&&low(unit))return "low_sales_low_unit";
  if(low(sales)&&low(patients))return "low_sales_low_patients";
  return "balanced";
 }
 function build(input={}){
  const today=String(input.date||input.today||""),entries=(Array.isArray(input.entries)?input.entries:[]).filter(operating).sort((a,b)=>String(a.date).localeCompare(String(b.date))),entry=input.entry||entries.find(item=>item.date===today);
  if(!operating(entry))return {status:"入力待ち",evaluation:"評価保留",reasons:["患者数が入力された営業日のデータを待っています。"],judgment:["患者数0件の日は、欠損または休診の可能性があるため評価から除外します。"],actions:["診療日であれば、患者数と売上を入力してください。"]};
  const current=metrics(entry,(input.snapshots||[]).find(item=>item.date===today)),past=entries.filter(item=>item.date<today),recent=past.slice(-10),sameDay=past.filter(item=>weekday(item.date)===weekday(today)).slice(-8),month=past.filter(item=>String(item.date).slice(0,7)===today.slice(0,7)),previousMonthKey=(()=>{const [y,m]=today.split("-").map(Number),d=new Date(Date.UTC(y,m-2,1));return d.toISOString().slice(0,7)})(),previousMonth=past.filter(item=>String(item.date).slice(0,7)===previousMonthKey),bases=[comparison("直近営業日平均",recent),comparison("同曜日平均",sameDay),comparison("当月平均",month),comparison("前月平均",previousMonth)].filter(Boolean),primary=bases[0],enough=recent.length>=3,ratio=key=>primary&&primary.metrics[key]>0?(current[key]-primary.metrics[key])/primary.metrics[key]:null,deltas={sales:ratio("sales"),patients:ratio("patients"),unit:ratio("unit")},load=current.workload,pattern=enough?efficiencyPattern(deltas,load):"insufficient_data";
  let evaluation="通常";if(enough&&deltas.sales>=.12)evaluation="好調";else if(enough&&deltas.sales<=-.12)evaluation=deltas.patients<=-.2?"注意":"やや弱め";
  const percent=value=>`${Math.abs(Math.round(value*100))}%`,reasons=[];
  if(primary&&deltas.sales!==null)reasons.push(`売上${yen(current.sales)}は${primary.label}${yen(primary.metrics.sales)}を約${percent(deltas.sales)}${deltas.sales>=0?"上回りました":"下回りました"}。`);
  if(primary&&deltas.patients!==null&&deltas.unit!==null)reasons.push(`来院数は${current.patients}件（通常${Math.round(primary.metrics.patients)}件）${deltas.patients<0?"を下回る水準":"以上"}で、客単価${yen(current.unit)}は平均${yen(primary.metrics.unit)}${deltas.unit>=0?"を上回りました":"を下回りました"}。`);
  if(!reasons.length)reasons.push(`売上${yen(current.sales)}、来院数${current.patients}件、客単価${yen(current.unit)}を記録しました。`);
  let judgment;
  if(!enough)judgment=[`比較できる過去データは${recent.length}営業日分です。単日の結果を成功パターンとは断定しません。診療効率を継続して学習します。`];
  else if(pattern==="high_sales_low_load")judgment=["患者数を増やして売上を作った日ではなく、少ない来院数でも高い売上を確保できた、診療効率の良い日だった可能性があります。診療項目別の金額がないため、診療内容との因果関係は断定しません。"];
  else if(pattern==="high_sales_high_load")judgment=["高い診療量によって売上を確保した日です。売上は好調ですが負荷も高いため、この体制の再現性には注意が必要です。"];
  else if(pattern==="low_sales_low_unit")judgment=["来院数よりも、診療内容・客単価の低下が売上低下に関連した可能性があります。診療構成と会計記録を確認します。"];
  else if(pattern==="low_sales_low_patients")judgment=["来院数の減少が売上低下の主な候補です。ただし、単日の関連だけで原因とは断定しません。"];
  else judgment=[`${primary.label}${sameDay.length>=3?`と同曜日平均（${sameDay.length}日分）`:""}との組み合わせでは、診療効率に大きな偏りは見られません。単日だけで傾向とは断定しません。`];
  const checkup=checkupEvidence(entry,past);if(checkup.corroborated)judgment.push(`健康診断率${checkup.rate.toFixed(1)}%は過去平均との差に加え、${checkup.sustainedDecline?"継続的な低下":"前年同期または季節性とのずれ"}が確認され、判断材料に含めています。`);else if((current.bloodRate!==null&&current.bloodRate<10)||(current.imagingRate!==null&&current.imagingRate<10))judgment.push("検査率は低めですが、症例構成が不明なため、増やす必要があるとは判断しません。");
  let actions=["今日の診療構成が再現できるか、今後の営業日と比較します。"];if(pattern==="high_sales_high_load")actions=["次の診療日は予約の偏りとスタッフ負荷を確認し、同じ売上を無理なく再現できるか比較します。"];else if(pattern==="low_sales_low_unit")actions=["客単価と診療構成の低下が続くか、次の2〜3営業日を確認します。"];else if(pattern==="low_sales_low_patients")actions=["来院数の減少が次の2〜3営業日も続くか確認します。"];
  const recurring=(input.efficiencyHistory||[]).filter(item=>item?.pattern===pattern).length+1;
  return {status:evaluation,evaluation,reasons:reasons.slice(0,2),judgment:judgment.slice(0,2),actions:actions.slice(0,1),meta:{comparisonDays:recent.length,profitRateUsed:current.profitRate!==null,checkup,efficiency:{pattern,salesDelta:deltas.sales,patientsDelta:deltas.patients,unitPriceDelta:deltas.unit,workload:load,occurrences:recurring,reproducible:pattern!=="balanced"&&pattern!=="insufficient_data"&&recurring>=3}}};
 }
 return {build,metrics,operating};
});
