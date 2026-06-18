import { writable, derived } from "svelte/store";

/** @type {import('svelte/store').Writable<any>} */
export const addonOrder = writable(null);

function createCart() {
  /** @type {import('svelte/store').Writable<any[]>} */
  const { subscribe, update, set } = writable([]);

  return {
    subscribe,
    add: (/** @type {any} */ product) => update((items) => [...items, product]),
    reset: () => set([]),
  };
}

export const cart = createCart();

export const cartTotal = derived(cart, ($items) =>
  $items.reduce((sum, item) => sum + item.price, 0)
);

export const cartCount = derived(cart, ($items) => $items.length);
