<script>
  /** @type {Array<{id: string, label: string}>} */
  export let categories = [];
  export let activeCategory = "all";
  /** @type {(id: string) => void} */
  export let onSelect = () => {};
</script>

<div class="tabs-container">
  {#each categories as cat (cat.id)}
    <button
      class:active={activeCategory === cat.id}
      on:click={() => onSelect(cat.id)}
    >
      {cat.label}
    </button>
  {/each}
</div>

<style>
  .tabs-container {
    display: flex;
    gap: var(--spacing-sm);
    overflow-x: auto;
    padding-bottom: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .tabs-container::-webkit-scrollbar {
    display: none;
  }

  button {
    padding: 10px 20px;
    border-radius: var(--radius-full);
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid var(--color-border);
    transition: all 0.2s ease;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }

  button:hover {
    border-color: var(--color-border-hover);
  }

  button.active {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
    box-shadow: 0 2px 8px rgba(212, 50, 28, 0.25);
  }
</style>
