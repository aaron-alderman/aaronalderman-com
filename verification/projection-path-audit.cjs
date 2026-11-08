'use strict';
// Compatibility launcher; current checks always use the canonical declaration.
require('../bootstrap/test.cjs').run(['test.publication','test.projection']).catch(error=>{console.error(error);process.exitCode=1;});
