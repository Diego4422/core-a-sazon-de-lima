# Sazón de Lima | Cocina Criolla

Core A V1.5 es una landing comercial de portafolio para un restaurante peruano ficticio. Presenta seis platos criollos con precios referenciales, la experiencia del local y un formulario de reservas demostrativo.

## Tecnologías de las semanas 1 a 4

- HTML5 semántico con metadatos SEO y Open Graph, imágenes responsivas y validación nativa del formulario.
- CSS puro con BEM, variables de diseño, Flexbox y Grid. La maquetación parte de pantallas de 320 px y respeta la preferencia de movimiento reducido.
- JavaScript nativo y opcional para el menú móvil y el aviso de validación. Con JavaScript desactivado, el menú permanece visible y el formulario vuelve a la página con un aviso tras superar la validación. Los campos carecen de `name` para que sus valores queden fuera de la URL y de la petición.

## Estructura

```text
sazon-de-lima/
├── .gitignore
├── README.md
├── index.html
├── assets/
│   └── img/        # Diez fotos en WebP y PNG, más un WebP móvil del hero
├── css/
│   ├── reset.css
│   ├── variables.css
│   └── styles.css
└── js/
    └── main.js
```

## Vista local en Linux

Abre una terminal en `sazon-de-lima/` y ejecuta:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre [http://127.0.0.1:8000/](http://127.0.0.1:8000/) en el navegador. También puedes servir `index.html` desde Live Server en VS Code.

## Fotografías e identidad

La portada utiliza la primera foto adjunta, un lomo saltado humeante. La toma de mesa servida aparece en Experiencia. Cada foto se entrega como WebP y con un PNG de respaldo. La portada tiene dos tamaños WebP. Las nueve fotos restantes se cargan de forma diferida.

- **Logo definitivo.** Guarda el futuro `logo.svg` en `assets/img/` e insértalo dentro de `.header__brand`, con sus dimensiones y un nombre accesible para el enlace. El contenedor Flexbox ya reserva espacio para la marca. El SVG aportará una identidad visual propia.
- **Favicon definitivo.** Guarda `favicon.svg` en `assets/img/` y cambia el enlace vacío del encabezado HTML por `<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">`. El icono facilitará reconocer la pestaña y el sitio en marcadores.

La marca tipográfica permite usar la V1.5 antes de que estén listos ambos SVG. Su incorporación se limita al encabezado HTML y a los dos nuevos archivos, sin refactorizar la maquetación.

## Publicación manual

El director del proyecto gestiona Git, GitHub y Vercel desde Linux. En Vercel se sirve la carpeta que contiene `index.html` como sitio estático, sin paso de compilación. Cuando exista una URL pública, cambia `og:image` a la URL HTTPS absoluta de la fotografía y comprueba la previsualización social del sitio publicado.
