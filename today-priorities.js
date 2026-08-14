(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TodayPriorities=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const number=value=>Number.isFinite(Number(value))?Number(value):0;
const average=(rows,key)=>rows.length?rows.reduce((sum,row)=>sum+number(row[key]),0)/rows.length:0;
const monthOf=date=>String(date).slice(0,7);
const rate=(part,total)=>total>0?part/total:0;
const validEntries=source=>(Array.isArray(source?.entries)?source.entries:[]).filter(entry=>entry?.date&&number(entry.patients)>0&&number(entry.sales)>0).sort((a,b)=>a.date.localeCompare(b.date));
function monthTotals(rows,month){return rows.filter(row=>monthOf(row.date)===month).reduce((sum,row)=>{for(const key of ["sales","patients","newPatients","surgeries"])sum[key]+=number(row[key]);const clinical=row.clinical||{};sum.tests+=number(clinical.bloodTests)+number(clinical.xrays)+number(clinical.ultrasounds);return sum},{sales:0,patients:0,newPatients:0,surgeries:0,tests:0})}
function previousMonth(month){const[y,m]=month.split("-").map(Number),date=new Date(y,m-2,1);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`}
function priority({key,title,reason,actions,effect,impact,gap,urgency}){const score=impact*.4+gap*.35+urgency*.25,importance=score>=4.2?5:score>=3.25?4:3;return{key,title,reason,actions,effect,impact,gap,urgency,score:Number(score.toFixed(2)),importance}}
function build(source={},options={}){
 const rows=validEntries(source),today=options.today||new Date().toLocaleDateString("sv-SE"),sample=rows.filter(row=>row.date<=today).slice(-60);
 if(sample.length<3)return{ready:false,sampleDays:sample.length,items:[],message:""};
 const currentMonth=monthOf(today),current=monthTotals(sample,currentMonth),previous=monthTotals(sample,previousMonth(currentMonth));
 const recent=sample.slice(-Math.min(10,sample.length)),older=sample.slice(0,-recent.length),baseline=older.length?older:sample;
 const currentUnit=average(recent,"sales")/Math.max(1,average(recent,"patients")),baselineUnit=average(baseline,"sales")/Math.max(1,average(baseline,"patients"));
 const currentPatients=average(recent,"patients"),baselinePatients=average(baseline,"patients"),newRate=rate(current.newPatients,current.patients),previousNewRate=rate(previous.newPatients,previous.patients),surgeryRate=rate(current.surgeries,current.patients),previousSurgeryRate=rate(previous.surgeries,previous.patients),testRate=rate(current.tests,current.patients),previousTestRate=rate(previous.tests,previous.patients);
 const finance=source.financeByMonth?.[currentMonth]||source.finance||{},expense=number(finance.monthlyExpense),medical=number(finance.medicalExpense),profitRate=current.sales>0&&expense>0?(current.sales-expense)/current.sales:null,candidates=[];
 const anomalyMap=Object.fromEntries((options.anomalies||[]).filter(item=>item.level!=="normal").map(item=>[item.metric,item]));
 const severity=metric=>anomalyMap[metric]?.level==="danger"?5:anomalyMap[metric]?.level==="warning"?4:3;
 if(currentUnit<baselineUnit*.95||anomalyMap["客単価"])candidates.push(priority({key:"unit",title:"客単価維持",reason:`直近の客単価は${Math.round(currentUnit).toLocaleString("ja-JP")}円で、比較平均を下回っています。`,actions:["画像検査の適応を確認","血液検査の適応を確認","健康診断を案内"],effect:"売上・利益の増加",impact:5,gap:severity("客単価"),urgency:4}));
 if((previousNewRate>0&&newRate<previousNewRate*.9)||(current.patients>=10&&current.newPatients===0))candidates.push(priority({key:"new",title:"新患フォロー",reason:"今月の新患率が比較期間を下回っています。",actions:["LINEの問い合わせに返信","Google口コミに返信","紹介患者をフォロー"],effect:"来院件数増加",impact:4,gap:4,urgency:4}));
 if(currentPatients<baselinePatients*.9||anomalyMap["来院件数"])candidates.push(priority({key:"patients",title:"来院導線の強化",reason:`直近の平均来院は${currentPatients.toFixed(1)}件で、通常より少ない傾向です。`,actions:["LINEで空き枠を配信","再診予定をフォロー","当日受診枠を案内"],effect:"来院件数増加",impact:5,gap:severity("来院件数"),urgency:5}));
 if(profitRate!==null&&profitRate<20)candidates.push(priority({key:"profit",title:"支出確認",reason:`今月の利益率は${profitRate.toFixed(1)}%です。利益を圧迫する支出の確認が必要です。`,actions:["大きな支出の明細を確認","継続費用を見直す","不要不急の発注を調整"],effect:"利益率改善",impact:5,gap:profitRate<10?5:4,urgency:4}));
 if(current.sales>0&&medical/current.sales>.25)candidates.push(priority({key:"stock",title:"在庫確認",reason:"薬品・医療材料費率が売上の25%を超えています。",actions:["薬品在庫を棚卸し","期限と過剰在庫を確認","発注量を調整"],effect:"キャッシュフロー改善",impact:4,gap:4,urgency:4}));
 if(previousSurgeryRate>0&&surgeryRate<previousSurgeryRate*.8)candidates.push(priority({key:"surgery",title:"外科相談提案",reason:"今月の手術率が比較期間を下回っています。",actions:["外科適応症例を確認","歯科相談を案内","術前検査を提案"],effect:"治療機会と売上の増加",impact:4,gap:4,urgency:3}));
 if(previousTestRate>0&&testRate<previousTestRate*.85)candidates.push(priority({key:"test",title:"検査提案の確認",reason:"今月の検査率が比較期間を下回っています。",actions:["検査適応を朝礼で共有","画像検査の案内を確認","健診対象をフォロー"],effect:"診療品質と客単価の向上",impact:4,gap:4,urgency:3}));
 for(const insight of options.clinicalAnalysis?.insights||[])if(!candidates.some(item=>item.title===insight.title))candidates.push(priority({key:`clinical-${insight.title}`,title:insight.title,reason:insight.message,actions:insight.actions||[],effect:insight.effect||"診療効率向上",impact:Math.max(3,number(insight.importance)),gap:Math.max(3,number(insight.importance)),urgency:3}));
 if(!candidates.length)candidates.push(priority({key:"maintain",title:"診療品質の維持",reason:"主要指標に大きな低下はなく、現在の運営は安定しています。",actions:["予約の偏りを確認","案内漏れを確認","スタッフ負荷を確認"],effect:"安定した診療運営",impact:3,gap:3,urgency:3}));
 const items=candidates.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,"ja")).slice(0,3),top=items[0];
 const messages={unit:"今日は客単価改善が最も利益につながります。",new:"新患フォローを優先しましょう。",profit:"支出の内訳確認を優先してください。",patients:"来院につながる発信を優先しましょう。",stock:"在庫と発注の確認を優先しましょう。"};
 return{ready:true,sampleDays:sample.length,items,message:messages[top.key]||`${top.title}を最初に進めましょう。`};
}
return{build};
});
