const esbuild = require('esbuild');
esbuild.build({entryPoints:['frontend/js/main.js'],bundle:true,minify:true,format:'iife',target:['es2020'],outfile:'frontend/js/bundle.js'}).then(()=>console.log('Frontend built')).catch(e=>{console.error(e);process.exit(1)});
