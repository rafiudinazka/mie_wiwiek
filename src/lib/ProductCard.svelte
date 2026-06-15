<script>
  import { Plus } from "lucide-svelte";
  import { formatRupiah } from "./utils.js";

  export let title;
  export let price;
  export let description;
  export let image = null;
  export let onAdd = () => {};

  let isPressed = false;
</script>

<div
  class="card"
  class:pressed={isPressed}
  on:mousedown={() => (isPressed = true)}
  on:mouseup={() => (isPressed = false)}
  on:mouseleave={() => (isPressed = false)}
  on:touchstart={() => (isPressed = true)}
  on:touchend={() => (isPressed = false)}
  role="button"
  tabindex="0"
>
  <div
    class="image-area"
    style:background={image
      ? `url(${image}) center/cover no-repeat`
      : "#2a2a2a"}
  >
    {#if !image}
      <span class="no-image">No Image</span>
    {/if}
  </div>

  <div class="content">
    <h3>{title}</h3>
    <p>{description}</p>

    <div class="actions">
      <span class="price">{formatRupiah(price)}</span>

      <button
        class="add-btn"
        on:click|stopPropagation={onAdd}
        on:mousedown|stopPropagation={(e) =>
          (e.currentTarget.style.transform = "scale(0.9)")}
        on:mouseup|stopPropagation={(e) =>
          (e.currentTarget.style.transform = "scale(1)")}
      >
        <Plus size={24} />
      </button>
    </div>
  </div>
</div>

<style>
  .card {
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    transition: transform 0.1s ease;
    cursor: pointer;
  }

  .card.pressed {
    transform: scale(0.98);
  }

  .image-area {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .no-image {
    opacity: 0.3;
  }

  .content {
    padding: var(--spacing-md);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: var(--spacing-xs);
  }

  p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.4;
    margin-bottom: var(--spacing-md);
    flex: 1;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .price {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .add-btn {
    background: var(--color-accent);
    color: #fff;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3);
    transition: transform 0.1s ease;
  }
</style>
