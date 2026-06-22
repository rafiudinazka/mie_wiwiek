<script>
  import { X, Plus, Minus } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { formatRupiah } from "./utils.js";

  export let isOpen = false;
  /** @type {any} */
  export let product = {};
  export let onClose = () => {};
  export let onAddToCart = (/** @type {any} */ item) => {};

  let quantity = 1;
  /** @type {Record<string, any>} */
  let selectedOptions = {};

  // Reset selections when product changes
  $: if (product) {
    quantity = 1;
    selectedOptions = {};
    if (product.modifiers) {
      product.modifiers.forEach((/** @type {any} */ mod) => {
        if (mod.required && mod.options.length > 0) {
          selectedOptions[mod.id] = mod.options[0];
        }
      });
    }
  }

  $: basePrice = product ? product.price : 0;

  $: modifiersPrice = Object.values(selectedOptions).reduce((sum, opt) => {
    if (Array.isArray(opt)) {
      return sum + opt.reduce((s, o) => s + o.price, 0);
    }
    return sum + (opt ? opt.price : 0);
  }, 0);

  $: totalPrice = (basePrice + modifiersPrice) * quantity;

  /**
   * @param {string} modifierId
   * @param {any} option
   * @param {boolean} isMulti
   */
  function handleOptionSelect(modifierId, option, isMulti) {
    if (isMulti) {
      const current = selectedOptions[modifierId] || [];
      const exists = current.find((/** @type {any} */ o) => o.label === option.label);
      if (exists) {
        selectedOptions[modifierId] = current.filter(
          (/** @type {any} */ o) => o.label !== option.label,
        );
      } else {
        selectedOptions[modifierId] = [...current, option];
      }
    } else {
      selectedOptions[modifierId] = option;
    }
    selectedOptions = { ...selectedOptions };
  }

  function handleAdd() {
    onAddToCart({
      ...product,
      quantity,
      selectedOptions,
      totalPrice: totalPrice / quantity,
    });
    onClose();
  }
</script>

{#if isOpen && product}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="backdrop" transition:fade={{ duration: 200 }} on:click={onClose}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="modal"
      transition:fly={{ y: 100, duration: 300 }}
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      tabindex="-1"
    >
      <button class="close-btn" on:click={onClose}>
        <X size={24} />
      </button>

      <div class="header">
        {#if product.image}
          <div
            class="image-preview"
            style:background-image={`url(${product.image})`}
          ></div>
        {/if}
        <div class="title-group">
          <h2>{product.title}</h2>
          <p class="desc">{product.description}</p>
        </div>
      </div>

      <div class="options-container">
        {#if product.modifiers}
          {#each product.modifiers as mod (mod.id)}
            <div class="modifier-group">
              <div class="mod-header">
                <h3>{mod.name}</h3>
                {#if mod.required}
                  <span class="badge required">Wajib</span>
                {:else}
                  <span class="badge optional">Opsional</span>
                {/if}
              </div>

              <div class="options-grid">
                {#each mod.options as opt}
                  {@const uniqueId = `${mod.id}-${opt.label}`}
                  {@const isSelected = mod.required
                    ? selectedOptions[mod.id]?.label === opt.label
                    : (selectedOptions[mod.id] || []).find(
                        (/** @type {any} */ o) => o.label === opt.label,
                      )}

                  <label class="option-card" class:selected={isSelected}>
                    <input
                      type={mod.required ? "radio" : "checkbox"}
                      name={mod.id}
                      value={opt}
                      checked={isSelected}
                      on:change={() =>
                        handleOptionSelect(mod.id, opt, !mod.required)}
                    />
                    <div class="opt-content">
                      <span class="opt-name">{opt.label}</span>
                      {#if opt.price > 0}
                        <span class="opt-price">+{formatRupiah(opt.price)}</span>
                      {/if}
                    </div>
                  </label>
                {/each}
              </div>
            </div>
          {/each}
        {:else}
          <div class="no-options">
            Tidak ada opsi kustomisasi untuk item ini.
          </div>
        {/if}
      </div>

      <div class="footer">
        <div class="qty-control">
          <button on:click={() => (quantity = Math.max(1, quantity - 1))}>
            <Minus size={20} />
          </button>
          <span>{quantity}</span>
          <button on:click={() => quantity++}>
            <Plus size={20} />
          </button>
        </div>

        <button class="add-cart-btn" on:click={handleAdd}>
          <span>Tambah ke Pesanan</span>
          <span class="price">{formatRupiah(totalPrice)}</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(45, 32, 22, 0.35);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .modal {
    background: var(--color-bg-secondary);
    width: 100%;
    max-width: 600px;
    height: 85vh;
    border-radius: 24px 24px 0 0;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.12);
  }

  @media (min-width: 600px) {
    .backdrop { align-items: center; }
    .modal {
      height: auto;
      max-height: 85vh;
      border-radius: 24px;
    }
  }

  .close-btn {
    position: absolute;
    top: 16px; right: 16px;
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border: 1px solid var(--color-border);
  }

  .header {
    padding: 24px;
    border-bottom: 1px solid var(--color-border);
  }

  .title-group h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-text-primary);
  }

  .desc {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin-top: 4px;
  }

  .options-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .modifier-group {
    margin-bottom: 32px;
  }

  .mod-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .mod-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .badge {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    text-transform: uppercase;
    font-weight: 700;
  }

  .badge.required {
    background: var(--color-accent);
    color: #fff;
  }

  .badge.optional {
    background: var(--color-bg-primary);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .option-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    position: relative;
  }

  .option-card:hover {
    border-color: var(--color-border-hover);
  }

  .option-card.selected {
    background: var(--color-accent-subtle);
    border-color: var(--color-accent);
  }

  .option-card input { display: none; }

  .opt-content {
    display: flex;
    flex-direction: column;
  }

  .opt-name {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--color-text-primary);
  }

  .opt-price {
    font-size: 0.85rem;
    color: var(--color-accent);
    margin-top: 2px;
  }

  .no-options {
    color: var(--color-text-muted);
    text-align: center;
    padding: 24px;
  }

  .footer {
    padding: 24px;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: 16px;
  }

  .qty-control {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--color-bg-primary);
    padding: 4px 8px;
    border-radius: 50px;
    font-weight: 700;
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
  }

  .qty-control button {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
  }

  .add-cart-btn {
    flex: 1;
    background: var(--color-accent);
    color: #fff;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1.1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
  }
</style>
