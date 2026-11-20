import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createApp} from '../server.mjs';
test('separate screen, protected controls, shared state and persisted settings',async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aquarium-test-'));const app=createApp({dataDir:dir,port:0});await app.listen();const url=`http://127.0.0.1:${app.server.address().port}`;try{
 const screen=await fetch(url+'/yayin');assert.equal(screen.status,200);assert.ok(!(await screen.text()).includes('connectForm'));
 const denied=await fetch(url+'/api/demo',{method:'POST',headers:{'Content-Type':'application/json',origin:url},body:'{}'});assert.equal(denied.status,403);
 const admin=await fetch(url+'/admin');const cookie=admin.headers.get('set-cookie').split(';')[0];assert.ok((await admin.text()).includes('connectForm'));
 const headers={'Content-Type':'application/json',origin:url,cookie};const post=(p,b)=>fetch(url+'/api/'+p,{method:'POST',headers,body:JSON.stringify(b)});
 assert.equal((await post('demo',{name:'Test',comment:'merhaba'})).status,200);assert.equal(app.game.fish.size,1);
 assert.equal((await fetch(url+'/api/settings',{method:'POST',headers:{...headers,origin:'http://evil.example'},body:'{}'})).status,403);
 assert.equal((await fetch(url+'/api/events?role=admin')).status,401);
 const ev=await fetch(url+'/api/events');const reader=ev.body.getReader();const raw=new TextDecoder().decode((await reader.read()).value);assert.ok(raw.includes('Test'));assert.ok(raw.includes('chatBubble')); assert.ok(!raw.includes('"messages"'));await reader.cancel();
 assert.equal((await fetch(url+'/assets/baliklar/01-lepistes.png')).status,200);assert.equal((await fetch(url+'/assets/arkaplan.png')).status,200);
 await post('settings',{title:'Kaydedildi'});assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'state.json'))).settings.title,'Kaydedildi');
 await post('clear-demo',{});assert.equal(app.game.fish.size,0);
 }finally{await app.close();fs.rmSync(dir,{recursive:true,force:true});}});

