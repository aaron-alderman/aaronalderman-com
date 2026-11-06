// Authoring notation only. All evaluation, event handling and rendering ship as
// admitted process queries over the unchanged seed and generic host effects.
import fs from 'node:fs';
const read=f=>JSON.parse(fs.readFileSync(f)),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const L=(...x)=>['list',...x],C=(...x)=>['concat',...x],A=(x,k)=>['at',x,k],eq=(a,b)=>['eq',a,b],N=x=>['not',x],I=(c,a,b)=>['if',c,a,b],map=(x,a,v)=>['map',x,a,v],append=(x,v)=>['append',x,L(v)];
const v=(name,value)=>({let:name,value}),p=(port,args,into='_')=>({port,args,into}),k=(query,input,into='result')=>p('kernel.invoke',{query,input},into),w=(when,...then)=>({when,then:then.flat()}),fold=(items,as,accumulator,initial,steps,yieldValue,into)=>({fold:items,as,accumulator,initial,steps,yield:yieldValue,into}),each=(items,as,steps)=>({each:items,as,steps});
const E=(tag,attrs={},...children)=>({tag,attrs,children:L(...children)}),el=(tag,cls,...children)=>E(tag,cls?{class:cls}:{},...children),math=(operation,values,into)=>p('number.calculate',{operation,values:L(...values)},into);
const q={};
q['claim.review.item']=[v('e','$eventInput.evidence'),v('m','$eventInput.method'),v('selected',['includes','$eventInput.selected','$e.id']),
 fold('$m.rules','rule','trials',L(),[
  fold('$rule.conditions','condition','checks',L(),[],append('$checks',{field:'$condition.field',expected:'$condition.expected',actual:A('$e','$condition.field'),passed:eq(A('$e','$condition.field'),'$condition.expected')}),'checks'),
  fold('$checks','check','passed',true,[],['and','$passed','$check.passed'],'passed')
 ],append('$trials',{id:'$rule.id',weight:'$rule.weight',units:'$rule.units',reason:'$rule.reason',matched:'$passed',checks:'$checks'}),'trials'),
 fold('$trials','trial','chosen',null,[],I(['and',N('$chosen'),'$trial.matched'],'$trial','$chosen'),'chosen'),
 v('admitted',['and','$selected',N(eq('$chosen',null))]),v('result',{id:'$e.id',name:'$e.name',direction:'$e.direction',source:'$e.sourceActor',independent:eq('$e.sourceIndependent','true'),selected:'$selected',admitted:'$admitted',weight:I('$admitted',A('$chosen','weight'),0),units:I('$admitted',A('$chosen','units'),0),reason:I(N('$selected'),'Removed from this sandbox snapshot.',I('$chosen',A('$chosen','reason'),'No rule matched. This method does not count this item.')),trials:'$trials'})];
q['claim.review.method']=[v('m','$eventInput.method'),
 fold('$eventInput.evidence','e','total',{support:0,challenge:0,sources:L(),rows:L()},[
  k('claim.review.item',{evidence:'$e',method:'$m',selected:'$eventInput.selected'},'row'),
  math('add',['$total.support',I(['and','$row.admitted',eq('$row.direction','Supports')],'$row.units',0)],'support'),
  math('add',['$total.challenge',I(['and','$row.admitted',eq('$row.direction','Challenges')],'$row.units',0)],'challenge'),
  v('sources',I(['and','$row.admitted','$row.independent',N(['includes','$total.sources','$row.source'])],append('$total.sources','$row.source'),'$total.sources'))
 ],{support:'$support',challenge:'$challenge',sources:'$sources',rows:append('$total.rows','$row')},'total'),
 v('sourceCount',['count','$total.sources']),math('greaterEqual',['$sourceCount','$m.minimum'],'enough'),math('greaterEqual',['$total.support','$m.thresholdUnits'],'supportCrossed'),math('greaterEqual',['$total.challenge','$m.thresholdUnits'],'challengeCrossed'),
 v('verdict',I(N('$enough'),'Undecided',I(['and','$supportCrossed','$challengeCrossed'],'Conflicted',I('$supportCrossed','Accepted',I('$challengeCrossed','Rejected','Undecided'))))),
 v('reason',I(N('$enough'),'Too few independent sources were admitted.',I(eq('$verdict','Conflicted'),'Both the support and challenge thresholds were reached.',I(eq('$verdict','Accepted'),'Support reached the threshold; challenge did not.',I(eq('$verdict','Rejected'),'Challenge reached the threshold; support did not.','Neither side reached the threshold.'))))),
 v('result',{method:'$m.id',result:'$verdict',reason:'$reason',support:'$total.support',challenge:'$total.challenge',independentSources:'$sourceCount',rows:'$total.rows'})];
q['claim.review.compare']=[fold('$eventInput.configuration.methods','method','results',L(),[k('claim.review.method',{method:'$method',evidence:'$eventInput.configuration.evidence',selected:'$eventInput.selected'},'review')],append('$results','$review'),'result')];
q['claim.review.html']=[v('input','$eventInput.node'),{call:'html.serialize'}];
const set=(key,value)=>p('state.set',{key,value}),get=(key)=>p('state.get',{key},key),on=(ref,event,query,extra={})=>p('browser.on',{ref,event,query,input:{},...extra});
q['claim.review.boot']=[set('selected',map('$data.configuration.evidence','e','$e.id')),on('#review-evidence','change','claim.review.change',{delegate:'input[data-evidence]'}),on('#review-reset','click','claim.review.reset'),k('claim.review.render',{})];
q['claim.review.change']=[p('browser.select',{selector:'#review-evidence input:checked'},'checked'),set('selected',map('$checked','field',A('$field.attributes','data-evidence'))),k('claim.review.render',{})];
q['claim.review.reset']=[set('selected',map('$data.configuration.evidence','e','$e.id')),each('$data.configuration.evidence','e',[p('browser.write',{ref:C('[data-evidence="', '$e.id','"]'),name:'checked',value:true})]),k('claim.review.render',{})];
const readable=x=>I(eq(x,'true'),'yes',I(eq(x,'false'),'no',x));
const checkLabels={evidenceType:'Kind of evidence',sourceCredentialed:'Credentialed source',sourceIndependent:'Independent source',peerReviewed:'Peer reviewed',retracted:'Retracted'};
q['claim.review.render']=[get('selected'),k('claim.review.compare',{configuration:'$data.configuration',selected:'$selected'},'reviews'),
 fold('$reviews','review','cards',L(),[
  v('method',['at',['filter','$data.configuration.methods','m',eq('$m.id','$review.method')],0]),
  math('divide',['$review.support',1000000],'support'),math('divide',['$review.challenge',1000000],'challenge'),
  math('multiply',['$support',50],'supportWidth'),math('multiply',['$challenge',50],'challengeWidth'),math('multiply',['$method.threshold',50],'thresholdWidth'),
  v('card',E('article',{class:'review-card','data-verdict':'$review.result'},el('p','claim-eyebrow','Method / 1.0.0'),E('h3',{},'$method.name'),el('p','review-method','$method.summary'),el('p','review-verdict','$review.result'),el('p','review-reason','$review.reason'),
   el('div','review-measures',...['support','challenge'].map(key=>el('div','review-measure',el('div','review-measure-label',E('span',{},key==='support'?'Support':'Challenge'),E('b',{},C('$'+key,' points'))),E('div',{class:'review-track','aria-hidden':'true'},E('span',{class:'review-fill '+key,style:C('width:','$'+key+'Width','%')}),E('i',{style:C('left:','$thresholdWidth','%')}))))),
   el('p','review-threshold',C('Threshold: ','$method.threshold',' points on either side. Independent sources: ','$review.independentSources',' / ','$method.minimum',' required.')),
   E('details',{},E('summary',{},'Read the reasoning'),el('div','review-trace',map('$review.rows','row',el('section','review-trace-item',E('h4',{},'$row.name'),el('p','review-item-status',I('$row.admitted',C('Included · ','$row.weight',' points · ',I(eq('$row.direction','Supports'),'supports','challenges')),I('$row.selected','Not counted','Removed from snapshot'))),E('p',{},'$row.reason'),I('$row.selected',map('$row.trials','trial',el('div','review-rule',el('p','review-rule-id','$trial.id'),I(eq(['count','$trial.checks'],0),E('p',{},'No conditions: this rule accepts every submitted item.'),el('ul',null,map('$trial.checks','check',E('li',{},C(I('$check.passed','Pass: ','Fail: '),A(checkLabels,'$check.field'),': ',readable('$check.actual'),'; needs ',readable('$check.expected')))))))),null)))))))
 ],append('$cards','$card'),'cards'),
 k('claim.review.html',{node:'$cards'},'markup'),p('browser.content',{ref:'#review-results',html:'$markup'}),
 p('browser.write',{ref:'#review-announcement',name:'textContent',value:C(['count','$selected'],' of 4 evidence items selected. ',A(A('$reviews',0),'result'),', ',A(A('$reviews',1),'result'),', ',A(A('$reviews',2),'result'),'. Results updated.')}),
 p('browser.write',{ref:'#review-loading',name:'hidden',value:true})];
save('algebra/claimipedia-review.process.json',{protocol:'temple/surface-process-module/1',queries:q});
// Data is retained as a REL publication fact, then parsed into the admitted bundle.
const config=read('source/claimipedia-example.json');
fs.writeFileSync('source/claimipedia-example.rel','("claimipedia.example", "configuration", '+JSON.stringify(JSON.stringify(config))+')\n');
for(const file of ['bootstrap/site.json','bootstrap/microsites-preview.json']){const manifest=read(file);manifest.modules=[...new Set([...manifest.modules,'algebra/claimipedia-review.process.json'])];manifest.sources=[...new Set([...manifest.sources,'source/claimipedia-example.rel'])];save(file,manifest);}
const page=read('algebra/claimipedia.process.json');
page.queries['claimipedia.build'].unshift(p('json.parse',{text:['one','claimipedia.example','configuration']},'claimConfiguration'),p('runtime.bundle',{entry:'claim.review.boot',mode:'browser',grantProfile:'micrositesBrowser',queries:L(...Object.keys(q),...Object.keys(read('algebra/html.process.json').queries)),factSubjects:L(),data:{configuration:'$claimConfiguration'},budget:20000000},'claimRuntime'),p('file.write',{path:'claimipedia/runtime.js',text:'$claimRuntime'}));
save('algebra/claimipedia.process.json',page);
