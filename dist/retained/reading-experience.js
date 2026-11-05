import {activityInstructions} from './reading-guide.js';

const activityNames={observation:'Two signals, two ways to look',instrument:'Two signals, two ways to look',return:'Go round the loop',calibration:'Turn the measuring line',listening:'Try a conversation',permission:'Three questions before acting',monster:'A broad view and a detailed count',representation:'Look beneath the map',revision:'See why an explanation changed',possibility:'Which pairs fit the rule?',reachable:'Is there a route from A to C?',memory:'Hide a line, or change the calculation',erasure:'What can one number tell you?',attention:'A close view and a broad view',will:'From choosing to acting',stone:'Three ways to investigate a stone',preservation:'Why might a mark be missing?',tiling:'Apply a counting rule',code:'Try a simple error-correcting message',laboratory:'Choose a way to compare explanations',cost:'Compare what returns with what is lost',cosmos:'Three open questions in physics',scale:'What changes when you group the cells?',coexistence:'Read a computer model’s results',weights:'What should the score value?',hiddenness:'An optional religious reading',hope:'An optional Christian account of hope',texts:'Different kinds of evidence for a reading',commons:'What helps someone else check your work?',closedpath:'Different kinds of failure'};
const notes={observation:'A drawing that explains an idea, not measured data.',instrument:'A drawing that explains an idea, not measured data.',return:'A drawing of return and change, not a physical simulation.',calibration:'A small mathematical example, separate from the larger research experiment.',listening:'A fictional conversation. No score is given and no reply is saved.',permission:'A fictional decision. No message is sent.',monster:'A mathematical comparison of these three structures.',possibility:'Two mathematical examples. They do not establish a law of nature.',memory:'A small computer calculation that explains an idea. It is not the larger research experiment.',erasure:'A small example of what a record keeps and leaves out.',attention:'A change to the drawing, not an assessment of your attention.',tiling:'The number rule is exact. The ornament is decorative.',code:'A small example code. One flipped bit can be repaired; two can give the wrong answer.',cost:'Reported computer results. Percentages are rounded to two decimal places.',scale:'An example of grouping information, not a proof about physics.',weights:'Invented scores for two imaginary plans. No people are scored.',hiddenness:'You can leave the question open.',hope:'You can leave the question open.'};

export function prepareReadingExperience(root,id){
 const panel=root.querySelector('.art-panel');if(!panel)return;
 const instruction=activityInstructions[id];
 if(instruction&&!panel.querySelector('.activity-help')){
  const help=document.createElement('p');help.className='activity-help';help.id='activity-help';help.textContent=instruction;panel.prepend(help);
 }
 for(const label of panel.querySelectorAll('.encounter-label'))if(activityNames[id])label.textContent=activityNames[id];
 if(notes[id])for(const note of panel.querySelectorAll('.demo-note,.world-note'))note.textContent=notes[id];
 for(const equation of panel.querySelectorAll('.equation-note')){
  if(equation.closest('.calculation-detail'))continue;
  const details=document.createElement('details');details.className='calculation-detail';
  const summary=document.createElement('summary');summary.textContent='See the calculation';details.append(summary);
  equation.before(details);details.append(equation);
 }
 syncCalculationDetails(root);
}
export function syncCalculationDetails(root){
 for(const details of root.querySelectorAll('.calculation-detail'))details.hidden=[...details.querySelectorAll('.equation-note')].every(p=>p.hidden);
}
