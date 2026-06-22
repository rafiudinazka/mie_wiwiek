<script>
  import { ShoppingBag, ChevronRight } from "lucide-svelte";
  import { formatRupiah } from "./utils.js";

  export let itemCount = 0;
  export let total = 0;
  export let onClick = () => {};

  $: hasItems = itemCount > 0;
</script>

<div class="cart-bar-container">
  <button
    class="cart-btn"
    class:visible={hasItems}
    disabled={!hasItems}
    on:click={onClick}
  >
    <div class="info-group">
      <div class="count-badge">
        {itemCount}
      </div>
      <div class="total-group">
        <span class="label">Total</span>
        <span class="amount">{formatRupiah(total)}</span>
      </div>
    </div>

    <div class="action-group">
      Lihat Pesanan
      <ChevronRight size={24} />
    </div>
  </button>
</div>

<style>
  .cart-bar-container {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: var(--spacing-lg);
    background: linear-gradient(
      to top,
      var(--color-bg-primary) 0%,
      transparent 100%
    );
    pointer-events: none;
    display: flex;
    justify-content: center;
    z-index: 100;
  }

  .cart-btn {
    pointer-events: auto;
    width: 100%;
    max-width: 600px;
    background: var(--color-bg-warm);
    color: var(--color-text-muted);
    padding: 12px var(--spacing-lg);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: none;
    transform: translateY(20px);
    opacity: 0.8;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .cart-btn.visible {
    background: var(--color-accent);
    color: #fff;
    box-shadow: 0 6px 24px rgba(192, 57, 43, 0.3);
    transform: translateY(0);
    opacity: 1;
  }

  .info-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .count-badge {
    background: rgba(255, 255, 255, 0.25);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .total-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .label {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .amount {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .action-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 1.125rem;
    font-weight: 600;
  }
</style>
