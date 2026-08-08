"use strict";
const assert=require("node:assert/strict");
const {evaluate,patientScore}=require("./clinical-efficiency");

assert.equal(patientScore(9),50);
assert.equal(patientScore(12),75);
assert.equal(patientScore(14),90);
assert.equal(patientScore(16),100);
assert.equal(patientScore(19),90);
assert.equal(patientScore(21),75);
assert.equal(patientScore(23),60);

const ideal=evaluate({patients:16,sales:224000,profitRate:20});
assert.equal(ideal.grade,"A");
assert.equal(ideal.score,100);
assert.match(ideal.comment,/無理に来院数を増やす必要はありません/);

const overloaded=evaluate({patients:23,sales:218500,profitRate:20});
assert.ok(["B","C"].includes(overloaded.grade));
assert.equal(overloaded.highLoad,true);
assert.match(overloaded.comment,/必要な検査・説明時間/);

const tooQuiet=evaluate({patients:10,sales:140000,profitRate:20});
assert.equal(tooQuiet.grade,"C");
assert.match(tooQuiet.comment,/日商が目標未達/);

console.log("clinical efficiency scoring tests passed");
