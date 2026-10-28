# AIREX — FIND AIREX LOGO (Bakı) · Development Prompt

## 0. Rol və tapşırıq

Sən təcrübəli frontend developersən. Sıfırdan, **yalnız HTML + CSS + vanilla JavaScript (ES modules)** ilə bir web axtarış oyunu yazacaqsan: istifadəçi şəhər xəritəsində gizlədilmiş **30 AIREX loqosunu** 2 dəqiqə ərzində tapmalıdır. Oyun böyük **toxunma ekranlı monitorda (kiosk)** açılacaq. Gələcəkdə layihə **Angular**-a köçürüləcək, ona görə kod buna uyğun qurulmalıdır (bax: bölmə 10).

Bu layihə **City Puzzle** layihəsi ilə eyni səviyyədədir və eyni kit-dən istifadə edir: rənglər, şrift, `--u` ölçü sistemi, header, düymələr, kiosk reset, offline rejim, `core/` modulları (`Timer`, `storage`, `assets`, `Emitter`, `sw-register`, `env`). Bu hissələr City Puzzle-dan **dəyişmədən** götürülə bilər. Dəyişən yalnız oyun mexanikası, ekranların məzmunu və assetlərdir.

Dizayn 4 ekrandan ibarətdir. Ekran görüntüləri əlavə olunub (`01`–`05`) + təmiz xəritə şəkli. Dizayn 1080×1920 (portret) ölçüsündə çəkilib, amma oyun **istənilən konteyner ölçüsünə dinamik uyğunlaşmalıdır** (bax: bölmə 4).

| Fayl | Ekran |
|---|---|
| `01 - OYUN QAYDASI.png` | Qaydalar |
| `02 - BAŞLA.png` | Start |
| `03 - OYUN - başlanğıc.png` | Oyun, 00:00, 00/30 |
| `04 - OYUN - gedişat.png` | Oyun, 01:07, 07/30 |
| `05 - NƏTİCƏ.png` | Nəticə |
| `Isometric_Cityscape_with_Iconic_Landmarks_1.png` | Təmiz xəritə (loqosuz), 3:4 |

---

## 0.1 Hədəf cihaz

- **Cihaz:** IQTouch markalı, yerdə dayanan şaquli (portret) totem-monitor (digital signage kiosk).
- **Oriyentasiya:** portret. Ekran nisbəti təxminən 9:16, ehtimal olunan həll 1080×1920 (modeldən dəqiqləşdiriləcək).
- **Əməliyyat sistemi:** Windows. Oyun brauzerdə (Chrome və ya Edge) kiosk rejimində tam ekran açılır.
- **Giriş:** toxunma (barmaq). Mouse və klaviatura yoxdur. Hover effektləri istifadə olunmamalıdır, bütün vəziyyətlər toxunuşla işləməlidir.
- **Ergonomika:** xəritə ekranın böyük hissəsini tutur (y: 493–1765). Yuxarı hissədəki loqolara çatmaq üçün istifadəçi əlini qaldırmalı olacaq, bu dizaynın qərarıdır. Header-də interaktiv element yoxdur.
- **Toxunma sahələri:** ən kiçik toxunma sahəsi təxminən 1.5 sm × 1.5 sm (≈ `90 * var(--u)`) olmalıdır. Loqolar vizual olaraq bundan kiçikdir, ona görə onların toxunma sahəsi görünən ikondan böyük olur (bax: 2.3).
- Monitorun nisbəti dəqiq 9:16 olmasa da, bölmə 4-dəki `--u` sistemi oyunu proporsiyanı pozmadan mərkəzdə saxlayır.

---

## 1. Oyun axını (state machine)

```
RULES ──[DAVAM ET]──▶ START ──[BAŞLA]──▶ GAME ──[02:00 bitdi  və ya  30/30]──▶ RESULT
  ▲                                                                              │
  └─────────────────────────────[YENİDƏN OYNA]───────────────────────────────────┘
```

| State | Ekran | Məzmun |
|---|---|---|
| `rules` | 01 | “FIND AIREX LOGO / OYUN QAYDALARI”, 3 bənd, “DAVAM ET” |
| `start` | 02 | “XƏRİTƏ” başlığı, xəritənin önizləməsi (3:4), “ƏN YAXŞI NƏTİCƏ: nn/30”, “BAŞLA” |
| `game` | 03–04 | Taymer (VAXT), sayğac (LOQOLARIN SAYI nn/30), interaktiv xəritə, ipucu mətni. Düymə yoxdur |
| `result` | 05 | “NƏTİCƏ”, “LOQOLARIN SAYI”, böyük nəticə nn/30, ən yaxşı nəticə, xəritə şəkli (4:3 kəsim), “YENİDƏN OYNA” |

- Oyun iki halda bitir: **vaxt 02:00-a çatanda** və ya **30 loqonun hamısı tapılanda**. Hər iki halda eyni RESULT ekranı açılır.
- “YENİDƏN OYNA” istifadəçini **rules** ekranına qaytarır (`config.restartTarget`: `'rules' | 'start'`, default `'rules'`).
- Hər yeni oyunda bütün state tam sıfırlanır: taymer, tapılmış loqolar, sayğac, animasiyalar.
- Ekranlar arası keçid animasiyasız, birbaşa olur.

---

## 2. Oyun mexanikası (GAME ekranı)

### 2.1 Başlanğıc
- Xəritədə **30 loqo** var. Onların yerləri **sabitdir**, hər oyunda eyni yerdə olur (random yoxdur). Koordinatlar konfiqdə saxlanılır (bax: 5.3).
- Başlanğıcda bütün loqolar **“gizli” vəziyyətdədir**: kiçik, açıq boz, binaların fasadlarına qarışmış (ekran 03).
- Sayğac `00/30`, taymer `00:00` göstərir. Taymer GAME ekranı açılan və xəritə render olunan anda başlayır.

### 2.2 Loqonun tapılması
1. İstifadəçi loqonun üzərinə toxunur → loqo **lime rəngə** (`--c-accent`) keçir və `.is-found` vəziyyətində qalır (ekran 04).
2. Sayğac 1 artır (`07/30`). Sayğac həmişə 2 rəqəmlə göstərilir (`00/30`, `07/30`, `30/30`).
3. Tapılmış loqo artıq interaktiv deyil. Ona təkrar toxunmaq sayğacı artırmır.
4. Boş yerə (loqo olmayan yerə) toxunuşun heç bir nəticəsi yoxdur: cərimə, səhv effekti, vaxt itkisi yoxdur.

### 2.3 Toxunuşun yoxlanması (hit-test)
- Xəritənin üstündə bir **SVG overlay** qatı var. Bütün toxunuşlar bu qatda bir listener ilə tutulur (`pointerup`, event delegation).
- Toxunma nöqtəsi (`clientX/clientY`) xəritənin koordinat sisteminə çevrilir (`getBoundingClientRect()` ilə, bax: 5.3).
- Hələ tapılmamış loqolar arasında **toxunma nöqtəsinə ən yaxın** olan tapılır. Əgər məsafə onun `hitRadius`-undan kiçikdirsə, həmin loqo tapılmış sayılır.
- `hitRadius` default olaraq ekranda ≈ `45 * var(--u)` radiusa (≈90 dizayn px diametr) uyğun gəlir, loqo üzrə konfiqdə dəyişdirilə bilər.
- Toxunma sahələri üst-üstə düşəndə yalnız ən yaxın loqo sayılır. Bir toxunuş heç vaxt iki loqonu tapmır.
- Sürətli çoxlu toxunuşda eyni loqo iki dəfə sayılmamalıdır (yoxlama `GameEngine`-də aparılır: `found` `Set`-i).

### 2.4 Vaxt
- Ümumi vaxt **2 dəqiqə** (`config.durationMs = 120000`).
- Taymer dizayna uyğun olaraq **yuxarı sayır**: `00:00` → `02:00` (`config.timerDirection: 'up' | 'down'`, default `'up'`; `'down'` olsa `02:00` → `00:00`).
- Vaxtı `performance.now()` ilə hesabla. `setInterval` sayğacı ilə toplamamalısan. Ekranı `requestAnimationFrame` ilə yenilə, amma yalnız saniyə dəyişəndə DOM-a yaz.
- Format: `mm:ss`. Rəqəmlər `tabular-nums` ilə.
- Vaxt bitəndə (`elapsed >= durationMs`): taymer dəqiq `02:00` göstərir və dayanır, xəritə dərhal bloklanır (yeni toxunuş qəbul olunmur), ≈500ms sonra RESULT ekranı açılır.
- 30/30 tapılanda: taymer dərhal dayanır, son loqonun animasiyası bitir, ≈500ms sonra RESULT ekranı açılır. Bu halda nəticə yenə `30/30`-dur, ekran eynidir.
- Səhifə arxa plana keçsə (`visibilitychange`), vaxt `performance.now()` əsasında hesablandığı üçün düzgün qalır. Kiosk-da bu hal praktik olaraq olmur.

### 2.5 Ən yaxşı nəticə
- Ən yaxşı nəticə xəritə üzrə `localStorage`-da saxlanılır, açar: `airex.findLogo.best.<mapId>`. Storage ayrıca modulda olmalıdır (Angular-da service ilə əvəz ediləcək), `try/catch` ilə qorunur.
- Saxlanılan dəyər: `{ score: number, timeMs: number, date: string }`.
- Müqayisə qaydası (`isBetter(a, b)`): daha çox loqo qalib gəlir. Loqo sayı bərabərdirsə (praktikada `30/30`), daha az vaxt qalib gəlir. Ekranda isə **yalnız `score`** göstərilir (`24/30`).
- Nəticə hər oyunun sonunda yoxlanılır və daha yaxşıdırsa yazılır.
- Rekord hələ yoxdursa `--/30` göstər.
- RESULT ekranında yeni rekord qırılıbsa, nəticənin altında lime rəngdə **“YENİ REKORD!”** yazısı çıxır və “ƏN YAXŞI NƏTİCƏ” yeni dəyərlə göstərilir. İlk oyunda rekord yoxdursa və `score > 0`-dırsa, bu da yeni rekord sayılır. `0/30` heç vaxt rekord kimi göstərilmir.

### 2.6 Qadağalar / kənar hallar
- Oyun bitdikdən sonra (vaxt və ya 30/30) xəritəyə toxunuşlar nəzərə alınmır (`isFinished` flag).
- Taymer dayanmadan RESULT-a keçid olmamalıdır.
- Tapılmış loqo və bitmiş oyun interaktiv deyil.
- GAME ekranında `idleResetMs` işləmir (oyun özü 2 dəqiqəyə bitir). Idle reset yalnız `rules`, `start`, `result` ekranlarında aktivdir.

---

## 3. Vizual dizayn

### 3.1 Rənglər (City Puzzle ilə eyni)

```css
:root {
  /* Təsdiqlənmiş rənglər */
  --c-accent:        #C7FF00; /* yaşıl: düymələr, tapılmış loqo, sayğac, vurğu */
  --c-bg:            #262A37; /* əsas fon */
  --c-text-muted:    #C3C6C8; /* "FIND AIREX LOGO", "VAXT", "LOQOLARIN SAYI", "ƏN YAXŞI NƏTİCƏ" */
  --c-text:          #FFFFFF; /* ağ */
  --c-error:         #FB7232; /* bu oyunda istifadə olunmur, kit-də qalır */

  /* Törəmə rənglər */
  --c-accent-ink:    var(--c-bg);        /* yaşıl düymə üzərindəki mətn */
  --c-divider:       rgb(195 198 200 / 0.2);
  --c-logo-hidden:   rgb(255 255 255 / 0.55); /* gizli loqo (dizaynda dəqiqləşdirilə bilər) */
}
```

Kodda heç bir rəng birbaşa (hex ilə) yazılmamalıdır, yalnız bu dəyişənlər istifadə olunur. Xəritədəki loqoların rəngi də CSS-dən idarə olunur (`.cp-logo { fill: var(--c-logo-hidden) }`, `.cp-logo.is-found { fill: var(--c-accent) }`).

### 3.2 Şrift
- **Inter** (400/500/600/700/800), **lokal `woff2` fayllar** ilə `@font-face` vasitəsilə (`assets/fonts/`). Google Fonts linki istifadə olunmamalıdır. `font-display: block`. Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Diqqət:** ekran 02–05-də “XƏRİTƏ” və “NƏTİCƏ” başlıqları fərqli (brend display) şriftlə görünür: `Ə` kiçik `ə` formasındadır. Bu şrift təsdiqlənənə qədər Inter 800 istifadə olunur. Başlıq şrifti ayrıca token ilə verilir ki, sonradan bir yerdən dəyişdirilsin: `--font-display`. (bax: bölmə 13)
- `<html lang="az">` mütləqdir.
- Böyük hərfli mətnləri HTML-də **artıq böyük hərflə** yaz (`XƏRİTƏ`, `NƏTİCƏ`, `YENİDƏN OYNA`, `ƏN YAXŞI NƏTİCƏ`). `text-transform` istifadə etmə.
- Rəqəmlər üçün `font-variant-numeric: tabular-nums;`.

### 3.3 Ölçülər (1080×1920 baza dizayn, px)

| Element | Dəyər |
|---|---|
| Yan padding | 64 |
| Header (logo sol, “FIND AIREX LOGO” sağ) | top 64, logo hündürlüyü ≈66, “FIND AIREX LOGO” ≈30, semibold, muted |
| Ekran başlığı (XƏRİTƏ, NƏTİCƏ) | ≈80, extra-bold, ağ, `--font-display`. Başlığın aşağısı ≈y 250 |
| Rules başlığı | “FIND AIREX LOGO” lime + “OYUN QAYDALARI” ağ, ≈80, extra-bold, 2 sətir |
| Başlıq altı divider | 1px, `--c-divider` (rules-da y≈420, digər ekranlarda y≈285) |
| Rules sətirləri | hündürlük ≈340, arasında 1px divider. Nömrə lime ≈40. Mətn ağ ≈44, medium. Sağda xətti ikon ≈80 (lupa, toxunuş, saniyəölçən) |
| Əsas düymə | eni tam (64 padding ilə), hündürlüyü 160, alt boşluq 64, fon lime, mətn ≈44 bold, radius 0 |
| **Start** şəkli | 765×1020 (3:4), mərkəzdə, top ≈385 |
| Start “ƏN YAXŞI NƏTİCƏ:” | ≈32, medium, muted, mərkəzdə. Dəyər (`24/30`) ≈52, bold, muted |
| **Game** info bloku | divider-dən ≈40 aşağı. Etiket (“VAXT”, “LOQOLARIN SAYI”) ≈22 muted. Dəyər ≈52 bold. Sol: VAXT ağ. Sağ (sağa düzlənmiş): sayğac lime |
| Game xəritəsi | tam kontent eni 952×1270 (3:4), top ≈493 |
| İpucu mətni | “İkonları toplamaq üçün toxun.” ≈30, ağ, sola düzlənmiş, xəritədən ≈24 aşağı |
| Xəritədəki loqo | ≈28–36 (loqo üzrə `size` konfiqdən), gizli: `--c-logo-hidden`, tapılmış: `--c-accent` |
| **Result** “LOQOLARIN SAYI” | ≈64, bold, ağ, mərkəzdə, top ≈360 |
| Result nəticəsi (`17/30`) | ≈230, extra-bold, lime, mərkəzdə |
| “YENİ REKORD!” | ≈36, bold, lime, nəticənin altında (yalnız rekord olanda; olmayanda yer tutmur) |
| Result “ƏN YAXŞI NƏTİCƏ:” | ≈32 muted, dəyər ≈52 bold muted |
| Result şəkli | 800×600 (4:3), mərkəzdə, top ≈952. Eyni xəritə şəkli `object-fit: cover; object-position: top` ilə kəsilir |

Game ekranında əsas düymə yoxdur, xəritə + ipucu düymənin yerini tutur.

---

## 4. Dinamik ölçülər (full container)

City Puzzle ilə eynidir.

- Kök element: `.cp-app { width:100%; height:100%; container-type:size; overflow:hidden; }`
- Bütün ölçülər 1080×1920 bazasına nisbətən bir vahidlə hesablanır:

```css
.cp-app {
  --u: min(calc(100cqw / 1080), calc(100cqh / 1920));
}
.cp-title  { font-size: calc(80 * var(--u)); }
.cp-button { height: calc(160 * var(--u)); }
.cp-map    { width: calc(952 * var(--u)); aspect-ratio: 3 / 4; }
```

- Konteyner nisbəti 9:16 deyilsə, səhnə (`.cp-stage`) mərkəzdə qalır, kənarlarda `--c-bg` fonu görünür (letterbox). `transform: scale()` istifadə etmə, ölçüləri yalnız `--u` ilə ver.
- Ekranın içi flex-column ilə qurulur, düymə həmişə aşağıya yapışıq qalır.
- **Loqolar SVG overlay-də xəritənin öz koordinat sistemində** yerləşir (bax: 5.3). Overlay xəritə ilə eyni ölçüdə olduğu üçün istənilən konteyner ölçüsündə loqolar avtomatik dəqiq yerində qalır, `ResizeObserver` ilə yenidən hesablamağa ehtiyac yoxdur.
- Hit-test hər toxunuşda `getBoundingClientRect()` ilə aparılır, ona görə ölçü dəyişikliyi onu pozmur.

---

## 5. Assetlər

### 5.1 Fayllar
```
assets/
  brand/airex-logo.svg        # header loqosu (işarə + yazı)
  brand/airex-mark.svg        # yalnız işarə (çiçək simvolu), xəritədəki loqolar üçün
  icons/rule-search.svg  rule-tap.svg  rule-timer.svg
  maps/baku/
    map.webp                  # təmiz xəritə (loqosuz), 3:4, min 1530×2040
    logos.js                  # 30 loqonun koordinatları (bax: 5.3)
```

### 5.2 Xəritə şəkli
- `map.webp` **loqosuz** olmalıdır (əlavə olunmuş `Isometric_Cityscape_with_Iconic_Landmarks_1.png` kimi). Loqolar şəklə “yandırılmır”, yalnız SVG overlay ilə çəkilir. Beləcə gizli və tapılmış vəziyyət eyni elementdir və rəngi CSS ilə dəyişir, şəkil və overlay heç vaxt “uyuşmazlıq” vermir.
- Eyni şəkil 3 yerdə istifadə olunur: start (3:4 tam), game (3:4 tam), result (4:3, yuxarıdan kəsim). Ayrıca önizləmə faylına ehtiyac yoxdur.

### 5.3 Loqoların koordinatları (`logos.js`)
- Koordinat sistemi: xəritənin **orijinal piksel ölçüsü** ilə eyni `viewBox`. Məsələn şəkil 1530×2040-dirsə, overlay `viewBox="0 0 1530 2040"`, `preserveAspectRatio="none"` (overlay və şəkil eyni nisbətdədir).
- Hər loqo:

```js
/** @typedef {{ id: string, x: number, y: number, size: number,
 *              rotate?: number, skewY?: number, hitRadius?: number }} LogoSpot */
export const BAKU_LOGOS = [
  { id: 'l01', x: 412, y: 318, size: 40, skewY: -26 },
  // … cəmi 30 dənə
];
```

  - `x`, `y`: loqonun mərkəzi (viewBox vahidi).
  - `size`: loqonun eni (viewBox vahidi).
  - `rotate`, `skewY`: izometrik fasada uyğun perspektiv (dərəcə). İzometrik binalarda fasad təxminən ±26–30° maillidir. Lazım deyilsə yazılmır.
  - `hitRadius`: istəyə bağlı. Yazılmayanda ekranda ≈45 dizayn px-ə uyğun dəyər hesablanır.
- Render: `airex-mark.svg` bir dəfə overlay-in `<defs>` hissəsinə `<symbol id="airex-mark">` kimi qoyulur, hər loqo `<use href="#airex-mark" class="cp-logo" data-id="l01" transform="…">` ilə çəkilir.
- Konfiqdə dəqiq **30** loqo olmalıdır. Sayı fərqli olsa, `main.js` başlanğıcda xəta verir (DEBUG rejimində), sayğacın məxrəci isə həmişə `logos.length`-dən götürülür.
- Koordinatları təyin etmək üçün dev rejimində **yer seçici** var (bax: 9.1).

---

## 6. Texnologiyalar və kitabxanalar

City Puzzle ilə eynidir.

| Nə | Nə üçün | Qoşulma |
|---|---|---|
| **modern-normalize** 3.0.1 | CSS reset | `vendor/modern-normalize.css` (+ LICENSE, MIT) |
| Öz `reset.css` | kiosk reset | `css/reset.css` |
| **Inter** 4.1 (hinted) | şrift, 400–800 | `assets/fonts/Inter-*.woff2` (+ `Inter.LICENSE.txt`, OFL), `css/fonts.css` |

**Animasiya kitabxanası istifadə olunmur.** Bu oyunda yalnız bir qısa animasiya var (bölmə 7), Web Animations API ilə yazılır.

**Heç bir fayl CDN-dən və ya xarici linkdən yüklənməməlidir.**

### 6.1 Kiosk üçün əlavə reset
```css
html, body { height:100%; margin:0; background:var(--c-bg); }
* { -webkit-tap-highlight-color: transparent; }
.cp-app {
  user-select: none; -webkit-user-select: none;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  overscroll-behavior: none;
}
img, svg { display:block; max-width:100%; -webkit-user-drag:none; }
button { font:inherit; border:0; cursor:pointer; }
```
- Xəritə üzərində `touch-action: none` (pinch/pan olmasın, toxunuş dərhal `pointerup` versin).
- `contextmenu` hadisəsini kök elementdə blokla.
- `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
- Bütün şəkillər və SVG-lər oyun başlamazdan əvvəl preload olunur (`Promise.all`, `img.decode()`). Bu müddətdə loading vəziyyəti göstərilir. Xəritə decode olunmadan taymer başlamamalıdır.

### 6.2 Offline iş rejimi
City Puzzle ilə eynidir, yalnız adlar dəyişir:

1. Bütün resurslar lokaldır, xarici sorğu yoxdur.
2. **Service Worker** (`sw.js`), *cache-first*, `PRECACHE` massivi, keş adı `find-logo-v1`. Köhnə keş `activate`-də silinir. Qeydiyyat yalnız `core/sw-register.js`-də.
3. Ən yaxşı nəticə `localStorage`-da. Gələcəkdə server əlavə olunarsa outbox məntiqi ilə göndərilir (indi yazılmır, `storage.js` interfeysi mane olmamalıdır).
4. Service Worker yalnız `http://localhost` və ya `https` üzərində işləyir.

**Kioskda quraşdırma (Windows):** City Puzzle-dakı addımlar eynidir (`C:\find-logo\`, `npx serve -l 3000` və ya `miniserve.exe`, Edge/Chrome kiosk flag-ləri, avtomatik başlama, Windows jestlərinin söndürülməsi, Windows aktivləşdirmə, yuxu rejiminin söndürülməsi). Hər iki oyun eyni kompüterdə olacaqsa, fərqli portlar istifadə olunur (məsələn 3000 və 3001).

---

## 7. Animasiyalar (cəmi 1 dənə, kitabxanasız)

Ekran keçidləri, sayğac və nəticə ekranı animasiyasızdır. Loqonun rəngi `.is-found` class-ı ilə dəyişir.

### 7.1 Tapılmış loqo: “pop”
Rəng dəyişməsi ilə eyni anda loqo qısa müddət böyüyüb geri qayıdır ki, istifadəçi toxunuşun qəbul olunduğunu hiss etsin:

```js
/**
 * @param {SVGElement} el  tapılmış loqonun <use> elementi
 * @returns {Animation}
 */
export function playFound(el) {
  return el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.6)', offset: 0.4 },
      { transform: 'scale(1)' }
    ],
    { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', composite: 'add' }
  );
}
```

- Animasiya loqonun öz `transform`-u (mövqe, skew) pozulmasın deyə `composite: 'add'` ilə yazılır, yaxud `<use>` ayrıca `<g>` içinə qoyulub animasiya `<g>`-yə tətbiq olunur (`transform-box: fill-box; transform-origin: center`).
- Animasiya oyunu bloklamır: istifadəçi animasiya gedərkən başqa loqoya toxuna bilər.
- Son (30-cu) loqoda RESULT keçidi `anim.finished`-dən sonra ≈500ms gözləyir.

### 7.2 Ümumi
- `prefers-reduced-motion` aktivdirsə: pop olmur, yalnız rəng dəyişir.
- Davam edən animasiyalar `destroy()` zamanı `cancel()` ilə dayandırılır.

---

## 8. Fayl strukturu

```
find-logo/
  index.html
  css/
    reset.css
    fonts.css
    tokens.css          # rənglər, --u, şriftlər (--font-display daxil)
    layout.css          # header, ekranlar, düymələr, info bloku
    game.css            # xəritə, overlay, loqo vəziyyətləri
  js/
    main.js             # bootstrap
    config.js           # xəritə konfiqi, ayarlar
    app/PuzzleApp.js    # → FindLogoApp.js: state machine
    game/GameEngine.js  # SAF məntiq: found Set, score, bitmə (DOM yoxdur)
    game/MapView.js     # şəkil + SVG overlay render, hit-test, .is-found
    game/HudView.js     # taymer və sayğacın DOM-a yazılması
    game/animations.js  # playFound
    maps/baku/logos.js  # (və ya assets/maps/baku/logos.js)
    core/Timer.js       # City Puzzle-dan; durationMs və onEnd əlavə olunur
    core/storage.js     # City Puzzle-dan; dəyər tipi {score,timeMs,date}
    core/assets.js
    core/Emitter.js
    core/sw-register.js
    core/env.js
  vendor/
  sw.js
  assets/
```

### 8.1 `GameEngine` interfeysi
```js
class GameEngine extends Emitter {
  /** @param {{ logos: LogoSpot[], durationMs: number }} opts */
  constructor(opts) {}
  start() {}                 // state sıfırlanır
  /** @returns {boolean} yeni tapıldımı */
  find(logoId) {}            // emit('found', { id, score, total })
  timeUp() {}                // emit('completed', { score, total, timeMs, reason: 'time' })
  get score() {}
  get isFinished() {}
}
// 30/30 olanda: emit('completed', { …, reason: 'all' })
```
Hit-test (koordinat → ən yaxın loqo) saf funksiya kimi yazılır (`findNearestLogo(point, logos, foundSet)`), DOM-dan asılı deyil və ayrıca test oluna bilər.

### 8.2 Konfiq nümunəsi
```js
import { BAKU_LOGOS } from './maps/baku/logos.js';

export const MAP_BAKU = {
  id: 'baku',
  title: 'XƏRİTƏ',
  image: 'assets/maps/baku/map.webp',
  imageSize: { width: 1530, height: 2040 }, // overlay viewBox
  mark: 'assets/brand/airex-mark.svg',
  logos: BAKU_LOGOS,                         // 30 dənə
  resultObjectPosition: 'center top',        // nəticə ekranında 4:3 kəsim
};

export const SETTINGS = {
  restartTarget: 'rules',
  durationMs: 120000,
  timerDirection: 'up',
  finishDelayMs: 500,
  defaultHitRadiusU: 45,   // dizayn px, ekranda
  idleResetMs: 60000,      // rules/start/result ekranlarında (0 = söndür)
};

export const DEBUG = false;
```

---

## 9. Kod tələbləri

City Puzzle ilə eynidir:

- ES modules, qlobal dəyişən yoxdur, `window`-a heç nə yazılmır.
- Bütün DOM sorğuları kök elementə görə (`this.root.querySelector`).
- Inline `onclick` və inline `style` yoxdur. Loqoların mövqeyi SVG `transform` atributu ilə verilir (bu inline style sayılmır).
- Kliklər üçün `pointerup`. Xəritədə bir listener (event delegation), hədəf hit-test ilə müəyyən olunur. Loqonun DOM elementinin özünə listener qoşulmur.
- Vəziyyətlər yalnız class ilə: `.is-found`, `.is-active`, `.is-finished`, `.is-record`.
- `GameEngine` DOM-a toxunmur, event yayır (`found`, `tick`, `completed`). View-lar qulaq asır.
- Hər class-ın `destroy()` metodu: listener-lər, rAF, animasiyalar.
- `innerHTML`-ə yalnız öz SVG assetlərimiz yazıla bilər.
- JSDoc, ingiliscə adlar, Azərbaycanca UI mətnləri.
- Konsolda error və warning yoxdur.
- Lokal serverdən açılır (`npx serve`).

### 9.1 Dev rejimi (test üçün)
`config.js`-də `DEBUG: true` və ya URL-də `?dev` olanda GAME ekranında kiçik dev paneli görünür. `DEBUG: false` və `?dev` yoxdursa panel DOM-a ümumiyyətlə əlavə olunmur.

- **“Hamısını tap”**: qalan loqoları növbə ilə tapılmış edir, oyun adi qaydada (`reason: 'all'`) bitir. Rekord və “YENİ REKORD!” real axında yoxlanılır.
- **“Vaxtı bitir”**: taymeri 02:00-a çatdırır, oyun `reason: 'time'` ilə bitir.
- **“Zonaları göstər”**: hər loqonun `hitRadius` dairəsini və id-sini yarımşəffaf çəkir, gizli loqoları daha görünən edir.
- **Yer seçici**: aktiv olanda xəritəyə toxunuş loqo tapmır, əvəzinə toxunma nöqtəsinin viewBox koordinatlarını `{ x, y }` kimi paneldə göstərir və sətir kimi kopyalamağa imkan verir. 30 loqonun koordinatları bu alətlə `logos.js`-ə yığılır.

---

## 10. Angular-a köçürmə üçün qaydalar

| Vanilla | Angular qarşılığı |
|---|---|
| `GameEngine`, `Timer`, `storage`, `findNearestLogo` | `@Injectable` service-lər / saf funksiyalar |
| Hər ekran (`rules`, `start`, `game`, `result`) | ayrı standalone component |
| `FindLogoApp` state machine | parent component + `signal` state |
| `Emitter` eventləri | `Output()` / RxJS `Subject` |
| `animations.js` | eyni funksiya, element `viewChild` ilə ötürülür |
| `destroy()` | `ngOnDestroy` |

- Funksiyalar DOM elementini **parametr kimi** qəbul edir.
- `window` / `document` / `localStorage` yalnız `core/` modullarında.
- Konstruktorlarda side-effect yoxdur, başlatma `init()` / `mount()` ilə.
- Asset yolları konfiqdən gəlir.
- City Puzzle və Find Logo eyni Angular layihəsində olarsa, `core/` modulları və layout (header, düymə, `--u`) ortaq kitabxanaya çıxarılır.

---

## 11. UI mətnləri

| Açar | Mətn |
|---|---|
| brand | FIND AIREX LOGO |
| rules.title1 | FIND AIREX LOGO |
| rules.title2 | OYUN QAYDALARI |
| rules.1 | Xəritədə gizlədilmiş AIREX loqolarını tap |
| rules.2 | Loqonu tapan kimi toxun |
| rules.3 | 2 dəqiqə ərzində mümkün qədər çox loqo topla |
| rules.cta | DAVAM ET |
| start.title | XƏRİTƏ |
| start.best | ƏN YAXŞI NƏTİCƏ: |
| start.cta | BAŞLA |
| game.title | XƏRİTƏ |
| game.time | VAXT |
| game.count | LOQOLARIN SAYI |
| game.hint | İkonları toplamaq üçün toxun. |
| result.title | NƏTİCƏ |
| result.count | LOQOLARIN SAYI |
| result.best | ƏN YAXŞI NƏTİCƏ: |
| result.record | YENİ REKORD! |
| result.cta | YENİDƏN OYNA |

Oyun **yalnız Azərbaycan dilində**dir, i18n qurulmur. Statik mətnlər HTML-də yazılır. JS yalnız dinamik dəyərləri dəyişir (vaxt, `nn/30`, ən yaxşı nəticə, “YENİ REKORD!”). Rules 1 və 3-cü bəndlərdə sətir sınması dizayndakı kimi `<br>` ilə verilir.

---

## 12. Qəbul meyarları (checklist)

- [ ] 4 ekran dizayna piksel səviyyəsində uyğundur (1080×1920-də).
- [ ] 720×1280, 1440×2560 və qeyri-standart nisbətli konteynerdə proporsiya pozulmur, loqolar xəritədə yerindən sürüşmür.
- [ ] 30 loqo hər oyunda eyni yerdədir.
- [ ] Loqoya toxunanda o lime olur, sayğac 1 artır. Eyni loqoya təkrar toxunuş sayğacı artırmır.
- [ ] Boş yerə toxunuş heç nə etmir. Bir toxunuş iki loqo tapmır.
- [ ] Taymer dəqiqdir, 02:00-da dayanır və RESULT açılır. 30/30-da vaxtdan əvvəl dayanır və eyni RESULT açılır.
- [ ] Oyun bitdikdən sonra xəritəyə toxunuş nəticəni dəyişmir.
- [ ] Ən yaxşı nəticə saxlanılır və yenilənir, “YENİ REKORD!” düzgün göstərilir. Rekord yoxdursa `--/30`.
- [ ] Nəticə ekranında şəkil 4:3 kəsimlə düzgün göstərilir.
- [ ] “YENİDƏN OYNA” tam sıfırlayır. 10 dəfə ardıcıl oynandıqda memory leak olmur.
- [ ] Sürətli çoxlu toxunuşda bug yaranmır.
- [ ] Konsolda error yoxdur.
- [ ] DevTools → Network → *Offline* rejimində səhifə yenilənəndə oyun tam işləyir.
- [ ] Network tabında heç bir xarici domenə sorğu yoxdur.
- [ ] Production-da dev paneli görünmür.

---

## 13. Açıq suallar (developer başlamazdan əvvəl dəqiqləşdirilməlidir)

1. **Başlıq şrifti:** “XƏRİTƏ” / “NƏTİCƏ” başlıqlarındakı display şrifti hansıdır və lisenziyası (woff2 faylı) varmı? Rules ekranında başlıq Inter kimi görünür, digər ekranlarda isə yox. Hamısı eyni olmalıdır?
2. **İpucu mətni:** dizaynda “İkonları toplamaq üçün toxun.” yazılıb, qaydalarda isə “loqo” sözü işlənir. “Loqoları toplamaq üçün toxun.” olmalıdır?
3. **Taymer istiqaməti:** dizaynda vaxt `00:00`-dan yuxarı sayır. Qalan vaxtı göstərmək (`02:00` → `00:00`) istifadəçi üçün daha aydın ola bilər. Hansı seçilir? (Konfiq hər ikisini dəstəkləyir.)
4. **Son saniyələr:** son 10 saniyədə taymer rəngi dəyişsin (məsələn `--c-error`)? Dizaynda yoxdur.
5. **Loqoların görünüşü:** gizli loqonun rəngi, şəffaflığı və ölçüsü (dizaynda ≈30 px, açıq boz). 30 loqonun dəqiq yerləri dizaynerdən koordinat (və ya loqoları ayrıca qatda olan PSD/Figma) şəklində verilə bilərmi?
6. **Bərabər nəticə:** `30/30` iki dəfə olanda daha sürətli vaxt rekord sayılsın? (Default: bəli, amma ekranda vaxt göstərilmir.)
7. Monitorun dəqiq modeli və həlli.
8. Ən yaxşı nəticə yalnız bu cihazda saxlanılır, yoxsa serverdən gəlir?
9. Səs effektləri lazımdırmı (tapıldı / vaxt bitdi)?
10. Gələcəkdə başqa xəritələr əlavə olunacaqmı? (Konfiq buna hazırdır.)
