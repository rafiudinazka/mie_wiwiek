<script>
  import { onMount } from "svelte";
  import { Eye, X, User, Phone, Clock } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { formatRupiah } from "../utils.js";
  import { apiFetch } from "../api.js";

  /** @type {any[]} */
  let orders = [];
  let loading = true;
  /** @type {any} */
  let selectedOrder = null;
  let filter = "all"; // all, confirmed, completed

  onMount(fetchOrders);

  async function fetchOrders() {
    loading = true;
    try {
      let url = "/api/orders";
      if (filter !== "all") {
        url += `?status=${filter}`;
      }
      const res = await apiFetch(url);
      if (res.ok) {
        orders = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      loading = false;
    }
  }

  async function viewOrder(/** @type {any} */ order) {
    try {
      const res = await apiFetch(`/api/orders/${order.id}`);
      if (res.ok) {
        selectedOrder = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    }
  }

  function closeModal() {
    selectedOrder = null;
  }

  function formatDate(/** @type {any} */ dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusColor(/** @type {any} */ status) {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "confirmed":
        return "#3b82f6";
      case "completed":
        return "#22c55e";
      default:
        return "#888";
    }
  }

  function getStatusLabel(/** @type {any} */ status) {
    switch (status) {
      case "pending":
        return "Menunggu Bayar";
      case "confirmed":
        return "Dikonfirmasi";
      case "completed":
        return "Selesai";
      default:
        return status;
    }
  }

  function parseModifiers(/** @type {any} */ modifiersJson) {
    if (!modifiersJson) return null;
    try {
      return JSON.parse(modifiersJson);
    } catch {
      return null;
    }
  }

  $: if (filter) fetchOrders();
</script>

<div class="page">
  <header class="page-header">
    <div>
      <h1>Riwayat Order</h1>
      <p>Lihat semua pesanan</p>
    </div>

    <div class="filter-tabs">
      <button class:active={filter === "all"} on:click={() => (filter = "all")}
        >Semua</button
      >
      <button
        class:active={filter === "confirmed"}
        on:click={() => (filter = "confirmed")}>Aktif</button
      >
      <button
        class:active={filter === "completed"}
        on:click={() => (filter = "completed")}>Selesai</button
      >
    </div>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
    </div>
  {:else if orders.length === 0}
    <div class="empty-state">
      <p>Tidak ada order</p>
    </div>
  {:else}
    <div class="orders-table">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Pelanggan</th>
            <th>Total</th>
            <th>Status</th>
            <th>Waktu</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each orders as order (order.id)}
            <tr>
              <td class="order-id">#{order.id}</td>
              <td>
                <div class="customer-cell">
                  <span class="name">{order.customer_name || "-"}</span>
                  <span class="phone">{order.customer_phone || ""}</span>
                </div>
              </td>
              <td class="total">{formatRupiah(order.total || 0)}</td>
              <td>
                <span
                  class="status-badge"
                  style="background: {getStatusColor(
                    order.status,
                  )}20; color: {getStatusColor(order.status)}"
                >
                  {getStatusLabel(order.status)}
                </span>
              </td>
              <td class="time">{formatDate(order.created_at)}</td>
              <td>
                <button class="view-btn" on:click={() => viewOrder(order)}>
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Order Detail Modal -->
{#if selectedOrder}
  <div class="modal-backdrop" transition:fade={{ duration: 150 }}>
    <div class="modal" transition:fly={{ y: 20, duration: 200 }}>
      <div class="modal-header">
        <h2>Order #{selectedOrder.id}</h2>
        <button class="close-btn" on:click={closeModal}>
          <X size={20} />
        </button>
      </div>

      <div class="modal-body">
        <div class="order-info">
          <div class="info-row">
            <User size={16} />
            <span>{selectedOrder.customer_name}</span>
          </div>
          <div class="info-row">
            <Phone size={16} />
            <span>{selectedOrder.customer_phone}</span>
          </div>
          <div class="info-row">
            <Clock size={16} />
            <span>{formatDate(selectedOrder.created_at)}</span>
          </div>
        </div>

        <div class="status-info">
          <span class="label">Status:</span>
          <span
            class="status-badge large"
            style="background: {getStatusColor(
              selectedOrder.status,
            )}20; color: {getStatusColor(selectedOrder.status)}"
          >
            {getStatusLabel(selectedOrder.status)}
          </span>
        </div>

        <div class="divider"></div>

        <div class="items-section">
          <h3>Items</h3>
          {#if selectedOrder.items && selectedOrder.items.length > 0}
            {#each selectedOrder.items as item}
              <div class="item-row">
                <div class="item-info">
                  <span class="item-name">
                    {item.product_title}
                    {#if item.quantity > 1}
                      <span class="qty">x{item.quantity}</span>
                    {/if}
                  </span>
                  {#if item.modifiers_json}
                    {@const mods = parseModifiers(item.modifiers_json)}
                    {#if mods}
                      <div class="item-mods">
                        {#each Object.entries(mods) as [key, val]}
                          {#if Array.isArray(val)}
                            {#each val as v}
                              <span class="mod">+ {v.label}</span>
                            {/each}
                          {:else if val}
                            <span class="mod">+ {val.label}</span>
                          {/if}
                        {/each}
                      </div>
                    {/if}
                  {/if}
                </div>
                <span class="item-price"
                  >{formatRupiah(item.price_at_time || 0)}</span
                >
              </div>
            {/each}
          {:else}
            <p class="no-items">Tidak ada item</p>
          {/if}
        </div>

        <div class="divider"></div>

        <div class="total-section">
          <span>Total</span>
          <span class="total-amount"
            >{formatRupiah(selectedOrder.total || 0)}</span
          >
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .page {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .page-header h1 {
    font-size: 1.75rem;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .page-header p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .filter-tabs {
    display: flex;
    gap: 8px;
    background: var(--color-bg-secondary);
    padding: 4px;
    border-radius: 10px;
  }

  .filter-tabs button {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    transition: all 0.2s;
  }

  .filter-tabs button.active {
    background: var(--color-accent);
    color: #fff;
  }

  .loading,
  .empty-state {
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
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .orders-table {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    overflow: hidden;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  th {
    background: var(--color-bg-warm);
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .order-id {
    font-weight: 600;
    color: var(--color-accent);
  }

  .customer-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .customer-cell .name {
    font-weight: 500;
  }

  .customer-cell .phone {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .total {
    font-weight: 600;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .status-badge.large {
    padding: 6px 14px;
    font-size: 0.9rem;
  }

  .time {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .view-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--color-bg-warm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-btn:hover {
    background: var(--color-border);
    color: var(--color-text-primary);
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(45, 32, 22, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .modal {
    background: var(--color-bg-secondary);
    border-radius: 20px;
    width: 100%;
    max-width: 450px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    font-size: 1.25rem;
    margin: 0;
    color: var(--color-accent);
  }

  .close-btn {
    padding: 8px;
    color: var(--color-text-secondary);
  }

  .modal-body {
    padding: 24px;
  }

  .order-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--color-text-secondary);
    font-size: 0.95rem;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-info .label {
    color: var(--color-text-secondary);
  }

  .divider {
    height: 1px;
    background: var(--color-border);
    margin: 20px 0;
  }

  .items-section h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--color-text-secondary);
  }

  .item-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border);
  }

  .item-info {
    flex: 1;
  }

  .item-name {
    font-size: 0.95rem;
  }

  .qty {
    color: var(--color-text-secondary);
    margin-left: 4px;
  }

  .item-mods {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }

  .mod {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    background: var(--color-bg-warm);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .item-price {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .no-items {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    padding: 16px 0;
    text-align: center;
  }

  .total-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .total-amount {
    font-size: 1.25rem;
    color: var(--color-accent);
  }

  @media (max-width: 600px) {
    th,
    td {
      padding: 10px 12px;
      font-size: 0.85rem;
    }

    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
