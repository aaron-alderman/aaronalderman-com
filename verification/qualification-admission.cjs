'use strict';
// Compatibility launcher. Source selection and admission checks are Encounter.
require('../bootstrap/test.cjs').run(['test.application']).catch(error=>{console.error(error);process.exitCode=1;});
