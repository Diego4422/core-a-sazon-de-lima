# Sazón de Lima | Cocina Criolla

Core A V3.0 es una demostración para un restaurante peruano ficticio. La carta permite encontrar platos, combinar búsqueda y categoría, y reunir una selección con cantidades y total en soles. El visitante puede copiar un resumen para llevárselo.

[Demo pública de la versión estable](https://core-a-sazon-de-lima.vercel.app/) · [Repositorio](https://github.com/Diego4422/core-a-sazon-de-lima)

## Revisar en Linux

Desde la raíz, ejecuta:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre [http://127.0.0.1:8000/](http://127.0.0.1:8000/). El CSS minificado está incluido. Los módulos ES y la petición del catálogo se comprueban desde el servidor HTTP.

Para desarrollar o verificar la compilación con Node.js y npm:

```bash
npm ci
npm run build:css
npm test
```

`npm run dev:css` vigila cambios de CSS, HTML y clases usadas en JavaScript. Edita los platos en `data/platos.json`. `npm run build:css` genera primero las tarjetas HTML de respaldo y después compila el CSS minificado.

## Carta y carrito

- Busca por nombre, descripción o ingredientes. Las tildes y las mayúsculas no afectan las coincidencias. Los filtros **Todos**, **Fondos** y **Entradas** se combinan con el texto.
- Los seis platos de respaldo permanecen visibles mientras se carga el JSON. Si la petición falla o sus datos son inválidos, un aviso informa del fallo y la búsqueda y el carrito se habilitan con el respaldo.
- Al agregar un plato aparece una confirmación visible que también se anuncia a lectores de pantalla. El diálogo se cierra con **Cerrar**, Escape o un clic directo en el fondo oscuro cuando queda visible.
- Los importes se calculan en céntimos enteros. El formateador representa negativos como `-S/ 1.23` y usa `S/ 0.00` para entradas inválidas. El catálogo admite precios no negativos y el carrito admite hasta 99 unidades por plato.
- El navegador guarda únicamente identificadores y cantidades bajo `sazon_de_lima_cart_v3`. Los registros inválidos se descartan. Si el almacenamiento está bloqueado o lleno, el carrito sigue disponible en la página abierta. Las observaciones son opcionales y permanecen en memoria.
- Con JavaScript desactivado, la carta HTML conserva las seis fichas y sus fotografías. Un aviso explica cómo habilitar la búsqueda, los filtros y el carrito. La reserva mantiene las comprobaciones nativas de V2.0 y el aviso de respaldo para verificar la fecha. Con JavaScript activo, el formulario usa el día local del navegador.

## Resumen y WhatsApp autorizado

El botón **Copiar resumen del pedido** copia las líneas del carrito, el total y las observaciones. Si el portapapeles está restringido, la vista previa queda seleccionada para copiarla manualmente.

`ORDER_CONFIG.whatsappPhone` en `js/data.js` viene en `null`. Para habilitar **Abrir pedido en WhatsApp**, configura una cadena de 7 a 15 dígitos con el código internacional de un destinatario expresamente autorizado, sin `+`, espacios ni guiones. El enlace codifica el resumen y abre una pestaña. WhatsApp deja el texto preparado para revisión. La demostración funciona con archivos estáticos y carece de pagos, backend y envío automático.

## Arquitectura

| Ruta | Responsabilidad |
|---|---|
| `index.html` | Carta HTML de respaldo, controles de búsqueda y diálogo del carrito. |
| `data/platos.json` | Fuente de los seis platos que consume la petición HTTP. |
| `scripts/sync-catalog.js` | Generación de las fichas HTML de respaldo desde el JSON. |
| `js/data.js` | Petición y validación del catálogo, lectura del respaldo y configuración del destinatario. |
| `js/utils.js` | Normalización, filtros, importes y texto de pedido. |
| `js/cart.js` | Operaciones inmutables y totales en céntimos. |
| `js/storage.js` | Persistencia, validación de registros y recuperación ante errores. |
| `js/main.js` | Composición del DOM con `DocumentFragment`, eventos delegados, menú y reservas. |
| `css/input.css` y `css/output.css` | Tailwind v4.3.5 con fuentes explícitas para HTML y JS. El segundo archivo es el compilado minificado. |
| `test/core.test.js` | Pruebas de lógica y paridad entre catálogo y fichas de respaldo mediante `node:test`. |

`package.json` declara módulos ES para Node.js y conserva los dos comandos de CSS. El documento HTML usa `type="module"` y los imports incluyen extensión `.js`. La interfaz conserva el modo oscuro por preferencia del sistema, movimiento reducido, el favicon SVG, la imagen social y los diez pares de fotografías WebP/PNG.

## Revisión y alcance comercial

Para verificar el flujo completo, busca «LIMENA», selecciona **Fondos** para ver el estado vacío y restablece los filtros. Agrega dos platos, cambia sus cantidades, recarga y prueba la copia del resumen. Para comprobar la recuperación, bloquea temporalmente la ruta del JSON en las herramientas del navegador y recarga. Revisa también la carta con JavaScript desactivado. [Evidencia postauditoría](docs/verificacion-v3.0-postauditoria.json)

Como base para una oferta de catálogo para un negocio local, acuerda por adelantado el listado de productos y precios, las categorías, las imágenes con permiso de uso y el canal de contacto autorizado. Esta entrega muestra cómo acotar el trabajo a búsqueda, carrito local y preparación del resumen. La ficha y la propuesta del Bloque 2 quedan como referencia histórica. [Ficha freelance V2.0](docs/servicio-freelance.md) · [Propuesta V2.0](docs/propuesta-comercial.pdf)

La verificación postauditoría registró **100** en las cuatro categorías de Lighthouse móvil, LCP de **1,58 s** y CLS de **0,001** en el servidor local.

La verificación inicial de V3.0 registró **100** en las cuatro categorías de Lighthouse móvil, con LCP de **1,73 s** y CLS de **0**. [Evidencia inicial de V3.0](docs/verificacion-v3.0.json)

El director del proyecto administra Git, GitHub y Vercel. La V3.0 se sirve desde la raíz con su CSS ya compilado.

## Verificación inicial de V2.0

- La CLI oficial generó un `css/output.css` minificado de **27 630 bytes**. Recompilar tras retirar las tres hojas anteriores produjo el mismo SHA-256.
- Chromium 156 pasó a 320, 375, 768, 1024 y 1440 px en claro y oscuro. Firefox 159 y WebKitGTK 2.54.2 pasaron a 320, 768 y 1440 px. En los anchos probados se verificaron la cuadrícula y la ausencia de scroll horizontal.
- Se verificaron las seis anclas, el manejo del menú con teclado, la validación y los avisos del formulario, el comportamiento sin JavaScript y la preferencia de movimiento reducido. axe-core 4.14.0 no reportó infracciones en las reglas WCAG A/AA ejecutadas en ninguno de los dos temas.
- Las 26 rutas locales comprobadas respondieron HTTP 200. Nu HTML Checker produjo cero avisos o errores y Chromium registró cero mensajes de error o advertencia en consola.
- La simulación con una paleta de prueba y el formulario antes de la carta conservó la referencia por ancla y la validación. Se ejecutó en el navegador, sobre el DOM y los tokens en memoria.

| Lighthouse 13.6.0 móvil | Puntuación |
|---|---:|
| Rendimiento | 100 |
| Accesibilidad | 100 |
| Buenas prácticas | 100 |
| SEO | 100 |

La ejecución local registró LCP de 1,46 s y CLS de 0. [Evidencia de verificación](docs/verificacion-v2.0.json)

### Errores corregidos

- Se renombró el token tipográfico de portada a `--text-display`. `text-hero` coincidía con el nombre de un token de color y la portada perdía tamaño y contraste.
- Se integró el reset `form-input` en la misma regla que aplica los tokens de los campos. Esto recuperó los colores de marca y el contorno de foco.
- El menú móvil y su versión sin JavaScript comparten una cuadrícula de tres columnas. El contenido sigue en el flujo en la versión sin JavaScript y las anclas se desplazan con el espacio que ocupa el encabezado.

El repositorio carece de un prototipo Figma de referencia. La revisión visual se hizo con capturas del sitio renderizado en claro y oscuro.

## Auditoría histórica de V1.5

El siguiente registro histórico corresponde a una ejecución móvil de la versión estable anterior. Registró 100 en rendimiento, accesibilidad, buenas prácticas y SEO.

![Auditoría Lighthouse móvil de V1.5](docs/screenshots/lighthouse-mobile.png)
