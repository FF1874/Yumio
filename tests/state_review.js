// Pure source-state tests with an explicitly mocked DOM, not a browser/UI pass.
const fs=require('fs'),vm=require('vm');
const nodes=new Map();
const noop=()=>{};
const ctx=new Proxy({}, {get(o,k){return o[k]||noop},set(o,k,v){o[k]=v;return true}});
class Element {
 constructor(id){this.id=id;this.hidden=false;this.innerHTML='';this.textContent='';this.value='';this.children=[];this.dataset={};this.open=false;this.width=840;this.height=500;this.style={setProperty:noop};this.classList={add:noop,remove:noop,toggle:noop};this.content={cloneNode:()=>new Element('clone')};}
 querySelectorAll(){return []} querySelector(){return new Element('query')} setAttribute(){} addEventListener(){} append(){} scrollIntoView(){} getContext(){return ctx} toDataURL(){return 'data:image/png;stub'} getBoundingClientRect(){return {width:400,height:400,left:0,top:0}} showModal(){this.open=true} close(){this.open=false} contains(){return false}
}
const get=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)};
const sandbox={console,structuredClone,Math,JSON,Date,Number,String,Array,Object,Map,Set,Promise,Error,document:{getElementById:get,querySelector:s=>get(s),querySelectorAll:()=>[],createElement:id=>new Element(id),addEventListener:noop,body:get('body')},window:{scrollTo:noop,addEventListener:noop},matchMedia:()=>({matches:true}),location:{hash:'#studio'},requestAnimationFrame:noop,ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},setTimeout:()=>0,clearTimeout:noop};
sandbox.Image=class {};sandbox.atob=atob;vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/../app-check.js','utf8'),sandbox);
const run=s=>vm.runInContext(s,sandbox),rows=[];
function test(name,pass,detail=null){const r={name,pass,detail};rows.push(r);console.log(JSON.stringify(r))}
test('startup in DOM mock',run('state.mode')==='free');
test('initial pieces',run('freeParts.length===13&&freeParts[0].fixedBase'));
run("addPiece('星星')");test('material adds and preserves',run("freeParts.length===14&&freeParts.at(-1).kind==='星星'"));
run("editPiece('duplicate')");test('duplicate',run('freeParts.length===15'));run('undoEdit()');test('undo',run('freeParts.length===14'));run('redoEdit()');test('redo',run('freeParts.length===15'));
run("executeCommand('改成绿色')");test('command color',run("freeParts[selected].color==='#86a28b'"));
run("executeCommand('旋转 30 度')");test('command angle',run('Math.abs(freeParts[selected].angle-Math.PI/6)<0.0001'));
const before=run('freeParts.length');
run("useGood(goods.find(g=>g.id==='cookie-cocoa-letters'))");
test('market opens cookie without overwriting cake',run('freeParts.length')===9&&run('wkDrafts.cake.parts.length')===before);
run("while(freeParts.length<MAX_PARTS)addPiece('球'); addPiece('片')");test('max 24 parts cap',run('freeParts.length')===24);
run("state.profile=['牛奶'];state.confirmed=true;setMaterials([0])");test('allergen denied',run('!allowed()'));
run("setMaterials([3])");test('safe capsule allowed',run('allowed()'));
run("setMaterials([4]);Object.assign(capsules[4],darkLots[1])");test('unapproved batch denied',run('!allowed()'));
const boundary=run(`(()=>{let cases=0,errors=[];for(const kind of kinds)for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI*1.4])for(const x of [-1.25,1.25])for(const y of [-.9,.9])for(const r of [{width:265,height:265},{width:390,height:265},{width:400,height:441},{width:800,height:720}]){const p=part(kind,x,y,.9);p.angle=angle;constrainPart(p);const b=partBounds(p),u=benchScale(r);const left=r.width/2+(p.x+b.left)*u-4,right=r.width/2+(p.x+b.right)*u+4,top=r.height/2+(p.y+b.top)*u-4,bottom=r.height/2+(p.y+b.bottom)*u+4;cases++;if(left-13<0||right+13>r.width||top-36<0||bottom+50>r.height)errors.push({kind,angle,x,y,r,left,right,top,bottom})}return {cases,errors}})()`);
test('rotated shape and selection handles stay within all view sizes',boundary.errors.length===0,boundary);
const drawPoints=[];ctx.moveTo=(x,y)=>drawPoints.push([x,y]);ctx.lineTo=(x,y)=>drawPoints.push([x,y]);
run("freeParts=[part('球',0,.12,.58),part('球',-.46,-.31,.25),part('球',.46,-.31,.25)];strokes=[];state.wire=false;viewZoom=1;for(let i=0;i<8;i++)addPiece('片')");
drawPoints.length=0;run('draw()');test('eight added assets fit actual canvas commands',drawPoints.every(([x,y])=>y>=0),{minY:Math.min(...drawPoints.map(p=>p[1])),negativeVertices:drawPoints.filter(p=>p[1]<0).length});
run("while(freeParts.length<MAX_PARTS)addPiece('片')");
const cameraCases=[];
for(const angle of [0,.25,Math.PI/2,Math.PI])for(const pitch of [.15,.46,.85])for(const layer of [1,6,12]){run(`state.angle=${angle};viewPitch=${pitch};state.layer=${layer}`);drawPoints.length=0;run('draw()');const pass=drawPoints.every(([x,y])=>x>=47.999&&x<=792.001&&y>=67.999&&y<=430.001);cameraCases.push({angle,pitch,layer,pass});}
test('24 overlapping parts fit at 36 orbit and layer combinations',cameraCases.every(c=>c.pass),cameraCases.filter(c=>!c.pass));
const unchanged=run(`(()=>{const before=JSON.stringify(freeParts);paintEditor();return before===JSON.stringify(freeParts)})()`);test('rendering does not mutate shape coordinates',unchanged);
fs.writeFileSync(__dirname+'/state-results.json' ,JSON.stringify(rows,null,2));

process.exitCode=rows.some(r=>!r.pass)?1:0;
