// Authored invitations, not inferred reader states or new scientific results.
export const encounterKinds = {
 observation:'experiment', return:'experiment', instrument:'experiment',
 calibration:'experiment', listening:'conversation', permission:'decision',
 water:'quiet', care:'quiet', monster:'experiment', representation:'object', revision:'comparison'
};

export const conversation = {
 opening:'“I know the plan makes sense. I’m not sure I can keep doing it.”',
 replies:[
  {label:'Offer a more efficient plan',answer:'“That might help later. I was trying to tell you what it is costing me.”',question:'The problem you solved may be adjacent to the one being offered.'},
  {label:'Ask what has become difficult',answer:'“It feels as though the plan has become more important than the people in it.”',question:'A question can make room for information the plan did not contain.'},
  {label:'Ask what they need from this conversation',answer:'“Could we work out what to keep, and what I’m allowed to put down?”',question:'The speaker gets a chance to help define the encounter.'}
 ]
};

export const echoes = {
 observation:{after:'listening',heading:'A different kind of instrument',text:'You have also visited The unasked question. Try the detector again with this beside it: what does the way you ask make possible to hear?',to:'listening'},
 care:{after:'restraint',heading:'The open hand, brought back here',text:'You have also encountered restraint. Who has room to act in this scene, and who might need protection?',to:'restraint'},
 kenosis:{after:'permission',heading:'Three doors are still open',text:'You have encountered capability, permission and responsibility separately. Which question is this passage asking now?',to:'permission'},
 return:{after:'revision',heading:'An earlier place, another reading',text:'You have visited The visible seam. A changed mathematical frame and a corrected explanation are different things; what makes the association useful to you?',to:'revision'},
 water:{after:'listening',heading:'The guide can listen too',text:'You have visited The unasked question. The horse’s reflection offers the guide another chance to begin.',to:'listening'}
};

export const horizons = {
 unseen:[{to:'listening',label:'When the question is the instrument',reason:'An editorial crossing: a detector’s limits invite a question about the limits of listening.'},{to:'representation',label:'Meet the person drawing the map',reason:'From a measurement to the representation that carries it.'}],
 human:[{to:'calibration',label:'Borrow a different ruler',reason:'An editorial association: agreement and understanding both deserve a reference.'},{to:'restraint',label:'Find the boundary of the clearing',reason:'Follow attention into the question of agency and protection.'}],
 boundary:[{to:'water',label:'The horse is still by the water',reason:'Leave the argument for a fable about the person offering it.'},{to:'replay',label:'Enter the replay room',reason:'Follow accountability into a record someone else can check.'}]
};

export function projectionVisibility(layer){
 return {record:true,conditions:layer!=='surface',limits:layer==='limits'};
}

export function calibrationReading(angle){
 // A deliberately simple projection of the illustrative point (0, 1).
 // This does not calculate the corpus's four-mode model.
 const radians=Number(angle)*Math.PI/180;
 return Math.round(Math.sin(radians)*100)/100;
}
