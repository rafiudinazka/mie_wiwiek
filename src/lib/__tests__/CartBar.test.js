import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CartBar from '../CartBar.svelte';

describe('CartBar', () => {
  it('displays item count and formatted total', () => {
    render(CartBar, {
      props: { itemCount: 3, total: 65000, onClick: () => {} },
    });

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Rp 65.000')).toBeTruthy();
  });

  it('shows "Lihat Pesanan" text', () => {
    render(CartBar, {
      props: { itemCount: 1, total: 25000, onClick: () => {} },
    });

    expect(screen.getByText('Lihat Pesanan')).toBeTruthy();
  });

  it('button is disabled when itemCount is 0', () => {
    const { container } = render(CartBar, {
      props: { itemCount: 0, total: 0, onClick: () => {} },
    });

    const btn = container.querySelector('.cart-btn');
    expect(btn).toBeTruthy();
    expect(btn.hasAttribute('disabled')).toBe(true);
  });

  it('button has visible class when there are items', () => {
    const { container } = render(CartBar, {
      props: { itemCount: 2, total: 50000, onClick: () => {} },
    });

    const btn = container.querySelector('.cart-btn');
    expect(btn.classList.contains('visible')).toBe(true);
  });

  it('button does not have visible class when no items', () => {
    const { container } = render(CartBar, {
      props: { itemCount: 0, total: 0, onClick: () => {} },
    });

    const btn = container.querySelector('.cart-btn');
    expect(btn.classList.contains('visible')).toBe(false);
  });

  it('calls onClick when button is clicked with items', async () => {
    const onClick = vi.fn();
    const { container } = render(CartBar, {
      props: { itemCount: 2, total: 50000, onClick },
    });

    const btn = container.querySelector('.cart-btn');
    await fireEvent.click(btn);

    expect(onClick).toHaveBeenCalledOnce();
  });
});
