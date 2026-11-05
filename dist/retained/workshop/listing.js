const fmt=x=>Array.isArray(x)?`${x[0]}(${x.slice(1).map(fmt).join(', ')})`:x&&typeof x==='object'?`{ ${Object.entries(x).map(([k,v])=>`${k} = ${fmt(v)}`).join('; ')} }`:typeof x==='string'?(x.startsWith('$')?x:JSON.stringify(x)):String(x);
function listing(xs,l=0){const i='  '.repeat(l);return xs.map(s=>{
if(s.let)return `${i}let ${s.let} = ${fmt(s.value)}`;
if(s.assert!==undefined)return `${i}assert ${fmt(s.assert)}\n${i}  otherwise ${JSON.stringify(s.message)}`;
if(s.port)return `${i}port ${s.port} ${fmt(s.args)} → ${s.into}`;
if(s.call)return `${i}call ${s.call}`;
if(s.when!==undefined)return `${i}when ${fmt(s.when)}:\n${listing(s.then,l+1)}`;
if(s.fold!==undefined)return `${i}fold ${fmt(s.fold)} as ${s.as}; ${s.accumulator} starts ${fmt(s.initial)}:\n${listing(s.steps,l+1)}\n${i}  yield ${fmt(s.yield)} → ${s.into}`;
if(s.each!==undefined)return `${i}each ${fmt(s.each)} as ${s.as}:\n${listing(s.steps,l+1)}`;
return `${i}${fmt(s)}`;}).join('\n');}
function diff(a,b){const aa=a.split(/\r?\n/),bb=b.split(/\r?\n/);return aa.flatMap((line,i)=>line===bb[i]?[]:[`− ${line}`,`+ ${bb[i]??''}`]).join('\n')||'No change.';}

export {fmt,listing,diff};
