(function(root,factory){const api=factory(root.TodayWinningStrategy);if(typeof module==="object"&&module.exports)module.exports=api;root.TodayMission=api})(typeof globalThis!=="undefined"?globalThis:this,function(browserStrategy){
"use strict";
const strategy=browserStrategy||(typeof require==="function"?require("./today-winning-strategy"):null);
// 旧APIを維持する薄い互換層。ミッションも必ず統一された勝ち筋生成結果から返す。
function build(context={}){return strategy.generateTodayStrategy(context)}
return{build};
});
