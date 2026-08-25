"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8"),sw=fs.readFileSync("sw.js","utf8");
for(const metric of ["preventive","checkups","imaging","bloodTests","surgeries","trimming","secondOpinions"]){assert.match(html,new RegExp(`data-modal-clinical-output="${metric}"`));assert.match(html,new RegExp(`data-modal-clinical-step="1" data-metric="${metric}"`))}
for(const id of ["clinicalBloodTests","clinicalXrays","clinicalUltrasounds","clinicalPreventive"])assert.doesNotMatch(html,new RegExp(`id="${id}"`));
assert.match(app,/TodayClinicalCounts\.update/);assert.match(sw,/v9506-remove-legacy-entry-dom/);assert.match(sw,/app\.js\?v=9506/);assert.match(html,/app\.js\?v=9506/);
console.log("unified clinical stepper UI and PWA cache tests passed");
