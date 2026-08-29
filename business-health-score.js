(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.BusinessHealthScore=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const MIN_LEARNING_DAYS=20,MIN_START_DAYS=50,HISTORY_LIMIT=730;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const finite=value=>value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));
 const band=(value,levels)=>{for(const [minimum,points] of levels)if(value>=minimum)return points;return 0};
 const KPI={
  profitRate:{weight:25,points:value=>band(Number(value),[[40,25],[35,20],[30,15],[25,10],[20,5]])},
  salesAchievement:{weight:20,points:value=>band(Number(value),[[100,20],[95,18],[90,16],[80,12],[70,8],[50,5]])},
  patientAchievement:{weight:15,points:value=>Math.round(clamp(Number(value)/100*15,0,15))},
  unitPriceChange:{weight:20,points:value=>band(Number(value),[[10,20],[5,18],[0,15],[-5,10],[-10,5]])},
  newPatientRate:{weight:10,points:value=>Math.round(clamp(Number(value)/20*10,0,10))},
  revisitRate:{weight:10,points:value=>Math.round(clamp(Number(value)/70*10,0,10))},
  preventiveRate:{weight:10,points:value=>Math.round(clamp(Number(value)/20*10,0,10))},
  imagingRate:{weight:10,points:value=>Math.round(clamp(Number(value)/15*10,0,10))},
  bloodTestRate:{weight:10,points:value=>Math.round(clamp(Number(value)/10*10,0,10))},
  doctorWorkload:{weight:15,points:value=>Math.round(clamp((100-Number(value))/50*15,0,15))},
  successPattern:{weight:10,points:value=>band(Number(value),[[90,10],[80,8],[70,6],[60,4]])}
 };
 const REASON_LABELS={profitRate:"利益率",salesAchievement:"売上達成率",patientAchievement:"患者数",unitPriceChange:"客単価",newPatientRate:"新患率",revisitRate:"再診率",preventiveRate:"予防率",imagingRate:"画像検査率",bloodTestRate:"血液検査率",doctorWorkload:"診療負荷",successPattern:"成功パターン一致率"};
 const ACTIONS={profitRate:"費用と診療内容の内訳を確認し、利益を圧迫した要因がないか振り返ってください。",salesAchievement:"予約状況と日次目標との差を確認し、無理のない診療計画を整えてください。",patientAchievement:"予約枠と来院状況を確認し、診療体制とのずれがないか見直してください。",unitPriceChange:"診療内容と会計の記録を振り返り、算定漏れがなかったか確認してください。",newPatientRate:"新患の来院経路を確認し、案内や情報発信の改善点を一つ整理してください。",revisitRate:"再診が必要な患者への案内漏れがなかったか確認してください。",preventiveRate:"必要な患者への予防案内が不足していなかったか確認してください。",imagingRate:"必要な症例で検査提案が不足していなかったか確認してください。",bloodTestRate:"必要な症例で検査提案が不足していなかったか確認してください。",doctorWorkload:"予約枠と人員配置を確認し、診療負荷の偏りを整えてください。",successPattern:"過去の安定した診療日との違いを一つ確認してください。"};
 function grade(score){if(!finite(score))return {label:"データ不足",tone:"learning"};const value=Number(score);return value>=90?{label:"Excellent",tone:"excellent"}:value>=80?{label:"Good",tone:"good"}:value>=70?{label:"Stable",tone:"stable"}:value>=60?{label:"Attention",tone:"attention"}:{label:"Action Required",tone:"action"}}
 function opportunities(components={}){return [{key:"revisit",label:"再診予約",maximum:10,value:components.revisitRate},{key:"imaging",label:"画像検査",maximum:10,value:components.imagingRate??components.successPattern},{key:"checkup",label:"健診",maximum:10,value:components.preventiveRate},{key:"unitPrice",label:"客単価",maximum:20,value:components.unitPriceChange}].filter(item=>finite(item.value)).map(item=>({...item,gap:item.maximum-Number(item.value),stars:clamp(Math.ceil((item.maximum-Number(item.value))/2),1,5)})).sort((a,b)=>b.gap-a.gap)}
 function calculate(input={}){
  const businessDays=Math.max(0,Math.trunc(finite(input.businessDays)?Number(input.businessDays):0));
  const unitPriceChange=finite(input.unitPrice)&&finite(input.normalUnitPrice)&&Number(input.normalUnitPrice)!==0?(Number(input.unitPrice)/Number(input.normalUnitPrice)-1)*100:null;
  const values={profitRate:input.profitRate,salesAchievement:input.salesAchievement,patientAchievement:input.patientAchievement,unitPriceChange,newPatientRate:input.newPatientRate,revisitRate:input.revisitRate,preventiveRate:input.preventiveRate,imagingRate:input.imagingRate,bloodTestRate:input.bloodTestRate,doctorWorkload:input.doctorWorkload,successPattern:input.successPatternMatch};
  const components={},availableComponents=[];let earned=0,availableWeight=0;
  for(const [key,definition] of Object.entries(KPI)){if(!finite(values[key])){components[key]=null;continue}const points=clamp(definition.points(values[key]),0,definition.weight);components[key]=points;availableComponents.push(key);earned+=points;availableWeight+=definition.weight}
  // A missing KPI is excluded from both numerator and denominator. An explicitly saved zero is finite and scores normally.
  const previewScore=availableWeight?Math.round(clamp(earned/availableWeight*100,0,100)):null,ready=businessDays>=MIN_START_DAYS&&previewScore!==null;
  return {score:ready?previewScore:null,previewScore,ready,status:previewScore===null?"データ不足":businessDays<MIN_LEARNING_DAYS?"学習中":ready?"算出中":"学習を継続中",businessDays,requiredDays:MIN_START_DAYS,remainingDays:Math.max(0,MIN_START_DAYS-businessDays),components,availableComponents,availableWeight,metrics:{...input,unitPriceChange},grade:grade(previewScore),opportunities:opportunities(components)};
 }
 function explain(result={}){
  const score=finite(result.score)?Math.round(Number(result.score)):finite(result.previewScore)?Math.round(Number(result.previewScore)):null,components=result.components&&typeof result.components==="object"?result.components:{};
  const evaluated=Object.entries(KPI).filter(([key])=>finite(components[key])).map(([key,definition])=>({key,label:REASON_LABELS[key],points:Number(components[key]),maximum:definition.weight,ratio:Number(components[key])/definition.weight}));
  if(score===null||evaluated.length<2)return {text:"評価できるデータがまだ十分ではありません。",sentences:["評価できるデータがまだ十分ではありません。"],positive:[],negative:[],action:null};
  const conclusion=score>=80?"好調な診療日でした。":score>=60?"概ね安定しています。":"改善余地のある診療日でした。",positive=evaluated.filter(item=>item.ratio>=.7).sort((a,b)=>b.points-a.points||b.ratio-a.ratio).slice(0,3),negative=evaluated.filter(item=>item.ratio<.7).sort((a,b)=>(b.maximum-b.points)-(a.maximum-a.points)).slice(0,2),join=items=>items.map(item=>item.label).join("、"),sentences=[conclusion];
  if(positive.length)sentences.push(`${join(positive)}がスコアにプラス寄与し、${score}点の主なプラス要因です。`);if(negative.length)sentences.push(`一方、${join(negative)}には改善余地があります。`);
  const action=negative.length?ACTIONS[negative[0].key]:null;if(action)sentences.push(`明日は、${action}`);return {text:sentences.join("\n"),sentences,positive,negative,action};
 }
 const validScore=finite;
 function normalizeHistory(value){return (Array.isArray(value)?value:[]).filter(item=>item&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&validScore(item.score)).map(item=>({...item,score:clamp(Math.round(Number(item.score)),0,100)})).sort((a,b)=>a.date.localeCompare(b.date)).slice(-HISTORY_LIMIT)}
 function reportHistory(history,entries){const saved=normalizeHistory(history);if(saved.length)return saved;return normalizeHistory((Array.isArray(entries)?entries:[]).map(entry=>({date:entry?.date,score:entry?.businessHealthScore})))}
 function updateHistory(history,result,date){const current=normalizeHistory(history).filter(item=>item.date!==date);return result?.ready?normalizeHistory([...current,{date,score:result.score,grade:result.grade.label}]):current}
 function summary(history,month){const rows=normalizeHistory(history).filter(item=>!month||item.date.startsWith(month)),scores=rows.map(item=>item.score);if(!scores.length)return {count:0,average:null,highest:null,lowest:null,improvement:null};return {count:scores.length,average:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),highest:Math.max(...scores),lowest:Math.min(...scores),improvement:scores.at(-1)-scores[0]}}
 function displayScore(result,history,date,isClosed){
  const current=Number(result?.score),previous=normalizeHistory(history).filter(item=>item.date<date).at(-1),learningComplete=Number(result?.businessDays)>=Number(result?.requiredDays||MIN_START_DAYS);
  // After the 50-business-day learning period has completed, a new/open day with no KPI input yet must not fall back to "learning".
  // Keep the most recent valid business-day score until the current day's metrics become available.
  if((isClosed||(!Number.isFinite(current)&&learningComplete))&&previous)return {...result,ready:true,score:previous.score,grade:grade(previous.score),asOf:previous.date,carriedForward:true};
  return {...result,score:Number.isFinite(current)?current:result?.score,asOf:null,carriedForward:false}
 }
 return {MIN_LEARNING_DAYS,MIN_START_DAYS,calculate,explain,grade,normalizeHistory,reportHistory,updateHistory,summary,displayScore};
});
