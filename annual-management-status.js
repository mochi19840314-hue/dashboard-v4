(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.AnnualManagementStatus=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const LABELS={good:"○ 順調",attention:"△ 注意",action:"● 要確認",insufficient:"— データ不足"};
  const ANNUAL_PACE_THRESHOLDS=Object.freeze({good:95,attention:85});
  const number=value=>Number.isFinite(Number(value))?Number(value):0;
  const statusForRate=(rate,good=100,attention=85)=>rate>=good?"good":rate>=attention?"attention":"action";

  function build(input={}){
    const sales=number(input.annualSales),expense=number(input.annualExpense),activeMonths=Math.max(0,number(input.activeMonths));
    const annualTarget=number(input.annualTarget),hasAnnualData=Boolean(input.hasAnnualData)&&activeMonths>0&&sales>0;
    const todayStatus=input.todayHasData?statusForRate(number(input.todaySales)/Math.max(1,number(input.todayTarget))*100,90,70):"insufficient";
    const monthStatus=input.monthHasData?statusForRate(number(input.monthForecast)/Math.max(1,number(input.monthTarget))*100):"insufficient";
    const progress=hasAnnualData&&annualTarget>0?sales/annualTarget*100:null;
    const timeProgressRate=number(input.timeProgressRate)>0?number(input.timeProgressRate):null;
    const annualPaceRatio=progress!==null&&timeProgressRate!==null?progress/timeProgressRate*100:null;
    const annualStatus=annualPaceRatio===null?"insufficient":statusForRate(annualPaceRatio,ANNUAL_PACE_THRESHOLDS.good,ANNUAL_PACE_THRESHOLDS.attention);
    const comparableSales=input.currentComparableSales==null?sales:number(input.currentComparableSales);
    const yoy=input.previousComparable===true&&number(input.previousSales)>0?(comparableSales-number(input.previousSales))/number(input.previousSales)*100:null;
    let comment="年間データが不足しているため、長期推移はまだ判定できません。";
    if(annualStatus!=="insufficient"){
      if(annualStatus==="action")comment="年間の目標ペースを下回っています。売上・支出・必要日商を確認してください。";
      else if(annualStatus==="good"&&todayStatus==="action"&&monthStatus==="good")comment="今日は低調ですが、月間・年間では順調な推移です。";
      else if(annualStatus==="good"&&(monthStatus==="action"||monthStatus==="attention"))comment="今月は弱めですが、年間では概ね順調なペースです。";
      else if(annualStatus==="attention"&&(monthStatus==="action"||monthStatus==="attention"))comment="今月は弱めで、年間も目標ペースをやや下回っています。";
      else if(annualStatus==="good"&&todayStatus==="good"&&monthStatus==="good")comment="短期・年間ともに順調な推移です。";
      else if(annualStatus==="attention")comment="年間は目標ペースをやや下回っています。";
      else comment="年間では概ね順調なペースです。";
    }
    return {sales,profit:sales-expense,progress,timeProgressRate,annualPaceRatio,yoy,status:{today:todayStatus,month:monthStatus,annual:annualStatus},labels:{today:LABELS[todayStatus],month:LABELS[monthStatus],annual:LABELS[annualStatus]},comment};
  }
  return {build,LABELS,ANNUAL_PACE_THRESHOLDS};
});
