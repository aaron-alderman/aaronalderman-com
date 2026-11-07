// Generic DOM observation only: computed values, rectangles, paint ancestry and events.
// No contrast thresholds, accessibility verdicts or application selectors live here.
export function observeReadingExperience(input){
 const plan=input.plan,win=window,doc=document;
 const path=n=>{if(!n||n.nodeType!==1)return '';if(n.id)return '[id='+JSON.stringify(n.id)+']';if(n===doc.documentElement)return 'html';const peers=[...(n.parentElement?.children??[])].filter(p=>p.tagName===n.tagName);return path(n.parentElement)+' > '+n.tagName.toLowerCase()+':nth-of-type('+(peers.indexOf(n)+1)+')';};
 const rgba=value=>{const m=value.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);return m?[Number(m[1]),Number(m[2]),Number(m[3]),m[4]===undefined?1:Number(m[4])]:null;};
 const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
 const visible=n=>{const s=getComputedStyle(n),r=rect(n);return s.display!=='none'&&s.visibility==='visible'&&r.width>0&&r.height>0;};
 const style=n=>{const s=getComputedStyle(n);return {color:s.color,background:s.backgroundColor,border:s.borderColor,outline:s.outline,shadow:s.boxShadow};};
 const number=v=>{const x=parseFloat(v);return Number.isFinite(x)?x:null;};
 const describe=n=>{const s=getComputedStyle(n);return {path:path(n),tag:n.tagName,text:(n.textContent??'').trim().slice(0,200),rect:rect(n),clientWidth:n.clientWidth,clientHeight:n.clientHeight,scrollWidth:n.scrollWidth,scrollHeight:n.scrollHeight,overflowX:s.overflowX,overflowY:s.overflowY,fontSize:number(s.fontSize),lineHeight:number(s.lineHeight),letterSpacing:s.letterSpacing==='normal'?0:number(s.letterSpacing),wordSpacing:s.wordSpacing==='normal'?0:number(s.wordSpacing),paragraphGap:number(s.marginBlockEnd)};};
 const paint=n=>{const s=getComputedStyle(n),layers=[];for(let p=n;p;p=p.parentElement){const cs=getComputedStyle(p);layers.push({path:path(p),rgba:rgba(cs.backgroundColor),image:cs.backgroundImage,opacity:Number(cs.opacity),filter:cs.filter,blend:cs.mixBlendMode});}return {foreground:rgba(s.color),layers};};
 if(input.operation==='install-keyboard'){
  const observed={events:[],before:new Map([...doc.querySelectorAll('a,button,input,select,textarea,summary,[tabindex]')].map(n=>[n,style(n)]))};
  doc.addEventListener('keydown',e=>{const entry={key:e.key,trusted:e.isTrusted};observed.events.push(entry);if(typeof win.__readingKeyEvent==='function')win.__readingKeyEvent(JSON.stringify(entry));},true);win.__readingKeyboard=observed;return true;
 }
 if(input.operation==='focus'){
  const n=doc.activeElement,s=getComputedStyle(n),r=rect(n),before=win.__readingKeyboard?.before.get(n)??null,now=style(n);
  return {...describe(n),associatedLabels:[...(n.labels??[])].map(describe),focusVisible:n.matches(':focus-visible'),outlineStyle:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth)||0,boxShadow:s.boxShadow,beforePaint:before,afterPaint:now,paint:paint(n),fontSize:parseFloat(s.fontSize),fontWeight:Number(s.fontWeight)||400,points:plan.keyboard.points.map(([u,v])=>{const x=r.left+r.width*u,y=r.top+r.height*v,hit=doc.elementFromPoint(x,y);return {x,y,hit:path(hit),ownsHit:!!hit&&(hit===n||n.contains(hit))};})};
 }
 if(input.operation==='keyboard-events')return win.__readingKeyboard?.events??[];
 const texts=[...doc.querySelectorAll(plan.textSelectors)].filter(visible),blocks=[...doc.querySelectorAll(plan.blockSelectors)].filter(visible);
 return {route:input.route,profile:input.profile,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},url:location.href,readyState:doc.readyState,fontStatus:doc.fonts?.status??'unavailable',spacingApplied:!!doc.querySelector('#reading-spacing-override'),document:{scrollWidth:doc.documentElement.scrollWidth,clientWidth:doc.documentElement.clientWidth},truncatedTexts:texts.length>plan.maxTexts,truncatedBlocks:blocks.length>plan.maxBlocks,texts:texts.slice(0,plan.maxTexts).map(n=>({...describe(n),state:input.state??'initial',fontSize:parseFloat(getComputedStyle(n).fontSize),fontWeight:Number(getComputedStyle(n).fontWeight)||400,paint:paint(n)})),blocks:blocks.slice(0,plan.maxBlocks).map(describe)};
}
