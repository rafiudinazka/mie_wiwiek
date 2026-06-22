<script>
  import { onMount, onDestroy } from "svelte";
  import {
    Bell,
    Printer,
    Check,
    LogOut,
    Clock,
    User,
    Phone,
  } from "lucide-svelte";
  import OrderCard from "./OrderCard.svelte";
  import Receipt from "../Receipt.svelte";
  import { formatRupiah } from "../utils.js";
  import { apiFetch } from "../api.js";

  /** @type {any[]} */
  let orders = [];
  /** @type {any[]} */
  let completedOrders = [];
  let loading = true;
  /** @type {any} */
  let pollInterval;
  let lastOrderCount = 0;

  // Audio notification
  /** @type {any} */
  let notificationSound;

  // Receipt printing
  /** @type {any} */
  let printingOrder = null;
  let receiptComponent;

  onMount(() => {
    // Create notification sound
    notificationSound = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onraxq6KmrLvI2erv5+Hb2Nze5fD5//r17ufk5u/4/v339O7q6Orv+P/99vPw7u7x9vv//fj28/Ly8/b5+/v49/b29vb3+Pr6+vn4+Pj4+fn5+fn5+fj4+Pj5+fn5+fj5+Pj4+Pn5+fn5+fj4+Pj4+fn5+fn5+fj4+Pj4+Pn5+fn5+fn5+Pr6+vr6+vn5+fj4+Pf39/f39/f4+Pj4+fn5+vr6+vr6+vr6+vr6+vr6+vr6+fr6+vn5+fj4+Pf39/f39/f4+Pj5+fn6+vr7+/v7+/v6+vr5+fn4+Pj39/f29vb29vb29/f3+Pj4+fn5+vr6+/v7+/v7+/v6+vr5+fn4+Pj39/f29vb19fX19fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/Pz8+/v7+vr6+fn5+Pj49/f39vb29fX19PT09PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/f39/Pz8+/v7+vr6+fn5+Pj49/f39vb29fX19PT08/Pz",
    );

    fetchOrders();
    fetchCompletedOrders();

    // Poll every 3 seconds
    pollInterval = setInterval(() => {
      fetchOrders();
    }, 3000);
  });

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval);
  });

  async function fetchOrders() {
    try {
      const res = await apiFetch("/api/orders/confirmed");
      if (res.ok) {
        const newOrders = await res.json();

        // Play sound if new orders arrived
        if (newOrders.length > lastOrderCount && lastOrderCount > 0) {
          playNotification();
        }
        lastOrderCount = newOrders.length;
        orders = newOrders;
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      loading = false;
    }
  }

  async function fetchCompletedOrders() {
    try {
      const res = await apiFetch(
        "/api/orders?status=completed&today=true",
      );
      if (res.ok) {
        completedOrders = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch completed orders:", err);
    }
  }

  function playNotification() {
    try {
      notificationSound?.play();
    } catch (e) {
      console.log("Could not play notification sound");
    }
  }

  async function handlePrint(/** @type {any} */ order) {
    printingOrder = order;
    // Wait for DOM update then print
    await new Promise((r) => setTimeout(r, 100));
    window.print();
    printingOrder = null;
  }

  async function handleComplete(/** @type {any} */ orderId) {
    try {
      const res = await apiFetch(
        `/api/orders/${orderId}/complete`,
        {
          method: "PUT",
        },
      );
      if (res.ok) {
        // Refresh orders
        fetchOrders();
        fetchCompletedOrders();
      }
    } catch (err) {
      console.error("Failed to complete order:", err);
    }
  }

  function handleLogout() {
    window.location.hash = "/";
  }
</script>

<div class="cashier-layout">
  <header class="cashier-header">
    <div class="header-left">
      <Bell size={24} />
      <h1>KASIR</h1>
      {#if orders.length > 0}
        <span class="order-badge">{orders.length}</span>
      {/if}
    </div>
    <div class="header-right">
      <span class="time">
        <Clock size={16} />
        {new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <button class="logout-btn" on:click={handleLogout}>
        <LogOut size={18} />
        Keluar
      </button>
    </div>
  </header>

  <main class="cashier-main">
    <section class="orders-section">
      <h2>
        <span class="section-icon">🆕</span>
        Pesanan Masuk
      </h2>

      {#if loading}
        <div class="loading">
          <div class="spinner"></div>
          <p>Memuat pesanan...</p>
        </div>
      {:else if orders.length === 0}
        <div class="empty-state">
          <Bell size={48} />
          <p>Tidak ada pesanan baru</p>
          <span>Pesanan baru akan muncul di sini</span>
        </div>
      {:else}
        <div class="orders-grid">
          {#each orders as order (order.id)}
            <OrderCard
              {order}
              onPrint={() => handlePrint(order)}
              onComplete={() => handleComplete(order.id)}
            />
          {/each}
        </div>
      {/if}
    </section>

    <section class="history-section">
      <h2>
        <span class="section-icon">✅</span>
        Selesai Hari Ini ({completedOrders.length})
      </h2>

      {#if completedOrders.length === 0}
        <p class="empty-history">Belum ada pesanan selesai hari ini</p>
      {:else}
        <div class="history-list">
          {#each completedOrders.slice(0, 10) as order}
            <div class="history-item">
              <span class="order-id">#{order.id}</span>
              <span class="customer">{order.customer_name}</span>
              <span class="total">{formatRupiah(order.total)}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </main>
</div>

<!-- Hidden receipt for printing -->
{#if printingOrder}
  <div class="print-container">
    <Receipt
      bind:this={receiptComponent}
      orderId={printingOrder.id}
      customerName={printingOrder.customer_name}
      customerPhone={printingOrder.customer_phone}
      items={printingOrder.items}
      total={printingOrder.total}
      paymentMethod={printingOrder.payment_method || "Simulated"}
      createdAt={printingOrder.created_at}
    />
  </div>
{/if}

<style>
  .cashier-layout {
    min-height: 100vh;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .cashier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: var(--color-bg-secondary);
    border-bottom: 2px solid var(--color-border);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-left h1 {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0;
  }

  .order-badge {
    background: var(--color-accent);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 12px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .time {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--color-bg-warm);
    color: var(--color-text-primary);
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid var(--color-border);
  }

  .logout-btn:hover {
    background: var(--color-border-hover);
  }

  .cashier-main {
    padding: 24px;
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  @media (max-width: 900px) {
    .cashier-main {
      grid-template-columns: 1fr;
    }
  }

  .orders-section,
  .history-section {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid var(--color-border);
  }

  .orders-section h2,
  .history-section h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .section-icon {
    font-size: 1.2rem;
  }

  .loading,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    color: var(--color-text-secondary);
    text-align: center;
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

  .empty-state p {
    font-size: 1.1rem;
    margin: 16px 0 8px;
  }

  .empty-state span {
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }

  .orders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .history-section {
    height: fit-content;
    position: sticky;
    top: 24px;
  }

  .empty-history {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    text-align: center;
    padding: 24px;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--color-bg-warm);
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .history-item .order-id {
    font-weight: 700;
    color: var(--color-accent);
  }

  .history-item .customer {
    flex: 1;
    color: var(--color-text-secondary);
  }

  .history-item .total {
    font-weight: 700;
  }

  /* Print container - hidden by default, shown only when printing */
  .print-container {
    position: fixed;
    top: -9999px;
    left: -9999px;
  }

  @media print {
    .cashier-layout {
      display: none;
    }

    .print-container {
      position: static;
    }
  }
</style>
