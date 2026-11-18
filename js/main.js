import { loadCatalog, ORDER_CONFIG, readFallbackCatalog } from './data.js';
import { MAX_QUANTITY, changeQuantity, removeDish, summarizeCart } from './cart.js';
import { readCart, writeCart } from './storage.js';
import { buildOrderMessage, buildWhatsAppUrl, filterDishes, formatSoles } from './utils.js';

const toggle = document.querySelector('[data-menu-toggle]');
const header = toggle?.closest('[data-site-header]');
const navigation = document.querySelector('#navegacion');

if (toggle && header && navigation) {
  function setMenuExpanded(expanded) {
    toggle.setAttribute('aria-expanded', String(expanded));
  }

  setMenuExpanded(false);
  toggle.hidden = false;

  toggle.addEventListener('click', () => {
    setMenuExpanded(toggle.getAttribute('aria-expanded') === 'false');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      setMenuExpanded(false);
    }
  });

  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenuExpanded(false);
      toggle.focus();
    }
  });

  header.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !header.contains(event.relatedTarget)) {
      setMenuExpanded(false);
    }
  });
}

const bookingForm = document.querySelector('#formulario-reserva');

if (bookingForm instanceof HTMLFormElement) {
  const bookingDate = bookingForm.querySelector('#fecha');
  const bookingStatus = bookingForm.querySelector('#estado-reserva');
  const bookingAlert = bookingForm.querySelector('#error-reserva');

  function updateMinimumDate() {
    if (!bookingDate) return;

    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    bookingDate.min = `${today.getFullYear()}-${month}-${day}`;
  }

  function setFieldError(input, invalid) {
    if (invalid) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }

    const error = document.getElementById(`error-${input.id}`);
    if (!error) return;

    const descriptions = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));

    error.hidden = !invalid;
    if (invalid) {
      descriptions.add(error.id);
    } else {
      descriptions.delete(error.id);
    }

    if (descriptions.size) {
      input.setAttribute('aria-describedby', [...descriptions].join(' '));
    } else {
      input.removeAttribute('aria-describedby');
    }
  }

  updateMinimumDate();
  bookingForm.addEventListener('focusin', updateMinimumDate);
  bookingDate?.addEventListener('input', updateMinimumDate);

  bookingForm.addEventListener('invalid', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;

    setFieldError(event.target, true);
    if (bookingStatus) bookingStatus.textContent = '';
    if (bookingAlert) bookingAlert.textContent ||= 'Revisa los campos señalados.';
  }, true);

  bookingForm.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    if (bookingStatus) bookingStatus.textContent = '';
    if (input.hasAttribute('aria-invalid') && input.validity.valid) {
      setFieldError(input, false);
    }
    if (bookingAlert && !bookingForm.querySelector('[aria-invalid="true"]')) {
      bookingAlert.textContent = '';
    }
  });

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateMinimumDate();
    if (!bookingForm.reportValidity()) return;

    bookingForm.querySelectorAll('[aria-invalid="true"]').forEach((input) => setFieldError(input, false));
    if (bookingAlert) bookingAlert.textContent = '';
    if (bookingStatus) bookingStatus.textContent = 'Validación exitosa. La demostración se completó.';
  });
}

async function initializeCatalog() {
  const catalog = document.querySelector('#platos-carta');
  const cartDialog = document.querySelector('#carrito');
  const loadStatus = document.querySelector('#carga-carta');
  const catalogControls = document.querySelector('#controles-carta');
  const queryInput = document.querySelector('#buscar-platos');
  const categories = document.querySelector('#categorias-carta');
  const results = document.querySelector('#resultados-carta');
  const noResults = document.querySelector('#carta-vacia');
  const resetFilters = document.querySelector('#restablecer-carta');
  const cardTemplate = catalog && catalog.firstElementChild;

  const cartTrigger = document.querySelector('#abrir-carrito');
  const cartBadge = document.querySelector('#contador-carrito');
  const cartFeedback = document.querySelector('#aviso-carrito');
  const storageNotice = document.querySelector('#carrito-sin-persistencia');
  const cartEmpty = document.querySelector('#carrito-vacio');
  const cartContent = document.querySelector('#contenido-carrito');
  const cartList = document.querySelector('#platos-carrito');
  const cartLineTemplate = document.querySelector('#plantilla-plato-carrito');
  const closeCart = cartDialog && cartDialog.querySelector('[data-cart-close]');
  const unitsOutput = document.querySelector('#unidades-carrito');
  const subtotalOutput = document.querySelector('#subtotal-carrito');
  const totalOutput = document.querySelector('#total-carrito');
  const totalsFeedback = document.querySelector('#aviso-importes');
  const noteInput = document.querySelector('#nota-pedido');
  const preview = document.querySelector('#resumen-pedido');
  const channelNotice = document.querySelector('#aviso-canal-pedido');
  const whatsappLink = document.querySelector('#pedido-whatsapp');
  const copyButton = document.querySelector('#copiar-pedido');
  const copyFeedback = document.querySelector('#aviso-copia');

  const rowTemplate = cartLineTemplate instanceof HTMLTemplateElement && cartLineTemplate.content.firstElementChild;
  const essential = [catalog, cartDialog, loadStatus, catalogControls, queryInput, categories, results,
    noResults, resetFilters, cardTemplate, cartTrigger, cartBadge, cartFeedback, storageNotice,
    cartEmpty, cartContent, cartList, rowTemplate, closeCart, unitsOutput, subtotalOutput, totalOutput,
    totalsFeedback, noteInput, preview, channelNotice, whatsappLink, copyButton, copyFeedback];
  const cardSelectors = ['h3', '[data-dish-description]', '[data-dish-price]', 'img', 'source', '[data-dish-body]'];
  const rowSelectors = ['[data-item-name]', '[data-item-price]', '[data-item-quantity]', '[data-item-subtotal]',
    '[data-cart-action="increase"]', '[data-cart-action="decrease"]', '[data-cart-action="remove"]'];

  if (essential.some((element) => !element) || typeof cartDialog.showModal !== 'function' ||
      !(queryInput instanceof HTMLInputElement) || !(preview instanceof HTMLTextAreaElement) ||
      !categories.querySelector('button[data-category="todos"][aria-pressed="true"]') ||
      cardSelectors.some((selector) => !cardTemplate.querySelector(selector)) ||
      rowSelectors.some((selector) => !rowTemplate.querySelector(selector))) {
    if (loadStatus) loadStatus.textContent = 'Puedes consultar la carta. La búsqueda y el carrito no están disponibles.';
    return;
  }

  catalog.setAttribute('aria-busy', 'true');
  loadStatus.textContent = 'Cargando la carta…';
  let dishes;
  try {
    dishes = await loadCatalog();
    loadStatus.textContent = '';
  } catch {
    try {
      dishes = readFallbackCatalog(catalog);
      loadStatus.textContent = 'No se pudo cargar la carta actualizada. Puedes seguir usando la carta de respaldo.';
    } catch {
      loadStatus.textContent = 'No se pudo cargar la carta interactiva. Puedes consultar los platos visibles.';
      return;
    }
  } finally {
    catalog.removeAttribute('aria-busy');
  }

  const dishesById = new Map(dishes.map((dish) => [dish.id, dish]));
  let cart = readCart(dishesById);
  let cartFeedbackTimer;
  let pointerStartedOutside = false;

  function createDishCard(dish) {
    const card = cardTemplate.cloneNode(true);
    card.dataset.dish = dish.id;
    card.querySelector('h3').textContent = dish.name;
    card.querySelector('[data-dish-description]').textContent = dish.description;
    card.querySelector('[data-dish-price]').textContent = formatSoles(dish.priceCents);

    const image = card.querySelector('img');
    card.querySelector('source').srcset = dish.image.webp;
    image.src = dish.image.png;
    image.width = dish.image.width;
    image.height = dish.image.height;
    image.alt = dish.image.alt;
    image.classList.toggle('object-[62%_center]', dish.id === 'ceviche-clasico');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action mt-auto cursor-pointer self-start bg-primary text-paper hover:bg-primary-dark active:bg-primary-dark';
    button.textContent = 'Agregar';
    button.dataset.addDish = dish.id;
    button.setAttribute('aria-label', `Agregar ${dish.name} al carrito`);
    card.querySelector('[data-dish-body]').append(button);

    return card;
  }

  const cards = new Map(dishes.map((dish) => [dish.id, createDishCard(dish)]));

  function renderCatalog() {
    const category = categories.querySelector('[aria-pressed="true"]').dataset.category;
    const matches = filterDishes(dishes, queryInput.value, category);
    const fragment = document.createDocumentFragment();

    matches.forEach((dish) => fragment.append(cards.get(dish.id)));
    catalog.replaceChildren(fragment);
    noResults.hidden = matches.length > 0;
    results.textContent = matches.length === 1 ? '1 plato visible.' : `${matches.length} platos visibles.`;
  }

  function selectCategory(category) {
    categories.querySelectorAll('button[data-category]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.category === category));
    });
    renderCatalog();
  }

  function createCartLine({ id, name, quantity, priceCents, subtotalCents }) {
    const row = rowTemplate.cloneNode(true);
    row.dataset.cartDish = id;
    row.querySelector('[data-item-name]').textContent = name;
    row.querySelector('[data-item-price]').textContent = `${formatSoles(priceCents)} por unidad`;
    row.querySelector('[data-item-quantity]').textContent = quantity;
    row.querySelector('[data-item-subtotal]').textContent = formatSoles(subtotalCents);

    const increase = row.querySelector('[data-cart-action="increase"]');
    increase.disabled = quantity >= MAX_QUANTITY;
    increase.setAttribute('aria-label', `Aumentar cantidad de ${name}`);
    row.querySelector('[data-cart-action="decrease"]').setAttribute('aria-label', `Disminuir cantidad de ${name}`);
    row.querySelector('[data-cart-action="remove"]').setAttribute('aria-label', `Quitar ${name} del carrito`);
    return row;
  }

  function renderOrderPreview(summary) {
    preview.value = summary.units ? buildOrderMessage(summary, noteInput.value) : '';
    const link = summary.units ? buildWhatsAppUrl(ORDER_CONFIG.whatsappPhone, preview.value) : null;

    whatsappLink.hidden = !link;
    channelNotice.hidden = Boolean(link);
    if (link) {
      whatsappLink.href = link;
      whatsappLink.target = '_blank';
      whatsappLink.rel = 'noopener noreferrer';
    } else {
      whatsappLink.removeAttribute('href');
      whatsappLink.removeAttribute('target');
      whatsappLink.removeAttribute('rel');
    }
    copyFeedback.textContent = '';
  }

  function renderCart() {
    const summary = summarizeCart(cart, dishesById);
    const unitLabel = `${summary.units} ${summary.units === 1 ? 'unidad' : 'unidades'}`;
    const activeControl = document.activeElement;
    const focusedRow = cartList.contains(activeControl) ? activeControl.closest('[data-cart-dish]') : null;
    const focusedIndex = [...cartList.children].indexOf(focusedRow);
    const rows = summary.lines.map(createCartLine);
    const fragment = document.createDocumentFragment();
    fragment.append(...rows);

    cartList.replaceChildren(fragment);
    cartBadge.textContent = summary.units;
    cartTrigger.setAttribute('aria-label', `Carrito, ${unitLabel}`);
    cartEmpty.hidden = summary.units > 0;
    cartContent.hidden = summary.units === 0;
    unitsOutput.textContent = summary.units;
    subtotalOutput.textContent = formatSoles(summary.totalCents);
    totalOutput.textContent = subtotalOutput.textContent;
    totalsFeedback.textContent = `Total del carrito: ${unitLabel}, ${totalOutput.textContent}.`;
    renderOrderPreview(summary);

    if (focusedRow) {
      const sameRow = rows.find((row) => row.dataset.cartDish === focusedRow.dataset.cartDish);
      const sameControl = sameRow?.querySelector(`[data-cart-action="${activeControl.dataset.cartAction}"]`);
      const nearbyRow = rows[Math.min(focusedIndex, rows.length - 1)];
      const fallback = nearbyRow?.querySelector('[data-cart-action="decrease"]') ?? closeCart;
      (sameControl && !sameControl.disabled ? sameControl : fallback).focus({ preventScroll: true });
    } else if (!summary.units && cartDialog.open && cartContent.contains(activeControl)) {
      closeCart.focus({ preventScroll: true });
    }

    return summary;
  }

  function updateCart(next) {
    cart = next;
    if (!cart.length) noteInput.value = '';
    storageNotice.hidden = writeCart(cart);
    return renderCart();
  }

  function showCartFeedback(message) {
    clearTimeout(cartFeedbackTimer);
    cartFeedback.textContent = message;
    cartFeedbackTimer = setTimeout(() => { cartFeedback.textContent = ''; }, 4000);
  }

  function isBackdrop(event) {
    if (event.target !== cartDialog) return false;

    const { left, right, top, bottom } = cartDialog.getBoundingClientRect();
    return event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom;
  }

  queryInput.addEventListener('input', renderCatalog);
  categories.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (button) selectCategory(button.dataset.category);
  });
  resetFilters.addEventListener('click', () => {
    queryInput.value = '';
    queryInput.focus();
    selectCategory('todos');
  });

  catalog.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-add-dish]');
    if (!button) return;

    const id = button.dataset.addDish;
    const next = changeQuantity(cart, id, 1, dishesById);
    if (next === cart) {
      showCartFeedback(`El límite es de ${MAX_QUANTITY} unidades por plato.`);
      return;
    }
    const summary = updateCart(next);
    const dish = dishesById.get(id);
    showCartFeedback(`${dish.name} agregado. Total de unidades en el carrito: ${summary.units}.`);
  });

  cartTrigger.addEventListener('click', () => {
    if (cartDialog.open) return;

    cartTrigger.focus({ preventScroll: true });
    cartDialog.showModal();
  });

  cartDialog.addEventListener('pointerdown', (event) => {
    pointerStartedOutside = isBackdrop(event);
  });

  cartDialog.addEventListener('click', (event) => {
    const clickedBackdrop = pointerStartedOutside && isBackdrop(event);
    pointerStartedOutside = false;
    if (clickedBackdrop || event.target.closest('[data-cart-close], [data-cart-browse]')) {
      cartDialog.close();
      return;
    }

    const control = event.target.closest('button[data-cart-action]');
    if (!control) return;
    if (control.dataset.cartAction === 'clear') {
      closeCart.focus({ preventScroll: true });
      updateCart([]);
      return;
    }

    const id = control.closest('[data-cart-dish]').dataset.cartDish;
    const action = control.dataset.cartAction;
    const next = action === 'remove' ? removeDish(cart, id) : changeQuantity(cart, id, action === 'increase' ? 1 : -1, dishesById);
    if (next !== cart) updateCart(next);
  });

  noteInput.addEventListener('input', () => renderOrderPreview(summarizeCart(cart, dishesById)));

  copyButton.addEventListener('click', async () => {
    if (!preview.value) return;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(preview.value);
        copyFeedback.textContent = 'Resumen copiado.';
        return;
      } catch {
        // El permiso de portapapeles puede estar desactivado.
      }
    }

    if (!cartDialog.open) return;
    preview.focus();
    preview.select();
    copyFeedback.textContent = 'Resumen seleccionado. Usa la opción Copiar de tu dispositivo.';
  });

  renderCatalog();
  renderCart();
  catalogControls.hidden = false;
  cartTrigger.hidden = false;
}

initializeCatalog();
