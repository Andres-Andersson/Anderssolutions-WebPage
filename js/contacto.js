/* AndersSolutions — "Contanos tu proyecto": armador de mensaje de WhatsApp.
   Lee las opciones elegidas en <form data-armador> y actualiza en vivo el
   href del botón "Enviar por WhatsApp" (un <a> real a wa.me) y la vista previa.
   No guarda ni envía nada a ningún servidor. Sin dependencias.

   Textos del mensaje: salen de los atributos de cada opción en index.html
     data-objeto  →  "Quiero consultar por ___"        (¿Qué mueble?)
     data-texto   →  se suma a esa frase con coma       (", línea Elite", ", en Canning")
     data-frase   →  frase aparte al final              ("Para cuándo: en unos meses.")
   Los botones con data-linea="Elite" (tarjetas de Líneas) preseleccionan la línea. */
(function () {
  'use strict';

  var form = document.querySelector('[data-armador]');
  if (!form) return;

  var TEL = (form.getAttribute('data-telefono') || '5491121872121').replace(/\D/g, '');
  var OBJETO_DEFECTO = 'un mueble a medida';
  var link = form.querySelector('.arm-enviar');
  var vista = form.querySelector('[data-arm-texto]');
  var nombre = form.querySelector('input[name="nombre"]');
  var otraCaja = form.querySelector('[data-arm-otra]');     // campo "¿Cuál?" de Otra zona
  var otraZona = form.querySelector('input[name="zona_otra"]');
  var grupos = Array.prototype.slice.call(form.querySelectorAll('fieldset'));
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var anterior = {};   // última opción marcada por grupo (para poder desmarcar)

  function limpiarNombre(v) {
    return (v || '').replace(/\s+/g, ' ').trim().replace(/^[\s.,;:!?¡¿-]+|[\s.,;:!?¡¿-]+$/g, '').slice(0, 40);
  }

  function mensaje() {
    var nom = nombre ? limpiarNombre(nombre.value) : '';
    var objeto = '', partes = [], frases = [];
    grupos.forEach(function (fs) {
      var r = fs.querySelector('input[type="radio"]:checked');
      if (!r) return;
      if (r.getAttribute('data-objeto')) objeto = r.getAttribute('data-objeto');
      if (r.name === 'zona' && r.value === 'Otra zona' && otraZona && limpiarNombre(otraZona.value)) {
        partes.push('en ' + limpiarNombre(otraZona.value));
      } else if (r.getAttribute('data-texto')) partes.push(r.getAttribute('data-texto'));
      if (r.getAttribute('data-frase')) frases.push(r.getAttribute('data-frase'));
    });
    var s = nom ? 'Hola, soy ' + nom + '. Quiero consultar por ' : 'Hola, quiero consultar por ';
    s += (objeto || OBJETO_DEFECTO);
    if (partes.length) s += ', ' + partes.join(', ');
    s += '.';
    if (frases.length) s += ' ' + frases.join(' ');
    return s;
  }

  function actualizar() {
    if (otraCaja) {
      var otra = form.querySelector('input[name="zona"][value="Otra zona"]');
      otraCaja.hidden = !(otra && otra.checked);
    }
    var m = mensaje();
    if (link) link.href = 'https://wa.me/' + TEL + '?text=' + encodeURIComponent(m);
    if (vista) vista.textContent = m;
    anterior = {};
    Array.prototype.forEach.call(form.querySelectorAll('input[type="radio"]:checked'), function (r) {
      anterior[r.name] = r.value;
    });
  }

  form.addEventListener('change', actualizar);
  if (nombre) nombre.addEventListener('input', actualizar);
  if (otraZona) otraZona.addEventListener('input', actualizar);

  // Tocar de nuevo una opción ya elegida la desmarca (los radios solos no lo permiten)
  form.addEventListener('click', function (e) {
    var r = e.target;
    if (!r || r.type !== 'radio') return;
    if (anterior[r.name] === r.value && r.checked) {
      r.checked = false;
      actualizar();
    }
  });

  // Enter en el campo del nombre: abre WhatsApp con el mensaje (el mismo link)
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (link) link.click();
  });

  // Preselección desde las tarjetas de Líneas (siguen yendo a #contacto)
  Array.prototype.forEach.call(document.querySelectorAll('[data-linea]'), function (a) {
    a.addEventListener('click', function () {
      var v = a.getAttribute('data-linea');
      var r = null;
      Array.prototype.forEach.call(form.querySelectorAll('input[name="linea"]'), function (x) {
        if (x.value === v) r = x;
      });
      if (!r) return;
      r.checked = true;
      actualizar();
      var chip = r.closest ? r.closest('.arm-chip') : null;
      if (chip && !(mqReduce && mqReduce.matches)) {
        chip.classList.remove('arm-recien');
        void chip.offsetWidth;
        chip.classList.add('arm-recien');
        setTimeout(function () { chip.classList.remove('arm-recien'); }, 2000);
      }
    });
  });

  // El botón flotante de WhatsApp se oculta mientras se ve Contacto: ahí ya está
  // el armador, y en el celular tapaba el campo del nombre
  var flotante = document.querySelector('.wa-float');
  var seccion = document.getElementById('contacto');
  if (flotante && seccion && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      flotante.classList.toggle('is-en-contacto', entradas[0].isIntersecting);
    }, { rootMargin: '0px 0px -25% 0px' }).observe(seccion);
  }

  // Estado inicial (el navegador puede restaurar opciones al volver atrás)
  actualizar();
})();
