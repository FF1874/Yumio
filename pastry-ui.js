const starterArea=$('pastryStarters');
starterArea.innerHTML=pastryBuilds.map((b,i)=>'<button type="button" data-pastry="'+i+'"><img alt="" width="70" height="50" src="assets/pastries/assembly-'+i+'.webp"><span>'+b.name+' ＋</span></button>').join('');
starterArea.onclick=e=>{const button=e.target.closest('[data-pastry]');if(button)addPastryBuild(Number(button.dataset.pastry))};
$('explodePastry').onclick=()=>{separated=!separated;$('explodePastry').setAttribute('aria-pressed',String(separated));draw()};
let readerReady=null;
function loadModelReader(){
 if(window.ankuanReadGLB)return Promise.resolve();
 if(!readerReady)readerReady=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='assets/model-import/reader.min.js?v=face3';
  script.onload=()=>{if(window.ankuanReadGLB)resolve();else{readerReady=null;script.remove();reject(Error('当前浏览器无法启动模型读取器。'))}};script.onerror=()=>{readerReady=null;script.remove();reject(Error('模型读取器未加载，请重试。'))};
  document.head.append(script);
 });return readerReady;
}
async function importStamp(file,label){
 const out=$('stampStatus');if(!file||state.printing||importStamp.busy)return;
 importStamp.busy=true;out.textContent='读取模型，计算顶面高度…';
 try{
  if(file.size>36*1024*1024)throw Error('请选择不超过 36 MB 的 GLB。');
  await loadModelReader();
  const {image,relief}=await window.ankuanReadGLB(file);
  const piece=photoOutline(image);
  if(state.printing||freeParts.length>=MAX_PARTS)throw Error('当前不能添加部件，请在打印结束或移除部件后重试。');
  rememberEdit();piece.kind=label;piece.relief=relief;piece.s=.66;piece.color='#c99b74';
  freeParts.push(piece);selected=freeParts.length-1;drawing=false;syncBench();renderStatus();
  out.textContent='浮雕已加入作品，可移动、旋转或撤销。';
 }catch(error){out.textContent='导入失败：'+(error.message||'无法读取模型')}
 finally{importStamp.busy=false}
}
$('stampFile').onchange=e=>{const file=e.target.files[0];e.target.value='';if(file)importStamp(file,'模型浮雕')};

function addFlowerStamp(x=0,y=0){
 if(state.printing)return;
 if(freeParts.length>=MAX_PARTS){statusMessage('作品空间不足，请先移除一个部件。');return}
 rememberEdit();const p=part('Hi3D 花瓣浮雕',x,y,.58);p.poly=featuredFlower.poly;p.relief=featuredFlower.relief;p.color='#bd805e';
 freeParts.push(p);selected=freeParts.length-1;drawing=false;syncBench();renderStatus();
 statusMessage('已加入由 Hi3D 小花模型生成的浮雕。');
 }
const stampTile=$('addFlowerStamp');
stampTile.onclick=()=>addFlowerStamp();
stampTile.draggable=true;
stampTile.ondragstart=e=>{e.dataTransfer.setData('application/x-ankuan-flower','flower');e.dataTransfer.effectAllowed='copy';$('editor').classList.add('receiving')};
stampTile.ondragend=()=>$('editor').classList.remove('receiving');
const dropWorkbenchPiece=$('editor').ondrop;
$('editor').ondrop=e=>{
 if(e.dataTransfer.getData('application/x-ankuan-flower')!=='flower')return dropWorkbenchPiece(e);
 e.preventDefault();$('editor').classList.remove('receiving');const point=editorPoint(e);addFlowerStamp(point.x,point.y);
};
