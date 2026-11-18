import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { loadCatalog, validateCatalog } from '../js/data.js';
import { MAX_QUANTITY, changeQuantity, removeDish, sanitizeCart, summarizeCart } from '../js/cart.js';
import { CART_KEY, readCart, writeCart } from '../js/storage.js';
import { buildOrderMessage, buildWhatsAppUrl, filterDishes, formatSoles, normalizeText, subtotalInCents } from '../js/utils.js';

const DISHES = validateCatalog(JSON.parse(readFileSync(new URL('../data/platos.json', import.meta.url), 'utf8')));
const dishesById = new Map(DISHES.map((dish) => [dish.id, dish]));

test('la carta estática sigue sincronizada con los seis platos', () => {
  const markup = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const cards = [...markup.matchAll(/<article[^>]+data-dish="([^"]+)".*?<\/article>/gs)];

  assert.equal(DISHES.length, 6);
  assert.equal(new Set(DISHES.map((dish) => dish.id)).size, 6);
  assert.deepEqual(cards.map(([, id]) => id), DISHES.map((dish) => dish.id));
  for (const [index, [card]] of cards.entries()) {
    const dish = DISHES[index];
    const { image } = dish;
    assert.ok(card.includes(`data-category="${dish.category}"`));
    assert.ok(card.includes(`data-price-cents="${dish.priceCents}"`));
    assert.ok(card.includes(`data-ingredients="${JSON.stringify(dish.ingredients).replaceAll('"', '&quot;')}"`));
    assert.ok(card.includes(`>${dish.name}</h3>`));
    assert.ok(card.includes(`>${dish.description}</p>`));
    assert.ok(card.includes(formatSoles(dish.priceCents).replace(' ', '&nbsp;')));
    assert.ok(card.includes(`srcset="${image.webp}"`));
    assert.ok(card.includes(`src="${image.png}" width="${image.width}" height="${image.height}"`));
    assert.ok(card.includes(`alt="${image.alt}"`));
    assert.ok(card.includes('loading="lazy"'));
  }
});

test('la búsqueda admite tildes, mayúsculas, ingredientes y categoría simultánea', () => {
  assert.equal(normalizeText('  Ají y LIMEÑA '), 'aji y limena');
  assert.ok(filterDishes(DISHES, 'AJI', 'fondos').some((dish) => dish.id === 'aji-de-gallina'));
  assert.deepEqual(filterDishes(DISHES, 'limena', 'entradas').map((dish) => dish.id), ['causa-limena']);
  assert.deepEqual(filterDishes(DISHES, 'pulpo', 'todos'), []);
  assert.deepEqual(filterDishes(DISHES, 'palta', 'fondos'), []);
  assert.deepEqual(filterDishes(DISHES, 'carne cancha', 'entradas'), []);
  assert.equal(filterDishes(DISHES, '   ', 'todos').length, 6);
});

test('el carrito cambia de forma inmutable, respeta el límite y suma en céntimos', () => {
  const initial = Object.freeze([Object.freeze({ id: 'aji-de-gallina', quantity: 1 })]);
  const increased = changeQuantity(initial, 'aji-de-gallina', 1, dishesById);
  const withAnotherDish = changeQuantity(increased, 'causa-limena', 1, dishesById);
  const summary = summarizeCart(withAnotherDish, dishesById);

  assert.notEqual(increased, initial);
  assert.equal(initial[0].quantity, 1);
  assert.equal(summary.units, 3);
  assert.equal(summary.totalCents, 9800);
  assert.equal(summary.lines[0].subtotalCents, 7200);
  assert.equal(formatSoles(subtotalInCents(10, 1) + subtotalInCents(20, 1)), 'S/ 0.30');
  assert.deepEqual(changeQuantity(increased, 'aji-de-gallina', -1, dishesById), initial);
  assert.deepEqual(changeQuantity(initial, 'aji-de-gallina', -1, dishesById), []);
  assert.deepEqual(removeDish(withAnotherDish, 'aji-de-gallina'), [{ id: 'causa-limena', quantity: 1 }]);
  assert.equal(changeQuantity(initial, 'desconocido', 1, dishesById), initial);
  assert.equal(changeQuantity(initial, 'aji-de-gallina', NaN, dishesById), initial);

  const full = [{ id: 'aji-de-gallina', quantity: MAX_QUANTITY }];
  assert.equal(changeQuantity(full, 'aji-de-gallina', 1, dishesById), full);
});

test('la recuperación descarta IDs, cantidades y duplicados inválidos', () => {
  const valid = [{ id: 'aji-de-gallina', quantity: 3 }];
  assert.deepEqual(sanitizeCart({ items: valid }, dishesById), []);
  assert.deepEqual(sanitizeCart([
    null,
    { id: 'fake', quantity: 5 },
    { id: 'ceviche-clasico', quantity: '2' },
    { id: 'ceviche-clasico', quantity: -1 },
    { id: 'ceviche-clasico', quantity: 1.5 },
    { id: 'ceviche-clasico', quantity: 100 },
    ...valid,
    { id: 'aji-de-gallina', quantity: 8 },
  ], dishesById), valid);
});

test('el almacenamiento maneja recarga, JSON corrupto, denegación y cuota', (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  });

  const stored = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
  });
  const cart = [{ id: 'lomo-saltado', quantity: 2 }];
  assert.deepEqual(readCart(dishesById), []);
  assert.equal(writeCart(cart), true);
  assert.deepEqual(readCart(dishesById), cart);
  stored.set(CART_KEY, '{corrupto');
  assert.deepEqual(readCart(dishesById), []);
  globalThis.localStorage.setItem = () => { throw new DOMException('Sin espacio', 'QuotaExceededError'); };
  assert.equal(writeCart(cart), false);
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new DOMException('Bloqueado', 'SecurityError'); },
  });
  assert.deepEqual(readCart(dishesById), []);
  assert.equal(writeCart(cart), false);
});

test('el resumen incluye los importes y codifica caracteres sin abrir ningún enlace', () => {
  const summary = summarizeCart([{ id: 'aji-de-gallina', quantity: 2 }], dishesById);
  const message = buildOrderMessage(summary, '  sin picante & limón 🌶  ');
  assert.match(message, /2 × Ají de Gallina — S\/ 72\.00/);
  assert.match(message, /Total: S\/ 72\.00/);
  assert.match(message, /Observaciones: sin picante & limón 🌶/);
  assert.match(message, /Pedido de demostración de portafolio\.$/);
  assert.doesNotMatch(buildOrderMessage(summary, '  '), /Observaciones/);
  for (const phone of [null, '', '+12345678', '012345678', '123 45678', '123456', '1234567890123456']) {
    assert.equal(buildWhatsAppUrl(phone, message), null);
  }

  const phoneForLocalTest = '99900012345';
  const url = new URL(buildWhatsAppUrl(phoneForLocalTest, message));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, `/${phoneForLocalTest}`);
  assert.equal(url.searchParams.get('text'), message);
  assert.equal(buildWhatsAppUrl(phoneForLocalTest, '\ud800'), `https://wa.me/${phoneForLocalTest}?text=%EF%BF%BD`);
});

test('el resumen ignora entradas inválidas y conserva las líneas válidas', () => {
  for (const unexpected of [undefined, null, 5, 'invalido', {}]) {
    assert.deepEqual(summarizeCart(unexpected, dishesById), { lines: [], units: 0, totalCents: 0 });
  }
  const valid = { id: 'lomo-saltado', quantity: 2 };
  const cart = [
    null, {}, { id: 'inexistente', quantity: 2 }, { id: 'lomo-saltado', quantity: Infinity },
    { id: 'lomo-saltado', quantity: 0 }, { id: 'lomo-saltado', quantity: '2' }, valid, valid,
  ];
  assert.deepEqual(summarizeCart(cart, dishesById), {
    lines: [{ ...valid, name: 'Lomo Saltado', priceCents: 4200, subtotalCents: 8400 }],
    units: 2,
    totalCents: 8400,
  });
});

test('las utilidades definen valores ausentes, céntimos inválidos y negativos', () => {
  assert.equal(normalizeText(null), '');
  assert.equal(normalizeText(undefined), '');
  assert.equal(normalizeText(7), '');
  for (const invalid of [undefined, null, NaN, Infinity, -Infinity, 2.5, '300', Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(formatSoles(invalid), 'S/ 0.00');
  }
  assert.equal(formatSoles(-0), 'S/ 0.00');
  assert.equal(formatSoles(-1), '-S/ 0.01');
  assert.equal(formatSoles(-123), '-S/ 1.23');
});

test('la carga comprueba la respuesta HTTP y rechaza JSON y fichas inválidas', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.ok(url.pathname.endsWith('/data/platos.json'));
    return Response.json(DISHES);
  });
  assert.deepEqual(await loadCatalog(), DISHES);

  fetch.mock.mockImplementation(async () => ({
    ok: false,
    status: 503,
    json() { assert.fail('el cuerpo HTTP de error no se debe tratar como catálogo'); },
  }));
  await assert.rejects(loadCatalog(), /HTTP 503/);

  fetch.mock.mockImplementation(async () => new Response('{'));
  await assert.rejects(loadCatalog(), SyntaxError);
  fetch.mock.mockImplementation(async () => Response.json([{ ...DISHES[0], priceCents: 4.5 }]));
  await assert.rejects(loadCatalog(), /datos inválidos/);
  assert.throws(() => validateCatalog([]), TypeError);
  assert.throws(() => validateCatalog([DISHES[0], DISHES[0]]), TypeError);
  assert.throws(() => validateCatalog([{ ...DISHES[0], priceCents: Number.MAX_SAFE_INTEGER }]), RangeError);
  assert.throws(() => validateCatalog([{ ...DISHES[0], image: { ...DISHES[0].image, webp: 'https://example.test/image.webp' } }]), TypeError);
});
