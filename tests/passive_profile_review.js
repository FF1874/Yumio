// Pure source-state tests with an explicitly mocked DOM, not a browser/UI pass.
const fs=require('fs'),vm=require('vm');
const nodes=new Map();
const noop=()=>{};
const ctx=new Proxy({}, {get(o,k){return o[k]||noop},set(o,k,v){o[k]=v;return true}});
class Element {
 constructor(id){this.id=id;this.hidden=false;this.innerHTML='';this.textContent='';this.value='';this.children=[];this.dataset={};this.open=false;this.width=840;this.height=500;this.style={setProperty:noop};this.classList={add:noop,remove:noop,toggle:noop};this.content={cloneNode:()=>new Element('clone')};}
 querySelectorAll(){return []} querySelector(){return new Element('query')} setAttribute(){} addEventListener(t,f){(this.listeners??={})[t]=f} focus(){} reportValidity(){return true} append(){} scrollIntoView(){} getContext(){return ctx} toDataURL(){return 'data:image/png;stub'} getBoundingClientRect(){return {width:400,height:400,left:0,top:0}} showModal(){this.open=true} close(){this.open=false} contains(){return false}
}
const get=id=>{if(['result','resultImage','resultRef'].includes(id))return null;if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)};
const storage=new Map();
function makeSandbox(){return {console,structuredClone,Math,JSON,Date,Number,String,Array,Object,Map,Set,Promise,Error,document:{getElementById:get,querySelector:s=>get(s),querySelectorAll:()=>[],createElement:id=>new Element(id),addEventListener:noop,body:get('body')},window:{scrollTo:noop,addEventListener:noop},matchMedia:()=>({matches:true}),location:{hash:'#studio'},requestAnimationFrame:noop,ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:f=>{queueMicrotask(f);return 0},clearTimeout:noop};}
let sandbox;function boot(){nodes.clear();sandbox=makeSandbox();sandbox.Image=class {};sandbox.atob=atob;vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/../app-check.js','utf8'),sandbox)}
const run=s=>vm.runInContext(s,sandbox),rows=[];
function test(name,pass){rows.push({name,pass});console.log((pass?'PASS ':'FAIL ')+name)}
boot();
test('fictional sample initialized without persistence',run("profileDisplayName()==='小知'&&state.confirmed&&profileRestrictions().unknown.length===0")&&!storage.has('ankuan.personal.archive.v2'));
run('setMaterials([2])');test('severe egg yolk blocks egg capsule passively',run("!allowed()&&materialMessage().kind==='conflict'&&!$('modal').open&&$('printBtn').disabled"));
run('setMaterials([3])');test('non-conflicting material immediately enables simulation',run("allowed()&&!$('printBtn').disabled&&materialMessage().kind==='match'"));
run("$('profileSevere').value='未知食物';markProfileDirtyV2()");test('unsaved profile edit invalidates approval',run("!state.confirmed&&!allowed()&&selectedMaterialIds().length===0&&state.capsule===null&&$('printBtn').disabled"));
run('saveProfileV2();setMaterials([3])');test('saved unknown term blocks otherwise matching material',run("state.confirmed&&!allowed()&&verdict(capsules[3])==='unknown'&&materialMessage().kind==='unknown'"));
run("$('profileSevere').value='无已知过敏';$('profileMild').value='西红柿';saveProfileV2()");
test('mild tomato alias normalizes',run("state.profile.includes('番茄')&&profileRestrictions().unknown.length===0"));
test('mild tomato blocks ingredient 番茄',run("verdict({tags:{},ingredients:['番茄粉']})==='conflict'"));
test('mild tomato blocks ingredient 西红柿',run("verdict({tags:{},ingredients:['西红柿']})==='conflict'"));
run("$('profileSevere').value='小麦';$('profileMild').value='无已知过敏';saveProfileV2()");
test('wheat blocks ingredient 小麦 even without category tag',run("verdict({tags:{},ingredients:['小麦粉']})==='conflict'"));
run("$('profileSevere').value='无已知过敏';saveProfileV2();useGood(goods.find(g=>g.id==='cake-strawberry-mango'))");
test('cake recipe selects its batches without modal',run("JSON.stringify(selectedMaterialIds())==='[1,3]'&&allowed()&&!$('modal').open"));
run("useGood(goods.find(g=>g.id==='cookie-cocoa-letters'))");
test('cookie uses its own batch selection',run("recipeId==='cookie-cocoa-letters'&&JSON.stringify(selectedMaterialIds())==='[2,4]'&&allowed()"));
run("$('lotPicker').onchange({target:{value:'1'}})");test('incomplete selected lot blocks simulation',run("selectedMaterialIds().includes(4)&&!allowed()&&$('printBtn').disabled"));
run("$('lotPicker').onchange({target:{value:'0'}})");test('complete selected lot restores automatic match',run('allowed()'));
(async()=>{
 await run("$('printBtn').onclick()");test('matched simulated print finishes',run("!state.printing&&$('printState').textContent==='模拟打印完成 · 仅为过程演示'&&$('result')===null"));
 run("setMaterials([4])");const pending=run("$('printBtn').onclick()");run("$('profileSevere').value='牛奶';markProfileDirtyV2()");await pending;test('profile edit interrupts in-flight print',run("!state.printing&&!allowed()&&!$('workspace').inert&&$('printState').textContent!== '模拟打印完成 · 仅为过程演示'") );
 run("$('profileSevere').value='无已知过敏';saveProfileV2();setMaterials([4])");const changedLotPrint=run("$('printBtn').onclick()");run("$('lotPicker').onchange({target:{value:'1'}})");await changedLotPrint;test('changing batch mid-print does not leave editor locked',run("!state.printing&&!$('workspace').inert"));
 const invalids=['{broken',JSON.stringify({version:2,remember:true,profiles:[{}]}),JSON.stringify({version:2,remember:true,profiles:[]})];
 for(const value of invalids){storage.set('ankuan.personal.archive.v2',value);boot();test('malformed stored archive falls back conservatively',run("profileDisplayName()==='小知'&&state.profile.includes('鸡蛋')"))}
 const valid=run('JSON.parse(JSON.stringify(fictionalProfileV2))');storage.set('ankuan.personal.archive.v2',JSON.stringify({version:2,remember:true,profiles:[valid,valid]}));boot();test('duplicate stored IDs rejected',run('archiveProfilesV2.length===1&&!archiveRememberV2'));
 process.exitCode=rows.some(r=>!r.pass)?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});
