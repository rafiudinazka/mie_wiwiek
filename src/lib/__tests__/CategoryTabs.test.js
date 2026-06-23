import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CategoryTabs from '../CategoryTabs.svelte';

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'mie-kuah', label: 'Mie Kuah' },
  { id: 'mie-goreng', label: 'Mie Goreng' },
  { id: 'minuman', label: 'Minuman' },
];

describe('CategoryTabs', () => {
  it('renders all category buttons', () => {
    render(CategoryTabs, {
      props: {
        categories: CATEGORIES,
        activeCategory: 'all',
        onSelect: () => {},
      },
    });

    for (const cat of CATEGORIES) {
      expect(screen.getByText(cat.label)).toBeTruthy();
    }
  });

  it('marks the active category button with the active class', () => {
    render(CategoryTabs, {
      props: {
        categories: CATEGORIES,
        activeCategory: 'mie-kuah',
        onSelect: () => {},
      },
    });

    const activeBtn = screen.getByText('Mie Kuah');
    expect(activeBtn.classList.contains('active')).toBe(true);

    const inactiveBtn = screen.getByText('Semua');
    expect(inactiveBtn.classList.contains('active')).toBe(false);
  });

  it('calls onSelect with the correct id when a category is clicked', async () => {
    const onSelect = vi.fn();
    render(CategoryTabs, {
      props: {
        categories: CATEGORIES,
        activeCategory: 'all',
        onSelect,
      },
    });

    const mieKuahBtn = screen.getByText('Mie Kuah');
    await fireEvent.click(mieKuahBtn);

    expect(onSelect).toHaveBeenCalledWith('mie-kuah');
  });

  it('renders no buttons when categories is empty', () => {
    const { container } = render(CategoryTabs, {
      props: {
        categories: [],
        activeCategory: 'all',
        onSelect: () => {},
      },
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
