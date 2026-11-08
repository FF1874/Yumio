(() => {
  const host=document.getElementById('generationWorkshop');
  if(!host)return;
  host.innerHTML=`
  <aside class="gen-side">
    <div class="gen-heading"><span class="gen-eyebrow">图生 3D</span><h2>选择原图</h2></div>
    <div class="gen-source-tabs" role="group" aria-label="原图来源"><button type="button" data-input="sketch" aria-pressed="true">手绘</button><button type="button" data-input="photo" aria-pressed="false">照片</button></div>
    <div data-block="photo"><button class="gen-upload" type="button" data-action="upload"><b>＋</b><strong>上传照片</strong><small>JPG、PNG、WebP · 10 MB</small></button><button type="button" class="gen-camera" data-action="camera">使用相机</button></div>
    <div data-block="sketch" hidden><div class="gen-pens"><button type="button" data-action="pen" aria-pressed="true">画笔</button><button type="button" data-action="erase" aria-pressed="false">橡皮</button><button type="button" data-action="undo">撤销</button></div><p>用手指或鼠标画出轮廓。</p></div>
    <input type="file" data-file="photo" accept="image/png,image/jpeg,image/webp" hidden><input type="file" data-file="camera" accept="image/*" capture="environment" hidden>
    <figure data-role="sourceMini" class="gen-original-mini" hidden><img alt="生成时的参考图"><figcaption>参考原图</figcaption></figure>
    <div class="gen-example"><span>试用已生成的模型</span><button type="button" data-action="sample"><img src="assets/model-import/flower-preview.webp" alt="" width="60" height="60"><span><b>花瓣小点心</b><small>立体造型</small></span><i>›</i></button></div>
    <details class="gen-import"><summary>已有 GLB 模型</summary><button type="button" data-action="import">从本机导入</button><input type="file" data-file="model" accept=".glb,model/gltf-binary" hidden></details>
    <div class="gen-actions"><p class="gen-note" data-role="status" role="status" aria-live="polite"></p>
      <button type="button" class="gen-primary" data-action="generate">生成 3D</button>
      <button type="button" class="gen-secondary" data-action="local">预览本地浮雕</button>
      <button type="button" class="gen-primary" data-action="use" hidden>添加到模板创作</button>
      <button type="button" class="gen-secondary" data-action="resume" hidden>查看原生成任务</button>
      <button type="button" class="gen-secondary" data-action="edit" hidden>返回原图</button>
    </div>
  </aside>
  <section class="gen-stage"><header><h2 data-role="title">原图预览</h2><span class="gen-stage-dot" data-role="stageLabel">照片</span></header>
    <div class="gen-display" data-role="display">
      <div class="gen-empty" data-role="empty"><img src="assets/recipes/flower.webp" alt="" width="208" height="150"><strong>从一张点心照片开始</strong><span>将图片拖到这里</span></div>
      <img data-role="photo" class="gen-reference" alt="当前点心参考图" hidden>
      <canvas data-role="sketch" width="1000" height="740" aria-label="手绘画板" hidden></canvas>
      <div data-role="viewer" class="gen-viewer" hidden></div>
      <canvas data-role="relief" width="680" height="480" tabindex="0" aria-label="浮雕预览，可左右拖动或使用方向键旋转" hidden></canvas>
    </div>
    <footer><span data-role="caption">点击「生成 3D」后上传当前原图。</span><a data-role="modelLink" target="_blank" rel="noopener noreferrer" hidden>原始模型 ↗</a></footer>
  </section>`;
  const find=s=>host.querySelector(s),node=id=>find('[data-role="'+id+'"]'),action=id=>find('[data-action="'+id+'"]');
  const sketch=node('sketch'),ctx=sketch.getContext('2d');
  const status=text=>{node('status').textContent=text;};
  let inputMode='sketch',photo=null,strokes=[],activeStroke=null,erase=false,busy=false,result=null,sequence=0;
  let viewerDispose=null,viewerModule=null,angle=.46,materialURL=null;
  let pollTimer=0,pollRun=0;
  const taskKey='ankuan-sponsored-job-v1';
  let jobReference='',outputURL='';
  let jobId;try{jobId=sessionStorage.getItem(taskKey);}catch{}
  function setJob(id){jobId=id;try{if(id)sessionStorage.setItem(taskKey,id);else sessionStorage.removeItem(taskKey);}catch{}}
  function imageReady(){return inputMode==='photo'?!!photo:strokes.some(s=>!s.erase);}
  function refresh(){
    const output=!!result;
    for(const b of host.querySelectorAll('[data-input]')){b.setAttribute('aria-pressed',String(b.dataset.input===inputMode));b.disabled=busy;}
    for(const b of host.querySelectorAll('[data-block]'))b.hidden=b.dataset.block!==inputMode;
    for(const id of ['upload','camera','sample','import','undo','pen','erase'])action(id).disabled=busy||(id==='undo'&&!strokes.length);
    action('pen').setAttribute('aria-pressed',String(!erase));action('erase').setAttribute('aria-pressed',String(erase));
    const ready=imageReady();
    action('local').hidden=output;action('local').disabled=!ready||busy;
    action('generate').hidden=output||!!jobId;action('generate').disabled=!ready||busy;
    action('use').hidden=!output||!result.piece;action('use').disabled=busy;
    action('edit').hidden=!output||busy;
    action('resume').hidden=!jobId||busy;
    node('photo').hidden=output||inputMode!=='photo'||!photo;node('empty').hidden=output||inputMode!=='photo'||!!photo;
    sketch.hidden=output||inputMode!=='sketch';
    node('viewer').hidden=!output||!result.full;
    node('relief').hidden=!output||result.full;
    node('title').textContent=output?result.title:inputMode==='photo'?'原图预览':'手绘画板';
    node('stageLabel').textContent=output?result.label:inputMode==='photo'?'照片':'手绘';
    const mini=node('sourceMini'),miniURL=result?.reference||null;
    mini.hidden=!miniURL;if(miniURL&&mini.querySelector('img').getAttribute('src')!==miniURL)mini.querySelector('img').src=miniURL;
    node('caption').textContent=output?(result.full?'拖动旋转模型，双指或滚轮缩放。':'左右拖动旋转浮雕。'):inputMode==='sketch'?'画完后点「生成 3D」。':'点击「生成 3D」后上传当前原图。';
    const link=node('modelLink');link.hidden=!result?.modelPage;if(result?.modelPage)link.href=result.modelPage;
  }
  function clearResult(){if(viewerDispose){viewerDispose();viewerDispose=null;}result=null;sequence++;status('');refresh();}
  function switchInput(mode){
    if(busy)return;
    clearResult();inputMode=mode;refresh();if(mode==='sketch')paint();
  }
  function paint(){
    ctx.fillStyle='white';ctx.fillRect(0,0,sketch.width,sketch.height);
    for(const s of strokes){
      ctx.strokeStyle=s.erase?'white':'#77452e';ctx.fillStyle=ctx.strokeStyle;ctx.lineCap=ctx.lineJoin='round';ctx.lineWidth=s.erase?52:16;
      ctx.beginPath();ctx.moveTo(...s.points[0]);for(const p of s.points.slice(1))ctx.lineTo(...p);ctx.stroke();
      if(s.points.length===1){ctx.beginPath();ctx.arc(...s.points[0],ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}
    }
  }
  function point(e){const rect=sketch.getBoundingClientRect();return [(e.clientX-rect.left)*sketch.width/rect.width,(e.clientY-rect.top)*sketch.height/rect.height];}
  sketch.onpointerdown=e=>{if(busy||activeStroke)return;e.preventDefault();activeStroke={id:e.pointerId,erase,points:[point(e)]};strokes.push(activeStroke);sketch.setPointerCapture(e.pointerId);paint();refresh();};
  sketch.onpointermove=e=>{if(activeStroke?.id===e.pointerId){activeStroke.points.push(point(e));paint();}};
  sketch.onpointerup=sketch.onpointercancel=sketch.onlostpointercapture=e=>{if(activeStroke?.id===e.pointerId)activeStroke=null;};
  async function loadImage(url){const image=new Image();image.src=url;await image.decode();return image;}
  async function readFile(file){
    if(!file||busy)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024){status('请选择 10 MB 以内的 PNG、JPEG 或 WebP。');return;}
    const token=++sequence,url=URL.createObjectURL(file);
    try{
      const image=await loadImage(url);if(token!==sequence||busy){URL.revokeObjectURL(url);return;}
      clearResult();inputMode='photo';if(materialURL)URL.revokeObjectURL(materialURL);materialURL=url;photo=image;node('photo').src=url;refresh();
    }catch{URL.revokeObjectURL(url);status('图片读取失败，请重新选择。');}
  }
  function prepareImage(){
    const source=inputMode==='sketch'?sketch:photo;if(!source)throw Error('请先选择原图。');
    const w=source.naturalWidth||source.width,h=source.naturalHeight||source.height,scale=Math.min(1,1200/Math.max(w,h));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
    const g=c.getContext('2d');g.fillStyle='white';g.fillRect(0,0,c.width,c.height);g.drawImage(source,0,0,c.width,c.height);
    if(inputMode==='sketch'){
      const pixels=g.getImageData(0,0,c.width,c.height).data;let visible=false;
      for(let i=0;i<pixels.length;i+=4)if(pixels[i]<200){visible=true;break;}
      if(!visible)throw Error('先在画板上画一些线条。');
    }
    return c.toDataURL('image/jpeg',.88);
  }
  function localPiece(image){
    const p=photoOutline(image);p.kind=inputMode==='sketch'?'手绘浮雕':'照片浮雕';p.color='#c58a62';p.s=.66;
    const n=56,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');
    g.fillStyle='#fff';g.beginPath();p.poly.forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](n/2+x*(n/2-2),n/2+y*(n/2-2)));g.closePath();g.fill();
    const pixels=g.getImageData(0,0,n,n).data,mask=Array.from({length:n*n},(_,i)=>Number(pixels[i*4+3]>100));
    let dist=mask.map(x=>x?n*n:0);
    for(let i=0;i<dist.length;i++)if(mask[i])dist[i]=Math.min(dist[i],dist[i-1]+1,dist[i-n]+1);
    for(let i=dist.length-1;i>=0;i--)if(mask[i])dist[i]=Math.min(dist[i],dist[i+1]+1,dist[i+n]+1);
    p.relief={n,mask,values:dist.map((d,i)=>mask[i]?Math.round(34+128*(1-Math.exp(-d/5))):0)};return p;
  }
  function sketchPiece(){
    // Keep separated strokes and holes inside the same stamp instead of dropping smaller contours.
    const n=72,src=ctx.getImageData(0,0,sketch.width,sketch.height).data;let x0=sketch.width,y0=sketch.height,x1=0,y1=0;
    for(let y=0;y<sketch.height;y++)for(let x=0;x<sketch.width;x++)if(src[(y*sketch.width+x)*4]<200){x0=Math.min(x,x0);x1=Math.max(x,x1);y0=Math.min(y,y0);y1=Math.max(y,y1);}
    if(x1<=x0||y1<=y0)throw Error('先在画板上画一些线条。');
    const roi=Math.max(x1-x0+1,y1-y0+1),c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d'),s=(n-4)/roi;
    g.fillStyle='white';g.fillRect(0,0,n,n);g.drawImage(sketch,x0,y0,x1-x0+1,y1-y0+1,(n-(x1-x0+1)*s)/2,(n-(y1-y0+1)*s)/2,(x1-x0+1)*s,(y1-y0+1)*s);
    const pixels=g.getImageData(0,0,n,n).data,ink=Array.from({length:n*n},(_,i)=>pixels[i*4]<229?1:0);
    // A stroke needs a two-pixel band to produce connected mesh faces on the relief grid.
    const mask=ink.map((v,i)=>Number(!!(v||ink[i-n]||ink[i+n]||(i%n&&ink[i-1])||(i%n<n-1&&ink[i+1]))));
    const p=part('手绘浮雕',0,0,.68);p.color='#c78b67';p.relief={n,mask,values:mask.map((m,i)=>m?Math.min(240,50+255-pixels[i*4]):0)};
    return p;
  }
  function drawRelief(){
    if(!result?.piece||result.full)return;
    const c=node('relief'),g=c.getContext('2d'),w=c.width,h=c.height;
    g.clearRect(0,0,w,h);const ca=Math.cos(angle),sa=Math.sin(angle),scale=.32*Math.min(w,h);
    const project=(x,y,z)=>[w/2+(x*ca-y*sa)*scale,h*.57+(x*sa+y*ca)*scale*.54-z*scale*.83];
    drawStamp(g,{...result.piece,x:0,y:0,s:1,angle:0},project,0,result.piece.color||'#ce996e',12,false,angle);
  }
  let drag=null;
  const reliefCanvas=node('relief');
  reliefCanvas.onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,a:angle};reliefCanvas.setPointerCapture(e.pointerId);};
  reliefCanvas.onpointermove=e=>{if(drag?.id===e.pointerId){angle=drag.a+(e.clientX-drag.x)*.015;drawRelief();}};
  reliefCanvas.onpointerup=reliefCanvas.onpointercancel=reliefCanvas.onlostpointercapture=()=>{drag=null;};
  reliefCanvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();angle+=e.key==='ArrowRight'?.15:-.15;drawRelief();}};
  async function showLocal(){
    const src=prepareImage(),piece=inputMode==='sketch'?sketchPiece():localPiece(await loadImage(src));
    result={piece,title:piece.kind,label:'本地浮雕',full:false,reference:src};refresh();drawRelief();status('已根据原图轮廓生成本地浮雕。');
  }
  async function loadViewer(){
    if(window.ankuanShowGLB)return;
    viewerModule??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/model-import/generation-viewer.min.js';
      s.onload=()=>{if(window.ankuanShowGLB)resolve();else{viewerModule=null;s.remove();reject(Error('模型预览器启动失败。'));}};s.onerror=()=>{viewerModule=null;s.remove();reject(Error('模型预览器未加载，请重试。'));};document.head.append(s);});await viewerModule;
  }
  async function showModel(file,{name,piece,modelPage='',label='GLB 模型',reference=''}={}){
    if(file.size>96*1024*1024)throw Error('请选择 96 MB 以内的 GLB。');
    if(!piece){await loadModelReader();const {image,relief}=await window.ankuanReadGLB(file);piece=photoOutline(image);piece.relief=relief;piece.kind=name;piece.s=.66;piece.color='#c58b68';}
    const title=name||piece.kind;
    result={piece,full:true,title,label,modelPage,reference};refresh();
    try{await loadViewer();viewerDispose=await window.ankuanShowGLB(node('viewer'),await file.arrayBuffer());status('可以旋转查看完整模型，或将浮雕放到点心上。');}
    catch{result.full=false;refresh();drawRelief();status('当前浏览器显示顶面浮雕预览。');}
  }
  async function example(){
    clearResult();const response=await fetch('assets/model-import/flower-display.glb');if(!response.ok)throw Error('小花示例未加载，请重试。');
    const p=part('花瓣浮雕',0,0,.59);p.poly=featuredFlower.poly;p.relief=featuredFlower.relief;p.color='#c78a64';
    await showModel(await response.blob(),{name:'花瓣小点心',piece:p,label:'已生成示例',reference:'assets/recipes/flower.webp',modelPage:'https://www.hi3d.ai/3d-model/da56c2a8d5f3436b9e7b632f6a94e981'});
  }
  function note(error){status(error?.message||'操作未完成，请重试。');}
  async function withBusy(fn){if(busy)return;busy=true;refresh();try{await fn();}catch(error){note(error);}finally{busy=false;refresh();}}
  async function requestJob(actionName,data){
    const response=await fetch('/api/generation/'+actionName,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    if(!response.ok){
      const details=await response.json().catch(()=>({}));
      const failure=new Error(details.error||'服务暂时不可用，请稍后重试。');failure.httpStatus=response.status;throw failure;
    }
    return actionName==='model'?response.blob():response.json();
  }
  function schedulePoll(id,version,seconds){
    clearTimeout(pollTimer);
    const next=()=>{if(jobId!==id||version!==pollRun)return;if(busy){pollTimer=setTimeout(next,650);return;}withBusy(()=>poll(id,version));};
    pollTimer=setTimeout(next,Math.min(60,Math.max(3,Number(seconds)||10))*1000);
  }
  async function displayJob(job,id,version){
    if(id!==jobId||version!==pollRun)return;
    if(job.state==='ready'){
      status('模型已生成，正在加载…');
      const file=await requestJob('model',{id});
      try{await showModel(file,{name:'我的立体造型',label:'生成完成',reference:jobReference});}
      catch(e){status('模型已生成，浮雕未载入：'+(e.message||'读取失败')+'。可以下载完整模型。');}
      if(outputURL)URL.revokeObjectURL(outputURL);outputURL=URL.createObjectURL(file);
      const a=document.createElement('a');a.href=outputURL;a.download='Yumio-我的立体造型.glb';a.textContent='下载 GLB';node('status').append(' ',a);
      setJob(null);return;
    }
    if(job.state==='failed'||job.state==='full'){
      setJob(null);status(job.state==='full'?'本场剩余名额不足，可继续本地创作。':'本次生成未完成，可以继续编辑原图。');return;
    }
    const stream={preparing:'正在准备原图',submitting:'正在提交作品',working:'作品正在生成',uncertain:'正在核对原任务'};
    status((stream[job.state]||'正在查询任务')+(Number.isFinite(job.progress)?' · '+job.progress+'%':'')+'。可以继续使用模板创作。');
    schedulePoll(id,version,job.retryAfter);
  }
  async function poll(id,version){
    let job;
    try{job=await requestJob('status',{id});}
    catch(e){
      if(e.httpStatus===404&&jobReference){job=await requestJob('create',{id,image:jobReference.split(',')[1]});}
      else if(e.httpStatus===404){setJob(null);throw Error('没有找到已保存的任务，可以重新开始。');}
      else{schedulePoll(id,version,15);status('进度暂未更新，稍后会自动继续查看这个任务。');return;}
    }
    await displayJob(job,id,version);
  }
  async function resume(){clearTimeout(pollTimer);await poll(jobId,++pollRun);}
  async function generate(){
    const src=prepareImage();
    const id=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
    jobReference=src;setJob(id);const version=++pollRun;status('正在提交这张原图…');
    try{const j=await requestJob('create',{id,image:src.split(',')[1]});await displayJob(j,id,version);}
    catch(e){
      if([400,401,403,409,413,429].includes(e.httpStatus)||e.message==='在线生成尚未启用，可先预览本地浮雕。'||e.message==='项目生成服务尚未启用。'){setJob(null);}
      else{schedulePoll(id,version,10);}
      throw e;
    }
  }
  for(const b of host.querySelectorAll('[data-input]'))b.onclick=()=>switchInput(b.dataset.input);
  for(const type of ['photo','camera']){const input=find('[data-file="'+type+'"]');input.onchange=()=>{readFile(input.files[0]);input.value='';};}
  action('upload').onclick=()=>find('[data-file="photo"]').click();action('camera').onclick=()=>find('[data-file="camera"]').click();
  action('pen').onclick=()=>{erase=false;refresh();};action('erase').onclick=()=>{erase=true;refresh();};
  action('undo').onclick=()=>{clearResult();strokes.pop();paint();refresh();};
  action('sample').onclick=()=>withBusy(example);action('local').onclick=()=>withBusy(showLocal);
  action('generate').onclick=()=>withBusy(generate);action('resume').onclick=()=>withBusy(resume);action('edit').onclick=clearResult;
  const modelFile=find('[data-file="model"]');action('import').onclick=()=>modelFile.click();
  modelFile.onchange=()=>{const file=modelFile.files[0];modelFile.value='';if(file)withBusy(async()=>{clearResult();await showModel(file,{name:'导入的模型'});});};
  action('use').onclick=()=>{if(result?.piece&&window.ankuanUseGeneratedPart)window.ankuanUseGeneratedPart(structuredClone(result.piece));};
  const display=node('display');
  for(const drop of [display,action('upload')]){
    drop.ondragover=e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();drop.classList.add('gen-over');}};
    drop.ondragleave=()=>drop.classList.remove('gen-over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('gen-over');readFile(e.dataTransfer.files[0]);};
  }
  if(jobId)status('可以继续查看上次生成的作品。');paint();refresh();
})();
