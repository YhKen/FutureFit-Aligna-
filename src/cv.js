export async function extractCV(file){
 if(!file||file.size>5*1024*1024)throw Error('file-size');let text='';
 if(/\.txt$/i.test(file.name))text=await file.text();
 else if(/\.pdf$/i.test(file.name)){
  const pdfjs=await import('./vendor/pdf.js');pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.js',import.meta.url).href;
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});const pdf=await task.promise;
  try{for(let page=1;page<=Math.min(pdf.numPages,30);page++){const content=await(await pdf.getPage(page)).getTextContent();let lastY=null;for(const item of content.items){const y=item.transform?.[5];if(lastY!==null&&Number.isFinite(y)&&Math.abs(y-lastY)>2&&!text.endsWith('\n'))text+='\n';text+=(item.str||'')+(item.hasEOL?'\n':' ');if(Number.isFinite(y))lastY=y;}text+='\n';}}finally{await task.destroy();}
 }else if(/\.docx$/i.test(file.name)){
  if(!window.mammoth)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('./vendor/mammoth.js',import.meta.url).href;script.onload=resolve;script.onerror=reject;document.head.append(script);});
  text=(await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;
 }else throw Error('file-type');
 if(!text.trim())throw Error('no-text');return text.slice(0,50000);
}

