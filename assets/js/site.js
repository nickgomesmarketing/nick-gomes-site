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

/* ---------- site tecnológico: frase digitada, dobras sobrepostas e conteúdo surgindo ---------- */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Frase principal sendo escrita (o texto completo fica no HTML para o Google e leitores de tela)
  var h = document.querySelector('.hero:not(.inner) h1');
  if (h && !reduce) {
    var txt = h.textContent;
    h.setAttribute('aria-label', txt);
    h.textContent = '';
    h.classList.add('tw');
    var chars = [];
    txt.split('').forEach(function (c) {
      var s = document.createElement('span');
      s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = c;
      h.appendChild(s); chars.push(s);
    });
    var caret = document.createElement('span');
    caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
    h.insertBefore(caret, chars[0]);
    var i = 0;
    var tick = function () {
      if (i < chars.length) {
        chars[i].classList.add('on');
        h.insertBefore(caret, chars[i].nextSibling);
        i++;
        setTimeout(tick, chars[i - 1].textContent === ' ' ? 30 : 55 + Math.random() * 35);
      } else { h.classList.add('done'); }
    };
    setTimeout(tick, 350);
  }

  // 2) Dobras: cada bloco fica preso quando termina e o próximo sobe por cima
  var folds = [].slice.call(document.querySelectorAll('.fold'));
  var top = document.querySelector('.top');
  if (folds.length && !reduce) {
    var place = function () {
      var hh = top ? top.offsetHeight : 0;
      folds.forEach(function (f, k) {
        f.style.zIndex = k + 1;
        f.style.top = Math.min(hh, innerHeight - f.offsetHeight) + 'px';
      });
    };
    place();
    addEventListener('resize', place);
    addEventListener('load', place);
    if (window.ResizeObserver) { var ro = new ResizeObserver(place); folds.forEach(function (f) { ro.observe(f); }); }
    // o bloco que está sendo coberto recua, sobe um pouco e escurece (só transform/opacity: fica fluido)
    var raf = 0;
    var shade = function () {
      raf = 0;
      var hh = top ? top.offsetHeight : 0;
      for (var k = 0; k < folds.length - 1; k++) {
        var f = folds[k], nx = folds[k + 1];
        var h = f.offsetHeight, cur = f._p || 0;
        var stuckAt = parseFloat(f.style.top) || 0;
        var lt = f.getBoundingClientRect().top + 0.03 * cur * h;   // topo real (sem o efeito)
        var p = 0;
        if (Math.abs(lt - stuckAt) < 3) {                          // só quando o bloco está preso
          var vis = Math.max(1, (lt + h) - Math.max(lt, hh));      // parte dele que aparece na tela
          p = ((lt + h) - nx.getBoundingClientRect().top) / vis;   // quanto o próximo já cobriu
          p = Math.max(0, Math.min(1, p));
        }
        if (Math.abs(cur - p) > 0.002) { f._p = p; f.style.setProperty('--p', p.toFixed(3)); }
      }
    };
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(shade); }, { passive: true });
    addEventListener('resize', shade);
    shade();
  }

  // 3) Cartões e títulos surgem ao entrar na tela
  if (!reduce && 'IntersectionObserver' in window) {
    var items = [].slice.call(document.querySelectorAll('.fold:not(.fold-hero) .h, .pilar, .stat, .site, .rv, .card, .cc, .badge, .photo, .bio p, .cta'));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el, n) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((n % 3) * 90) + 'ms';
      io.observe(el);
    });
  }
})();
