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
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 50;
    border-bottom: 1px solid var(--color-border);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .logo-box {
    background: linear-gradient(135deg, var(--color-accent), #e8a838);
    padding: 8px;
    border-radius: var(--radius-sm);
    display: flex;
    box-shadow: 0 2px 8px rgba(212, 50, 28, 0.25);
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
    margin: 0;
    color: var(--color-text-primary);
  }

  .brand-text span {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    padding: 8px 16px;
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s;
  }

  .action-btn:hover {
    border-color: var(--color-border-hover);
    box-shadow: var(--shadow-md);
  }

  @media (max-width: 600px) {
    .hide-mobile { display: none; }
  }
</style>
