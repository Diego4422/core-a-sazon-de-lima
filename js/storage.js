import { sanitizeCart } from './cart.js';

export const CART_KEY = 'sazon_de_lima_cart_v3';

export function readCart(dishesById) {
  try {
    const saved = globalThis.localStorage.getItem(CART_KEY);
    return saved === null ? [] : sanitizeCart(JSON.parse(saved), dishesById);
  } catch {
    return [];
  }
}

export function writeCart(cart) {
  try {
    globalThis.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return true;
  } catch {
    return false;
  }
}
