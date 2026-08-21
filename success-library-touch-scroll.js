(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.SuccessLibraryTouchScroll=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 function setup(element){
  if(!element)return null;
  let tracking=false,direction=null,startX=0,startY=0,startScrollLeft=0;
  const stopPageSwipe=event=>event.stopPropagation();
  const reset=event=>{tracking=false;direction=null;stopPageSwipe(event)};
  const onTouchStart=event=>{
   const touch=event.touches?.[0];if(!touch)return;
   tracking=true;direction=null;startX=touch.clientX;startY=touch.clientY;startScrollLeft=element.scrollLeft;
   stopPageSwipe(event);
  };
  const onTouchMove=event=>{
   if(!tracking)return;
   const touch=event.touches?.[0];if(!touch)return;
   const dx=touch.clientX-startX,dy=touch.clientY-startY;
   if(direction===null){
    if(Math.abs(dx)===Math.abs(dy))return;
    direction=Math.abs(dx)>Math.abs(dy)?"horizontal":"vertical";
   }
   stopPageSwipe(event);
   if(direction!=="horizontal")return;
   event.preventDefault();
   const maximum=Math.max(0,element.scrollWidth-element.clientWidth);
   element.scrollLeft=Math.max(0,Math.min(maximum,startScrollLeft-dx));
  };
  element.addEventListener("touchstart",onTouchStart,{passive:true});
  element.addEventListener("touchmove",onTouchMove,{passive:false});
  element.addEventListener("touchend",reset,{passive:true});
  element.addEventListener("touchcancel",reset,{passive:true});
  return {
   isTracking:()=>tracking,
   destroy(){
    element.removeEventListener("touchstart",onTouchStart);
    element.removeEventListener("touchmove",onTouchMove);
    element.removeEventListener("touchend",reset);
    element.removeEventListener("touchcancel",reset);
   }
  };
 }
 return {setup};
});
