(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.ClinicalEfficiency=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

  function patientScore(patients){
    const count=Math.max(0,Number(patients)||0);
    if(count<=9)return Math.round(count/9*50);
    if(count<=12)return Math.round(60+(count-10)*7.5);
    if(count<=14)return 80+(count-13)*10;
    if(count<=17)return 100;
    if(count<=19)return 90;
    if(count<=21)return 75;
    return 60;
  }

  function evaluate({patients=0,sales=0,profitRate=null}={}){
    const count=Math.max(0,Number(patients)||0),dailySales=Math.max(0,Number(sales)||0);
    const unitPrice=count?dailySales/count:0;
    const visits=patientScore(count);
    const salesScore=clamp(dailySales/220000*100,0,100);
    const unitScore=clamp(unitPrice/14000*100,0,100);
    const hasProfit=profitRate!==null&&profitRate!==undefined&&Number.isFinite(Number(profitRate));
    const profitScore=hasProfit?clamp(Number(profitRate)/20*100,0,100):null;
    const weighted=[[visits,35],[salesScore,25],[unitScore,25]];
    if(hasProfit)weighted.push([profitScore,15]);
    const score=Math.round(weighted.reduce((sum,[value,weight])=>sum+value*weight,0)/weighted.reduce((sum,[,weight])=>sum+weight,0));
    const grade=score>=90?"A":score>=80?"B":score>=60?"C":"D";
    let comment;
    if(count>21)comment=`本日は${count}件と高負荷です。売上${dailySales>=200000?"は良好ですが、":"だけを追わず、"}診療品質を維持するため予約数の上積みより、必要な検査・説明時間の確保を優先してください。`;
    else if(count>=15&&count<=17&&dailySales>=200000&&unitPrice>=13000)comment=`本日は${count}件で日商${(dailySales/10000).toFixed(1)}万円を確保しており、理想的な診療効率です。必要な検査・説明時間を確保し、無理に来院数を増やす必要はありません。`;
    else if(count<=12&&dailySales<200000)comment=`診療負荷は低いですが、日商が目標未達です。件数だけを増やすのではなく、健診・再診フォロー・当日枠の案内を検討してください。`;
    else if(count>=20)comment=`売上とのバランスにかかわらず、${count}件は院長負荷が高い状態です。予約数の上積みより診療密度と説明時間を優先してください。`;
    else if(unitPrice>=13000&&dailySales>=200000)comment=`適正な件数で目標日商を確保し、診療密度の高い運営ができています。無理に件数を増やす必要はありません。`;
    else comment="来院件数だけで判断せず、日商・客単価・利益率を合わせて診療密度を整えましょう。";
    return {score,grade,comment,patientsScore:visits,salesScore:Math.round(salesScore),unitScore:Math.round(unitScore),profitScore:profitScore===null?null:Math.round(profitScore),unitPrice,highLoad:count>20};
  }
  return {evaluate,patientScore};
});
