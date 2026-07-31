(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.DateRanges=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const validMonth=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(String(value||""));
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||""))&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`));

  function calendarMonthRange(month,today){
    if(!validMonth(month))throw new TypeError("valid month is required");
    const [year,monthNumber]=month.split("-").map(Number);
    const from=`${month}-01`,lastDay=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
    const monthEnd=`${month}-${String(lastDay).padStart(2,"0")}`;
    const to=validDate(today)&&today.startsWith(`${month}-`)&&today<monthEnd?today:monthEnd;
    return {from,to,monthEnd};
  }

  function entriesForCalendarMonth(entries,month){
    const {from,monthEnd}=calendarMonthRange(month);
    return (Array.isArray(entries)?entries:[]).filter(entry=>entry&&validDate(entry.date)&&entry.date>=from&&entry.date<=monthEnd);
  }

  return {calendarMonthRange,entriesForCalendarMonth,validDate,validMonth};
});
