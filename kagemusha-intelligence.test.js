"use strict";
const assert=require("assert"),K=require("./kagemusha-intelligence.js");
const rows=[];for(let i=1;i<=28;i++)rows.push({date:`2026-07-${String(i).padStart(2,"0")}`,patients:15,sales:225000,bloodTests:3,imaging:2,checkups:1,surgeries:i%7===0?1:0,trimming:1});
let r=K.analyze({entries:[...rows,{date:"2026-08-27",patients:23,sales:230000,bloodTests:3,imaging:2}],today:"2026-08-27",workload:92});assert.equal(r.primary.key,"workload");assert.match(r.action,/負荷/);
r=K.analyze({entries:[...rows,{date:"2026-08-27",patients:15,sales:150000,bloodTests:3,imaging:2}],today:"2026-08-27"});assert.equal(r.primary.key,"unitPrice");assert.match(r.action,/検査・健診/);
r=K.analyze({entries:[...rows,{date:"2026-08-27",patients:15,sales:225000,bloodTests:3,imaging:2,checkups:1,trimming:1}],today:"2026-08-27"});assert.equal(r.ready,true);assert.equal(r.primary,null);assert.match(r.reason,/直近10営業日/);
r=K.analyze({entries:[{date:"2026-08-20",patients:10,sales:100000},{date:"2026-08-27",patients:10,sales:100000}],today:"2026-08-27"});assert.equal(r.ready,false);
const mixed=[{date:"2026-08-14",patients:10,sales:100000},{date:"2026-08-15",patients:20,sales:300000},{date:"2026-08-16",patients:10,sales:100000},{date:"2026-08-17",patients:20,sales:300000},{date:"2026-08-18",patients:10,sales:100000},{date:"2026-08-19",patients:20,sales:300000},{date:"2026-08-20",patients:10,sales:100000},{date:"2026-08-21",patients:20,sales:300000},{date:"2026-08-22",patients:10,sales:100000},{date:"2026-08-23",patients:20,sales:300000}];const c=K.context(mixed,"2026-08-27");assert.equal(c.label,"直近営業日平均");assert.equal(c.sampleSize,10);assert.equal(c.sales,200000);
console.log("kagemusha-intelligence: 5 scenarios passed");
