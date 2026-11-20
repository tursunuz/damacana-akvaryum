export function connectionOptions(apiKey){return {processInitialData:false,enableExtendedGiftInfo:false,webClientOptions:{timeout:{request:15000}},wsClientOptions:{handshakeTimeout:15000},...(apiKey?{signApiKey:apiKey}:{})};}
export function connectionError(e){
 const message=String(e?.message||e||'Bilinmeyen bağlantı hatası');
 if(/business plan|premium|purchase one|permission from the signature provider/i.test(message))return 'Bağlantı sağlayıcısı bu isteği ücretli plana kapatmış. Yayın adıyla ilgili değil. Hazır hediye kataloğu kullanılmaya devam ediyor.';
 if(/isn.t online|offline|not live/i.test(message))return 'TikTok bu hesabı şu anda çevrimdışı bildiriyor. Yayını açıp kullanıcı adını kontrol edin; bağlantı yeniden denenecek.';
 if(/429|rate.?limit|too many/i.test(message))return 'TikTok bağlantı hizmetinin deneme sınırına ulaşıldı. Bir süre sonra yeniden deneyin.';
 return 'TikTok bağlantısı kurulamadı: '+message.slice(0,170);
}
