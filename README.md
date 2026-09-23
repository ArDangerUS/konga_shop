# Handoff: Konga Kratom – landing page (CZ)

> **Produkční web je hotový: `index.html` (statické HTML, bez runtime).**
> Nasazení na GitHub Pages a napojení formuláře na Telegram: **[DEPLOY.md](DEPLOY.md)**.
> Soubory `Konga Kratom.dc.html`, `support.js` a `ios-frame.jsx` zůstávají jen jako
> designová reference – na webu se nepoužívají.
>
> **Pozor: produkční `index.html` se od popisu níže liší v jednom bodě –
> sleva byla na přání klienta odstraněna.** Zmizel offer box v hero sekci,
> velké „−15 %“ v kontaktu i zmínky slevy v CTA, FAQ a meta popiscích;
> hookem je nově „zavoláme do 30 minut a poradíme s výběrem“. Popis slevy
> v kapitolách níže platí jen pro původní návrh.

## Overview
Jednostránkový prodejní landing pro Konga Kratom (Praha, Nuselská 31). Cíl: konverze z placené reklamy do formuláře „jméno + telefon“ s hookem **sleva na první objednávku (výchozí 15 %), zavoláme do 30 minut**. Sekundárně SEO / AI-search viditelnost (JSON-LD, FAQ, sémantické nadpisy). Jazyk výhradně čeština. Primární zařízení: mobil.

## About the Design Files
Soubory v tomto balíčku jsou **designové reference vytvořené v HTML** (prototyp ukazující vzhled a chování), ne produkční kód ke zkopírování. Úkol: **znovu implementovat návrh** jako statický web (doporučeno: Astro nebo Next.js static export / čisté HTML+CSS) s hostingem na GitHub Pages / Netlify / Vercel. Soubor `Konga Kratom.dc.html` závisí na interním runtime (`support.js`, šablonovací `{{ }}` a `<sc-for>`) — přenášejte markup, styly a obsah, ne runtime.

## Fidelity
**High-fidelity.** Barvy, typografie, rozestupy, texty a chování jsou finální. Reprodukujte 1:1.

## Screen: Landing (jediná stránka)
Max šířka obsahu 1280 px, centrovaná. Horizontální padding `clamp(20px,5vw,64px)`, vertikální padding sekcí `clamp(56px,7vw,88px)`. Sekce střídají pozadí `#0f1f17` a `#0b1811`. Všechny gridy: `repeat(auto-fit, minmax(min(100%,380px),1fr))` → na mobilu 1 sloupec.

### 1. Header (sticky)
- `position:sticky; top:0; background:rgba(15,31,23,.92); backdrop-filter:blur(10px); border-bottom:1px solid rgba(255,255,255,.08)`, padding 14px H.
- Vlevo: logo `assets/konga-logo.jpg` výška 64px (mobil 48px), radius 6px, celé, neoříznuté. Vedle: „Konga Kratom“ (DM Serif Display 21px) + „PRAHA · NUSELSKÁ 31“ (11px, uppercase, letter-spacing .08em, #9fb3a4). Textový blok skrytý ≤760px.
- Nav (skrytá ≤760px): Produkty · Kvalita · O kratomu · Časté dotazy · Kontakt, 14px #c9d6cc, anchor odkazy.
- CTA: „Sleva 15 % na první nákup“ – #f28b1e pozadí, #0f1f17 text, 700, 12×20px, radius 4px.

### 2. Hero
Grid 2 sloupce (min 420px), gap 48px, align center.
- Eyebrow: zelená tečka 8px + „KAŽDÁ ŠARŽE TESTOVÁNA NA VŠCHT PRAHA“ 13px uppercase #7ac142.
- H1: „Prémiový kratom s dohledatelným původem. Praha, Nuselská 31.“ DM Serif Display 400, `clamp(40px,5.2vw,66px)` (mobil 38px), line-height 1.05.
- Lead: 17–19px, #c9d6cc, max 560px.
- Offer box: bg #16291f, border 1px rgba(122,193,66,.35), radius 6px, padding 18×22. Vlevo „−15 %“ DM Serif 44px #f28b1e, vpravo text 15px. Na mobilu sloupcově.
- Tlačítka: primární „Získat slevu 15 %“ (#f28b1e/#0f1f17, 16×28, radius 4) + sekundární „Zobrazit produkty“ (outline 1px rgba(255,255,255,.25)).
- Vpravo: foto 4:3 radius 8px + 3 statistiky (bg #16291f, radius 6, padding 14): „2,01 %“ / „2×“ / „50–60“ (DM Serif ~26px #7ac142) s popisem 12px #9fb3a4.

### 3. Trust strip
Grid auto-fit 220px, border top/bottom 1px rgba(255,255,255,.08). Položka: oranžový čtverec 10px rotate 45° + text 14px #c9d6cc. Texty: Testováno na VŠCHT Praha · Licencovaný producent, Indonésie · Kamenná prodejna v Praze · Legální dle české legislativy. Na mobilu položky pod sebou s border-bottom.

### 4. Produkty (#produkty)
H2 „Nabídka kratomu Konga“ + intro vpravo (15px #9fb3a4, max 440px). 3 karty (grid min 300px, gap 20): bg #16291f, radius 8, overflow hidden. Foto 1:1 (mobil 4:3), object-fit cover. Obsah padding 22: typ (12px uppercase #7ac142) · H3 název (DM Serif 26px) · popis 14px #c9d6cc · meta 13px #9fb3a4 · cena 18px 700 #f28b1e · tlačítko outline #f28b1e „Objednat se slevou 15 %“ (padding 14, radius 4). Data produktů viz níže.

### 5. Kvalita (#kvalita), bg #0b1811
2 sloupce. Levý sticky (top 110px; mobil static): eyebrow „ČÍM SE KONGA LIŠÍ“, H2 „Nejsme další distributor. Kontrolujeme cestu listu od farmy až k vám.“, odstavec, foto 3:2. Pravý: 5 bodů, každý grid 56px/1fr, padding 26px 0, border-top 1px rgba(255,255,255,.1): číslo „01“ DM Serif 32px #f28b1e, H3 20px 700, text 15px #c9d6cc.

### 6. Laboratorní kontrola (#laborator)
2 sloupce center. Vlevo eyebrow + H2 „Co u každé šarže kratomu měříme na VŠCHT Praha“ + odstavec. Vpravo `<ul>` bg #16291f radius 8, padding 8×28; položky 16px s „✓“ #7ac142, border-bottom.

### 7. O kratomu (#o-kratomu), bg #0b1811
Vlevo eyebrow „O KRATOMU“, H2 „Co je kratom a jak v ČR poznat ten kvalitní“, 2 odstavce 16px #c9d6cc. Vpravo foto 16:9 + box „Podle čeho poznáte kvalitní kratom“ se 4 body (oranžový ■).

### 8. FAQ (#faq)
Jeden sloupec, max-width 860px, centrovaný. H2 „Časté dotazy o kratomu a Konga“ a 6 položek (H3 19px 700 + odpověď 15px #c9d6cc, border-top).

### 9. Kontakt / formulář (#kontakt), bg #0b1811
Vlevo: „−15 %“ DM Serif clamp(56–72px) #f28b1e, H2 „na první objednávku kratomu“, text, `<address>` (adresa, hodiny, tel, e-mail odkazy). Vpravo formulář bg #16291f radius 8 padding 24–36: pole Jméno (name, required), Telefon (tel, required), checkbox GDPR + 18+ (required), tlačítko „Chci slevu 15 % a zavolat zpět“. Inputy: bg #0f1f17, border 1px rgba(255,255,255,.15), padding 14×16, radius 4, 16px. Po odeslání nahradit formulář boxem „Děkujeme! Ozveme se vám do 30 minut na číslo {telefon}.“

### 10. Mobile sticky CTA (≤760px)
`position:fixed; bottom:0`, bg rgba(15,31,23,.96), border-top, padding 10px 16px + safe-area. Dvě tlačítka: „Zavolat“ (outline, tel: odkaz) + „Získat slevu 15 %“ (primární, flex 1). Footer dostane padding-bottom 96px.

### 11. Footer
13px #9fb3a4, flex space-between wrap. Vlevo © + IČO + adresa + řádek velkoobchodu (b2b@konga.cz). Vpravo disclaimer: „Kratom je psychomodulační látka. Prodej pouze osobám starším 18 let. Není určeno k léčbě ani prevenci nemocí. Fotografie: Pexels.“

## Interactions & Behavior
- Anchor scroll: `html{scroll-behavior:smooth}`.
- Odkazy hover: barva #f28b1e.
- Formulář: HTML5 validace (required, type=tel). Odeslání → POST na backend (Formspree/Getform/webhook na Telegram – dodá klient), pak success state. Zatím žádný backend.
- Tracking: navěsit události na klik CTA (`#kontakt`) a odeslání formuláře (Google Ads / GA4 / Meta Pixel).
- Responsive breakpoint 760px – pravidla viz `@media` blok v HTML.

## State
`sent: boolean`, `phone: string` (po odeslání). `discount` (výchozí 15) a `showPrices` (výchozí true) jako konfigurační konstanty použité ve všech CTA textech i FAQ.

## SEO / AI search (přenést 1:1)
- `<title>` Kratom Praha – prémiový laboratorně testovaný kratom | Konga Kratom
- meta description, OG tagy (og:locale cs_CZ), lang="cs".
- JSON-LD @graph: Organization, Store (adresa, openingHours Mo-Fr 10:00-19:00, telefon), ItemList se 3 Product+Offer (CZK), FAQPage s 5 otázkami. Kompletní blok je v `<script type="application/ld+json">` v HTML.
- Jedna H1, H2 na sekci, H3 na produkty/body/FAQ; alt texty česky; `<address>`, `<nav aria-label>`, `aria-labelledby`.
- Doplnit: sitemap.xml, robots.txt, canonical, favicon z loga.

## Design Tokens
Barvy: bg #0f1f17 · bg alt #0b1811 · karta #16291f · text #eef3ee · text sekundární #c9d6cc · text tlumený #9fb3a4 · placeholder #7f8f84 · zelená akcent #7ac142 · oranžová CTA #f28b1e · border rgba(255,255,255,.08 / .1 / .15 / .25).
Typografie: nadpisy DM Serif Display 400; text DM Sans 400/500/700 (Google Fonts). H1 40–66px, H2 32–44px, H3 19–26px, body 15–17px, meta 12–13px.
Radius: 4px tlačítka/inputy · 6px boxy · 8px karty/fota. Rozestupy: 8/10/14/18/20/22/28/36/48.

## Assets
- `assets/konga-logo.jpg` – logo klienta (zobrazovat celé).
- Fotografie Pexels (free licence, bez atribuce nutné): 15760105 (hero + Green), 12192276 (Red, CSS filter sepia(.45) saturate(1.15) brightness(.88)), 8474053 (White, filter brightness(1.1) saturate(.8)), 38999830 (kvalita), 32666059 (o kratomu). Doporučeno nahradit vlastními fotkami produktů na jednotném pozadí.

## Obsah
Veškeré texty (produkty, 5 bodů, lab seznam, checklist, FAQ) jsou v `Konga Kratom.dc.html` – v šabloně a v poli objektů v třídě `Component` (products, points, lab, checklist, faq). Použít doslovně.

## Placeholdery k doplnění klientem
Telefon +420 000 000 000, e-mail info@konga.cz / b2b@konga.cz, IČO, otevírací doba, ceny produktů, cílový endpoint formuláře, analytické ID.

## Files

### Produkční web
- `index.html` – hotový statický landing (šablony `{{ }}` a `<sc-for>` rozgenerované, runtime odstraněn).
- `assets/config.js` – nastavení odesílání poptávek (endpoint / Telegram token). Jediný soubor k úpravě.
- `assets/form.js` – validace, odeslání, honeypot, UTM, události pro analytiku.
- `backend/cloudflare-worker.js`, `backend/google-apps-script.gs` – serverová mezivrstva, aby token bota nebyl veřejný.
- `.github/workflows/deploy-pages.yml` – automatické nasazení na GitHub Pages.
- `robots.txt`, `sitemap.xml`, `404.html`, `.nojekyll`.

### Designová reference (nepoužívá se na webu)
- `Konga Kratom.dc.html` – hlavní návrh (desktop + mobil).
- `Konga Mobile Preview.dc.html` – náhled v rámečku iPhone (jen pro kontrolu).
- `support.js`, `ios-frame.jsx` – runtime prototypu.
- `assets/konga-logo.jpg`.
