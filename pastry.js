let separated=false;
// Shapes and preview surfaces describe the artwork only. Ingredients come from selected capsules.
const pastryShelf = {
 '底胚': ['花边塔壳','贝壳糕','云朵饼底','方枕酥','六瓣米饼'],
 '夹层': ['莓果夹心','波纹糖片','杏色夹片','心形夹心'],
 '裱花': ['旋纹花嘴','玫瑰花冠','星芒花','绒球花心','双叶花托'],
 '点缀': ['草莓切片','可可豆形','小珍珠','扇贝糖片','柑橘花瓣'],
};
const pastrySpecs = {
 '花边塔壳':['#d69a58',12,.10,.82,'rim'], '贝壳糕':['#dca465',7,.05,.78,'shell'],
 '云朵饼底':['#dfb788',5,.11,.70,'biscuit'], '方枕酥':['#c8884f',4,.00,.78,'square'],
 '六瓣米饼':['#dbac77',6,.14,.82,'biscuit'], '莓果夹心':['#ad4a61',5,.04,.86,'jam'],
 '波纹糖片':['#bb7762',8,.12,.74,'jam'], '杏色夹片':['#e6ab66',4,.07,.77,'jam'],
 '心形夹心':['#c35d69',1,.0,.88,'heart'], '旋纹花嘴':['#f0c8a1',8,.14,.86,'swirl'],
 '玫瑰花冠':['#d58c91',7,.13,.86,'rose'], '星芒花':['#deb76c',6,.22,.86,'swirl'],
 '绒球花心':['#e0b66c',7,.05,.96,'dome'], '双叶花托':['#8ca77e',2,.29,.52,'shell'],
 '草莓切片':['#c55b64',1,.0,.82,'berry'], '可可豆形':['#895b4d',2,.05,.57,'bean'],
 '小珍珠':['#eee0c4',1,0,.96,'dome'], '扇贝糖片':['#dcb297',9,.08,.74,'shell'],
 '柑橘花瓣':['#efa269',3,.09,.59,'shell']
};
const pastryTypes = Object.keys(pastrySpecs);
function pastryOutline(name) {
 const [,lobes,depth,aspect,style]=pastrySpecs[name];
 return Array.from({length:64},(_,i)=>{
  const t=i*2*Math.PI/64-Math.PI/2,x=Math.cos(t),y=Math.sin(t);
  if(style==='heart')return [Math.sin(t)**3,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17];
  if(style==='square')return [Math.sign(x)*Math.abs(x)**.47,aspect*Math.sign(y)*Math.abs(y)**.47];
  if(style==='berry')return [x*(.83-.24*y),y*.97];
  const r=1-depth+depth*Math.cos(lobes*t);
  return [x*r,y*r*aspect];
 });
}
function pastryHeight(style,r,a) {
 const dome=Math.max(0,1-r*r);
 if(style==='rim')return .30+.46*Math.exp(-(((r-.79)/.13)**2))+.09*dome;
 if(style==='rose'||style==='swirl')return .19+.91*dome**.8+(.09+.11*r)*Math.cos((style==='rose'?5:8)*a-4*r)*Math.sin(Math.PI*r);
 if(style==='shell')return .18+.65*dome*(.78+.22*Math.cos(8*a));
 if(style==='dome'||style==='bean')return .18+.83*Math.sqrt(dome)-(style==='bean'?.17*Math.exp(-((Math.sin(a)*r/.12)**2)):0);
 if(style==='jam'||style==='heart')return .19+.16*dome;
 return .30+.36*dome;
}
// Project the same ring mesh in the library, top view and rotatable workbench.
function pastrySurface(g,p,project,base,color,layer,wire=false,angle=0){
 const style=pastrySpecs[p.kind][4];
 const sides=64,rings=14,co=Math.cos(p.angle||0),si=Math.sin(p.angle||0);
 const make=(i,r,foot=false)=>{
  const [u,v]=p.poly[Math.floor((i%sides)*p.poly.length/sides)],x=u*r,y=v*r,a=Math.atan2(v,u);
  const z=foot?0:p.s*1.15*Math.min(pastryHeight(style,r,a),layer/12*1.35);
  return [p.x+p.s*(co*x-si*y),p.y+p.s*(si*x+co*y),base+z];
 };
 const shells=[Array.from({length:sides},(_,i)=>make(i,1,true))];
 for(let j=rings;j>=0;j--)shells.push(Array.from({length:sides},(_,i)=>make(i,j/rings)));
 const faces=[],sa=Math.sin(angle),ca=Math.cos(angle);
 for(let j=1;j<shells.length;j++)for(let i=0;i<sides;i++){
  const next=(i+1)%sides,pts=[shells[j-1][i],shells[j-1][next],shells[j][next],shells[j][i]];
  const av=pts[0],bv=pts[1],cv=pts[3],ux=bv[0]-av[0],uy=bv[1]-av[1],uz=bv[2]-av[2],vx=cv[0]-av[0],vy=cv[1]-av[1],vz=cv[2]-av[2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  if(j>1&&nz<0){nx=-nx;ny=-ny;nz=-nz}
  const norm=Math.hypot(nx,ny,nz)||1,shine=(-nx*.45-ny*.53+nz*.70)/norm;
  faces.push({pts,depth:pts.reduce((d,q)=>d+q[0]*sa+q[1]*ca+q[2]*.23,0),light:Math.round(shine*24+(j===1?-22:-7))});
 }
 faces.sort((a,b)=>a.depth-b.depth);
 for(const face of faces){const fill=tone(color,face.light);polygon(g,face.pts.map(v=>project(...v)),fill,wire?'#776754':fill,wire?.65:.45)}
}
function pastryBases(parts,levels,spread){
 const bases=[];
 for(let i=0;i<parts.length;i++){
  if(!pastrySpecs[parts[i].kind]&&!parts[i].relief){bases.push(levels[i]*.72);continue}
  let base=0;
  for(let j=0;j<i;j++){
   const lower=parts[j],upper=parts[i],distance=Math.hypot(lower.x-upper.x,lower.y-upper.y);
   if(!lower.fixedBase && distance>=.72*(lower.s+upper.s))continue;
   const height=templateContactHeight(lower,upper);
   if(!height)continue;
   base=Math.max(base,bases[j]+height+(spread?.67:0));
  }
  bases.push(base);
 }
 return bases;
}
const pastryImages=new Map();
function pastryThumb(kind,top=false,color=pastrySpecs[kind][0]){
 const key=kind+color+top;if(pastryImages.has(key))return pastryImages.get(key);
 const canvas=document.createElement('canvas');canvas.width=176;canvas.height=top?176:124;const g=canvas.getContext('2d');
 if(!top){g.fillStyle='#f7f3eb';g.fillRect(0,0,176,124);g.fillStyle='#b49c792e';g.beginPath();g.ellipse(90,78,49,13,0,0,Math.PI*2);g.fill()}
 const project=top?((x,y)=>[88+x*76,88+y*76]):((x,y,z)=>[88+(x*.96-y*.28)*56,76+(y*.96+x*.28)*33-z*33]);
 pastrySurface(g,{kind,x:0,y:0,s:1,poly:pastryOutline(kind)},project,0,color,12,false,top?0:.28);
 const url=canvas.toDataURL();if(pastryImages.size>160)pastryImages.clear();pastryImages.set(key,url);return url;
}
const pastryBuilds=[
 {name:'花瓣夹心酥',pieces:[['六瓣米饼',0,0,.82],['莓果夹心',0,0,.66],['六瓣米饼',0,0,.70],['玫瑰花冠',0,0,.27]]},
 {name:'珍珠莓果塔',pieces:[['花边塔壳',0,0,.79],['莓果夹心',0,0,.55],['小珍珠',-.19,-.10,.14],['小珍珠',.16,.07,.12]]},
 {name:'贝壳下午茶',pieces:[['贝壳糕',0,0,.82],['旋纹花嘴',0,0,.39],['柑橘花瓣',.24,.13,.19]]}
];
function addPastryBuild(index){
 const design=pastryBuilds[index];
 if(state.printing||!design)return;
 if(freeParts.length+design.pieces.length>MAX_PARTS){statusMessage('作品空间不足，请先移除几个部件。');return}
 rememberEdit();
 for(const args of design.pieces){const p=part(...args);p.color=pastrySpecs[p.kind][0];freeParts.push(p)}
 selected=freeParts.length-1;drawing=false;materialColors=false;syncBench();renderStatus();
 statusMessage('已拼入「'+design.name+'」。可以逐个移动部件，或在透视预览中查看分层。');
}
// Draw a food relief from the actual GLB height samples, retaining gaps inside the silhouette.
const reliefCache=new WeakMap(),reliefImages=new WeakMap();
function reliefMesh(relief){
 if(reliefCache.has(relief))return reliefCache.get(relief);
 const {n,values,mask}=relief,faces=[];
 const valid=i=>mask?mask[i]===1:values[i]>0;
 const covered=(x,y)=>x>=0&&y>=0&&x<n-1&&y<n-1&&[y*n+x,y*n+x+1,(y+1)*n+x,(y+1)*n+x+1].every(valid);
 const point=(x,y)=>[x*2/(n-1)-1,y*2/(n-1)-1,(.12+values[y*n+x]*.82/255)*(relief.depthScale??1)];
 for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){
  const i=y*n+x;
  if(![i,i+1,i+n,i+n+1].every(valid))continue;
  const tile=[point(x,y),point(x+1,y),point(x+1,y+1),point(x,y+1)];
  const dx=(tile[1][2]-tile[0][2])*(n-1)/2,dy=(tile[3][2]-tile[0][2])*(n-1)/2;
  const light=Math.round(27*(.6+.35*dx+.55*dy)/Math.hypot(dx,dy,1));
  faces.push({tile,light});
  [[!covered(x-1,y),3,0],[!covered(x+1,y),1,2],[!covered(x,y-1),0,1],[!covered(x,y+1),2,3]].forEach(([edge,a,b])=>{
   if(edge){const p=tile[a],q=tile[b];faces.push({tile:[p,q,[q[0],q[1],0],[p[0],p[1],0]],light:-22})}
  })
 }
 reliefCache.set(relief,faces);return faces;
}
function drawStamp(g,p,project,base,color,layer,wire,angle){
 if(p.foodSurface && !wire && drawFoodSurface(g,p,project,base,color,layer))return;
 const ca=Math.cos(p.angle||0),sa=Math.sin(p.angle||0),az=Math.sin(angle),bz=Math.cos(angle),faces=reliefMesh(p.relief).map(f=>{
  const vertices=f.tile.map(([x,y,z])=>[p.x+p.s*(x*ca-y*sa),p.y+p.s*(y*ca+x*sa),base+p.s*Math.min(z,layer/12)]);
  return {vertices,light:f.light,depth:vertices.reduce((sum,[x,y,z])=>sum+x*az+y*bz+z*.3,0)};
 }).sort((a,b)=>a.depth-b.depth);
 for(const f of faces){const fill=tone(color,f.light);polygon(g,f.vertices.map(v=>project(...v)),fill,wire?'#7e6853':fill,wire?.55:.4)}
}
function stampThumb(p,color){
 const cached=reliefImages.get(p.relief),version=p.foodSurface ? foodTexturesFor(p.foodSurface).version : 0;
 if(cached&&cached.color===color&&cached.version===version)return cached.url;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=176;
 drawStamp(canvas.getContext('2d'),{...p,x:0,y:0,s:1,angle:0},(x,y)=>[88+76*x,88+76*y],0,color,12,false,0);
 const url=canvas.toDataURL();reliefImages.set(p.relief,{color,url,version});return url;
}

// Bake-colored food uses the same UV coordinates in its top view, perspective view
// and shelf artwork. Decode the small food texture on demand; other assets keep the
// established GLB relief renderer.
const foodTextures=new Map(), foodMeshes=new WeakMap(), foodSprites=new WeakMap();
function foodTexturesFor(surface){
 const key=surface.startsWith('icing-')?'icing':surface;
 if(foodTextures.has(key))return foodTextures.get(key);
 const entry={top:null,side:null,version:0};
 foodTextures.set(key,entry);
 const load=(field,name)=>{
   const im=new Image();
   im.onload=()=>{
     const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
     const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
     entry[field]={width:c.width,height:c.height,pixels:g.getImageData(0,0,c.width,c.height).data};
     entry.version++;
     requestAnimationFrame(()=>{if(state.page==='studio'){paintEditor();draw()}});
   };
   im.src='assets/templates/materials/'+name+'.webp';
 };
 load('top',key);if(key.startsWith('base-'))load('side',key+'-side');
 return entry;
}
function foodSurfaceMesh(p){
 if(foodMeshes.has(p.relief))return foodMeshes.get(p.relief);
 const vertices=[],faces=[];
 const add=(x,y,z,u,v)=>{vertices.push({x,y,z,u,v});return vertices.length-1};
 const tri=(a,b,c,side=false)=>faces.push([a,b,c,side]);
 const quad=(a,b,c,d,side=false)=>{tri(a,b,c,side);tri(a,c,d,side)};
 const solidBase=p.foodSurface.startsWith('base-');
 const radial=solidBase||['mango','strawberry','kiwi','blueberry','orange','tomato','onion','basil','vanilla-flute'].includes(p.foodSurface);
 if(radial){
   const steps=solidBase?96:64,rings=solidBase?18:12,hasHole=p.foodSurface==='onion';
   const limits=Array.from({length:steps},(_,i)=>{
     const angle=i*2*Math.PI/steps,ex=Math.cos(angle),ey=Math.sin(angle);
     if(solidBase)return [0,baseOutline(p.foodSurface,angle)];
     if(hasHole){
       const f=Math.hypot(ex/.98,ey/.77),wave=.014*Math.sin(5*angle);return [(.65-wave)/f,(1-wave)/f];
     }
     let lo=0,hi=1.48;for(let j=0;j<14;j++){
       const mid=(lo+hi)/2;if(templateHeight(p.foodSurface,mid*ex,mid*ey)===null)hi=mid;else lo=mid;
     }
     return [0,lo];
   });
   const ring=t=>Array.from({length:steps},(_,i)=>{
     const a=i*Math.PI*2/steps,[inner,outer]=limits[i];
     const radius=inner+(outer-inner)*t,x=radius*Math.cos(a),y=radius*Math.sin(a);
     const sampleRadius=inner+(outer-inner)*Math.min(.9999,Math.max(.0001,t));
     const z=templateHeight(p.foodSurface,sampleRadius*Math.cos(a),sampleRadius*Math.sin(a))||.15;
     return add(x,y,z,(x+1)/2,(y+1)/2);
   });
   const wall=(a,b,index,inside=false)=>{
     const q=vertices[a],s=vertices[b],u=solidBase?index/steps:q.u,v=solidBase?0:q.v;
     const uu=solidBase?(index+1)/steps:s.u,vv=solidBase?0:s.v;
     const endA=add(q.x,q.y,q.z,u,v),endB=add(s.x,s.y,s.z,uu,vv);
     const shrink=solidBase?.984:1;
     const lowA=add(q.x*shrink,q.y*shrink,0,u,solidBase?1:v),lowB=add(s.x*shrink,s.y*shrink,0,uu,solidBase?1:vv);
     if(inside)quad(lowB,lowA,endA,endB,true);else quad(lowA,lowB,endB,endA,true);
   };
   let last;
   if(hasHole){
     last=ring(0);for(let i=0;i<steps;i++)wall(last[i],last[(i+1)%steps],i,true);
   }else{
     const center=add(0,0,templateHeight(p.foodSurface,0,0),.5,.5);
     last=ring(1/rings);for(let i=0;i<steps;i++)tri(center,last[i],last[(i+1)%steps]);
   }
   for(let j=hasHole?1:2;j<=rings;j++){
     const next=ring(j/rings);
     for(let i=0;i<steps;i++)quad(last[i],next[i],next[(i+1)%steps],last[(i+1)%steps]);
     last=next;
   }
   for(let i=0;i<steps;i++)wall(last[i],last[(i+1)%steps],i);
 }else if(detailedFoodSurfaces.has(p.foodSurface)){
   meshFoodContour(p.foodSurface,40,add,tri,quad);
 }else{
   const {n,values,mask}=p.relief;
   const valid=i=>mask ? mask[i]===1 : values[i]>0;
   const top=new Int32Array(n*n),bottom=new Int32Array(n*n);
   for(let i=0;i<n*n;i++){
     const u=i%n/(n-1),v=Math.floor(i/n)/(n-1);top[i]=add(2*u-1,2*v-1,.12+values[i]*.82/255,u,v);
     bottom[i]=add(2*u-1,2*v-1,0,u,v);
   }
   const covered=(x,y)=>{
     if(x<0||y<0||x>=n-1||y>=n-1)return false;
     const i=y*n+x;return valid(i)&&valid(i+1)&&valid(i+n)&&valid(i+n+1);
   };
   for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){
     const i=y*n+x;
     if(!covered(x,y))continue;
     quad(top[i],top[i+1],top[i+n+1],top[i+n]);
     if(!covered(x-1,y))quad(bottom[i+n],bottom[i],top[i],top[i+n],true);
     if(!covered(x+1,y))quad(bottom[i+1],bottom[i+n+1],top[i+n+1],top[i+1],true);
     if(!covered(x,y-1))quad(bottom[i],bottom[i+1],top[i+1],top[i],true);
     if(!covered(x,y+1))quad(bottom[i+n+1],bottom[i+n],top[i+n],top[i+n+1],true);
   }
 }
 // Average adjacent face normals for soft upper surfaces. Side vertices remain sharp.
 const vertexNormals=vertices.map(()=>[0,0,0]);
 for(const [i,j,k] of faces){
   const a=vertices[i],b=vertices[j],c=vertices[k];
   const ab=[b.x-a.x,b.y-a.y,b.z-a.z],ac=[c.x-a.x,c.y-a.y,c.z-a.z];
   const n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
   for(const v of [i,j,k])for(let t=0;t<3;t++)vertexNormals[v][t]+=n[t];
 }
 vertexNormals.forEach(v=>{const n=Math.hypot(...v)||1;for(let i=0;i<3;i++)v[i]/=n});
 const mesh={vertices,faces,vertexNormals};foodMeshes.set(p.relief,mesh);return mesh;
}
function drawFoodSurface(g,p,project,base,color,layer){
 const maps=foodTexturesFor(p.foodSurface);if(!maps.top)return false;
 const origin=project(p.x,p.y,base),ca=Math.cos(p.angle||0),sa=Math.sin(p.angle||0);
 const local=[
   project(p.x+p.s*ca,p.y+p.s*sa,base),
   project(p.x-p.s*sa,p.y+p.s*ca,base),
   project(p.x,p.y,base+p.s)
 ].map(([x,y])=>[x-origin[0],y-origin[1]]);
 const cache=foodSprites.get(p.relief)||new Map();foodSprites.set(p.relief,cache);
 const key=[...local.flat().map(v=>Math.round(v*20)),color,layer,maps.version].join(',');
 let sprite=cache.get(key);
 if(!sprite){
   sprite=rasterFoodMesh(p,maps,local,color,layer);
   if(cache.size>=4)cache.delete(cache.keys().next().value);
   cache.set(key,sprite);
 }
 g.drawImage(sprite.canvas,origin[0]+sprite.left,origin[1]+sprite.top);return true;
}
function rasterFoodMesh(p,maps,axes,color,layer){
 const mesh=foodSurfaceMesh(p),[a,b,c]=axes;
 // Depth is the null direction of the projected basis. Positive Z faces the viewer.
 let dx=b[0]*c[1]-c[0]*b[1],dy=c[0]*a[1]-a[0]*c[1],dz=a[0]*b[1]-b[0]*a[1];
 if(dz<0){dx=-dx;dy=-dy;dz=-dz}
 const maxZ=layer/12,pts=mesh.vertices.map((v,i)=>{
   const z=Math.min(v.z,maxZ),n=mesh.vertexNormals[i],u=v.x,vv=v.y;
   const light=.84+.22*Math.max(-.45,-n[0]*.46-n[1]*.52+n[2]*.72);
   return {x:u*a[0]+vv*b[0]+z*c[0],y:u*a[1]+vv*b[1]+z*c[1],d:dx*u+dy*vv+dz*z,light};
 });
 let left=1e9,top=1e9,right=-1e9,bottom=-1e9;
 for(const v of pts){left=Math.min(left,v.x);top=Math.min(top,v.y);right=Math.max(right,v.x);bottom=Math.max(bottom,v.y)}
 left=Math.floor(left)-1;top=Math.floor(top)-1;
 const canvas=document.createElement('canvas');canvas.width=Math.max(2,Math.ceil(right-left)+2);canvas.height=Math.max(2,Math.ceil(bottom-top)+2);
 const width=canvas.width,height=canvas.height,context=canvas.getContext('2d'),im=context.createImageData(width,height);
 const depth=new Float32Array(width*height).fill(-Infinity),data=im.data;
 const tint=color!==p.color && /^#[0-9a-f]{6}$/i.test(color) ? [1,3,5].map(k=>parseInt(color.slice(k,k+2),16)) : null;
 for(const [ia,ib,ic,side] of mesh.faces){
   const v=pts[ia],w=pts[ib],t=pts[ic],modelA=mesh.vertices[ia],modelB=mesh.vertices[ib],modelC=mesh.vertices[ic];
   const abx=w.x-v.x,aby=w.y-v.y,acx=t.x-v.x,acy=t.y-v.y,den=abx*acy-aby*acx;
   if(Math.abs(den)<.0001)continue;
   const xMin=Math.max(0,Math.floor(Math.min(v.x,w.x,t.x)-left)),xMax=Math.min(width-1,Math.ceil(Math.max(v.x,w.x,t.x)-left));
   const yMin=Math.max(0,Math.floor(Math.min(v.y,w.y,t.y)-top)),yMax=Math.min(height-1,Math.ceil(Math.max(v.y,w.y,t.y)-top));
   const tex=side&&maps.side ? maps.side : maps.top;
   for(let py=yMin;py<=yMax;py++)for(let px=xMin;px<=xMax;px++){
     const x=px+.5+left-v.x,y=py+.5+top-v.y;
     const wb=(x*acy-y*acx)/den,wc=(y*abx-x*aby)/den,wa=1-wb-wc;
     if(wa<-.001||wb<-.001||wc<-.001)continue;
     const at=py*width+px,z=wa*v.d+wb*w.d+wc*t.d;if(z<depth[at])continue;
     depth[at]=z;
     const u=Math.max(0,Math.min(1,wa*modelA.u+wb*modelB.u+wc*modelC.u));
     const vv=Math.max(0,Math.min(1,wa*modelA.v+wb*modelB.v+wc*modelC.v));
     const sample=4*(Math.round(vv*(tex.height-1))*tex.width+Math.round(u*(tex.width-1)));
     const light=(wa*v.light+wb*w.light+wc*t.light)*(side&&!maps.side?.87:1);
     for(let k=0;k<3;k++)data[at*4+k]=tint?tint[k]*light*(.75+tex.pixels[sample+k]/510):tex.pixels[sample+k]*light;
     data[at*4+3]=255;
   }
 }
 context.putImageData(im,0,0);return {canvas,left,top};
}
