# Damacana Akvaryum

[Türkçe](#türkçe) · [English](#english)

![Damacana Akvaryum balığı / Aquarium fish](baliklar/04-palyaco-baligi.png)

## Türkçe

Damacana Akvaryum, **TikTok LIVE yayınları için etkileşimli bir akvaryum oyunu**. İzleyicilerin yorum ve beğenileri akvaryuma balık ekler. Balıklar puan toplar, 15 farklı türe dönüşür ve yayıncı panelden deneme efektlerini çalıştırabilir. Arayüz Türkçedir.

### Deneme modunu aç

1. [Releases](https://github.com/tursunuz/damacana-akvaryum/releases/latest) bölümünden Windows x64 ZIP’ini indir ve çıkar.
2. `baslat.cmd` dosyasını çalıştır. Paneldeki **Test** bölümünü kullanarak örnek izleyiciler ve animasyonlar ekle.
3. TikTok LIVE Studio veya OBS’e **1080 × 1920** tarayıcı kaynağı olarak `http://127.0.0.1:8787/yayin#tiktok.studio` adresini ekle. Yönetim paneli `http://127.0.0.1:8787/admin` adresindedir.

### Canlı yayına bağlan

Node.js 24 ve npm kuruluysa proje klasöründen `npm --prefix oyun install` komutunu çalıştır. Panelin **Bağlantı** bölümünde aktif yayının kullanıcı adını gir. Entegrasyon [resmî olmayan TikTok LIVE bağlayıcısını](https://github.com/zerodytrash/TikTok-Live-Connector) kullanır. Canlı hediye listesi sağlayıcının ve bölgenin desteğine bağlıdır. Gerekirse Euler Stream anahtarını yalnızca sunucunun `EULER_API_KEY` ortam değişkeninde tanımla.

Kaynak koddan paneli açmak için `node oyun/server.mjs`, testler için `node --test oyun/test/*.test.mjs` çalıştır. Bu sürümle gerçek bir TikTok yayını bağlantısı doğrulanmadı.

## English

Damacana Akvaryum is an **interactive aquarium game for TikTok LIVE**. Comments and likes bring viewer fish into the tank. Fish collect points and evolve through 15 species. Streamers can preview effects from a separate control panel. The interface is in Turkish.

### Try demo mode

1. Download and extract the Windows x64 ZIP from [Releases](https://github.com/tursunuz/damacana-akvaryum/releases/latest).
2. Run `baslat.cmd`. In the control panel, open **Test** to add sample viewers and play effects.
3. Add `http://127.0.0.1:8787/yayin#tiktok.studio` as a **1080 × 1920** browser source in TikTok LIVE Studio or OBS. Open the control panel at `http://127.0.0.1:8787/admin`.

### Connect a live stream

With Node.js 24 and npm installed, run `npm --prefix oyun install` from the project folder. Enter the active broadcaster’s handle in the panel’s **Bağlantı** (Connection) tab. The integration uses an [unofficial TikTok LIVE connector](https://github.com/zerodytrash/TikTok-Live-Connector). The live gift catalog depends on provider and regional availability. If an Euler Stream key is required, set it in the server’s `EULER_API_KEY` environment variable.

From source, run `node oyun/server.mjs` to start the app and `node --test oyun/test/*.test.mjs` for automated checks. A connection to a live TikTok broadcast was not verified for this release.
