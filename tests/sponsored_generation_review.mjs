// Patched fetch never reaches Hi3D. SQLite executes the same migration, reservation and idempotency SQL as production.
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import worker from '../hi3d-worker.js';
const site='https://ankuan-studio-visual.qbj26qz7cw.chatgpt.site';
const ticket=randomBytes(32).toString('hex'),digest=s=>createHash('sha256').update(s).digest('hex');
const db=new DatabaseSync(':memory:');db.exec(await readFile(new URL('../drizzle/0000_sponsor.sql',import.meta.url),'utf8'));
const binding={prepare(sql){
  return {bind(...values){return {first:async()=>db.prepare(sql).get(...values),run:async()=>({meta:{changes:db.prepare(sql).run(...values).changes}})};},
    first:async()=>db.prepare(sql).get(),run:async()=>({meta:{changes:db.prepare(sql).run().changes}})};
},async batch(stmts){db.exec('BEGIN');try{for(const query of stmts)await query.run();db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}};
const env={DB:binding,ANKUAN_TOKEN_KEY:randomBytes(32).toString('hex'),ANKUAN_SETUP_HASH:digest(ticket)};
const requests=[],tasks=new Map(),quotes=new Map();let loseReply=false,price=30;
globalThis.fetch=async(url,init)=>{
  if(String(url).includes('/api/auth/mcp/token')){
    const form=new URLSearchParams(init.body);requests.push(form.get('grant_type'));
    return Response.json({access_token:'synthetic_test_access',refresh_token:'synthetic_test_refresh',expires_in:3600});
  }
  if(url==='https://example.invalid/synthetic.glb')return new Response(new Uint8Array([0x67,0x6c,0x54,0x46]));
  assert.equal(url,'https://agent.hi3d.ai/mcp');const rpc=JSON.parse(init.body);
  if(rpc.method==='notifications/initialized')return new Response(null,{status:202});
  const respond=result=>Response.json({jsonrpc:'2.0',id:rpc.id,result});
  if(rpc.method==='initialize')return respond({protocolVersion:'2025-06-18'});
  const {name,arguments:args}=rpc.params;requests.push(name);
  const value=(body)=>respond({structuredContent:body});
  if(name==='upload_input')return value({file_token:'file-test'});
  if(name==='quote_generation'){const id=String(quotes.size);quotes.set(id,args.prompt);return value({can_submit:true,estimated_points:price,expires_at:new Date(Date.now()+60000).toISOString(),quote_id:id});}
  if(name==='create_generation'){
    assert.equal(args.confirmed,true);const task_id='t'+(tasks.size+1);tasks.set(task_id,{task_id,task_type:'model3d',summary:quotes.get(args.quote_id)});
    if(loseReply){loseReply=false;throw Error('transport');}return value({task_id});
  }
  if(name==='list_tasks')return value({tasks:[...tasks.values()]});
  if(name==='get_task')return value({status:'succeeded',progress:100});
  if(name==='get_task_outputs')return value({assets:[{name:'model.glb',format:'GLB',url:'https://example.invalid/synthetic.glb'}]});
  throw Error(name);
};
const req=(path,data,headers={})=>worker.fetch(new Request(site+path,{method:data?'POST':'GET',headers:{origin:site,...headers},...(data?{body:JSON.stringify(data)}:{})}),env);
const image='/9j/'+('A'.repeat(42)),newId=()=>randomBytes(32).toString('hex');
assert.equal((await req('/api/generation/create',{id:newId(),image})).status,503);
assert.equal((await req('/sponsor-setup/start',{ticket:'wrong'})).status,403);
const started=await req('/sponsor-setup/start',{ticket});assert.equal(started.status,200);
const cookie=started.headers.get('set-cookie').split(';')[0],authorize=new URL((await started.json()).url);
const callback='/hi3d-callback?code=code&state='+authorize.searchParams.get('state');
assert.match(await (await req(callback)).text(),/失效/);
assert.match(await (await req(callback,null,{Cookie:cookie})).text(),/已连接/);
assert.equal((await req('/sponsor-setup/start',{ticket})).status,409);
assert.match(await (await req(callback,null,{Cookie:cookie})).text(),/未完成/);
assert.ok(!db.prepare('SELECT sealed FROM sponsor_account').get().sealed.includes('synthetic_test'));
db.prepare('UPDATE sponsor_account SET expires_at=0').run();
const id=newId();const duplicate=await Promise.all([req('/api/generation/create',{id,image}),req('/api/generation/create',{id,image})]);
assert.equal(duplicate.every(x=>x.ok),true);assert.equal(tasks.size,1);assert.ok(requests.includes('refresh_token'));
assert.equal((await req('/api/generation/create',{id,image:image+'B'})).status,409);
assert.equal((await (await req('/api/generation/status',{id})).json()).state,'ready');
assert.equal((await req('/api/generation/model',{id})).headers.get('content-type'),'model/gltf-binary');
assert.equal((await req('/api/generation/model',{id:newId()})).status,404);
loseReply=true;const lost=newId();assert.equal((await (await req('/api/generation/create',{id:lost,image})).json()).state,'uncertain');
assert.equal((await (await req('/api/generation/status',{id:lost})).json()).state,'ready');
assert.equal(tasks.size,2);assert.equal((await req('/api/generation/create',{id:lost,image})).status,200);assert.equal(tasks.size,2);
await Promise.all(Array.from({length:12},()=>req('/api/generation/create',{id:newId(),image})));
assert.equal(tasks.size,10);assert.equal(db.prepare('SELECT SUM(points) used FROM sponsored_job').get().used,300);
assert.equal(requests.filter(x=>x==='create_generation').length,10);
assert.equal((await req('/api/generation/create',{id:newId(),image})).status,429);
assert.equal((await req('/api/generation/create',{id:newId(),image},{Origin:'https://other.example'})).status,403);
console.log('PASS owner-only binding, refresh, encrypted tokens, one paid call per artwork, ambiguous recovery, private result reads, atomic concurrent 300-point cap (simulated platform).');
