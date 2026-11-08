// Focused VM checks, not a replacement for real-browser interaction/layout QA.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();
function $(id){if(!elements.has(id))elements.set(id,{value:'',checked:false,hidden:false,textContent:'',innerHTML:'',listeners:{},addEventListener(t,f){this.listeners[t]=f},focus(){this.focused=true},reportValidity(){return true}});return elements.get(id)}
const store=new Map();let renders=0,clears=0;
const context=vm.createContext({$,document:{querySelectorAll:()=>[]},state:{profile:[],confirmed:false},clearApproval(){clears++},renderStatus(){renders++},escapeHtml:v=>String(v).replace(/[<>"&']/g,'_'),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../profile-v2.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),json=s=>JSON.parse(JSON.stringify(run(s)));
run('initializeProfilesV2()');
assert.deepEqual(json('state.profile'),['麸质','鸡蛋','番茄']);assert.equal(run('state.confirmed'),true);assert.equal(renders,0);assert.equal(store.size,0);
assert.deepEqual(json('profileRestrictions({severe:"未知食物、鸡蛋黄",mild:"番茄"}).unknown'),['未知食物']);
assert.deepEqual(json('profileRestrictions({severe:"",mild:""}).unknown'),['过敏信息未填写']);
assert.deepEqual(json('profileRestrictions({severe:"无已知过敏",mild:""}).unknown'),[]);
assert.deepEqual(json('profileRestrictions({severe:"小麦\\n蛋黄；鸡蛋",mild:"番茄,西红柿"}).terms'),['麸质','鸡蛋','番茄']);
$('profileSevere').value='芝麻、未知食物';$('profileSevere').listeners.input();assert.equal(run('state.confirmed'),false);assert.ok(clears>0);
run('saveProfileV2()');assert.equal(run('state.confirmed'),true);assert.deepEqual(json('profileRestrictions().unknown'),['未知食物']);assert.equal(store.size,0);
$('remember').checked=true;run('saveProfileV2()');assert.equal(store.size,1);
$('profileSevere').value='鸡蛋';$('profileSevere').listeners.input();$('addProfile').onclick();assert.equal(run('archiveProfilesV2.length'),1);
$('resetProfileEdit').onclick();assert.equal($('profileSevere').value,'芝麻、未知食物');$('addProfile').onclick();assert.equal(run('archiveProfilesV2.length'),2);assert.equal(run('state.confirmed'),false);assert.equal(run('currentProfileV2().fictional'),false);
$('profileName').value='测试档案';$('profileSevere').value='无已知过敏';run('saveProfileV2()');assert.equal(run('state.confirmed'),true);assert.equal(run('profileDisplayName()'),'测试档案');
$('clearProfileStorage').onclick();assert.equal(store.size,0);assert.equal($('remember').checked,false);
console.log('PASS: profile normalization, conservative unknowns, empty-input blocking, dirty invalidation, session-default save, opt-in persistence, unsaved switch guard, reset, new profile and clearing storage.');
