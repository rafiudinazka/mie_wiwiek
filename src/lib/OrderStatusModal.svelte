<script>
  import { X, Search, AlertCircle, Hash, Phone, ArrowLeft, ChevronRight, Clock, CheckCircle, Loader, Package } from "lucide-svelte";
  import { fade, fly, slide } from "svelte/transition";
  import { formatRupiah } from "./utils.js";
  import { apiFetch } from "./api.js";

  export let isOpen = false;
  export let onClose = () => {};

  // Search state
  let searchMode = "id"; // "id" or "phone"
  let orderIdQuery = "";
  let phoneQuery = "";
  let isSearching = false;
  let errorMsg = "";

  /** @type {any} */
  let foundOrder = null;
  /** @type {any[]} */
  let phoneResults = [];

  // --- Search by Order ID ---
  async function searchById() {
    const q = String(orderIdQuery).trim();
    if (!q) {
      errorMsg = "Masukkan nomor pesanan";
      return;
    }

    isSearching = true;
    errorMsg = "";
    foundOrder = null;

    try {
      const res = await apiFetch(`/api/orders/search?id=${encodeURIComponent(q)}`);
      if (res.ok) {
        foundOrder = await res.json();
      } else {
        const err = await res.json();
        errorMsg = err.error || "Pesanan tidak ditemukan";
      }
    } catch (err) {
      errorMsg = "Gagal mencari pesanan. Coba lagi.";
    } finally {
      isSearching = false;
    }
  }

  // --- Search by Phone ---
  async function searchByPhone() {
    const q = phoneQuery.trim();
    if (!q) {
      errorMsg = "Masukkan nomor HP";
      return;
    }

    isSearching = true;
    errorMsg = "";
    phoneResults = [];

    try {
      const res = await apiFetch(`/api/orders/search?phone=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        phoneResults = data;
      } else {
        const err = await res.json();
        errorMsg = err.error || "Tidak ada pesanan ditemukan";
      }
    } catch (err) {
      errorMsg = "Gagal mencari pesanan. Coba lagi.";
    } finally {
      isSearching = false;
    }
  }

  /** @param {any} order */
  function selectOrder(order) {
    foundOrder = order;
    phoneResults = [];
  }

  function switchToPhone() {
    searchMode = "phone";
    errorMsg = "";
    foundOrder = null;
    phoneResults = [];
  }

  function switchToId() {
    searchMode = "id";
    errorMsg = "";
    foundOrder = null;
    phoneResults = [];
    phoneQuery = "";
  }

  function resetAndClose() {
    searchMode = "id";
    orderIdQuery = "";
    phoneQuery = "";
    errorMsg = "";
    foundOrder = null;
    phoneResults = [];
    onClose();
  }

  /**
   * @param {string} dateStr
   */
  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  /**
   * @param {string} dateStr
   */
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  /**
   * @param {string} status
   */
  function statusLabel(status) {
    if (status === "completed") return "Selesai";
    if (status === "confirmed") return "Sedang Diproses";
    return "Menunggu Pembayaran";
  }

  /**
   * @param {string} status
   */
  function statusDescription(status) {
    if (status === "completed") return "Pesanan Anda sudah siap! Silakan ambil di kasir.";
    if (status === "confirmed") return "Pesanan sedang disiapkan. Mohon tunggu panggilan nama Anda.";
    return "Menunggu pembayaran dikonfirmasi.";
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" transition:fade={{ duration: 200 }}>
    <div class="modal-content" transition:fly={{ y: 50, duration: 300 }}>
      <div class="modal-header">
        <h2>📋 Status Pesanan</h2>
        <button on:click={resetAndClose} class="close-btn">
          <X size={24} />
        </button>
      </div>

      {#if !foundOrder}
        <!-- SEARCH VIEWS -->
        {#if searchMode === "id"}
          <!-- Primary: Search by Order ID -->
          <div class="search-section" transition:fade={{ duration: 150 }}>
            <div class="search-icon-header">
              <div class="icon-circle">
                <Hash size={28} />
              </div>
              <p class="help-text">Masukkan <strong>nomor pesanan</strong> untuk cek status.</p>
            </div>

            <div class="search-box">
              <span class="input-prefix">#</span>
              <input
                type="number"
                bind:value={orderIdQuery}
                placeholder="Contoh: 14"
                on:keydown={(e) => e.key === "Enter" && searchById()}
              />
              <button class="search-btn" on:click={searchById} disabled={isSearching}>
                {#if isSearching}
                  <div class="mini-spinner"></div>
                {:else}
                  <Search size={20} />
                {/if}
              </button>
            </div>

            {#if errorMsg}
              <p class="error-msg" transition:slide><AlertCircle size={14} /> {errorMsg}</p>
            {/if}

            <button class="fallback-link" on:click={switchToPhone}>
              <Phone size={14} />
              Lupa nomor pesanan? Cari dengan No HP
            </button>
          </div>

        {:else}
          <!-- Fallback: Search by Phone -->
          <div class="search-section" transition:fade={{ duration: 150 }}>
            <button class="back-link" on:click={switchToId}>
              <ArrowLeft size={16} />
              Kembali ke cari nomor pesanan
            </button>

            <div class="search-icon-header">
              <div class="icon-circle phone">
                <Phone size={28} />
              </div>
              <p class="help-text">Masukkan <strong>nomor HP</strong> yang Anda gunakan saat memesan.</p>
            </div>

            <div class="search-box">
              <input
                type="tel"
                bind:value={phoneQuery}
                placeholder="08xxxxxxxxxx"
                on:keydown={(e) => e.key === "Enter" && searchByPhone()}
              />
              <button class="search-btn" on:click={searchByPhone} disabled={isSearching}>
                {#if isSearching}
                  <div class="mini-spinner"></div>
                {:else}
                  <Search size={20} />
                {/if}
              </button>
            </div>

            {#if errorMsg}
              <p class="error-msg" transition:slide><AlertCircle size={14} /> {errorMsg}</p>
            {/if}

            <!-- Phone search results: list of orders to pick -->
            {#if phoneResults.length > 0}
              <div class="phone-results" transition:slide>
                <p class="results-label">Ditemukan {phoneResults.length} pesanan:</p>
                {#each phoneResults as order}
                  <button class="order-pick-card" on:click={() => selectOrder(order)} transition:fly={{ y: 10, duration: 200 }}>
                    <div class="pick-left">
                      <span class="pick-id">#{order.id}</span>
                      <span class="pick-name">{order.customer_name}</span>
                    </div>
                    <div class="pick-right">
                      <span class="pick-status" class:completed={order.status === 'completed'} class:confirmed={order.status === 'confirmed'} class:pending={order.status === 'pending'}>
                        {statusLabel(order.status)}
                      </span>
                      <span class="pick-time">{formatTime(order.created_at)}</span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

      {:else}
        <!-- ORDER STATUS DETAIL VIEW -->
        <div class="order-result" transition:fade>
          <button class="back-link" on:click={() => { foundOrder = null; }}>
            <ArrowLeft size={16} />
            Cari pesanan lain
          </button>

          <!-- Status Hero -->
          <div class="status-hero" class:completed={foundOrder.status === 'completed'} class:confirmed={foundOrder.status === 'confirmed'} class:pending={foundOrder.status === 'pending'}>
            <div class="status-icon-lg">
              {#if foundOrder.status === 'completed'}
                <CheckCircle size={40} />
              {:else if foundOrder.status === 'confirmed'}
                <Loader size={40} />
              {:else}
                <Clock size={40} />
              {/if}
            </div>
            <h3>{statusLabel(foundOrder.status)}</h3>
            <p class="status-desc">{statusDescription(foundOrder.status)}</p>
          </div>

          <!-- Order Info -->
          <div class="order-info-grid">
            <div class="info-item">
              <span class="info-label">No. Pesanan</span>
              <span class="info-value accent">#{foundOrder.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nama</span>
              <span class="info-value">{foundOrder.customer_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">No. HP</span>
              <span class="info-value">{foundOrder.customer_phone}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Waktu Pesan</span>
              <span class="info-value">{formatDate(foundOrder.created_at)} {formatTime(foundOrder.created_at)}</span>
            </div>
          </div>

          <!-- Items -->
          <div class="items-section">
            <h4><Package size={16} /> Detail Pesanan</h4>
            <div class="items-list">
              {#each foundOrder.items as item}
                <div class="item-row">
                  <span class="item-name">
                    {item.quantity}x {item.product_title}
                  </span>
                  <div class="item-meta">
                    {#if item.is_addon}
                      <span class="addon-tag">Tambahan</span>
                    {/if}
                    <span class="item-price">{formatRupiah(item.price_at_time)}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div class="order-total-row">
            <span>Total</span>
            <span class="total-amount">{formatRupiah(foundOrder.total)}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 200;
    background: rgba(45, 32, 22, 0.35);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-content {
    background: var(--color-bg-secondary);
    width: 90%;
    max-width: 460px;
    max-height: 85vh;
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-lg);
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  .modal-header h2 { font-size: 1.4rem; color: var(--color-text-primary); }

  .close-btn {
    background: transparent;
    color: var(--color-text-secondary);
    padding: 8px;
  }

  /* Search Section */
  .search-icon-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .icon-circle {
    width: 56px; height: 56px;
    background: var(--color-accent-subtle);
    color: var(--color-accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }

  .icon-circle.phone {
    background: rgba(59, 130, 246, 0.08);
    color: #3b82f6;
  }

  .help-text {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .help-text strong { color: var(--color-text-primary); }

  .search-box {
    display: flex;
    gap: 8px;
    align-items: stretch;
    margin-bottom: 8px;
  }

  .input-prefix {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-right: none;
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    color: var(--color-accent);
    font-size: 1.2rem;
    font-weight: 700;
  }

  .search-box input {
    flex: 1;
    padding: 14px 16px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .input-prefix + input {
    border-radius: 0;
    border-left: none;
  }

  .search-box input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-subtle);
  }

  .search-box input[type="number"]::-webkit-inner-spin-button,
  .search-box input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .search-box input[type="number"] { -webkit-appearance: textfield; -moz-appearance: textfield; appearance: textfield; }

  .search-btn {
    background: var(--color-accent);
    color: #fff;
    padding: 0 20px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 52px;
    transition: background 0.2s;
  }

  .search-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .search-btn:disabled { opacity: 0.5; }

  .mini-spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--color-border);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .error-msg {
    color: var(--color-danger);
    font-size: 0.85rem;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .fallback-link {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    color: var(--color-text-muted);
    font-size: 0.82rem;
    padding: 12px 0 0;
    margin-top: 8px;
    border-top: 1px solid var(--color-border);
    width: 100%;
    justify-content: center;
    transition: color 0.2s;
  }

  .fallback-link:hover { color: var(--color-text-secondary); }

  .back-link {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    color: var(--color-text-secondary);
    font-size: 0.85rem;
    padding: 0;
    margin-bottom: 16px;
    transition: color 0.2s;
  }

  .back-link:hover { color: var(--color-text-primary); }

  /* Phone Results */
  .phone-results { margin-top: 16px; }

  .results-label {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    margin-bottom: 10px;
  }

  .order-pick-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: 8px;
    color: var(--color-text-primary);
    text-align: left;
    transition: all 0.2s;
  }

  .order-pick-card:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
  }

  .pick-left {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .pick-id {
    font-weight: 700;
    color: var(--color-accent);
    font-size: 1rem;
  }

  .pick-name {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .pick-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .pick-status {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .pick-status.completed { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
  .pick-status.confirmed { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  .pick-status.pending { background: rgba(255, 153, 0, 0.1); color: #e68a00; }

  .pick-time { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }

  /* Status Hero */
  .status-hero {
    text-align: center;
    padding: 24px 16px;
    border-radius: var(--radius-lg);
    margin-bottom: 20px;
    animation: fadeInUp 0.4s ease;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .status-hero.completed {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.15));
    color: #16a34a;
  }

  .status-hero.confirmed {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.15));
    color: #3b82f6;
  }

  .status-hero.pending {
    background: linear-gradient(135deg, rgba(255, 153, 0, 0.08), rgba(255, 153, 0, 0.15));
    color: #e68a00;
  }

  .status-icon-lg {
    margin-bottom: 12px;
  }

  .status-hero.confirmed .status-icon-lg {
    animation: rotating 2s linear infinite;
  }

  @keyframes rotating {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .status-hero h3 {
    font-size: 1.3rem;
    font-weight: 800;
    margin-bottom: 6px;
  }

  .status-desc {
    font-size: 0.85rem;
    opacity: 0.85;
    line-height: 1.4;
  }

  /* Order Info Grid */
  .order-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }

  .info-item {
    background: var(--color-bg-primary);
    padding: 10px 12px;
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .info-label {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .info-value {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .info-value.accent { color: var(--color-accent); font-size: 1.1rem; }

  /* Items Section */
  .items-section {
    margin-bottom: 12px;
  }

  .items-section h4 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text-secondary);
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .items-list {
    max-height: 180px;
    overflow-y: auto;
  }

  .item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 0.9rem;
  }

  .item-name { flex: 1; }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .item-price { font-weight: 600; white-space: nowrap; }

  .addon-tag {
    font-size: 0.65rem;
    background: var(--color-accent-subtle);
    color: var(--color-accent);
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .order-total-row {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-top: 1px solid var(--color-border);
    font-size: 1rem;
    font-weight: 600;
  }

  .total-amount { color: var(--color-accent); font-size: 1.1rem; }

  .order-result { animation: fadeInUp 0.3s ease; }
</style>
