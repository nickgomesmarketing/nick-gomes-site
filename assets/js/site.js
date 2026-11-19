/* Nick Gomes — site.js */
(function () {
  document.documentElement.classList.add('js');

  // Menu mobile
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      document.documentElement.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    // fecha ao tocar num item, fora do menu, no Esc ou ao voltar para tela grande
    [].forEach.call(menu.querySelectorAll('a'), function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); }
    });
    var y0 = 0;
    burger.addEventListener('click', function () { y0 = scrollY; });
    addEventListener('scroll', function () {
      if (menu.classList.contains('open') && Math.abs(scrollY - y0) > 40) setMenu(false);
    }, { passive: true });
    var wide = window.matchMedia('(min-width: 901px)');
    var onWide = function () { if (wide.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  // Abas dos pilares
  var tabs = [].slice.call(document.querySelectorAll('[role=tab]'));
  function select(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        select(n); n.focus();
      }
    });
  });

  // Quadrado-guia (só na Início, em qualquer tela, sem "reduzir movimento")
  var slot = document.getElementById('gslot');
  var line = document.querySelector('.line');
  var end = document.getElementById('gend');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!slot || !line || !end || reduce) {
    var b = document.querySelector('.line b'); if (b) b.style.height = '100%';
    return;
  }
  var fill = line.querySelector('b');
  var nums = [].slice.call(line.parentElement.querySelectorAll('.num'));
  var g = document.createElement('div');
  g.id = 'guide'; g.setAttribute('aria-hidden', 'true');
  document.body.appendChild(g);
  var small = window.matchMedia('(max-width: 760px)');
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var ticking = false;
  g.classList.add('on'); slot.style.visibility = 'hidden';

  function tick() {
    ticking = false;
    var lr = line.getBoundingClientRect(), lx = lr.left + lr.width / 2;
    var sr = slot.getBoundingClientRect();
    // o quadrado tem sempre o tamanho do quadrado bordô do símbolo (menor no celular)
    var S = Math.max(14, Math.round(sr.width)), H = S / 2;
    if (g._s !== S) { g.style.width = g.style.height = S + 'px'; g._s = S; }
    var P = [{ x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 }];
    nums.forEach(function (n) { var r = n.getBoundingClientRect(); P.push({ x: lx, y: r.top + r.height / 2, el: n }); });
    var er = end.getBoundingClientRect();
    // celular: pousa no espaço logo acima do botão final; tela grande: à esquerda dele
    if (small.matches) P.push({ x: er.left + er.width / 2, y: er.top - 26, end: true });
    else P.push({ x: er.left - 18, y: er.top + er.height / 2, end: true });
    var F = Math.min(innerHeight * .5, P[0].y + scrollY);
    var rem = document.documentElement.scrollHeight - (scrollY + innerHeight);
    var k = Math.max(0, Math.min(1, 1 - rem / 700)), LY = P[P.length - 1].y;
    if (LY > F) F = F + (LY - F) * k;
    var x, y, rot = 0, i;
    if (F <= P[0].y) { x = P[0].x; y = P[0].y; }
    else if (F >= LY) { x = P[P.length - 1].x; y = LY; }
    else {
      for (i = 0; i < P.length - 1; i++) if (F >= P[i].y && F < P[i + 1].y) break;
      var a = P[i], c = P[i + 1], t = Math.min(1, Math.max(0, (F - a.y) / (c.y - a.y))), e = ease(t);
      // trecho longo (maior que a tela): na vertical acompanha a rolagem 1:1, senão o quadrado sai da tela
      var ty = (c.y - a.y) > innerHeight * .9 ? t : e;
      x = a.x + (c.x - a.x) * e; y = a.y + (c.y - a.y) * ty; rot = Math.sin(e * Math.PI) * 45;
    }
    g.style.transform = 'translate(' + (x - H) + 'px,' + (y - H) + 'px) rotate(' + rot + 'deg)';
    fill.style.height = Math.max(0, Math.min(lr.height, y - lr.top)) + 'px';
    P.forEach(function (p) { if (p.el) p.el.classList.toggle('hit', y >= p.y - 2); });
    var last = P[P.length - 1];
    end.classList.toggle('arrive', Math.abs(y - last.y) < 3 && Math.abs(x - last.x) < 3);
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(req);
  req();
})();

/* ---------- site tecnológico: frase digitada, lâminas com ScrollTrigger + rolagem suave ---------- */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var top = document.querySelector('.top');
  var hh = function () { return top ? top.offsetHeight : 0; };
  root.style.setProperty('--hh', hh() + 'px');

  // 1) Frase da primeira dobra sendo escrita (mantém <br> e destaques; texto completo no aria-label)
  var h = document.querySelector('h1[data-type]');   // só a frase do Início é digitada
  if (h && !reduce) {
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    var chars = [];
    var wrap = function (node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split('').forEach(function (c) {
            var s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = c;
            frag.appendChild(s); chars.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { wrap(n); }
      });
    };
    wrap(h);
    h.classList.add('tw');
    var caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
    chars[0].parentNode.insertBefore(caret, chars[0]);
    var i = 0;
    var tick = function () {
      if (i < chars.length) {
        var c = chars[i]; c.classList.add('on'); c.parentNode.insertBefore(caret, c.nextSibling); i++;
        setTimeout(tick, c.textContent === ' ' ? 20 : 34 + Math.random() * 22);
      } else { h.classList.add('done'); }
    };
    setTimeout(tick, 120);
  }

  var folds = [].slice.call(document.querySelectorAll('.fold'));
  if (reduce || !folds.length) { [].forEach.call(document.querySelectorAll('.reveal'), function (e) { e.classList.add('shown'); }); return; }

  // 2) Lâminas presas (position: sticky, feito pelo navegador = fluido). Cada uma prende quando
  //    termina de aparecer; a próxima só sobe depois de uma pausa (--hold) para dar tempo de ler.
  var place = function () {
    var H = hh(); root.style.setProperty('--hh', H + 'px');
    folds.forEach(function (f, k) { f.style.zIndex = k + 1; f.style.top = Math.min(H, innerHeight - f.offsetHeight) + 'px'; });
  };
  place();

  var base = (document.querySelector('script[src*="site.js"]').getAttribute('src') || '').replace(/site\.js.*$/, '');
  var load = function (src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = base + 'vendor/' + src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); };
  var lenis = null;
  var fx = function () {
  // 3) Rolagem suave (Lenis) sincronizada com o ScrollTrigger
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
    root.classList.add('lenis');
  }
  var hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    // a lâmina coberta recua, sobe e escurece acompanhando a rolagem (só transform/opacity)
    folds.forEach(function (f, k) {
      var nx = folds[k + 1]; if (!nx) return;
      gsap.fromTo(f, { '--p': 0 }, {
        '--p': 1, ease: 'none',
        scrollTrigger: { trigger: nx, start: 'top bottom', end: function () { return 'top ' + hh() + 'px'; }, scrub: 0.5, invalidateOnRefresh: true }
      });
    });
    // cartões e títulos surgem ao entrar na tela
    var items = [].slice.call(document.querySelectorAll('.fold:not(.fold-hero) .h, .pilar, .stat, .site, .rv, .card, .cc, .badge, .photo, .bio p, .cta'));
    items.forEach(function (el) { el.classList.add('reveal'); });
    ScrollTrigger.batch(items, {
      start: 'top 90%', once: true,
      onEnter: function (b) { b.forEach(function (el, n) { el.style.transitionDelay = (n * 90) + 'ms'; el.classList.add('shown'); }); }
    });
    ScrollTrigger.addEventListener('refreshInit', place);
    ScrollTrigger.refresh();
    if (window.ResizeObserver) { var t0; new ResizeObserver(function () { clearTimeout(t0); t0 = setTimeout(function () { ScrollTrigger.refresh(); }, 120); }).observe(document.body); }
  } else {
    addEventListener('resize', place);
    [].forEach.call(document.querySelectorAll('.reveal'), function (e) { e.classList.add('shown'); });
  }

  };
  // as animações de rolagem carregam só depois que a página já apareceu (não atrasam a abertura)
  var start = function () {
    load('gsap.min.js').then(function () { return Promise.all([load('ScrollTrigger.min.js'), load('lenis.min.js')]); }).then(fx, function () {
      addEventListener('resize', place); [].forEach.call(document.querySelectorAll('.reveal'), function (e) { e.classList.add('shown'); });
    });
  };
  if (document.readyState === 'complete') setTimeout(start, 50); else addEventListener('load', function () { setTimeout(start, 50); });

  // 4) Links internos (#pilares, #projetos…): vão até o começo da lâmina certa
  var naturalTop = function (el) {
    var f = el.closest('.fold'); if (!f) return el.getBoundingClientRect().top + scrollY - hh();
    var y = 0, n = f; while (n && n !== document.body) { y += n.offsetTop || 0; n = n.offsetParent; }
    var main = f.parentNode, acc = main.getBoundingClientRect().top + scrollY;
    for (var k = 0; k < folds.length; k++) {
      var g = folds[k]; if (k) acc += parseFloat(getComputedStyle(g).marginTop) || 0;
      if (g === f) break; acc += g.offsetHeight;
    }
    var inner = f === el ? 0 : (el.offsetTop || 0);
    return acc + (el.offsetParent === f ? inner : 0) - hh();
  };
  var go = function (id, instant) {
    var el = document.getElementById(id); if (!el) return false;
    var y = Math.max(0, naturalTop(el));
    if (lenis) lenis.scrollTo(y, { immediate: !!instant }); else scrollTo({ top: y, behavior: instant ? 'auto' : 'smooth' });
    return true;
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]'); if (!a) return;
    var u = new URL(a.href, location.href);
    if (u.pathname === location.pathname && u.hash.length > 1 && go(decodeURIComponent(u.hash.slice(1)))) { e.preventDefault(); history.replaceState(null, '', u.hash); }
  });
  if (location.hash.length > 1) addEventListener('load', function () { setTimeout(function () { go(decodeURIComponent(location.hash.slice(1)), true); }, 60); });
})();

/* ---------- e-mail protegido e aviso de cookies (todas as páginas) ---------- */
(function () {
  // e-mail montado só no navegador: robôs que leem o código não encontram o endereço
  [].forEach.call(document.querySelectorAll('a[data-m]'), function (a) {
    try { a.href = 'mailto:' + atob(a.getAttribute('data-m')); a.removeAttribute('rel'); } catch (e) {}
  });

  // aviso de cookies (LGPD). Hoje o site não usa cookies de medição nem de anúncio;
  // a escolha fica guardada e libera ferramentas futuras (ex.: Google Analytics) só com "Aceitar".
  var KEY = 'ng-consent';
  var get = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var set = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} window.ngConsent = v; document.dispatchEvent(new CustomEvent('ng-consent', { detail: v })); };
  window.ngConsent = get();
  var priv = (document.querySelector('.legal-links a') || {}).getAttribute ? document.querySelector('.legal-links a').getAttribute('href') : '/politica-de-privacidade/';
  var box = null;
  var show = function () {
    if (box) { box.classList.add('on'); box.querySelector('button').focus(); return; }
    box = document.createElement('div');
    box.className = 'ck'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Aviso de cookies'); box.setAttribute('aria-live', 'polite');
    box.innerHTML = '<b>Sua privacidade importa</b>Usamos apenas o essencial para o site funcionar. Ferramentas de medição só serão ativadas com o seu consentimento. Saiba mais na <a href="' + priv + '">Política de Privacidade</a>.' +
      '<div class="ck-a"><button type="button" class="ok">Aceitar</button><button type="button" class="no">Recusar</button></div>';
    document.body.appendChild(box);
    box.querySelector('.ok').addEventListener('click', function () { set('granted'); hide(); });
    box.querySelector('.no').addEventListener('click', function () { set('denied'); hide(); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('on'); }); });
  };
  var hide = function () { if (box) box.classList.remove('on'); };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookies]');
    if (t) { e.preventDefault(); e.stopPropagation(); show(); }
  }, true);
  if (!window.ngConsent) setTimeout(show, 1200);
})();
