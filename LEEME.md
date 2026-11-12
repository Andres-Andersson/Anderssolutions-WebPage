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
- `js/site.js`: menú del celular, header, aparición al scroll y video de portada.
- `img/`: fotos (`-800.webp` y `-1600.webp`), firma, íconos (`favicon-32.png`, `favicon-48.png`, `favicon-192.png`, `favicon.png` de 512, `apple-touch-icon.png`) y og.jpg (imagen al compartir). `cristalero-vinoteca-calido.jpg` queda como respaldo del fondo de la portada para navegadores sin WebP (está en `css/site.css`).
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

### Activar el video de portada
1. Subir `video/portada.webm` y `video/portada.mp4` (8 a 15 s, sin audio, menos de 3 MB cada uno).
2. En `index.html`, buscar `VIDEO DE PORTADA` y borrar las líneas que abren (`<!--`) y cierran (`-->`) ese comentario, dejando la etiqueta `<video>`.
No se descarga si el visitante tiene "reducir movimiento" o "ahorro de datos".

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

### Pendientes
- La foto de "Nosotros" (`cocina-isla-varillada`) repite una de la galería. Reemplazarla por una propia (taller, equipo o detalle).
- `img/vestidor-gris-luz-perimetral-1600.webp` es una copia idéntica de la -800 (las dos miden 720 px) y hoy no se usa. Si se consigue la foto original más grande, exportar las dos versiones de nuevo y volver a poner las dos en el `srcset`.


### Versión de los archivos (para que se vea el cambio enseguida)
En `index.html` (y en `404.html`, que usa `css/site.css`), los links a `css/*.css` y `js/*.js` llevan `?v=AAAAMMDDHHMM`. Cuando se modifique cualquiera de esos archivos, cambiar ese número (en todos los links) para que los navegadores descarguen la versión nueva en vez de usar la guardada.
