<script>
  import { X, Search, AlertCircle, PlusCircle, Hash, Phone, ArrowLeft, ChevronRight } from "lucide-svelte";
  import { fade, fly, slide } from "svelte/transition";
  import { formatRupiah } from "./utils.js";
  import { apiFetch } from "./api.js";
  import { addonOrder } from "./cart.js";

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
    const q = orderIdQuery.trim();
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

  function handleAddMenu() {
    addonOrder.set(foundOrder);
    resetAndClose();
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
   * @param {string} status
   */
  function statusLabel(status) {
    if (status === "completed") return "Selesai";
    if (status === "confirmed") return "Diproses";
    return "Pending";
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" transition:fade={{ duration: 200 }}>
    <div class="modal-content" transition:fly={{ y: 50, duration: 300 }}>
      <div class="modal-header">
        <h2>Tambah Pesanan</h2>
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
              <p class="help-text">Masukkan <strong>nomor pesanan</strong> yang tercetak di struk Anda.</p>
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
                <p class="results-label">Ditemukan {phoneResults.length} pesanan aktif:</p>
                {#each phoneResults as order}
                  <button class="order-pick-card" on:click={() => selectOrder(order)} transition:fly={{ y: 10, duration: 200 }}>
                    <div class="pick-left">
                      <span class="pick-id">#{order.id}</span>
                      <span class="pick-name">{order.customer_name}</span>
                    </div>
                    <div class="pick-right">
                      <span class="pick-total">{formatRupiah(order.total)}</span>
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
        <!-- ORDER DETAIL VIEW -->
        <div class="order-result" transition:fade>
          <button class="back-link" on:click={() => { foundOrder = null; }}>
            <ArrowLeft size={16} />
            Cari pesanan lain
          </button>

          <div class="order-detail-header">
            <h3>Pesanan #{foundOrder.id}</h3>
            <div class="status-badge" class:completed={foundOrder.status === 'completed'} class:confirmed={foundOrder.status === 'confirmed'}>
              {statusLabel(foundOrder.status)}
            </div>
          </div>

          <p class="customer-info">{foundOrder.customer_name} — {foundOrder.customer_phone}</p>

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

          <div class="order-total-row">
            <span>Total saat ini</span>
            <span class="total-amount">{formatRupiah(foundOrder.total)}</span>
          </div>

          {#if foundOrder.status === 'completed'}
            <div class="warning-box">
              Pesanan ini sudah selesai. Anda tidak dapat menambah menu lagi.
            </div>
          {:else}
            <button class="add-menu-btn" on:click={handleAddMenu}>
              <PlusCircle size={20} />
              Tambah Menu ke Pesanan Ini
            </button>
          {/if}
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
    background: rgba(0, 0, 0, 0.3);
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
    border: 2px solid rgba(255,255,255,0.3);
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

  .pick-total { font-weight: 600; font-size: 0.9rem; }
  .pick-time { font-size: 0.75rem; color: var(--color-text-muted); }

  .order-result { animation: fadeIn 0.2s ease; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .order-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .order-detail-header h3 {
    margin: 0;
    color: var(--color-accent);
    font-size: 1.3rem;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(255, 153, 0, 0.1);
    color: #e68a00;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .status-badge.confirmed {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .status-badge.completed {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  }

  .customer-info {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin-bottom: 16px;
  }

  .items-list {
    max-height: 180px;
    overflow-y: auto;
    margin-bottom: 12px;
    border-top: 1px solid var(--color-border);
    padding-top: 10px;
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

  .add-menu-btn {
    width: 100%;
    background: var(--color-accent);
    color: white;
    padding: 14px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    font-size: 1rem;
    margin-top: 8px;
    transition: filter 0.2s;
  }

  .add-menu-btn:hover { filter: brightness(1.1); }

  .warning-box {
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #dc2626;
    padding: 12px;
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    text-align: center;
    margin-top: 8px;
  }
</style>
