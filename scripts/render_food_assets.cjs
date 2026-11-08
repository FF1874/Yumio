// Pre-render the studio meshes at export resolution. Python/Pillow decodes and encodes
// image formats; all model geometry, UVs and surface lighting come from the app.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const recipesOnly=process.argv.includes('--recipes');
const out=path.join(root,'assets/templates');
const outputDirectory=recipesOnly?path.join(root,'assets/recipes'):out;
fs.mkdirSync(outputDirectory,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ankuan-food-render-'));
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
function python(args,options={}){
 const result=spawnSync('python3',args,{...options,maxBuffer:16*1024*1024});
 if(result.status!==0)throw new Error(result.stderr?.toString()||result.error?.message);
 return result.stdout;
}
class Canvas {
 constructor(){this.width=0;this.height=0;this.rgba=null}
 getContext(){return {
   createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   putImageData:data=>{this.rgba=data.data}
 }}
}
const context={atob,console,document:{createElement:()=>new Canvas()},featuredFlower:JSON.parse(read('assets/model-import/flower-relief.json'))};
vm.createContext(context);
vm.runInContext(read('pastry.js')+'\n'+read('template-assets.js')+'\n'+(recipesOnly?read('food-recipes.js'):'const studioRecipes=[];')+`
function part(kind,x,y,s){return {kind,x,y,s,angle:0,poly:pastrySpecs[kind]?pastryOutline(kind):[]}}
globalThis.recipes=studioRecipes;globalThis.library=foodLibrary;globalThis.bases=foodBases;globalThis.make=makeTemplatePart;
globalThis.asset=templateAssetByKey;globalThis.raster=rasterFoodMesh;globalThis.heights=(parts)=>pastryBases(parts,parts.map(()=>0),false);
`,context);
const textures=new Map();
function texturesFor(surface){
 const key=surface.startsWith('icing-')?'icing':surface;
 if(textures.has(key))return textures.get(key);
 const readMap=(name)=>{
   const file=path.join(out,'materials',name+'.webp');
   if(!fs.existsSync(file))return null;
   return {width:256,height:256,pixels:python(['-c',"import sys;from PIL import Image;sys.stdout.buffer.write(Image.open(sys.argv[1]).convert('RGBA').tobytes())",file])};
 };
 const maps={top:readMap(key),side:key.startsWith('base-')?readMap(key+'-side'):null};
 if(!maps.top)throw new Error('Missing material '+key);
 textures.set(key,maps);return maps;
}
const presets={
 pizza:[
   ['tomato',-.46,-.32,.24],['tomato',.37,-.28,.23],['tomato',.05,.43,.23],
   ['onion',-.13,-.55,.24,-.23],['onion',.51,.17,.23,.5],['onion',-.43,.34,.22,-.45],
   ['broccoli',.18,-.53,.19,.28],['broccoli',-.54,.03,.18,-.4],['broccoli',.25,.35,.16,.65],
   ['basil',-.05,-.03,.24,.5],['basil',.05,.09,.19,-.66]
 ],
 cookie:[
   ['icing-A',0,.08,.35,-.05],['rosette',-.38,-.19,.23],['hi-flower',.40,.19,.23],
   ['blueberry',.17,-.38,.10],['orange',-.30,.37,.22,-.3]
 ],
 cake:[
   ['strawberry',-.41,-.08,.33,-.59],['strawberry',-.10,-.33,.31,-.27],
   ['mango',.27,-.23,.23,-.13],['mango',.51,.06,.23,.31],['mango',.14,.08,.19,.53],
   ['orange',-.25,.21,.22,-.19],['blueberry',.04,-.43,.105],['blueberry',.30,.29,.11],
   ['vanilla-flute',-.35,.45,.20],['vanilla-flute',-.02,.48,.19],['vanilla-flute',.32,.49,.17]
 ]
};
const jobs=[];
function picture(name,parts,cover,theme=name){
 const angle=cover?(theme==='pizza'?-.15:-.19):-.23;
 const pitch=cover?(theme==='pizza'?.79:theme==='cake'?.54:.70):.67;
 const down=Math.sqrt(1-pitch*pitch);
 const scale=cover?(recipesOnly?390:330):178;
 const heights=context.heights(parts),layers=[];
 for(const [i,p] of parts.entries()){
   const a=angle+(p.angle||0),ca=Math.cos(a),sa=Math.sin(a),len=scale*p.s;
   const axes=[[ca*len,sa*len*pitch],[-sa*len,ca*len*pitch],[0,-len*down]];
   const sprite=context.raster(p,texturesFor(p.foodSurface),axes,p.color,12);
   const x=(p.x*Math.cos(angle)-p.y*Math.sin(angle))*scale+sprite.left;
   const y=((p.x*Math.sin(angle)+p.y*Math.cos(angle))*pitch-heights[i]*down)*scale+sprite.top;
   const spritePath=path.join(temp,name+'-'+i+'.rgba');
   fs.writeFileSync(spritePath,Buffer.from(sprite.canvas.rgba));
   layers.push({file:spritePath,x,y,w:sprite.canvas.width,h:sprite.canvas.height,z:heights[i],depth:p.x*Math.sin(angle)+p.y*Math.cos(angle)});
 }
 jobs.push({name,theme,cover,layers});
}
if(recipesOnly){
 for(const recipe of context.recipes){
  const base={...context.make(context.bases[recipe.theme]),fixedBase:true};
  const parts=recipe.parts.map(({key,x,y,scale,rotation})=>{
   const asset=context.asset(key);
   if(!asset)throw new Error('Unknown recipe asset '+key);
   return {...context.make(asset,x,y),s:scale,angle:rotation};
  });
  picture(recipe.id,[base,...parts],true,recipe.theme);
 }
}else{
for(const a of context.library)picture(a.key,[{...context.make(a),s:1}],false);
for(const [id,a] of Object.entries(context.bases)){
 const base={...context.make(a),fixedBase:true};
 picture(a.key,[base],false);
 const parts=[base,...presets[id].map(([key,x,y,size,angle=0])=>({...context.make(context.asset(key),x,y),s:size,angle}))];
 picture(id,parts,true);
}
}
const index=path.join(temp,'jobs.json');fs.writeFileSync(index,JSON.stringify(jobs));
python([path.join(__dirname,recipesOnly?'compose_recipe_covers.py':'compose_food_assets.py'),index,outputDirectory],{stdio:['ignore','pipe','pipe']});
fs.rmSync(temp,{recursive:true,force:true});
console.log('Rendered',jobs.length,'food assets from the studio renderer.');
