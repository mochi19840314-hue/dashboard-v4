(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.DateRanges=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const validMonth=value=>/^\d{4}-(0[1-9]|1[0-2])$/.test(String(value||""));
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||""))&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`));

  function normalizeDate(value){
    if(value instanceof Date&&!Number.isNaN(value.getTime()))return value.toISOString().slice(0,10);
    if(typeof value==="number"&&Number.isFinite(value)){
      const date=new Date(Math.abs(value)<1e12?value*1000:value);
      return Number.isNaN(date.getTime())?null:date.toISOString().slice(0,10);
    }
    const text=String(value??"").trim();if(!text)return null;
    const calendar=text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|[T\s])/);
    if(calendar){const normalized=`${calendar[1]}-${calendar[2].padStart(2,"0")}-${calendar[3].padStart(2,"0")}`;return validDate(normalized)?normalized:null}
    const timestamp=Date.parse(text);return Number.isNaN(timestamp)?null:new Date(timestamp).toISOString().slice(0,10);
  }
  function normalizeEntryDate(entry){return entry&&typeof entry==="object"?normalizeDate(entry.date??entry.day??entry.createdAt):null}
  function normalizedEntriesForCalendarMonth(entries,month){
    const {from,monthEnd}=calendarMonthRange(month);
    return (Array.isArray(entries)?entries:[]).map(entry=>{const date=normalizeEntryDate(entry);return date?{...entry,date}:null}).filter(entry=>entry&&entry.date>=from&&entry.date<=monthEnd).sort((a,b)=>a.date.localeCompare(b.date));
  }

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

  return {calendarMonthRange,entriesForCalendarMonth,normalizedEntriesForCalendarMonth,normalizeEntryDate,validDate,validMonth};
});
