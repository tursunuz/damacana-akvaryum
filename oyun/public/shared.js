export function shortNick(value){const first=String(value||'İzleyici').trim().replace(/^@/,'').split(/[\s._-]+/u)[0]||'İzleyici';return Array.from(first).slice(0,10).join('');}
export function dancePose(dance,id,now,top=480,bottom=1497,speed=110){
 if(!dance)return null;const index=dance.ids.indexOf(id),t=(now-dance.startAt)/1000,duration=dance.duration/1000;if(index<0||t<0||t>=duration)return null;
 const n=dance.ids.length,cols=Math.min(6,n),rows=Math.ceil(n/cols),row=Math.floor(index/cols),col=index%cols;
 const beat=t*speed/100*8,blend=Math.min(1,t/3,(duration-t)/5),hop=Math.abs(Math.sin(beat))*15;
 const rowHeight=(bottom-top-100)/Math.max(1,rows),y=top+65+rowHeight*(row+.5);
 if(dance.mode==='ring'){
  const group=Math.floor(index/12),count=Math.min(12,n-group*12),j=index%12,groups=Math.ceil(n/12),height=(bottom-top-80)/groups,angle=j/count*Math.PI*2+t*.3;
  return {x:540+Math.cos(angle)*Math.min(350,90+count*24),y:top+40+height*(group+.5)+Math.sin(angle)*Math.min(105,height*.28)-hop,blend,rotation:Math.sin(beat)*.14,maxW:Math.min(150,1800/count),maxH:Math.min(140,height*.65),group,linked:t>3&&t<duration-6};
 }
 return {x:540+(col-(Math.min(cols,n-row*cols)-1)/2)*150+Math.sin(beat*.5)*22,y:y+Math.sin(col*.6+beat*.5)*12-hop,blend,rotation:Math.sin(beat+col*.12)*.15,maxW:130,maxH:Math.min(145,rowHeight*.75),group:row,linked:t>3&&t<duration-6};
}
