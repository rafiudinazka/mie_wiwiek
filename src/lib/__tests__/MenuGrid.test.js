import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MenuGrid from '../MenuGrid.svelte';

describe('MenuGrid', () => {
  it('shows empty state message when products array is empty', () => {
    render(MenuGrid, {
      props: { products: [], onAdd: () => {} },
    });

    expect(screen.getByText('Tidak ada menu tersedia.')).toBeTruthy();
  });

  it('renders product cards for each product', () => {
    const products = [
      { id: 1, title: 'Mie Ayam', price: 25000, description: 'Enak', image: null, modifiers: [] },
      { id: 2, title: 'Es Teh', price: 8000, description: 'Segar', image: null, modifiers: [] },
    ];

    render(MenuGrid, {
      props: { products, onAdd: () => {} },
    });

    expect(screen.getByText('Mie Ayam')).toBeTruthy();
    expect(screen.getByText('Es Teh')).toBeTruthy();
  });

  it('does not show empty state when products exist', () => {
    const products = [
      { id: 1, title: 'Mie Ayam', price: 25000, description: 'Enak', image: null, modifiers: [] },
    ];

    render(MenuGrid, {
      props: { products, onAdd: () => {} },
    });

    expect(screen.queryByText('Tidak ada menu tersedia.')).toBeNull();
  });
});
