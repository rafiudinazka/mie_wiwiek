import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ProductCustomizer from '../ProductCustomizer.svelte';

const productWithModifiers = {
  id: 1,
  title: 'Mie Ayam Bakso Spesial',
  price: 25000,
  description: 'Mie ayam dengan bakso sapi jumbo',
  image: null,
  modifiers: [
    {
      id: 'porsi',
      name: 'Porsi',
      required: true,
      options: [
        { label: 'Regular', price: 0 },
        { label: 'Jumbo', price: 8000 },
      ],
    },
    {
      id: 'tambahan',
      name: 'Tambahan',
      required: false,
      options: [
        { label: 'Telur Ceplok', price: 5000 },
        { label: 'Sosis', price: 6000 },
      ],
    },
  ],
};

const productWithoutModifiers = {
  id: 2,
  title: 'Mie Kocok Bandung',
  price: 30000,
  description: 'Mie kocok enak',
  image: null,
  modifiers: null,
};

describe('ProductCustomizer', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(ProductCustomizer, {
      props: {
        isOpen: false,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    expect(container.querySelector('.modal')).toBeNull();
  });

  it('renders product title when open', () => {
    render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    expect(screen.getByText('Mie Ayam Bakso Spesial')).toBeTruthy();
  });

  it('renders product description when open', () => {
    render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    expect(screen.getByText('Mie ayam dengan bakso sapi jumbo')).toBeTruthy();
  });

  it('renders modifier group names', () => {
    render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    expect(screen.getByText('Porsi')).toBeTruthy();
    expect(screen.getByText('Tambahan')).toBeTruthy();
  });

  it('renders modifier options', () => {
    render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    expect(screen.getByText('Regular')).toBeTruthy();
    expect(screen.getByText('Jumbo')).toBeTruthy();
    expect(screen.getByText('Telur Ceplok')).toBeTruthy();
    expect(screen.getByText('Sosis')).toBeTruthy();
  });

  it('shows required/optional badges', () => {
    render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    expect(screen.getByText('Wajib')).toBeTruthy();
    expect(screen.getByText('Opsional')).toBeTruthy();
  });

  it('displays quantity starting at 1', () => {
    const { container } = render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    const qtyControl = container.querySelector('.qty-control');
    expect(qtyControl).toBeTruthy();
    expect(qtyControl.textContent).toContain('1');
  });

  it('displays base price in add to cart button', () => {
    render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    // Base price is 25000, formatted as Rp 25.000
    expect(screen.getByText('Rp 25.000')).toBeTruthy();
  });

  it('increments quantity when plus is clicked', async () => {
    const { container } = render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    const buttons = container.querySelectorAll('.qty-control button');
    const plusBtn = buttons[1]; // second button is plus
    await fireEvent.click(plusBtn);

    const qtyControl = container.querySelector('.qty-control');
    expect(qtyControl.textContent).toContain('2');
  });

  it('does not decrement quantity below 1', async () => {
    const { container } = render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    const buttons = container.querySelectorAll('.qty-control button');
    const minusBtn = buttons[0];
    await fireEvent.click(minusBtn);

    const qtyControl = container.querySelector('.qty-control');
    expect(qtyControl.textContent).toContain('1');
  });

  it('calls onAddToCart with correct data when "Tambah ke Pesanan" is clicked', async () => {
    const onAddToCart = vi.fn();
    const { container } = render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose: () => {},
        onAddToCart,
      },
    });

    const addBtn = container.querySelector('.add-cart-btn');
    await fireEvent.click(addBtn);

    expect(onAddToCart).toHaveBeenCalledOnce();
    const arg = onAddToCart.mock.calls[0][0];
    expect(arg.title).toBe('Mie Ayam Bakso Spesial');
    expect(arg.quantity).toBe(1);
    expect(arg.selectedOptions).toBeDefined();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithModifiers,
        onClose,
        onAddToCart: () => {},
      },
    });

    const closeBtn = container.querySelector('.close-btn');
    await fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows message when product has no modifiers', () => {
    render(ProductCustomizer, {
      props: {
        isOpen: true,
        product: productWithoutModifiers,
        onClose: () => {},
        onAddToCart: () => {},
      },
    });

    expect(screen.getByText('Tidak ada opsi kustomisasi untuk item ini.')).toBeTruthy();
  });
});
