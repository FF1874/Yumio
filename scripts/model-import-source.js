import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Box3,Vector3} from 'three';
const draco=new DRACOLoader().setDecoderPath(new URL('assets/model-import/draco/',document.baseURI).href).setWorkerLimit(1);
async function readStamp(file){
 const buffer=await file.arrayBuffer(),header=new DataView(buffer);
 if(buffer.byteLength<28||header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2)throw Error('请选择 GLB 2.0 模型。');
 const jsonLength=header.getUint32(12,true);
 const json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonLength)));
 if(json.buffers?.some(x=>x.uri))throw Error('请导出将网格嵌入文件的 GLB。');
 // Only embedded geometry participates in the edible relief; materials are chosen on the workbench.
 delete json.images;delete json.textures;delete json.materials;delete json.animations;
 for(const mesh of json.meshes||[])for(const primitive of mesh.primitives)delete primitive.material;
 const entries=json.meshes?.flatMap(m=>m.primitives)||[];
 if(!entries.length||entries.some(p=>p.mode!=null&&p.mode!==4))throw Error('需要包含三角形表面的模型。');
 const count=entries.reduce((n,p)=>n+(json.accessors[p.indices??p.attributes.POSITION]?.count||0),0);
 if(count>6000000)throw Error('请导出少于 200 万个三角面的简化模型。');
 const binaryStart=20+jsonLength;
 const bytes=new TextEncoder().encode(JSON.stringify(json)),padding=(bytes.length+3)&~3,copy=new Uint8Array(20+padding+buffer.byteLength-binaryStart),head=new DataView(copy.buffer);
 copy.set(new Uint8Array(buffer,0,20));head.setUint32(8,copy.length,true);head.setUint32(12,padding,true);copy.fill(32,20,20+padding);copy.set(bytes,20);copy.set(new Uint8Array(buffer,binaryStart),20+padding);
 const loader=new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
 const {scene}=await loader.parseAsync(copy.buffer,'');
 try{
  scene.updateMatrixWorld(true);
  const box=new Box3().setFromObject(scene,true),size=box.getSize(new Vector3()),center=box.getCenter(new Vector3());
  // Upright plaques and drawings need their broad face on the food. Preserve the usual
  // top projection for volumetric objects, whose intended front may be ambiguous.
  const axes=['x','y','z'].sort((a,b)=>size[a]-size[b]);
  const flat=size[axes[0]]<size[axes[1]]*.35;
  const up=flat?axes[0]:'y';
  const across=up==='x'?'z':'x',down=up==='y'?'z':'y';
  const span=Math.max(size[across],size[down]);
  if(!Number.isFinite(span)||span<1e-8)throw Error('这个模型没有可用的浮雕轮廓。');
  const depthScale=flat?Math.max(.08,Math.min(1,2*size[up]/span)):1;
  const n=flat?96:64,zmap=new Float32Array(n*n).fill(-Infinity),margin=2,scale=(n-1-2*margin)/span;
  function vertex(mesh,idx){
   const v=new Vector3().fromBufferAttribute(mesh.geometry.attributes.position,idx).applyMatrix4(mesh.matrixWorld);
   const x=(v[across]-center[across])*(up==='x'?-1:1);
   const y=(v[down]-center[down])*(up==='y'?1:-1);
   return [x*scale+(n-1)/2,y*scale+(n-1)/2,(v[up]-box.min[up])/Math.max(size[up],1e-8)];
  }
  function raster(a,b,c){
   const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)return;
   for(let y=Math.max(0,Math.ceil(Math.min(a[1],b[1],c[1])));y<=Math.min(n-1,Math.max(a[1],b[1],c[1]));y++)
    for(let x=Math.max(0,Math.ceil(Math.min(a[0],b[0],c[0])));x<=Math.min(n-1,Math.max(a[0],b[0],c[0]));x++){
     const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;
     if(u>=0&&v>=0&&u+v<=1)zmap[y*n+x]=Math.max(zmap[y*n+x],u*a[2]+v*b[2]+(1-u-v)*c[2]);
    }
  }
  const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o)});
  let triangles=0;
  for(const mesh of meshes){const pos=mesh.geometry.attributes.position,ids=mesh.geometry.index,vertices=new Array(pos.count);
   for(let i=0;i<(ids?.count??pos.count);i+=3){if(++triangles>2000000)throw Error('模型实例太多，请先简化。');const tri=[0,1,2].map(k=>{const j=ids?ids.getX(i+k):i+k;return vertices[j]??=vertex(mesh,j)});raster(...tri);if(triangles%20000===0)await new Promise(r=>setTimeout(r,0))}
  }
  const canvas=document.createElement('canvas');canvas.width=canvas.height=n;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(n,n),values=[];
  let occupied=0;
  for(let i=0;i<zmap.length;i++){const hit=Number.isFinite(zmap[i]);values.push(hit?Math.round(255*Math.max(0,Math.min(1,zmap[i]))):0);if(hit){pixels.data[i*4+3]=255;occupied++}}
  if(occupied<12)throw Error('顶视面积太小，请调整导出方向。');
  ctx.putImageData(pixels,0,0);const image=new Image();image.src=canvas.toDataURL();await image.decode();
  return {image,relief:{n,values,depthScale,mask:Array.from(zmap,v=>Number.isFinite(v)?1:0)}};
 }finally{scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [].concat(o.material))m.dispose()})}
}
window.ankuanReadGLB=readStamp;
