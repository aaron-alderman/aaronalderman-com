import { conversation, calibrationReading, projectionVisibility } from './encounter-data.js';

const label = text => `<p class="encounter-label">${text}</p>`;
export function renderEncounter(id){
 if(id==='calibration')return `${label('THE LENS BENCH / TRY A DIFFERENT AXIS')}<div class="lens-bench"><svg viewBox="0 0 400 340" role="img" aria-label="An illustrative axis rotates toward a hidden difference"><defs><radialGradient id="lensLight"><stop stop-color="#78d8ff" stop-opacity=".22"/><stop offset="1" stop-color="#78d8ff" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="165" r="145" fill="url(#lensLight)"/><g class="bench-grid"><circle cx="200" cy="165" r="110"/><circle cx="200" cy="165" r="70"/><path d="M40 165h320M200 15v300"/></g><g id="lens-axis" transform="rotate(0 200 165)"><path d="M65 165h270" class="axis-light"/><path d="m325 159 10 6-10 6" class="axis-light"/></g><circle cx="200" cy="165" r="5" class="origin"/><circle cx="200" cy="55" r="6" class="difference"/><text x="217" y="53" class="bench-text">HIDDEN DIFFERENCE</text></svg><label class="range-label" for="lens-angle">Turn the measuring line <output id="angle-value">0°</output></label><input id="lens-angle" type="range" min="0" max="90" value="0" step="1"><div class="bench-reading"><span>DIFFERENCE THIS VIEW SHOWS</span><output id="lens-value">0.00</output></div><p id="lens-caption" class="readout" aria-live="polite">At this angle, two different points share one reading.</p></div><p class="demo-note">A UNIT-VECTOR ILLUSTRATION · NOT THE FOUR-MODE EXPERIMENT</p>`;
 if(id==='listening')return `${label('A SMALL CONVERSATION / CHOOSE A RESPONSE')}<div class="conversation"><div class="speaker-orbit" aria-hidden="true"><span></span><i></i></div><p class="conversation-line">${conversation.opening}</p><div class="reply-options">${conversation.replies.map((r,i)=>`<button data-encounter="reply" data-reply="${i}" aria-pressed="false">${r.label}<span aria-hidden="true">↳</span></button>`).join('')}</div><div id="conversation-answer" aria-live="polite"><p class="encounter-hint">Try a response. You can take the conversation another way.</p></div></div><p class="demo-note">FICTIONAL DIALOGUE · NO SCORE · NO ANSWER SAVED</p>`;
 if(id==='permission')return `${label('THREE DOORS / AN ORDINARY DECISION')}<p class="decision-premise">A capable assistant has drafted a message that would change someone’s plans.</p><div class="decision-doors">${[['can','I can','The message is ready.'],['may','May I?','Who gets to authorize it?'],['should','Should I?','What does the situation call for?']].map(([key,title,sub],i)=>`<button class="decision-door" data-encounter="door" data-door="${key}" aria-pressed="false"><span>0${i+1}</span><strong>${title}</strong><small>${sub}</small></button>`).join('')}</div><div class="door-answer" id="door-answer" aria-live="polite">Open a door. Each answers a different question.</div><p class="demo-note">A FICTIONAL DECISION · THESE DOORS SEND NOTHING</p>`;
 if(id==='water'||id==='care')return `${label(id==='water'?'THE WATER’S EDGE / A PLACE TO LINGER':'A CLEARING / NOTHING TO COMPLETE')}<div class="quiet-landscape" data-quiet="${id}"><div class="quiet-moon" aria-hidden="true"></div><div class="quiet-hills" aria-hidden="true"></div><div class="quiet-water" aria-hidden="true"><i></i><i></i><i></i></div>${id==='water'?'<svg class="quiet-horse" viewBox="0 0 180 180" aria-hidden="true"><path d="m45 165 9-64 22-34 1-34 21 28 24-7 24 21 20 29-11 17-30-13-9 57"/><circle cx="132" cy="83" r="2"/></svg>':'<div class="quiet-lantern" aria-hidden="true">✧</div>'}<p class="quiet-words" id="quiet-words" aria-live="polite">${id==='water'?'Even the guide has a reflection.':'There is nothing to finish here.'}</p><button class="quiet-button" data-encounter="quiet" aria-pressed="false">${id==='water'?'Look into the water':'Leave a little room'}</button></div><p class="art-caption">${id==='water'?'A small fable. No horse was consulted.':'Stay as long as you like. The other paths will wait.'}</p>`;
 if(id==='monster')return `${label('THE CABINET / CHANGE THE DETECTOR')}<div class="cabinet"><div class="specimen"><span>E₈³</span><span>LEECH</span><span>MOONSHINE</span></div><div class="specimen-values" id="specimen-values"><strong>≈</strong><strong>≈</strong><strong>≈</strong></div><p id="cabinet-caption" aria-live="polite">These three mathematical structures look alike in the broad measurement.</p><div class="art-controls"><button class="control" data-encounter="cabinet" data-view="thermal" aria-pressed="true">Broad measurement</button><button class="control" data-encounter="cabinet" data-view="currents" aria-pressed="false">Detailed count</button></div><div class="cabinet-rays" aria-hidden="true"></div></div><p class="demo-note">DECLARED CANDIDATE FAMILY · NOT PHYSICAL IDENTIFICATION</p>`;
 if(id==='representation')return `${label('AN OBJECT WITH LAYERS / LIFT THE SURFACE')}<div class="map-object"><div class="map-sheet sheet-back" aria-hidden="true"></div><div class="map-sheet sheet-middle" aria-hidden="true"></div><div class="map-sheet sheet-front" aria-hidden="true"><span>THE MAP<br>IS A VIEW.</span></div></div><div class="object-controls"><button class="control" data-encounter="layer" data-layer="surface" aria-pressed="true">What it shows</button><button class="control" data-encounter="layer" data-layer="conditions" aria-pressed="false">What it assumes</button><button class="control" data-encounter="layer" data-layer="limits" aria-pressed="false">What it cannot prove</button></div><div class="layer-notes" aria-live="polite"><p><span>RECORD</span>A story based on a source.</p><p id="layer-conditions" hidden><span>CONDITIONS</span>Its meaning depends on its definitions, starting assumptions and source.</p><p id="layer-limits" hidden><span>LIMITS</span>A written plan for an experiment does not prove that it was carried out.</p></div>`;
 if(id==='revision')return `${label('THE VISIBLE SEAM / COMPARE TWO READINGS')}<div class="revision-object"><p class="seam-before">An elegant framework<br>for the new question.</p><span class="seam-line" aria-hidden="true"></span><button class="control" data-encounter="revision" aria-expanded="false" aria-controls="revision-after">Open the correction</button><div id="revision-after" hidden><p class="seam-after">The framework came<br>from another inquiry.</p><p class="art-caption">The interpretation was withdrawn. The next inquiry began with the mismatch.</p><button class="source-button" data-source="correction">Read the retained correction ↗</button></div></div>`;
 return '';
}

function pressWithin(button,selector){button.closest('.art-panel').querySelectorAll(selector).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
export function handleEncounter(event){
 const range=event.target.closest('#lens-angle');
 if(range&&event.type==='input'){
  const angle=Number(range.value),value=calibrationReading(angle);
  document.querySelector('#lens-axis').setAttribute('transform',`rotate(${-angle} 200 165)`);
  document.querySelector('#angle-value').textContent=`${angle}°`;
  document.querySelector('#lens-value').textContent=value.toFixed(2);
  document.querySelector('#lens-caption').textContent=angle===0?'At this angle, two different points share one reading.':angle===90?'The line now shows the full difference between the points.':'Turning the line makes part of the difference visible.';
  return true;
 }
 const button=event.target.closest('button[data-encounter]');if(!button||event.type!=='click')return false;
 const action=button.dataset.encounter,panel=button.closest('.art-panel');if(!panel)return false;
 if(action==='reply'){
  const reply=conversation.replies[Number(button.dataset.reply)];
  pressWithin(button,'[data-encounter="reply"]');
  const answer=document.querySelector('#conversation-answer');answer.replaceChildren();
  for(const [className,text] of [['conversation-line answer',reply.answer],['conversation-reflection',reply.question]]){const p=document.createElement('p');p.className=className;p.textContent=text;answer.append(p);}
 }
 if(action==='door'){
  pressWithin(button,'[data-encounter="door"]');
  const answers={can:'Capability: a draft exists. Producing it has not established permission to send it.',may:'Permission: the people and authority involved still need to be identified. Availability of a button is not that authority.',should:'Responsibility: consider timing, consequences and the people affected. Permission alone does not decide whether sending is wise.'};
  document.querySelector('#door-answer').textContent=answers[button.dataset.door];
 }
 if(action==='quiet'){
  const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));panel.classList.toggle('looking-closer',active);
  document.querySelector('#quiet-words').textContent=active?(currentQuiet(panel)==='water'?'Perhaps the water was never the difficult part.':'Who else needs room in this clearing?'):(currentQuiet(panel)==='water'?'Even the guide has a reflection.':'There is nothing to finish here.');
 }
 if(action==='cabinet'){
  const currents=button.dataset.view==='currents';pressWithin(button,'[data-encounter="cabinet"]');panel.classList.toggle('spectral',currents);
  document.querySelectorAll('#specimen-values strong').forEach((el,i)=>el.textContent=currents?['744','24','0'][i]:'≈');
  document.querySelector('#cabinet-caption').textContent=currents?'This detailed mathematical count tells the three structures apart.':'These three mathematical structures look alike in the broad measurement.';
 }
 if(action==='layer'){
  pressWithin(button,'[data-encounter="layer"]');const visibility=projectionVisibility(button.dataset.layer);panel.dataset.layer=button.dataset.layer;
  document.querySelector('#layer-conditions').hidden=!visibility.conditions;document.querySelector('#layer-limits').hidden=!visibility.limits;
 }
 if(action==='revision'){
  const expanded=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(expanded));document.querySelector('#revision-after').hidden=!expanded;button.textContent=expanded?'Keep the seam visible':'Open the correction';panel.classList.toggle('seam-open',expanded);
 }
 return true;
}
function currentQuiet(panel){return panel.querySelector('[data-quiet]').dataset.quiet;}
