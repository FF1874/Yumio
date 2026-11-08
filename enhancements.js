// A dependency-free refresh of the original An Kuan prototype.
// This stays entirely in the browser. Commands are rules, not generative AI.
const palette=['#cc8b78','#d5ac62','#84a28c','#94a6c2','#b496b4','#bf946f'];
const assetGroups={
 ...pastryShelf,
 '几何':['球','条','片','三角','菱形','六边形'],
 '小动物':['小熊','小猫','兔子','小鱼','蝴蝶','耳朵'],
 '自然':['花朵','叶片','星星','云朵','水滴','月牙'],
 '点心':['圆饼','饼干','糖果','冰棒'],
 '符号':['爱心','闪电','皇冠']
};
let assetCategory='底胚',drawing=false,strokes=[],activeStroke=null;
let materialColors=false,viewZoom=1.35,viewPitch=.46;
let undoStack=[],redoStack=[],historyApplying=false;
const MAX_PARTS=24;
// Keep a stable logical editing area across phone, expanded and desktop views.
// Reserve room for the rotation handle above and the object toolbar below.
function benchScale(r){return Math.max(1,Math.min((r.width-40)/3.6,(r.height-120)/2.6))}
function partBounds(p){
 const c=Math.cos(p.angle),s=Math.sin(p.angle),points=p.poly.map(([x,y])=>[p.s*(x*c-y*s),p.s*(x*s+y*c)]);
 return {left:Math.min(...points.map(v=>v[0])),right:Math.max(...points.map(v=>v[0])),top:Math.min(...points.map(v=>v[1])),bottom:Math.max(...points.map(v=>v[1]))};
}
function constrainPart(p){
 if(p.fixedBase)return p;
 let b=partBounds(p);const fit=Math.min(1,3.2/Math.max(.01,b.right-b.left),2.3/Math.max(.01,b.bottom-b.top));
 if(fit<1){p.s*=fit;b=partBounds(p)}
 p.x=Math.max(-1.6-b.left,Math.min(1.6-b.right,p.x));
 p.y=Math.max(-1.15-b.top,Math.min(1.15-b.bottom,p.y));
 return p;
}
function pieceLevels(items){
 const levels=[];for(let i=0;i<items.length;i++){const p=items[i];levels[i]=0;for(let j=0;j<i;j++){const q=items[j];if(Math.hypot(p.x-q.x,p.y-q.y)<.72*(p.s+q.s))levels[i]=Math.max(levels[i],levels[j]+1)}}return levels;
}
function cameraFit(items,levels,scale){
 const ca=Math.cos(state.angle),sa=Math.sin(state.angle);let fit=1;
 function include(x,y,z){const px=(x*ca-y*sa)*scale,py=(x*sa+y*ca)*scale*viewPitch-z*65;
  if(px)fit=Math.min(fit,(scene.width/2-48)/Math.abs(px));
  if(py<0)fit=Math.min(fit,(296-68)/-py);else if(py>0)fit=Math.min(fit,(scene.height-70-296)/py);
 }
 items.forEach((p,i)=>{const c=Math.cos(p.angle),s=Math.sin(p.angle);for(const [x,y] of p.poly){const px=p.x+p.s*(x*c-y*s),py=p.y+p.s*(x*s+y*c);const base=levels[i]*(separated&&!state.printing?1.65:.72);include(px,py,base);include(px,py,base+state.layer*.11)}});
 const z=(levels.length?Math.max(...levels):0)*.72+state.layer*.065+.04;
 strokes.forEach(stroke=>stroke.points.forEach(([x,y])=>include(x,y,z)));
 return fit;
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function statusMessage(message){$('commandStatus').textContent=message}
function snapshot(){return JSON.stringify({parts:freeParts,strokes,design:designs.free,selected,recipeId,materials:[...selectedMaterialIds()]})}
function rememberEdit(value=snapshot()){if(historyApplying)return;undoStack.push(value);if(undoStack.length>50)undoStack.shift();redoStack=[];updateUndo()}
function updateUndo(){$('undo').disabled=!undoStack.length;$('redo').disabled=!redoStack.length}
function restoreEdit(value){historyApplying=true;const s=JSON.parse(value);freeParts=s.parts;strokes=s.strokes;designs.free=s.design;selected=s.selected;recipeId=s.recipeId;setMaterials(s.materials??(s.material===null?[]:[s.material]),{remember:false});historyApplying=false;syncBench();renderStatus();updateUndo()}
function undoEdit(){if(!undoStack.length||state.printing)return;redoStack.push(snapshot());restoreEdit(undoStack.pop());statusMessage('已撤销上一步。')}
function redoEdit(){if(!redoStack.length||state.printing)return;undoStack.push(snapshot());restoreEdit(redoStack.pop());statusMessage('已重做。')}
function assetColor(kind){const names=Object.keys(assetGroups);const idx=names.findIndex(c=>assetGroups[c].includes(kind));return pastrySpecs[kind]?.[0]||palette[Math.max(0,idx)%palette.length]}
function outline(type){
 if(pastrySpecs[type])return pastryOutline(type);
 const arc=(n,fn)=>Array.from({length:n},(_,i)=>{const a=i*TAU/n-Math.PI/2,r=fn(i,a);return [Math.cos(a)*r,Math.sin(a)*r]});
 if(type==='星星')return arc(10,i=>i%2?.48:1);
 if(type==='花朵')return arc(72,(_,a)=>.82+.17*Math.cos(6*a));
 if(type==='叶片')return arc(48,()=>1).map(([x,y])=>[x,(1-Math.abs(x)*.6)*y*.6]);
 if(type==='耳朵'||type==='三角')return [[-.82,.7],[0,-.9],[.82,.7]];
 if(type==='爱心')return Array.from({length:60},(_,i)=>{const a=i*TAU/60;return [Math.sin(a)**3,-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/17]});
 if(type==='条')return arc(40,()=>1).map(([x,y])=>[x,y*.35]);
 if(type==='片')return [[-.9,-.57],[.9,-.57],[.9,.57],[-.9,.57]];
 if(type==='字母')return [[-.62,-.9],[-.15,-.9],[-.15,.44],[.62,.44],[.62,.9],[-.62,.9]];
 if(type==='菱形')return [[0,-1],[.7,0],[0,1],[-.7,0]];
 if(type==='六边形')return arc(6,()=>.95);
 if(type==='小猫')return [[-.85,.4],[-.92,-.1],[-.8,-.95],[-.35,-.5],[.35,-.5],[.8,-.95],[.92,-.1],[.85,.4],[.45,.8],[-.45,.8]];
 if(type==='小熊')return arc(80,(_,a)=>{const ear1=Math.abs(Math.atan2(Math.sin(a+2.25),Math.cos(a+2.25))),ear2=Math.abs(Math.atan2(Math.sin(a+.9),Math.cos(a+.9)));return .72+.27*Math.exp(-((ear1/.3)**2))+.27*Math.exp(-((ear2/.3)**2))});
 if(type==='兔子')return [[-.6,.8],[-.86,.4],[-.8,-.1],[-.48,-.4],[-.58,-1],[-.32,-1.12],[-.1,-.46],[.12,-.46],[.36,-1.12],[.61,-1],[.47,-.4],[.8,-.1],[.86,.4],[.6,.8]];
 if(type==='小鱼')return [[-1,-.55],[-.65,0],[-1,.55],[-.32,.35],[.1,.63],[.62,.45],[1,0],[.62,-.45],[.1,-.63],[-.32,-.35]];
 if(type==='蝴蝶')return arc(80,(_,a)=>.48+.44*Math.abs(Math.sin(2*a)));
 if(type==='云朵')return arc(70,(_,a)=>(.72+.18*Math.cos(5*a))).map(([x,y])=>[x,y*.65]);
 if(type==='水滴')return arc(60,(_,a)=>.7+.3*Math.sin(a));
 if(type==='月牙')return [...Array.from({length:40},(_,i)=>{const a=-Math.PI/2+i*Math.PI/39;return [Math.cos(a),Math.sin(a)]}),...Array.from({length:40},(_,i)=>{const a=Math.PI/2-i*Math.PI/39;return [.53*Math.cos(a),Math.sin(a)]})];
 if(type==='饼干')return arc(48,i=>i%4<2?.94:1);
 if(type==='圆饼')return arc(60,()=>.9);
 if(type==='糖果')return [[-1,-.55],[-.45,-.25],[-.35,-.55],[.35,-.55],[.45,-.25],[1,-.55],[.83,0],[1,.55],[.45,.25],[.35,.55],[-.35,.55],[-.45,.25],[-1,.55],[-.83,0]];
 if(type==='冰棒')return [[-.55,-.6],[-.3,-.9],[.3,-.9],[.55,-.6],[.55,.4],[.15,.4],[.15,.95],[-.15,.95],[-.15,.4],[-.55,.4]];
 if(type==='闪电')return [[.1,-1],[-.75,.16],[-.1,.16],[-.3,1],[.8,-.28],[.12,-.28]];
 if(type==='皇冠')return [[-.9,-.5],[-.45,-.05],[0,-.85],[.45,-.05],[.9,-.5],[.65,.65],[-.65,.65]];
 return arc(40,()=>1);
}
function renderAssets(){
 const categories=[...Object.keys(assetGroups),'印章'];
 $('assetCategories').innerHTML=categories.map(c=>'<button type="button" data-category="'+c+'" aria-pressed="'+(assetCategory===c)+'">'+c+'</button>').join('');
 const raw=$('assetSearch').value.trim(),q=isEditCommand(raw)?'':raw;
 const stamps=assetCategory==='印章'&&!q;
 $('shapes').hidden=stamps;$('markChoices').hidden=!stamps;
 const options=q?Object.values(assetGroups).flat().filter(k=>k.includes(q)):(assetGroups[assetCategory]||[]);
 $('shapes').innerHTML=options.map((k,i)=>{
  const image=pastrySpecs[k]?'<img draggable="false" alt="" src="assets/pastries/part-'+pastryTypes.indexOf(k)+'.webp">':'<svg viewBox="-1.35 -1.35 2.7 2.7" aria-hidden="true" style="fill:'+palette[i%palette.length]+'"><polygon points="'+outline(k).map(v=>v.join(',')).join(' ')+'"/></svg>';
  return '<button draggable="true" data-shape="'+k+'" aria-label="添加'+k+'">'+image+'<span>'+k+'</span></button>';
 }).join('');
 $('assetCount').textContent=stamps?'':q?(options.length?'找到 '+options.length+' 个素材':'没有匹配素材，试试其他名称。'):'';
}

function syncBench(){
 freeParts.forEach(constrainPart);
 state.mode='free';$('copytools').hidden=false;$('freetools').hidden=false;
 document.querySelectorAll('[data-expand]').forEach(b=>{const expanded=$('viewPair').dataset.expanded===b.dataset.expand;b.setAttribute('aria-expanded',String(expanded));b.textContent=expanded?'↙':'⛶'});
 $('editor').hidden=false;$('scene').hidden=false;$('edActions').hidden=false;$('modelTools').hidden=false;
 $('benchHint').textContent='';
 document.querySelectorAll('[data-mark]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mark===designs.free.mark)));
 designs.free.text='';$('doodleToggle').classList.toggle('toolActive',drawing);$('doodleToggle').setAttribute('aria-pressed',String(drawing));
 $('editor').classList.toggle('isDrawing',drawing);$('materialToggle').setAttribute('aria-pressed',String(materialColors));$('materialToggle').textContent=materialColors?(selectedMaterialIds().length>1?'多材料示意色':'材料示意色'):'区分色';
 paintEditor();draw();updateUndo();
 if(typeof wkDrafts!=='undefined' && $('currentTemplate')?.textContent)wkCapture();
}
function setMode(mode){state.mode='free';syncBench();renderStatus();if(mode==='copy'){document.querySelector('.photoSection').open=true;requestAnimationFrame(()=>$('photoDrop').scrollIntoView({block:'nearest',behavior:'smooth'}))}}
function paintEditor(){
 if(typeof wkRefreshSelection==='function')wkRefreshSelection();
 const active=document.activeElement,restoreFocus=active&&$('editor').contains(active);
 const editAction=restoreFocus?active.dataset?.edit:null;
 const r=$('editor').getBoundingClientRect(),u=benchScale(r),p=freeParts[selected];
 $('selectionName').textContent=p?'已选 · '+p.kind+'　'+(selected+1)+' / '+freeParts.length:'点选物件进行调整';
 $('partColor').disabled=!p;if(p)$('partColor').value=p.color||assetColor(p.kind);
 $('edActions').querySelectorAll('button').forEach(b=>b.disabled=!p);
 const pieces=freeParts.map((f,i)=>'<button '+(f.fixedBase?'disabled tabindex="-1" ':'')+'class="piece '+(selected===i?'on':'')+'" aria-label="'+escapeHtml(f.kind)+'部件 '+(i+1)+'" aria-pressed="'+(selected===i)+'" data-i="'+i+'" style="--piece-color:'+(materialColors?materialPreviewColor():f.color||assetColor(f.kind))+';left:'+(r.width/2+f.x*u)+'px;top:'+(r.height/2+f.y*u)+'px;width:'+f.s*2.3*u+'px;height:'+f.s*2.3*u+'px;transform:translate(-50%,-50%) rotate('+f.angle+'rad)">'+(f.relief?'<img class="pastryTop" draggable="false" alt="" src="'+stampThumb(f,materialColors?materialPreviewColor():f.color)+'">':pastrySpecs[f.kind]?'<img class="pastryTop" draggable="false" alt="" src="'+pastryThumb(f.kind,true,materialColors?materialPreviewColor():f.color||pastrySpecs[f.kind][0])+'">':'<svg viewBox="-1.15 -1.15 2.3 2.3" aria-hidden="true"><polygon fill="currentColor" points="'+f.poly.map(v=>v.join(',')).join(' ')+'"/></svg>')+'</button>').join('');
 const path=strokes.map(s=>'<polyline points="'+s.points.map(([x,y])=>(r.width/2+x*u)+','+(r.height/2+y*u)).join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="'+(s.width*u)+'" stroke-linecap="round" stroke-linejoin="round"/>').join('');
 let controls='';if(p&&!p.fixedBase&&!drawing&&wkActiveView==='top'){const bounds=partBounds(p),width=(bounds.right-bounds.left)*u+8,height=(bounds.bottom-bounds.top)*u+8,left=r.width/2+(p.x+bounds.left)*u-4,top=r.height/2+(p.y+bounds.top)*u-4,barLeft=Math.max(64,Math.min(r.width-64,left+width/2))-left;
 controls='<div class="selectionFrame" style="left:'+left+'px;top:'+top+'px;width:'+width+'px;height:'+height+'px"><button class="objectHandle rotateHandle" data-handle="rotate" aria-label="拖动旋转选中物件" title="拖动旋转">↻</button><button class="objectHandle resizeHandle" data-handle="resize" aria-label="拖动缩放选中物件" title="拖动缩放">↘</button><button class="objectHandle deleteHandle" data-edit="remove" aria-label="删除选中物件" title="删除">×</button><div class="objectBar" style="left:'+barLeft+'px"><button data-edit="shrink" aria-label="缩小选中物件">−</button><button data-edit="grow" aria-label="放大选中物件">＋</button><button data-edit="duplicate" aria-label="复制选中物件">⧉</button><button data-edit="turn" aria-label="旋转 15 度">↻</button></div></div>'}
 $('editor').innerHTML=pieces+'<svg class="doodleLayer" viewBox="0 0 '+r.width+' '+r.height+'" aria-hidden="true">'+path+'</svg>'+controls+(freeParts.length||strokes.length?'':'<div class="emptyCanvas"><span>＋</span>从素材库添加第一个形状</div>');
 if(restoreFocus){
  const target=(editAction&&$('editor').querySelector('[data-edit="'+editAction+'"]'))||$('editor').querySelector('[data-i="'+selected+'"]');
  if(target)target.focus({preventScroll:true});else{$('editor').tabIndex=-1;$('editor').focus({preventScroll:true})}
 }

}
function addPiece(kind,x=0,y=0){
 if(state.printing)return;if(freeParts.length>=MAX_PARTS){statusMessage('单个作品最多放置 '+MAX_PARTS+' 个部件。');return}
 rememberEdit();const p=part(kind,x,y,.36);p.color=pastrySpecs[kind]?.[0]||palette[freeParts.length%palette.length];freeParts.push(p);selected=freeParts.length-1;drawing=false;syncBench();renderStatus();statusMessage('');
}
function editPiece(action){
 if(state.printing)return;const p=freeParts[selected];if(!p||p.fixedBase)return;
 if(action==='duplicate'&&freeParts.length>=MAX_PARTS){statusMessage('最多放置 '+MAX_PARTS+' 个部件。');return}
 rememberEdit();
 if(action==='turn')p.angle+=Math.PI/12;
 if(action==='grow')p.s=Math.min(.9,p.s*1.15);
 if(action==='shrink')p.s=Math.max(.12,p.s/1.15);
 if(action==='raise'&&selected<freeParts.length-1){[freeParts[selected],freeParts[selected+1]]=[freeParts[selected+1],p];selected++}
 if(action==='lower'&&selected>(freeParts[0]?.fixedBase?1:0)){[freeParts[selected],freeParts[selected-1]]=[freeParts[selected-1],p];selected--}
 if(action==='duplicate'){const cp=structuredClone(p);delete cp.decorId;cp.x=Math.min(1.25,cp.x+.16);cp.y=Math.min(.9,cp.y+.12);freeParts.push(cp);selected=freeParts.length-1}
 if(action==='remove'){freeParts.splice(selected,1);selected=Math.min(selected,freeParts.length-1);if(freeParts[selected]?.fixedBase)selected=-1}
 syncBench();renderStatus();
}
async function analyze(name,resolve){
 if(state.printing)return;if(freeParts.length>=MAX_PARTS){$('analysis').textContent='作品已满，请先删除一个部件。';return}
 const token=++state.analysisSeq;state.analyzing=true;$('analysis').textContent='正在本机提取轮廓…';renderStatus();
 try{const model=await resolve();if(token!==state.analysisSeq||!model)return;
  if(freeParts.length>=MAX_PARTS)throw Error('作品已满，请先删除一个部件后重试。');
  rememberEdit();model.s=.55;model.color=palette[freeParts.length%palette.length];freeParts.push(model);selected=freeParts.length-1;copyPart=model;drawing=false;
  $('analysis').textContent='轮廓已添加';statusMessage('');
 }catch(error){if(token===state.analysisSeq)$('analysis').textContent=error.message||'图片读取失败，请重新选择。'}
 finally{if(token===state.analysisSeq){state.analyzing=false;syncBench();renderStatus();updateSample()}}
}
// DEMO recipes describe material shares and visual assembly, not production parameters.
const demoIngredientShares=[[35,20,20,25],[40,58,2],[60,20,10,10],[70,28,2],[55,20,24,1]];
const recipeMaterials={
  'cake-strawberry-mango':[[3,80],[1,20]], 'cake-rose-berry':[[2,55],[3,30],[1,15]],
  'pizza-tomato-basil':[[2,100]], 'pizza-pepper-mushroom':[[2,100]],
  'cookie-citrus-wreath':[[2,80],[1,20]], 'cookie-cocoa-letters':[[2,65],[4,35]]
};
const recipePrices={
  'cake-strawberry-mango':0,'cake-rose-berry':20,
  'pizza-tomato-basil':0,'pizza-pepper-mushroom':15,
  'cookie-citrus-wreath':10,'cookie-cocoa-letters':15
};
for(const g of goods){
  g.cat='recipes';g.price=recipePrices[g.id];
  g.materials=recipeMaterials[g.id].map(([id,share])=>({id,share}));
  g.cap=g.materials[0].id;
  g.sub=g.materials.map(m=>capsules[m.id].name+' '+m.share+'%').join(' + ');
}
function recipeState(g){const list=g.materials.map(m=>capsules[m.id]),bad=list.filter(c=>conflicts(c).length);return bad.length?'含忌口项 · '+[...new Set(bad.flatMap(conflicts))].join('、'):list.some(c=>verdict(c)==='unknown')?'资料待确认':'';}
function recipeDetails(g){
 const unlocked=!g.price||owned.includes(g.id),risk=recipeState(g);
 const ingredients=g.materials.map(m=>'<li>'+escapeHtml(capsules[m.id].name)+' '+m.share+
   '%<br><small>'+escapeHtml(capsules[m.id].ingredients.map((name,i)=>name+' '+demoIngredientShares[m.id][i]+'%').join('、'))+'</small></li>').join('');
 const steps=unlocked?'<ol><li>将配方材料和 '+g.parts.length+' 个装饰部件带入工坊。</li><li>调整部件的位置、角度和大小。</li><li>核对当前批次，再模拟打印。</li></ol>':
   '<p>兑换后可查看制作步骤，并打开完整 3D 成品编辑。</p>';
 return '<details class="recipeDetails"><summary>配方与步骤</summary><div class="recipeScroll" tabindex="0" role="region" aria-label="'+
   escapeHtml(g.name)+'的配方与步骤">'+(risk?'<p>'+escapeHtml(risk)+'</p>':'')+'<p>示例配方 · 材料占比</p><ul>'+ingredients+'</ul>'+steps+
   '<small>配料比例为演示设定，实际制作需核对配料与工艺。</small></div></details>';
}
function renderMarket(){
 document.querySelectorAll('.wallet').forEach(e=>e.textContent='体验积分 · '+points());
 $('marketRec').innerHTML='<a href="#profile" data-settings>当前档案 · '+escapeHtml(typeof profileDisplayName==='function'?profileDisplayName():'个人档案')+' ↗</a>';
 $('stockGrid').innerHTML='';$('stockGrid').hidden=true;
 const grid=$('recipeGrid'),markup=['cake','pizza','cookie'].map(theme=>
   '<section class="recipeCollection"><h3 class="recipeTheme">'+({cake:'蛋糕',pizza:'披萨',cookie:'饼干'}[theme])+'</h3><div class="recipePair">'+
   goods.filter(g=>g.theme===theme).map(stockCard).join('')+'</div></section>'
 ).join('');
 if(grid._recipeMarkup!==markup){
  const expanded=new Set([...grid.querySelectorAll('[data-recipe-id]')].filter(card=>card.querySelector('details')?.open).map(card=>card.dataset.recipeId));
  const active=document.activeElement,card=active?.closest?.('[data-recipe-id]'),focusId=card&&grid.contains(active)?card.dataset.recipeId:null;
  const focusSummary=Boolean(focusId&&active.matches?.('summary'));
  grid.innerHTML=markup;grid._recipeMarkup=markup;
  grid.querySelectorAll('[data-recipe-id]').forEach(item=>{const detail=item.querySelector('details');if(detail)detail.open=expanded.has(item.dataset.recipeId)});
  if(focusId)grid.querySelector('[data-recipe-id="'+focusId+'"] '+(focusSummary?'summary':'[data-good]'))?.focus({preventScroll:true});
 }

 $('myStock').innerHTML=owned.length?goods.filter(g=>owned.includes(g.id)).map(stockCard).join(''):'<p class="note">还没有收藏的菜谱。<a href="#market" id="findStock">浏览菜谱 ↗</a></p>';
 $('ownedTools').innerHTML=goods.filter(g=>owned.includes(g.id)).map(g=>'<button class="tiny" data-good="'+g.id+'">'+g.name+' ＋</button>').join('');
}
function recipeRender(g){
 const action=g.price&&!owned.includes(g.id)?g.price+' 积分兑换':'打开';
 return '<button type="button" class="stockPhoto recipeRender" data-good="'+g.id+'" aria-label="'+action+escapeHtml(g.name)+'"><img class="recipeRenderImage" src="'+escapeHtml(g.cover)+'" alt="'+escapeHtml(g.name)+'的 3D 成品" width="810" height="585" loading="lazy" decoding="async"></button>';
}
function stockCard(g){
 const risk=recipeState(g), unlocked=owned.includes(g.id);
 const label=unlocked?'已解锁 · 打开编辑 ↗':g.price?g.price+' 积分兑换':'免费打开 ↗';
 return '<article class="stockCard" data-recipe-id="'+g.id+'">'+recipeRender(g)+
   '<div class="recipeBody"><h3>'+escapeHtml(g.name)+'</h3><div class="recipeMid"><div class="recipeMeta"><p>'+escapeHtml(g.sub)+'</p>'+
   (risk?'<small>'+escapeHtml(risk)+'</small>':'')+'</div>'+recipeDetails(g)+'</div>'+
   '<button type="button" class="secondary" data-good="'+g.id+'">'+label+'</button></div></article>';
}
function setMarket(tab){marketTab=tab==='caps'?'caps':'recipes';requestAnimationFrame(()=>$(marketTab==='caps'?'marketCaps':'marketRecipes').scrollIntoView({block:'start',behavior:'smooth'}));}
function useGood(g){
 if(state.printing||!g)return false;
 wkOpenRecipe(g);
 dismiss();
 return true;
}
function toast(message){let el=$('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='newToast';el.setAttribute('role','status');document.body.append(el)}el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,3200)}
function executeCommand(text){
 const value=text.trim().replace(/[，。！!]/g,'');if(!value)return;
 if(state.printing)return;const kind=Object.values(assetGroups).flat().sort((a,b)=>b.length-a.length).find(k=>value.includes(k));
 if(/^(添加|加一个|加一颗|加|放一个|来一个)/.test(value)&&kind){addPiece(kind);return}
 if(/^(撤销|后退一步)$/.test(value)){undoEdit();return}
 if(/^(重做)$/.test(value)){redoEdit();return}
 const p=freeParts[selected];if(!p){statusMessage('先点选一个物件，或输入“添加星星”。');return}
 const colors={'红':'#cc7777','粉':'#d89da8','黄':'#d6b462','绿':'#86a28b','蓝':'#89a5bd','紫':'#af96ba','棕':'#b18b68','白':'#eee8d4'};
 const color=Object.keys(colors).find(c=>value.includes(c));
 if(color&&/(变|改|换|设|颜色)/.test(value)){rememberEdit();p.color=colors[color];materialColors=false;syncBench();statusMessage('已调整显示颜色。显示色不代表实际食品颜色。');return}
 if(/(放大|变大|大一点)/.test(value)){editPiece('grow');statusMessage('已放大选中物件。');return}
 if(/(缩小|变小|小一点)/.test(value)){editPiece('shrink');statusMessage('已缩小选中物件。');return}
 if(/(旋转|转动)/.test(value)){const n=value.match(/(-?\d+(?:\.\d+)?)\s*度?/);const degrees=n?Number(n[1]):15;if(!Number.isFinite(degrees)||Math.abs(degrees)>3600){statusMessage('旋转角度请在 -3600 到 3600 度之间。');return}rememberEdit();p.angle+=(/逆时针/.test(value)?-1:1)*degrees*Math.PI/180;syncBench();statusMessage('已旋转选中物件。');return}
 if(/(左移|右移|上移|下移|向左|向右|向上|向下)/.test(value)){rememberEdit();if(/左/.test(value))p.x-=.12;if(/右/.test(value))p.x+=.12;if(/上/.test(value))p.y-=.12;if(/下/.test(value))p.y+=.12;p.x=Math.max(-1.25,Math.min(1.25,p.x));p.y=Math.max(-.9,Math.min(.9,p.y));syncBench();statusMessage('已移动选中物件。');return}
 if(/^(删除|删掉|移除)(选中|这个|物件|模型|部件)*$/.test(value)){editPiece('remove');statusMessage('已删除，可撤销。');return}
 if(/(上一层|叠到上面)/.test(value)){editPiece('raise');return}if(/(下一层|叠到下面)/.test(value)){editPiece('lower');return}
 statusMessage('暂不理解这条指令。支持添加已有素材、改颜色、放大缩小、旋转、移动和撤销。未接入生成式 AI。');
}
function drawStrokes3D(g,project,levels,zoom=viewZoom){
 const z=(levels.length?Math.max(...levels):0)*.72+state.layer*.065+.04;
 for(const s of strokes){if(s.points.length<2)continue;g.beginPath();s.points.forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](...project(x,y,z)));g.strokeStyle=materialColors?'#765849':s.color;g.lineWidth=Math.max(1,s.width*110*zoom);g.lineCap='round';g.lineJoin='round';g.stroke()}
}
// Bind after all original state has been declared, before the first render.
freeParts.forEach((p,i)=>p.color=p.color||assetColor(p.kind));
state.mode='free';state.spin=false;selected=-1;kinds.splice(0,kinds.length,...Object.values(assetGroups).flat());
$('assetCategories').onclick=e=>{const b=e.target.closest('[data-category]');if(b){assetCategory=b.dataset.category;$('assetSearch').value='';renderAssets()}};
$('assetSearch').oninput=renderAssets;renderAssets();
$('shapes').onclick=e=>{const k=e.target.closest('[data-shape]')?.dataset.shape;if(k)addPiece(k,.08*(freeParts.length%3),0)};
$('shapes').ondragstart=e=>{const b=e.target.closest('[data-shape]');if(!b)return;e.dataTransfer.setData('text/plain',b.dataset.shape);e.dataTransfer.effectAllowed='copy';$('editor').classList.add('receiving')};
$('undo').onclick=undoEdit;$('redo').onclick=redoEdit;
$('doodleToggle').onclick=()=>{drawing=!drawing;selected=-1;syncBench();statusMessage(drawing?'画笔已开启，在顶视图拖动绘制。点击画笔可回到选择。':'已回到物件选择。')};
$('materialToggle').onclick=()=>{materialColors=!materialColors;syncBench()};
$('partColor').onchange=e=>{const p=freeParts[selected];if(p){rememberEdit();p.color=e.target.value;materialColors=false;syncBench()}};
document.querySelectorAll('[data-expand]').forEach(b=>b.onclick=()=>{const pair=$('viewPair'),target=b.dataset.expand;if(pair.dataset.expanded===target)delete pair.dataset.expanded;else pair.dataset.expanded=target;document.querySelectorAll('[data-expand]').forEach(x=>{x.textContent=pair.dataset.expanded===x.dataset.expand?'↙':'⛶';x.setAttribute('aria-expanded',String(pair.dataset.expanded===x.dataset.expand))});requestAnimationFrame(paintEditor)});
$('resetView').onclick=()=>{state.angle=.25;viewPitch=.46;viewZoom=1;state.spin=false;draw()};
$('markChoices').onclick=e=>{const b=e.target.closest('[data-mark]');if(b){rememberEdit();designs.free.mark=b.dataset.mark;syncBench()}};
$('commandForm').onsubmit=e=>{e.preventDefault();runSmartInput()};
$('commandExamples').onclick=e=>{const b=e.target.closest('[data-command]');if(b){$('assetSearch').value=b.dataset.command;runSmartInput()}};
$('editor').onclick=e=>{if(e.target.closest('[data-edit],[data-handle]'))return;const b=e.target.closest('[data-i]');if(b&&!drawing&&!freeParts[Number(b.dataset.i)]?.fixedBase){wkActiveView='top';selected=Number(b.dataset.i);paintEditor()}};
let pointerEdit=null;
$('editor').onpointerdown=e=>{
 if(state.printing||pointerEdit||e.button>0||e.target.closest('[data-edit]'))return;
 const hit=e.target.closest('[data-i]');if(hit&&freeParts[Number(hit.dataset.i)]?.fixedBase)return;
 wkActiveView='top';const pt=editorPoint(e);if(drawing){rememberEdit();activeStroke={points:[[pt.x,pt.y]],color:$('brushColor').value,width:.026};strokes.push(activeStroke);pointerEdit={kind:'draw',id:e.pointerId,committed:true};}
 else{const handle=e.target.closest('[data-handle]'),b=e.target.closest('[data-i]');if(handle&&freeParts[selected]){const before=snapshot();const p=freeParts[selected];pointerEdit={id:e.pointerId,before,kind:handle.dataset.handle,startAngle:Math.atan2(pt.y-p.y,pt.x-p.x),angle:p.angle,distance:Math.max(.05,Math.hypot(pt.x-p.x,pt.y-p.y)),scale:p.s};}
 else if(b){selected=Number(b.dataset.i);const before=snapshot(),p=freeParts[selected];pointerEdit={id:e.pointerId,before,startX:e.clientX,startY:e.clientY,kind:'move',dx:p.x-pt.x,dy:p.y-pt.y};}
 else{selected=-1;paintEditor();return}}
 e.preventDefault();$('editor').setPointerCapture(e.pointerId);paintEditor();
};
$('editor').onpointermove=e=>{if(!pointerEdit||e.pointerId!==pointerEdit.id)return;if(!pointerEdit.committed&&pointerEdit.kind!=='draw'){if(pointerEdit.kind==='move'&&Math.hypot(e.clientX-pointerEdit.startX,e.clientY-pointerEdit.startY)<2)return;rememberEdit(pointerEdit.before);pointerEdit.committed=true;}const pt=editorPoint(e),p=freeParts[selected];
 if(pointerEdit.kind==='draw'){if(activeStroke.points.length<1500){const last=activeStroke.points.at(-1);if(Math.hypot(pt.x-last[0],pt.y-last[1])>.015)activeStroke.points.push([pt.x,pt.y])}}
 else if(!p)return;
 else if(pointerEdit.kind==='move'){p.x=Math.max(-1.25,Math.min(1.25,pt.x+pointerEdit.dx));p.y=Math.max(-.9,Math.min(.9,pt.y+pointerEdit.dy))}
 else if(pointerEdit.kind==='resize')p.s=Math.max(.12,Math.min(.9,pointerEdit.scale*Math.hypot(pt.x-p.x,pt.y-p.y)/pointerEdit.distance));
 else if(pointerEdit.kind==='rotate')p.angle=pointerEdit.angle+Math.atan2(pt.y-p.y,pt.x-p.x)-pointerEdit.startAngle;
 if(p&&!drawing)constrainPart(p);
 paintEditor();draw();
};
function endPointer(e){if(!pointerEdit||e.pointerId!==pointerEdit.id)return;if(activeStroke&&activeStroke.points.length<2)strokes.pop();pointerEdit=null;activeStroke=null;paintEditor();draw()}
$('editor').onpointerup=$('editor').onpointercancel=$('editor').onlostpointercapture=endPointer;
$('editor').onkeydown=e=>{if(e.target.closest('[data-edit],[data-handle]'))return;const b=e.target.closest('[data-i]');if(!b||freeParts[Number(b.dataset.i)]?.fixedBase)return;wkActiveView='top';selected=Number(b.dataset.i);if(['Delete','Backspace'].includes(e.key)){e.preventDefault();editPiece('remove')}else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const p=freeParts[selected];rememberEdit();const d=e.shiftKey?.15:.04;if(e.key==='ArrowLeft')p.x-=d;if(e.key==='ArrowRight')p.x+=d;if(e.key==='ArrowUp')p.y-=d;if(e.key==='ArrowDown')p.y+=d;p.x=Math.max(-1.25,Math.min(1.25,p.x));p.y=Math.max(-.9,Math.min(.9,p.y));constrainPart(p);paintEditor();draw();$('editor').querySelector('[data-i="'+selected+'"]')?.focus()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();paintEditor()}};
document.addEventListener('keydown',e=>{if(state.page!=='studio'||wkMode!=='template'||state.printing||e.target.closest('input,textarea,select'))return;if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoEdit():undoEdit()}if(e.key==='Escape'){drawing=false;selected=-1;delete $('viewPair').dataset.expanded;syncBench()}});
// Mouse orbit, vertical tilt, wheel zoom, and two-touch pinch zoom.
const viewPointers=new Map();let viewGesture=null;
scene.onpointerdown=e=>{if(state.printing)return;viewPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});scene.setPointerCapture(e.pointerId);state.spin=false;if(viewPointers.size===1)viewGesture={x:e.clientX,y:e.clientY,a:state.angle,p:viewPitch};else{const [a,b]=[...viewPointers.values()];viewGesture={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom:viewZoom}};e.preventDefault()};
scene.onpointermove=e=>{if(!viewPointers.has(e.pointerId)||!viewGesture)return;viewPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(viewPointers.size===1&&viewGesture.a!==undefined){state.angle=viewGesture.a+(e.clientX-viewGesture.x)*.012;viewPitch=Math.max(.15,Math.min(.85,viewGesture.p+(e.clientY-viewGesture.y)*.003))}else if(viewPointers.size>1&&viewGesture.distance){const[a,b]=[...viewPointers.values()];viewZoom=Math.max(.55,Math.min(1.75,viewGesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/viewGesture.distance))}draw()};
scene.onpointerup=scene.onpointercancel=scene.onlostpointercapture=e=>{viewPointers.delete(e.pointerId);if(viewPointers.size===1){const p=[...viewPointers.values()][0];viewGesture={x:p.x,y:p.y,a:state.angle,p:viewPitch}}else if(!viewPointers.size)viewGesture=null};
scene.addEventListener('wheel',e=>{e.preventDefault();viewZoom=Math.max(.55,Math.min(1.75,viewZoom*Math.exp(-e.deltaY*.0015)));state.spin=false;draw()},{passive:false});
document.querySelector('.marketJump').onclick=e=>{const b=e.target.closest('[data-market]');if(b)setMarket(b.dataset.market)};
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-good],[data-claim],[data-use-good]');
 if(!button)return;
 e.stopImmediatePropagation();
 const g=goods.find(item=>item.id===(button.dataset.good||button.dataset.claim||button.dataset.useGood));
 if(!g||state.printing)return;
 if(button.dataset.claim||!g.price||owned.includes(g.id)){
   claimRecipe(g);
 }else{
   showExchange(g);
 }
},true);
function showExchange(g){
 const balance=points(), enough=balance>=g.price;
 const controls=enough?'<button class="primary" data-claim="'+g.id+'">确认兑换并打开</button>':'';
 modal('<h2>'+escapeHtml(g.name)+'</h2><p>兑换需要 '+g.price+' 体验积分，当前余额 '+balance+' 积分。</p><p>'+
   (enough?'兑换后剩余 '+(balance-g.price)+' 积分，可在此浏览器重复编辑。':'还差 '+(g.price-balance)+' 积分。')+
   '</p><div class="actions">'+controls+'<button class="secondary" data-close>'+(enough?'取消':'返回菜谱')+'</button></div>');
}
async function claimRecipe(g){
 const acquire=()=>{
   if(state.printing)return;
   updateRecipeWallet();
   if(!owned.includes(g.id)){
     if(points()<g.price){showExchange(g);return}
     try{
       localStorage.setItem(recipeReceiptPrefix+g.id,String(g.price));
     }catch{
       toast('浏览器未能保存领取记录，请允许本站使用本机存储后再试。');return;
     }
     updateRecipeWallet();
   }
   useGood(g);
 };
 if(globalThis.navigator?.locks){
   await navigator.locks.request('ankuan-recipe-wallet',acquire);
 }else{acquire()}
}
window.addEventListener('storage',e=>{
 if(e.key===null||e.key===legacyRecipeKey||e.key.startsWith(recipeReceiptPrefix)){
   updateRecipeWallet();renderMarket();
 }
});
