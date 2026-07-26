<script>
  import { onMount } from "svelte";
  import {
    Calendar,
    TrendingUp,
    ShoppingBag,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Eye,
    X,
    User,
    Phone,
    Clock,
  } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { formatRupiah } from "../utils.js";
  import { apiFetch } from "../api.js";

  // Date filter state
  let dateFrom = "";
  let dateTo = "";
  let quickFilter = "today"; // today, week, month, custom
  let statusFilter = "all"; // all, confirmed, completed

  // Data
  /** @type {any[]} */
  let allOrders = [];
  /** @type {any[]} */
  let salesData = [];
  /** @type {any} */
  let summary = { totalRevenue: 0, totalOrders: 0, avgOrder: 0, growth: 0 };
  let loading = true;
  let searchQuery = "";

  // Order detail modal
  /** @type {any} */
  let selectedOrder = null;

  onMount(async () => {
    await fetchAllOrders();
    setQuickFilter("today");
    loading = false;
  });

  async function fetchAllOrders() {
    try {
      const res = await apiFetch("/api/orders");
      if (res.ok) {
        allOrders = await res.json();
      } else {
        console.error("Failed to fetch orders:", res.statusText);
        allOrders = [];
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      allOrders = [];
    }
  }

  // ── Filter logic ──────────────────────────────────
  /** @param {string} type */
  function setQuickFilter(type) {
    quickFilter = type;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (type) {
      case "today":
        dateFrom = formatDateInput(today);
        dateTo = formatDateInput(today);
        break;
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);
        dateFrom = formatDateInput(weekAgo);
        dateTo = formatDateInput(today);
        break;
      }
      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFrom = formatDateInput(monthStart);
        dateTo = formatDateInput(today);
        break;
      }
      case "custom":
        // Don't change dates, let user pick
        break;
    }
    applyFilter();
  }

  function applyFilter() {
    if (!dateFrom || !dateTo) return;

    // Parse date strings as local dates (not UTC)
    const fromParts = dateFrom.split("-");
    const from = new Date(parseInt(fromParts[0]), parseInt(fromParts[1]) - 1, parseInt(fromParts[2]), 0, 0, 0, 0);
    const toParts = dateTo.split("-");
    const to = new Date(parseInt(toParts[0]), parseInt(toParts[1]) - 1, parseInt(toParts[2]), 23, 59, 59, 999);

    // Filter orders by date and status
    salesData = allOrders.filter((order) => {
      const d = new Date(order.created_at);
      const inDateRange = d >= from && d <= to;
      const matchesStatus = statusFilter === "all"
        ? (order.status === "confirmed" || order.status === "completed")
        : order.status === statusFilter;
      return inDateRange && matchesStatus;
    });

    // Calculate summary
    const totalRevenue = salesData.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const totalOrders = salesData.length;
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Compare with previous period of same length
    const daySpan = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - daySpan);
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    prevTo.setHours(23, 59, 59, 999);

    const prevData = allOrders.filter((order) => {
      const d = new Date(order.created_at);
      return d >= prevFrom && d <= prevTo && (order.status === "confirmed" || order.status === "completed");
    });
    const prevRevenue = prevData.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    summary = { totalRevenue, totalOrders, avgOrder, growth };
  }

  /**
   * Format a Date to YYYY-MM-DD using local timezone
   * @param {Date} d
   */
  function formatDateInput(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /** @param {any} dateStr */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /** @param {any} dateStr */
  function formatDateShort(dateStr) {
    // Parse as local date for chart labels
    const parts = dateStr.split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  }

  function getStatusLabel(/** @type {any} */ status) {
    switch (status) {
      case "pending": return "Menunggu Bayar";
      case "confirmed": return "Dikonfirmasi";
      case "completed": return "Selesai";
      default: return status;
    }
  }

  function getStatusColor(/** @type {any} */ status) {
    switch (status) {
      case "pending": return "#f59e0b";
      case "confirmed": return "#3b82f6";
      case "completed": return "#22c55e";
      default: return "#888";
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

  // Order detail
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

  // Reactive: re-apply filter when status filter changes
  $: if (statusFilter) applyFilter();

  // Search filtering
  $: filteredSales = searchQuery
    ? salesData.filter(
        (o) =>
          (o.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(o.id).includes(searchQuery)
      )
    : salesData;

  // Daily breakdown for mini chart (use local dates)
  $: dailyBreakdown = (() => {
    /** @type {Record<string, number>} */
    const map = {};
    salesData.forEach((order) => {
      const d = new Date(order.created_at);
      const dateKey = formatDateInput(d);
      map[dateKey] = (map[dateKey] || 0) + (parseFloat(order.total) || 0);
    });
    return Object.entries(map)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  $: maxDaily = dailyBreakdown.length > 0 ? Math.max(...dailyBreakdown.map((d) => d.total)) : 1;
</script>

<div class="page">
  <header class="page-header">
    <div>
      <h1>📊 Laporan Penjualan</h1>
      <p>Analisis dan filter data penjualan per tanggal</p>
    </div>
  </header>

  <!-- Quick Filters -->
  <div class="filter-bar">
    <div class="filter-row">
      <div class="quick-filters">
        <button class:active={quickFilter === "today"} on:click={() => setQuickFilter("today")}>
          Hari Ini
        </button>
        <button class:active={quickFilter === "week"} on:click={() => setQuickFilter("week")}>
          7 Hari
        </button>
        <button class:active={quickFilter === "month"} on:click={() => setQuickFilter("month")}>
          Bulan Ini
        </button>
        <button class:active={quickFilter === "custom"} on:click={() => setQuickFilter("custom")}>
          <Filter size={14} />
          Kustom
        </button>
      </div>

      <div class="status-filters">
        <button class:active={statusFilter === "all"} on:click={() => (statusFilter = "all")}>
          Semua
        </button>
        <button class:active={statusFilter === "confirmed"} on:click={() => (statusFilter = "confirmed")}>
          Aktif
        </button>
        <button class:active={statusFilter === "completed"} on:click={() => (statusFilter = "completed")}>
          Selesai
        </button>
      </div>
    </div>

    <div class="date-inputs">
      <div class="date-field">
        <Calendar size={16} />
        <input type="date" bind:value={dateFrom} on:change={() => { quickFilter = "custom"; applyFilter(); }} />
      </div>
      <span class="date-sep">—</span>
      <div class="date-field">
        <Calendar size={16} />
        <input type="date" bind:value={dateTo} on:change={() => { quickFilter = "custom"; applyFilter(); }} />
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Memuat data laporan...</p>
    </div>
  {:else}
    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card revenue">
        <div class="card-icon" style="background: #e67e2220; color: #e67e22;">
          <DollarSign size={24} />
        </div>
        <div class="card-content">
          <span class="card-value">{formatRupiah(summary.totalRevenue)}</span>
          <span class="card-label">Total Pendapatan</span>
        </div>
        <div class="card-badge" class:positive={summary.growth >= 0} class:negative={summary.growth < 0}>
          {#if summary.growth >= 0}
            <ArrowUpRight size={14} />
          {:else}
            <ArrowDownRight size={14} />
          {/if}
          {Math.abs(summary.growth)}%
        </div>
      </div>

      <div class="summary-card orders">
        <div class="card-icon" style="background: #3b82f620; color: #3b82f6;">
          <ShoppingBag size={24} />
        </div>
        <div class="card-content">
          <span class="card-value">{summary.totalOrders}</span>
          <span class="card-label">Total Pesanan</span>
        </div>
      </div>

      <div class="summary-card avg">
        <div class="card-icon" style="background: #8b5cf620; color: #8b5cf6;">
          <TrendingUp size={24} />
        </div>
        <div class="card-content">
          <span class="card-value">{formatRupiah(summary.avgOrder)}</span>
          <span class="card-label">Rata-rata Pesanan</span>
        </div>
      </div>
    </div>

    <!-- Daily Revenue Chart -->
    {#if dailyBreakdown.length > 1}
      <div class="chart-card">
        <h3>📈 Pendapatan Harian</h3>
        <div class="bar-chart">
          {#each dailyBreakdown as day}
            <div class="bar-col">
              <div class="bar-tooltip">{formatRupiah(day.total)}</div>
              <div
                class="bar"
                style="height: {Math.max(4, (day.total / maxDaily) * 100)}%"
              ></div>
              <span class="bar-label">{formatDateShort(day.date)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Sales Table -->
    <div class="table-section">
      <div class="table-header">
        <h3>📋 Detail Transaksi</h3>
        <div class="table-actions">
          <div class="search-box">
            <Search size={16} />
            <input type="text" placeholder="Cari nama / ID..." bind:value={searchQuery} />
          </div>
        </div>
      </div>

      {#if filteredSales.length === 0}
        <div class="empty-state">
          <p>Tidak ada transaksi pada periode ini</p>
        </div>
      {:else}
        <div class="sales-table-wrap">
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
              {#each filteredSales as sale (sale.id)}
                <tr>
                  <td class="sale-id">#{sale.id}</td>
                  <td>
                    <div class="customer-cell">
                      <span class="name">{sale.customer_name || "-"}</span>
                      <span class="phone">{sale.customer_phone || ""}</span>
                    </div>
                  </td>
                  <td class="sale-total">{formatRupiah(sale.total || 0)}</td>
                  <td>
                    <span
                      class="status-badge"
                      style="background: {getStatusColor(sale.status)}20; color: {getStatusColor(sale.status)}"
                    >
                      {getStatusLabel(sale.status)}
                    </span>
                  </td>
                  <td class="sale-time">{formatDate(sale.created_at)}</td>
                  <td>
                    <button class="view-btn" on:click={() => viewOrder(sale)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span>Menampilkan {filteredSales.length} dari {salesData.length} transaksi</span>
        </div>
      {/if}
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
            style="background: {getStatusColor(selectedOrder.status)}20; color: {getStatusColor(selectedOrder.status)}"
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
                <span class="item-price">{formatRupiah(item.price_at_time || 0)}</span>
              </div>
            {/each}
          {:else}
            <p class="no-items">Tidak ada item</p>
          {/if}
        </div>

        <div class="divider"></div>

        <div class="total-section">
          <span>Total</span>
          <span class="total-amount">{formatRupiah(selectedOrder.total || 0)}</span>
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
    margin-bottom: 24px;
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

  /* ── Filter Bar ─────────────────────────────── */
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding: 16px 20px;
    background: var(--color-bg-secondary);
    border-radius: 16px;
    border: 1px solid var(--color-border);
  }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .quick-filters, .status-filters {
    display: flex;
    gap: 6px;
    background: var(--color-bg-primary);
    padding: 4px;
    border-radius: 10px;
  }

  .quick-filters button, .status-filters button {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .quick-filters button.active {
    background: var(--color-accent);
    color: #fff;
  }

  .status-filters button.active {
    background: var(--color-accent);
    color: #fff;
  }

  .quick-filters button:hover:not(.active),
  .status-filters button:hover:not(.active) {
    background: var(--color-bg-warm);
  }

  .date-inputs {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .date-field {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-secondary);
    transition: all 0.2s;
  }

  .date-field:focus-within {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-subtle);
  }

  .date-field input {
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 0.9rem;
    outline: none;
    width: 130px;
  }

  .date-sep {
    color: var(--color-text-muted);
    font-weight: 300;
  }

  /* ── Loading ─────────────────────────────────── */
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
    to { transform: rotate(360deg); }
  }

  /* ── Summary Cards ──────────────────────────── */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .summary-card {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    border: 1px solid var(--color-border);
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }

  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }

  .summary-card.revenue::before { background: linear-gradient(90deg, #e67e22, #f39c12); }
  .summary-card.orders::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  .summary-card.avg::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }

  .card-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .card-value {
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .card-label {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin-top: 2px;
  }

  .card-badge {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  .card-badge.positive {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }

  .card-badge.negative {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  /* ── Chart ──────────────────────────────────── */
  .chart-card {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid var(--color-border);
    margin-bottom: 24px;
  }

  .chart-card h3 {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 160px;
    padding-top: 20px;
  }

  .bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
    position: relative;
    min-width: 0;
  }

  .bar {
    width: 100%;
    max-width: 36px;
    background: linear-gradient(180deg, var(--color-accent), var(--color-accent-hover));
    border-radius: 6px 6px 2px 2px;
    transition: height 0.4s ease;
    min-height: 4px;
  }

  .bar-col:hover .bar {
    opacity: 0.85;
  }

  .bar-tooltip {
    position: absolute;
    top: -8px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    border: 1px solid var(--color-border);
    z-index: 5;
  }

  .bar-col:hover .bar-tooltip {
    opacity: 1;
  }

  .bar-label {
    font-size: 0.6rem;
    color: var(--color-text-muted);
    margin-top: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    text-align: center;
  }

  /* ── Table Section ──────────────────────────── */
  .table-section {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    gap: 12px;
  }

  .table-header h3 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  }

  .table-actions {
    display: flex;
    gap: 8px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-secondary);
    transition: all 0.2s;
  }

  .search-box:focus-within {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-subtle);
  }

  .search-box input {
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 0.85rem;
    outline: none;
    width: 140px;
  }

  .sales-table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  th {
    background: var(--color-bg-warm);
    font-weight: 600;
    font-size: 0.78rem;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .sale-id {
    font-weight: 600;
    color: var(--color-accent);
    white-space: nowrap;
  }

  .customer-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .customer-cell .name {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .customer-cell .phone {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .sale-total {
    font-weight: 700;
    white-space: nowrap;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .status-badge.large {
    padding: 6px 14px;
    font-size: 0.9rem;
  }

  .sale-time {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
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

  .table-footer {
    padding: 12px 20px;
    text-align: center;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    border-top: 1px solid var(--color-border);
  }

  .empty-state {
    padding: 48px;
    text-align: center;
    color: var(--color-text-secondary);
  }

  /* ── Modal ──────────────────────────────────── */
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

  /* ── Responsive ─────────────────────────────── */
  @media (max-width: 600px) {
    .filter-bar {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-row {
      flex-direction: column;
    }

    .quick-filters, .status-filters {
      justify-content: center;
    }

    .date-inputs {
      justify-content: center;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    th, td {
      padding: 10px 12px;
      font-size: 0.8rem;
    }

    .table-header {
      flex-direction: column;
      align-items: stretch;
    }

    .search-box input {
      width: 100%;
    }
  }
</style>
