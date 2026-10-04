import {copyFileSync,existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
mkdirSync(path.join(root,'public'),{recursive:true});
for(const file of ['retro-kid.png','icon-192.png','icon-512.png','icon-maskable.png']){
 const source=path.join(root,'docs',file),target=path.join(root,'public',file);
 if(existsSync(source))copyFileSync(source,target);
 else if(!existsSync(target))throw new Error('Missing image asset: '+file);
}
