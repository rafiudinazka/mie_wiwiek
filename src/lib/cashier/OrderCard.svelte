<script>
  import { Printer, Check, User, Phone, Clock } from "lucide-svelte";
  import { fly } from "svelte/transition";
  import { formatRupiah } from "../utils.js";

  export let order = {};
  export let onPrint = () => {};
  export let onComplete = () => {};

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function parseModifiers(modifiersJson) {
    if (!modifiersJson) return null;
    try {
      return JSON.parse(modifiersJson);
    } catch {
      return null;
    }
  }
</script>

<div class="order-card" transition:fly={{ y: 20, duration: 300 }}>
  <div class="card-header">
    <div class="order-id">Order #{order.id}</div>
    <div class="order-time">
      <Clock size={14} />
      {formatTime(order.created_at)}
    </div>
  </div>

  <div class="customer-info">
    <div class="info-row">
      <User size={16} />
      <span class="customer-name">{order.customer_name}</span>
    </div>
    <div class="info-row">
      <Phone size={16} />
      <span>{order.customer_phone}</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="items-list">
    {#if order.items && order.items.length > 0}
      {#each order.items as item}
        <div class="item-row">
          <div class="item-details">
            <span class="item-name">
              {item.product_title || item.title}
              {#if item.quantity > 1}
                <span class="qty">x{item.quantity}</span>
              {/if}
            </span>
            {#if item.modifiers_json}
              {@const mods = parseModifiers(item.modifiers_json)}
              {#if mods}
                <div class="item-mods">
                  {#each Object.entries(mods) as [key, val]}
                    {#if Array.isArray(val)}
                      {#each val as v}
                        <span class="mod">+ {v.label}</span>
                      {/each}
                    {:else if val}
                      <span class="mod">+ {val.label}</span>
                    {/if}
                  {/each}
                </div>
              {/if}
            {/if}
          </div>
          <span class="item-price">{formatRupiah(item.price_at_time || 0)}</span
          >
        </div>
      {/each}
    {:else}
      <p class="no-items">No items</p>
    {/if}
  </div>

  <div class="divider"></div>

  <div class="order-total">
    <span>Total</span>
    <span class="total-amount">{formatRupiah(order.total || 0)}</span>
  </div>

  <div class="card-actions">
    <button class="btn print-btn" on:click={onPrint}>
      <Printer size={18} />
      Cetak Struk
    </button>
    <button class="btn complete-btn" on:click={onComplete}>
      <Check size={18} />
      Selesai
    </button>
  </div>
</div>

<style>
  .order-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 16px;
    transition: all 0.2s;
  }

  .order-card:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .order-id {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-accent);
  }

  .order-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .customer-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }

  .customer-name {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 1rem;
  }

  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
    margin: 12px 0;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 150px;
    overflow-y: auto;
  }

  .item-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .item-details {
    flex: 1;
  }

  .item-name {
    font-size: 0.95rem;
  }

  .qty {
    color: var(--color-text-secondary);
    font-size: 0.85rem;
  }

  .item-mods {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  .mod {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .item-price {
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .no-items {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    text-align: center;
    padding: 12px;
  }

  .order-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .total-amount {
    font-size: 1.25rem;
    color: var(--color-accent);
  }

  .card-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  .btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .print-btn {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
  }

  .print-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .complete-btn {
    background: var(--color-success);
    color: #fff;
  }

  .complete-btn:hover {
    filter: brightness(1.1);
  }
</style>
