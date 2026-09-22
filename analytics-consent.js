(() => {
  'use strict';
  const ID = 'G-8V5PMQNVLN', KEY = 'maquetas-analytics-choice-v1';
  const TTL = 180 * 24 * 60 * 60 * 1000;
  let loaded = false, choice = null, timer;
  window['ga-disable-' + ID] = true;
  window.dataLayer = window.dataLayer || [];
  function tag() { window.dataLayer.push(arguments); }
  window.gtag = function() { if (choice === 'accepted') tag.apply(null, arguments); };
  function read() {
    try { const c = JSON.parse(localStorage.getItem(KEY));
      return c && ['accepted','rejected'].includes(c.value) && c.until > Date.now() && c.until <= Date.now() + TTL ? c : null;
    } catch (_) { return null; }
  }
  function clearCookies() {
    const domains = ['', location.hostname, '.' + location.hostname, '.maquetasdepapel.com'];
    const paths = ['/'];
    const parts = location.pathname.split('/');
    for (let i = 1; i < parts.length; i++) paths.push(parts.slice(0,i+1).join('/'));
    document.cookie.split(';').forEach(item => {
      const name = item.split('=')[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) return;
      domains.forEach(domain => paths.forEach(path => {
        document.cookie = name + '=; Max-Age=0; path=' + path + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
      }));
    });
  }
  const banner = document.createElement('section');
  banner.className = 'analytics-banner';
  banner.setAttribute('aria-label', 'Preferencias de analítica');
  banner.innerHTML = '<h2>Una pequeña pregunta sobre la analítica</h2><p>¿Nos permites usar Google Analytics para entender las visitas y mejorar esta web? Puedes navegar, comprar, descargar y contactar tanto si aceptas como si rechazas. <a href="/privacidad.html">Privacidad y analítica</a></p><p class="analytics-status" aria-live="polite"></p><div class="analytics-actions"><button type="button" data-choice="rejected">Rechazar analítica</button><button type="button" data-choice="accepted">Aceptar analítica</button><button type="button" data-close>Cerrar</button></div>';
  document.body.append(banner);
  let opener;
  function show() {
    banner.hidden = false;
    banner.querySelector('.analytics-status').textContent = choice ? 'Preferencia actual: ' + (choice === 'accepted' ? 'aceptada' : 'rechazada') + '.' : 'La analítica está desactivada hasta que aceptes.';
  }
  function hide() { banner.hidden = true; if (opener) opener.focus(); }
  function apply(c) {
    clearTimeout(timer);
    choice = c ? c.value : null;
    if (choice === 'accepted') {
      window['ga-disable-' + ID] = false;
      if (!loaded) {
        tag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
        tag('consent','update',{analytics_storage:'granted'});
        tag('js',new Date());
        tag('config',ID,{allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+location.pathname,page_referrer:document.referrer.split('?')[0].split('#')[0]});
        const script = document.createElement('script'); script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
        document.head.append(script); loaded = true;
      } else tag('consent','update',{analytics_storage:'granted'});
      const expiryCheck = () => {
        if (Date.now() >= c.until) { apply(null); show(); }
        else timer = setTimeout(expiryCheck, Math.min(c.until - Date.now(), 2147483647));
      };
      expiryCheck();
    } else {
      window['ga-disable-' + ID] = true;
      if (loaded) tag('consent','update',{analytics_storage:'denied'});
      clearCookies();
    }
  }
  banner.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    const c = {value:button.dataset.choice,until:Date.now()+TTL};
    apply(c);
    try { localStorage.setItem(KEY,JSON.stringify(c)); } catch (_) {}
    hide();
  }));
  banner.querySelector('[data-close]').addEventListener('click',hide);
  banner.addEventListener('keydown',e => { if(e.key === 'Escape') hide(); });
  document.querySelectorAll('.analytics-settings').forEach(button => button.addEventListener('click', () => {
    opener = button; show(); banner.querySelector('button').focus();
  }));
  window.addEventListener('storage',e => { if(e.key === KEY || e.key === null) { apply(read()); if(!choice) show(); } });
  const saved = read(); apply(saved); if(saved) hide(); else show();
})();
