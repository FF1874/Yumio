// State/DOM-adapter tests. These do not claim real-browser rendering coverage.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../profile-v2.js','utf8'),store=new Map();let failStorage=false;
function boot(){
 const els=new Map(),$=id=>{if(!els.has(id))els.set(id,{value:'',checked:false,hidden:false,textContent:'',innerHTML:'',listeners:{},addEventListener(t,f){this.listeners[t]=f},focus(){},reportValidity(){return true}});return els.get(id)};
 const c=vm.createContext({$,document:{querySelectorAll:()=>[]},state:{},clearApproval(){},renderStatus(){},escapeHtml:String,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(failStorage)throw Error('quota');store.set(k,v)},removeItem:k=>store.delete(k)}});
 vm.runInContext(source,c);const run=s=>vm.runInContext(s,c);run('initializeProfilesV2()');return {$,run,j:s=>JSON.parse(JSON.stringify(run(s))),edit:()=>$('editProfile').onclick(),cancel:()=>$('resetProfileEdit').onclick(),save:()=>run('saveProfileV2()'),input:(id,v)=>{$(id).value=v;$(id).listeners.input()},switch:id=>$('profileList').onclick({target:{closest:()=>({dataset:{profileId:id}})}})}
}
let a=boot();assert.equal(a.$('profileForm').hidden,true);assert.equal(a.$('profileReadView').hidden,false);assert.deepEqual(a.j('state.profile'),['麸质','鸡蛋','番茄']);assert.equal(store.size,0);
a.edit();assert.equal(a.$('profileForm').hidden,false);assert.equal(a.$('profileReadView').hidden,true);assert.equal(a.run('state.confirmed'),false);
a.input('profileName','取消改名');a.input('profileSevere','牛奶');a.$('remember').checked=true;a.$('remember').onchange();a.cancel();assert.equal(a.run('profileDisplayName()'),'小知');assert.deepEqual(a.j('state.profile'),['麸质','鸡蛋','番茄']);assert.equal(store.size,0);assert.equal(a.$('remember').checked,false);
a.$('addProfile').onclick();assert.equal(a.run('archiveProfilesV2.length'),2);assert.equal(a.run('state.confirmed'),false);a.cancel();assert.equal(a.run('archiveProfilesV2.length'),1);assert.equal(a.run('profileDisplayName()'),'小知');
a.$('addProfile').onclick();a.input('profileName','测试');a.input('profileSevere','无已知过敏');a.input('profileOther','牛奶');assert.equal(a.save(),true);assert.deepEqual(a.j('profileRestrictions().terms'),['牛奶']);assert.equal(a.$('profileForm').hidden,true);const id=a.run('activeProfileIdV2');
a.edit();a.input('profileOther','未知食物');a.switch('sample-xiaozhi');assert.equal(a.run('activeProfileIdV2'),id);assert.match(a.$('saveNote').textContent,/先保存或取消/);a.save();assert.deepEqual(a.j('profileRestrictions().unknown'),['未知食物']);
a.edit();a.input('profileOther','');a.save();assert.deepEqual(a.j('profileRestrictions().unknown'),['其他忌口未填写']);
a.edit();a.input('profileOther','无其他忌口');a.input('profileSevere','');a.save();assert.deepEqual(a.j('profileRestrictions().unknown'),['过敏信息未填写']);
a.edit();a.input('profileSevere','无已知过敏');a.input('profileMild','西红柿');a.$('remember').checked=true;a.save();assert.deepEqual(a.j('profileRestrictions().terms'),['番茄']);assert.equal(store.size,1);
a=boot();assert.equal(a.run('profileDisplayName()'),'测试');assert.equal(a.run('archiveRememberV2'),true);assert.equal(a.$('profileForm').hidden,true);
a.edit();a.input('profileName','取消');a.$('remember').checked=false;a.$('remember').onchange();a.cancel();a=boot();assert.equal(a.run('profileDisplayName()'),'测试');assert.equal(a.run('archiveRememberV2'),true);
a.switch('sample-xiaozhi');a=boot();assert.equal(a.run('profileDisplayName()'),'小知');a.edit();a.input('profileName','示例改名');a.save();assert.equal(a.run('currentProfileV2().fictional'),true);
a.$('clearProfileStorage').onclick();assert.equal(store.size,0);a=boot();assert.equal(a.run('profileDisplayName()'),'小知');a.edit();a.input('profileName','临时改名');a.save();a=boot();assert.equal(a.run('profileDisplayName()'),'小知');
const legacy=a.j('fictionalProfileV2');delete legacy.other;store.set('ankuan.personal.archive.v2',JSON.stringify({version:2,remember:true,profiles:[legacy]}));a=boot();assert.equal(a.run('currentProfileV2().other'),'无其他忌口');assert.deepEqual(a.j('state.profile'),['麸质','鸡蛋','番茄']);
for(const bad of ['{bad',JSON.stringify({version:2,remember:true,profiles:[{}]}),JSON.stringify({version:2,remember:true,profiles:[legacy,legacy]})]){store.set('ankuan.personal.archive.v2',bad);a=boot();assert.equal(a.run('archiveRememberV2'),false);assert.equal(a.run('profileDisplayName()'),'小知')}
failStorage=true;a.edit();a.$('remember').checked=true;a.save();assert.equal(a.run('archiveRememberV2'),false);assert.match(a.$('saveNote').textContent,/失败/);assert.equal(a.run('state.confirmed'),true);
assert.deepEqual(a.j('profileRestrictions({severe:"鸡蛋黄",mild:"番茄",other:"芝麻"}).terms'),['鸡蛋','番茄','芝麻']);
console.log('PASS: profile view/edit separation, transactional cancel/save/storage, new-profile cancel, switch guard, all restriction severities, unknown/missing restrictions, reload, legacy migration and storage failure.');
