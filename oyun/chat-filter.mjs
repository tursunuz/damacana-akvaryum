const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f\p{Cf}]/gu,'').toLocaleLowerCase('tr').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ö/g,'o').replace(/ü/g,'u').replace(/0/g,'o').replace(/[1!|]/g,'i').replace(/3/g,'e').replace(/4|@/g,'a').replace(/5|\$/g,'s').replace(/7/g,'t').replace(/(.)\1{2,}/g,'$1$1');
export function safeChat(value){
 const raw=String(value??'').replace(/[\p{Cc}\p{Cf}]/gu,'').trim();
 if(!raw||raw.length>140||/(?:https?:|www\.|@|(?:[a-z0-9-]+\.)+(?:com|net|org|tr|io|gg|me|xyz)\b)/i.test(raw))return '';
 const n=normalize(raw),compact=n.replace(/[^a-z]/g,''),tokens=n.split(/[^a-z]+/).filter(Boolean);
 const stems=['siktir','siker','sikey','sikim','sikis','siktig','amk','amina','aminak','amcik','orospu','orosp','yarrak','yarak','gotveren','pezevenk','pic kurusu','fuck','bitch','nigger','cunt'];
 if(stems.some(w=>compact.includes(w.replace(/ /g,'')))||tokens.some(w=>['aq','oc','pic','sik','ibne','pussy','dick'].includes(w))||['aq','oc','pic','sik','ibne'].includes(compact))return '';
 if(/(?:a[^a-z]*){0}m[^a-z]*[kq]\b/i.test(n)&&compact.length<6)return '';
 return raw.slice(0,70);
}
export function safeName(value){return safeChat(value)||'İzleyici';}
