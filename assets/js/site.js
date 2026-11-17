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
