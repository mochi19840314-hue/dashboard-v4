(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.RecentThreeMonthSales=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const shift=(month,offset)=>{const [year,value]=month.split("-").map(Number),date=new Date(Date.UTC(year,value-1+offset,1));return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}`};
 const average=rows=>rows.reduce((total,row)=>total+Number(row.sales),0)/rows.length;
 function calculate(currentMonth,getMonth){
  const periods=Array.from({length:6},(_,index)=>shift(currentMonth,index-6)),rows=periods.map(month=>({month,...getMonth(month)})),recent=rows.slice(3),previous=rows.slice(0,3),complete=group=>group.every(row=>row.hasData&&Number.isFinite(Number(row.sales)));
  const base={recentMonths:recent.map(row=>row.month),previousMonths:previous.map(row=>row.month)};
  if(!complete(recent))return {...base,average:null,change:null,direction:"insufficient"};
  const recentAverage=average(recent);if(!complete(previous))return {...base,average:recentAverage,change:null,direction:"insufficient"};
  const previousAverage=average(previous),change=previousAverage===0?null:(recentAverage-previousAverage)/previousAverage*100,direction=change==null?"insufficient":Math.abs(change)<=2?"flat":change>0?"up":"down";
  return {...base,average:recentAverage,previousAverage,change,direction};
 }
 return {calculate};
});
