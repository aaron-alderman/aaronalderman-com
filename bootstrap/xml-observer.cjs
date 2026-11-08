'use strict';
// Bounded, inert XML syntax observation. No DTDs, entities, imports or execution.
// Namespace resolution uses XML semantics; HTML raw-text parsing is not used.
function observeXml(text){
  if(typeof text!=='string'||text.length>32000000)throw Error('XML source bound exceeded');
  let offset=0,nodes=0;const root={tag:'',attrs:[],children:[]},stack=[{node:root,namespaces:{xml:'http://www.w3.org/XML/1998/namespace'},name:null}];
  const fail=message=>{throw Error('NATIVE-SURFACE: XML '+message+' at '+offset);};
  const valid=point=>point===9||point===10||point===13||point>=32&&point<=0xd7ff||point>=0xe000&&point<=0xfffd||point>=0x10000&&point<=0x10ffff;
  for(const character of text)if(!valid(character.codePointAt(0)))fail('invalid character');
  const whitespace=()=>{while(/[\x20\t\r\n]/.test(text[offset]??'')&&offset<text.length)offset++;};
  const name=()=>{const match=/^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?/.exec(text.slice(offset));if(!match)fail('name required');offset+=match[0].length;return match[0];};
  const decode=value=>value.replace(/&([^;]*);|&/g,(whole,entity)=>{if(entity===undefined)fail('unclosed entity');const predefined={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};if(Object.hasOwn(predefined,entity))return predefined[entity];if(!/^#(?:[0-9]+|x[0-9a-fA-F]+)$/.test(entity))fail('undeclared entity');const point=entity[1]==='x'?parseInt(entity.slice(2),16):Number(entity.slice(1));if(!valid(point))fail('invalid character reference');return String.fromCodePoint(point);});
  if(text.charCodeAt(0)===0xfeff)offset++;
  if(text.startsWith('<?xml',offset)){
    const end=text.indexOf('?>',offset);if(end<0)fail('unclosed declaration');const declaration=text.slice(offset,end+2);
    if(!/^<\?xml\s+version\s*=\s*(["'])1\.0\1(?:\s+encoding\s*=\s*(["'])UTF-8\2)?(?:\s+standalone\s*=\s*(["'])(?:yes|no)\3)?\s*\?>$/i.test(declaration))fail('unsupported declaration');offset=end+2;
  }
  while(offset<text.length){
    if(text.startsWith('<!--',offset)){const end=text.indexOf('-->',offset+4);if(end<0||text.slice(offset+4,end).includes('--'))fail('invalid comment');offset=end+3;continue;}
    if(text.startsWith('<![CDATA[',offset)){if(stack.length===1)fail('CDATA outside root');const end=text.indexOf(']]>',offset+9);if(end<0)fail('unclosed CDATA');offset=end+3;continue;}
    if(text.startsWith('<!',offset)||text.startsWith('<?',offset))fail('declarations and processing instructions refused');
    if(text.startsWith('</',offset)){offset+=2;const closing=name();whitespace();if(text[offset++]!=='>')fail('invalid closing tag');if(stack.length===1||stack.pop().name!==closing)fail('mismatched closing tag');continue;}
    if(text[offset]==='<'){
      offset++;const tag=name(),attrs=[],seen=new Set();let empty=false;
      for(;;){const before=offset;whitespace();if(text.startsWith('/>',offset)){offset+=2;empty=true;break;}if(text[offset]==='>'){offset++;break;}if(before===offset)fail('attribute whitespace required');const key=name();if(seen.has(key))fail('duplicate attribute');seen.add(key);whitespace();if(text[offset++]!=='=')fail('attribute equals required');whitespace();const quote=text[offset++];if(!['"',"'"].includes(quote))fail('quoted attribute required');const end=text.indexOf(quote,offset);if(end<0||text.slice(offset,end).includes('<'))fail('invalid attribute');attrs.push({name:key,value:decode(text.slice(offset,end))});offset=end+1;}
      const parent=stack.at(-1),namespaces={...parent.namespaces};
      for(const attr of attrs){if(attr.name==='xmlns')namespaces['']=attr.value;else if(attr.name.startsWith('xmlns:')){const prefix=attr.name.slice(6);if(!attr.value||prefix==='xmlns'||prefix==='xml'&&attr.value!=='http://www.w3.org/XML/1998/namespace')fail('invalid namespace binding');namespaces[prefix]=attr.value;}}
      const resolve=(qualified,attribute=false)=>{const parts=qualified.split(':');if(parts.length===1)return attribute?'':namespaces['']??'';if(!Object.hasOwn(namespaces,parts[0]))fail('unbound namespace prefix');return namespaces[parts[0]];};
      const namespace=resolve(tag),expanded=new Set();for(const attr of attrs){if(attr.name==='xmlns'||attr.name.startsWith('xmlns:'))continue;const identity=resolve(attr.name,true)+'#'+attr.name.split(':').at(-1);if(expanded.has(identity))fail('duplicate expanded attribute');expanded.add(identity);}
      if(++nodes>200000||stack.length>256)fail('node/depth bound exceeded');const node={tag,namespace,attrs,children:[]};parent.node.children.push(node);if(stack.length===1&&root.children.length>1)fail('multiple roots');if(!empty)stack.push({node,namespaces,name:tag});continue;
    }
    let end=text.indexOf('<',offset);if(end<0)end=text.length;const characters=text.slice(offset,end);if(characters.includes(']]>'))fail('CDATA terminator in text');decode(characters);if(stack.length===1&&characters.trim())fail('text outside root');offset=end;
  }
  if(stack.length!==1||root.children.length!==1)fail('unclosed or absent root');return root;
}
module.exports={observeXml};
