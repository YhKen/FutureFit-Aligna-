import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.resolve(root,'public');
if(out!==path.join(root,'public')||!out.startsWith(root+path.sep))throw Error('Invalid output path');
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
let count=0;for(const file of await fs.readdir(root,{withFileTypes:true}))if(file.isFile()&&/\.(html|css|js|svg|png|webp|ico)$/.test(file.name)){await fs.copyFile(path.join(root,file.name),path.join(out,file.name));count++;}
await fs.cp(path.join(root,'vendor'),path.join(out,'vendor'),{recursive:true});
console.log('Future Fit static output ready: '+count+' pages/assets plus vendor files. API stays server-side.');

await fs.copyFile(path.join(root,'docs','acceptance','FutureFit_专家审题与盲评验收指南.pdf'),path.join(out,'validation-guide.pdf'));
await fs.copyFile(path.join(root,'docs','acceptance','FutureFit_项目与算法指南.pdf'),path.join(out,'project-guide.pdf'));

await fs.copyFile(path.join(root,'docs','acceptance','FutureFit_模拟研究与训练_操作验收指南.pdf'),path.join(out,'research-prototype-guide.pdf'));
