<script>
  import ProductCard from "./ProductCard.svelte";
  import { cart } from "./cart.js";

  /** @type {any[]} */
  export let products = [];
  export let onAdd = (/** @type {any} */ product) => {};
</script>

{#if products.length === 0}
  <div class="empty-state">Tidak ada menu tersedia.</div>
{:else}
  <div class="grid">
    {#each products as product (product.id)}
      <ProductCard {...product} onAdd={() => onAdd(product)} />
    {/each}
  </div>
{/if}

<style>
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
  }

  @media (max-width: 600px) {
    .grid {
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
    }
  }
</style>
