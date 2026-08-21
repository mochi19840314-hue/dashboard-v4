"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const TouchScroll=require("./success-library-touch-scroll");
const css=fs.readFileSync("style.css","utf8"),app=fs.readFileSync("app.js","utf8"),html=fs.readFileSync("index.html","utf8");

function fixture({scrollLeft=100,scrollWidth=500,clientWidth=200}={}){
 const listeners=new Map(),options=new Map();let pageSwipeEvents=0;
 const element={scrollLeft,scrollWidth,clientWidth,
  addEventListener(type,listener,option){listeners.set(type,listener);options.set(type,option)},
  removeEventListener(type){listeners.delete(type)}
 };
 const dispatch=(type,x=0,y=0)=>{
  const event={touches:type.startsWith("touch")&&type!=="touchend"&&type!=="touchcancel"?[{identifier:7,clientX:x,clientY:y}]:[],defaultPrevented:false,propagationStopped:false,
   preventDefault(){this.defaultPrevented=true},stopPropagation(){this.propagationStopped=true}};
  listeners.get(type)(event);if(!event.propagationStopped)pageSwipeEvents++;return event;
 };
 const controller=TouchScroll.setup(element);
 return {element,dispatch,controller,options,pageSwipes:()=>pageSwipeEvents};
}

test("AI経営ノートだけに専用touch処理を設定する",()=>{
 assert.match(html,/success-library-touch-scroll\.js\?v=2/);
 assert.match(app,/SuccessLibraryTouchScroll\.setup\(\$\("successLibraryItems"\)\)/);
 assert.equal((app.match(/SuccessLibraryTouchScroll\.setup/g)||[]).length,1);
});

test("左へ50pxドラッグするとscrollLeftが50px増加する",()=>{
 const f=fixture();f.dispatch("touchstart",150,40);const move=f.dispatch("touchmove",100,42);
 assert.equal(f.element.scrollLeft,150);assert.equal(move.defaultPrevented,true);assert.equal(f.options.get("touchmove").passive,false);
});

test("右へ50pxドラッグするとscrollLeftが50px減少する",()=>{
 const f=fixture();f.dispatch("touchstart",100,40);f.dispatch("touchmove",150,42);
 assert.equal(f.element.scrollLeft,50);
});

test("scrollLeftを0から最大値の範囲に制限する",()=>{
 const left=fixture({scrollLeft:280});left.dispatch("touchstart",100,0);left.dispatch("touchmove",0,0);assert.equal(left.element.scrollLeft,300);
 const right=fixture({scrollLeft:20});right.dispatch("touchstart",100,0);right.dispatch("touchmove",200,0);assert.equal(right.element.scrollLeft,0);
});

test("縦ドラッグはpreventDefaultせずページ縦スクロールを維持する",()=>{
 const f=fixture();f.dispatch("touchstart",100,100);const move=f.dispatch("touchmove",103,150);
 assert.equal(f.element.scrollLeft,100);assert.equal(move.defaultPrevented,false);
});

test("touchcancelでドラッグ状態を解除する",()=>{
 const f=fixture();f.dispatch("touchstart",100,20);assert.equal(f.controller.isTracking(),true);f.dispatch("touchcancel");assert.equal(f.controller.isTracking(),false);
 f.dispatch("touchmove",50,20);assert.equal(f.element.scrollLeft,100);
});

test("touchendでドラッグ状態を解除する",()=>{
 const f=fixture();f.dispatch("touchstart",100,20);f.dispatch("touchend");assert.equal(f.controller.isTracking(),false);
 f.dispatch("touchmove",50,20);assert.equal(f.element.scrollLeft,100);
});

test("AI経営ノートの全touch操作をDashboardページ切替へ伝播しない",()=>{
 const horizontal=fixture();horizontal.dispatch("touchstart",100,20);horizontal.dispatch("touchmove",40,22);horizontal.dispatch("touchend");assert.equal(horizontal.pageSwipes(),0);
 const vertical=fixture();vertical.dispatch("touchstart",100,20);const move=vertical.dispatch("touchmove",98,80);vertical.dispatch("touchend");
 assert.equal(vertical.pageSwipes(),0);assert.equal(move.defaultPrevented,false);
});

test("overflow-x:autoとPC向け通常スクロールを維持する",()=>{
 const rule=css.match(/\.success-library-items\{([^}]*)\}/)?.[1]||"";
 assert.match(rule,/overflow-x:auto/);assert.match(rule,/overflow-y:hidden/);assert.match(rule,/touch-action:pan-y/);
 assert.match(css,/\.success-pattern\{[^}]*flex:0 0 min\(270px,82vw\)/);
});
