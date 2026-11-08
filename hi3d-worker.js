const SITE='https://ankuan-studio-visual.qbj26qz7cw.chatgpt.site';
const CLIENT='mcp_XyfJavH-Kg3eYn303_SGumhFOSpM-AUX1a7vk9wvFSs';
const MCP='https://agent.hi3d.ai/mcp';
const CALLBACK=SITE+'/hi3d-callback';
const TOKEN='https://www.hi3d.ai/aigc/api/auth/mcp/token';
const LIMIT=300;
const noStore={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>Response.json(body,{status,headers:noStore});
const error=(message,status=400)=>json({error:message},status);
const now=()=>Date.now();
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const hash=text=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)).then(hex);
const bytes=s=>Uint8Array.from(s.match(/../g)||[],v=>parseInt(v,16));
const random=n=>hex(crypto.getRandomValues(new Uint8Array(n)));
const secretValid=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const BIND_COOKIE='__Host-ankuan_owner';
const cookieValue=r=>r.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(BIND_COOKIE+'='))?.slice(BIND_COOKIE.length+1);
async function cryptKey(env){
  if(!secretValid(env.ANKUAN_TOKEN_KEY))throw Error('runtime-key');
  return crypto.subtle.importKey('raw',bytes(env.ANKUAN_TOKEN_KEY),'AES-GCM',false,['encrypt','decrypt']);
}
async function seal(env,value){
  const iv=crypto.getRandomValues(new Uint8Array(12)),key=await cryptKey(env);
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(value)));
  return hex(iv)+'.'+hex(ciphertext);
}
async function unseal(env,value){
  const [iv,cipher]=value.split('.'),key=await cryptKey(env);
  const text=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv)},key,bytes(cipher));
  return JSON.parse(new TextDecoder().decode(text));
}
function setupPage(content,script=''){
  return new Response('<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Yumio · 项目账号</title><style>body{background:#f8f8f4;color:#24352d;font:16px/1.65 system-ui;margin:clamp(25px,8vw,110px);max-width:700px}button,a{font:inherit;color:#224b37}button{padding:.6em 1.4em;border:0;border-radius:9px;background:#284d3c;color:white;cursor:pointer}</style><main><h1>Yumio · 项目账号</h1>'+content+'</main>'+(script?'<script>'+script+'</script>':''),{headers:{...noStore,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'"}});
}
function bootstrapPage(){
  return setupPage('<p>使用项目 Hi3D 账号授权真实生成。访客共用本场 300 积分预算。</p><button id="bind">连接项目账号</button><p id="note" role="status"></p>',`
const ticket=location.hash.slice(1);history.replaceState(null,'','/sponsor-setup');
document.querySelector('#bind').onclick=async function(){this.disabled=true;const note=document.querySelector('#note');
try{const reply=await fetch('/sponsor-setup/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket})});const data=await reply.json();if(!reply.ok)throw Error(data.error);location.assign(data.url);}catch(e){note.textContent=e.message;this.disabled=false;}};`);
}
async function setupStart(request,env){
  const text=await boundedText(request,2048);if(text===null)return error('无效激活请求。');
  let ticket;try{({ticket}=JSON.parse(text));}catch{return error('无效激活请求。');}
  if(!secretValid(env.ANKUAN_SETUP_HASH)||!secretValid(env.ANKUAN_TOKEN_KEY))return error('项目授权尚未配置。',503);
  if(typeof ticket!=='string'||ticket.length<32||ticket.length>256||await hash(ticket)!==env.ANKUAN_SETUP_HASH)return error('激活链接无效。',403);
  const used=await env.DB.prepare('SELECT id FROM sponsor_account WHERE used_setup_hash=?').bind(env.ANKUAN_SETUP_HASH).first();
  if(used)return error('该链接已经完成授权。',409);
  const state=random(32),cookie=random(32),verifier=random(40);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sponsor_setup WHERE expires_at < ?').bind(now()),
    env.DB.prepare('INSERT INTO sponsor_setup(state,cookie_hash,setup_hash,sealed_verifier,expires_at) VALUES(?,?,?,?,?)').bind(state,await hash(cookie),env.ANKUAN_SETUP_HASH,await seal(env,verifier),now()+600000),
  ]);
  const challenge=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const url=new URL('https://www.hi3d.ai/authorize');url.search=new URLSearchParams({client_id:CLIENT,redirect_uri:CALLBACK,response_type:'code',code_challenge_method:'S256',code_challenge:challenge,resource:MCP,scope:'account:read generation:create task:read',state});
  const response=json({url:url.href});response.headers.set('Set-Cookie',BIND_COOKIE+'='+cookie+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600');return response;
}
const oauthErrors=new Set(['invalid_request','invalid_client','invalid_grant','invalid_scope','access_denied','unauthorized_client','unsupported_grant_type','invalid_target','temporarily_unavailable','server_error']);
async function tokenRequest(form){
  const body=new URLSearchParams({client_id:CLIENT,resource:MCP,...form}).toString();
  return fetch(TOKEN,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body,signal:AbortSignal.timeout(18000)});
}
async function exchange(form){
  let response;
  try{response=await tokenRequest(form)}catch{throw Error('token-network')}
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw Error('token-'+response.status+'-'+(oauthErrors.has(data?.error)?data.error:'http'));
  const token=data?.access_token?data:data?.data;
  if(typeof token?.access_token!=='string')throw Error('token-format');
  return token;
}
// The probe sends no credentials and cannot create a job. Only the setup-link holder may run it.
async function checkService(request,env){
  const raw=await boundedText(request,2048);let ticket;
  try{ticket=JSON.parse(raw).ticket}catch{return error('请求无效')}
  if(typeof ticket!=='string'||await hash(ticket)!==env.ANKUAN_SETUP_HASH)return error('链接无效',403);
  const token=await tokenRequest({grant_type:'authorization_code',code:'ankuan-connectivity-probe',code_verifier:'0'.repeat(64),redirect_uri:CALLBACK})
    .then(async r=>{const body=await r.json().catch(()=>null);return {status:r.status,error:oauthErrors.has(body?.error)?body.error:null,type:r.headers.get('content-type')}}).catch(()=>({error:'network'}));
  const mcp=await fetch(MCP,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',clientInfo:{name:'ankuan-readiness',version:'1'},capabilities:{}}}),signal:AbortSignal.timeout(15000)})
    .then(r=>({status:r.status,type:r.headers.get('content-type'),authChallenge:!!r.headers.get('www-authenticate')})).catch(()=>({error:'network'}));
  let cryptoOK=false;try{cryptoOK=(await unseal(env,await seal(env,'handshake')))==='handshake'}catch{}
  const connected=!!(await env.DB.prepare('SELECT id FROM sponsor_account LIMIT 1').first());
  const diagnostic={};
  if(connected){
    try{
      const tool=await openMcp(env);
      diagnostic.initialized=true;
      const bal=await tool('get_balance',{});diagnostic.balanceFields=Object.keys(bal);
      const input=await tool('upload_input',{image_base64:siteFiles['/assets/templates/strawberry.webp'][1],mime_type:'image/webp'});
      diagnostic.uploadOK=typeof input.file_token==='string';
      if(diagnostic.uploadOK){
        const quote=await tool('quote_generation',{file_tokens:[input.file_token],version:'v3.0',model_type:'high_quality',generation_type:'model_only'});
        diagnostic.quote={can_submit:quote.can_submit,estimate:quote.estimated_points,valid:!!quote.quote_id};
      }
    }catch(e){diagnostic.failure=safeMcpFailure(e)}
  }
  return json({token,mcp,cryptoOK,connected,diagnostic});
}
async function setupCallback(request,env){
  const q=new URL(request.url).searchParams,cookie=cookieValue(request),state=q.get('state');
  if(!cookie||!secretValid(state))return setupPage('<p>授权会话已失效，请重新打开私密激活链接。</p>');
  const link=await env.DB.prepare('DELETE FROM sponsor_setup WHERE state=? AND cookie_hash=? AND expires_at>=? AND setup_hash=? RETURNING sealed_verifier,setup_hash').bind(state,await hash(cookie),now(),env.ANKUAN_SETUP_HASH).first();
  if(!link||!q.get('code')||q.get('error'))return setupPage('<p>未完成授权。请重新打开私密激活链接。</p>');
  let stage="校验授权会话";
  try{
    const verifier=await unseal(env,link.sealed_verifier);
    stage="换取账号凭据";
    const t=await exchange({grant_type:'authorization_code',code:q.get('code'),redirect_uri:CALLBACK,code_verifier:verifier});
    const expires=now()+Math.max(1,Number(t.expires_in)||3600)*1000;
    stage="保存项目授权";
    const result=await env.DB.prepare('INSERT INTO sponsor_account(id,sealed,expires_at,used_setup_hash) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET sealed=excluded.sealed, expires_at=excluded.expires_at, used_setup_hash=excluded.used_setup_hash,refresh_lease=NULL,lease_until=0 WHERE used_setup_hash<>excluded.used_setup_hash').bind(await seal(env,{access:t.access_token,refresh:t.refresh_token||null}),expires,link.setup_hash).run();
    if(!result.meta.changes)return setupPage('<p>该激活链接已经使用。</p>');
    const sessionNote=t.refresh_token?'':'<p>本次授权可用至 '+new Date(expires).toISOString().slice(0,16).replace('T',' ')+' UTC。之后需要新的私密激活链接续期。</p>';
    const page=setupPage('<p>项目账号已连接。访客可以在工坊生成作品。</p>'+sessionNote+'<a href="/#studio">返回创作工坊</a>');
    page.headers.set('Set-Cookie',BIND_COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0');return page;
  }catch(e){
    const code=/^token-(?:network|format|\d{3}-[a-z_]+)$/.test(e.message)?e.message:'internal';
    console.warn('sponsor-callback '+stage+' '+code);
    return setupPage('<p>'+stage+'失败（'+code+'）。请将此提示告知项目负责人。</p>');
  }
}
class NotReady extends Error {}
async function accountToken(env){
  const lock=random(16);
  for(let attempt=0;attempt<14;attempt++){
    const account=await env.DB.prepare('SELECT sealed,expires_at FROM sponsor_account WHERE id=1').first();
    if(!account)throw new NotReady();
    const creds=await unseal(env,account.sealed);
    if(account.expires_at>now()+30000)return creds.access;
    if(!creds.refresh)throw new NotReady();
    const won=await env.DB.prepare('UPDATE sponsor_account SET refresh_lease=?,lease_until=? WHERE id=1 AND expires_at=? AND lease_until<?').bind(lock,now()+30000,account.expires_at,now()).run();
    if(!won.meta.changes){await new Promise(r=>setTimeout(r,350));continue;}
    try{
      const fresh=await exchange({grant_type:'refresh_token',refresh_token:creds.refresh});
      const saved=await env.DB.prepare('UPDATE sponsor_account SET sealed=?,expires_at=?,refresh_lease=NULL,lease_until=0 WHERE id=1 AND refresh_lease=?').bind(await seal(env,{access:fresh.access_token,refresh:fresh.refresh_token||creds.refresh}),now()+Math.max(1,Number(fresh.expires_in)||3600)*1000,lock).run();
      if(!saved.meta.changes)continue;
      return fresh.access_token;
    }finally{await env.DB.prepare('UPDATE sponsor_account SET refresh_lease=NULL,lease_until=0 WHERE id=1 AND refresh_lease=?').bind(lock).run();}
  }
  throw Error('auth-busy');
}
function parseRpc(text,id){
  if(text.trimStart().startsWith('{'))return JSON.parse(text);
  for(const block of text.split(/\r?\n\r?\n/)){
    const data=block.split(/\r?\n/).filter(s=>s.startsWith('data:')).map(s=>s.slice(5).trimStart()).join('\n');
    if(data){const message=JSON.parse(data);if(message.id===id)return message;}
  }
  throw Error('mcp-response');
}
function safeMcpFailure(e){
  const msg=String(e.message||'');
  return /^[a-z][a-z0-9:_-]{0,110}$/i.test(msg)?msg:'request-error';
}
async function openMcp(env){
  let access;
  try{access=await accountToken(env)}catch(e){throw Error('account-'+safeMcpFailure(e))}
  let session='',version='2025-06-18',nextId=0;
  async function call(method,params,notify=false){
    const id=++nextId,headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream',Authorization:'Bearer '+access,'MCP-Protocol-Version':version};
    if(session)headers['MCP-Session-Id']=session;
    let res;try{res=await fetch(MCP,{method:'POST',redirect:'manual',headers,body:JSON.stringify({jsonrpc:'2.0',...(notify?{}:{id}),method,params}),signal:AbortSignal.timeout(20000)});}catch(e){throw Error('transport-'+method.replaceAll('/','-')+'-'+safeMcpFailure(e))}
    if(!res.ok)throw Error('mcp-'+method.replaceAll('/','-')+'-'+res.status);
    session=res.headers.get('mcp-session-id')||session;if(notify)return;
    const raw=await res.text();let rpc;
    try{rpc=parseRpc(raw,id)}catch{throw Error('decode-'+method.replaceAll('/','-')+'-'+res.status+'-'+(raw.startsWith('event:')?'event':'body'))}
    if(rpc.error||!rpc.result)throw Error('rpc-'+method.replaceAll('/','-')+'-'+(rpc.error?.code||'empty'));return rpc.result;
  }
  const info=await call('initialize',{protocolVersion:version,clientInfo:{name:'ankuan-sponsored',version:'1.0'},capabilities:{}});
  version=info.protocolVersion;await call('notifications/initialized',{},true);
  return async(name,args)=>{
    const reply=await call('tools/call',{name,arguments:args});
    if(reply.isError){
      let err=reply.structuredContent;
      if(!err){try{err=JSON.parse(reply.content?.[0]?.text||'{}')}catch{}}
      const code=String(err?.error?.code||err?.code||'failed').replace(/[^a-z0-9_-]/gi,'').slice(0,45);
      throw Error('tool-'+name+'-'+code);
    }
    return reply.structuredContent||JSON.parse(reply.content.find(x=>x.type==='text').text);
  };
}
function publicJob(j){
  return {state:j.status,progress:j.progress??null,retryAfter:10};
}
const selectJob=(env,k)=>env.DB.prepare('SELECT key,image_hash,status,points,task_id,progress,updated_at FROM sponsored_job WHERE key=?').bind(k).first();
async function createJob(env,{id,image}){
  if(!secretValid(id)||typeof image!=='string'||image.length<32||image.length>2500000||!/^\/9j\/[a-zA-Z0-9+/=]+$/.test(image))return error('图片无效，请重新选择。');
  const key=await hash(id),imageHash=await hash(image);
  const previous=await selectJob(env,key);
  if(previous)return previous.image_hash===imageHash?json(publicJob(previous)):error('该任务编号已用于其他作品。',409);
  if(!(await env.DB.prepare('SELECT id FROM sponsor_account WHERE id=1').first()))return error('在线生成尚未启用，可先预览本地浮雕。',503);
  const used=await env.DB.prepare('SELECT COALESCE(SUM(points),0) AS n FROM sponsored_job').first();
  if(used.n>=LIMIT)return error('本场生成名额已用完，可继续本地创作。',429);
  const claim=await env.DB.prepare("INSERT OR IGNORE INTO sponsored_job(key,image_hash,status,points,updated_at) VALUES(?,?,'preparing',0,?)").bind(key,imageHash,now()).run();
  if(!claim.meta.changes){const j=await selectJob(env,key);return j.image_hash===imageHash?json(publicJob(j)):error('该任务编号已使用。',409);}
  let reserved=false;
  try{
    const tool=await openMcp(env);
    const input=await tool('upload_input',{image_base64:image,mime_type:'image/jpeg'});
    const q=await tool('quote_generation',{prompt:'单件点心造型，保留参考图的轮廓与凸起，底面平整。作品编号 AK'+key.slice(0,20),file_tokens:[input.file_token],version:'v3.0',model_type:'high_quality',generation_type:'model_only'});
    if(!q.can_submit||!q.quote_id||!Number.isSafeInteger(q.estimated_points)||q.estimated_points<=0||Date.parse(q.expires_at)<=now())throw Error('quote');
    // One serialized SQLite statement reserves quoted points. In-flight and ambiguous submissions count toward the same cap.
    const updated=await env.DB.prepare("UPDATE sponsored_job SET status='submitting',points=?,updated_at=? WHERE key=? AND status='preparing' AND ?+(SELECT COALESCE(SUM(points),0) FROM sponsored_job)<=?").bind(q.estimated_points,now(),key,q.estimated_points,LIMIT).run();
    if(!updated.meta.changes){
      await env.DB.prepare("UPDATE sponsored_job SET status='full',updated_at=? WHERE key=? AND status='preparing'").bind(now(),key).run();
      return error('本场剩余名额不足，可继续本地创作。',429);
    }
    reserved=true;
    const task=await tool('create_generation',{quote_id:q.quote_id,confirmed:true});
    if(!task.task_id)throw Error('missing-task');
    await env.DB.prepare("UPDATE sponsored_job SET status='working',task_id=?,updated_at=? WHERE key=? AND status IN ('submitting','uncertain')").bind(task.task_id,now(),key).run();
    return json({state:'working',retryAfter:Math.max(3,task.next_poll_after||10)});
  }catch{
    await env.DB.prepare('UPDATE sponsored_job SET status=?,updated_at=? WHERE key=? AND task_id IS NULL').bind(reserved?'uncertain':'failed',now(),key).run();
    return json({state:reserved?'uncertain':'failed',retryAfter:15});
  }
}
async function findOriginal(tool,key){
  const list=await tool('list_tasks',{limit:50}),items=list.tasks||list.items||[];
  return items.find(task=>task.task_type==='model3d'&&task.summary?.includes('AK'+key.slice(0,20)))?.task_id;
}
async function jobStatus(env,j){
  if(j.status==='preparing'&&j.updated_at<now()-120000){
    await env.DB.prepare("UPDATE sponsored_job SET status='failed' WHERE key=? AND status='preparing'").bind(j.key).run();
    return json({state:'failed'});
  }
  if(j.status==='submitting'&&j.updated_at<now()-120000)j.status='uncertain';
  if(j.status!=='working'&&j.status!=='uncertain')return json(publicJob(j));
  const tool=await openMcp(env);
  if(j.status==='uncertain'){
    const taskId=await findOriginal(tool,j.key);
    if(!taskId)return json({state:'uncertain',retryAfter:20});
    await env.DB.prepare("UPDATE sponsored_job SET task_id=?,status='working',updated_at=? WHERE key=? AND task_id IS NULL").bind(taskId,now(),j.key).run();j.task_id=taskId;
  }
  const t=await tool('get_task',{task_id:j.task_id}),state=t.status==='succeeded'?'ready':['failed','canceled','cancelled','expired'].includes(t.status)?'failed':'working';
  await env.DB.prepare("UPDATE sponsored_job SET status=?, progress=?,updated_at=? WHERE key=? AND status IN ('working','submitting','uncertain')").bind(state,Number.isFinite(t.progress)?t.progress:null,now(),j.key).run();
  return json({state,progress:t.progress??null,retryAfter:Math.min(60,Math.max(3,Number(t.next_poll_after)||10))});
}
async function jobModel(env,j){
  if(j.status!=='ready'||!j.task_id)return error('作品尚未生成。',409);
  const tool=await openMcp(env),out=await tool('get_task_outputs',{task_id:j.task_id});
  const model=out.assets?.find(a=>String(a.format).toLowerCase()==='glb'||String(a.name).toLowerCase().endsWith('.glb'));
  if(!model?.url)return error('模型尚未就绪，请稍后重试。',503);
  const url=new URL(model.url);if(url.protocol!=='https:'||url.username||url.password)return error('模型地址无效。',502);
  const binary=await fetch(url.href,{redirect:'manual'});if(!binary.ok)return error('模型文件暂时不可用。',502);
  return new Response(binary.body,{headers:{...noStore,'Content-Type':'model/gltf-binary'}});
}
async function boundedText(request,max){
  if(Number(request.headers.get('content-length'))>max||!request.body)return null;
  const reader=request.body.getReader(),decoder=new TextDecoder();let size=0,text='';
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;
    if(size>max){await reader.cancel();return null;}text+=decoder.decode(value,{stream:true});}
    return text+decoder.decode();
  }finally{reader.releaseLock();}
}
async function route(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/sponsor-setup'&&request.method==='GET')return bootstrapPage();
  if(path==='/hi3d-callback'&&request.method==='GET')return setupCallback(request,env);
  if(path==='/sponsor-setup/start'||path==='/sponsor-setup/check'||path.startsWith('/api/generation/')){
    if(request.method!=='POST')return error('POST required',405);
    if(request.headers.get('origin')!==SITE)return error('Unknown origin',403);
    if(!env?.DB)return error('项目生成服务尚未启用。',503);
    if(path==='/sponsor-setup/check')return checkService(request,env);
    if(path==='/sponsor-setup/start')return setupStart(request,env);
    const text=await boundedText(request,2600000);if(text===null)return error('图片过大。',413);
    let data;try{data=JSON.parse(text)}catch{return error('请求无效。');}
    if(path==='/api/generation/create')return createJob(env,data);
    if(path==='/api/generation/status'||path==='/api/generation/model'){
      if(!secretValid(data.id))return error('未找到这个任务。',404);
      const j=await selectJob(env,await hash(data.id));if(!j)return error('未找到这个任务。',404);
      return path.endsWith('/status')?jobStatus(env,j):jobModel(env,j);
    }
    return error('Not found',404);
  }
  if(!['GET','HEAD'].includes(request.method))return error('Method not allowed',405);
  const key=path==='/'?'/index.html':path,asset=Object.hasOwn(siteFiles,key)?siteFiles[key]:null;
  if(!asset)return error('Not found',404);
  const [type,data]=asset;
  return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(data),c=>c.charCodeAt(0)),{headers:{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':key==='/index.html'?'no-cache':'public, max-age=3600'}});
}
export default {async fetch(request,env){try{return await route(request,env);}catch(e){return error(e instanceof NotReady?'在线生成尚未启用，可先预览本地浮雕。':'服务暂时不可用，请稍后查看原任务。',503);}}};
