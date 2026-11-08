// Pure source-state tests with an explicitly mocked DOM, not a browser/UI pass.
const fs=require('fs'),vm=require('vm');
const nodes=new Map();
const noop=()=>{};
const ctx=new Proxy({}, {get(o,k){return o[k]||noop},set(o,k,v){o[k]=v;return true}});
class Element {
 constructor(id){this.id=id;this.hidden=false;this.innerHTML='';this.textContent='';this.value='';this.children=[];this.dataset={};this.open=false;this.width=840;this.height=500;this.style={setProperty:noop};this.classList={add:noop,remove:noop,toggle:noop};this.content={cloneNode:()=>new Element('clone')};}
 querySelectorAll(){return []} querySelector(){return new Element('query')} setAttribute(){} addEventListener(t,f){(this.listeners??={})[t]=f} focus(){} reportValidity(){return true} append(){} scrollIntoView(){} getContext(){return ctx} toDataURL(){return 'data:image/png;stub'} getBoundingClientRect(){return {width:400,height:400,left:0,top:0}} showModal(){this.open=true} close(){this.open=false} contains(){return false}
}
const get=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)};
const storage=new Map();
function makeSandbox(){return {console,structuredClone,Math,JSON,Date,Number,String,Array,Object,Map,Set,Promise,Error,document:{getElementById:get,querySelector:s=>get(s),querySelectorAll:()=>[],createElement:id=>new Element(id),addEventListener:noop,body:get('body')},window:{scrollTo:noop,addEventListener:noop},matchMedia:()=>({matches:true}),location:{hash:'#studio'},requestAnimationFrame:noop,ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:f=>{queueMicrotask(f);return 0},clearTimeout:noop};}
let sandbox;function boot(){nodes.clear();sandbox=makeSandbox();sandbox.Image=class {};sandbox.atob=atob;vm.createContext(sandbox);vm.runInContext(currentSource(),sandbox)}
const run=s=>vm.runInContext(s,sandbox),rows=[];
function test(name,pass){rows.push({name,pass});console.log((pass?'PASS ':'FAIL ')+name)}
function currentSource(){return fs.readFileSync(__dirname+'/../app-check.js','utf8')}
boot();run('setMaterials([3,4]);beginProfileEditV2()');
test('editing fails closed',run('!allowed()&&!state.confirmed'));
run('cancelProfileEditV2()');test('cancel restores both materials and eligibility',run("JSON.stringify(selectedMaterialIds())==='[3,4]'&&allowed()"));
run('beginProfileEditV2();$("profileOther").value="可可";saveProfileV2()');
test('save preserves materials and recomputes conflict',run("JSON.stringify(selectedMaterialIds())==='[3,4]'&&!allowed()&&materialMessage().kind==='conflict'"));
run('$("addProfile").onclick();cancelProfileEditV2()');
test('new profile cancel preserves selected materials',run("JSON.stringify(selectedMaterialIds())==='[3,4]'&&!allowed()"));
run('$("addProfile").onclick();$("profileName").value="无过敏";$("profileSevere").value="无已知过敏";$("profileMild").value="";$("profileOther").value="无其他忌口";saveProfileV2()');
test('new saved profile revalidates materials',run('allowed()&&selectedMaterialIds().length===2'));
run('$("profileList").onclick({target:{closest:()=>({dataset:{profileId:"sample-xiaozhi"}})}})');
test('switch preserves materials but blocks new conflict',run("selectedMaterialIds().length===2&&!allowed()"));
run('beginProfileEditV2()');
let prevented=false,stopped=false;
sandbox.navEvent={target:{closest:()=>({getAttribute:()=> '#studio'})},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}};
run('guardProfileNavigationV2(navEvent)');test('navigation click is blocked during edit',prevented&&stopped&&run('archiveEditingV2'));
let replaces=0;sandbox.history={replaceState(a,b,url){replaces++;sandbox.location.hash=url}};
run('location.hash="#studio";guardProfileHashV2();guardProfileHashV2()');
test('history fallback returns to profile without looping',replaces===1&&run('state.page==="profile"&&archiveEditingV2'));
run('cancelProfileEditV2();location.hash="#studio";guardProfileHashV2();updateRoute()');test('navigation resumes after cancel',run('state.page==="studio"'));
// DOM-adapter checks explicitly model removal of focused child nodes on innerHTML writes.
const editor=get('editor'),oldPiece={dataset:{},inEditor:true};let focused=null;
editor.contains=el=>Boolean(el?.inEditor);
editor.querySelector=selector=>selector.includes('data-i')?{focus(){focused=selector}}:null;
let editorMarkup='';Object.defineProperty(editor,'innerHTML',{get:()=>editorMarkup,set:v=>{editorMarkup=v;sandbox.document.activeElement=null}});
run('addPiece("星星");addPiece("花朵");wkActiveView="top"');
sandbox.document.activeElement=oldPiece;run('selected=1;paintEditor()');test('editor redraw restores selected piece focus',focused==='[data-i="1"]');
sandbox.document.activeElement=oldPiece;focused=null;run('editPiece("remove")');test('delete restores adjacent piece focus',focused==='[data-i="1"]');
// Rotation/scale buttons stay reachable after their own DOM nodes are replaced.
editor.querySelector=selector=>({focus(){focused=selector}});
sandbox.document.activeElement={dataset:{edit:'turn'},inEditor:true};run('editPiece("turn")');
test('object action redraw restores the same toolbar action',focused==='[data-edit="turn"]');
editor.querySelector=()=>null;editor.focus=()=>{focused='empty-editor'};
sandbox.document.activeElement=oldPiece;run('freeParts=[];selected=-1;paintEditor()');
test('empty editor remains keyboard reachable',focused==='empty-editor'&&editor.tabIndex===-1);
const grid=get('recipeGrid'),detail={open:true},card={dataset:{recipeId:'cake-strawberry-mango'},querySelector:()=>detail};
grid.querySelectorAll=()=>[card];grid.contains=()=>true;let gridWrites=0,gridMarkup=grid.innerHTML;
Object.defineProperty(grid,'innerHTML',{get:()=>gridMarkup,set:v=>{gridWrites++;gridMarkup=v;detail.open=false}});
grid.querySelector=()=>({focus(){focused='recipe-summary'}});
sandbox.document.activeElement={closest:()=>card,matches:()=>true};
run('renderMarket()');test('unchanged market avoids DOM replacement',gridWrites===0&&detail.open);
run('capsules[1].incomplete="资料待补";renderMarket()');test('changed recipe risks preserve open details and focus',gridWrites===1&&detail.open&&focused==='recipe-summary');
process.exitCode=rows.some(r=>!r.pass)?1:0;
