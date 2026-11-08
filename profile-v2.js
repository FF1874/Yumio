/* Saved profiles and edit controls are separate. No network requests or report uploads. */
const archiveStorageKey='ankuan.personal.archive.v2';
const profileFieldsV2={name:'profileName',age:'profileAge',gender:'profileGender',severe:'profileSevere',mild:'profileMild',other:'profileOther',likes:'profileLikes',flavor:'profileFlavor',texture:'profileTexture',notes:'profileNotes'};
const fictionalProfileV2={id:'sample-xiaozhi',name:'小知',age:'6',gender:'男孩',severe:'小麦、鸡蛋黄',mild:'番茄',other:'无其他忌口',likes:'米饭、南瓜、草莓',flavor:'清淡、微甜，不辣',texture:'柔软、小口易咀嚼',notes:'新食材先与照护人确认。',fictional:true,saved:true};
let archiveProfilesV2=[{...fictionalProfileV2}],activeProfileIdV2='sample-xiaozhi',archiveReadyV2=false,archiveDirtyV2=false,archiveRememberV2=false,archiveEditingV2=false,archiveNewV2=null;
// Materials belong to the work, not to the profile edit transaction.
let profileMaterialsSnapshotV2=null;
function profileMaterialsV2(){return typeof selectedMaterialIds==='function'?[...selectedMaterialIds()]:[]}
function captureProfileMaterialsV2(){if(profileMaterialsSnapshotV2===null)profileMaterialsSnapshotV2=profileMaterialsV2()}
function restoreProfileMaterialsV2(ids){if(typeof setMaterials==='function')setMaterials(ids,{remember:false})}
function finishProfileMaterialsV2(){const ids=profileMaterialsSnapshotV2??profileMaterialsV2();profileMaterialsSnapshotV2=null;restoreProfileMaterialsV2(ids)}
function warnProfileNavigationV2(){ $('saveNote').textContent='请先保存或取消修改，再离开档案。';$('resetProfileEdit').focus(); }
function guardProfileNavigationV2(event){
 if(!archiveEditingV2)return;
 const link=event.target.closest?.('a[href]');if(!link)return;
 const href=link.getAttribute('href');if(!href?.startsWith('#')||href==='#profile')return;
 event.preventDefault();event.stopImmediatePropagation();warnProfileNavigationV2();
}
function guardProfileHashV2(){
 if(!archiveEditingV2||location.hash==='#profile')return;
 // Replace the rejected history entry, rather than adding another back/forward loop.
 if(typeof history!=='undefined'&&history.replaceState)history.replaceState(null,'','#profile');
 else location.hash='#profile';
 if(typeof updateRoute==='function')updateRoute();warnProfileNavigationV2();
}
const allergyAliasesV2={'小麦':['麸质'],'小麦粉':['麸质'],'面粉':['麸质'],'麸质':['麸质'],'麵筋':['麸质'],'面筋':['麸质'],'鸡蛋黄':['鸡蛋'],'蛋黄':['鸡蛋'],'鸡蛋白':['鸡蛋'],'蛋白':['鸡蛋'],'鸡蛋':['鸡蛋'],'鸡蛋清':['鸡蛋'],'蛋清':['鸡蛋'],'牛奶':['牛奶'],'乳制品':['牛奶'],'花生':['花生坚果'],'坚果':['花生坚果'],'花生坚果':['花生坚果'],'大豆':['大豆'],'黄豆':['大豆'],'海鲜':['海鲜'],'虾':['海鲜'],'蟹':['海鲜'],'番茄':['番茄'],'西红柿':['番茄'],'草莓':['草莓'],'苹果':['苹果'],'可可':['可可'],'芝麻':['芝麻']};
function currentProfileV2(){return archiveProfilesV2.find(p=>p.id===activeProfileIdV2)||archiveProfilesV2[0]}
function profileDisplayName(){return currentProfileV2().name||'未命名档案'}
function parseAllergyTextV2(value){return [...new Set(String(value||'').split(/[、，,;；\n\r\/]+/).map(v=>v.trim()).filter(Boolean))]}
function profileRestrictions(profile=currentProfileV2()){
 const severe=parseAllergyTextV2(profile.severe),mild=parseAllergyTextV2(profile.mild),other=parseAllergyTextV2(profile.other??'无其他忌口'),entries=[];
 for(const [severity,items] of [['severe',severe],['mild',mild],['other',other]])for(const raw of items){
  if((severity!=='other'&&raw==='无已知过敏')||(severity==='other'&&raw==='无其他忌口'))continue;
  const recognized=Object.hasOwn(allergyAliasesV2,raw),terms=recognized?allergyAliasesV2[raw]:[raw];entries.push({raw,severity,terms,recognized});
 }
 const unknown=entries.filter(e=>!e.recognized).map(e=>e.raw);
 if(!severe.length&&!mild.length)unknown.push('过敏信息未填写');
 if(!other.length)unknown.push('其他忌口未填写');
 return {terms:[...new Set(entries.flatMap(e=>e.terms))],unknown:[...new Set(unknown)],entries,severe,mild,other};
}
function readProfileDraftV2(){const p={...currentProfileV2()};for(const [key,id] of Object.entries(profileFieldsV2))p[key]=$(id).value.trim();return p}
function applyProfileV2(){const p=currentProfileV2();state.profile=profileRestrictions(p).terms;state.confirmed=Boolean(p.saved)&&!archiveDirtyV2&&!archiveEditingV2}
function renderProfileSummary(){
 if(!archiveReadyV2)return;
 const p=currentProfileV2();$('profileDisplayName').textContent=p.name||'新档案';$('profileAvatar').textContent=(p.name||'新').slice(-1);
 $('profileFictional').hidden=!p.fictional;$('profileMeta').textContent=[p.age!==''?p.age+' 岁':null,p.gender!=='未填写'?p.gender:null].filter(Boolean).join(' · ')||'基本信息未填写';
 $('profileActive').textContent=archiveEditingV2?'编辑中 · 尚未应用':p.saved?'当前使用':'待完善';
 $('profileTotal').textContent=String(archiveProfilesV2.length).padStart(2,'0');
 $('profileList').innerHTML=archiveProfilesV2.map(item=>'<button type="button" data-profile-id="'+escapeHtml(item.id)+'" aria-pressed="'+(item.id===activeProfileIdV2)+'"><span class="profileMiniAvatar" aria-hidden="true">'+escapeHtml((item.name||'新').slice(-1))+'</span><span><b>'+escapeHtml(item.name||'新档案')+'</b><small>'+(item.fictional?'虚构示例':item.saved?'个人档案':'尚未保存')+'</small></span></button>').join('');
 for(const key of ['severe','mild','other','likes','flavor','texture','notes'])$('view'+key[0].toUpperCase()+key.slice(1)).textContent=p[key]||'未填写';
 $('profileReadView').hidden=archiveEditingV2;$('profileForm').hidden=!archiveEditingV2;$('editProfile').hidden=archiveEditingV2;
 $('profileEditTitle').textContent=archiveNewV2?'新建档案':'编辑档案';
 $('profileStorageState').textContent=archiveRememberV2?'已在此浏览器保存。':'仅保留在当前页面。';
 renderProfileMappingV2(archiveEditingV2?readProfileDraftV2():p);
}
function renderProfileMappingV2(profile){const r=profileRestrictions(profile);$('profileMapping').textContent=r.unknown.length?'待核对：'+r.unknown.join('、')+'。模拟打印已拦截。':'过敏与忌口均参与比对；实际食用前仍需核对配料与交叉接触。'}
function fillProfileFormV2(){const p=currentProfileV2();for(const [key,id] of Object.entries(profileFieldsV2))$(id).value=p[key]??'';$('remember').checked=archiveRememberV2;archiveDirtyV2=false;applyProfileV2();renderProfileSummary()}
function beginProfileEditV2(){if(archiveEditingV2)return;captureProfileMaterialsV2();archiveEditingV2=true;clearApproval();fillProfileFormV2();$('saveNote').textContent='';renderStatus();$('profileName').focus()}
function markProfileDirtyV2(){captureProfileMaterialsV2();archiveEditingV2=true;if(!archiveDirtyV2){clearApproval();archiveDirtyV2=true;state.confirmed=false;renderStatus()}$('saveNote').textContent='';renderProfileSummary()}
function persistProfilesV2(){
 try{if(archiveRememberV2){localStorage.setItem(archiveStorageKey,JSON.stringify({version:2,remember:true,active:activeProfileIdV2,profiles:archiveProfilesV2}));$('saveNote').textContent='已保存到此浏览器。'}else{localStorage.removeItem(archiveStorageKey);$('saveNote').textContent='已保存，仅在当前页面保留。'}return true}
 catch{archiveRememberV2=false;$('remember').checked=false;$('saveNote').textContent='已在当前页面应用，但浏览器存储操作失败。请在浏览器设置中检查或清除旧副本。';return false}
}
function saveProfileV2(){
 if(!$('profileForm').reportValidity())return false;
 const p=readProfileDraftV2();if(!p.name){$('profileName').focus();$('saveNote').textContent='请填写档案称呼。';return false}
 captureProfileMaterialsV2();clearApproval();p.saved=true;
 // Editing a fictional example must never silently turn it into a real child's record.
 archiveProfilesV2=archiveProfilesV2.map(item=>item.id===p.id?p:item);archiveDirtyV2=false;archiveEditingV2=false;archiveNewV2=null;archiveRememberV2=$('remember').checked;applyProfileV2();finishProfileMaterialsV2();persistProfilesV2();renderProfileSummary();renderStatus();$('editProfile').focus();return true;
}
function cancelProfileEditV2(){
 if(archiveNewV2){archiveProfilesV2=archiveProfilesV2.filter(p=>p.id!==activeProfileIdV2);activeProfileIdV2=archiveNewV2;archiveNewV2=null}
 archiveEditingV2=false;clearApproval();fillProfileFormV2();finishProfileMaterialsV2();$('saveNote').textContent='已取消修改。';renderStatus();$('editProfile').focus();
}
function initializeProfilesV2(){
 if(archiveReadyV2)return;
 try{const saved=JSON.parse(localStorage.getItem(archiveStorageKey));if(saved?.version===2&&saved.remember===true&&Array.isArray(saved.profiles)&&saved.profiles.length&&saved.profiles.length<=20){
 const profiles=saved.profiles.map(p=>p&&({...p,other:p.other??'无其他忌口'}));
 const valid=profiles.every(p=>p&&typeof p.id==='string'&&p.id.length<100&&Object.keys(profileFieldsV2).every(k=>typeof p[k]==='string'&&p[k].length<=500)&&typeof p.saved==='boolean'&&typeof p.fictional==='boolean');
 if(valid&&new Set(profiles.map(p=>p.id)).size===profiles.length){archiveProfilesV2=profiles;activeProfileIdV2=profiles.some(p=>p.id===saved.active)?saved.active:profiles[0].id;archiveRememberV2=true}
 }}catch{}
 archiveReadyV2=true;fillProfileFormV2();
 document.addEventListener?.('click',guardProfileNavigationV2,true);
 if(typeof window!=='undefined')window.addEventListener('hashchange',guardProfileHashV2);
 $('profileForm').addEventListener('submit',e=>{e.preventDefault();saveProfileV2()});
 $('editProfile').onclick=beginProfileEditV2;
 for(const id of Object.values(profileFieldsV2))$(id).addEventListener('input',markProfileDirtyV2);
 // The storage preference is transactional too: Cancel never writes or deletes saved records.
 $('remember').onchange=markProfileDirtyV2;
 $('resetProfileEdit').onclick=cancelProfileEditV2;
 $('profileList').onclick=e=>{const b=e.target.closest('[data-profile-id]');if(!b||b.dataset.profileId===activeProfileIdV2)return;if(archiveEditingV2){$('saveNote').textContent='请先保存或取消，再切换档案。';return}if(!archiveProfilesV2.some(p=>p.id===b.dataset.profileId))return;const materials=profileMaterialsV2();clearApproval();activeProfileIdV2=b.dataset.profileId;fillProfileFormV2();restoreProfileMaterialsV2(materials);if(archiveRememberV2)persistProfilesV2();else $('saveNote').textContent='';renderStatus()};
 $('addProfile').onclick=()=>{if(archiveEditingV2){$('saveNote').textContent='请先保存或取消，再新建档案。';return}if(archiveProfilesV2.length>=20){$('saveNote').textContent='最多支持 20 份档案。';return}captureProfileMaterialsV2();clearApproval();const p={...fictionalProfileV2,id:'profile-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),fictional:false,saved:false};for(const key of Object.keys(profileFieldsV2))p[key]='';p.gender='未填写';archiveNewV2=activeProfileIdV2;archiveProfilesV2.push(p);activeProfileIdV2=p.id;archiveEditingV2=true;fillProfileFormV2();$('saveNote').textContent='';$('profileName').focus();renderStatus()};
 $('clearProfileStorage').onclick=()=>{try{localStorage.removeItem(archiveStorageKey);localStorage.removeItem('ankuan.family.v1');archiveRememberV2=false;$('remember').checked=false;$('saveNote').textContent='已清除本机副本，当前页面仍保留。';renderProfileSummary()}catch{$('saveNote').textContent='清除失败，请在浏览器设置中清除此站点数据。'}};
 document.querySelectorAll('nav a[href="#profile"]').forEach(a=>a.textContent='个人档案库');
}
