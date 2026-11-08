const wkDraftKey='ankuan-workshop-8';
const wkShelfKey='ankuan-my-parts-7';
function wkRead(key,fallback){
  try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}
}
function wkWrite(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}
}
const wkSaved=wkRead(wkDraftKey,{});
let wkType=Object.hasOwn(workshopTemplates,wkSaved.active||'')?wkSaved.active:'cake';
let wkCategory='',wkActiveView='perspective';
let wkPersonal=false,wkMode='template',wkMyParts=wkRead(wkShelfKey,[]);
if(!Array.isArray(wkMyParts))wkMyParts=[];
const wkDrafts=wkSaved.drafts||{};
let wkSlot=wkSaved.slot && wkDrafts[wkSaved.slot]?.theme===wkType ? wkSaved.slot : wkType;
let wkRecipe=null;
const wkViews=new Set(['perspective']);
function wkPackPart(piece){
  if(!piece.templateKey)return piece;
  const {poly,relief,...editable}=piece;
  return editable;
}
function wkUnpackPart(piece){
  if(!piece.templateKey)return piece;
  const asset=templateAssetByKey(piece.templateKey);
  return asset?{...makeTemplatePart(asset),...piece}:piece;
}
function wkCapture(){
  wkDrafts[wkSlot]={theme:wkType,preset:wkRecipe?.id||null,materials:[...selectedMaterialIds()],parts:freeParts.map(wkPackPart),strokes,design:designs.free,selected,recipeId};
  if(!wkWrite(wkDraftKey,{active:wkType,slot:wkSlot,drafts:wkDrafts}) && !wkCapture.warned){
    wkCapture.warned=true;toast('本机存储空间不足。草稿会保留到关闭此页。');
  }
}
function wkDecorId(p){
  if(!p.decorId)p.decorId=globalThis.crypto?.randomUUID?.()||('d'+Date.now().toString(36)+Math.random().toString(36).slice(2));
  return p.decorId;
}
function wkPresetParts(recipe){
  return recipe.parts.map(({key,x,y,scale,rotation})=>{
    const piece=makeTemplatePart(templateAssetByKey(key),x,y);
    return {...piece,s:scale,angle:rotation||0};
  });
}
// The cookie base has its own free studio example, also shown on its picker cover.
const cookieStudioStarter={id:'studio-cookie',theme:'cookie',name:'花朵字母饼干',cover:workshopTemplates.cookie.cover,
  parts:[['icing-A',0,.08,.35,-.05],['rosette',-.38,-.19,.23],['hi-flower',.40,.19,.23],['blueberry',.17,-.38,.10],['orange',-.30,.37,.22,-.3]]
    .map(([key,x,y,scale,rotation=0])=>({key,x,y,scale,rotation}))};
function wkStarter(theme){return theme==='cookie'?cookieStudioStarter:studioRecipes.find(r=>r.theme===theme)}
function wkLoad(id,carried=[],slot=id,sourceRecipe=null){
  wkType=id;wkSlot=slot;
  const draft=wkDrafts[slot];
  const base=makeTemplateStarter(id)[0];
  const saved=(draft?.parts||[]).map(wkUnpackPart).filter(p=>!p.fixedBase&&Array.isArray(p.poly));
  // Old versions automatically saved even a pristine empty base on first visit.
  const untouched=!draft||(!draft.theme&&!saved.length&&!draft.strokes?.length&&!draft.recipeId);
  const preset=sourceRecipe||studioRecipes.find(r=>r.id===draft?.preset)||wkStarter(id);
  wkRecipe=preset;
  const existing=untouched?wkPresetParts(preset):saved;
  const decorations=new Map(existing.map(p=>[wkDecorId(p),p]));
  for(const p of carried)decorations.set(wkDecorId(p),p);
  freeParts=[base,...[...decorations.values()].slice(0,MAX_PARTS-1)];
  strokes=draft?.strokes||[];designs.free=draft?.design||{mark:'',text:''};selected=draft?.selected??-1;recipeId=draft?.recipeId||null;
  drawing=false;undoStack=[];redoStack=[];separated=false;
  state.layer=12;state.angle=.35;viewZoom=1.72;viewPitch=.52;state.spin=false;state.wire=false;materialColors=false;
  $('explodePastry').setAttribute('aria-pressed','false');
  $('currentCover').src=preset.cover;
  $('currentTemplate').textContent=workshopTemplates[id].name;
  $('workName').textContent=preset.name;
  wkCategory=workshopTemplates[id].parts[0].group;
  if(sourceRecipe)recipeId=sourceRecipe.id;
  wkRenderShelf();
  const materialIds=sourceRecipe?sourceRecipe.materials.map(m=>m.id):(draft?.materials||[]);
  setMaterials(materialIds,{remember:false});
}
function wkOpenRecipe(recipe){
  const existing=Object.entries(wkDrafts).find(([slot,draft])=>
    slot.startsWith('recipe-')&&draft.preset===recipe.id&&wkIsOriginal(draft,recipe));
  wkCapture();
  const slot=existing?.[0]||'recipe-'+recipe.id+'-'+Date.now().toString(36);
  wkPersonal=false;wkSetMode('template');wkOpenMaterial(false);
  wkLoad(recipe.theme,[],slot,recipe);
  location.hash='studio';
}
function wkIsOriginal(draft,recipe){
  const parts=draft.parts.filter(p=>!p.fixedBase);
  return !draft.strokes?.length && parts.length===recipe.parts.length && parts.every((p,i)=>{
    const item=recipe.parts[i];
    return p.templateKey===item.key && p.x===item.x && p.y===item.y &&
      p.s===item.scale && p.angle===(item.rotation||0) && p.color===templateAssetByKey(item.key).color;
  });
}
function wkSetMode(mode){
  if(state.printing)return;
  wkMode=mode;state.spin=false;
  $('workspace').hidden=mode!=='template';
  $('generationWorkshop').hidden=mode!=='generate';
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  if(mode==='template')requestAnimationFrame(()=>{paintEditor();draw()});
}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>wkSetMode(b.dataset.mode));
function wkRenderShelf(){
  $('showLibrary').setAttribute('aria-pressed',String(!wkPersonal));$('showPersonal').setAttribute('aria-pressed',String(wkPersonal));
  const assets=wkPersonal?wkMyParts:workshopTemplates[wkType].parts,groups=new Map();
  const categories=[...new Set(assets.map(a=>a.group))];
  const categoryBar=$('foodCategories');categoryBar.hidden=wkPersonal;
  if(!wkPersonal){
    if(!categories.includes(wkCategory))wkCategory=categories[0];
    categoryBar.innerHTML=categories.map(g=>'<button data-food-category="'+escapeHtml(g)+'" aria-pressed="'+(wkCategory===g)+'">'+escapeHtml(g)+'</button>').join('');
  }
  assets.forEach((a,i)=>{
    const group=wkPersonal?'已收藏':a.group;
    if(!groups.has(group))groups.set(group,[]);
    const image=wkPersonal?(a.relief?stampThumb(a,a.color||'#ce9a70'):wkShapeThumb(a)):a.thumb;
    groups.get(group).push('<button type="button" class="wkAsset" draggable="true" data-wk-asset="'+i+'"><img draggable="false" alt="" src="'+escapeHtml(image)+'"><span>'+escapeHtml(a.name||a.kind)+'</span></button>');
  });
  $('templateLibrary').innerHTML=[...groups].map(([g,tiles])=>'<section class="wkAssetGroup" data-section="'+escapeHtml(g)+'"><h3 class="wkGroup">'+escapeHtml(g)+' <small>'+tiles.length+'</small></h3><div class="wkAssets">'+tiles.join('')+'</div></section>').join('')||'<p class="wkLibraryNote">从照片或手绘做一个自己的部件。 <button class="wkLibraryLink" id="makeFirst">去图生 3D ↗</button></p>';
  if($('makeFirst'))$('makeFirst').onclick=()=>wkSetMode('generate');
}
function wkShapeThumb(piece){
  const c=document.createElement('canvas');c.width=144;c.height=92;
  const g=c.getContext('2d');g.translate(72,46);g.scale(37,37);g.fillStyle=piece.color||'#c69b77';
  g.beginPath();piece.poly.forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](x,y));g.closePath();g.fill();return c.toDataURL();
}
function wkOpenMaterial(show){
  $('materialStep').hidden=!show;
  if(show){renderStatus();$('materialStep').scrollIntoView({block:'nearest'});$('closeMaterials').focus({preventScroll:true})}
}
$('chooseCapsule').onclick=()=>wkOpenMaterial(true);$('closeMaterials').onclick=()=>{wkOpenMaterial(false);$('chooseCapsule').focus()};
$('showLibrary').onclick=()=>{wkPersonal=false;wkRenderShelf()};$('showPersonal').onclick=()=>{wkPersonal=true;wkRenderShelf()};
$('foodCategories').onclick=e=>{
  const tab=e.target.closest('[data-food-category]');if(!tab)return;
  const rail=$('templateLibrary');
  const section=[...rail.querySelectorAll('.wkAssetGroup')].find(el=>el.dataset.section===tab.dataset.foodCategory);
  if(section){
    rail.scrollTop+=section.getBoundingClientRect().top-rail.getBoundingClientRect().top;
    wkMarkCategory(section.dataset.section);
  }
};
function wkMarkCategory(name){
  wkCategory=name;
  for(const b of $('foodCategories').querySelectorAll('button')){
    b.setAttribute('aria-pressed',String(b.dataset.foodCategory===name));
  }
}
$('templateLibrary').addEventListener('scroll',()=>{
  if(wkPersonal)return;
  const rail=$('templateLibrary'), sections=[...rail.querySelectorAll('.wkAssetGroup')];
  const last=sections.at(-1);
  if(!last)return;
  const edge=rail.getBoundingClientRect().top+3;
  const current=rail.scrollTop>0 && rail.scrollTop+rail.clientHeight>=rail.scrollHeight-2?last:
    sections.filter(el=>el.getBoundingClientRect().top<=edge).at(-1)||sections[0];
  wkMarkCategory(current.dataset.section);
});
const wkOld=wkRead('ankuan-workshop-7',{}),wkLegacyId={cake:'sandwich',pizza:'animal',cookie:'chocolate'};
$('chooseTemplate').onclick=()=>{
  $('carryRow').hidden=!freeParts.some(p=>!p.fixedBase);
  $('oldDecor').hidden=!wkOld.drafts?.[wkLegacyId[wkType]]?.parts?.length;
  const copies=Object.entries(wkDrafts).filter(([slot])=>slot.startsWith('recipe-'));
  $('recipeCopies').innerHTML=copies.map(([slot,d])=>{
    const r=studioRecipes.find(r=>r.id===d.preset);
    return r?'<button type="button" data-recipe-slot="'+escapeHtml(slot)+'">'+escapeHtml(r.name)+' · '+new Date(parseInt(slot.split('-').at(-1),36)).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+'</button>':'';
  }).join('');
  $('savedCopies').hidden=!copies.length;
  $('templatePicker').showModal();
};
$('closePicker').onclick=()=>$('templatePicker').close();
$('templateCards').innerHTML=Object.values(workshopTemplates).map(t=>'<button data-wk-template="'+t.id+'"><img alt="" src="'+escapeHtml(wkStarter(t.id).cover)+'"><b>'+escapeHtml(t.name)+'</b><small>'+escapeHtml(t.action)+'</small></button>').join('');
function wkCarry(target,decorations,scale=1){
  const incoming=decorations.map(p=>{
    const copy=structuredClone(p);copy.x*=scale;copy.y*=scale;copy.decorId=wkDecorId(p);return copy
  });
  const targetDraft=wkDrafts[target];
  const pieces=(targetDraft?.parts||[]).filter(p=>!p.fixedBase);
  const seedCount=(!targetDraft||(!targetDraft.theme&&!pieces.length&&!targetDraft.strokes?.length&&!targetDraft.recipeId))
    ?wkStarter(target).parts.length:0;
  const known=new Set(pieces.map(wkDecorId));
  if(seedCount+known.size+incoming.filter(p=>!known.has(p.decorId)).length>MAX_PARTS-1){
    toast('目标底座的装饰空间不足，可以取消复制装饰后再切换。');return false
  }
  wkPersonal=false;wkOpenMaterial(false);wkLoad(target,incoming);wkCapture();return true;
}
$('templateCards').onclick=e=>{
  const id=e.target.closest('[data-wk-template]')?.dataset.wkTemplate;if(!id||state.printing)return;
  if(id!==wkSlot){
    const decorators=$('carryDecor').checked?freeParts.filter(p=>!p.fixedBase):[];
    decorators.forEach(wkDecorId);wkCapture();
    if(!wkCarry(id,decorators,makeTemplateStarter(id)[0].s/freeParts[0].s))return;
  }
  $('templatePicker').close();
};
function wkResetDecor(toPreset){
  if(state.printing)return;
  rememberEdit();
  freeParts=[makeTemplateStarter(wkType)[0],...(toPreset?wkPresetParts(wkRecipe):[])];
  selected=-1;strokes=[];designs.free={mark:'',text:''};drawing=false;
  syncBench();renderStatus();$('templatePicker').close();
}
$('restorePreset').onclick=()=>wkResetDecor(true);
$('emptyBase').onclick=()=>wkResetDecor(false);
$('recipeCopies').onclick=e=>{
  const slot=e.target.closest('[data-recipe-slot]')?.dataset.recipeSlot;
  if(!slot||!wkDrafts[slot])return;
  wkCapture();wkLoad(wkDrafts[slot].theme,[],slot);$('templatePicker').close();
};
$('oldDecor').onclick=()=>{
  const parts=(wkOld.drafts?.[wkLegacyId[wkType]]?.parts||[]).slice(1).map(wkUnpackPart).filter(p=>Array.isArray(p.poly));
  parts.forEach((p,i)=>p.decorId='v7-'+wkLegacyId[wkType]+'-'+i);
  wkCapture();if(wkCarry(wkType,parts))$('templatePicker').close();
};
function wkRefreshSelection(){
  $('chooseCapsule').disabled=!freeParts.length||state.printing;
  wkPositionSelection();
}
function wkRefreshViews(){
  $('viewPair').dataset.show=wkViews.size===2?'both':[...wkViews][0];
  document.querySelectorAll('[data-wk-view]').forEach(b=>{
    const on=wkViews.has(b.dataset.wkView);b.setAttribute('aria-pressed',String(on));b.disabled=on&&wkViews.size===1;
  });
  requestAnimationFrame(()=>{paintEditor();draw()});
}
$('workViews').onclick=e=>{const b=e.target.closest('[data-wk-view]');if(!b||b.disabled)return;const v=b.dataset.wkView;wkActiveView=wkViews.has(v)?(v==='top'?'perspective':'top'):v;wkViews.has(v)?wkViews.delete(v):wkViews.add(v);wkRefreshViews()};
function wkAdd(index,point){
  if(state.printing)return;
  if(freeParts.length>=MAX_PARTS){toast('请先移除一个部件再添加。');return}
  const a=(wkPersonal?wkMyParts:workshopTemplates[wkType].parts)[index];if(!a)return;
  const p=wkPersonal?structuredClone(a):makeTemplatePart(a,0,0);
  const position=wkPersonal?(point||{x:0,y:0}):templatePlacement(wkType,a,freeParts,point);p.x=position.x;p.y=position.y;
  wkDecorId(p);rememberEdit();freeParts.push(constrainPart(p));selected=freeParts.length-1;drawing=false;syncBench();renderStatus();
}
$('templateLibrary').onclick=e=>{const b=e.target.closest('[data-wk-asset]');if(b)wkAdd(Number(b.dataset.wkAsset))};
const wkMime='application/x-ankuan-template-part';
$('templateLibrary').ondragstart=e=>{const b=e.target.closest('[data-wk-asset]');if(b){e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData(wkMime,b.dataset.wkAsset)}};
// The drawing uses a fixed logical canvas and CSS object-fit:contain.
function wkScenePoint(e){
  const rect=scene.getBoundingClientRect(),fit=Math.min(rect.width/scene.width,rect.height/scene.height);
  const x=(e.clientX-rect.left-(rect.width-scene.width*fit)/2)/fit;
  const y=(e.clientY-rect.top-(rect.height-scene.height*fit)/2)/fit;
  const zoom=viewZoom*cameraFit(freeParts,pieceLevels(freeParts),115),scale=115*zoom,ca=Math.cos(state.angle),sa=Math.sin(state.angle);
  const back=(z=0)=>{const u=(x-scene.width/2)/scale,v=(y-296+z*65*zoom)/(scale*viewPitch);return {x:u*ca+v*sa,y:-u*sa+v*ca}};
  return {x,y,back,zoom,scale,ca,sa};
}
function wkDropPoint(e){
  const frame=wkScenePoint(e),base=freeParts.find(p=>p.fixedBase);
  if(!base)return frame.back();
  let pos=frame.back(foodPartHeight(base,0,0));
  for(let n=0;n<2;n++)pos=frame.back(foodPartHeight(base,(pos.x-base.x)/base.s,(pos.y-base.y)/base.s));
  return pos;
}
for(const surface of [scene,$('editor')]){
  surface.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes(wkMime)){e.preventDefault();e.dataTransfer.dropEffect='copy'}});
  surface.addEventListener('drop',e=>{const i=e.dataTransfer.getData(wkMime);if(i==='')return;e.preventDefault();e.stopImmediatePropagation();wkActiveView=surface===scene?'perspective':'top';wkAdd(Number(i),surface===scene?wkDropPoint(e):editorPoint(e))},true);
}
function wkHit(e){
  const frame=wkScenePoint(e),levels=pieceLevels(freeParts);
  const bases=pastryBases(freeParts,levels,separated);
  const sorted=freeParts.map((p,i)=>({p,i})).sort((a,b)=>levels[a.i]-levels[b.i]||(a.p.x-b.p.x)*frame.sa+(a.p.y-b.p.y)*frame.ca);
  for(const {p,i} of sorted.reverse()){
    if(p.fixedBase)continue;
    const c=Math.cos(p.angle),s=Math.sin(p.angle),base=bases[i];
    const outline=new Path2D();p.poly.forEach(([x,y],j)=>outline[j?'lineTo':'moveTo'](x,y));outline.closePath();
    for(let n=32;n>=0;n--){
      const h=p.s*1.5*n/32,z=base+h,point=frame.back(z);
      const dx=(point.x-p.x)/p.s,dy=(point.y-p.y)/p.s,u=dx*c+dy*s,v=-dx*s+dy*c;
      if(Math.abs(u)>1.3||Math.abs(v)>1.3||!ctx.isPointInPath(outline,u,v))continue;
      const top=foodPartHeight(p,u,v);
      if(top>0&&h<=top+.01)return {i,z};
    }
  }
  return null;
}
function wkPositionSelection(){
  const box=$('sceneSelection'),p=freeParts[selected];
  box.hidden=!(p&&!p.fixedBase&&wkActiveView==='perspective'&&wkViews.has('perspective')&&!state.printing&&wkMode==='template');
  if(box.hidden)return;
  const card=$('perspectiveView').getBoundingClientRect(),rect=scene.getBoundingClientRect();
  if(!rect.width||!rect.height){box.hidden=true;return}
  const fit=Math.min(rect.width/scene.width,rect.height/scene.height);
  const levels=pieceLevels(freeParts),base=pastryBases(freeParts,levels,separated)[selected],zoom=viewZoom*cameraFit(freeParts,levels,115);
  const c=Math.cos(p.angle),s=Math.sin(p.angle),ca=Math.cos(state.angle),sa=Math.sin(state.angle),points=[];
  function add(u,v,z){
    const x=p.x+p.s*(u*c-v*s),y=p.y+p.s*(u*s+v*c);
    points.push([rect.left-card.left+(rect.width-scene.width*fit)/2+(scene.width/2+(x*ca-y*sa)*115*zoom)*fit,
      rect.top-card.top+(rect.height-scene.height*fit)/2+(296+(x*sa+y*ca)*115*zoom*viewPitch-z*65*zoom)*fit]);
  }
  for(const [u,v] of p.poly){add(u,v,base);add(u,v,base+foodPartHeight(p,u*.94,v*.94))}
  add(0,0,base+foodPartHeight(p,0,0));
  const xs=points.map(v=>v[0]),ys=points.map(v=>v[1]);
  const width=Math.min(card.width-36,Math.max(40,Math.max(...xs)-Math.min(...xs)+8));
  const height=Math.min(card.height-88,Math.max(28,Math.max(...ys)-Math.min(...ys)+8));
  const x=Math.max(16,Math.min(card.width-width-18,Math.min(...xs)-4));
  const y=Math.max(32,Math.min(card.height-height-46,Math.min(...ys)-4));
  Object.assign(box.style,{left:x+'px',top:y+'px',width:width+'px',height:height+'px'});
  const bar=box.querySelector('.objectBar');
  if(bar)bar.style.left=(Math.max(78,Math.min(card.width-78,x+width/2))-x)+'px';
  $('pickedModel').hidden=!p.sourceModel;if(p.sourceModel)$('pickedModel').href=p.sourceModel;
}
let wkHandle=null;
const wkFrame=$('sceneSelection');
wkFrame.onpointerdown=e=>{
  const handle=e.target.closest('[data-scene-handle]'),p=freeParts[selected];
  if(!handle||!p||p.fixedBase||state.printing)return;
  e.preventDefault();state.spin=false;
  const box=wkFrame.getBoundingClientRect(),x=box.left+box.width/2,y=box.top+box.height/2;
  wkHandle={pointer:e.pointerId,p,action:handle.dataset.sceneHandle,x,y,a:Math.atan2(e.clientY-y,e.clientX-x),r:Math.max(8,Math.hypot(e.clientX-x,e.clientY-y)),s:p.s,angle:p.angle,
    sx:e.clientX,sy:e.clientY,before:snapshot(),moved:false};
  handle.setPointerCapture(e.pointerId);
};
wkFrame.onpointermove=e=>{
  const h=wkHandle;if(!h||e.pointerId!==h.pointer)return;
  if(!h.moved){if(Math.hypot(e.clientX-h.sx,e.clientY-h.sy)<3)return;rememberEdit(h.before);h.moved=true}
  const x=e.clientX-h.x,y=e.clientY-h.y;
  if(h.action==='rotate')h.p.angle=h.angle+Math.atan2(y,x)-h.a;
  else h.p.s=Math.max(.12,Math.min(.9,h.s*Math.hypot(x,y)/h.r));
  constrainPart(h.p);paintEditor();draw();
};
wkFrame.onpointerup=wkFrame.onpointercancel=wkFrame.onlostpointercapture=e=>{
  if(wkHandle?.pointer!==e.pointerId)return;
  const h=wkHandle;wkHandle=null;
  if(!h.moved&&e.type==='pointerup')editPiece(h.action==='rotate'?'turn':'grow');
  else if(h.moved)wkCapture();
};
wkFrame.onclick=e=>{
  const handle=e.target.closest('[data-scene-handle]');
  if(handle&&!e.detail)editPiece(handle.dataset.sceneHandle==='rotate'?'turn':'grow');
};
let wkMove=null;
scene.addEventListener('pointerdown',e=>{
  if(state.printing||e.button>0||wkMove)return;
  wkActiveView='perspective';const hit=wkHit(e);if(!hit){selected=-1;wkRefreshSelection();paintEditor();return}
  e.stopImmediatePropagation();e.preventDefault();selected=hit.i;state.spin=false;scene.setPointerCapture(e.pointerId);
  const p=freeParts[selected],pt=wkScenePoint(e).back(hit.z);
  wkMove={id:e.pointerId,i:selected,z:hit.z,dx:p.x-pt.x,dy:p.y-pt.y,before:snapshot(),cx:e.clientX,cy:e.clientY,moved:false};wkRefreshSelection();paintEditor();
},true);
scene.addEventListener('pointermove',e=>{
  if(!wkMove||wkMove.id!==e.pointerId)return;e.stopImmediatePropagation();
  if(!wkMove.moved){if(Math.hypot(e.clientX-wkMove.cx,e.clientY-wkMove.cy)<3)return;rememberEdit(wkMove.before);wkMove.moved=true}
  const p=freeParts[wkMove.i];if(!p)return;const pt=wkScenePoint(e).back(wkMove.z);p.x=pt.x+wkMove.dx;p.y=pt.y+wkMove.dy;constrainPart(p);draw();paintEditor();
},true);
function wkEndMove(e){if(wkMove?.id===e.pointerId){wkMove=null;wkCapture()}}
for(const ev of ['pointerup','pointercancel','lostpointercapture'])scene.addEventListener(ev,wkEndMove,true);
window.ankuanUseGeneratedPart=piece=>{
  if(!piece||!Array.isArray(piece.poly)||state.printing)return false;
  const asset=structuredClone(piece);asset.x=0;asset.y=0;asset.angle??=0;asset.s||=.52;
  const id=asset.assetId||JSON.stringify([asset.kind,asset.poly,asset.relief]);
  if(!wkMyParts.some(p=>(p.assetId||JSON.stringify([p.kind,p.poly,p.relief]))===id)){
    const next=[...wkMyParts,asset];if(!wkWrite(wkShelfKey,next)){toast('本机收藏空间不足。');return false}wkMyParts=next;
  }
  wkPersonal=true;wkSetMode('template');wkRenderShelf();
  const index=wkMyParts.findIndex(p=>(p.assetId||JSON.stringify([p.kind,p.poly,p.relief]))===id);
  wkAdd(index);document.querySelector('.wkStage').scrollIntoView({block:'nearest'});return true;
};
// On touch screens the rail scrolls horizontally. Pull a tile vertically to place it.
let wkTouch=null,wkIgnoreTapUntil=0;
$('templateLibrary').addEventListener('pointerdown',e=>{
  const tile=e.target.closest('[data-wk-asset]');
  if(e.pointerType!=='touch'||!tile||state.printing)return;
  wkTouch={id:e.pointerId,index:Number(tile.dataset.wkAsset),startY:e.clientY,tile};
  tile.setPointerCapture(e.pointerId);
});
$('templateLibrary').addEventListener('pointermove',e=>{
  if(wkTouch?.id!==e.pointerId)return;
  if(!wkTouch.ghost && Math.abs(e.clientY-wkTouch.startY)>10){
    wkTouch.ghost=wkTouch.tile.cloneNode(true);wkTouch.ghost.className='wkAsset wkDragGhost';
    wkTouch.ghost.tabIndex=-1;wkTouch.ghost.setAttribute('aria-hidden','true');document.body.append(wkTouch.ghost);
  }
  if(wkTouch.ghost){wkTouch.ghost.style.left=e.clientX+'px';wkTouch.ghost.style.top=e.clientY+'px'}
});
function wkFinishTouch(e){
  if(wkTouch?.id!==e.pointerId)return;
  if(wkTouch.ghost){
    wkIgnoreTapUntil=performance.now()+500;wkTouch.ghost.remove();
    if(e.type==='pointerup'){
      const target=document.elementFromPoint(e.clientX,e.clientY);
      if(target?.closest('#perspectiveView')){wkActiveView='perspective';wkAdd(wkTouch.index,wkDropPoint(e))}
      if(target?.closest('#topView')){wkActiveView='top';wkAdd(wkTouch.index,editorPoint(e))}
    }
  }
  wkTouch=null;
}
for(const evt of ['pointerup','pointercancel','lostpointercapture'])$('templateLibrary').addEventListener(evt,wkFinishTouch);
$('templateLibrary').addEventListener('click',e=>{if(performance.now()<wkIgnoreTapUntil)e.stopImmediatePropagation()},true);
function wkStart(){
  new ResizeObserver(()=>{
    const rect=scene.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const width=Math.max(320,Math.min(1600,Math.round(scene.height*rect.width/rect.height)));
    if(scene.width!==width){scene.width=width;draw()}

  }).observe(scene);
  wkLoad(wkType,[],wkSlot);wkRefreshViews();wkSetMode('template');
  window.addEventListener('pagehide',wkCapture);
  window.addEventListener('hashchange',()=>{if(state.page==='studio'&&wkMode==='template')requestAnimationFrame(()=>{paintEditor();draw()})});
}

// The stand scales with the food so rotating or zooming keeps the base seated.
function wkDrawServingSurface(g,w,h){
  const cx=w/2,cy=296;
  const base=freeParts.find(p=>p.fixedBase);
  const zoom=viewZoom*cameraFit(freeParts,pieceLevels(freeParts),115);
  const rx=(base?.s||1)*115*zoom*1.25,ry=rx*viewPitch;
  const cake=wkType==='cake',wood=wkType==='pizza',depth=cake?13:7;
  const centerY=cy+2;
  const gradient=(x1,y1,x2,y2,colors)=>{
    const fill=g.createLinearGradient(x1,y1,x2,y2);
    if(!fill)return colors[0];
    colors.forEach((col,i)=>fill.addColorStop(i/(colors.length-1),col));return fill;
  };
  const ellipse=(x,y,r,s,color)=>{
    g.beginPath();g.ellipse(x,y,r,s,0,0,Math.PI*2);g.fillStyle=color;g.fill();
  };
  g.fillStyle=gradient(0,0,w,h,['#fcf9f1','#f5eee0','#eee4d4']);g.fillRect(0,0,w,h);
  g.save();g.filter='blur(11px)';
  ellipse(cx+14,centerY+(cake?94:depth+8),rx*.96,ry*.65,'rgba(103,77,47,.15)');g.restore();
  if(cake){
    const stand=gradient(cx-62,0,cx+62,0,['#e5d3b7','#fffcf2','#f5e8d0','#dcc6a5']);
    ellipse(cx,centerY+88,76,17,stand);
    g.beginPath();g.moveTo(cx-54,centerY+84);g.bezierCurveTo(cx-27,centerY+79,cx-23,centerY+65,cx-24,centerY+42);
    g.lineTo(cx-33,centerY+17);g.lineTo(cx+33,centerY+17);g.bezierCurveTo(cx+16,centerY+62,cx+28,centerY+76,cx+52,centerY+84);
    g.closePath();g.fillStyle=stand;g.fill();
  }
  const rim=wood?['#b78957','#c59967','#9f784d']:['#e8d8c0','#fff9ed','#d9c8ad'];
  ellipse(cx,centerY+depth,rx,ry,gradient(cx-rx,0,cx+rx,0,rim));
  ellipse(cx,centerY,rx,ry,gradient(cx-rx,centerY-ry,cx+rx,centerY+ry,wood?['#eed6ad','#e4c298','#d9b186']:['#fffdf5','#fbf4e5','#f1e5d1']));
  g.save();g.filter='blur(4px)';ellipse(cx+4,cy+1,rx*.80,ry*.75,'rgba(112,83,45,.16)');g.restore();
}
