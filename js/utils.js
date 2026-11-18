export function normalizeText(value) {
  return typeof value === 'string'
    ? value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
    : '';
}

export function filterDishes(dishes, query, category) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);

  return dishes.filter((dish) => {
    if (category !== 'todos' && dish.category !== category) return false;

    const searchable = normalizeText([dish.name, dish.description, ...dish.ingredients].join(' '));
    return terms.every((term) => searchable.includes(term));
  });
}

export function subtotalInCents(priceCents, quantity) {
  return priceCents * quantity;
}

export function formatSoles(cents) {
  if (!Number.isSafeInteger(cents)) return 'S/ 0.00';

  const magnitude = Math.abs(cents);
  const soles = Math.floor(magnitude / 100);
  const fraction = String(magnitude % 100).padStart(2, '0');
  return `${cents < 0 ? '-' : ''}S/ ${soles}.${fraction}`;
}

export function buildOrderMessage({ lines, totalCents }, note = '') {
  const details = lines.map(({ name, quantity, subtotalCents }) =>
    `${quantity} × ${name} — ${formatSoles(subtotalCents)}`
  );
  const message = [
    'Hola, me gustaría preparar el siguiente pedido demostrativo en Sazón de Lima:',
    '',
    ...details,
    '',
    `Total: ${formatSoles(totalCents)}`,
  ];

  const observations = note.trim();
  if (observations) message.push(`Observaciones: ${observations}`);

  message.push('', 'Pedido de demostración de portafolio.');
  return message.join('\n');
}

export function buildWhatsAppUrl(phone, message) {
  if (typeof phone !== 'string' || !/^[1-9][0-9]{6,14}$/.test(phone)) return null;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message.toWellFormed())}`;
}
