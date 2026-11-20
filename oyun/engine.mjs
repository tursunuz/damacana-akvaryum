import { randomUUID } from 'node:crypto';
import {effectForGift} from './gifts.mjs';
import {safeChat,safeName} from './chat-filter.mjs';
export const species=['Lepistes','Neon Tetra','Japon Balığı','Palyaço Balığı','Cerrah Balığı','Melek Balığı','Balon Balığı','Denizatı','Aslan Balığı','Deniz Kaplumbağası','Ahtapot','Vatoz','Köpekbalığı','Balina','Deniz Ejderi'];
export const thresholds=[0,10,25,50,80,120,175,250,350,500,700,1000,1500,2200,3000];
export const effects=['food','hearts','disco','treasure','shark','whale'];
export const defaults={title:'DAMACANA AKVARYUM',autoGrow:false,danceEnabled:true,danceSpeed:110,likePoints:1,showChat:true,predation:true,huntCooldown:20,growth:1,commentPoints:3,cooldown:5,maxFish:60,joinWord:'',showNames:true,showBoard:true,autoCamera:true,swimSpeed:70,fishSize:100,nameSize:100,areaTop:25,areaBottom:78,effectIntensity:65,sound:false,volume:30,giftMap:{}};
export function clean(v,n=40){return String(v??'').replace(/[\p{Cc}\p{Cf}]/gu,'').trim().slice(0,n);}
export function level(points){let i=14;while(i>0&&points<thresholds[i])i--;return i;}
export function normalizeUser(e){const u=e.user||e;const key=clean(u.uniqueId||u.displayId||u.userId||u.id||e.uniqueId,80);return {key,name:safeName(clean(u.nickname||u.displayId||u.uniqueId||e.nickname||key,22)),avatar:avatar(u.profilePictureUrl||u.avatarThumb?.urlList?.[0]||e.profilePictureUrl)};}
function avatar(v){try{const u=new URL(v);return u.protocol==='https:'&&/(^|\.)(tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|byteoversea\.com)$/.test(u.hostname)?u.href:'';}catch{return '';}}
export class Aquarium {
 constructor(saved={}){this.settings={...defaults,...saved.settings};if(saved.rulesVersion!==2)this.settings.autoGrow=false;this.fish=new Map((saved.fish||[]).map(f=>[f.key,{...f,name:safeName(f.name),points:Math.max(0,Number(f.points)||0),lastPointAt:0,x:150+Math.random()*780,y:600+Math.random()*650,dir:Math.random()>.5?1:-1,protectedUntil:Date.now()+15000,respawnAt:0}]));this.blocked=new Set(saved.blocked||[]);this.messages=[];this.gifts=saved.gifts||[];this.likes=0;this.status={state:'offline',message:'TikTok bağlı değil',username:''};this.recentIds=new Set();this.events=[];this.paused=false;this.dance=null;this.danceRound=0;}
 event(type,data={}){const e={id:randomUUID(),type,at:Date.now(),...data};this.events.push(e);this.events=this.events.slice(-30);return e;}
 log(kind,name,text){this.messages.unshift({id:randomUUID(),at:Date.now(),kind,name:clean(name,22),text:clean(text,300)});this.messages=this.messages.slice(0,100);}
 ingest(kind,e,{demo=false,now=Date.now()}={}){
  const id=clean(e.common?.msgId||e.msgId||'',100);if(id&&this.recentIds.has(id))return;if(id){this.recentIds.add(id);if(this.recentIds.size>5000)this.recentIds.delete(this.recentIds.values().next().value);}
  const user=normalizeUser(e);if(!user.key||this.blocked.has(user.key))return;
  if(kind==='gift'){
   if(Number(e.gift?.type??e.giftType)===1&&!e.repeatEnd)return;
   const giftId=String(e.giftId??''),known=this.gifts.find(g=>g.id===giftId),fx=this.settings.giftMap[giftId]??known?.effect??effectForGift({name:e.gift?.name||e.giftName,coins:e.gift?.diamondCount||e.diamondCount});
   this.log(demo?'demo':'gift',user.name,`[ID ${giftId}] ${e.gift?.name||e.giftName||'Hediye'} × ${Math.max(1,Number(e.repeatCount)||1)}`);
   if(fx&&effects.includes(fx))this.event('effect',{effect:fx,startAt:now+4000});return;
  }
  if(kind==='like'){
   const count=Math.min(1000,Math.max(1,Math.floor(Number(e.likeCount??e.count)||1)));this.likes+=count;if(this.paused)return;
   let f=this.fish.get(user.key);if(!f){if(this.fish.size>=this.settings.maxFish)return;f={...user,id:randomUUID(),points:0,joined:now,lastSeen:now,lastPointAt:0,demo,x:150+Math.random()*780,y:600+Math.random()*650,dir:Math.random()>.5?1:-1,protectedUntil:now+15000,respawnAt:0};this.fish.set(user.key,f);this.event('join',{fishId:f.id});}
   f.lastSeen=now;f.name=user.name;if(user.avatar)f.avatar=user.avatar;if(!(f.respawnAt>now))this.addPoints(f,count*this.settings.likePoints);return;
  }
  if(kind!=='chat')return;
  const text=clean(e.comment,300);if(!text)return;
  this.log(demo?'demo':'chat',user.name,text);
  if(this.paused)return;
  let f=this.fish.get(user.key);
  if(!f){
   if(this.fish.size>=this.settings.maxFish)return;
   if(this.settings.joinWord&&!text.toLocaleLowerCase('tr').includes(this.settings.joinWord.toLocaleLowerCase('tr')))return;
   f={...user,id:randomUUID(),points:0,joined:now,lastSeen:now,lastPointAt:0,demo,x:150+Math.random()*780,y:600+Math.random()*650,dir:Math.random()>.5?1:-1,protectedUntil:now+15000,respawnAt:0};this.fish.set(user.key,f);this.event('join',{fishId:f.id});
  }
  f.lastSeen=now;f.name=user.name||f.name;if(user.avatar)f.avatar=user.avatar;
  if(f.respawnAt>now)return;
  const bubble=safeChat(text);if(this.settings.showChat&&bubble&&now-(f.lastBubbleAt||0)>=4000){this.event("chatBubble",{fishId:f.id,text:bubble});f.lastBubbleAt=now;}
  if(now-f.lastPointAt>=this.settings.cooldown*1000){
   const command=text.toLocaleLowerCase('tr').replace(/[!.,?]/g,'').trim();
   this.addPoints(f,this.settings.commentPoints+(command==='yem'?5:0));f.lastPointAt=now;
   if(['yem','avlan','ye','kaç','kac','hızlan','hizlan'].includes(command)){
    const action=command==='ye'?'avlan':command==='kac'?'kaç':command==='hizlan'?'hızlan':command;
    if(action==='avlan'&&f.points>100)f.huntUntil=now+15000;
    if(action==='kaç')f.protectedUntil=Math.max(f.protectedUntil||0,now+8000);
    if(action==='hızlan'||action==='kaç')f.fastUntil=now+8000;
    this.event('command',{fishId:f.id,action});
   }
  }
 }
 addPoints(f,n){const old=level(f.points);f.points=Math.min(1000000,Math.max(0,f.points+n));const next=level(f.points);if(next>old)this.event('evolve',{fishId:f.id,name:f.name,level:next,big:next>=8});}
 ambientFish(now=Date.now()){const count=Math.min(10,this.fish.size);return Array.from({length:10-count},(_,j)=>{const i=j+count,l=[0,2,3,4,6,7,8,9,10,11][i];return {id:'ambient-'+i,bot:true,name:'',avatar:'',points:0,level:l,joined:0,x:160+(i%5)*185+Math.sin(now/5000+i)*38,y:1920*this.settings.areaTop/100+180+Math.floor(i/5)*340+Math.cos(now/6000+i)*55,dir:Math.sin(now/8000+i)>=0?1:-1,respawnAt:0,protectedUntil:0,fastUntil:0};});}
 startDance(now=Date.now()){const ids=[...this.fish.values()].filter(f=>!(f.respawnAt>now)).map(f=>f.id).concat(this.ambientFish(now).map(f=>f.id));if(!ids.length)return false;this.dance={startAt:now,duration:40000,ids,mode:this.danceRound++%2===0?"line":"ring"};return true;}
 tick(now=Date.now()){
  if(this.paused)return;
  if(!this.settings.danceEnabled)this.dance=null;else if(!this.dance||now>=this.dance.startAt+this.dance.duration)this.startDance(now);
  if(this.dance)this.dance.ids=[...this.fish.values()].filter(f=>!(f.respawnAt>now)).map(f=>f.id).concat(this.ambientFish(now).map(f=>f.id));
  const alive=[...this.fish.values()].filter(f=>!(f.respawnAt>now));
  for(const f of alive){
   if(f.respawnAt){f.respawnAt=0;f.protectedUntil=now+15000;}
   if(this.settings.autoGrow&&now-f.lastSeen<120000)this.addPoints(f,this.settings.growth);
   let speed=(22+this.settings.swimSpeed*.55)*(f.fastUntil>now?1.8:1);
   if(this.settings.predation&&f.points>100&&f.huntUntil>now){const prey=alive.filter(p=>this.canEat(f,p,now)).sort((a,b)=>Math.hypot(f.x-a.x,f.y-a.y)-Math.hypot(f.x-b.x,f.y-b.y))[0];if(prey){const d=Math.hypot(prey.x-f.x,prey.y-f.y)||1;f.dir=prey.x>=f.x?1:-1;f.x+=(prey.x-f.x)/d*speed;f.y+=(prey.y-f.y)/d*speed;}else f.x+=speed*f.dir;}
   else f.x+=speed*f.dir;
   const r=55+level(f.points)*7;f.x=Math.max(r,Math.min(1080-r,f.x));if(f.x>=1080-r)f.dir=-1;if(f.x<=r)f.dir=1;
   f.y=Math.max(1920*this.settings.areaTop/100+r,Math.min(1920*this.settings.areaBottom/100-r,f.y+Math.sin(now/3000+f.joined)*4));
  }
  if(this.settings.predation)for(const hunter of [...alive].sort((a,b)=>b.points-a.points))for(const prey of alive){if(this.canEat(hunter,prey,now)&&Math.hypot(hunter.x-prey.x,hunter.y-prey.y)<55+level(hunter.points)*5){this.eat(hunter,prey,now);break;}}
 }
 canEat(hunter,prey,now){return !(this.dance&&now<this.dance.startAt+this.dance.duration-6000)&&hunter!==prey&&hunter.points>100&&level(hunter.points)>level(prey.points)&&!(hunter.respawnAt>now)&&!(prey.respawnAt>now)&&!(prey.protectedUntil>now)&&!(hunter.protectedUntil>now)&&!(hunter.nextHuntAt>now);}
 eat(hunter,prey,now=Date.now()){
  if(this.paused||!this.settings.predation||!this.canEat(hunter,prey,now))return false;
  hunter.nextHuntAt=now+this.settings.huntCooldown*1000;prey.points=0;prey.respawnAt=now+5000;prey.lastPointAt=now;prey.fastUntil=0;prey.huntUntil=0;prey.x=150+Math.random()*780;prey.y=600+Math.random()*650;
  this.event('eat',{hunterId:hunter.id,preyId:prey.id,hunterName:hunter.name,preyName:prey.name});this.log('game',hunter.name,`${prey.name} adlı kişinin balığını yedi. Level 1'den yeniden başlayacak.`);return true;
 }
 updateSettings(s){const n={...this.settings};for(const k of ['showNames','showBoard','autoCamera','autoGrow','sound','predation','showChat','danceEnabled'])if(typeof s[k]==='boolean')n[k]=s[k];for(const [k,min,max] of [['danceSpeed',50,180],['likePoints',0,10],['huntCooldown',5,120],['growth',0,20],['commentPoints',0,100],['cooldown',1,60],['maxFish',1,100],['swimSpeed',10,160],['fishSize',50,160],['nameSize',60,140],['areaTop',20,45],['areaBottom',60,85],['effectIntensity',10,100],['volume',0,100]])if(k in s&&Number.isFinite(Number(s[k])))n[k]=Math.min(max,Math.max(min,Number(s[k])));if('title'in s)n.title=clean(s.title,35)||defaults.title;if('joinWord'in s)n.joinWord=clean(s.joinWord,30);if(s.giftMap&&typeof s.giftMap==='object'){n.giftMap={};for(const [id,fx]of Object.entries(s.giftMap).slice(0,2000))if(/^\d{1,12}$/.test(id)&&(effects.includes(fx)||fx==='off'))n.giftMap[id]=fx;}this.settings=n;}
 snapshot(admin=false){const fish=[...this.fish.values()].map(f=>({id:f.id,name:f.name,avatar:f.avatar,points:f.points,level:level(f.points),joined:f.joined,x:f.x,y:f.y,dir:f.dir,respawnAt:f.respawnAt||0,protectedUntil:f.protectedUntil||0,fastUntil:f.fastUntil||0,...admin?{key:f.key,demo:f.demo,lastSeen:f.lastSeen}:{}}));return {settings:this.settings,dance:this.dance,fish,bots:this.ambientFish(),likes:this.likes,paused:this.paused,events:this.events,now:Date.now(),...admin?{status:this.status,messages:this.messages,blocked:[...this.blocked]}:{}};}
 save(){return {rulesVersion:2,gifts:this.gifts,settings:this.settings,fish:[...this.fish.values()],blocked:[...this.blocked]};}
}



