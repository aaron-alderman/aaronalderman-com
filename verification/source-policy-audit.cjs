'use strict';
// Compatibility launcher only. All scenarios and assertions are Encounter.
const filters=['test.audit'];
if(process.argv.includes('--publication'))filters.push('test.publication','test.boundary');
require('../bootstrap/test.cjs').run(filters).catch(error=>{console.error(error);process.exitCode=1;});
