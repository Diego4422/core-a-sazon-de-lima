import { readFileSync, writeFileSync } from 'node:fs';
import { validateCatalog } from '../js/data.js';
import { formatSoles } from '../js/utils.js';

const data = new URL('../data/platos.json', import.meta.url);
const page = new URL('../index.html', import.meta.url);
const dishes = validateCatalog(JSON.parse(readFileSync(data, 'utf8')));

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return value.replace(/[&<>"]/g, (character) => entities[character]);
}

function renderCard({ id, category, ingredients, name, description, priceCents, image }) {
  const crop = id === 'ceviche-clasico' ? ' object-[62%_center]' : '';
  const price = formatSoles(priceCents).replace(' ', '&nbsp;');

  return `          <article class="enter-card group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-xs dark:border-night-line dark:bg-night" data-dish="${id}" data-category="${category}" data-price-cents="${priceCents}" data-ingredients="${escapeHtml(JSON.stringify(ingredients))}">
            <picture class="block overflow-hidden">
              <source type="image/webp" srcset="${image.webp}">
              <img class="aspect-[16/11] w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]${crop}" src="${image.png}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${escapeHtml(image.alt)}">
            </picture>
            <div class="flex flex-1 flex-col gap-3 p-4 text-muted sm:p-5 dark:text-sand-muted" data-dish-body>
              <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                <h3 class="min-w-0 font-serif text-xl leading-tight font-bold wrap-anywhere xl:text-2xl text-ink dark:text-sand">${escapeHtml(name)}</h3>
                <p class="shrink-0 rounded-full bg-cream px-2.5 py-0.5 text-sm leading-6 font-bold text-primary-dark dark:bg-ember dark:text-gold" data-dish-price>${price}</p>
              </div>
              <p data-dish-description>${escapeHtml(description)}</p>
            </div>
          </article>`;
}

const startMarker = '          <!-- carta-generada:inicio -->';
const endMarker = '          <!-- carta-generada:fin -->';
const html = readFileSync(page, 'utf8');
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start + startMarker.length);
if (start === -1 || end === -1) throw new Error('Faltan los marcadores de la carta en index.html.');

const cards = dishes.map(renderCard).join('\n');
const updated = `${html.slice(0, start + startMarker.length)}\n${cards}\n${html.slice(end)}`;
if (updated !== html) writeFileSync(page, updated);
