<script>
  import { Soup, Search } from 'lucide-svelte';
  
  export let onFindOrder = () => {};
</script>

<header>
  <div class="brand">
    <div class="logo-box">
      <Soup size={28} color="#fff" />
    </div>
    <div class="brand-text">
      <h1>Mie Wiwiek</h1>
      <span>Pesan & Bayar di Sini</span>
    </div>
  </div>

  <button class="action-btn" on:click={onFindOrder}>
    <Search size={18} />
    <span class="hide-mobile">Edit Pesanan</span>
  </button>
</header>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-xl);
    background: var(--color-bg-secondary);
    border-bottom: 2px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .logo-box {
    background: var(--color-accent);
    padding: 10px;
    border-radius: 12px;
    display: flex;
    box-shadow: 0 3px 10px rgba(192, 57, 43, 0.2);
  }

  h1 {
    font-size: 1.3rem;
    font-weight: 800;
    line-height: 1;
    margin: 0;
    color: var(--color-text-primary);
    letter-spacing: -0.3px;
  }

  .brand-text span {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border);
    padding: 8px 16px;
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-weight: 700;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: var(--color-border-hover);
  }

  @media (max-width: 600px) {
    .hide-mobile { display: none; }
  }
</style>
