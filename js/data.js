import { MAX_QUANTITY } from './cart.js';

export const ORDER_CONFIG = {
  whatsappPhone: null,
};

const categories = new Set(['fondos', 'entradas']);
const validId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const webpPath = /^assets\/img\/[a-z0-9-]+\.webp$/;
const pngPath = /^assets\/img\/[a-z0-9-]+\.png$/;
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isDimension = (value) => Number.isSafeInteger(value) && value > 0;

export function validateCatalog(dishes) {
  if (!Array.isArray(dishes) || dishes.length === 0) {
    throw new TypeError('La carta debe contener al menos un plato.');
  }

  const ids = new Set();
  let maximumTotal = 0;

  for (const dish of dishes) {
    if (!dish || typeof dish.id !== 'string' || !validId.test(dish.id) || ids.has(dish.id) ||
        !categories.has(dish.category) || !isText(dish.name) || !isText(dish.description) ||
        !Array.isArray(dish.ingredients) || !dish.ingredients.every(isText) ||
        !Number.isSafeInteger(dish.priceCents) || dish.priceCents < 0) {
      throw new TypeError('La ficha del plato tiene datos inválidos.');
    }

    const image = dish.image;
    if (!image || typeof image.webp !== 'string' || !webpPath.test(image.webp) ||
        typeof image.png !== 'string' || !pngPath.test(image.png) || !isDimension(image.width) ||
        !isDimension(image.height) || !isText(image.alt)) {
      throw new TypeError('La fotografía del plato tiene datos inválidos.');
    }

    ids.add(dish.id);
    maximumTotal += dish.priceCents * MAX_QUANTITY;
  }

  if (!Number.isSafeInteger(maximumTotal)) {
    throw new RangeError('El importe máximo de la carta supera el rango de céntimos seguros.');
  }

  return dishes;
}

export async function loadCatalog() {
  const response = await fetch(new URL('../data/platos.json', import.meta.url));
  if (!response.ok) throw new Error(`La carta respondió con HTTP ${response.status}.`);

  return validateCatalog(await response.json());
}

export function readFallbackCatalog(catalog) {
  const dishes = [...catalog.querySelectorAll('article[data-dish]')].map((card) => {
    const image = card.querySelector('img');

    return {
      id: card.dataset.dish,
      category: card.dataset.category,
      name: card.querySelector('h3').textContent.trim(),
      description: card.querySelector('[data-dish-description]').textContent.trim(),
      ingredients: JSON.parse(card.dataset.ingredients),
      priceCents: Number(card.dataset.priceCents),
      image: {
        webp: card.querySelector('source').getAttribute('srcset'),
        png: image.getAttribute('src'),
        width: Number(image.getAttribute('width')),
        height: Number(image.getAttribute('height')),
        alt: image.alt,
      },
    };
  });

  return validateCatalog(dishes);
}
