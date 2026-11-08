import {AmbientLight, Box3, Color, DirectionalLight, Group, MeshStandardMaterial, PerspectiveCamera, Scene, Vector3, WebGLRenderer} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// The full model preview and food relief serve different purposes. Only the relief enters the composer.
window.ankuanShowGLB=async function(host,buffer){
  const header=new DataView(buffer);
  if(buffer.byteLength<28||header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2)throw Error('请选择 GLB 2.0 模型。');
  const info=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,header.getUint32(12,true))));
  if([...(info.buffers||[]),...(info.images||[])].some(e=>e.uri&&!e.uri.startsWith('data:')))throw Error('请导入嵌入所有资源的 GLB。');
  const draco=new DRACOLoader().setDecoderPath(new URL('assets/model-import/draco/',document.baseURI).href).setWorkerLimit(1);
  const loader=new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
  const {scene:model}=await loader.parseAsync(buffer,'');
  let renderer;
  try{renderer=new WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
  catch(error){draco.dispose();throw error;}
  renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  const scene=new Scene(),camera=new PerspectiveCamera(36,1,.01,100);
  const bounds=new Box3().setFromObject(model,true),center=bounds.getCenter(new Vector3()),size=bounds.getSize(new Vector3());
  const group=new Group();group.add(model);model.position.sub(center);
  const scale=2.2/Math.max(size.x,size.y,size.z,1e-7);group.scale.setScalar(scale);scene.add(group);
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const primitive=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
    if(!primitive?.map&&(!info.materials||!info.materials.length)){
      mesh.material=new MeshStandardMaterial({color:new Color('#dca16d'),roughness:.7,metalness:0});
      if(!mesh.geometry.attributes.normal)mesh.geometry.computeVertexNormals();
    }
  });
  scene.add(new AmbientLight(0xfff0d9,2.05));
  const light=new DirectionalLight(0xfff7e6,3.1);light.position.set(-2,4,3);scene.add(light);
  const rim=new DirectionalLight(0xffffff,.8);rim.position.set(2,1,-3);scene.add(rim);
  camera.position.set(2.4,1.65,3.5);const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;controls.minDistance=2;controls.maxDistance=9;controls.enableZoom=true;controls.update();
  const render=()=>renderer.render(scene,camera);
  controls.addEventListener('change',render);
  host.replaceChildren(renderer.domElement);renderer.domElement.setAttribute('aria-label','三维模型，可拖动旋转');renderer.domElement.tabIndex=0;
  renderer.domElement.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();group.rotation.y+=e.key==='ArrowLeft'?-.2:.2;render();};
  const resize=()=>{const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render();};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  return ()=>{observer.disconnect();controls.dispose();model.traverse(o=>{o.geometry?.dispose();for(const m of [].concat(o.material||[])){for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();draco.dispose();};
};
