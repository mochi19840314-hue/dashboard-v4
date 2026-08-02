"use strict";
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.DailyShadowBrief=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
const EMPTY="先生、データが増えるほど影武者は賢くなります。今日は入力を積み重ねましょう。";
const WEEKDAYS=["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"];
const number=value=>{const parsed=Number(value);return Number.isFinite(parsed)?Math.max(0,parsed):0};
const date=value=>{const [y,m,d]=String(value).split("-").map(Number);return new Date(y,m-1,d,12)};
const iso=value=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`;
const mean=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
const yen=value=>`${Math.round(number(value)).toLocaleString("ja-JP")}円`;
const compactYen=value=>number(value)>=10000?`${(number(value)/10000).toLocaleString("ja-JP",{maximumFractionDigits:1})}万円`:yen(value);
const change=(current,previous)=>previous>0?(current/previous-1)*100:null;
const isBusinessDay=(day,clinic={})=>day.getDay()!==1&&!(Array.isArray(clinic.closedDates)&&clinic.closedDates.includes(iso(day)));
const isRecorded=entry=>entry&&/^\d{4}-\d{2}-\d{2}$/.test(entry.date)&&(number(entry.sales)>0||number(entry.patients)>0);
const values=entry=>({sales:number(entry.sales),patients:number(entry.patients),unitPrice:number(entry.patients)>0?number(entry.sales)/number(entry.patients):null});
const insight=(type,priority,message,level="normal",extra={})=>({type,priority,message,level,...extra});
function previousDayCandidates(context){
 const completed=context.entries.filter(entry=>isRecorded(entry)&&entry.date<context.today&&isBusinessDay(date(entry.date),context.clinic)).sort((a,b)=>b.date.localeCompare(a.date));
 if(completed.length<2)return [];
 const current=values(completed[0]),previous=values(completed[1]),labels={sales:["昨日の日商",v=>yen(v)],patients:["昨日",v=>`${Math.round(v)}件の診療`],unitPrice:["昨日の客単価",v=>yen(v)]};
 return Object.keys(labels).flatMap(metric=>{const delta=change(current[metric],previous[metric]);if(delta==null||Math.abs(delta)<5)return[];const positive=delta>0,large=Math.abs(delta)>=20,word=metric==="patients"?(positive?"多い診療数":"少ない診療数"):(positive?"上昇":"低下");const message=metric==="patients"?`${labels[metric][0]}は${labels[metric][1](current[metric])}でした。前営業日より${Math.abs(Math.round(delta))}%${word}です。`:`${labels[metric][0]}は${labels[metric][1](current[metric])}。前営業日より${Math.abs(Math.round(delta))}%${word}しました。`;return [insight("previousDay",large&&positive?90:Math.abs(delta)>=10?80:72,message,large&&positive?"good":delta<0&&Math.abs(delta)>=10?"warning":"normal",{metric,current:current[metric],changePercent:Number(delta.toFixed(1)),dates:completed.slice(0,2).map(x=>x.date)})]});
}
function weekdayCandidates(context){
 const todayDay=date(context.today).getDay(),cutoff=date(context.today);cutoff.setDate(cutoff.getDate()-56);
 const recent=context.entries.filter(entry=>isRecorded(entry)&&entry.date<context.today&&date(entry.date)>=cutoff&&isBusinessDay(date(entry.date),context.clinic));
 const same=recent.filter(entry=>date(entry.date).getDay()===todayDay).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);if(same.length<3||recent.length<3)return[];
 const sameValues=same.map(values),allValues=recent.map(values),labels={sales:"平均売上",patients:"平均来院件数",unitPrice:"客単価"};
 return Object.keys(labels).flatMap(metric=>{const sample=sameValues.map(x=>x[metric]).filter(x=>x!=null&&x>0),all=allValues.map(x=>x[metric]).filter(x=>x!=null&&x>0);if(sample.length<3||!all.length)return[];const delta=change(mean(sample),mean(all));if(delta==null||Math.abs(delta)<10)return[];return[insight("weekday",60+Math.min(9,Math.floor(Math.abs(delta)/5)),`${WEEKDAYS[todayDay]}は他の営業日より${labels[metric]}が平均${Math.abs(Math.round(delta))}%${delta>0?"高い":"低い"}傾向があります。`,delta>0&&delta>=20?"good":delta<0?"warning":"normal",{metric,sampleSize:sample.length,changePercent:Number(delta.toFixed(1))})]});
}
function remainingBusinessDays(today,clinic){const start=date(today),last=new Date(start.getFullYear(),start.getMonth()+1,0,12);let count=0;for(const cursor=new Date(start);cursor<=last;cursor.setDate(cursor.getDate()+1))if(isBusinessDay(cursor,clinic))count++;return count}
function monthlyCandidate(context){const target=number(context.monthlyTarget);if(!target)return null;const month=context.today.slice(0,7),sales=context.entries.filter(entry=>entry.date?.startsWith(month)&&entry.date<=context.today).reduce((sum,entry)=>sum+number(entry.sales),0);if(sales>=target)return insight("monthly",50,"今月の売上目標を達成しています。","good",{current:sales,target});const remaining=target-sales,days=Number.isFinite(Number(context.remainingBusinessDays))?Math.max(0,Number(context.remainingBusinessDays)):remainingBusinessDays(context.today,context.clinic);return insight("monthly",50,days?`今月の目標まであと${compactYen(remaining)}。残り${days}営業日で1日平均${compactYen(remaining/days)}が必要です。`:`今月の目標まであと${compactYen(remaining)}です。`,days?"normal":"warning",{current:sales,target,remainingBusinessDays:days,requiredDailySales:days?remaining/days:null})}
function anomalyCandidates(anomalies=[]){return anomalies.filter(item=>item?.level==="danger").map(item=>insight("danger",100,`${item.metric}が通常より${Math.abs(Number(item.changePercent)||0).toFixed(0)}%低下しています。昨日の診療内容を確認しましょう。`,"danger",{metric:item.metric,changePercent:item.changePercent,sampleSize:item.sampleSize}));}
function dedupe(candidates){const seen=new Set();return candidates.sort((a,b)=>b.priority-a.priority).filter(item=>{const key=item.metric||item.type;if(seen.has(key))return false;seen.add(key);return true})}
function buildDailyShadowIntelligence(input={}){try{const today=input.today||iso(new Date()),entries=Array.isArray(input.entries)?input.entries.filter(entry=>entry&&entry.date):[],context={...input,today,entries,clinic:input.clinic||{}};const candidates=[...anomalyCandidates(input.anomalies),...previousDayCandidates(context),...weekdayCandidates(context)];const monthly=monthlyCandidate(context);if(monthly)candidates.push(monthly);const insights=dedupe(candidates).slice(0,3);return insights.length?insights:[insight("fallback",0,EMPTY,"normal")]}catch(error){return[insight("fallback",0,EMPTY,"normal",{error:true})]}}
function generateDailyBrief(input={}){const insights=buildDailyShadowIntelligence(input);return{insights:insights.map(item=>({...item,text:item.message,source:item.type,confidence:item.level==="danger"?"high":"medium"})),empty:insights[0]?.type==="fallback"}}
const action=(category,level,title,message,priority,evidence)=>({category,level,title,message,priority,...(evidence?{evidence}: {})});
function getClinicalAnalysisReadiness(entries=[]){
 try{const fields=["bloodTests","xrays","ultrasounds","revisits","preventive"],sampleDays=(Array.isArray(entries)?entries:[]).filter(entry=>isRecorded(entry)&&entry.clinical&&typeof entry.clinical==="object"&&fields.some(key=>Number.isFinite(Number(entry.clinical[key])))).length;return{sampleDays,ready:sampleDays>=30,referenceOnly:sampleDays>=10&&sampleDays<30}}catch(error){return{sampleDays:0,ready:false,referenceOnly:false}}
}
function reviewAction(context,intelligence){
 const danger=(Array.isArray(context.anomalies)?context.anomalies:[]).find(item=>item?.level==="danger");
 if(danger){const amount=Math.abs(Number(danger.changePercent)||0),current=Number(danger.current);return action("review","danger","昨日の振り返り",`${danger.metric||"経営指標"}が通常より${amount.toFixed(0)}%${Number(danger.changePercent)<0?"低下":"変化"}しています。`,100,{metric:danger.metric,current:Number.isFinite(current)?current:null,baseline:danger.baseline,changePercent:danger.changePercent})}
 const candidates=intelligence.filter(item=>item.type==="previousDay"&&Math.abs(Number(item.changePercent)||0)>=5).sort((a,b)=>Math.abs(Number(b.changePercent))-Math.abs(Number(a.changePercent))||b.priority-a.priority),picked=candidates[0];
 if(!picked)return action("review","normal","昨日の振り返り","比較できる実績を蓄積中です。",10);
 const metricName={sales:"日商",patients:"来院件数",unitPrice:"客単価"}[picked.metric]||picked.metric,current=picked.current,display=picked.metric==="patients"?`${Math.round(current)}件`:compactYen(current),delta=Number(picked.changePercent),level=delta>=10?"good":delta<=-10?"warning":"normal";
 return action("review",level,"昨日の振り返り",`昨日の${metricName}は${display}。前営業日より${Math.abs(Math.round(delta))}%${delta>=0?"高い結果でした":"低下しています"}。`,picked.priority,{metric:picked.metric,current,changePercent:delta,dates:picked.dates});
}
function suggestionAction(context,review,intelligence){
 if(!isBusinessDay(date(context.today),context.clinic))return action("action","normal","今日の提案","今日は休診日です。直近営業日の実績を振り返っておきましょう。",90);
 if(review.level==="danger")return action("action","warning","今日の提案","一日の変動か継続的な変化かを確認するため、今後数日の推移にも注目しましょう。",85);
 if(review.level==="good")return action("action","normal","今日の提案","好調だった日の診療構成をメモしておくと、今後の傾向分析に役立ちます。",75);
 const weekday=intelligence.find(item=>item.type==="weekday");
 if(weekday){const load=weekday.metric==="patients"&&Number(weekday.changePercent)>0?"診療負荷にも注意しましょう。":"来院件数と客単価のバランスを確認しましょう。";return action("action",weekday.level,"今日の提案",`${weekday.message}${load}`,70,{metric:weekday.metric,changePercent:weekday.changePercent,sampleSize:weekday.sampleSize})}
 if(review.level==="warning")return action("action","warning","今日の提案","同じ変化が続くか、来院件数と客単価のバランスを確認しましょう。",70);
 return action("action","normal","今日の提案","今日の診療実績を記録して、傾向を蓄積していきましょう。",20);
}
function goalAction(context,intelligence){
 const monthly=intelligence.find(item=>item.type==="monthly"),target=number(context.monthlyTarget),month=context.today.slice(0,7),current=context.entries.filter(entry=>entry.date?.startsWith(month)&&entry.date<=context.today).reduce((sum,entry)=>sum+number(entry.sales),0);
 if(!target)return action("goal","normal","今月のゴール","月間目標を設定すると、残り営業日の目安を表示できます。",40,{monthlyTarget:0,currentMonthlySales:current});
 if(current>=target)return action("goal","good","今月のゴール",`今月の売上目標${compactYen(target)}を達成しています。残り期間は利益率と診療負荷も確認しましょう。`,60,{monthlyTarget:target,currentMonthlySales:current,remainingTarget:0,remainingBusinessDays:monthly?.remainingBusinessDays??0,requiredDailySales:0});
 const remaining=target-current,days=monthly?.remainingBusinessDays??(Number.isFinite(Number(context.remainingBusinessDays))?Number(context.remainingBusinessDays):remainingBusinessDays(context.today,context.clinic)),required=days>0?remaining/days:null;
 return action("goal",days>0?"normal":"warning","今月のゴール",days>0?`月間目標${compactYen(target)}まであと${compactYen(remaining)}。残り${days}営業日では1日平均${compactYen(required)}が目安です。`:`月間目標${compactYen(target)}まであと${compactYen(remaining)}です。`,60,{monthlyTarget:target,currentMonthlySales:current,remainingTarget:remaining,remainingBusinessDays:days,requiredDailySales:required});
}
function buildDailyShadowActions(input={}){try{const today=input.today||iso(new Date()),entries=Array.isArray(input.entries)?input.entries.filter(entry=>entry&&entry.date):[],context={...input,today,entries,clinic:input.clinic||{}};const intelligence=buildDailyShadowIntelligence(context),review=reviewAction(context,intelligence);return[review,suggestionAction(context,review,intelligence),goalAction(context,intelligence)].slice(0,3)}catch(error){return[action("review","normal","昨日の振り返り","比較できる実績を蓄積中です。",10),action("action","normal","今日の提案","今日の診療実績を記録して、傾向を蓄積していきましょう。",20),action("goal","normal","今月のゴール","月間目標と実績を確認しましょう。",30)]}}
const periodLead=hour=>hour<12?"今日は":hour<18?"午前の実績を見ると":"本日の振り返りです。";
return{EMPTY,buildDailyShadowIntelligence,buildDailyShadowActions,getClinicalAnalysisReadiness,generateDailyBrief,periodLead,isBusinessDay};
});
