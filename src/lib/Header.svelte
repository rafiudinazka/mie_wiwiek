<script>
  import { Soup, Info } from 'lucide-svelte';
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

  <button class="help-btn">
    <Info size={18} />
    <span class="hide-mobile">Bantuan</span>
  </button>
</header>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-xl);
    background: rgba(15, 15, 15, 0.65);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 50;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
    box-shadow: 0 0 15px var(--color-accent-subtle);
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
    margin: 0;
  }

  .brand-text span {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .help-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-weight: 600;
  }

  @media (max-width: 600px) {
    .hide-mobile { display: none; }
  }
</style>
