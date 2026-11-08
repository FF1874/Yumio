// Streamlined studio: a single search/command box and passive material notices.
function isEditCommand(value){return /^(添加|加一个|加一颗|加|放一个|来一个|撤销|重做|后退一步|改|变|换|设|放大|缩小|旋转|转动|逆时针|左移|右移|上移|下移|向左|向右|向上|向下|删除|删掉|移除|上一层|下一层|叠到)/.test(value.trim())}
function runSmartInput(){const value=$('assetSearch').value.trim();if(!value)return;if(isEditCommand(value))executeCommand(value);else{renderAssets();statusMessage('已筛选“'+value+'”。点击素材添加，或输入“添加'+value+'”。')}}
function ingredientConflicts(c){
 const aliases={麸质:/小麦|小麥|面粉|麵粉|麸质|麩質|面筋|麵筋|大麦|黑麦|麦芽/,鸡蛋:/鸡蛋|雞蛋|蛋黄|蛋黃|蛋白|蛋清|全蛋/,牛奶:/牛奶|奶粉|乳清|酪蛋白|奶油|乳制品|乳脂|黄油|黃油/,花生坚果:/花生|坚果|堅果|核桃|杏仁|榛子|腰果|开心果|松子|碧根果|夏威夷果|巴旦木/,大豆:/大豆|黄豆|黃豆|豆乳|豆浆|豆漿|豆腐/,海鲜:/海鲜|海鮮|虾|蝦|蟹|贝|貝|鱼|魚/,番茄:/番茄|西红柿|西紅柿/};
 const ingredients=[...Object.keys(c.tags||{}),...(c.ingredients||[])];
 return state.profile.filter(term=>ingredients.some(item=>(aliases[term]?aliases[term].test(item):item.includes(term))));
}
function selectedMaterialIds(){return state.selectedMaterials||(state.selectedMaterials=state.capsule===null?[]:[state.capsule]);}
function selectedMaterialRecords(){return selectedMaterialIds().map(id=>capsules[id]).filter(Boolean);}
function materialPreviewColor(){const list=selectedMaterialRecords();return list.length===1?list[0].color:'#a8a399';}
function materialsAllowed(){const list=selectedMaterialRecords();return state.confirmed&&list.length>0&&list.every(c=>state.materialApprovals?.[c.id]===c.batch&&verdict(c)==='match');}
function invalidateSimulation(){state.revision++;state.scan++;state.printSeq++;state.printing=false;$('printState').textContent='';}
function clearApproval(){invalidateSimulation();approvedBatch=null;state.materialApprovals={};state.selectedMaterials=[];state.capsule=null;}
function setMaterials(ids,{remember=true}={}){
 const next=[...new Set(ids)].filter(id=>Number.isInteger(id)&&capsules[id]).sort((a,b)=>a-b);
 if(remember&&JSON.stringify(next)!==JSON.stringify(selectedMaterialIds()))rememberEdit();
 const interrupted=state.printing;invalidateSimulation();state.selectedMaterials=next;state.capsule=next[0]??null;state.materialApprovals={};
 next.forEach(id=>{if(state.confirmed&&verdict(capsules[id])==='match')state.materialApprovals[id]=capsules[id].batch;});
 approvedBatch=state.capsule===null?null:state.materialApprovals[state.capsule]??null;
 renderStatus();syncBench();if(interrupted)$('printState').textContent='模拟已停止，材料发生变化。';return allowed();
}
function selectMaterial(id){return setMaterials(id===null?[]:[...selectedMaterialIds(),id]);}
function toggleMaterial(id){return setMaterials(selectedMaterialIds().includes(id)?selectedMaterialIds().filter(x=>x!==id):[...selectedMaterialIds(),id]);}
function scan(id){selectMaterial(Number(id));wkSetMode('template');wkOpenMaterial(true);if(state.page!=='studio')location.hash='studio';dismiss();}
function askProfile(){location.hash='profile';$('familyPanel').open=true;}
function materialMessage(){
 if(!state.confirmed)return {kind:'unknown',title:'请先保存当前档案',detail:''};
 const unknown=profileRestrictions().unknown;if(unknown.length)return {kind:'unknown',title:'忌口信息待确认',detail:unknown.join('、')+'；暂不能模拟打印。'};
 const list=selectedMaterialRecords();if(!list.length)return {kind:'empty',title:'请选择打印材料',detail:''};
 const conflictsList=list.filter(c=>conflicts(c).length);if(conflictsList.length)return {kind:'conflict',title:'所选材料含忌口项',detail:conflictsList.map(c=>c.name+'：'+conflicts(c).join('、')).join('；')};
 const incomplete=list.filter(c=>c.incomplete);if(incomplete.length)return {kind:'unknown',title:'批次资料不完整',detail:incomplete.map(c=>c.name).join('、')+'；请更换材料或批次。'};
 if(!materialsAllowed())return {kind:'unknown',title:'材料批次待确认',detail:'请重新选择材料。'};
 return {kind:'match',title:'',detail:''};
}
function renderMaterialOptions(){
 const box=$('materialOptions');if(!box)return;
 // Build once so a keyboard user retains focus when toggling a checkbox.
 if(!box.querySelector('[data-material]'))box.innerHTML=capsules.map(c=>'<label class="materialOption"><input type="checkbox" data-material="'+c.id+'"><span class="materialSwatch" style="background:'+c.color+'"></span><span><strong class="materialName">'+escapeHtml(c.name)+'</strong><small class="materialIngredients">'+escapeHtml(c.ingredients.join('、'))+'</small><small class="wkBatchLabel"></small><small class="materialRisk"></small></span></label>').join('');
 box.querySelectorAll('[data-material]').forEach(input=>{const c=capsules[Number(input.dataset.material)];input.checked=selectedMaterialIds().includes(c.id);const label=input.closest('.materialOption');label.classList.toggle('selected',input.checked);label.querySelector('.wkBatchLabel').textContent=c.batch;const risk=label.querySelector('.materialRisk');risk.textContent=conflicts(c).length?'含'+conflicts(c).join('、'):c.incomplete?'批次待确认':'';risk.hidden=!risk.textContent;});
}
function refreshShelf(){
 if(!state.confirmed)onlyMatches=false;
 $('allCaps').setAttribute('aria-pressed',String(!onlyMatches));$('matchCaps').setAttribute('aria-pressed',String(onlyMatches));$('matchCaps').disabled=!state.confirmed;
 $('matchCaps').textContent='无已知冲突'+(state.confirmed?' '+matches().length:'');
 for(const card of $('shelf').children){const c=capsules[Number(card.dataset.id)],hit=conflicts(c),v=verdict(c);card.hidden=onlyMatches&&v!=='match';card.querySelector('.lotNumber').textContent=c.batch;const info=card.querySelector('.compat');info.className='compat';
 if(hit.length){info.textContent='含忌口项 · '+hit.join('、');info.classList.add('blocked');}
 else if(!state.confirmed){info.textContent='请完善档案';}
 else if(v==='unknown'){info.textContent='信息待确认';info.classList.add('unknown');}
 else{info.textContent=(selectedMaterialIds().includes(c.id)?'已选择 · ':'')+'无已登记冲突';info.classList.add('ok');}}
}
function renderStatus(){
 refreshShelf();renderMarket();
 if(typeof renderProfileSummary==='function')renderProfileSummary();
 $('matchCount').textContent=state.confirmed?matches().length+' / 5':'— / 5';
 $('recommend').innerHTML=state.confirmed&&matches().length?'<div class="picks">'+matches().map(c=>'<button data-scan="'+c.id+'" aria-label="选择材料'+c.name+'"><i style="background:'+c.color+'"></i>'+c.name+' ↗</button>').join('')+'</div>':'<p class="quiet">请先完善档案中的待确认信息，再查看示例材料。</p>';
 const good=allowed(),list=selectedMaterialRecords();
 $('deviceText').textContent=list.length?list.map(c=>c.name).join(' + '):'未选择材料';
 document.querySelector('.device').classList.toggle('ready',good);
 $('flavor').value=state.capsule===null?'':String(state.capsule);$('flavor').hidden=true;
 $('activeProfileLink').textContent='档案 · '+profileDisplayName()+' ↗';
 const notice=materialMessage();$('materialNotice').hidden=notice.kind==='match';$('materialNotice').className='materialNotice '+notice.kind;$('materialNotice').innerHTML=notice.title?'<strong>'+escapeHtml(notice.title)+'</strong>'+(notice.detail?'<p>'+escapeHtml(notice.detail)+'</p>':''):'';
 $('loaded').innerHTML='<div class="status"><span>'+escapeHtml(list.map(c=>c.name).join(' + ')||'未选择材料')+'</span><a href="#studio">选择材料 ↗</a></div>';
 if($('gate')){$('gate').textContent='';$('gate').hidden=true;}if($('benchBatch')){$('benchBatch').textContent='';$('benchBatch').hidden=true;}
 $('printBtn').textContent=state.printing?'模拟进行中…':'模拟打印 →';$('printBtn').disabled=state.printing||state.analyzing||!currentPieces().length||!good;
 $('printBtn').title=good?'模拟打印':notice.title;
 $('workspace').inert=state.printing;$('editor').style.setProperty('--part-color',materialPreviewColor());
 if($('materialPreviewLabel'))$('materialPreviewLabel').textContent=list.length>1?'多材料 · 中性示意色':'';
 renderMaterialOptions();
 if(typeof renderPrintReadiness==='function')renderPrintReadiness();
}
// Batch approval is recorded independently for every selected material.
$('lotPicker').onchange=e=>{const ids=[...selectedMaterialIds()],interrupted=state.printing;Object.assign(capsules[4],darkLots[Number(e.target.value)],{incomplete:darkLots[Number(e.target.value)].incomplete});renderTrace();setMaterials(ids,{remember:false});if(interrupted)$('printState').textContent='模拟已停止，材料批次发生变化。';};
$('flavor').innerHTML='<option value="">请选择材料</option>'+capsules.map(c=>'<option value="'+c.id+'">'+c.name+'</option>').join('');
$('flavor').onchange=e=>selectMaterial(e.target.value===''?null:Number(e.target.value));
if($('materialOptions'))$('materialOptions').onchange=e=>{const input=e.target.closest('[data-material]');if(input)toggleMaterial(Number(input.dataset.material));};
$('jumpCanvas').onclick=()=>document.querySelector('.benchMain').scrollIntoView({block:'start',behavior:'smooth'});
$('printBtn').onclick=async()=>{
 if(state.printing||state.analyzing||!currentPieces().length)return;
 if(!allowed()){renderStatus();$('materialOptions')?.querySelector('input')?.focus();return;}
 const token=++state.printSeq,rev=state.revision;state.printing=true;workview='model';syncBench();renderStatus();
 for(let l=1;l<=12;l++){
  if(token!==state.printSeq||rev!==state.revision||!allowed()){if(token===state.printSeq){state.printing=false;syncBench();renderStatus();$('printState').textContent='模拟已停止，材料或档案发生变化。';}return;}
  state.layer=l;state.wire=false;draw();$('printState').innerHTML='<p>模拟打印中 · '+Math.round(l/12*100)+'%</p><div class="progress"><i style="width:'+Math.round(l/12*100)+'%"></i></div>';await wait(120);
 }
 if(token!==state.printSeq||rev!==state.revision||!allowed()){if(token===state.printSeq){state.printing=false;syncBench();renderStatus();}return;}
 state.printing=false;syncBench();renderStatus();$('printState').textContent='模拟打印完成 · 仅为过程演示';
};
