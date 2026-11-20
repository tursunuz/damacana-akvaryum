export function effectForGift(g){
 const name=String(g.name||'').toLowerCase(),coins=Number(g.coins)||0;
 if(/whale|balina|universe|lion|leon/.test(name))return 'whale';
 if(/shark|köpekbal/.test(name))return 'shark';
 if(/treasure|chest|hazine/.test(name))return 'treasure';
 if(/disco|dance|party|concert/.test(name))return 'disco';
 if(/rose|heart|love|kiss|çiçek|kalp|gül/.test(name))return 'hearts';
 return coins>=1000?'whale':coins>=100?'shark':coins>=30?'treasure':coins>=10?'disco':coins>=5?'hearts':'food';
}
export function normalizeGifts(input){const rows=Array.isArray(input)?input:input?.gifts||input?.data?.gifts||[];const seen=new Map();for(const g of rows){const id=String(g.id??g.giftId??''),name=String(g.name??g.giftName??'').trim().slice(0,80),coins=Number(g.diamond_count??g.diamondCount??g.coins??0);if(!/^\d{1,12}$/.test(id)||!name)continue;let image=g.image?.url_list?.[0]||g.image?.urlList?.[0]||g.icon?.urlList?.[0]||g.imageUrl||'';try{const u=new URL(image);if(u.protocol!=='https:'||!/(^|\.)(tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com)$/.test(u.hostname))image='';}catch{image='';}const row={id,name,coins:Math.max(0,coins||0),image};row.effect=effectForGift(row);seen.set(id,row);}return [...seen.values()].sort((a,b)=>a.coins-b.coins||a.name.localeCompare(b.name));}
