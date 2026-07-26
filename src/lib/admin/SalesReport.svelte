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
    Download,
    Filter,
    ChevronDown,
  } from "lucide-svelte";
  import { formatRupiah } from "../utils.js";

  // Date filter state
  let dateFrom = "";
  let dateTo = "";
  let quickFilter = "today"; // today, week, month, custom

  // Data
  /** @type {any[]} */
  let salesData = [];
  /** @type {any} */
  let summary = { totalRevenue: 0, totalOrders: 0, avgOrder: 0, growth: 0 };
  let loading = true;
  let searchQuery = "";

  // ── Dummy Data Generator ──────────────────────────
  function generateDummyData() {
    const products = [
      { name: "Mie Ayam Spesial", price: 25000 },
      { name: "Mie Ayam Bakso", price: 28000 },
      { name: "Mie Ayam Pangsit", price: 27000 },
      { name: "Mie Ayam Ceker", price: 30000 },
      { name: "Mie Ayam Jumbo", price: 35000 },
      { name: "Es Teh Manis", price: 5000 },
      { name: "Es Jeruk", price: 7000 },
      { name: "Teh Hangat", price: 4000 },
      { name: "Kopi Susu", price: 12000 },
      { name: "Air Mineral", price: 4000 },
      { name: "Bakso Kuah", price: 22000 },
      { name: "Pangsit Goreng", price: 15000 },
    ];

    const customers = [
      "Ahmad Rafi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari",
      "Eko Prasetyo", "Fitri Handayani", "Gunawan Wibisono", "Hana Pertiwi",
      "Irfan Hakim", "Joko Widodo", "Kartini Putri", "Lukman Hakim",
      "Maya Sari", "Nanda Putra", "Oki Setiana", "Putu Wijaya",
      "Rina Marlina", "Surya Darma", "Tika Amelia", "Udin Sedunia",
    ];

    const statuses = ["completed", "completed", "completed", "completed", "confirmed"];

    /** @type {any[]} */
    let data = [];
    const now = new Date();

    // Generate 60 days of orders
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);

      // Random number of orders per day (3-12)
      const ordersCount = Math.floor(Math.random() * 10) + 3;

      for (let i = 0; i < ordersCount; i++) {
        // Random items per order (1-4)
        const itemCount = Math.floor(Math.random() * 4) + 1;
        /** @type {any[]} */
        let items = [];
        let orderTotal = 0;

        for (let j = 0; j < itemCount; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 3) + 1;
          const itemTotal = product.price * qty;
          orderTotal += itemTotal;
          items.push({
            product_title: product.name,
            quantity: qty,
            price_at_time: product.price,
            total: itemTotal,
          });
        }

        const hour = Math.floor(Math.random() * 12) + 8; // 08:00 - 20:00
        const minute = Math.floor(Math.random() * 60);
        const orderDate = new Date(date);
        orderDate.setHours(hour, minute, 0, 0);

        data.push({
          id: data.length + 1001,
          customer_name: customers[Math.floor(Math.random() * customers.length)],
          customer_phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          items,
          total: orderTotal,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          payment_method: Math.random() > 0.3 ? "Pembayaran Langsung" : "Midtrans",
          created_at: orderDate.toISOString(),
        });
      }
    }

    // Sort newest first
    data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return data;
  }

  /** @type {any[]} */
  let allData = [];

  onMount(() => {
    allData = generateDummyData();
    setQuickFilter("today");
    loading = false;
  });

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

    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

    salesData = allData.filter((order) => {
      const d = new Date(order.created_at);
      return d >= from && d <= to && order.status !== "pending";
    });

    // Calculate summary
    const totalRevenue = salesData.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = salesData.length;
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Compare with previous period
    const daySpan = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - daySpan);
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    prevTo.setHours(23, 59, 59, 999);

    const prevData = allData.filter((order) => {
      const d = new Date(order.created_at);
      return d >= prevFrom && d <= prevTo && order.status !== "pending";
    });
    const prevRevenue = prevData.reduce((sum, o) => sum + o.total, 0);
    const growth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    summary = { totalRevenue, totalOrders, avgOrder, growth };
  }

  /** @param {Date} d */
  function formatDateInput(d) {
    return d.toISOString().split("T")[0];
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
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  }

  // Search filtering
  $: filteredSales = searchQuery
    ? salesData.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(o.id).includes(searchQuery)
      )
    : salesData;

  // Product breakdown
  $: productBreakdown = (() => {
    /** @type {Record<string, { name: string; qty: number; revenue: number }>} */
    const map = {};
    salesData.forEach((order) => {
      order.items.forEach((/** @type {any} */ item) => {
        if (!map[item.product_title]) {
          map[item.product_title] = { name: item.product_title, qty: 0, revenue: 0 };
        }
        map[item.product_title].qty += item.quantity;
        map[item.product_title].revenue += item.total;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  })();

  // Top 5 products for chart visual
  $: topProducts = productBreakdown.slice(0, 5);
  $: maxRevenue = topProducts.length > 0 ? topProducts[0].revenue : 1;

  // Daily breakdown for mini chart
  $: dailyBreakdown = (() => {
    /** @type {Record<string, number>} */
    const map = {};
    salesData.forEach((order) => {
      const dateKey = new Date(order.created_at).toISOString().split("T")[0];
      map[dateKey] = (map[dateKey] || 0) + order.total;
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

    <!-- Charts Row -->
    <div class="charts-row">
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

      <!-- Top Products -->
      <div class="chart-card">
        <h3>🏆 Produk Terlaris</h3>
        {#if topProducts.length > 0}
          <div class="top-products">
            {#each topProducts as product, i}
              <div class="product-row">
                <div class="product-rank" class:gold={i === 0} class:silver={i === 1} class:bronze={i === 2}>
                  {i + 1}
                </div>
                <div class="product-info">
                  <span class="product-name">{product.name}</span>
                  <span class="product-qty">{product.qty} terjual</span>
                </div>
                <div class="product-bar-wrap">
                  <div
                    class="product-bar"
                    style="width: {(product.revenue / maxRevenue) * 100}%"
                  ></div>
                </div>
                <span class="product-revenue">{formatRupiah(product.revenue)}</span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="no-data">Tidak ada data</p>
        {/if}
      </div>
    </div>

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
                <th>ID</th>
                <th>Pelanggan</th>
                <th>Item</th>
                <th>Total</th>
                <th>Pembayaran</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredSales as sale (sale.id)}
                <tr>
                  <td class="sale-id">#{sale.id}</td>
                  <td>
                    <div class="customer-cell">
                      <span class="name">{sale.customer_name}</span>
                      <span class="phone">{sale.customer_phone}</span>
                    </div>
                  </td>
                  <td>
                    <div class="items-cell">
                      {#each sale.items.slice(0, 2) as item}
                        <span class="item-tag">{item.product_title} x{item.quantity}</span>
                      {/each}
                      {#if sale.items.length > 2}
                        <span class="item-more">+{sale.items.length - 2} lainnya</span>
                      {/if}
                    </div>
                  </td>
                  <td class="sale-total">{formatRupiah(sale.total)}</td>
                  <td>
                    <span class="payment-badge" class:direct={sale.payment_method === "Pembayaran Langsung"}>
                      {sale.payment_method}
                    </span>
                  </td>
                  <td class="sale-time">{formatDate(sale.created_at)}</td>
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

  .quick-filters {
    display: flex;
    gap: 6px;
    background: var(--color-bg-primary);
    padding: 4px;
    border-radius: 10px;
  }

  .quick-filters button {
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

  .quick-filters button:hover:not(.active) {
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

  /* ── Charts ─────────────────────────────────── */
  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  .chart-card {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid var(--color-border);
  }

  .chart-card h3 {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 16px;
  }

  /* Bar Chart */
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

  /* Top Products */
  .top-products {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .product-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .product-rank {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    background: var(--color-bg-warm);
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .product-rank.gold { background: #fef3c7; color: #d97706; }
  .product-rank.silver { background: #e5e7eb; color: #6b7280; }
  .product-rank.bronze { background: #fed7aa; color: #c2410c; }

  .product-info {
    display: flex;
    flex-direction: column;
    min-width: 100px;
    flex-shrink: 0;
  }

  .product-name {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 130px;
  }

  .product-qty {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .product-bar-wrap {
    flex: 1;
    height: 8px;
    background: var(--color-bg-warm);
    border-radius: 4px;
    overflow: hidden;
  }

  .product-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent), #f39c12);
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .product-revenue {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-accent);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .no-data {
    color: var(--color-text-muted);
    text-align: center;
    padding: 24px;
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

  .items-cell {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .item-tag {
    font-size: 0.75rem;
    background: var(--color-bg-warm);
    padding: 2px 8px;
    border-radius: 6px;
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  .item-more {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .sale-total {
    font-weight: 700;
    white-space: nowrap;
  }

  .payment-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    background: #3b82f615;
    color: #3b82f6;
    white-space: nowrap;
  }

  .payment-badge.direct {
    background: #22c55e15;
    color: #22c55e;
  }

  .sale-time {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
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

  /* ── Responsive ─────────────────────────────── */
  @media (max-width: 900px) {
    .charts-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .filter-bar {
      flex-direction: column;
      align-items: stretch;
    }

    .quick-filters {
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
