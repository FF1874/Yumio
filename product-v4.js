// UI affordances only. Material safety remains in the workflow module.
function compactWorkspace(){return matchMedia('(max-width:650px), (min-width:901px) and (max-width:1100px)').matches}
function setCompactView(view){
 const pair=$('viewPair');pair.dataset.compactView=view;delete pair.dataset.expanded;
 document.querySelectorAll('[data-view]').forEach(button=>{const active=button.dataset.view===view;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1});
 document.querySelectorAll('[data-expand]').forEach(button=>button.setAttribute('aria-expanded','false'));
 requestAnimationFrame(()=>{paintEditor();draw()});
}
document.querySelectorAll('[data-view]').forEach(button=>{
 button.onclick=()=>setCompactView(button.dataset.view);
 button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const view=e.key==='Home'?'perspective':e.key==='End'?'top':button.dataset.view==='top'?'perspective':'top';setCompactView(view);document.querySelector('[data-view="'+view+'"]').focus()};
});
function goToTools(id='materialPicker'){
 const target=$(id),scroll=document.querySelector('.toolScroll');if(!target)return;
 if(matchMedia('(min-width:901px)').matches){scroll.scrollTo({top:target.offsetTop-scroll.offsetTop-20,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
 else target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
 target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
}
document.querySelectorAll('[data-tool-section]').forEach(button=>button.onclick=()=>goToTools(button.dataset.toolSection));
$('jumpCanvas').onclick=()=>goToTools('commandForm');
$('returnCanvas').onclick=()=>{const panel=document.querySelector('.benchMain');panel.scrollIntoView({block:'start',behavior:'smooth'});panel.focus({preventScroll:true})};
$('readinessAction').onclick=()=>{if(!state.confirmed||profileRestrictions().unknown.length)location.hash='profile';else if(!currentPieces().length)goToTools('freetools');else goToTools('materialPicker')};
const auditResizeObserver=new ResizeObserver(()=>{requestAnimationFrame(paintEditor)});auditResizeObserver.observe($('editor'));
// Changing screen size must not leave a previously expanded, now-hidden view behind.
const auditCompactQuery=matchMedia('(max-width:650px), (min-width:901px) and (max-width:1100px)');auditCompactQuery.addEventListener?.('change',()=>setCompactView($('viewPair').dataset.compactView||'perspective'));
$('doodleToggle').addEventListener('click',()=>{if(drawing&&compactWorkspace())setCompactView('top')});
// The top status is next to the disabled action, not buried in a scrollable tool rail.
function renderPrintReadiness(){
 const target=$('printReadiness');if(!target)return;const action=$('readinessAction'),notice=materialMessage();
 let text='',label='选择材料';
 if(state.printing)text='正在分层模拟';
 else if(state.analyzing)text='正在提取照片轮廓';
 else if(!currentPieces().length){text=strokes.length?'涂鸦需附着在形状上':'先添加一个形状';label='添加形状'}
 else if(notice.kind==='match'){text='批次匹配 · '+selectedMaterialIds().length+' 种材料';}
 else {text=notice.title;label=!state.confirmed||profileRestrictions().unknown.length?'完善档案':'查看材料'}
 target.textContent=text;target.classList.toggle('isConflict',notice.kind==='conflict');action.textContent=label+' ↗';action.hidden=state.printing||state.analyzing||(notice.kind==='match'&&currentPieces().length>0);
 $('printBtn').setAttribute('aria-describedby','printReadiness');
}
