/* AndersSolutions — componentes interactivos ("Encendé la luz" y comparador render/real).
   Vanilla JS, sin dependencias. Si este archivo no carga, las fotos encendidas
   y el comparador al 50 % se ven igual. */
(function () {
  'use strict';

  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduce() { return !!(mqReduce && mqReduce.matches); }

  function toArray(list) { return Array.prototype.slice.call(list); }

  function alEntrar(el, umbral, fn) {
    if (!('IntersectionObserver' in window)) { fn(false); return null; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); fn(true); }
      });
    }, { threshold: umbral });
    io.observe(el);
    return io;
  }

  /* Selector de muebles: miniaturas, solo si hay más de un elemento.
     prefijo: "luz" o "cmp". Devuelve el contenedor o null. */
  function crearSelector(prefijo, items, destino, alElegir) {
    if (items.length < 2 || !destino) return null;
    var grupo = document.createElement('div');
    grupo.className = prefijo + '-selector';
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-label', 'Elegir mueble');
    var botones = items.map(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = prefijo + '-mini';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      var nombre = item.getAttribute('data-nombre') || ('Mueble ' + (i + 1));
      var fuente = item.querySelector('img[data-mini], img');
      if (fuente) {
        var m = document.createElement('img');
        m.src = fuente.getAttribute('data-mini') || fuente.getAttribute('src');
        m.alt = '';
        m.loading = 'lazy';
        m.decoding = 'async';
        b.appendChild(m);
      }
      var t = document.createElement('span');
      t.className = prefijo + '-oculto';
      t.textContent = nombre;
      b.appendChild(t);
      b.addEventListener('click', function () {
        botones.forEach(function (o, j) { o.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        alElegir(i);
      });
      grupo.appendChild(b);
      return b;
    });
    destino.appendChild(grupo);
    return grupo;
  }

  function mostrarSolo(items, indice) {
    items.forEach(function (it, i) {
      if (i === indice) it.removeAttribute('hidden');
      else it.setAttribute('hidden', '');
    });
  }

  /* ======================================================================
     COMPONENTE 1 — Encendé la luz
     ====================================================================== */
  function prepararPieza(pieza) {
    var on = pieza.querySelector('.luz-img-on');
    if (!on || pieza.querySelector('.luz-capa-off')) return;

    var capa = document.createElement('div');
    capa.className = 'luz-capa-off';
    capa.setAttribute('aria-hidden', 'true');

    var real = pieza.getAttribute('data-off');
    var off;
    if (real) {
      // Foto real apagada: se usa tal cual, sin simulación.
      off = document.createElement('img');
      off.src = real;
      var srcsetOff = pieza.getAttribute('data-off-srcset');
      if (srcsetOff) {
        off.srcset = srcsetOff;
        off.sizes = on.getAttribute('sizes') || '100vw';
      }
      off.alt = '';
      off.decoding = 'async';
      capa.classList.add('luz-capa-real');
    } else {
      // Simulación: la misma foto encendida con tratamiento CSS.
      off = on.cloneNode(false);
      off.removeAttribute('id');
      off.removeAttribute('class');
      off.alt = '';
      capa.classList.add('luz-capa-sim');
    }
    capa.appendChild(off);
    pieza.insertBefore(capa, on);

    if (!pieza.querySelector('.luz-bloom')) {
      var bloom = document.createElement('span');
      bloom.className = 'luz-bloom';
      bloom.setAttribute('aria-hidden', 'true');
      pieza.appendChild(bloom);
    }
  }

  function iniciarLuz(sec) {
    var escena = sec.querySelector('.luz-escena');
    var sw = sec.querySelector('.luz-interruptor');
    var controles = sec.querySelector('.luz-controles');
    var piezas = toArray(sec.querySelectorAll('.luz-pieza'));
    if (!escena || !sw || !piezas.length) return;

    piezas.forEach(prepararPieza);
    mostrarSolo(piezas, 0);
    escena.classList.add('luz-js');
    if (controles) controles.removeAttribute('hidden');

    var tocado = false;
    var timerAuto = 0;
    var timerBloom = 0;

    function poner(encendida, animar) {
      escena.classList.toggle('luz-apagada', !encendida);
      sw.setAttribute('aria-checked', encendida ? 'true' : 'false');
      clearTimeout(timerBloom);
      escena.classList.remove('luz-encendiendo');
      if (encendida && animar && !reduce()) {
        void escena.offsetWidth; // reinicia la animación del bloom
        escena.classList.add('luz-encendiendo');
        timerBloom = setTimeout(function () { escena.classList.remove('luz-encendiendo'); }, 2100);
      }
    }

    sw.addEventListener('click', function () {
      tocado = true;
      clearTimeout(timerAuto);
      poner(sw.getAttribute('aria-checked') !== 'true', true);
    });

    crearSelector('luz', piezas, controles || escena, function (i) {
      mostrarSolo(piezas, i);
      if (sw.getAttribute('aria-checked') === 'true') poner(true, true);
    });

    if (reduce() || !('IntersectionObserver' in window)) {
      poner(true, false);
      return;
    }
    // Arranca apagado; se enciende solo la primera vez que entra en pantalla.
    poner(false, false);
    alEntrar(escena, 0.45, function () {
      timerAuto = setTimeout(function () {
        if (!tocado) poner(true, true);
      }, 650);
    });
  }

  /* ======================================================================
     COMPONENTE 2 — Comparador render 3D / resultado real
     ====================================================================== */
  function iniciarPar(par) {
    var rango = par.querySelector('.cmp-rango');
    if (!rango) return null;
    var pos = parseFloat(rango.value) || 50;
    var interactuado = false;
    var anim = 0;

    function setPos(v) {
      v = Math.max(0, Math.min(100, v));
      pos = v;
      par.style.setProperty('--cmp-pos', v + '%');
      var r = Math.round(v);
      if (String(rango.value) !== String(r)) rango.value = r;
      rango.setAttribute('aria-valuetext', r + ' % render 3D, ' + (100 - r) + ' % resultado real');
    }
    function cortarAnim() {
      interactuado = true;
      if (anim) { cancelAnimationFrame(anim); anim = 0; }
    }
    function xAPos(clientX) {
      var rect = par.getBoundingClientRect();
      return rect.width ? ((clientX - rect.left) / rect.width) * 100 : pos;
    }

    rango.addEventListener('input', function () { cortarAnim(); setPos(parseFloat(rango.value)); });

    // Arrastre con mouse y táctil. En táctil solo se toma el gesto si es
    // horizontal: si el dedo va vertical, el navegador hace scroll (pan-y).
    var id = null, x0 = 0, y0 = 0, activo = false;
    par.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; x0 = e.clientX; y0 = e.clientY;
      activo = e.pointerType === 'mouse';
      cortarAnim();
      if (activo) {
        e.preventDefault();
        try { par.setPointerCapture(id); } catch (err) { /* nada */ }
        setPos(xAPos(e.clientX));
      }
    });
    par.addEventListener('pointermove', function (e) {
      if (e.pointerId !== id) return;
      if (!activo) {
        var dx = Math.abs(e.clientX - x0), dy = Math.abs(e.clientY - y0);
        if (dx > 6 && dx > dy) {
          activo = true;
          try { par.setPointerCapture(id); } catch (err) { /* nada */ }
        } else return;
      }
      setPos(xAPos(e.clientX));
    });
    function fin(e) {
      if (e.pointerId !== id) return;
      // Un toque corto (sin arrastre) también mueve la manija.
      if (!activo && e.type === 'pointerup' &&
          Math.abs(e.clientX - x0) < 6 && Math.abs(e.clientY - y0) < 6) {
        setPos(xAPos(e.clientX));
      }
      if (activo && e.type === 'pointerup' && rango.focus) {
        try { rango.focus({ preventScroll: true }); } catch (err) { /* nada */ }
      }
      id = null; activo = false;
    }
    par.addEventListener('pointerup', fin);
    par.addEventListener('pointercancel', fin);

    // Vaivén breve que insinúa que se puede arrastrar.
    function vaiven() {
      if (interactuado || reduce() || par.hasAttribute('hidden')) return;
      var base = pos, dur = 1700, t0 = 0;
      function paso(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var amp = 9 * (1 - k);
        setPos(base + amp * Math.sin(k * Math.PI * 2));
        if (k < 1 && !interactuado) anim = requestAnimationFrame(paso);
        else { anim = 0; if (!interactuado) setPos(base); }
      }
      anim = requestAnimationFrame(paso);
    }

    setPos(pos);
    return { vaiven: vaiven };
  }

  function iniciarCmp(sec) {
    var escena = sec.querySelector('.cmp-escena');
    var pares = toArray(sec.querySelectorAll('.cmp-par'));
    if (!escena || !pares.length) return;
    sec.classList.add('cmp-js');
    var ctrl = pares.map(iniciarPar);
    mostrarSolo(pares, 0);
    var visto = false;
    var actual = 0;

    crearSelector('cmp', pares, sec.querySelector('.cmp-controles') || escena.parentNode, function (i) {
      actual = i;
      mostrarSolo(pares, i);
    });

    if (!reduce()) {
      alEntrar(escena, 0.5, function (soportado) {
        if (!soportado || visto) return;
        visto = true;
        setTimeout(function () { if (ctrl[actual]) ctrl[actual].vaiven(); }, 500);
      });
    }
  }

  function iniciar() {
    toArray(document.querySelectorAll('.luz-seccion')).forEach(iniciarLuz);
    toArray(document.querySelectorAll('.cmp-seccion')).forEach(iniciarCmp);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
