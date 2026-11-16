# Web AndersSolutions: cómo publicarla en GitHub Pages

Contenido de la carpeta: ver "Estructura de archivos" más abajo.
- Por ahora la web se publica en la dirección provisoria de GitHub Pages. El dominio propio se agrega después (punto 2).

## 1. Subir a GitHub
1. En github.com, creá un repositorio público, por ejemplo `anderssolutions-web`.
2. Subí todo el contenido de esta carpeta a la raíz del repositorio. Sirve "Add file › Upload files" arrastrando todo, o hacerlo con git.
3. En el repositorio, entrá a Settings › Pages. En "Source" elegí "Deploy from a branch", rama `main`, carpeta `/ (root)`, y guardá.
4. En uno o dos minutos la web queda en `https://<tu-usuario>.github.io/anderssolutions-web/`. Ahí ya podés revisarla.

## 2. Conectar el dominio (cuando esté registrado)
1. En NIC Argentina, en la delegación del dominio, conviene usar un DNS que permita registros A y CNAME. Por ejemplo, Cloudflare es gratis: ahí se crea la zona y NIC.ar apunta a los servidores de Cloudflare.
2. En ese DNS, creá estos registros:
   - 4 registros **A** para `anderssolutions.com.ar`, apuntando a las IP de GitHub Pages: 185.199.108.153, 185.199.109.153, 185.199.110.153 y 185.199.111.153.
   - 1 registro **CNAME** para `www`, apuntando a `<tu-usuario>.github.io`.
   (Estas IP son las que GitHub publica en su documentación. Verificalas en docs.github.com antes de cargarlas, por si cambiaron.)
3. En GitHub, en Settings › Pages › Custom domain, poné `anderssolutions.com.ar` (GitHub crea el archivo CNAME solo) y, cuando aparezca, activá "Enforce HTTPS".
4. En `index.html`, cambiá las dos direcciones de `og:image` y `og:url` por el dominio nuevo.

## 3. Cambios futuros
Editar `index.html` (o pedírselo a Claude) y volver a subirlo al repositorio. La web se actualiza sola.

## 4. Estructura y mantenimiento

### Estructura de archivos
- `index.html`: la página completa (textos, fotos de la galería, sección de la luz y comparador 3D).
- `css/site.css`: estilos generales (colores en `:root`, header, menú, secciones, animaciones de aparición).
- `css/galeria.css` y `js/galeria.js`: galería de Proyectos (filtros y visor a pantalla completa).
- `css/interactivos.css` y `js/interactivos.js`: interruptor "Encendé la luz" y comparador render 3D / foto real.
- `css/contacto.css` y `js/contacto.js`: preguntas frecuentes y armador "Contanos tu proyecto" (mensaje de WhatsApp).
- `js/site.js`: menú del celular, header, aparición al scroll y videos (portada, taller y Nosotros).
- `video/`: (todavía no existe) los videos en loop. Ver "Videos".
- `img/`: fotos (`-800.webp` y `-1600.webp`), firma, íconos (`favicon-32.png`, `favicon-48.png`, `favicon-192.png`, `favicon.png` de 512, `favicon-maskable-512.png` para Android, con el dibujo más chico para que no lo corte el recorte redondo, `apple-touch-icon.png`) y og.jpg (imagen al compartir). `cristalero-vinoteca-calido.jpg` queda como respaldo del fondo de la portada para navegadores sin WebP (está en `css/site.css`).
- `fonts/`: tipografías propias (Cormorant Garamond y Jost, pesos 300 y 400, `.woff2`) con su licencia (`OFL-*.txt`, libre para uso comercial). Se declaran al principio de `css/site.css`. Ya no se usa Google Fonts. Si algún día se necesita otro peso (500) o itálica, hay que sumar su archivo (paquetes `@fontsource/cormorant-garamond` y `@fontsource/jost` de npm) y su `@font-face`.
- `404.html`: página de "no existe" que GitHub Pages muestra para cualquier dirección inválida. Usa rutas absolutas (`/css/…`, `/img/…`, `/fonts/…`) a propósito: no cambiarlas por relativas.
- `manifest.webmanifest`: nombre, colores e íconos para "Agregar a la pantalla de inicio".
- `CNAME`, `robots.txt`, `sitemap.xml`, `.nojekyll`: configuración de GitHub Pages y buscadores. No tocar.

Todo es HTML, CSS y JavaScript sin librerías: no hay que compilar nada, se sube tal cual.

### Agregar una foto a la galería
1. Exportar la foto en dos tamaños .webp y subirlas a `img/`: `NOMBRE-800.webp` (800 px de ancho) y `NOMBRE-1600.webp` (1600 px). NOMBRE en minúsculas, sin espacios ni acentos.
2. En `index.html`, buscar `GALERÍA DE PROYECTOS`: copiar un bloque `<figure class="gal-item" ...> ... </figure>`, pegarlo donde se quiera que aparezca y cambiar `data-cat`, las rutas, `width`/`height` (tamaño real de la -1600), `alt` y el epígrafe. El comentario en el HTML explica cada campo. Los filtros se arman solos.
3. En el `srcset`, el número con `w` de cada archivo tiene que ser su ancho real en píxeles (si la "-1600" en realidad mide 900 de ancho, va `900w`). Si no, el navegador elige mal qué versión bajar.

### Cargar un par apagado / encendido (sección de la luz)
Hoy el "apagado" se simula oscureciendo la foto encendida. Para usar una foto real:
1. Sacar la foto con las luces apagadas desde el mismo lugar y con el mismo encuadre que la encendida. Subir `img/NOMBRE-apagado-800.webp` y `img/NOMBRE-apagado-1600.webp`.
2. En `index.html`, buscar `ENCENDÉ LA LUZ` y agregar al `<figure class="luz-pieza">` los atributos `data-off="img/NOMBRE-apagado-1600.webp"` y `data-off-srcset="img/NOMBRE-apagado-800.webp 800w, img/NOMBRE-apagado-1600.webp 1600w"`.
Para mostrar varios muebles, el comentario en el HTML explica cómo copiar el bloque (aparecen miniaturas para elegir).
El foco del brillo (`--luz-foco`) y el encuadre (`--luz-pos`) de cada mueble van en `css/interactivos.css` (regla `.luz-pieza--vestidor-negro`), no en un `style="..."` del HTML: la política de seguridad bloquea los estilos escritos dentro del HTML.

### Activar el comparador 3D
1. Exportar el render y sacar la foto real desde el mismo punto de vista y encuadre. Subir `img/render-NOMBRE-800/1600.webp` y `img/NOMBRE-800/1600.webp`.
2. En `index.html`, buscar `LO VES EN 3D`, reemplazar NOMBRE en las rutas y completar los `alt`.
3. Borrar la palabra `hidden` de `<section id="render" ...>`.

### Videos
Hay tres lugares preparados para videos cortos en loop, sin sonido. Hoy están **desactivados** (son bloques comentados en `index.html`) y la página no pide ningún archivo de video.

| Dónde | Archivo (nombres exactos) | Poster | Peso máximo |
|---|---|---|---|
| Portada (detrás del título) | `video/portada.mp4` (+ `portada.webm` opcional) | no lleva: se ve la foto de fondo | 4 MB |
| Cómo trabajamos, paso 3 (protagonista) | `video/taller-3-fabricamos.mp4` (+ `.webm`) | `img/taller-3-poster.webp` | 1,5 MB |
| Cómo trabajamos, paso 1 | `video/taller-1-escuchamos.mp4` (+ `.webm`) | `img/taller-1-poster.webp` | 1,5 MB |
| Cómo trabajamos, paso 2 | `video/taller-2-diseno.mp4` (+ `.webm`) | `img/taller-2-poster.webp` | 1,5 MB |
| Cómo trabajamos, paso 4 | `video/taller-4-instalamos.mp4` (+ `.webm`) | `img/taller-4-poster.webp` | 1,5 MB |
| Nosotros (en lugar de la foto) | `video/taller-nosotros.mp4` (+ `.webm`) | no lleva: la foto de abajo hace de poster | 1,5 MB |

**Activar un video:**
1. Exportarlo con la receta de abajo y subir el `.mp4` (y su poster, si lleva) con el nombre exacto de la tabla. La carpeta `video/` hay que crearla la primera vez.
2. En `index.html` buscar el bloque (`VIDEO DE PORTADA`, `CLIP PASO 3`, `VIDEO DE NOSOTROS`...) y borrar su primera línea (la que abre el comentario, con el título) y su última línea (la que lo cierra).
3. Si no subiste el `.webm`, borrar en ese bloque la línea `<source ... .webm ...>` (si queda, el navegador lo busca, no lo encuentra y recién ahí usa el `.mp4`).
4. En los clips del taller y en Nosotros, cambiar el `aria-label` por una frase que diga lo que se ve.

**Cómo se comportan:** se descargan recién cuando entran en pantalla y se pausan al salir; arrancan con un fundido sobre el poster; tienen un botón chico de pausa abajo a la derecha (obligatorio por accesibilidad para todo lo que se mueve más de 5 s). Con "reducir movimiento" o "ahorro de datos" no se descargan y queda el poster. Sin JavaScript también se ve el poster.
**Franja del taller:** se acomoda sola con 1, 2, 3 o 4 clips. "Fabricamos" va primero y más grande (con 2 clips ocupa dos tercios; con 3 o 4 va arriba a todo el ancho y el resto en fila abajo). Sin "Fabricamos" quedan todos del mismo tamaño. En el celular es un carrusel que se desliza de costado.

**Cómo grabar:** con el celular horizontal, 5 a 10 s (portada: 8 a 15 s), sin temblar (apoyado o con estabilizador), con movimiento lento y continuo. Que el final empalme más o menos con el principio, porque se repite en loop. Para la portada, plano oscuro a la izquierda (ahí va el texto).

**Receta de exportación** (probada con ffmpeg 6.1). Se instala con `winget install ffmpeg` (Windows) o `brew install ffmpeg` (Mac). Abrir una terminal en la carpeta del sitio y cambiar `ORIGINAL.mov` por el archivo del celular. `-ss 2 -t 8` = empezar en el segundo 2 y tomar 8 segundos.

Clip del taller o de Nosotros (H.264 sin audio, hasta 1280 px, ~1 Mbps, listo para empezar a reproducir enseguida):
```
ffmpeg -ss 2 -t 8 -i ORIGINAL.mov -an -vf "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30" -c:v libx264 -preset slow -crf 26 -maxrate 1M -bufsize 2M -profile:v high -pix_fmt yuv420p -movflags +faststart video/taller-3-fabricamos.mp4
```
Versión .webm (opcional, VP9):
```
ffmpeg -ss 2 -t 8 -i ORIGINAL.mov -an -vf "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30" -c:v libvpx-vp9 -b:v 800k -maxrate 1M -bufsize 2M -row-mt 1 -deadline good -cpu-used 2 video/taller-3-fabricamos.webm
```
Poster (el primer cuadro del video ya exportado, así el fundido no salta):
```
ffmpeg -i video/taller-3-fabricamos.mp4 -frames:v 1 -c:v libwebp -quality 75 img/taller-3-poster.webp
```
Portada (hasta 1920 px, ~2 Mbps):
```
ffmpeg -ss 0 -t 12 -i ORIGINAL.mov -an -vf "scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30" -c:v libx264 -preset slow -crf 27 -maxrate 2M -bufsize 4M -profile:v high -pix_fmt yuv420p -movflags +faststart video/portada.mp4
ffmpeg -ss 0 -t 12 -i ORIGINAL.mov -an -vf "scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30" -c:v libvpx-vp9 -b:v 1.4M -maxrate 1.8M -bufsize 3.6M -row-mt 1 -deadline good -cpu-used 2 video/portada.webm
```
Pesos medidos con estas recetas: clip de 10 s con mucho movimiento y grano, 1,28 MB (.mp4) y 1,49 MB (.webm); clip normal de 8 a 10 s, 0,4 a 0,6 MB. Portada de 15 s en el peor caso, 2,7 MB (.mp4) y 3,2 MB (.webm). **Revisar siempre el peso:** clip ≤ 1,5 MB, portada ≤ 4 MB. Si se pasa, acortar (`-t`) o subir `-crf` (26 → 28). Si el `.webm` pesa más que el `.mp4`, no subirlo (y borrar su línea).
`-an` saca el audio; `scale` achica a 1280 px (o 1920) del lado más largo sin deformar, también si el video es vertical; `+faststart` hace que empiece a reproducirse antes de bajar entero.

### Armador "Contanos tu proyecto" (sección Contacto)
Arma un mensaje de WhatsApp con lo que elige el visitante y abre `wa.me` con el texto listo. No guarda ni envía datos a ningún servidor. Sin JavaScript no se ve y queda el botón directo de WhatsApp.
- **Cambiar una opción:** en `index.html`, buscar `CONTANOS TU PROYECTO`. Cada opción es un `<label class="arm-chip">`: el texto del `<span>` es lo que se ve, y el atributo `data-objeto`, `data-texto` o `data-frase` es lo que va al mensaje (el comentario del HTML explica cada uno). Para agregar o sacar una, copiar o borrar el `<label>` completo.
- **Cambiar el número:** atributo `data-telefono` del `<form data-armador>` (solo dígitos, con 549). Si cambia el número, cambiarlo también en todos los links `wa.me/` de la página.
- Los botones de las tarjetas de Líneas tienen `data-linea="Elite"` (o Premium/Classic): llevan a Contacto y dejan esa línea elegida. El valor tiene que coincidir con el `value` de la opción.

### Preguntas frecuentes
En `index.html`, buscar `PREGUNTAS FRECUENTES`. Cada pregunta es un `<details class="faq-item">`. **El texto está dos veces:** en el HTML visible y en el bloque `<script type="application/ld+json">` del final de esa sección (lo leen Google y otros buscadores). Al cambiar, agregar o borrar una pregunta, hacerlo en los dos lugares con el mismo texto.

### Seguridad (Content-Security-Policy)
`index.html` y `404.html` tienen al principio del `<head>` una etiqueta `<meta http-equiv="Content-Security-Policy" ...>`: la lista de lo único que la página puede cargar. Hoy todo sale del propio sitio (`'self'`), sin scripts ni estilos escritos dentro del HTML. Qué tener en cuenta:
- **Si se agrega algo externo** (un script, una fuente, un video de YouTube, un mapa, un píxel de anuncios, etc.), hay que sumar su dominio a la directiva que corresponda (`script-src`, `img-src`, `frame-src`, `connect-src`...) en los dos archivos. Si no, el navegador lo bloquea y en la consola aparece "Content Security Policy".
- **No usar `style="..."` en el HTML** ni etiquetas `<style>`: se bloquean. Los estilos van en los archivos de `css/`.
- **El único script dentro del HTML** es el chiquito del `<head>` que pone la clase `js`. Está autorizado por su huella (`'sha256-...'` en `script-src`). Si se le cambia aunque sea un carácter, hay que recalcular la huella y reemplazarla en la política de los dos archivos. Comando (desde la carpeta del sitio):
  ```
  python3 -c "import re,hashlib,base64;s=open('index.html',encoding='utf-8').read();m=re.search(r'<script>(.*?)</script>',s,re.S);print(\"'sha256-\"+base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode()+\"'\")"
  ```
  (los bloques `<script type="application/ld+json">` son datos para Google, no se ejecutan y no necesitan huella).
- **Cloudflare Web Analytics:** cuando se active, sumar `https://static.cloudflareinsights.com` a `script-src` y `https://cloudflareinsights.com` a `connect-src` (las instrucciones están en el comentario arriba de la política, en `index.html`). Si Cloudflare tiene activado "Rocket Loader", hay que apagarlo: reescribe los scripts y la política lo bloquearía.
- Para probar después de un cambio: abrir la página con la consola del navegador abierta (F12) y usar todo (menú, galería, armador...). No tiene que aparecer ningún mensaje en rojo.
- **Lo que GitHub Pages no deja configurar.** Algunas protecciones solo se pueden mandar como cabeceras del servidor (no en una etiqueta `<meta>`), y GitHub Pages no permite agregarlas: HSTS (obliga a usar siempre https), `X-Frame-Options` o `frame-ancestors` (impiden que otra web muestre esta dentro de un marco), `X-Content-Type-Options`, `Permissions-Policy`. Para un sitio sin login ni pagos el riesgo es bajo. Si algún día se quieren, la forma es pasar el DNS de Cloudflare de "DNS only" a "Proxied" (nube naranja), con SSL en modo "Full (strict)", y agregarlas en Cloudflare › Rules › Transform Rules › Modify Response Header (HSTS se activa en SSL/TLS › Edge Certificates). Probarlo con cuidado: con el proxy activo, GitHub puede tener problemas para renovar su certificado.
- **No hay datos guardados:** la página no usa cookies, localStorage ni formularios que envíen a un servidor. El nombre y la zona que escribe el visitante en el armador solo van al link de `wa.me` (codificados) y a la vista previa como texto.
- **Fotos:** antes de subir una foto, sacarle los datos ocultos (ubicación GPS, modelo de celular, fecha). Exportar a WebP con las recetas habituales ya los quita; para verificar: `exiftool -gps:all -make -model img/ARCHIVO.webp` (no tiene que mostrar nada).

### Pendientes
- La foto de "Nosotros" (`cocina-isla-varillada`) repite una de la galería. Reemplazarla por una propia (taller, equipo o detalle), o activar el video de Nosotros (ver "Videos").
- `vestidor-gris-luz-perimetral` solo existe en 720 px de ancho (`-800.webp`). Si se consigue la foto original más grande, exportar `-800` y `-1600` de nuevo y poner las dos en el `srcset`.


### Rendimiento
Medido el 16/11/2026 con Chromium (celular de 390 px con CPU 4x más lenta y red "Fast 3G"/"Slow 4G"; escritorio 1440 px sin límite): la página carga en 15 a 18 pedidos y unos 170 KB (celular) / 370 KB (escritorio) para el primer pantallazo, sin saltos de diseño (CLS 0). **No se minifica** el CSS ni el JS: ahorraría unos 12 KB comprimidos (≈ 0,07 s en 3G) a cambio de un paso de compilación y dos copias de cada archivo; no vale la pena para este sitio.

### Versión de los archivos (para que se vea el cambio enseguida)
En `index.html` (y en `404.html`, que usa `css/site.css`), los links a `css/*.css` y `js/*.js` llevan `?v=AAAAMMDDHHMM`. Cuando se modifique cualquiera de esos archivos, cambiar ese número (en todos los links) para que los navegadores descarguen la versión nueva en vez de usar la guardada.
