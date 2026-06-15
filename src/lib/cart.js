import { writable, derived } from "svelte/store";

function createCart() {
  const { subscribe, update, set } = writable([]);

  return {
    subscribe,
    add: (product) => update((items) => [...items, product]),
    reset: () => set([]),
  };
}

export const cart = createCart();

export const cartTotal = derived(cart, ($items) =>
  $items.reduce((sum, item) => sum + item.price, 0)
);

export const cartCount = derived(cart, ($items) => $items.length);
