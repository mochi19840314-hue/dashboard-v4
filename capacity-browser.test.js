const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const capacity=fs.readFileSync("capacity-intelligence.js","utf8");
const efficiency=fs.readFileSync("clinical-efficiency.js","utf8");

test("Capacity v1 is loaded only as a browser display pilot",()=>{
  assert.match(efficiency,/capacity-intelligence\.js\?v=1/);
  assert.match(efficiency,/typeof document!=="undefined"/);
});

test("Today workload renders Capacity percent and status label",()=>{
  assert.match(capacity,/todayWidgetWorkload/);
  assert.match(capacity,/todayWidgetWorkloadLabel/);
  assert.match(capacity,/valueEl\.textContent=`\$\{result\.percent\}%`/);
  assert.match(capacity,/labelEl\.textContent=result\.status\.label/);
});

test("Capacity v1 does not patch Business Health or Kagemusha",()=>{
  assert.doesNotMatch(capacity,/BusinessHealthScore\.calculate\s*=/);
  assert.doesNotMatch(efficiency,/BusinessHealthScore\.calculate\s*=/);
  assert.doesNotMatch(capacity,/Kagemusha/);
});

test("Capacity v1 introduces no MutationObserver",()=>{
  assert.doesNotMatch(capacity,/MutationObserver/);
});

test("missing today entry remains unavailable instead of becoming zero load",()=>{
  assert.match(capacity,/if\(!entry\)return null/);
  assert.match(capacity,/valueEl\.textContent="—"/);
  assert.match(capacity,/labelEl\.textContent="算出中"/);
});
