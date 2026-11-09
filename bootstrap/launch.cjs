'use strict';
require('./native-loader.cjs').start().catch(error=>{console.error(error.stack);if(error.execution)console.error(error.execution);process.exitCode=1;});
