<script>
  import { onMount } from "svelte";
  import { Plus, Edit2, Trash2, X } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { formatRupiah } from "../utils.js";
  import { apiFetch } from "../api.js";

  /** @type {any[]} */
  let products = [];
  /** @type {any[]} */
  let categories = [];
  let loading = true;
  let showModal = false;
  /** @type {any} */
  let editingProduct = null;

  // Form data
  let formData = {
    title: "",
    price: "",
    category_id: "",
    description: "",
    image: "",
    modifiers: [],
  };

  let formError = "";

  onMount(() => {
    fetchProducts();
    fetchCategories();
  });

  async function fetchProducts() {
    loading = true;
    try {
      const res = await apiFetch("/api/products?include_unavailable=true");
      if (res.ok) {
        products = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      loading = false;
    }
  }

  async function fetchCategories() {
    try {
      const res = await apiFetch("/api/categories");
      if (res.ok) {
        categories = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }

  function openAddModal() {
    editingProduct = null;
    formData = {
      title: "",
      price: "",
      category_id: categories[0]?.id || "",
      description: "",
      image: "",
      modifiers: [],
    };
    formError = "";
    showModal = true;
  }

  function openEditModal(/** @type {any} */ product) {
    editingProduct = product;
    formData = {
      title: product.title,
      price: product.price.toString(),
      category_id: product.category_id,
      description: product.description || "",
      image: product.image || "",
      modifiers: product.modifiers || [],
    };
    formError = "";
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingProduct = null;
  }

  async function handleSubmit() {
    if (!formData.title.trim()) {
      formError = "Nama produk wajib diisi";
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      formError = "Harga harus lebih dari 0";
      return;
    }
    if (!formData.category_id) {
      formError = "Pilih kategori";
      return;
    }

    formError = "";

    const payload = {
      title: formData.title.trim(),
      price: parseFloat(formData.price),
      category_id: formData.category_id,
      description: formData.description.trim(),
      image: formData.image.trim(),
      modifiers: formData.modifiers,
    };

    try {
      let res;
      if (editingProduct) {
        res = await apiFetch(
          `/api/products/${editingProduct.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
      } else {
        res = await apiFetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        closeModal();
        fetchProducts();
      } else {
        formError = "Gagal menyimpan produk";
      }
    } catch (err) {
      formError = "Gagal terhubung ke server";
    }
  }

  async function handleDelete(/** @type {any} */ product) {
    if (!confirm(`Hapus produk "${product.title}"?`)) return;

    try {
      const res = await apiFetch(
        `/api/products/${product.id}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      alert("Gagal menghapus produk");
    }
  }

  function getCategoryLabel(/** @type {any} */ categoryId) {
    return categories.find((c) => c.id === categoryId)?.label || categoryId;
  }

  async function toggleAvailability(/** @type {any} */ product) {
    try {
      const res = await apiFetch(
        `/api/products/${product.id}/toggle-availability`,
        { method: "POST" },
      );
      if (res.ok) {
        const result = await res.json();
        // Update local state instantly
        product.is_available = result.is_available;
        products = [...products];
      }
    } catch (err) {
      alert("Gagal mengubah status produk");
    }
  }
</script>

<div class="page">
  <header class="page-header">
    <div>
      <h1>Produk</h1>
      <p>Kelola menu produk Anda</p>
    </div>
    <button class="add-btn" on:click={openAddModal}>
      <Plus size={20} />
      Tambah Produk
    </button>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
    </div>
  {:else if products.length === 0}
    <div class="empty-state">
      <p>Belum ada produk</p>
      <button class="add-btn" on:click={openAddModal}>
        <Plus size={18} />
        Tambah Produk Pertama
      </button>
    </div>
  {:else}
    <div class="products-table">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Kategori</th>
            <th>Harga</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each products as product (product.id)}
            <tr class:unavailable={!product.is_available}>
              <td>
                <div class="product-info">
                  <span class="product-title">{product.title}</span>
                  {#if product.description}
                    <span class="product-desc">{product.description}</span>
                  {/if}
                </div>
              </td>
              <td>
                <span class="category-badge"
                  >{getCategoryLabel(product.category_id)}</span
                >
              </td>
              <td class="price">{formatRupiah(product.price)}</td>
              <td>
                <button
                  class="toggle-btn"
                  class:active={product.is_available}
                  on:click={() => toggleAvailability(product)}
                  title={product.is_available ? "Klik untuk tandai habis" : "Klik untuk tandai tersedia"}
                >
                  <span class="toggle-track">
                    <span class="toggle-thumb"></span>
                  </span>
                  <span class="toggle-label">
                    {product.is_available ? "Tersedia" : "Habis"}
                  </span>
                </button>
              </td>
              <td>
                <div class="actions">
                  <button
                    class="icon-btn edit"
                    on:click={() => openEditModal(product)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    class="icon-btn delete"
                    on:click={() => handleDelete(product)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Modal -->
{#if showModal}
  <div class="modal-backdrop" transition:fade={{ duration: 150 }}>
    <div class="modal" transition:fly={{ y: 20, duration: 200 }}>
      <div class="modal-header">
        <h2>{editingProduct ? "Edit Produk" : "Tambah Produk"}</h2>
        <button class="close-btn" on:click={closeModal}>
          <X size={20} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="title">Nama Produk *</label>
          <input
            type="text"
            id="title"
            bind:value={formData.title}
            placeholder="Nama produk"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="price">Harga *</label>
            <input
              type="number"
              id="price"
              bind:value={formData.price}
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label for="category">Kategori *</label>
            <select id="category" bind:value={formData.category_id}>
              {#each categories as cat}
                <option value={cat.id}>{cat.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Deskripsi</label>
          <textarea
            id="description"
            bind:value={formData.description}
            placeholder="Deskripsi produk"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="image">URL Gambar</label>
          <input
            type="text"
            id="image"
            bind:value={formData.image}
            placeholder="https://..."
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
            {editingProduct ? "Simpan" : "Tambah"}
          </button>
        </div>
      </form>
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

  .products-table {
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
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  th {
    background: var(--color-bg-warm);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .product-info {
    display: flex;
    flex-direction: column;
  }

  .product-title {
    font-weight: 500;
  }

  .product-desc {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-top: 2px;
  }

  .category-badge {
    display: inline-block;
    padding: 4px 10px;
    background: var(--color-bg-warm);
    border-radius: 6px;
    font-size: 0.8rem;
  }

  .price {
    font-weight: 600;
    color: var(--color-accent);
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
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

  /* Toggle Switch */
  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
  }

  .toggle-track {
    width: 40px;
    height: 22px;
    border-radius: 11px;
    background: #ccc;
    position: relative;
    transition: background 0.2s ease;
    flex-shrink: 0;
  }

  .toggle-btn.active .toggle-track {
    background: var(--color-success, #22c55e);
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .toggle-btn.active .toggle-thumb {
    transform: translateX(18px);
  }

  .toggle-label {
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .toggle-btn.active .toggle-label {
    color: var(--color-success, #22c55e);
  }

  .toggle-btn:not(.active) .toggle-label {
    color: var(--color-danger, #ef4444);
  }

  /* Unavailable row */
  tr.unavailable {
    opacity: 0.55;
  }

  tr.unavailable .product-title {
    text-decoration: line-through;
  }

  tr.unavailable:hover {
    opacity: 0.75;
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
    max-width: 500px;
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

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--color-text-secondary);
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 12px 14px;
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-primary);
    font-size: 0.95rem;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  select {
    cursor: pointer;
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
    background: var(--color-bg-warm);
    color: var(--color-text-primary);
  }

  .btn-primary {
    background: var(--color-accent);
    color: #fff;
  }

  .btn-primary:hover {
    background: var(--color-accent-hover);
  }

  @media (max-width: 600px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    th,
    td {
      padding: 12px;
      font-size: 0.9rem;
    }
  }
</style>
