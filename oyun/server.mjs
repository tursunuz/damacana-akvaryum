import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {Aquarium,effects,clean} from './engine.mjs';
import {normalizeGifts} from './gifts.mjs';
import {connectionOptions,connectionError} from './connection-options.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export function createApp({dataDir=path.join(root,'data'),port=8787}={}){
 fs.mkdirSync(dataDir,{recursive:true});const statePath=path.join(dataDir,'state.json');let saved={};try{saved=JSON.parse(fs.readFileSync(statePath,'utf8'));}catch{}
 if(!saved.gifts?.length)saved.gifts=JSON.parse(fs.readFileSync(path.join(root,'gift-catalog.json'),'utf8')).gifts;
 const game=new Aquarium(saved),clients=new Set(),session=randomBytes(32).toString('hex');let connection=null,generation=0,retry=null,retries=0,stopped=true,liveUser='',closing=false;
 const persist=()=>{fs.writeFileSync(statePath+'.tmp',JSON.stringify(game.save()));fs.renameSync(statePath+'.tmp',statePath);};
 const publish=()=>{for(const c of clients){if(c.res.writableLength>2e6){c.res.destroy();continue;}c.res.write(`data: ${JSON.stringify(game.snapshot(c.admin))}\n\n`);}};
 const status=(state,message,username=liveUser)=>{game.status={state,message:clean(message,220),username};publish();};
 const disconnect=async()=>{stopped=true;generation++;clearTimeout(retry);retry=null;const old=connection;connection=null;if(old)await old.disconnect().catch(()=>{});status('offline','TikTok bağlı değil');};
 async function connect(username,isRetry=false){
  if(!isRetry){await disconnect();liveUser=username;retries=0;}
  stopped=false;const ticket=++generation;status('connecting',isRetry?'Bağlantı yeniden deneniyor…':'TikTok yayınına bağlanılıyor…');
  try{
   const {TikTokLiveConnection}=await import('tiktok-live-connector');if(ticket!==generation)return;
   const c=new TikTokLiveConnection(liveUser,connectionOptions(process.env.EULER_API_KEY));connection=c;
   for(const kind of ['chat','gift','like'])c.on(kind,e=>{if(ticket!==generation)return;game.ingest(kind,e);if(game.status.message!=='Canlı etkileşimler alınıyor.')game.status={state:'connected',message:'Canlı etkileşimler alınıyor.',username:liveUser};publish();});
   c.on('error',e=>{if(ticket===generation){game.log('system','Bağlantı',e?.message||'TikTok bağlantı hatası');publish();}});
   const schedule=()=>{if(ticket!==generation||stopped||closing)return;status('retrying','Bağlantı kesildi; yeniden denenecek.');clearTimeout(retry);retry=setTimeout(()=>{c.disconnect().catch(()=>{});connect(liveUser,true);},Math.min(60000,5000*2**Math.min(retries++,4)));};
   c.on('disconnected',schedule);c.on('streamEnd',()=>{if(ticket!==generation)return;stopped=true;clearTimeout(retry);status('offline','TikTok yayını sona erdi.');});
   await c.connect();if(c.availableGifts){const gifts=normalizeGifts(c.availableGifts);if(gifts.length){game.gifts=gifts;persist();}}if(ticket!==generation){await c.disconnect();return;}retries=0;status('connected','TikTok bağlantısı kuruldu; ilk etkileşim bekleniyor.');
  }catch(e){if(ticket!==generation)return;status('error',connectionError(e));game.log('system','Bağlantı',game.status.message);publish();if(!stopped&&retries<3){retry=setTimeout(()=>connect(liveUser,true),15000*++retries);}}
 }
 function json(res,obj,code=200){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
 const isAdmin=req=>(req.headers.cookie||'').split(';').some(c=>c.trim()===`aquarium_admin=${session}`);
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','SAMEORIGIN');
  // Only loopback and same-origin control requests. No public network listener.
  const allowed=new Set([`127.0.0.1:${server.address()?.port}`,`localhost:${server.address()?.port}`]);
  if(!allowed.has(req.headers.host)){res.writeHead(403);res.end('Yerel erişim gerekli');return;}
  const u=new URL(req.url,`http://${req.headers.host}`),p=u.pathname;
  if(p==='/api/events'){
   const admin=u.searchParams.get('role')==='admin';if(admin&&!isAdmin(req)){json(res,{error:'Panel oturumu gerekli'},401);return;}
   const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`){json(res,{error:'Erişim engellendi'},403);return;}
   if(clients.size>=30){json(res,{error:'Çok fazla bağlantı'},429);return;}
   res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(`data: ${JSON.stringify(game.snapshot(admin))}\n\n`);const c={res,admin};clients.add(c);req.on('close',()=>clients.delete(c));return;
  }
  if(req.method==='POST'&&p.startsWith('/api/')){
   if(!isAdmin(req)||req.headers.origin!==`http://${req.headers.host}`||!req.headers['content-type']?.startsWith('application/json')){json(res,{error:'Panelden işlem yapın'},403);return;}
   try{
    let body='';for await(const chunk of req){body+=chunk;if(body.length>32768)throw Error('İstek çok büyük');}const b=JSON.parse(body||'{}');
    switch(p){
     case '/api/connect': {const name=clean(b.username,80).replace(/^@/,'');if(!/^[a-zA-Z0-9_.]{2,40}$/.test(name))throw Error('Geçerli TikTok kullanıcı adını yazın.');connect(name);break;}
     case '/api/disconnect':await disconnect();break;
     case '/api/gifts-refresh':{if(!connection?.isConnected)throw Error('Canlı liste için önce TikTok yayınına bağlan. Deneme efektleri kullanılabilir.');let result;try{result=await connection.fetchAvailableGifts();}catch(e){throw Error(/business|premium|sign/i.test(e.message)?'Canlı hediye kataloğu sağlayıcıda ücretli. Canlı yorum bağlantısı etkilenmez.':'Canlı katalog alınamadı; mevcut liste korunuyor.');}const gifts=normalizeGifts(result);if(!gifts.length)throw Error('Yayından hediye listesi alınamadı; mevcut katalog korunuyor.');game.gifts=gifts;break;}
     case '/api/settings':game.updateSettings(b);break;
     case '/api/demo':if(game.status.state==='connected'||game.status.state==='connecting')throw Error('Deneme için önce TikTok bağlantısını kesin.');game.ingest('chat',{uniqueId:`demo:${clean(b.name||'Deneme',50)}`,nickname:b.name||'Deneme',comment:b.comment||'Merhaba'}, {demo:true});break;
     case '/api/dance':game.settings.danceEnabled=true;game.startDance();break;
     case '/api/effect':if(!effects.includes(b.effect))throw Error('Gösteri bulunamadı');game.event('effect',{effect:b.effect,startAt:Date.now()+1000});break;
     case '/api/fish':{const f=[...game.fish.values()].find(f=>f.id===b.id);if(!f)throw Error('Balık bulunamadı');if(b.action==='remove')game.fish.delete(f.key);else if(b.action==='block'){game.blocked.add(f.key);game.fish.delete(f.key);}else if(b.action==='grow')game.addPoints(f,Math.min(3000,Math.max(1,Number(b.points)||25)));break;}
     case '/api/unblock':game.blocked.delete(String(b.key));break;
     case '/api/pause':game.paused=!!b.paused;break;
     case '/api/clear-demo':for(const [k,f]of game.fish)if(f.demo)game.fish.delete(k);game.events=[];game.messages=game.messages.filter(m=>m.kind!=='demo');break;
     case '/api/reset':if(b.confirm!=='SIFIRLA')throw Error('Onay gerekli');game.fish.clear();game.messages=[];game.events=[];game.likes=0;break;
     default:json(res,{error:'İşlem bulunamadı'},404);return;
    }
    persist();publish();json(res,{ok:true});
   }catch(e){json(res,{error:clean(e.message,250)},400);}return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){json(res,{error:'Bulunamadı'},404);return;}
  if(p==='/api/gifts'){if(!isAdmin(req)){json(res,{error:'Panel oturumu gerekli'},401);return;}json(res,{gifts:game.gifts,live:!!connection?.isConnected});return;}
  if(p==='/api/health'){json(res,{ok:true});return;}
  let file;
  if(p==='/'||p==='/admin'){file=path.join(root,'public','admin.html');res.setHeader('Set-Cookie',`aquarium_admin=${session}; HttpOnly; SameSite=Strict; Path=/`);res.setHeader('Cache-Control','no-store');}
  else if(p==='/yayin')file=path.join(root,'public','screen.html');
  else if(p==='/assets/manifest.json')file=path.join(root,'..','varliklar.json');
  else if(/^\/assets\/baliklar\/\d{2}-[a-z-]+\.png$/.test(p))file=path.join(root,'..',p.slice(8));
  else if(p==='/assets/arkaplan.png')file=path.join(root,'..','arkaplan','damacana-1080x1920.png');
  else if(/^\/(admin|screen|shared)\.(js|css)$/.test(p))file=path.join(root,'public',p.slice(1));
  if(!file||!fs.existsSync(file)){json(res,{error:'Bulunamadı'},404);return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');if(req.method==='HEAD'){res.end();return;}fs.createReadStream(file).pipe(res);
 });
 const ticker=setInterval(()=>{game.tick();publish();},1000),saveTimer=setInterval(()=>{try{persist();}catch(e){console.error('Kayıt hatası:',e.message);}},10000);
 const heartbeat=setInterval(()=>{for(const c of clients)c.res.write(': ping\n\n');},15000);
 return {server,game,listen:()=>new Promise(resolve=>server.listen(port,'127.0.0.1',resolve)),close:async()=>{closing=true;clearInterval(ticker);clearInterval(saveTimer);clearInterval(heartbeat);await disconnect();persist();for(const c of clients)c.res.end();await new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=createApp({port:Number(process.env.PORT)||8787});app.server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Akvaryum zaten açık. Panel: http://127.0.0.1:8787/admin':e.message);process.exit(1);});await app.listen();console.log('Admin: http://127.0.0.1:8787/admin\nYayın: http://127.0.0.1:8787/yayin');for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await app.close();process.exit(0);});
}
