'use strict';
// Inert DOM observation/adoption. Decisions require the private Encounter gate.
function markupMechanisms(){
  function browser(document,projection=null){
    const observe=node=>({kind:node.nodeType===3?'#text':node.nodeType===8?'#comment':node.localName??'#document-fragment',tag:node.localName??'',namespace:node.namespaceURI??'',attrs:node.nodeType===1?[...node.attributes].map(a=>({name:a.name,value:a.value})):[],text:node.nodeType===3?node.nodeValue:node.nodeType===1&&node.localName==='script'?node.textContent:'',children:[...node.childNodes].map(observe),...(node.content?{content:observe(node.content)}:{})});
    const authorize=(gate,query,input)=>{if(!gate?.authorize)throw Error('Private Encounter policy gate required');return gate.authorize(query,input);};
    const inert=()=>document.createElement('template').content.ownerDocument;
    function parse(text){const doc=inert(),template=doc.createElement('template');template.innerHTML=text;return observe(template.content);}
    function check(root,gate,frame=false){return authorize(gate,'surface.tree',{root,base:document.baseURI,frame,xml:false,mode:'dom',artifacts:{}});}
    function fragment(context,html,gate){
      authorize(gate,'surface.source',{text:html});const doc=inert(),el=doc.createElementNS(context.namespaceURI??'http://www.w3.org/1999/xhtml',context.localName??'div');el.innerHTML=html;
      const root=el.content??el;check(observe(root),gate);authorize(gate,'projection.mount',{tag:context.localName??'',kind:projection?.identity(html)?.kind??null});const fragment=doc.createDocumentFragment();while(root.firstChild)fragment.appendChild(root.firstChild);return fragment;
    }
    return {
      parse,
      observeChildren:target=>({kind:"#document-fragment",tag:"",attrs:[],text:"",children:[...target.childNodes].map(observe)}),
      content:(target,html,gate)=>{target.replaceChildren(fragment(target,html,gate));},
      insert:(target,position,html,gate)=>{const context=['beforebegin','afterend'].includes(position)?target.parentElement:target;if(!context)throw Error('Missing markup context');const nodes=fragment(context,html,gate);if(position==='beforebegin')target.before(nodes);else if(position==='afterend')target.after(nodes);else if(position==='afterbegin')target.prepend(nodes);else if(position==='beforeend')target.append(nodes);else throw Error('Unknown insertion position');},
      replace:(target,html,gate)=>{if(!target.parentElement)throw Error('Missing replacement context');target.replaceWith(fragment(target.parentElement,html,gate));},
      frame:(html,gate)=>{authorize(gate,'surface.source',{text:html});check(parse(html),gate,true);return authorize(gate,'projection.mount',{tag:'iframe',kind:projection?.identity(html)?.kind??null});},
      attribute:(target,name,value,gate)=>{authorize(gate,'surface.attribute',{tag:target.localName,name,value,attributes:Object.fromEntries([...target.attributes].map(a=>[a.name,a.value])),base:document.baseURI,mutation:true});authorize(gate,'projection.attribute',{name});if(name==='style')authorize(gate,'projection.inline',{value});if(name==='class')authorize(gate,'projection.class',{name:value,classes:projection?.classes()??[]});return true;},
      write:(target,gate,name,property=false,value=null)=>{authorize(gate,'surface.write',{tag:target.localName,name:name??null,property});if(target.localName==='style')authorize(gate,'projection.output',{issued:projection?.identity(value)?.kind==='stylesheet'});if(name==='className')authorize(gate,'projection.class',{name:value,classes:projection?.classes()??[]});return true;}
    };
  }
  return {browser};
}
module.exports={...markupMechanisms(),markupMechanisms};
