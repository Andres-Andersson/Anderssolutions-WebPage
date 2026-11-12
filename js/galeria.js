/* Galería de proyectos + visor — AndersSolutions
   Mejora progresiva: toma las <figure data-cat> del HTML y agrega
   filtros, mosaico ordenado por filas y visor a pantalla completa.
   Sin dependencias. */
(function () {
  'use strict';

  var ORDEN = ['cocinas', 'vestidores', 'placares', 'cristaleros'];
  var SALIDA_MS = 280;
  var movReducido = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function norm(s) {
    return (s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function sinMovimiento() { return movReducido.matches; }

  /* Devuelve la URL de mayor ancho del srcset (la -1600.webp) */
  function srcGrande(img) {
    var mejor = null, mejorW = -1;
    (img.getAttribute('srcset') || '').split(',').forEach(function (parte) {
      var p = parte.trim().split(/\s+/);
      if (!p[0]) return;
      var w = parseInt(p[1], 10) || 0;
      if (w > mejorW) { mejorW = w; mejor = p[0]; }
    });
    return mejor || img.getAttribute('src');
  }

  function icono(d) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="square" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  }

  /* ================= Visor (uno solo para toda la página) ================= */
  var lb = null, lbImg, lbCat, lbDesc, lbContador, lbCerrar, lbPrev, lbNext, lbEscenario;
  var lista = [], actual = 0, abridor = null, cierreTimer = null, cambioTimer = null;
  var inertes = [], bodyPrev = null;

  function crearVisor() {
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Visor de proyectos');
    lb.innerHTML =
      '<div class="lb-barra">' +
        '<p class="lb-contador" aria-live="polite"></p>' +
        '<button type="button" class="lb-btn lb-cerrar">Cerrar' + icono('M5 5l14 14M19 5L5 19') + '</button>' +
      '</div>' +
      '<div class="lb-escenario">' +
        '<img class="lb-img" alt="" decoding="async">' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Foto anterior">' + icono('M15 4l-8 8 8 8') + '</button>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Foto siguiente">' + icono('M9 4l8 8-8 8') + '</button>' +
      '</div>' +
      '<div class="lb-epigrafe"><span class="lb-cat"></span><span class="lb-desc"></span></div>';
    document.body.appendChild(lb);

    lbImg = lb.querySelector('.lb-img');
    lbCat = lb.querySelector('.lb-cat');
    lbDesc = lb.querySelector('.lb-desc');
    lbContador = lb.querySelector('.lb-contador');
    lbCerrar = lb.querySelector('.lb-cerrar');
    lbPrev = lb.querySelector('.lb-prev');
    lbNext = lb.querySelector('.lb-next');
    lbEscenario = lb.querySelector('.lb-escenario');

    lbCerrar.addEventListener('click', cerrar);
    lbPrev.addEventListener('click', function () { mostrar(actual - 1, -1); });
    lbNext.addEventListener('click', function () { mostrar(actual + 1, 1); });

    // Click en el fondo (fuera de la foto y de los botones) cierra
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target === lbEscenario ||
          e.target.classList.contains('lb-barra') || e.target.classList.contains('lb-epigrafe')) cerrar();
    });

    lb.addEventListener('keydown', teclado);
    gestos();
  }

  function enfocables() {
    return [lbCerrar, lbPrev, lbNext].filter(function (b) { return !b.hidden; });
  }

  function teclado(e) {
    switch (e.key) {
      case 'Escape': e.preventDefault(); cerrar(); break;
      case 'ArrowRight': e.preventDefault(); mostrar(actual + 1, 1); break;
      case 'ArrowLeft': e.preventDefault(); mostrar(actual - 1, -1); break;
      case 'Home': e.preventDefault(); mostrar(0, -1); break;
      case 'End': e.preventDefault(); mostrar(lista.length - 1, 1); break;
      case 'Tab':
        var f = enfocables(), i = f.indexOf(document.activeElement);
        e.preventDefault();
        if (i === -1) { f[0].focus(); break; }
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        break;
    }
  }

  function gestos() {
    var x0 = null, y0 = 0, dx = 0, horizontal = null;
    lbEscenario.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; horizontal = null;
    }, { passive: true });
    lbEscenario.addEventListener('touchmove', function (e) {
      if (x0 === null) return;
      var mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (horizontal === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) horizontal = Math.abs(mx) > Math.abs(my);
      if (!horizontal) return;
      dx = mx;
      if (!sinMovimiento() && lista.length > 1) {
        lbImg.classList.add('lb-arrastrando');
        lbImg.style.transform = 'translateX(' + (dx * 0.4) + 'px)';
      }
    }, { passive: true });
    function fin() {
      if (x0 === null) return;
      lbImg.classList.remove('lb-arrastrando');
      lbImg.style.transform = '';
      if (horizontal && Math.abs(dx) > 50 && lista.length > 1) mostrar(actual + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      x0 = null;
    }
    lbEscenario.addEventListener('touchend', fin);
    lbEscenario.addEventListener('touchcancel', fin);
  }

  function datosDe(fig) {
    var img = fig.querySelector('img');
    var cat = fig.querySelector('.gal-cat');
    var desc = fig.querySelector('.gal-desc');
    return {
      img: img,
      cat: cat ? cat.textContent.trim() : (fig.getAttribute('data-cat') || ''),
      desc: desc ? desc.textContent.trim() : (img.getAttribute('alt') || ''),
      grande: srcGrande(img)
    };
  }

  function precargar(i) {
    if (lista.length < 2) return;
    var d = datosDe(lista[(i + lista.length) % lista.length]);
    var pre = new Image();
    pre.decoding = 'async';
    pre.src = d.grande;
  }

  function pintar(i) {
    var d = datosDe(lista[i]);
    var chica = d.img.currentSrc || d.img.getAttribute('src');
    lbImg.setAttribute('width', d.img.getAttribute('width') || '');
    lbImg.setAttribute('height', d.img.getAttribute('height') || '');
    lbImg.alt = d.img.getAttribute('alt') || '';
    // Primero la versión chica (ya en caché), después la -1600 cuando esté lista
    lbImg.src = chica;
    if (d.grande && d.grande !== chica) {
      var grande = new Image();
      grande.src = d.grande;
      var aplicar = function () { if (actual === i && lista[i]) lbImg.src = d.grande; };
      if (grande.decode) grande.decode().then(aplicar, aplicar); else grande.onload = aplicar;
    }
    lbCat.textContent = d.cat;
    lbDesc.textContent = d.desc;
    lbContador.innerHTML = '<b>' + (i + 1) + '</b> / ' + lista.length;
    precargar(i + 1);
    precargar(i - 1);
  }

  function mostrar(i, dir) {
    if (!lista.length) return;
    i = (i + lista.length) % lista.length;
    if (i === actual && lbImg.getAttribute('src')) return;
    actual = i;
    clearTimeout(cambioTimer);
    if (sinMovimiento()) { pintar(i); return; }
    lbImg.classList.remove('lb-sale-izq', 'lb-sale-der');
    lbImg.classList.add('lb-sale', dir > 0 ? 'lb-sale-izq' : 'lb-sale-der');
    cambioTimer = setTimeout(function () {
      pintar(i);
      lbImg.classList.remove('lb-sale-izq', 'lb-sale-der');
      lbImg.classList.add('lb-arrastrando', dir > 0 ? 'lb-sale-der' : 'lb-sale-izq');
      void lbImg.offsetWidth;
      lbImg.classList.remove('lb-arrastrando', 'lb-sale', 'lb-sale-izq', 'lb-sale-der');
    }, 200);
  }

  /* Al bloquear el scroll desaparece la barra y todo se correría a la derecha.
     Donde se puede, el hueco de la barra queda reservado siempre
     (scrollbar-gutter: stable en css/galeria.css) y no hay que compensar nada.
     Si no, se compensa con padding en el body y en el header fijo. */
  var reservaBarra = !!(window.CSS && CSS.supports && CSS.supports('scrollbar-gutter', 'stable'));
  function bloquear() {
    var ancho = window.innerWidth - document.documentElement.clientWidth;
    var header = document.querySelector('.site-header');
    bodyPrev = { pr: document.body.style.paddingRight, header: header, hr: header ? header.style.paddingRight : '' };
    if (ancho > 0 && !reservaBarra) {
      document.body.style.paddingRight = ancho + 'px';
      if (header) header.style.paddingRight = ancho + 'px';
    }
    document.documentElement.classList.add('lb-bloqueado');
    document.body.classList.add('lb-bloqueado');
    inertes = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el !== lb && !el.inert && el.tagName !== 'SCRIPT') { el.inert = true; inertes.push(el); }
    });
  }
  function desbloquear() {
    document.documentElement.classList.remove('lb-bloqueado');
    document.body.classList.remove('lb-bloqueado');
    if (bodyPrev) {
      document.body.style.paddingRight = bodyPrev.pr;
      if (bodyPrev.header) bodyPrev.header.style.paddingRight = bodyPrev.hr;
    }
    inertes.forEach(function (el) { el.inert = false; });
    inertes = [];
  }

  function abrir(figs, i, desde) {
    if (!lb) crearVisor();
    clearTimeout(cierreTimer);
    lista = figs;
    abridor = desde || document.activeElement;
    var varias = lista.length > 1;
    lbPrev.hidden = !varias;
    lbNext.hidden = !varias;
    actual = i;
    pintar(i);
    var yaAbierto = !lb.hidden && lb.classList.contains('lb-abierto');
    lb.hidden = false;
    if (!yaAbierto) bloquear();
    void lb.offsetWidth;
    lb.classList.add('lb-abierto');
    lbCerrar.focus({ preventScroll: true });
  }

  function cerrar() {
    if (!lb || lb.hidden) return;
    lb.classList.remove('lb-abierto');
    desbloquear();
    if (abridor && abridor.focus) abridor.focus({ preventScroll: true });
    var fin = function () { lb.hidden = true; lbImg.removeAttribute('src'); };
    if (sinMovimiento()) fin(); else cierreTimer = setTimeout(fin, 450);
  }

  /* ================= Galería ================= */
  function iniciar(root) {
    if (root.hasAttribute('data-gal-lista')) return;
    root.setAttribute('data-gal-lista', '');
    var grid = root.querySelector('.gal-grid');
    if (!grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll('figure'));
    if (!items.length) return;

    var cats = {};
    items.forEach(function (fig) {
      var img = fig.querySelector('img');
      if (!img) return;
      fig.classList.add('gal-item');
      var nombre = (fig.getAttribute('data-cat') || 'Otros').trim();
      var clave = norm(nombre);
      fig.setAttribute('data-gal-clave', clave);
      if (!cats[clave]) cats[clave] = { nombre: nombre, n: 0 };
      cats[clave].n++;

      // Epígrafe automático si falta
      if (!fig.querySelector('figcaption')) {
        var cap = document.createElement('figcaption');
        cap.innerHTML = '<span class="gal-cat"></span> <span class="gal-desc"></span>';
        cap.firstChild.textContent = nombre;
        cap.lastChild.textContent = img.getAttribute('alt') || '';
        fig.appendChild(cap);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gal-abrir';
      btn.setAttribute('aria-label', 'Ver en grande: ' + (img.getAttribute('alt') || nombre));
      btn.addEventListener('click', function () {
        var visibles = items.filter(function (f) { return !f.hidden; });
        abrir(visibles, Math.max(0, visibles.indexOf(fig)), btn);
      });
      fig.appendChild(btn);
    });

    root.classList.add('gal-js');

    /* --- Mosaico en filas justificadas ---
       Las fotos se reparten en filas (en el orden del HTML) y cada fila ocupa
       todo el ancho con todas sus fotos a la misma altura, sin recortar.
       El reparto se elige entre todas las combinaciones posibles para que las
       alturas queden cerca de la ideal; así la última fila también cierra
       prolija, haya las fotos que haya. Si quedan muy pocas fotos (por ejemplo
       al filtrar) y llenar el ancho las haría enormes, la fila se limita a una
       altura máxima y se centra. */
    function proporcion(fig) {
      var img = fig.querySelector('img');
      var w = parseFloat(img.getAttribute('width')) || img.naturalWidth || 4;
      var h = parseFloat(img.getAttribute('height')) || img.naturalHeight || 3;
      return { w: w, h: h, a: w / h };
    }
    function medidas(W) {
      // ideal, mínima y máxima altura de fila (en px) y máximo de fotos por fila
      if (W >= 900) return { ideal: W * 0.3, min: W * 0.17, max: W * 0.5, porFila: 4 };
      if (W >= 560) return { ideal: W * 0.4, min: W * 0.22, max: W * 0.72, porFila: 3 };
      return { ideal: W * 0.62, min: W * 0.34, max: W * 1.15, porFila: 2 };
    }
    function repartir(as, W, gap, m) {
      var n = as.length, costo = [0], corte = [0];
      for (var j = 1; j <= n; j++) {
        costo[j] = Infinity;
        var suma = 0;
        for (var i = j - 1; i >= 0 && j - i <= m.porFila; i--) {
          suma += as[i];
          var k = j - i;
          var h = (W - (k - 1) * gap) / suma;
          var c;
          if (h > m.max) {
            // No llena el ancho: se castiga según cuánto espacio queda vacío
            var vacio = 1 - (m.max * suma + (k - 1) * gap) / W;
            c = Math.pow((m.max - m.ideal) / m.ideal, 2) + 6 * vacio;
          } else {
            c = Math.pow((h - m.ideal) / m.ideal, 2);
            if (h < m.min) c += 4 * Math.pow((m.min - h) / m.min, 2) + 1;
          }
          if (costo[i] + c < costo[j]) { costo[j] = costo[i] + c; corte[j] = i; }
        }
      }
      var filas = [];
      for (var f = n; f > 0; f = corte[f]) filas.unshift([corte[f], f]);
      return filas;
    }

    var ultimoAncho = -1, ultimaFirma = '';
    function maquetar(forzar) {
      var visibles = items.filter(function (f) { return !f.hidden; });
      var W = grid.clientWidth;
      if (!W) return;
      if (!forzar && W === ultimoAncho) return;
      ultimoAncho = W;
      var gap = parseFloat(getComputedStyle(root).getPropertyValue('--gal-gap')) || 16;
      var m = medidas(W);
      var datos = visibles.map(proporcion);
      var filas = repartir(datos.map(function (d) { return d.a; }), W, gap, m);

      var firma = filas.map(function (r) {
        return visibles.slice(r[0], r[1]).map(function (f) { return items.indexOf(f); }).join(',');
      }).join('|');
      if (firma !== ultimaFirma) {
        ultimaFirma = firma;
        var activo = document.activeElement;
        var enGrilla = activo && grid.contains(activo);
        var frag = document.createDocumentFragment();
        filas.forEach(function (r) {
          var fila = document.createElement('div');
          fila.className = 'gal-fila';
          visibles.slice(r[0], r[1]).forEach(function (fig) { fila.appendChild(fig); });
          frag.appendChild(fila);
        });
        items.forEach(function (fig) { if (fig.hidden) frag.appendChild(fig); });
        grid.textContent = '';
        grid.appendChild(frag);
        if (enGrilla && activo.focus) activo.focus({ preventScroll: true });
      }

      filas.forEach(function (r) {
        var suma = 0, k = r[1] - r[0], i;
        for (i = r[0]; i < r[1]; i++) suma += datos[i].a;
        var h = (W - (k - 1) * gap) / suma;
        var llena = h <= m.max;
        if (!llena) h = m.max;
        for (i = r[0]; i < r[1]; i++) {
          var fig = visibles[i], d = datos[i];
          fig.style.aspectRatio = d.w + ' / ' + d.h;
          // Fila llena: el ancho se reparte en proporción exacta (flex-grow), sin redondeos que la desborden
          fig.style.flex = llena ? d.a + ' 1 0%' : '0 0 ' + (d.a * h).toFixed(2) + 'px';
          var img = fig.querySelector('img');
          if (img) img.sizes = Math.ceil(d.a * h) + 'px';
        }
      });
      medirEpigrafes();
    }

    /* El epígrafe baja (en reposo) lo que ocupa la descripción: se mide por foto,
       porque en fotos angostas la descripción puede ocupar dos líneas */
    function medirEpigrafes() {
      items.forEach(function (fig) {
        var desc = fig.querySelector('.gal-desc');
        if (!desc) return;
        var h = desc.offsetHeight;
        var gapCap = parseFloat(getComputedStyle(desc.parentNode).rowGap) || 0;
        if (h) fig.style.setProperty('--gal-cap-baja', (h + gapCap) + 'px');
        else fig.style.removeProperty('--gal-cap-baja');
      });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medirEpigrafes);

    maquetar(true);
    if ('ResizeObserver' in window) {
      var raf = 0;
      new ResizeObserver(function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { maquetar(false); });
      }).observe(grid);
    } else {
      window.addEventListener('resize', function () { maquetar(false); });
    }

    /* --- Filtros generados a partir de las categorías presentes --- */
    var claves = Object.keys(cats).sort(function (a, b) {
      var ia = ORDEN.indexOf(a), ib = ORDEN.indexOf(b);
      if (ia === -1) ia = 99; if (ib === -1) ib = 99;
      return ia - ib || a.localeCompare(b, 'es');
    });
    var aviso = document.createElement('p');
    aviso.className = 'gal-sr';
    aviso.setAttribute('aria-live', 'polite');
    root.appendChild(aviso);

    if (claves.length < 2) return;

    var nav = document.createElement('div');
    nav.className = 'gal-filtros';
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', 'Filtrar proyectos por tipo de mueble');
    var botones = [];
    function boton(clave, texto, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'gal-filtro';
      b.setAttribute('data-filtro', clave);
      b.setAttribute('aria-pressed', clave === '*' ? 'true' : 'false');
      b.textContent = texto;
      var s = document.createElement('span');
      s.className = 'gal-filtro-n';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = n < 10 ? '0' + n : String(n);
      b.appendChild(s);
      b.addEventListener('click', function () { filtrar(clave); });
      nav.appendChild(b);
      botones.push(b);
    }
    boton('*', 'Todos', items.length);
    claves.forEach(function (c) { boton(c, cats[c].nombre, cats[c].n); });
    root.insertBefore(nav, grid);

    var filtroActual = '*', turno = 0;
    function filtrar(clave) {
      if (clave === filtroActual) return;
      filtroActual = clave;
      var mio = ++turno;
      botones.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-filtro') === clave ? 'true' : 'false');
      });
      var aplicar = function () {
        var visibles = [];
        items.forEach(function (fig) {
          var ver = clave === '*' || fig.getAttribute('data-gal-clave') === clave;
          fig.hidden = !ver;
          if (ver) visibles.push(fig);
        });
        maquetar(true);
        var n = visibles.length;
        aviso.textContent = 'Mostrando ' + n + (n === 1 ? ' proyecto' : ' proyectos') +
          (clave === '*' ? '' : ' de ' + cats[clave].nombre);
        return visibles;
      };
      if (sinMovimiento()) { aplicar(); return; }

      grid.classList.add('gal-saliendo');
      setTimeout(function () {
        if (mio !== turno) return;
        var visibles = aplicar();
        visibles.forEach(function (fig, i) {
          fig.classList.add('gal-entrando');
          fig.style.transitionDelay = Math.min(i, 8) * 50 + 'ms';
        });
        grid.classList.remove('gal-saliendo');
        void grid.offsetWidth;
        visibles.forEach(function (fig) { fig.classList.remove('gal-entrando'); });
        setTimeout(function () {
          if (mio !== turno) return;
          visibles.forEach(function (fig) { fig.style.transitionDelay = ''; });
        }, 1200);
      }, SALIDA_MS);
    }
  }

  function iniciarTodas() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-galeria]'), iniciar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarTodas);
  else iniciarTodas();
})();
