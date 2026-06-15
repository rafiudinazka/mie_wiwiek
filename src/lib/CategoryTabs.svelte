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
    gap: var(--spacing-md);
    overflow-x: auto;
    padding-bottom: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
  }

  /* Webkit scrollbar hidden */
  .tabs-container::-webkit-scrollbar {
    display: none;
  }

  button {
    padding: 12px 24px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-secondary);
    font-size: 1rem;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  button.active {
    background: var(--color-accent);
    color: #fff;
    border: none;
  }
</style>
