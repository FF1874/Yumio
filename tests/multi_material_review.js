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
test('all six entries are recipes with 100% material shares',run("goods.length===6&&goods.every(g=>g.cat==='recipes'&&g.materials.reduce((n,m)=>n+m.share,0)===100)"));
test('unified grid includes six recipe details',run("($('recipeGrid').innerHTML.match(/class=\"recipeDetails\"/g)||[]).length===6&&$('stockGrid').hidden"));
run("setMaterials([3,4])");
test('two safe materials can print',run("allowed()&&selectedMaterialIds().length===2&&!$('printBtn').disabled"));
test('allowed selection hides success notice',run("$('materialNotice').hidden&&$('materialNotice').innerHTML===''"));
test('mixed preview does not use first material color',run("materialPreviewColor()!==capsules[3].color&&materialPreviewColor()!==capsules[4].color"));
run('toggleMaterial(2)');test('any selected conflict blocks all printing',run("selectedMaterialIds().length===3&&!allowed()&&materialMessage().kind==='conflict'"));
run('toggleMaterial(2)');test('deselecting conflict restores safe set',run('allowed()&&selectedMaterialIds().length===2'));
run('undoEdit()');test('undo restores conflict material',run('selectedMaterialIds().includes(2)&&!allowed()'));
run('redoEdit()');test('redo removes conflict material',run('!selectedMaterialIds().includes(2)&&allowed()'));
run('setMaterials([])');test('empty materials cannot print',run("!allowed()&&state.capsule===null&&materialMessage().kind==='empty'"));
run("setMaterials([3]);useGood(goods.find(g=>g.id==='cookie-cocoa-letters'))");
test('recipe loads its own materials and rechecks the current profile',run("JSON.stringify(selectedMaterialIds())==='[2,4]'&&recipeId==='cookie-cocoa-letters'&&!allowed()"));
run('toggleMaterial(2)');
test('removing conflicting batch enables the same recipe',run("JSON.stringify(selectedMaterialIds())==='[4]'&&allowed()"));
run('undoEdit()');test('undo restores conflicting batch',run("!allowed()&&JSON.stringify(selectedMaterialIds())==='[2,4]'"));
run('redoEdit()');test('redo restores matching batch',run("allowed()&&JSON.stringify(selectedMaterialIds())==='[4]'"));
run('setMaterials([3,4]);$("lotPicker").onchange({target:{value:"1"}})');test('incomplete secondary batch blocks whole set',run("!allowed()&&materialMessage().kind==='unknown'"));
run('$("lotPicker").onchange({target:{value:"0"}})');test('complete secondary batch restores approval',run('allowed()'));
run("state.materialApprovals[4]='stale'");test('every selected batch needs exact approval',run('!allowed()'));
run('setMaterials([3,4])');
(async()=>{
 await run("$('printBtn').onclick()");test('two materials finish with a concise status and no result panel',run("!state.printing&&!$('workspace').inert&&$('printState').textContent==='模拟打印完成 · 仅为过程演示'&&$('result')===null&&JSON.stringify(selectedMaterialIds())==='[3,4]'"));
 run('toggleMaterial(4)');test('selection change clears completion status',run("$('printState').textContent===''"));
 run('setMaterials([3,4])');const p=run("$('printBtn').onclick()");run('toggleMaterial(4)');await p;test('material change interrupts printing and unlocks workspace',run("!state.printing&&!$('workspace').inert&&$('printState').textContent.includes('模拟已停止')") );
 run('setMaterials([3,4])');const p2=run("$('printBtn').onclick()");run("$('lotPicker').onchange({target:{value:'1'}})");await p2;test('secondary batch change interrupts printing',run("!state.printing&&!allowed()&&!$('workspace').inert&&$('printState').textContent.includes('模拟已停止')") );
 run("$('profileSevere').value='未知食物';saveProfileV2();setMaterials([3,4])");test('unknown restriction blocks every selected material',run("!allowed()&&materialMessage().kind==='unknown'"));
 process.exitCode=rows.some(r=>!r.pass)?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});
