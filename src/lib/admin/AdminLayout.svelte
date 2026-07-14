<script>
  import {
    LayoutDashboard,
    Package,
    FolderOpen,
    ShoppingBag,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
  } from "lucide-svelte";

  import AdminDashboard from "./AdminDashboard.svelte";
  import ProductManager from "./ProductManager.svelte";
  import CategoryManager from "./CategoryManager.svelte";
  import OrdersManager from "./OrdersManager.svelte";
  import CashierManager from "./CashierManager.svelte";
  import AdminSettings from "./AdminSettings.svelte";

  /** @type {() => void} */
  export let onLogout = () => {};

  let currentPage = "dashboard";
  let sidebarOpen = false;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Produk", icon: Package },
    { id: "categories", label: "Kategori", icon: FolderOpen },
    { id: "orders", label: "Riwayat Order", icon: ShoppingBag },
    { id: "cashiers", label: "Kasir", icon: Users },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  function handleLogout() {
    onLogout();
    navigate("/");
    window.location.reload();
  }

  /** @param {string} id */
  function selectPage(id) {
    currentPage = id;
    sidebarOpen = false;
  }
</script>

<div class="admin-layout">
  <!-- Mobile menu toggle -->
  <button class="mobile-menu-btn" on:click={() => (sidebarOpen = !sidebarOpen)}>
    {#if sidebarOpen}
      <X size={24} />
    {:else}
      <Menu size={24} />
    {/if}
  </button>

  <!-- Sidebar -->
  <aside class="sidebar" class:open={sidebarOpen}>
    <div class="sidebar-header">
      <h2>🍜 Admin</h2>
    </div>

    <nav class="sidebar-nav">
      {#each navItems as item}
        <button
          class="nav-item"
          class:active={currentPage === item.id}
          on:click={() => selectPage(item.id)}
        >
          <svelte:component this={item.icon} size={20} />
          <span>{item.label}</span>
        </button>
      {/each}
    </nav>

    <div class="sidebar-footer">
      <button class="nav-item logout" on:click={handleLogout}>
        <LogOut size={20} />
        <span>Keluar</span>
      </button>
    </div>
  </aside>

  <!-- Overlay for mobile -->
  {#if sidebarOpen}
    <div class="overlay" role="button" tabindex="-1" on:click={() => (sidebarOpen = false)} on:keydown={(e) => { if (e.key === 'Escape') sidebarOpen = false; }}></div>
  {/if}

  <!-- Main content -->
  <main class="admin-main">
    {#if currentPage === "dashboard"}
      <AdminDashboard />
    {:else if currentPage === "products"}
      <ProductManager />
    {:else if currentPage === "categories"}
      <CategoryManager />
    {:else if currentPage === "orders"}
      <OrdersManager />
    {:else if currentPage === "cashiers"}
      <CashierManager />
    {:else if currentPage === "settings"}
      <AdminSettings />
    {/if}
  </main>
</div>

<style>
  .admin-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .mobile-menu-btn {
    display: none;
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1001;
    width: 44px;
    height: 44px;
    background: var(--color-bg-secondary);
    border-radius: 12px;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  @media (max-width: 768px) {
    .mobile-menu-btn {
      display: flex;
    }
  }

  .sidebar {
    width: 240px;
    background: var(--color-bg-secondary);
    display: flex;
    flex-direction: column;
    border-right: 2px solid var(--color-border);
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    transition: transform 0.3s ease;
  }

  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }
  }

  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(45, 32, 22, 0.3);
    z-index: 999;
  }

  @media (max-width: 768px) {
    .overlay {
      display: block;
    }
  }

  .sidebar-header {
    padding: 24px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .sidebar-header h2 {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0;
  }

  .sidebar-nav {
    flex: 1;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    transition: all 0.2s;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover {
    background: var(--color-bg-warm);
    color: var(--color-text-primary);
  }

  .nav-item.active {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
  }

  .sidebar-footer {
    padding: 16px 12px;
    border-top: 1px solid var(--color-border);
  }

  .nav-item.logout:hover {
    background: rgba(192, 57, 43, 0.08);
    color: var(--color-danger);
  }

  .admin-main {
    flex: 1;
    margin-left: 240px;
    padding: 24px;
    overflow-y: auto;
    height: 100vh;
  }

  @media (max-width: 768px) {
    .admin-main {
      margin-left: 0;
      padding: 72px 16px 24px;
    }
  }
</style>
