<script>
  import { X, Plus, Minus } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { formatRupiah } from "./utils.js";

  export let isOpen = false;
  /** @type {Object|null} */
  export let product = {};
  export let onClose = () => {};
  export let onAddToCart = (item) => {};

  let quantity = 1;
  let selectedOptions = {};

  // Reset selections when product changes
  $: if (product) {
    quantity = 1;
    selectedOptions = {};
    // Pre-select defaults if needed (e.g. first option of required modifiers)
    if (product.modifiers) {
      product.modifiers.forEach((mod) => {
        if (mod.required && mod.options.length > 0) {
          selectedOptions[mod.id] = mod.options[0];
        }
      });
    }
  }

  $: basePrice = product ? product.price : 0;

  $: modifiersPrice = Object.values(selectedOptions).reduce((sum, opt) => {
    // If option is array (checkboxes), sum them up
    if (Array.isArray(opt)) {
      return sum + opt.reduce((s, o) => s + o.price, 0);
    }
    // Single option (radio)
    return sum + (opt ? opt.price : 0);
  }, 0);

  $: totalPrice = (basePrice + modifiersPrice) * quantity;

  function handleOptionSelect(modifierId, option, isMulti) {
    if (isMulti) {
      const current = selectedOptions[modifierId] || [];
      const exists = current.find((o) => o.label === option.label);
      if (exists) {
        selectedOptions[modifierId] = current.filter(
          (o) => o.label !== option.label,
        );
      } else {
        selectedOptions[modifierId] = [...current, option];
      }
    } else {
      selectedOptions[modifierId] = option;
    }
    selectedOptions = { ...selectedOptions }; // Trigger reactivity
  }

  function handleAdd() {
    onAddToCart({
      ...product,
      quantity,
      selectedOptions,
      totalPrice: totalPrice / quantity, // Unit price including modifiers
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
      role="document"
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
                  <span class="badge required">Required</span>
                {:else}
                  <span class="badge optional">Optional</span>
                {/if}
              </div>

              <div class="options-grid">
                {#each mod.options as opt}
                  <!-- Unique ID for labels -->
                  {@const uniqueId = `${mod.id}-${opt.label}`}
                  {@const isSelected = mod.required
                    ? selectedOptions[mod.id]?.label === opt.label
                    : (selectedOptions[mod.id] || []).find(
                        (o) => o.label === opt.label,
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
                        <span class="opt-price">+{formatRupiah(opt.price)}</span
                        >
                      {/if}
                    </div>
                  </label>
                {/each}
              </div>
            </div>
          {/each}
        {:else}
          <div class="no-options">
            No customization options available for this item.
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
          <span>Add to Order</span>
          <span class="price">{formatRupiah(totalPrice)}</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
    z-index: 200;
    display: flex;
    align-items: flex-end; /* Bottom sheet on mobile */
    justify-content: center;
  }

  .modal {
    background: #1e1e1e;
    width: 100%;
    max-width: 600px;
    height: 85vh;
    border-radius: 24px 24px 0 0;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
  }

  /* Desktop center modal */
  @media (min-width: 600px) {
    .backdrop {
      align-items: center;
    }
    .modal {
      height: auto;
      max-height: 85vh;
      border-radius: 24px;
    }
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .header {
    padding: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .title-group h2 {
    margin: 0;
    font-size: 1.5rem;
  }
  .desc {
    color: #888;
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
    background: #333;
    color: #aaa;
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .option-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    position: relative;
  }

  .option-card.selected {
    background: rgba(255, 92, 0, 0.1);
    border-color: var(--color-accent);
  }

  .option-card input {
    display: none;
  }

  .opt-content {
    display: flex;
    flex-direction: column;
  }

  .opt-name {
    font-weight: 500;
    font-size: 0.95rem;
  }
  .opt-price {
    font-size: 0.85rem;
    color: var(--color-accent);
    margin-top: 2px;
  }

  .footer {
    padding: 24px;
    background: #1e1e1e;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    gap: 16px;
  }

  .qty-control {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #333;
    padding: 4px 8px;
    border-radius: 50px;
    font-weight: 700;
  }

  .qty-control button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #444;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
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
