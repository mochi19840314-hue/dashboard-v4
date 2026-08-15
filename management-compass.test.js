const test=require("node:test"),assert=require("node:assert/strict"),Compass=require("./management-compass");
const insight={date:"2026-08-14",key:"imaging:unit",result:"直近30営業日では、画像検査を実施した日は客単価が平均より16%高い傾向でした。"};
const build=options=>Compass.build({entries:Array.from({length:40},(_,i)=>({date:`2026-07-${i}`})),hour:10,...options});
test("Knowledge Coreがあれば戦略を表示する",()=>assert.equal(build({knowledgeCore:{getTopThemes:()=>[{id:"checkup",theme:"健康診断",comment:"有効な傾向"}]}}).ready,true));
test("Knowledge CoreなしでもLearning Insightを戦略化する",()=>assert.equal(build({knowledgeCore:{getTopThemes:()=>[]},successLibrary:[],learningHistory:[insight]}).ready,true));
test("画像検査と客単価16%から医療安全に配慮した戦略を作る",()=>{const result=build({learningHistory:[insight]});assert.equal(result.title,"画像検査の適応確認");assert.match(result.reason,/16%/);assert.doesNotMatch(result.missions[0].actions.join(" "),/増や|利益が上が/)});
test("21時は明日の候補にする",()=>assert.equal(build({hour:21,learningHistory:[insight]}).isTomorrow,true));
test("候補がすべてなければ分析中になる",()=>assert.equal(build({knowledgeCore:{getTopThemes:()=>[]},successLibrary:[],weeklyLearningHistory:[],learningHistory:[],clinicalIntelligence:{analyze:()=>({insights:[]})}}).ready,false));
test("空配列とnullは次のフォールバックへ進む",()=>{assert.equal(build({knowledgeCore:{getTopThemes:()=>[]},successLibrary:[],weeklyLearningHistory:null,learningHistory:[insight]}).ready,true);assert.equal(build({knowledgeCore:{getTopThemes:()=>null},successLibrary:null,weeklyLearningHistory:[],learningHistory:[insight]}).ready,true)});
