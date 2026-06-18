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
      : "#e8e8e3"}
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
    background: var(--color-bg-secondary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    transition: transform 0.1s ease, box-shadow 0.2s ease;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
  }

  .card:hover {
    box-shadow: var(--shadow-md);
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
    color: var(--color-text-muted);
    opacity: 0.5;
  }

  .content {
    padding: var(--spacing-md);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  h3 {
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: var(--spacing-xs);
    color: var(--color-text-primary);
  }

  p {
    font-size: 0.85rem;
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
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-accent);
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
    box-shadow: 0 2px 8px rgba(212, 50, 28, 0.3);
    transition: transform 0.1s ease;
  }

  @media (max-width: 600px) {
    .image-area {
      height: 120px;
    }

    .content {
      padding: var(--spacing-sm);
    }

    h3 {
      font-size: 0.95rem;
      margin-bottom: 2px;
    }

    p {
      font-size: 0.75rem;
      margin-bottom: var(--spacing-sm);
      /* Truncate long descriptions to 2 lines on mobile */
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .actions {
      margin-top: auto;
    }

    .price {
      font-size: 0.95rem;
    }

    .add-btn {
      width: 32px;
      height: 32px;
    }
  }
</style>
