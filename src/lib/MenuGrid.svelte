<script>
  import ProductCard from "./ProductCard.svelte";
  import { cart } from "./cart.js";

  export let products = [];
  export let onAdd = (product) => {};
</script>

{#if products.length === 0}
  <div class="empty-state">No items available.</div>
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
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-lg);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
  }
</style>
