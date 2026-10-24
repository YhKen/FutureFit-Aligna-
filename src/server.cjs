const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=__dirname,args=process.argv.slice(2),at=args.indexOf('--port');
const requested=Number(at>=0?args[at+1]:process.env.PORT||4180);
if(!Number.isInteger(requested)||requested<1024||requested>65535)throw Error('Invalid local port');
const endpoints=new Map([['/api/research-prototype',['GET','POST']],['/api/validation',['GET','POST']],['/api/work-followup',['GET','POST']],['/api/work-samples',['GET','POST']],['/api/trends',['GET']],['/api/news-feed',['GET']],['/api/news-plan',['GET','POST']],['/api/news-review',['GET','POST']],['/api/news-sync',['POST']]]);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400);return res.end();}
 if(endpoints.has(url.pathname)){
  if(!endpoints.get(url.pathname).includes(req.method)){res.writeHead(405);return res.end();}
  try{
   let body='';if(req.method==='POST'){for await(const part of req){body+=part;if(Buffer.byteLength(body)>(['/api/work-samples','/api/work-followup','/api/validation'].includes(url.pathname)?24000:8192)){res.writeHead(413);return res.end();}}}
   const headers={};if(req.headers.authorization)headers.Authorization=req.headers.authorization;
   if(body)headers['Content-Type']='application/json';
   const r=await fetch('https://aligna-two.vercel.app'+url.pathname+url.search,{method:req.method,headers,body:body||undefined,signal:AbortSignal.timeout(url.pathname==='/api/validation'?120000:15000),redirect:'error'});
   const text=await r.text();if(text.length>1500000)throw Error('response-too-large');
   res.writeHead(r.status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(text);
  }catch{res.writeHead(503,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'published-service-unavailable'}));}
 }
 const guideFiles={'/validation-guide.pdf':'FutureFit_专家审题与盲评验收指南.pdf','/project-guide.pdf':'FutureFit_项目与算法指南.pdf'};
 if(guideFiles[url.pathname]){if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}return fs.readFile(path.join(root,'docs','acceptance',guideFiles[url.pathname]),(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':'application/pdf','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);});}
 let name;try{name=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end();}
 if(name==='/')name='/index.html';
 const file=path.resolve(root,'.'+name),relative=path.relative(root,file),parts=relative.split(path.sep);
 if(!(parts.length===1||parts[0]==='vendor')||relative.startsWith('..')||path.isAbsolute(relative)||!mime[path.extname(file)]||!['GET','HEAD'].includes(req.method)){
  res.writeHead(404);return res.end('Not found');
 }
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 });
});
let port=requested;
server.on('error',error=>{if(error.code==='EADDRINUSE'&&port<requested+20&&port<65535){port++;server.listen(port,'127.0.0.1');}else{console.error(error.message);process.exitCode=1;}});
server.on('listening',()=>{const url=`http://127.0.0.1:${port}/`;console.log(`Future Fit ready: ${url}`);console.log('Ctrl+C to stop. Firebase sign-in and cloud services require internet.');
 if(args.includes('--open')){const command=process.platform==='win32'?['cmd',['/c','start','',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];const child=spawn(command[0],command[1],{stdio:'ignore',windowsHide:true});child.on('error',()=>console.log('Open the URL above in your browser.'));}
});
server.listen(port,'127.0.0.1');
