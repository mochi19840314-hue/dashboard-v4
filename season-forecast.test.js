"use strict";
const assert=require("node:assert/strict"),SeasonForecast=require("./season-forecast");
const rows=[];for(let y=2023;y<=2025;y++)for(let d=1;d<=28;d++)rows.push({date:`${y}-08-${String(d).padStart(2,"0")}`,patients:d>=15?26:10,checkups:d>=15?8:2,weather:{temperature:30,condition:"晴れ"}});
assert.equal(SeasonForecast.build({entries:rows.slice(0,19),today:"2026-08-15"}).forecast.ready,false);
const summer=SeasonForecast.build({entries:rows,today:"2026-08-15",weather:{temperature:31,condition:"晴れ"}});assert.equal(summer.forecast.ready,true);assert.ok(summer.forecast.items.length<=3);assert.ok(summer.forecast.items[0].confidence<=100);
const night=SeasonForecast.updateAtNight({entries:rows,today:"2026-08-15",hour:18,forecastHistory:[]});assert.equal(night.saved,true);assert.equal(night.forecastHistory.length,1);assert.equal(SeasonForecast.updateAtNight({...night,entries:rows,today:"2026-08-15",hour:19}).saved,false);
assert.deepEqual(SeasonForecast.normalizeHistory(null),[]);console.log("season forecast tests passed");
