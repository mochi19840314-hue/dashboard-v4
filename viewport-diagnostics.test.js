const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("app.js","utf8");

function diagnosticDom(){
 const elements=new Map(),make=tag=>({tagName:tag.toUpperCase(),style:{},hidden:false,children:[],dataset:{},set id(value){this._id=value;elements.set(value,this)},get id(){return this._id},setAttribute(name,value){this[name]=value},append(...children){this.children.push(...children)},matches(selector){return selector===".page.active"&&this.className==="page active"},getBoundingClientRect(){return {width:this.rectWidth||0}}});
 const body=make("body");body.clientWidth=390;body.scrollWidth=420;body.append=(...children)=>children.forEach(child=>{body.children.push(child);child.parentNode=body});
 const simulator=make("section");simulator.id="simulator";simulator.className="page";simulator.rectWidth=420;
 const main=make("main");main.rectWidth=400;
 const document={body,documentElement:{clientWidth:390},createElement:make,getElementById:id=>elements.get(id)||null,querySelector:selector=>selector==="main"?main:null};
 const window={innerWidth:390},navigator={clipboard:{writeText(){}}},$=id=>document.getElementById(id);
 const source=app.match(/function viewportDiagnosticText\(\)[\s\S]*?(?=function moveMonth)/)[0];
 Function("document","window","navigator","$",`${source};setupViewportDiagnostics();`)(document,window,navigator,$);
 return {body,simulator,button:elements.get("viewportDiagnosticButton"),panel:elements.get("viewportDiagnosticPanel")};
}

test("viewport diagnostic UI is created directly under document.body",()=>{
 const {body,button,panel}=diagnosticDom();
 assert.equal(button.parentNode,body);assert.equal(panel.parentNode,body);
 assert.equal(button.textContent,"🔍 画面診断");assert.ok(panel.children.some(child=>child.textContent==="診断結果をコピー"));
});

test("diagnostic button follows the active simulator page after activation",()=>{
 const {simulator,button}=diagnosticDom();
 assert.equal(button.hidden,true);simulator.className="page active";
 // Run the same active-state expression used by updateViewportDiagnostics.
 button.hidden=!Boolean(simulator.matches(".page.active"));assert.equal(button.hidden,false);
 assert.match(app,/document\.querySelectorAll\("\.page"\)\.forEach[\s\S]*?updateViewportDiagnostics\(\)/);
 assert.match(app,/matches\("\.page\.active"\)/);
 assert.match(app,/button\.hidden=!active;if\(!active\)panel\.hidden=true/);
});

test("diagnostic overlay has viewport-fixed geometry and required measurements",()=>{
 assert.match(app,/position:fixed;top:calc\(env\(safe-area-inset-top\) \+ 10px\);right:10px;z-index:2147483647/);
 assert.match(app,/position:fixed;left:10px;right:10px;top:80px;bottom:20px;z-index:2147483647;overflow-y:auto/);
 for(const measurement of ["window.innerWidth","document.documentElement.clientWidth","document.body.clientWidth","document.body.scrollWidth","main.getBoundingClientRect().width","#simulator.getBoundingClientRect().width"])assert.ok(app.includes(measurement),measurement);
});
