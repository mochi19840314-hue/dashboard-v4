(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.ViewportDiagnostics=api;
  if(root.document)api.init(root.document,root);
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const STYLE_PROPERTIES=["width","min-width","max-width","display","position","transform","translate","scale","zoom","margin-left","margin-right","padding-left","padding-right","overflow","overflow-x"];
  const round=value=>Number.isFinite(value)?Math.round(value*100)/100:null;
  const px=value=>{const match=String(value||"").match(/^(-?[\d.]+)px$/);return match?Number(match[1]):null};
  function selector(element){
    if(!element)return "not found";
    return `${element.tagName.toLowerCase()}${element.id?`#${element.id}`:""}${element.classList?.length?`.`+[...element.classList].join("."):""}`;
  }
  function warnings(item,viewport,parentWidth){
    const result=[];
    if(item.rect.width<viewport*.8)result.push("幅縮小候補 (< viewport 80%)");
    if(item.rect.right>viewport)result.push("右側がviewport外");
    if(item.rect.left<0)result.push("左側がviewport外");
    if(item.scrollWidth>item.clientWidth)result.push("scrollWidth > clientWidth");
    if(item.styles.transform!=="none")result.push(`transform: ${item.styles.transform}`);
    if(!["none","0px",""].includes(item.styles.translate))result.push(`translate: ${item.styles.translate}`);
    if(!["none","1",""].includes(item.styles.scale))result.push(`scale: ${item.styles.scale}`);
    if(!["normal","none","1",1,""].includes(item.styles.zoom))result.push(`zoom: ${item.styles.zoom}`);
    const max=px(item.styles["max-width"]),min=px(item.styles["min-width"]);
    if(max!==null&&max<viewport*.8)result.push(`不自然なmax-width: ${item.styles["max-width"]}`);
    if(min!==null&&min>viewport)result.push(`不自然なmin-width: ${item.styles["min-width"]}`);
    if(parentWidth&&item.rect.width<parentWidth*.8)result.push("親より幅が20%以上小さい");
    return result;
  }
  function inspectElement(element,win,parentWidth){
    if(!element)return null;
    const rect=element.getBoundingClientRect(),computed=win.getComputedStyle(element);
    const item={element:selector(element),tagName:element.tagName,id:element.id||"",className:typeof element.className==="string"?element.className:"",rect:{left:round(rect.left),right:round(rect.right),width:round(rect.width)},scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,styles:{}};
    STYLE_PROPERTIES.forEach(property=>{item.styles[property]=computed.getPropertyValue(property)||""});
    item.warnings=warnings(item,win.innerWidth,parentWidth);
    return item;
  }
  function collect(doc,win){
    const main=doc.querySelector("main"),activePage=doc.querySelector(".page.active"),wrapper=doc.querySelector("#simulator");
    const parents=[];
    let element=wrapper;
    while(element){
      const parentWidth=element.parentElement?.getBoundingClientRect().width||null;
      parents.push(inspectElement(element,win,parentWidth));
      if(element===doc.body)break;
      element=element.parentElement;
    }
    const inspectWithParent=target=>inspectElement(target,win,target?.parentElement?.getBoundingClientRect().width||null);
    return {capturedAt:new Date().toISOString(),viewportMeta:[...doc.querySelectorAll('meta[name="viewport"]')].map(meta=>meta.getAttribute("content")||""),window:{innerWidth:win.innerWidth,outerWidth:win.outerWidth},documentElement:{clientWidth:doc.documentElement.clientWidth},body:{clientWidth:doc.body.clientWidth,scrollWidth:doc.body.scrollWidth},elements:{main:inspectWithParent(main),activePage:inspectWithParent(activePage),simulatorWrapper:inspectWithParent(wrapper)},parentChain:parents};
  }
  function formatItem(item){
    if(!item)return "  not found";
    const warning=item.warnings.length?` ⚠️ ${item.warnings.join(" / ")}`:" OK";
    return [`${item.element}: left=${item.rect.left}px right=${item.rect.right}px width=${item.rect.width}px scrollWidth=${item.scrollWidth}px clientWidth=${item.clientWidth}px${warning}`,...STYLE_PROPERTIES.map(key=>`  ${key}: ${item.styles[key]}`)].join("\n");
  }
  function format(report){
    return [`Viewport diagnostics (${report.capturedAt})`,`viewport meta (${report.viewportMeta.length}): ${report.viewportMeta.length?report.viewportMeta.join(" | "):"not found"}`,`window.innerWidth: ${report.window.innerWidth}px`,`window.outerWidth: ${report.window.outerWidth}px`,`document.documentElement.clientWidth: ${report.documentElement.clientWidth}px`,`document.body.clientWidth: ${report.body.clientWidth}px`,`document.body.scrollWidth: ${report.body.scrollWidth}px`,"","[Key elements]",`main\n${formatItem(report.elements.main)}`,`.page.active\n${formatItem(report.elements.activePage)}`,`AI simulator wrapper\n${formatItem(report.elements.simulatorWrapper)}`,"","[Parent chain: simulator → body]",...report.parentChain.map((item,index)=>`${index+1}. ${formatItem(item)}`)].join("\n");
  }
  function copyText(text,doc,win){
    if(win.navigator.clipboard&&win.isSecureContext)return win.navigator.clipboard.writeText(text);
    const area=doc.createElement("textarea");area.value=text;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";doc.body.appendChild(area);area.select();area.setSelectionRange(0,text.length);const copied=doc.execCommand("copy");area.remove();return copied?Promise.resolve():Promise.reject(new Error("copy failed"));
  }
  function show(doc,win){
    doc.getElementById("viewportDiagnosticsPanel")?.remove();
    const report=collect(doc,win),text=format(report),panel=doc.createElement("section");
    panel.id="viewportDiagnosticsPanel";panel.className="viewport-diagnostics-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-labelledby","viewportDiagnosticsTitle");
    panel.innerHTML='<div class="viewport-diagnostics-dialog"><header><h2 id="viewportDiagnosticsTitle">🔍 画面診断</h2><button type="button" data-diagnostics-close aria-label="閉じる">×</button></header><p>表示直前のレイアウト測定結果です。⚠️ は幅縮小・横はみ出し・変形などの候補を示します。</p><pre></pre><footer><button type="button" data-diagnostics-copy>診断結果をコピー</button><span role="status" aria-live="polite"></span></footer></div>';
    panel.querySelector("pre").textContent=text;doc.body.appendChild(panel);
    const close=()=>panel.remove();panel.querySelector("[data-diagnostics-close]").addEventListener("click",close);panel.addEventListener("click",event=>{if(event.target===panel)close()});
    panel.querySelector("[data-diagnostics-copy]").addEventListener("click",()=>{const status=panel.querySelector('[role="status"]');copyText(text,doc,win).then(()=>{status.textContent="コピーしました"}).catch(()=>{status.textContent="コピーできませんでした。結果を長押しして選択してください"})});
  }
  function init(doc,win){const button=doc.getElementById("viewportDiagnosticsButton");if(button&&!button.dataset.diagnosticsReady){button.dataset.diagnosticsReady="true";button.addEventListener("click",()=>show(doc,win))}}
  return {STYLE_PROPERTIES,warnings,inspectElement,collect,format,init};
});
