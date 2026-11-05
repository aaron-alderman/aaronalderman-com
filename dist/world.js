import { installExpansion } from './expansion.js';
export const sources = {
  reflection: { title: 'Reader recognition, truth and the water', kind: 'Authored reflective scene · composition proposal', path: 'corpus/programmes/worldwright-storytelling/author-notes.md', note: 'These fictional encounters develop Aaron’s invitation to address the reader, allow humour and use the horse-and-water reflection image. They are assistant-authored composition proposals, not additional autobiography, psychological findings or advice about a particular relationship.' },
  frontier: { title: 'The admissibility frontier', kind: 'Current research synthesis', path: 'corpus/syntheses/the_admissibility_frontier_current_synthesis.md', note: 'Experiments can erase phase, delay, boundary order, orientation and correlations. The programme asks which distinguishing records an apparatus could preserve. The physical identification of the proposed structures remains open.' },
  invariant: { title: 'The locally invariant carrier and its mirror face', kind: 'Exact mathematical construction', path: 'corpus/programmes/admissibility/admissibility_123_locally_invariant_carrier_and_mirror_face_spine.md', note: 'Pointwise invariance, compatible transport and trivial global return are separate claims. A loop can preserve the comparison structure and still return the transported state changed. Physical carrier identification remains open.' },
  detector: { title: 'Scalar impedance and dark holonomy', kind: 'Finite model result', path: 'corpus/programmes/admissibility/admissibility_152_scalar_impedance_cannot_identify_dark_holonomy_but_matrix_residues_can.md', note: 'In the finite witness, the scalar port e₄ is orthogonal to the moving dark plane. Its response is independent of the loop parameter. Full matrix residues recover the projector; a calibrated sufficiently ranked port set is needed experimentally.' },
  instrument: { title: 'The four-mode virtual instrument', kind: 'Documented virtual experiment', path: 'corpus/programmes/admissibility/admissibility_161_a_node_only_four_mode_virtual_instrument_closes_the_software_gate.md', note: 'The corpus documents a deterministic 24-run virtual experiment and replay certificate. Real-time I/O and physical hardware remain external. This website provides an explanatory illustration, not a replay of those calculations.' },
  contact: { title: 'From felt mismatch to inspectable structure', kind: 'Applied epistemology proposal', path: 'corpus/programmes/epistemology/frontier_epistemology_06_from_felt_wrong_to_legible_structure.md', note: 'The inquiry begins with a recognition that a response missed the point. It develops contrast cases and rival explanations, with prediction on fresh examples as the next test. It does not establish a universal model of tacit knowledge.' },
  correction: { title: 'The withdrawn cross-context interpretation', kind: 'Retained correction', path: 'corpus/programmes/epistemology/frontier_epistemology_05_reconstructing_the_illegible_structure_as_path_holonomy.md', note: 'Withdrawn on 19 October 2026 for importing an unrelated physics programme into the illegible-knowledge inquiry. Its proposed interpretation should not be treated as an established bridge.' },
  kenosis: { title: 'Kenotic governance and shared responsibility', kind: 'Theological and philosophical argument', path: 'corpus/syntheses/kenotic_governance_tri_omni_theism_and_a_lawful_world.md', note: 'Capability, moral permission and an obligation to exercise power are distinguished. Restraint must also be examined where one agent destroys another’s effective agency. The argument remains defeasible and is not a physical derivation.' },
  sourcery: { title: 'Programme algebra', kind: 'Software and representation programme', path: 'corpus/programmes/programme-algebra/README.md', note: 'The science programme is expressed through the compositional grammar used by Sourcery. Typed objects preserve assumptions, evidence and refused transformations. A complete protocol does not establish that an experiment ran.' },
  monster: { title: 'The rank-24 detector ladder', kind: 'Exact within a declared candidate family', path: 'corpus/programmes/translation-free-exceptional-topology/RANK24_DETECTOR_LADDER.md', note: 'E₈³, Leech and Moonshine candidates share a coarse thermal signature. Their weight-one current dimensions are 744, 24 and 0. The three-way distinction is not an unrestricted uniqueness theorem or evidence that a physical system realizes the Monster.' },
  personal: { title: 'Aaron’s personal account', kind: 'Author account · working draft', note: 'Adapted from Aaron’s account in the originating conversation. These passages express his experience. They do not independently establish another family member’s perspective, intentions or a causal explanation of the family’s experience. Wording remains open to his revision.' }
};

export const scenes = {
  observation: { chapter: '01', region: 'Observation', title: 'What did the\nmeasurement miss?', lead: 'Two different systems can leave the same record.', body: ['Sometimes the next discovery begins by preserving a distinction the instrument discarded. More data from the same narrow view may never reveal it.', 'Choose a different way of looking. What becomes visible?'], art: 'detector', source: 'frontier', position: [18,25], choices: [
    {to:'return', label:'Can something return changed?', detail:'Follow the mathematics of a journey.', type:'Research connection'},
    {to:'contact', label:'Does this happen between people?', detail:'When a fluent answer misses the point.', type:'A related question'},
    {to:'monster', label:'What would reveal the Monster?', detail:'Give rival structures the same detector.', type:'Another research trail'}]},
  return: { chapter:'02', region:'The return', title:'Back where you started.\nSomething has changed.', lead:'A relationship can survive every step while the journey leaves a trace.', body:['Transport around a loop can return a state with a different orientation, even when the local comparison was preserved. The mathematical question is called holonomy.','The next question is practical: would your instrument notice?'], art:'loop', source:'invariant', position:[39,18], choices:[
    {to:'instrument',label:'Build a way to see it',detail:'A hidden plane and a richer measurement.',type:'Experimental trail'},
    {to:'personal',label:'What remains when relationships change?',detail:'A passage from my own experience.',type:'Personal association'},
    {to:'observation',label:'Look again at the measurement',detail:'Return with a different question.',type:'Return'}]},
  instrument: {chapter:'03',region:'The instrument',title:'The change can be real.\nThe detector can miss it.',lead:'A scalar channel can be blind to an entire moving subspace.',body:['In the finite corpus example, one measured response stays unchanged while a hidden two-dimensional plane makes a quarter-turn. A calibrated matrix measurement can recover the moving projector.','The corpus develops this into a four-mode virtual instrument. Physical acquisition is a separate next step.'],art:'detector',source:'detector',position:[61,14],choices:[
    {to:'return',label:'Return to the fork',detail:'Follow another meaning of the question.',type:'Return'},
    {to:'sourcery',label:'How do you preserve what a model knows?',detail:'Representations, evidence and acceptance.',type:'Editorial connection'},
    {to:'monster',label:'Try a different detector problem',detail:'Three structures. One coarse signature.',type:'Research trail'}]},
  personal: {chapter:'04',region:'Love, separation and trust',title:'I trusted\nthe process.',lead:'A personal field note.',body:['I experienced my children becoming alienated from me. It broke my heart. My marriage suffered, and my wife left.','I took kenosis seriously. I trusted the process. Along the way, I had to remember to care. In the intensity of everything, it could become totalizing.'],art:'personal',source:'personal',position:[36,49],personal:true,choices:[
    {to:'kenosis',label:'What did kenosis mean to me?',detail:'Power, restraint and responsibility.',type:'Follow the concept'},
    {to:'care',label:'Remember to care',detail:'Return to the people within the idea.',type:'Stay with the human question'},
    {to:'return',label:'Return to the mathematical trail',detail:'The personal connection remains an association.',type:'Return'}]},
  care: {chapter:'05',region:'Care',title:'Remember\nto care.',lead:'What needs my attention here?',body:['Who is carrying the cost? What have I stopped noticing?','Care can mean attention, protection, a boundary, or the willingness to revise an explanation. These are questions I am still carrying.'],art:'care',source:'personal',position:[56,53],personal:true,choices:[
    {to:'contact',label:'When an explanation loses contact',detail:'A real correction in the corpus.',type:'Editorial connection'},
    {to:'kenosis',label:'When restraint needs to become protection',detail:'Examine the limits of leaving things alone.',type:'Follow responsibility'},
    {to:'personal',label:'Stay with the personal account',detail:'No final lesson is required.',type:'Return'}]},
  contact: {chapter:'06',region:'Contact & correction',title:'Beautiful words.\nThe wrong answer.',lead:'You can recognise a mismatch before you can fully explain it.',body:['One inquiry began when a polished explanation imported an old framework into a different question. It sounded coherent. It had missed the person speaking.','The interpretation was withdrawn. The next inquiry began with the recognition of that failure, then used contrast cases and competing explanations to investigate it.'],art:'contact',source:'contact',position:[75,39],choices:[
    {to:'sourcery',label:'What should a machine help us do?',detail:'Assist judgment while keeping people accountable.',type:'Editorial connection'},
    {to:'care',label:'Come back to care',detail:'Attention as a practice of making contact.',type:'Personal association'},
    {to:'observation',label:'What else does a representation leave out?',detail:'Revisit the detector question.',type:'A related question'}]},
  kenosis: {chapter:'07',region:'Power & agency',title:'If you could control\neverything, should you?',lead:'Capability does not settle how power should be exercised.',body:['Kenosis asks how power can make room for another person’s agency. Restraint, trust and formation matter. So do protection and responsibility.','The difficult boundary is where restraint permits one person to destroy another’s effective agency. Care can require intervention.'],art:'care',source:'kenosis',position:[18,68],choices:[
    {to:'care',label:'Who is carrying the cost?',detail:'Return to particular people and needs.',type:'Follow the human question'},
    {to:'sourcery',label:'Build systems around accountable agency',detail:'What people should retain as machines grow capable.',type:'Editorial connection'},
    {to:'personal',label:'Why I took this question seriously',detail:'Return to the personal passage.',type:'Personal account'}]},
  sourcery: {chapter:'08',region:'Sourcery',title:'More capable machines.\nMore consequential people.',lead:'What should we delegate—and what should we remain responsible for?',body:['A system can help make complex work understandable and changeable. It can expose assumptions, propose alternatives and test consequences.','People still carry situated knowledge and live with the consequences. The programme-algebra work explores how representations can preserve evidence, refusals and the boundaries of acceptance.'],art:'sourcery',source:'sourcery',position:[83,70],choices:[
    {to:'contact',label:'What does the model fail to hear?',detail:'Return to tacit knowledge and contact.',type:'Return'},
    {to:'kenosis',label:'What should power leave alone?',detail:'Revisit agency from another direction.',type:'Editorial connection'},
    {to:'care',label:'Keep care in the loop',detail:'The person within the process.',type:'Personal association'}]},
  monster: {chapter:'09',region:'The Monster trail',title:'A familiar number\nisn’t a witness.',lead:'Make rival explanations disagree before you name the discovery.',body:['Three rank-24 candidates share the same coarse thermal signature. Their weight-one current dimensions—744, 24 and 0—separate the declared E₈³, Leech and Moonshine family.','Even that is one gate on a longer path. The physical carrier, boundary algebra and exclusive detector prediction still have to be established.'],art:'monster',source:'monster',position:[79,18],choices:[
    {to:'observation',label:'Return to what the detector discards',detail:'The research question beneath the hunt.',type:'Return'},
    {to:'instrument',label:'Explore the smaller experiment',detail:'A concrete finite witness and an open physical test.',type:'Research connection'},
    {to:'sourcery',label:'How could many people explore this together?',detail:'Typed evidence and composable contributions.',type:'Editorial connection'}]}
};

// New encounters retain their own questions and sources. Editorial crossings are
// invitations to compare; they do not promote an analogy into a research result.
Object.assign(scenes, {
  calibration: {chapter:'10',region:'The borrowed ruler',title:'Before you trust the reading,\ncheck the ruler.',lead:'A more elaborate instrument can still be wrong in a more elaborate way.',body:[
    'The hidden-plane example does not say that any collection of extra channels will reveal the answer. The ports must reach the relevant subspace, and their relationship to the system must be calibrated. More readings are useful only if you know what they are readings of.',
    'Imagine measuring a table with three rulers that all stretched in the same heat. Agreement would be reassuring. It would not supply the missing reference. This is an analogy for the question of access and calibration, not a further result of the finite model.',
    'Before asking what the system did, ask what the apparatus could distinguish. Which states would still look identical through these ports? A blank region on that map is a reason to design another measurement.'
  ],art:'study',source:'detector',study:['ACCESS','What can reach the detector?','REFERENCE','What fixes the comparison?','DISTINCTION','Which rivals separate?'],pause:'What would remain invisible even if every reading agreed?',choices:[
    {to:'instrument',label:'Return to the hidden plane',detail:'Read the richer measurement with its calibration condition in view.',type:'Research connection'},
    {to:'replay',label:'Let someone check the record',detail:'A result needs more than a persuasive display.',type:'Research trail'},
    {to:'listening',label:'And when the instrument is a question?',detail:'An editorial crossing into how we listen.',type:'Editorial association'}]},
  replay: {chapter:'11',region:'The replay room',title:'An answer you can\nwalk back through.',lead:'The useful artifact is a result with enough of its conditions left attached.',body:[
    'The four-mode virtual instrument retains more than a returned angle. Its record includes a complex return matrix, populations, loss, control work and the configuration that produced them. A separate verifier replays the saved configuration and checks those records.',
    'The documented design crosses two model settings with four rates and three path controls: forward, reverse and fixed. Those comparisons make a more demanding question possible. Does the proposed effect survive the controls, and what changes when declared imperfections are included?',
    'This room describes that recorded software experiment. It does not run it in your browser, and a successful numerical replay does not supply a physical apparatus. The next threshold remains an actual acquisition with its own calibration and uncertainties.'
  ],art:'study',source:'instrument',study:['PREPARE','Retain the configuration','COMPARE','Forward · reverse · fixed','REPLAY','Check the saved record'],pause:'What would another person need to discover that your result was wrong?',choices:[
    {to:'monster',label:'Ask a rival to disagree',detail:'A detector becomes useful where candidates separate.',type:'Research connection'},
    {to:'representation',label:'Keep the conditions attached',detail:'What a representation owes the work it carries.',type:'Editorial connection'},
    {to:'calibration',label:'Check what the ports can see',detail:'Reproducibility and calibration answer different questions.',type:'Return'}]},
  water: {chapter:'12',region:'The water’s edge',title:'The horse has\na few questions.',lead:'You led it to water. It is looking at the reflection.',body:[
    'The guide points at the water. The horse looks down. There is already a horse in there, and it appears to have strong opinions about the guide. Nobody mentioned a committee.',
    'Perhaps the next explanation can wait. In this little fable, the offered lesson has become an encounter with the person trying to offer it. The guide can inspect the water too. What looked like refusal might reveal something about the invitation.',
    'You are free to read the reflection differently—or simply enjoy a horse declining a very well-prepared presentation. The story has no access to your private reasons. It can offer a surface to look into, then leave you room to decide what you see.'
  ],art:'water',source:'reflection',pause:'When you offer someone an answer, what else might they be encountering?',choices:[
    {to:'listening',label:'Put down the presentation',detail:'Make room for a question you did not prepare.',type:'Reflective passage'},
    {to:'discomfort',label:'Look at the inconvenient reflection',detail:'Recognition can ask something of the guide too.',type:'Reflective passage'},
    {to:'care',label:'Sit by the water a while',detail:'There is no compulsory moral to carry away.',type:'Return'}]},
  discomfort: {chapter:'13',region:'The inconvenient truth',title:'Truth hurts.\nSo can being wrong.',lead:'The sting does not tell you which one this is.',body:[
    'Suppose a fact threatens an explanation you have worked hard to build. You can defend the explanation, discard it, or slow down enough to distinguish the record from what you have made it mean. None of those movements becomes correct simply because it feels difficult.',
    '“Truth hurts” is Aaron’s originating phrase for this reflective territory. Here it becomes a question rather than a verdict. Discomfort might accompany an unwelcome fact, a mistaken accusation, an incomplete account, or the discovery that your own frame has become too small.',
    'The invitation is to find a check outside the feeling: a source, a contrast case, a question you can ask again. You need not confess anything to the story. Carry the question privately, or leave it here.'
  ],art:'study',source:'reflection',study:['NOTICE','Something does not fit','SEPARATE','Record · interpretation · feeling','CHECK','What could distinguish them?'],pause:'Which part can you check without first deciding who was right?',choices:[
    {to:'contact',label:'See an explanation actually withdrawn',detail:'A retained correction gives the question a concrete case.',type:'Source-grounded crossing'},
    {to:'revision',label:'Keep a way to change your mind',detail:'What revision should preserve.',type:'Editorial connection'},
    {to:'water',label:'Visit the uncooperative horse',detail:'The guide may need the reflection too.',type:'Reflective passage'}]},
  listening: {chapter:'14',region:'The unasked question',title:'What are they\ntrying to do?',lead:'A fluent answer can arrive at the wrong destination.',body:[
    'In the recorded correction, the failure was more specific than an incorrect sentence. An earlier framework had captured a new inquiry. Shared conversation history was mistaken for continuity of subject. The response had stopped following the person who was speaking.',
    'The successor inquiry proposes several alignments to examine: the subject, the speaker’s intention, the scale of the answer, the relevance of old context and the consequence of replying this way. These are candidate cues from a case, not a universal instrument for reading people.',
    'Try the question on an ordinary encounter: is the person requesting a solution, testing an idea, telling you something, or asking to be heard? The answer remains theirs to correct. A useful first move can be an interpretation light enough to put down.'
  ],art:'study',source:'contact',study:['SUBJECT','Are we discussing the same thing?','INTENTION','What are they trying to do?','CORRECTION','Can their reply change the frame?'],pause:'What would you ask if your favourite explanation were unavailable?',choices:[
    {to:'contact',label:'Read the original mismatch',detail:'Keep the proposed lesson attached to its particular case.',type:'Source connection'},
    {to:'water',label:'Hear from the horse',detail:'The invitation may have another meaning to its recipient.',type:'Editorial association'},
    {to:'restraint',label:'Leave room for an answer',detail:'Listening and agency meet at a boundary.',type:'Editorial association'}]},
  restraint: {chapter:'15',region:'The open hand',title:'Leaving room\nis still a choice.',lead:'Restraint needs an account of whom it enables—and whom it leaves exposed.',body:[
    'The kenotic argument treats power as something governed by love rather than exhausted by control. Making room for another agent is a positive commitment: their choices must be consequential enough to count as their own.',
    'That commitment is not an absolute rule against intervention. The same argument retains boundaries and responsibility for protection. If one agent is consuming another’s effective freedom, leaving the arrangement alone can preserve domination rather than make room for agency.',
    'This is a philosophical boundary to examine, not an instruction about your own situation. Ask whose room is growing, whose is shrinking, and what evidence would challenge the comfortable description of your choice.'
  ],art:'care',source:'kenosis',pause:'Whose freedom does this restraint make possible?',choices:[
    {to:'permission',label:'Distinguish three different questions',detail:'Can, may and should do not collapse into one.',type:'Conceptual connection'},
    {to:'care',label:'Ask who carries the cost',detail:'Return from the principle to particular people.',type:'Reflective crossing'},
    {to:'kenosis',label:'Read the larger argument',detail:'Keep this boundary inside its theological and philosophical scope.',type:'Return'}]},
  permission: {chapter:'16',region:'Three doors',title:'I can.\nMay I? Should I?',lead:'An available action has not yet answered the question of its use.',body:[
    'Capability asks what an agent can bring about. Permission asks which actions are legitimate. Responsibility asks what the situation calls for among those possibilities. The kenotic synthesis separates these questions before developing its account of divine action.',
    'The distinction also supplies an editorial question for machine delegation. A system may be able to generate a proposal, alter a record or carry out a plan. That ability alone cannot settle who should authorize the act or remain answerable for its consequences.',
    'Notice where an interface makes these doors appear to be one door. A smooth path from suggestion to execution can conceal the moment at which another person’s judgment was needed. The design question is where to make that moment legible.'
  ],art:'study',source:'kenosis',study:['CAPABILITY','What can happen?','PERMISSION','What is legitimate?','RESPONSIBILITY','What does this situation call for?'],pause:'Which door have you been treating as if it opened the other two?',choices:[
    {to:'sourcery',label:'Take the question into a machine',detail:'Delegation without losing the accountable person.',type:'Editorial connection'},
    {to:'representation',label:'Inspect what the proposal carries',detail:'Sources, conditions and missing information.',type:'Editorial connection'},
    {to:'restraint',label:'Return to the open hand',detail:'Sometimes power serves by making room.',type:'Return'}]},
  representation: {chapter:'17',region:'The mapmaker’s debt',title:'Every map\nleaves something out.',lead:'The question is whether you can discover what was lost.',body:[
    'Programme algebra is a parallel representation of the corpus. Its declared purpose is to preserve structure, provenance and refused transformations in a compositional grammar. The prose sources retain their authority; a generated projection does not become an independently editable truth.',
    'The source distinguishes several depths. Recording a document and its links is different from admitting a scientific transformation. A protocol can contain all required fields without the experiment ever having run. These differences need to survive the trip into a more convenient view.',
    'Apply the same question to this expedition. A station is an authored reading, a passage is a proposed connection, and a field note describes its source and limit. Following a path does not prove the connection. This map owes you a way to see that distinction.'
  ],art:'study',source:'sourcery',study:['SOURCE','Where does this come from?','PROJECTION','What does this view retain?','BOUNDARY','What must not be inferred?'],pause:'What would become easier to misunderstand if this map looked authoritative?',choices:[
    {to:'revision',label:'Leave the correction visible',detail:'A better map can retain the route that failed.',type:'Editorial connection'},
    {to:'replay',label:'Ask for the actual record',detail:'A complete description is not evidence of execution.',type:'Editorial connection'},
    {to:'sourcery',label:'Return to accountable systems',detail:'What should the representation help a person decide?',type:'Return'}]},
  revision: {chapter:'18',region:'The visible seam',title:'Let the correction\nleave a seam.',lead:'A revised explanation need not pretend it was always the explanation.',body:[
    'The corpus retains the withdrawn cross-context interpretation as well as the inquiry that followed it. The predecessor imported physics into a different problem. Its withdrawal limits what readers should take from it; the successor begins again from the specific mismatch.',
    'An immaculate story could smooth away that interruption. Keeping it visible makes another reading possible: the work did not become trustworthy by never losing contact. Here, a correction changed its direction. That is a particular retained event, not a guarantee about every later claim.',
    'On returning to an earlier station, ask what you now read differently. The earlier scene has not secretly changed, and the site does not infer what you learned. The new perspective belongs to you. A route can finish with a more precise question.'
  ],art:'contact',source:'correction',pause:'What would you retain so a future reader could understand why you changed course?',choices:[
    {to:'observation',label:'Look at the first question again',detail:'What does a measurement miss—and what does a story miss?',type:'Return with a question'},
    {to:'contact',label:'Read the successor inquiry',detail:'From a retained failure to a candidate test.',type:'Source connection'},
    {to:'discomfort',label:'Stay with the discomfort',detail:'A changed mind need not become a finished lesson.',type:'Reflective crossing'}]}
});

export const territories = [
 {id:'unseen',name:'The unseen',question:'What would let you tell the difference?',note:'From a hidden distinction to a record someone else can check.',scenes:['observation','return','instrument','calibration','replay','monster']},
 {id:'human',name:'The human',question:'What have you stopped noticing?',note:'Personal witness, unfamiliar reflections, and the work of making contact.',scenes:['personal','care','contact','listening','discomfort','water']},
 {id:'boundary',name:'The boundary',question:'What does responsible power make room for?',note:'Agency, delegation, representations, and the freedom to revise.',scenes:['kenosis','restraint','permission','sourcery','representation','revision']}
];

// Place the deeper routes at the questions that motivate them.
scenes.instrument.choices.unshift({to:'calibration',label:'Who calibrated the richer view?',detail:'More channels do not automatically mean more knowledge.',type:'Go deeper'});
scenes.monster.choices.unshift({to:'replay',label:'What record would make a witness?',detail:'Controls, configuration and an independently checkable replay.',type:'Go deeper'});
scenes.care.choices.unshift({to:'water',label:'Meet a horse with reservations',detail:'A little humour at the edge of a difficult reflection.',type:'Reflective passage'});
scenes.contact.choices.unshift({to:'listening',label:'What was the person trying to do?',detail:'Examine the mismatch before reaching for another theory.',type:'Go deeper'});
scenes.kenosis.choices.unshift({to:'restraint',label:'When does leaving room leave someone exposed?',detail:'An open hand still has responsibilities.',type:'Go deeper'});
scenes.sourcery.choices.unshift({to:'representation',label:'What does this map owe its territory?',detail:'Keep sources, projections and acceptance distinct.',type:'Go deeper'});

export const entrances = [
 {to:'observation',number:'01',name:'The unseen',question:'What can’t we see?',note:'Measurement, memory & the hidden distinction',symbol:'◉'},
 {to:'kenosis',number:'02',name:'The boundary',question:'What should power leave alone?',note:'Agency, faith & the limits of control',symbol:'◇'},
 {to:'care',number:'03',name:'The human',question:'How do you keep caring?',note:'Love, intensity & finding contact again',symbol:'✧'}
];

// Encounter workshop: an additive stop; existing encounters and choices are retained.
sources.authorship = {
  "title": "Human authorship, assisted by AI",
  "kind": "Product philosophy · inspectable example",
  "url": "workshop/source-manifest.txt",
  "note": "Developed with Aaron in the Encounter discussion: remove unnecessary labour, preserve human authorship, and make consequences and evidence inspectable. Autonomy, human taste and risk-appropriate assurance are design commitments. The accompanying example executes a bounded typed edit through the existing Temple kernel. Its checks do not establish independent verification, a complete authoring environment, employment outcomes or a measured productivity multiplier."
};
Object.assign(scenes.sourcery, {
  "lead": "Less unnecessary labour. More room for human authorship.",
  "body": [
    "The aim is to let AI take on more programming work while people retain expertise, taste, discretion and responsibility. People decide what is worth making, who it serves and whether the experience is good.",
    "Open architecture should mean more than being handed source code. It should let you understand the decisions, follow a value to its source, challenge a rule and change the workings. The architecture should remain revisable.",
    "Assurance should fit the consequences. A typed check, an automated test, a human review and independent verification are different kinds of evidence. We should say which happened, against which version, and what remains unknown.",
    "AI can remain a collaborator throughout. The intention is to make expertise go further; any claim about productivity or jobs would need evidence of its own."
  ],
  "source": "authorship"
});
scenes.sourcery.choices.unshift({
  "to": "workshop",
  "label": "Try a change and follow its consequences",
  "detail": "A live infographic: one story, two views, and a visible route back.",
  "type": "Enter the workshop"
});
scenes.workshop = {
  "chapter": "19",
  "region": "The workshop",
  "title": "Can you follow\na change?",
  "lead": "The purpose belongs to you. The workings should be within reach.",
  "body": [
    "Start with a story called “What happened”. A web menu calls it “The story”; a row follows the original title. Change one of those values and see what follows—and what keeps its own wording.",
    "The living infographic opens the route from meaning to types, projections, contextual overlays, algebra and HTML. An edit returns to its declared source, then the checked process rebuilds and verifies the visible result.",
    "This is a small working example of a larger intention: remove unnecessary labour, preserve human authorship, and make the consequences understandable and the evidence inspectable. You can read its rules and source. General programme editing and a complete authoring environment remain future work."
  ],
  "art": "sourcery",
  "source": "authorship",
  "position": [
    52,
    82
  ],
  "experience": {
    "href": "workshop/index.html",
    "label": "Open the living infographic",
    "note": "Edit two real values. Inspect the source, algebra and generated HTML. Changes stay in your tab; reload to start again."
  },
  "choices": [
    {
      "to": "sourcery",
      "label": "What should the machine leave to us?",
      "detail": "Autonomy, taste and evidence proportionate to the consequences.",
      "type": "The product philosophy"
    },
    {
      "to": "contact",
      "label": "What if a polished result misses the point?",
      "detail": "Keep human recognition and correction in reach.",
      "type": "A related question"
    },
    {
      "to": "care",
      "label": "Who is this helping?",
      "detail": "Bring the purpose back to particular people.",
      "type": "Return to care"
    }
  ]
};
territories.find(t => t.id === 'boundary').scenes.push('workshop');
installExpansion(scenes,sources,territories);
