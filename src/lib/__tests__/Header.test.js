import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Header from '../Header.svelte';

describe('Header', () => {
  it('renders brand name "Mie Wiwiek"', () => {
    render(Header, {
      props: { onFindOrder: () => {} },
    });

    expect(screen.getByText('Mie Wiwiek')).toBeTruthy();
  });

  it('renders tagline text', () => {
    render(Header, {
      props: { onFindOrder: () => {} },
    });

    expect(screen.getByText('Pesan & Bayar di Sini')).toBeTruthy();
  });

  it('calls onFindOrder when action button is clicked', async () => {
    const onFindOrder = vi.fn();
    const { container } = render(Header, {
      props: { onFindOrder },
    });

    const actionBtn = container.querySelector('.action-btn');
    expect(actionBtn).toBeTruthy();
    await fireEvent.click(actionBtn);

    expect(onFindOrder).toHaveBeenCalledOnce();
  });
});
