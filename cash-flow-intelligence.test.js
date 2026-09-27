const {test}=require("node:test");const assert=require("node:assert/strict");const {calculate,TARGET}=require("./cash-flow-intelligence.js");
test("missing balances are not zero",()=>{const x=calculate({});assert.equal(x.actual,null);assert.equal(x.gap,null);assert.equal(x.progress,null)});
test("actual bank movement and goal",()=>{const x=calculate({opening:3000000,closing:3200000});assert.equal(x.actual,200000);assert.equal(x.gap,6800000);assert.equal(x.progress,32)});
test("negative movement is preserved",()=>assert.equal(calculate({opening:4000000,closing:3000000}).actual,-1000000));
test("invalid inputs are missing",()=>assert.equal(calculate({opening:-1,closing:""}).actual,null));
test("target is capped at 100 percent",()=>{assert.equal(TARGET,10000000);assert.equal(calculate({closing:11000000}).progress,100)});

test("reconciliation keeps signed difference",()=>{const x=calculate({opening:3000000,closing:3200000,estimate:250000});assert.equal(x.difference,-50000)});
test("zero estimate is valid but absent estimate is not",()=>{assert.equal(calculate({opening:0,closing:100,estimate:0}).difference,100);assert.equal(calculate({opening:0,closing:100}).difference,null)});

test("advice requests missing balances without guessing",()=>{const {advise}=require("./cash-flow-intelligence.js");assert.match(advise({}),/月初と月末/)});
test("advice flags unreconciled difference",()=>{const {advise}=require("./cash-flow-intelligence.js");assert.match(advise({opening:100,closing:200,estimate:80}),/差額/)});
