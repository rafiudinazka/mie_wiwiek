<script>
  import { onMount } from "svelte";
  import { Users, Plus, Edit3, Trash2, X, Check, XCircle, Eye, EyeOff } from "lucide-svelte";
  import { fade, slide } from "svelte/transition";
  import { apiFetch } from "../api.js";

  /** @type {any[]} */
  let cashiers = [];
  let loading = true;
  let showForm = false;
  /** @type {number | null} */
  let editingId = null;

  // Form state
  let formName = "";
  let formUsername = "";
  let formPin = "";
  let formError = "";
  let formLoading = false;
  let showPin = false;

  onMount(() => {
    fetchCashiers();
  });

  async function fetchCashiers() {
    loading = true;
    try {
      const res = await apiFetch("/api/admin/cashiers");
      if (res.ok) {
        cashiers = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch cashiers:", err);
    } finally {
      loading = false;
    }
  }

  function openAddForm() {
    editingId = null;
    formName = "";
    formUsername = "";
    formPin = "";
    formError = "";
    showForm = true;
    showPin = false;
  }

  /** @param {any} cashier */
  function openEditForm(cashier) {
    editingId = cashier.id;
    formName = cashier.name;
    formUsername = cashier.username;
    formPin = "";
    formError = "";
    showForm = true;
    showPin = false;
  }

  function closeForm() {
    showForm = false;
    editingId = null;
    formError = "";
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      formError = "Nama wajib diisi";
      return;
    }
    if (!formUsername.trim()) {
      formError = "Username wajib diisi";
      return;
    }
    if (!editingId && (!formPin || formPin.length !== 4)) {
      formError = "PIN harus 4 digit angka";
      return;
    }
    if (formPin && (formPin.length !== 4 || !/^\d{4}$/.test(formPin))) {
      formError = "PIN harus 4 digit angka";
      return;
    }

    formLoading = true;
    formError = "";

    try {
      const body = {
        name: formName.trim(),
        username: formUsername.trim().toLowerCase(),
      };

      if (formPin) {
        // @ts-ignore
        body.pin = formPin;
      }

      let res;
      if (editingId) {
        res = await apiFetch(`/api/admin/cashiers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await apiFetch("/api/admin/cashiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        closeForm();
        fetchCashiers();
      } else {
        const data = await res.json();
        formError = data.error || "Gagal menyimpan";
      }
    } catch (err) {
      formError = "Gagal terhubung ke server";
    } finally {
      formLoading = false;
    }
  }

  /** @param {any} cashier */
  async function toggleActive(cashier) {
    try {
      await apiFetch(`/api/admin/cashiers/${cashier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: cashier.is_active ? 0 : 1 }),
      });
      fetchCashiers();
    } catch (err) {
      console.error("Failed to toggle cashier:", err);
    }
  }

  /** @param {number} id */
  async function deleteCashier(id) {
    if (!confirm("Yakin ingin menghapus akun kasir ini?")) return;

    try {
      const res = await apiFetch(`/api/admin/cashiers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCashiers();
      }
    } catch (err) {
      console.error("Failed to delete cashier:", err);
    }
  }
</script>

<div class="manager">
  <header class="page-header">
    <div>
      <h1><Users size={24} /> Kelola Akun Kasir</h1>
      <p>Tambah, edit, atau nonaktifkan akun kasir</p>
    </div>
    <button class="add-btn" on:click={openAddForm}>
      <Plus size={18} />
      Tambah Kasir
    </button>
  </header>

  {#if showForm}
    <div class="form-card" transition:slide={{ duration: 250 }}>
      <div class="form-header">
        <h3>{editingId ? "Edit Kasir" : "Tambah Kasir Baru"}</h3>
        <button class="icon-btn" on:click={closeForm}>
          <X size={20} />
        </button>
      </div>

      <div class="form-body">
        <div class="form-group">
          <label for="cashier-name">Nama Lengkap</label>
          <input
            id="cashier-name"
            type="text"
            placeholder="Contoh: Budi Santoso"
            bind:value={formName}
          />
        </div>

        <div class="form-group">
          <label for="cashier-uname">Username</label>
          <input
            id="cashier-uname"
            type="text"
            placeholder="Contoh: kasir2"
            bind:value={formUsername}
          />
          <span class="hint">Username digunakan untuk login kasir</span>
        </div>

        <div class="form-group">
          <label for="cashier-pin">
            PIN (4 digit) {editingId ? "(kosongkan jika tidak diubah)" : ""}
          </label>
          <div class="pin-row">
            <input
              id="cashier-pin"
              type={showPin ? "text" : "password"}
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="4"
              placeholder={editingId ? "••••" : "0000"}
              bind:value={formPin}
              on:input={(e) => { formPin = (/** @type {HTMLInputElement} */ (e.target)).value.replace(/[^0-9]/g, "").slice(0, 4); }}
            />
            <button class="icon-btn" on:click={() => showPin = !showPin}>
              {#if showPin}
                <EyeOff size={18} />
              {:else}
                <Eye size={18} />
              {/if}
            </button>
          </div>
        </div>

        {#if formError}
          <p class="error-text" transition:fade={{ duration: 150 }}>{formError}</p>
        {/if}

        <div class="form-actions">
          <button class="cancel-btn" on:click={closeForm}>Batal</button>
          <button class="save-btn" on:click={handleSubmit} disabled={formLoading}>
            {#if formLoading}
              <span class="mini-spinner"></span>
            {:else}
              <Check size={16} />
            {/if}
            {editingId ? "Simpan Perubahan" : "Tambah Kasir"}
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Memuat data kasir...</p>
    </div>
  {:else if cashiers.length === 0}
    <div class="empty-state">
      <Users size={48} />
      <p>Belum ada akun kasir</p>
      <span>Klik "Tambah Kasir" untuk membuat akun baru</span>
    </div>
  {:else}
    <div class="cashier-table">
      <div class="table-header">
        <span class="col-name">Nama</span>
        <span class="col-username">Username</span>
        <span class="col-status">Status</span>
        <span class="col-actions">Aksi</span>
      </div>
      {#each cashiers as cashier (cashier.id)}
        <div class="table-row" class:inactive={!cashier.is_active} transition:fade={{ duration: 150 }}>
          <span class="col-name">
            <span class="avatar">{cashier.name.charAt(0).toUpperCase()}</span>
            {cashier.name}
          </span>
          <span class="col-username">
            <code>{cashier.username}</code>
          </span>
          <span class="col-status">
            <button class="status-toggle" class:active={cashier.is_active} on:click={() => toggleActive(cashier)}>
              {#if cashier.is_active}
                <Check size={14} /> Aktif
              {:else}
                <XCircle size={14} /> Nonaktif
              {/if}
            </button>
          </span>
          <span class="col-actions">
            <button class="action-btn edit" on:click={() => openEditForm(cashier)} title="Edit">
              <Edit3 size={16} />
            </button>
            <button class="action-btn delete" on:click={() => deleteCashier(cashier.id)} title="Hapus">
              <Trash2 size={16} />
            </button>
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .manager {
    max-width: 900px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .page-header h1 {
    font-size: 1.75rem;
    font-weight: 800;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .page-header p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: var(--color-accent);
    color: #fff;
    font-weight: 700;
    font-size: 0.9rem;
    border-radius: 10px;
    transition: all 0.2s;
  }

  .add-btn:hover { filter: brightness(1.1); }

  /* Form Card */
  .form-card {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    border: 2px solid var(--color-accent);
    margin-bottom: 24px;
    overflow: hidden;
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--color-accent-subtle);
    border-bottom: 1px solid var(--color-border);
  }

  .form-header h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-accent);
  }

  .icon-btn {
    background: transparent;
    color: var(--color-text-secondary);
    padding: 4px;
    display: flex;
  }

  .icon-btn:hover { color: var(--color-text-primary); }

  .form-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .form-group input {
    padding: 12px 14px;
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-primary);
    font-size: 0.95rem;
    font-weight: 600;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-subtle);
  }

  .hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .pin-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .pin-row input { flex: 1; }

  .error-text {
    color: var(--color-danger);
    font-size: 0.85rem;
    text-align: center;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .cancel-btn {
    padding: 10px 20px;
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .cancel-btn:hover { background: var(--color-border-hover); }

  .save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: var(--color-accent);
    color: #fff;
    font-weight: 700;
    border-radius: 10px;
    transition: all 0.2s;
  }

  .save-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .save-btn:disabled { opacity: 0.5; }

  .mini-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Loading & Empty */
  .loading, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .empty-state p {
    font-size: 1.1rem;
    margin: 16px 0 8px;
  }

  .empty-state span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  /* Table */
  .cashier-table {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1.5fr 1fr 0.8fr 0.8fr;
    padding: 12px 20px;
    background: var(--color-bg-warm);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--color-border);
  }

  .table-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 0.8fr 0.8fr;
    padding: 14px 20px;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
    transition: background 0.2s;
  }

  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: var(--color-bg-warm); }
  .table-row.inactive { opacity: 0.5; }

  .col-name {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 0.95rem;
  }

  .avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--color-accent-subtle);
    color: var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .col-username code {
    background: var(--color-bg-warm);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .status-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    transition: all 0.2s;
  }

  .status-toggle.active {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  }

  .status-toggle:not(.active) {
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
  }

  .col-actions {
    display: flex;
    gap: 6px;
  }

  .action-btn {
    padding: 6px;
    border-radius: 8px;
    color: var(--color-text-secondary);
    transition: all 0.2s;
    display: flex;
  }

  .action-btn.edit:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.08);
    color: #dc2626;
  }

  @media (max-width: 600px) {
    .table-header { display: none; }
    .table-row {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 16px;
    }
    .col-status { justify-self: start; }
    .col-actions { justify-self: start; }
  }
</style>
