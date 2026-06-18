<script>
  import { onMount } from "svelte";
  import { Plus, Edit2, Trash2, X } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { apiFetch } from "../api.js";

  /** @type {any[]} */
  let categories = [];
  let loading = true;
  let showModal = false;
  /** @type {any} */
  let editingCategory = null;

  let formData = {
    id: "",
    label: "",
    sort_order: 0,
  };
  let formError = "";

  onMount(fetchCategories);

  async function fetchCategories() {
    loading = true;
    try {
      const res = await apiFetch("/api/categories");
      if (res.ok) {
        categories = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      loading = false;
    }
  }

  function openAddModal() {
    editingCategory = null;
    formData = {
      id: "",
      label: "",
      sort_order: categories.length + 1,
    };
    formError = "";
    showModal = true;
  }

  function openEditModal(/** @type {any} */ category) {
    editingCategory = category;
    formData = {
      id: category.id,
      label: category.label,
      sort_order: category.sort_order,
    };
    formError = "";
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingCategory = null;
  }

  async function handleSubmit() {
    if (!formData.label.trim()) {
      formError = "Nama kategori wajib diisi";
      return;
    }

    if (!editingCategory && !formData.id.trim()) {
      // Auto-generate ID from label
      formData.id = formData.label
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }

    formError = "";

    try {
      let res;
      if (editingCategory) {
        res = await apiFetch(
          `/api/categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: formData.label.trim(),
              sort_order: formData.sort_order,
            }),
          },
        );
      } else {
        res = await apiFetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: formData.id.trim(),
            label: formData.label.trim(),
            sort_order: formData.sort_order,
          }),
        });
      }

      if (res.ok) {
        closeModal();
        fetchCategories();
      } else {
        const data = await res.json();
        formError = data.error || "Gagal menyimpan kategori";
      }
    } catch (err) {
      formError = "Gagal terhubung ke server";
    }
  }

  async function handleDelete(/** @type {any} */ category) {
    if (
      !confirm(
        `Hapus kategori "${category.label}"? Pastikan tidak ada produk dalam kategori ini.`,
      )
    )
      return;

    try {
      const res = await apiFetch(
        `/api/categories/${category.id}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus kategori");
      }
    } catch (err) {
      alert("Gagal terhubung ke server");
    }
  }
</script>

<div class="page">
  <header class="page-header">
    <div>
      <h1>Kategori</h1>
      <p>Kelola kategori menu</p>
    </div>
    <button class="add-btn" on:click={openAddModal}>
      <Plus size={20} />
      Tambah Kategori
    </button>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
    </div>
  {:else if categories.length === 0}
    <div class="empty-state">
      <p>Belum ada kategori</p>
      <button class="add-btn" on:click={openAddModal}>
        <Plus size={18} />
        Tambah Kategori Pertama
      </button>
    </div>
  {:else}
    <div class="categories-grid">
      {#each categories as category (category.id)}
        <div class="category-card">
          <div class="category-info">
            <span class="category-label">{category.label}</span>
            <span class="category-id">ID: {category.id}</span>
          </div>
          <div class="category-actions">
            <button
              class="icon-btn edit"
              on:click={() => openEditModal(category)}
            >
              <Edit2 size={16} />
            </button>
            <button
              class="icon-btn delete"
              on:click={() => handleDelete(category)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal -->
{#if showModal}
  <div class="modal-backdrop" transition:fade={{ duration: 150 }}>
    <div class="modal" transition:fly={{ y: 20, duration: 200 }}>
      <div class="modal-header">
        <h2>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</h2>
        <button class="close-btn" on:click={closeModal}>
          <X size={20} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="label">Nama Kategori *</label>
          <input
            type="text"
            id="label"
            bind:value={formData.label}
            placeholder="Nama kategori"
          />
        </div>

        {#if !editingCategory}
          <div class="form-group">
            <label for="id">ID Kategori (opsional)</label>
            <input
              type="text"
              id="id"
              bind:value={formData.id}
              placeholder="Auto-generate dari nama"
            />
            <span class="form-hint"
              >ID akan di-generate otomatis jika kosong</span
            >
          </div>
        {/if}

        <div class="form-group">
          <label for="sort">Urutan</label>
          <input
            type="number"
            id="sort"
            bind:value={formData.sort_order}
            min="0"
          />
        </div>

        {#if formError}
          <p class="error-text">{formError}</p>
        {/if}

        <div class="modal-actions">
          <button type="button" class="btn-secondary" on:click={closeModal}
            >Batal</button
          >
          <button type="submit" class="btn-primary">
            {editingCategory ? "Simpan" : "Tambah"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .page {
    max-width: 800px;
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
    font-weight: 700;
    margin-bottom: 4px;
  }

  .page-header p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: var(--color-accent);
    color: #fff;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .add-btn:hover {
    background: var(--color-accent-hover);
  }

  .loading,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    color: var(--color-text-secondary);
    gap: 16px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .categories-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .category-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: var(--color-bg-secondary);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .category-card:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .category-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .category-label {
    font-weight: 600;
    font-size: 1.05rem;
  }

  .category-id {
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .category-actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .icon-btn.edit {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .icon-btn.edit:hover {
    background: rgba(59, 130, 246, 0.2);
  }

  .icon-btn.delete {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .icon-btn.delete:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
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
    max-width: 400px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .modal-header h2 {
    font-size: 1.25rem;
    margin: 0;
  }

  .close-btn {
    padding: 8px;
    color: var(--color-text-secondary);
  }

  form {
    padding: 24px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--color-text-secondary);
  }

  input {
    width: 100%;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: var(--color-text-primary);
    font-size: 0.95rem;
  }

  input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .form-hint {
    display: block;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-top: 6px;
  }

  .error-text {
    color: var(--color-danger);
    font-size: 0.85rem;
    margin-bottom: 16px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .btn-secondary,
  .btn-primary {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
  }

  .btn-primary {
    background: var(--color-accent);
    color: #fff;
  }

  .btn-primary:hover {
    background: var(--color-accent-hover);
  }
</style>
