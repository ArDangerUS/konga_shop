/* Konga Kratom — всплывающий баннер при заходе на сайт.
   Три варианта вёрстки, выбираются в assets/config.js → popup.variant:
     'sheet' — шторка снизу (мобильный стандарт, самый заметный)
     'card'  — карточка по центру экрана
     'bar'   — узкая полоска внизу (самый ненавязчивый)
   Клик по кнопке — скролл к форме #kontakt и фокус в поле имени. */
(function () {
  'use strict';

  var CFG = window.KONGA_CONFIG || {};
  var P = CFG.popup || {};
  if (P.enabled === false) return;

  var VARIANT = P.variant || 'sheet';
  var DELAY = P.delay == null ? 1200 : P.delay;
  var KEY = 'konga_popup_seen';

  /* Как часто показывать. 'session' — раз за сеанс браузера, 'always' — каждый
     раз, число — столько часов не показывать. repeatAfterHours — старое имя. */
  var MODE = P.showAgain != null ? P.showAgain
           : P.repeatAfterHours != null ? P.repeatAfterHours
           : 'session';

  var C = CFG.contact || {};
  var PRICE = C.price || C.priceFrom || '249 Kč';
  var PRICE_UNIT = C.priceUnit || 'za 50 g';
  var ADDRESS = C.address || 'Nuselská 31, Praha 4';
  var HOURS = C.hours || 'Po–Pá 10–19';
  var PHONE = C.phone || '+420 000 000 000';
  var PHONE_HREF = 'tel:' + PHONE.replace(/[^\d+]/g, '');

  var BULLETS = P.bullets || [
    'Každá šarže testována na VŠCHT Praha',
    'Mitragynin až 2,01 % · dohledatelný původ',
    'Licencovaný producent z Indonésie'
  ];

  /* ---------- показывали ли уже ----------
     Любое обращение к storage в try/catch: в приватном режиме и при
     заблокированных данных сайта он бросает исключение. Тогда просто
     показываем баннер — это безопаснее, чем упасть. */
  function alreadySeen() {
    if (MODE === 'always' || MODE === 0) return false;
    try {
      if (MODE === 'session') return sessionStorage.getItem(KEY) === '1';
      var t = parseInt(localStorage.getItem(KEY), 10);
      return !!t && Date.now() - t < MODE * 3600 * 1000;
    } catch (e) { return false; }
  }
  function remember() {
    try {
      if (MODE === 'session') sessionStorage.setItem(KEY, '1');
      else if (MODE !== 'always' && MODE !== 0) localStorage.setItem(KEY, String(Date.now()));
    } catch (e) {}
  }

  function track(name) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: name, popup_variant: VARIANT });
      if (typeof window.gtag === 'function') window.gtag('event', name, { popup_variant: VARIANT });
    } catch (e) {}
  }

  /* ---------- хелперы разметки ---------- */
  function el(tag, style, html) {
    var n = document.createElement(tag);
    if (style) n.setAttribute('style', style);
    if (html != null) n.innerHTML = html;
    return n;
  }

  var T = {
    accent: '#f28b1e', green: '#7ac142', card: '#16291f', bg: '#0f1f17',
    text: '#eef3ee', dim: '#c9d6cc', muted: '#9fb3a4',
    serif: "'DM Serif Display',serif"
  };

  function bulletList(fontSize) {
    var wrap = el('div', 'display:flex;flex-direction:column;gap:9px;');
    BULLETS.forEach(function (b) {
      wrap.appendChild(el('div',
        'display:flex;gap:10px;align-items:flex-start;font-size:' + fontSize + 'px;line-height:1.4;color:' + T.dim + ';',
        '<span style="color:' + T.green + ';font-weight:700;flex:0 0 auto;">✓</span><span>' + b + '</span>'));
    });
    return wrap;
  }

  function priceBlock(size) {
    return el('div', 'display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;',
      '<span style="font-family:' + T.serif + ';font-size:' + size + 'px;line-height:1;color:' + T.accent + ';">' + PRICE + '</span>' +
      '<span style="font-size:15px;color:' + T.muted + ';">' + PRICE_UNIT + '</span>');
  }

  function addressBlock() {
    return el('div',
      'display:flex;flex-direction:column;gap:4px;font-size:13px;line-height:1.5;color:' + T.muted + ';border-top:1px solid rgba(255,255,255,.1);padding-top:14px;',
      '<div>📍 <strong style="color:' + T.text + ';font-weight:500;">' + ADDRESS + '</strong> · ' + HOURS + '</div>' +
      '<div>📞 <a href="' + PHONE_HREF + '" data-popup-call style="color:' + T.text + ';">' + PHONE + '</a></div>');
  }

  function closeBtn(extra) {
    var b = el('button',
      'position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:50%;' +
      'background:rgba(255,255,255,.08);color:' + T.muted + ';font-size:19px;line-height:1;cursor:pointer;' + (extra || ''),
      '&times;');
    b.setAttribute('data-popup-close', '1');
    b.setAttribute('aria-label', 'Zavřít');
    return b;
  }

  function primaryBtn(label) {
    return el('button',
      'width:100%;background:' + T.accent + ';color:' + T.bg + ';border:0;padding:16px;border-radius:4px;' +
      'font-weight:700;font-size:16px;cursor:pointer;font-family:inherit;', label);
  }

  /* ---------- три варианта ---------- */
  function buildSheet() {
    var box = el('div',
      'position:fixed;left:0;right:0;bottom:0;z-index:101;max-width:520px;margin:0 auto;' +
      'background:' + T.card + ';border:1px solid rgba(255,255,255,.1);border-bottom:0;' +
      'border-radius:14px 14px 0 0;padding:26px 22px calc(22px + env(safe-area-inset-bottom));' +
      'max-height:88vh;overflow-y:auto;display:flex;flex-direction:column;gap:16px;' +
      'transform:translateY(105%);transition:transform .32s cubic-bezier(.22,.7,.3,1);');
    box.appendChild(closeBtn());
    box.appendChild(el('div', 'font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:' + T.green + ';padding-right:36px;', 'Kratom Praha · Nuselská 31'));
    box.appendChild(priceBlock(46));
    box.appendChild(bulletList(14));
    box.appendChild(addressBlock());
    var cta = primaryBtn('Chci poradit a zavolat zpět');
    box.appendChild(cta);
    return { box: box, cta: cta, show: function () { box.style.transform = 'translateY(0)'; }, hide: function () { box.style.transform = 'translateY(105%)'; } };
  }

  function buildCard() {
    var wrap = el('div',
      'position:fixed;inset:0;z-index:101;display:flex;align-items:center;justify-content:center;padding:20px;pointer-events:none;');
    var box = el('div',
      'position:relative;pointer-events:auto;width:100%;max-width:400px;background:' + T.card + ';' +
      'border:1px solid rgba(122,193,66,.3);border-radius:10px;padding:28px 24px;' +
      'max-height:86vh;overflow-y:auto;display:flex;flex-direction:column;gap:16px;' +
      'opacity:0;transform:scale(.94);transition:opacity .25s ease,transform .25s cubic-bezier(.22,.7,.3,1);');
    box.appendChild(closeBtn());
    var logo = el('img', 'height:52px;width:auto;align-self:flex-start;object-fit:contain;border-radius:6px;display:block;');
    logo.setAttribute('src', 'assets/konga-logo.jpg');
    logo.setAttribute('alt', 'Konga Kratom');
    box.appendChild(logo);
    box.appendChild(el('div', 'font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:' + T.green + ';', 'Laboratorně testovaný kratom'));
    box.appendChild(priceBlock(42));
    box.appendChild(bulletList(14));
    box.appendChild(addressBlock());
    var cta = primaryBtn('Chci poradit a zavolat zpět');
    box.appendChild(cta);
    wrap.appendChild(box);
    return {
      box: wrap, cta: cta,
      show: function () { box.style.opacity = '1'; box.style.transform = 'scale(1)'; },
      hide: function () { box.style.opacity = '0'; box.style.transform = 'scale(.94)'; }
    };
  }

  function buildBar() {
    // полоска садится над мобильной кнопкой, если та видна
    var cta0 = document.getElementById('mobile-cta');
    var offset = 0;
    try {
      if (cta0 && getComputedStyle(cta0).display !== 'none') offset = cta0.offsetHeight;
    } catch (e) {}

    var box = el('div',
      'position:fixed;left:12px;right:12px;bottom:' + (offset + 12) + 'px;z-index:101;max-width:520px;margin:0 auto;' +
      'background:' + T.card + ';border:1px solid rgba(122,193,66,.35);border-radius:8px;' +
      'box-shadow:0 10px 30px rgba(0,0,0,.45);padding:14px 16px;' +
      'display:flex;align-items:center;gap:12px;' +
      'transform:translateY(calc(100% + 24px));transition:transform .3s cubic-bezier(.22,.7,.3,1);');

    box.appendChild(el('div', 'flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;',
      '<div style="font-family:' + T.serif + ';font-size:22px;line-height:1;color:' + T.accent + ';">' + PRICE +
      ' <span style="font-family:inherit;font-size:13px;color:' + T.muted + ';">' + PRICE_UNIT + '</span></div>' +
      '<div style="font-size:12px;color:' + T.dim + ';line-height:1.35;">Testováno na VŠCHT · ' + ADDRESS + '</div>' +
      '<div style="font-size:12px;line-height:1.35;"><a href="' + PHONE_HREF + '" data-popup-call style="color:' + T.text + ';">📞 ' + PHONE + '</a></div>'));

    var cta = el('button',
      'flex:0 0 auto;background:' + T.accent + ';color:' + T.bg + ';border:0;padding:12px 16px;border-radius:4px;' +
      'font-weight:700;font-size:15px;cursor:pointer;font-family:inherit;', 'Mám zájem');
    box.appendChild(cta);
    box.appendChild(closeBtn('top:-9px;right:-9px;width:28px;height:28px;font-size:16px;background:' + T.bg + ';border:1px solid rgba(255,255,255,.2);'));
    return { box: box, cta: cta, bare: true, show: function () { box.style.transform = 'translateY(0)'; }, hide: function () { box.style.transform = 'translateY(calc(100% + 24px))'; } };
  }

  /* ---------- сборка и поведение ---------- */
  function open() {
    var v = VARIANT === 'card' ? buildCard() : VARIANT === 'bar' ? buildBar() : buildSheet();

    var backdrop = null;
    if (!v.bare) {
      backdrop = el('div',
        'position:fixed;inset:0;z-index:100;background:rgba(4,10,7,.72);opacity:0;transition:opacity .28s ease;');
      document.body.appendChild(backdrop);
    }
    v.box.setAttribute('role', 'dialog');
    v.box.setAttribute('aria-modal', v.bare ? 'false' : 'true');
    v.box.setAttribute('aria-label', 'Nabídka Konga Kratom');
    document.body.appendChild(v.box);

    var scrollY = window.scrollY;
    if (!v.bare) document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      if (backdrop) backdrop.style.opacity = '1';
      v.show();
    });
    remember();
    track('popup_shown');

    var closed = false;
    function close(reason) {
      if (closed) return;
      closed = true;
      if (backdrop) backdrop.style.opacity = '0';
      v.hide();
      if (!v.bare) { document.body.style.overflow = ''; window.scrollTo(0, scrollY); }
      document.removeEventListener('keydown', onKey);
      setTimeout(function () {
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        if (v.box.parentNode) v.box.parentNode.removeChild(v.box);
      }, 350);
      track(reason === 'cta' ? 'popup_cta' : 'popup_close');
    }

    function onKey(e) { if (e.key === 'Escape') close('esc'); }
    document.addEventListener('keydown', onKey);

    v.box.querySelector('[data-popup-close]').addEventListener('click', function () { close('close'); });
    if (backdrop) backdrop.addEventListener('click', function () { close('close'); });

    v.cta.addEventListener('click', function () {
      close('cta');
      setTimeout(function () {
        var target = document.getElementById('kontakt');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var name = document.querySelector('#lead-form input[name=name]');
        if (name) setTimeout(function () { try { name.focus({ preventScroll: true }); } catch (e) { name.focus(); } }, 650);
      }, 120);
    });

    var call = v.box.querySelector('[data-popup-call]');
    if (call) call.addEventListener('click', function () { track('popup_call'); });

    setTimeout(function () { v.cta.focus({ preventScroll: true }); }, 400);
  }

  if (alreadySeen()) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(open, DELAY); });
  } else {
    setTimeout(open, DELAY);
  }
})();
