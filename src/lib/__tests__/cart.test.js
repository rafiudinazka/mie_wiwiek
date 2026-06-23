import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { cart, cartTotal, cartCount, addonOrder } from '../cart.js';

describe('cart store', () => {
  beforeEach(() => {
    cart.reset();
  });

  it('starts with an empty cart', () => {
    expect(get(cart)).toEqual([]);
  });

  it('adds a single item to cart', () => {
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    expect(get(cart)).toHaveLength(1);
    expect(get(cart)[0]).toEqual({ id: 1, title: 'Mie Ayam', price: 25000 });
  });

  it('adds multiple items to cart', () => {
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    cart.add({ id: 2, title: 'Es Teh', price: 8000 });
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    expect(get(cart)).toHaveLength(3);
  });

  it('resets cart to empty', () => {
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    cart.add({ id: 2, title: 'Es Teh', price: 8000 });
    cart.reset();
    expect(get(cart)).toEqual([]);
  });
});

describe('cartTotal derived store', () => {
  beforeEach(() => {
    cart.reset();
  });

  it('returns 0 for an empty cart', () => {
    expect(get(cartTotal)).toBe(0);
  });

  it('calculates total for one item', () => {
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    expect(get(cartTotal)).toBe(25000);
  });

  it('sums prices of multiple items', () => {
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    cart.add({ id: 2, title: 'Es Teh', price: 8000 });
    cart.add({ id: 3, title: 'Bakso', price: 12000 });
    expect(get(cartTotal)).toBe(45000);
  });

  it('recalculates after reset', () => {
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    cart.reset();
    expect(get(cartTotal)).toBe(0);
  });
});

describe('cartCount derived store', () => {
  beforeEach(() => {
    cart.reset();
  });

  it('returns 0 for an empty cart', () => {
    expect(get(cartCount)).toBe(0);
  });

  it('counts items correctly', () => {
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    cart.add({ id: 2, title: 'Es Teh', price: 8000 });
    expect(get(cartCount)).toBe(2);
  });

  it('recalculates after reset', () => {
    cart.add({ id: 1, title: 'Mie Ayam', price: 25000 });
    cart.reset();
    expect(get(cartCount)).toBe(0);
  });
});

describe('addonOrder store', () => {
  beforeEach(() => {
    addonOrder.set(null);
  });

  it('starts as null', () => {
    expect(get(addonOrder)).toBeNull();
  });

  it('can be set to an order object', () => {
    const order = { id: 5, customer_name: 'Budi', customer_phone: '08123456789' };
    addonOrder.set(order);
    expect(get(addonOrder)).toEqual(order);
  });

  it('can be reset to null', () => {
    addonOrder.set({ id: 5, customer_name: 'Budi', customer_phone: '08123456789' });
    addonOrder.set(null);
    expect(get(addonOrder)).toBeNull();
  });
});
