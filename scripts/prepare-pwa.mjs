import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const target=path.resolve(process.argv[2]||'dist/client');
const files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else files.push(full);}}
await walk(target);
const cached=files.filter(f=>/\.(js|css|png|svg|woff2?|webmanifest)$/.test(f)&&!f.endsWith('sw.js')).map(f=>'./'+path.relative(target,f).replaceAll('\\','/')).sort();
const hash=createHash('sha256');
let sw=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
hash.update(sw);
for(const file of files.filter(f=>!f.endsWith('sw.js')).sort())hash.update(await readFile(file));
const version='kang-in-v4-'+hash.digest('hex').slice(0,12);
sw=sw.replace(/const VERSION = [^;]+;/,()=>`const VERSION = ${JSON.stringify(version)};`).replace(/const PRECACHE = [^;]+;/,()=>`const PRECACHE = ${JSON.stringify(['./',...cached])};`);
await writeFile(path.join(target,'sw.js'),sw);
console.log(JSON.stringify({pwa:version,precacheAssets:cached.length,target}));
