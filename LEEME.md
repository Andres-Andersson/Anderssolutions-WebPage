# Web AndersSolutions: cómo publicarla en GitHub Pages

Contenido de la carpeta:
- `index.html`: la página completa.
- `img/`: fotos, logo, favicon e imagen para compartir (og.jpg).
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
