// Markup and source-state regressions. DOM mocks do not verify browser layout.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const source=fs.readFileSync(__dirname+'/../app-check.js','utf8');
const home=html.match(/<section id="home">([\s\S]*?)<\/section>/)?.[1];
const studio=html.match(/<section id="studio" hidden>([\s\S]*?)<\/section>\s*<\/main>/)?.[1];
assert.ok(home,'home section remains');
assert.ok(studio,'studio section remains');
assert.doesNotMatch(home,/创作入口|class="tiles(?:\s|"|$)|homeUnified/);
assert.match(home,/<a class="primary" href="#studio">开始体验/);
assert.match(home,/class="homeConcept"/);
const nav=html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1]||'';
for(const route of ['home','profile','market','studio'])assert.ok(nav.includes('href="#'+route+'"'),'navigation to '+route+' remains');
assert.doesNotMatch(html,/href="#about"|id="about"|id="approved"/);
for(const id of ['workspace','printBtn','printState','scene','editor','materialOptions'])assert.ok(studio.includes('id="'+id+'"'),id+' remains');
assert.doesNotMatch(html,/id="(?:result|resultImage|resultRef)"/);
assert.doesNotMatch(source,/\bmakeResult\b|\$\(['"](?:result|resultImage|resultRef)['"]\)|scene\.toDataURL\(/);
assert.equal((source.match(/\$\('printBtn'\)\.onclick=/g)||[]).length,1,'one simulation handler');
console.log('PASS: home entry group and result markup/API removed; hero, navigation and studio retained');

const nodes=new Map(),noop=()=>{},progress=[];
let snapshots=0,scrolls=0;
const context=new Proxy({}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
class Element{
 constructor(id){Object.assign(this,{id,hidden:false,textContent:'',value:'',children:[],dataset:{},open:false,width:840,height:500,style:{setProperty:noop},classList:{add:noop,remove:noop,toggle:noop},content:{cloneNode:()=>new Element('clone')}});this._html='';}
 get innerHTML(){return this._html}
 set innerHTML(value){this._html=value;if(this.id==='printState'&&value.includes('模拟打印中'))progress.push(value)}
 querySelectorAll(){return []}querySelector(){return new Element('query')}
 setAttribute(){}addEventListener(t,f){(this.listeners??={})[t]=f}focus(){}reportValidity(){return true}append(){}
 scrollIntoView(){scrolls++}getContext(){return context}toDataURL(){snapshots++;return 'data:image/png;stub'}
 getBoundingClientRect(){return {width:400,height:400,left:0,top:0}}showModal(){this.open=true}close(){this.open=false}contains(){return false}
}
function get(id){assert.ok(!['result','resultImage','resultRef'].includes(id),'removed result node must never be accessed');if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)}
const sandbox={console,structuredClone,Math,JSON,Date,Number,String,Array,Object,Map,Set,Promise,Error,
 document:{getElementById:get,querySelector:get,querySelectorAll:()=>[],createElement:id=>new Element(id),addEventListener:noop,body:get('body')},
 window:{scrollTo:noop,addEventListener:noop},matchMedia:()=>({matches:true}),location:{hash:'#studio'},requestAnimationFrame:noop,
 ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},
 setTimeout:f=>{queueMicrotask(f);return 0},clearTimeout:noop};
sandbox.Image=class {};sandbox.atob=atob;vm.createContext(sandbox);vm.runInContext(source,sandbox);
const run=s=>vm.runInContext(s,sandbox),finished='模拟打印完成 · 仅为过程演示';
(async()=>{
 run('setMaterials([3,4])');
 const before=run('JSON.stringify(freeParts)'),initialSnapshots=snapshots,initialScrolls=scrolls;
 const first=run("$('printBtn').onclick()");
 assert.ok(run("state.printing&&$('workspace').inert&&$('printBtn').disabled"));
 assert.ok(progress[0].includes('8%'),'first progress visible');
 const seq=run('state.printSeq');
 await run("$('printBtn').onclick()");assert.equal(run('state.printSeq'),seq,'repeated click does not restart simulation');
 await first;
 assert.equal(progress.length,12);assert.ok(progress.at(-1).includes('100%'));
 assert.equal(get('printState').textContent,finished);
 assert.ok(run("!state.printing&&!$('workspace').inert&&!$('printBtn').disabled"));
 assert.equal(run('JSON.stringify(selectedMaterialIds())'),'[3,4]');
 assert.equal(run('JSON.stringify(freeParts)'),before);
 assert.equal(snapshots,initialSnapshots,'simulation must not capture an image');
 assert.equal(scrolls,initialScrolls,'completion must not jump to another panel');
 await run("$('printBtn').onclick()");assert.equal(progress.length,24,'a completed simulation can run again');
 console.log('PASS: progress, repeated clicks, repeat simulation, workspace unlock, retained materials and no image/scroll side effect');

 const interrupted=run("$('printBtn').onclick()");run('toggleMaterial(4)');await interrupted;
 assert.ok(run("!state.printing&&!$('workspace').inert&&$('printState').textContent.includes('模拟已停止')"));
 run('setMaterials([2,3])');const progressBefore=progress.length;await run("$('printBtn').onclick()");
 assert.ok(run("!allowed()&&$('printBtn').disabled&&!state.printing"));assert.equal(progress.length,progressBefore);
 run("setMaterials([3,4]);$('lotPicker').onchange({target:{value:'1'}})");await run("$('printBtn').onclick()");
 assert.ok(run("!allowed()&&$('printBtn').disabled&&materialMessage().kind==='unknown'"));assert.equal(progress.length,progressBefore);
 run("$('lotPicker').onchange({target:{value:'0'}});$('profileSevere').value='未知食物';saveProfileV2();setMaterials([3])");await run("$('printBtn').onclick()");
 assert.ok(run("!allowed()&&$('printBtn').disabled&&materialMessage().kind==='unknown'"));assert.equal(progress.length,progressBefore);
 console.log('PASS: material interruption, ingredient conflict, incomplete batch and unknown-profile gates remain');
})().catch(error=>{console.error(error);process.exitCode=1});
