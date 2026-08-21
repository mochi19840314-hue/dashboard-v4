const test=require("node:test"),assert=require("node:assert/strict"),KnowledgeCore=require("./knowledge-core");

function fixture(days,{missing=false,zeroPatients=false}={}){
 const entries=[],scoreHistory=[];
 for(let i=0;i<days;i++){
  const date=`2026-07-${String(i+1).padStart(2,"0")}`,band=i<Math.floor(days/3)?"low":i>=days-Math.floor(days/3)?"high":"normal",patients=zeroPatients&&i===0?0:20;
  const entry={date,patients,newPatients:band==="low"?6:2,sales:band==="high"?300000:band==="low"?100000:200000,clinical:{bloodTests:band==="high"?10:band==="low"?1:5,xrays:band==="high"?6:band==="low"?1:3,ultrasounds:band==="high"?2:0,preventive:band==="high"?8:band==="low"?1:4},surgeries:band==="high"?3:band==="low"?0:1,trimmings:2};
  if(missing)delete entry.clinical.bloodTests;
  entries.push(entry);scoreHistory.push({date,score:band==="high"?90:band==="low"?30:60});
 }
 return {entries,scoreHistory};
}

test("高スコア日・低スコア日を通常営業日と比較し、率を優先した非因果表現を返す",()=>{const input=fixture(30),result=KnowledgeCore.analyzeScorePatterns(input.entries,input.scoreHistory);assert.equal(result.reliability,"比較的安定");assert.ok(result.successPatterns.some(x=>x.metric==="画像検査率"));assert.ok(result.attentionPatterns.some(x=>x.metric==="画像検査率"));assert.ok([...result.successPatterns,...result.attentionPatterns].every(x=>/傾向/.test(x.text)&&/因果を示しません/.test(x.text)));assert.ok(result.strategies.length>=1&&result.strategies.length<=2);assert.ok(result.strategies.every(x=>/必要|診療品質/.test(x.action)))});
test("10営業日未満は参考値、10〜29営業日は傾向あり",()=>{assert.equal(KnowledgeCore.analyzeScorePatterns(...Object.values(fixture(9))).reliability,"参考値");assert.equal(KnowledgeCore.analyzeScorePatterns(...Object.values(fixture(15))).reliability,"傾向あり")});
test("欠損項目は0にせず分析対象外にする",()=>{const input=fixture(15,{missing:true}),result=KnowledgeCore.analyzeScorePatterns(input.entries,input.scoreHistory);assert.ok(![...result.successPatterns,...result.attentionPatterns].some(x=>x.metric==="血液検査率"))});
test("患者数0の日は率の母数に含めず安全に処理する",()=>{const input=fixture(15,{zeroPatients:true}),result=KnowledgeCore.analyzeScorePatterns(input.entries,input.scoreHistory);assert.equal(result.ready,true);assert.ok([...result.successPatterns,...result.attentionPatterns].every(x=>Number.isFinite(x.difference)))});
test("営業日不足では分析結果を生成しない",()=>{const input=fixture(2),result=KnowledgeCore.analyzeScorePatterns(input.entries,input.scoreHistory);assert.equal(result.ready,false);assert.equal(result.reliability,"参考値")});
