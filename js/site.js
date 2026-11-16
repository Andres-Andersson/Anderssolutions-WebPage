/* =========================================================
   AndersSolutions — comportamiento base del sitio
   Vanilla JS, sin dependencias. Expone window.AS:
     AS.reveal(scope?)   registra nuevos [data-reveal] / [data-reveal-group]
                         dentro de scope (por defecto document). Usar si se
                         inserta contenido dinámicamente.
     AS.reducedMotion()  true si el usuario pidió reducir movimiento.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var AS = window.AS = window.AS || {};
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var mobileMQ = window.matchMedia ? window.matchMedia('(max-width: 960px)') : null; // = breakpoint del menú en site.css
  function reducedMotion() { return !!(reduceMQ && reduceMQ.matches); }
  AS.reducedMotion = reducedMotion;

  var hasIO = 'IntersectionObserver' in window;
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* ---------------------------------------------------------
     1. Aparición al scroll
     --------------------------------------------------------- */
  var DEFAULT_STEP = 110;
  var revealIO = hasIO ? new IntersectionObserver(onReveal, {
    rootMargin: '0px 0px -12% 0px',
    threshold: 0
  }) : null;

  function groupOf(el) {
    var p = el.parentElement;
    if (p && p.hasAttribute('data-reveal-group')) return p;
    return null;
  }

  function onReveal(entries) {
    // Ordena por posición en el documento para escalonar en orden de lectura
    var batch = [];
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) batch.push(entries[i].target);
    }
    batch.sort(function (a, b) {
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    var counters = [];
    for (var j = 0; j < batch.length; j++) {
      var el = batch[j];
      var delay = parseInt(el.getAttribute('data-reveal-delay'), 10) || 0;
      var g = groupOf(el);
      if (g) {
        var c = null;
        for (var k = 0; k < counters.length; k++) if (counters[k].g === g) c = counters[k];
        if (!c) { c = { g: g, n: 0 }; counters.push(c); }
        var step = parseInt(g.getAttribute('data-reveal-step'), 10);
        if (isNaN(step)) step = DEFAULT_STEP;
        delay += (parseInt(g.getAttribute('data-reveal-delay'), 10) || 0) + c.n * step;
        c.n++;
      }
      if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
      el.classList.add('is-revealed');
      revealIO.unobserve(el);
    }
  }

  function reveal(scope) {
    scope = scope || document;
    var items = [];
    var direct = scope.querySelectorAll('[data-reveal]');
    for (var i = 0; i < direct.length; i++) items.push(direct[i]);
    var groups = scope.querySelectorAll('[data-reveal-group]');
    if (scope.nodeType === 1 && scope.hasAttribute('data-reveal-group')) groups = [scope].concat([].slice.call(groups));
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].children;
      for (var k = 0; k < kids.length; k++) if (items.indexOf(kids[k]) < 0) items.push(kids[k]);
    }
    for (var n = 0; n < items.length; n++) {
      var el = items[n];
      if (el.classList.contains('is-revealed')) continue;
      if (!revealIO || reducedMotion()) { el.classList.add('is-revealed'); continue; }
      revealIO.observe(el);
    }
  }
  AS.reveal = reveal;
  reveal(document);

  /* ---------------------------------------------------------
     2. Header: transparente sobre el hero, sólido al scrollear
     --------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  var hero = document.getElementById('inicio');

  function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-solid', window.pageYOffset > 24 || root.classList.contains('menu-open'));
  }

  /* ---------------------------------------------------------
     3. Sección activa en el nav
     --------------------------------------------------------- */
  var navLinks = [].slice.call(document.querySelectorAll('.nav a[href^="#"], .mobile-menu-links a[href^="#"]'));
  function setActive(id) {
    for (var i = 0; i < navLinks.length; i++) {
      var on = navLinks[i].getAttribute('href') === '#' + id;
      navLinks[i].classList.toggle('is-active', on);
      if (on) navLinks[i].setAttribute('aria-current', 'true');
      else navLinks[i].removeAttribute('aria-current');
    }
  }
  if (hasIO && navLinks.length) {
    var sections = document.querySelectorAll('main > section, main > div > section');
    var activeIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) setActive(entries[i].target.id || '');
      }
    }, { rootMargin: '-45% 0px -54% 0px', threshold: 0 });
    for (var s = 0; s < sections.length; s++) activeIO.observe(sections[s]);
  }

  /* ---------------------------------------------------------
     4. Menú móvil
     --------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu-movil');
  var inertTargets = [].slice.call(document.querySelectorAll('main, .site-footer, .wa-float'));

  function menuIsOpen() { return root.classList.contains('menu-open'); }
  function focusables() {
    return [toggle].concat([].slice.call(menu.querySelectorAll('a[href]')));
  }
  function setMenu(open, returnFocus) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
    for (var i = 0; i < inertTargets.length; i++) {
      if (open) inertTargets[i].setAttribute('inert', '');
      else inertTargets[i].removeAttribute('inert');
    }
    updateHeader();
    if (open) {
      requestAnimationFrame(function () {
        var first = menu.querySelector('a[href]');
        if (first) first.focus({ preventScroll: true });
      });
    } else if (returnFocus) {
      toggle.focus({ preventScroll: true });
    }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(!menuIsOpen(), false); });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (a) setMenu(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (!menuIsOpen()) return;
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); setMenu(false, true); return; }
      if (e.key === 'Tab') {
        var f = focusables();
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (f.indexOf(document.activeElement) < 0) { e.preventDefault(); first.focus(); }
      }
    });
    if (mobileMQ) {
      var onMQ = function (e) { if (!e.matches && menuIsOpen()) setMenu(false, false); };
      if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', onMQ);
      else if (mobileMQ.addListener) mobileMQ.addListener(onMQ);
    }
  }

  /* ---------------------------------------------------------
     5. Videos en loop (portada, taller, nosotros)
        Cada <video data-video> trae sus <source data-src="...">.
        - No se descarga NADA hasta que el video entra en pantalla
          (preload="none" y las rutas recién se copian a src acá).
        - Se pausa al salir de pantalla y sigue al volver.
        - Con "reducir movimiento" o "ahorro de datos" no se carga:
          queda el poster (o la foto de fondo, en la portada).
        - Botón discreto de pausa/reproducción (WCAG 2.2.2), que
          aparece cuando el video arranca.
        - Fundido suave: el video arranca transparente sobre su poster
          (una <img class="vid-poster"> con loading="lazy" debajo del video;
          en Nosotros, la foto; en la portada, la foto de fondo).
     --------------------------------------------------------- */
  var ICONO_PAUSA = '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 1.5h2v9H3zM7 1.5h2v9H7z" fill="currentColor"/></svg>';
  var ICONO_PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 1.2 10.5 6 3 10.8z" fill="currentColor"/></svg>';

  function ahorroDatos() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
  }

  var videos = [].slice.call(document.querySelectorAll('video[data-video]'));
  var sinVideo = reducedMotion() || ahorroDatos();

  function prepararVideo(v) {
    var esPortada = v.hasAttribute('data-hero-video');
    if (sinVideo) {
      // La portada tiene la foto de fondo detrás: el video sobra. El resto queda
      // transparente (sin descargar nada) y se ve el poster que tiene debajo.
      if (esPortada) v.parentNode.removeChild(v);
      else v.classList.add('vid-espera');
      return null;
    }
    var marco = v.closest('[data-video-marco]') || v.parentNode;
    var nombre = v.getAttribute('data-video-nombre') || '';
    var estado = { v: v, cargado: false, enPantalla: false, pausadoPorUsuario: false, boton: null };
    v.muted = true;
    v.classList.add('vid-espera');   // transparente hasta que arranca (se ve el poster de abajo)

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'vid-pausa' + (esPortada ? ' vid-pausa--portada' : '');
    b.hidden = true;
    marco.appendChild(b);
    estado.boton = b;
    function pintarBoton() {
      var pausado = estado.pausadoPorUsuario;
      b.innerHTML = pausado ? ICONO_PLAY : ICONO_PAUSA;
      b.setAttribute('aria-label', (pausado ? 'Reproducir video' : 'Pausar video') + (nombre ? ' ' + nombre : ''));
    }
    pintarBoton();
    b.addEventListener('click', function () {
      estado.pausadoPorUsuario = !estado.pausadoPorUsuario;
      if (estado.pausadoPorUsuario) v.pause(); else reproducir(estado);
      pintarBoton();
    });

    v.addEventListener('playing', function () {
      v.classList.add('is-playing');
      b.hidden = false;
    });
    // Si no hay archivo o el formato no sirve, queda el poster y sin botón
    var fuentes = v.querySelectorAll('source[data-src]');
    if (fuentes.length) {
      fuentes[fuentes.length - 1].addEventListener('error', function () { b.hidden = true; });
    }
    return estado;
  }

  function reproducir(e) {
    if (!e.cargado) {
      var fuentes = e.v.querySelectorAll('source[data-src]');
      for (var i = 0; i < fuentes.length; i++) fuentes[i].src = fuentes[i].getAttribute('data-src');
      e.cargado = true;
      e.v.load();
    }
    if (e.pausadoPorUsuario || reducedMotion()) return;
    var p = e.v.play();
    if (p && p.catch) p.catch(function () { /* el navegador no dejó reproducir: queda el poster */ });
  }

  var estadosVideo = [];
  for (var nv = 0; nv < videos.length; nv++) {
    var ev = prepararVideo(videos[nv]);
    if (ev) estadosVideo.push(ev);
  }
  if (estadosVideo.length) {
    if (hasIO) {
      var videoIO = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          for (var k = 0; k < estadosVideo.length; k++) {
            var e = estadosVideo[k];
            if (e.v !== entries[i].target) continue;
            e.enPantalla = entries[i].isIntersecting;
            if (e.enPantalla) reproducir(e);
            else if (e.cargado) e.v.pause();
          }
        }
      }, { threshold: 0 });
      for (var o = 0; o < estadosVideo.length; o++) videoIO.observe(estadosVideo[o].v);
    } else {
      for (var r = 0; r < estadosVideo.length; r++) reproducir(estadosVideo[r]);
    }
    // Si el visitante activa "reducir movimiento" con la página abierta, se frena todo
    if (reduceMQ) {
      var alReducir = function (e) {
        if (!e.matches) return;
        for (var i = 0; i < estadosVideo.length; i++) { estadosVideo[i].v.pause(); estadosVideo[i].boton.hidden = true; }
      };
      if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', alReducir);
      else if (reduceMQ.addListener) reduceMQ.addListener(alReducir);
    }
  }

  /* Carrusel de videos del taller (celular): si se desplaza de costado,
     tiene que poder enfocarse con el teclado para moverlo con las flechas */
  var franja = document.querySelector('[data-taller]');
  if (franja && franja.children.length) {
    var marcarFranja = function () {
      if (franja.scrollWidth > franja.clientWidth + 1) franja.setAttribute('tabindex', '0');
      else franja.removeAttribute('tabindex');
    };
    marcarFranja();
    if ('ResizeObserver' in window) new ResizeObserver(marcarFranja).observe(franja);
    else window.addEventListener('resize', marcarFranja);
  }

  /* ---------------------------------------------------------
     5b. WhatsApp flotante: aparece después del hero
     --------------------------------------------------------- */
  var waFloat = document.querySelector('.wa-float');
  if (hero && hasIO) {
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      var past = !e.isIntersecting && e.boundingClientRect.top < 0;
      if (waFloat) waFloat.classList.toggle('is-visible', past);
    }, { threshold: 0 }).observe(hero);
  } else if (waFloat) {
    waFloat.classList.add('is-visible');
  }

  /* ---------------------------------------------------------
     6. Progreso del Proceso + parallax de Nosotros
     --------------------------------------------------------- */
  var steps = document.querySelector('[data-steps]');
  var parallax = document.querySelector('[data-parallax]');
  var inView = { steps: false, parallax: false };

  function updateSteps() {
    var lis = steps.children;
    var n = lis.length;
    if (!n) return;
    var vh = window.innerHeight;
    var firstTop = lis[0].getBoundingClientRect().top;
    var lastTop = lis[n - 1].getBoundingClientRect().top;
    var i, f;
    if (Math.abs(firstTop - lastTop) < 4) {
      // En fila (escritorio): una sola línea avanza paso a paso
      var start = vh * 0.85, end = vh * 0.35;
      var t = clamp((start - firstTop) / (start - end), 0, 1);
      var p = 1 + t * (n - 1);
      for (i = 0; i < n; i++) {
        f = i === 0 ? 1 : clamp(p - i, 0, 1);
        lis[i].style.setProperty('--fill', f.toFixed(3));
      }
    } else {
      // Apilado (móvil/tablet): cada filete se llena al entrar
      for (i = 0; i < n; i++) {
        var top = lis[i].getBoundingClientRect().top;
        f = i === 0 ? 1 : clamp((vh * 0.88 - top) / (vh * 0.28), 0, 1);
        lis[i].style.setProperty('--fill', f.toFixed(3));
      }
    }
  }

  function updateParallax() {
    var r = parallax.getBoundingClientRect();
    var vh = window.innerHeight;
    var amp = mobileMQ && mobileMQ.matches ? 14 : 24;
    var k = clamp(((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
    // En el marco (no en la foto): así lo heredan la foto y el video, si lo hay
    parallax.style.setProperty('--parallax', (-k * amp).toFixed(1) + 'px');
  }

  var ticking = false;
  function onFrame() {
    ticking = false;
    updateHeader();
    if (reducedMotion()) return;
    if (steps && inView.steps) updateSteps();
    if (parallax && inView.parallax) updateParallax();
  }
  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }

  if (hasIO) {
    var modIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var t = entries[i].target;
        if (t === steps) inView.steps = entries[i].isIntersecting;
        if (t === parallax) inView.parallax = entries[i].isIntersecting;
      }
      requestTick();
    }, { rootMargin: '120px 0px 120px 0px' });
    if (steps) modIO.observe(steps);
    if (parallax) modIO.observe(parallax);
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  updateHeader();
  requestTick();
})();
