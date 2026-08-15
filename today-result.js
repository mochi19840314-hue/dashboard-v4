(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TodayResult=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const n=value=>Math.max(0,Number(value)||0),pct=value=>`${value>=0?"＋":""}${Math.round(value)}%`;
function build({hour=0,entry,history=[],target=0,anomalies=[],prediction}={}){
 const patients=n(entry?.patients),sales=n(entry?.sales),clinical=entry?.clinical||{};
 if(!entry||!patients||!sales)return{visible:false,ready:false,reason:"today-data"};
 if(Number(hour)<18)return{visible:false,ready:true,reason:"morning"};
 const previous=(Array.isArray(history)?history:[]).filter(row=>row&&row.date<entry.date&&n(row.patients)&&n(row.sales)).slice(-5),unit=sales/patients,baseUnit=previous.length?previous.reduce((sum,row)=>sum+n(row.sales)/n(row.patients),0)/previous.length:0,items=[];
 const expectedSales=n(prediction?.expectedSales),actualAdditionalSales=Math.max(0,sales-(baseUnit*patients)),accuracy=expectedSales?actualAdditionalSales/expectedSales*100:null;
 if(expectedSales)items.push({label:"AI予測",value:`約${Math.round(expectedSales).toLocaleString("ja-JP")}円`},{label:"実績",value:`約${Math.round(actualAdditionalSales).toLocaleString("ja-JP")}円`},{label:"AI精度",value:`${Math.round(accuracy)}%`});
 if(baseUnit)items.push({label:"客単価",value:pct((unit-baseUnit)/baseUnit*100)});
 const images=n(clinical.xrays)+n(clinical.ultrasounds);if(images)items.push({label:"画像検査",value:`${images}件`});
 if(n(target))items.push({label:"売上",value:`目標比${Math.round(sales/n(target)*100)}%`});
 if(items.length<3&&n(entry.checkups))items.push({label:"健診",value:`${n(entry.checkups)}件`});
 if(items.length<3&&n(entry.surgeries))items.push({label:"手術",value:`${n(entry.surgeries)}件`});
 const anomaly=anomalies.find(item=>item.level&&item.level!=="normal"),improved=baseUnit&&unit>baseUnit,baseCheckupRate=previous.length?previous.reduce((sum,row)=>sum+n(row.checkups)/n(row.patients),0)/previous.length:0,checkupImproved=n(entry.checkups)/patients>baseCheckupRate;
 const comment=accuracy!==null?(accuracy>=100?"AI予測を上回りました。":prediction?.next?`${prediction.next.theme}提案の方が有効でした。`:"AI予測との差を翌日の順位へ反映します。"):anomaly?`${anomaly.metric}に注意が必要です。明日は原因確認を優先しましょう。`:checkupImproved?"今日は健診率が改善しました。明日は画像検査を意識しましょう。":improved?"客単価が改善しました。明日は新患フォローが優先です。":"今日の実績を確認しました。明日は案内漏れを意識しましょう。";
 const learningUpdate=prediction?.ready&&expectedSales?{date:entry.date,key:prediction.missions?.[0]?.key,predictedSales:expectedSales,actualSales:actualAdditionalSales,accuracy,successRateDelta:accuracy>=100?2:-2}:null;
 return{visible:true,ready:true,items:items.slice(0,3),comment,accuracy,actualAdditionalSales,learningUpdate};
}
return{build};
});
