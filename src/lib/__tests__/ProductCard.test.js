import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ProductCard from '../ProductCard.svelte';

describe('ProductCard', () => {
  const defaultProps = {
    title: 'Mie Ayam Bakso Spesial',
    price: 25000,
    description: 'Mie ayam dengan bakso sapi jumbo',
    image: null,
    onAdd: () => {},
  };

  it('renders the product title', () => {
    render(ProductCard, { props: defaultProps });
    expect(screen.getByText('Mie Ayam Bakso Spesial')).toBeTruthy();
  });

  it('renders the product description', () => {
    render(ProductCard, { props: defaultProps });
    expect(screen.getByText('Mie ayam dengan bakso sapi jumbo')).toBeTruthy();
  });

  it('renders the formatted price', () => {
    render(ProductCard, { props: defaultProps });
    expect(screen.getByText('Rp 25.000')).toBeTruthy();
  });

  it('shows emoji placeholder when no image is provided', () => {
    render(ProductCard, { props: defaultProps });
    expect(screen.getByText('🍜')).toBeTruthy();
  });

  it('does not show emoji placeholder when image is provided', () => {
    render(ProductCard, {
      props: { ...defaultProps, image: '/images/mie.webp' },
    });
    expect(screen.queryByText('🍜')).toBeNull();
  });

  it('calls onAdd when the add button is clicked', async () => {
    const onAdd = vi.fn();
    const { container } = render(ProductCard, {
      props: { ...defaultProps, onAdd },
    });

    const addBtn = container.querySelector('.add-btn');
    expect(addBtn).toBeTruthy();
    await fireEvent.click(addBtn);

    expect(onAdd).toHaveBeenCalledOnce();
  });
});
