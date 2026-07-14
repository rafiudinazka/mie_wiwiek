<script>
  import { onMount } from "svelte";
  import { navigate } from "../navigate.js";
  import {
    Package,
    FolderOpen,
    ShoppingBag,
    DollarSign,
    TrendingUp,
  } from "lucide-svelte";
  import { formatRupiah } from "../utils.js";
  import { apiFetch } from "../api.js";

  /** @type {Record<string, any>} */
  let stats = {
    totalProducts: 0,
    totalCategories: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    pendingOrders: 0,
  };
  let loading = true;

  onMount(async () => {
    try {
      const res = await apiFetch("/api/admin/stats");
      if (res.ok) {
        stats = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      loading = false;
    }
  });

  const statCards = [
    {
      key: "totalProducts",
      label: "Total Produk",
      icon: Package,
      color: "#3b82f6",
      format: (/** @type {any} */ v) => v,
    },
    {
      key: "totalCategories",
      label: "Kategori",
      icon: FolderOpen,
      color: "#8b5cf6",
      format: (/** @type {any} */ v) => v,
    },
    {
      key: "todayOrdersCount",
      label: "Order Hari Ini",
      icon: ShoppingBag,
      color: "#27ae60",
      format: (/** @type {any} */ v) => v,
    },
    {
      key: "todayRevenue",
      label: "Revenue Hari Ini",
      icon: DollarSign,
      color: "#e67e22",
      format: (/** @type {any} */ v) => formatRupiah(v),
    },
    {
      key: "pendingOrders",
      label: "Pesanan Aktif",
      icon: TrendingUp,
      color: "#c0392b",
      format: (/** @type {any} */ v) => v,
    },
  ];
</script>

<div class="dashboard">
  <header class="page-header">
    <h1>Dashboard</h1>
    <p>Selamat datang di Admin Panel</p>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>
  {:else}
    <div class="stats-grid">
      {#each statCards as card}
        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: {card.color}15; color: {card.color}"
          >
            <svelte:component this={card.icon} size={24} />
          </div>
          <div class="stat-content">
            <span class="stat-value">{card.format(stats[card.key])}</span>
            <span class="stat-label">{card.label}</span>
          </div>
        </div>
      {/each}
    </div>

    <div class="quick-actions">
      <h2>Aksi Cepat</h2>
      <div class="actions-grid">
        <a href="/cashier" class="action-card" on:click|preventDefault={() => navigate('/cashier')}>
          <ShoppingBag size={24} />
          <span>Buka Kasir</span>
        </a>
        <button class="action-card" on:click={() => window.location.reload()}>
          <TrendingUp size={24} />
          <span>Refresh Data</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .page-header h1 {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .page-header p {
    color: var(--color-text-secondary);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    color: var(--color-text-secondary);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: transform 0.2s;
    border: 1px solid var(--color-border);
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .stat-icon {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 800;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .quick-actions {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid var(--color-border);
  }

  .quick-actions h2 {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px;
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
  }

  .action-card:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
  }

  .action-card span {
    font-size: 0.9rem;
    font-weight: 600;
  }
</style>
