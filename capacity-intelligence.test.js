const assert=require("assert");
const CapacityIntelligence=require("./capacity-intelligence");

{
  const result=CapacityIntelligence.evaluate({patients:18,bloodTests:6,imaging:3,checkups:2,surgeries:1});
  assert.strictEqual(result.points,23.55);
  assert.strictEqual(result.percent,107);
  assert.strictEqual(result.status.label,"高負荷");
}

{
  const result=CapacityIntelligence.evaluate({patients:12});
  assert.strictEqual(result.percent,55);
  assert.strictEqual(result.status.label,"適正");
}

{
  const result=CapacityIntelligence.evaluate({patients:8,bloodTests:2});
  assert.strictEqual(result.status.label,"余力あり");
}

{
  const result=CapacityIntelligence.evaluate({patients:18,surgeries:1,secondOpinions:2});
  assert.deepStrictEqual(result.dominantFactors.map(item=>item.key).slice(0,2),["patients","surgeries"]);
}

console.log("capacity-intelligence tests passed");
