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
      : "var(--color-bg-warm)"}
  >
    {#if !image}
      <span class="no-image">🍜</span>
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
        <Plus size={22} />
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
    transition: transform 0.15s ease, box-shadow 0.25s ease;
    cursor: pointer;
  }

  .card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .card.pressed {
    transform: scale(0.98) translateY(0);
  }

  .image-area {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .no-image {
    font-size: 3rem;
    opacity: 0.4;
  }

  .content {
    padding: var(--spacing-md);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 800;
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
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--color-accent);
  }

  .add-btn {
    background: var(--color-accent);
    color: #fff;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(192, 57, 43, 0.2);
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
