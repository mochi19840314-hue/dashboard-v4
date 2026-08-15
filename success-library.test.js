"use strict";
const assert=require("node:assert/strict"),SuccessLibrary=require("./success-library");
const daily=[
 {date:"2026-08-01",key:"checkup:unit",difference:10},{date:"2026-08-02",key:"checkup:unit",difference:20},{date:"2026-08-03",key:"checkup:unit",difference:15},
 {date:"2026-08-01",key:"imaging:unit",difference:12},{date:"2026-08-02",key:"imaging:unit",difference:12},
 {date:"2026-08-04",key:"learning",result:"現在も診療データを学習中です。"}
];
const weekly=[{date:"2026-08-03",insights:[{key:"checkup:unit",difference:15,importance:15}]}];
const result=SuccessLibrary.build({learningHistory:daily,weeklyLearningHistory:weekly});
assert.equal(result.length,1,"3回未満のテーマとデータ不足を保存しない");
assert.equal(result[0].theme,"健康診断");assert.equal(result[0].count,3,"同日・同キーは重複しない");assert.equal(result[0].metrics.unit,15);assert.match(result[0].comment,/確認しています/);assert.doesNotMatch(result[0].comment,/成功します|上がります|増えます/);
assert.equal(SuccessLibrary.learnAtNight({learningHistory:daily,weeklyLearningHistory:weekly,hour:17}).saved,false);
assert.equal(SuccessLibrary.learnAtNight({learningHistory:daily,weeklyLearningHistory:weekly,hour:20}).library.length,1);
assert.deepEqual(SuccessLibrary.normalize([{...result[0],extra:"compatible"}])[0].extra,"compatible");
console.log("success library tests: 10 checks passed");
