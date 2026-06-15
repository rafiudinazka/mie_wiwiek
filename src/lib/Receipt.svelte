<script>
  export let orderId = 0;
  export let customerName = "";
  export let customerPhone = "";
  /** @type {Array<any>} */
  export let items = [];
  export let total = 0;
  export let paymentMethod = "Simulated";
  export let createdAt = new Date();
  export let restaurantName = "MIE WIWIEK";

  import { formatRupiah } from "./utils.js";

  /** @param {string|Date} date */
  function formatDate(date) {
    const d = new Date(date);
    return (
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }

  export function print() {
    window.print();
  }
</script>

<div class="receipt receipt-print">
  <div class="receipt-header">
    <div class="logo">🍜</div>
    <h1>{restaurantName}</h1>
    <div class="divider double"></div>
  </div>

  <div class="receipt-info">
    <div class="info-row">
      <span>Order</span>
      <span class="order-id">#{orderId}</span>
    </div>
    <div class="info-row">
      <span>Tanggal</span>
      <span>{formatDate(createdAt)}</span>
    </div>
    <div class="divider"></div>
    <div class="info-row">
      <span>Nama</span>
      <span class="bold">{customerName}</span>
    </div>
    <div class="info-row">
      <span>No HP</span>
      <span>{customerPhone}</span>
    </div>
  </div>

  <div class="divider double"></div>

  <div class="receipt-items">
    {#each items as item}
      <div class="item-row">
        <div class="item-name">
          {item.title}
          {#if item.quantity > 1}
            <span class="qty">x{item.quantity}</span>
          {/if}
        </div>
        <div class="item-price">
          {formatRupiah(item.totalPrice || item.price)}
        </div>
      </div>
      {#if item.selectedOptions}
        {#each Object.entries(item.selectedOptions) as [key, opt]}
          <div class="item-modifier">
            {#if Array.isArray(opt)}
              {#each opt as o}
                + {o.label}
                {#if o.price > 0}(+{formatRupiah(o.price)}){/if}
              {/each}
            {:else if opt}
              + {opt.label}
              {#if opt.price > 0}(+{formatRupiah(opt.price)}){/if}
            {/if}
          </div>
        {/each}
      {/if}
    {/each}
  </div>

  <div class="divider"></div>

  <div class="receipt-total">
    <span>TOTAL</span>
    <span class="total-amount">{formatRupiah(total)}</span>
  </div>

  <div class="divider double"></div>

  <div class="receipt-footer">
    <p>Pembayaran: {paymentMethod}</p>
    <p class="thank-you">Terima kasih!</p>
    <p class="small">Silakan tunggu panggilan nama Anda</p>
  </div>
</div>

<style>
  .receipt {
    font-family: "Courier New", monospace;
    width: 280px;
    padding: 16px;
    background: #fff;
    color: #000;
    font-size: 12px;
    line-height: 1.4;
  }

  .receipt-header {
    text-align: center;
    margin-bottom: 12px;
  }

  .logo {
    font-size: 32px;
    margin-bottom: 4px;
  }

  .receipt-header h1 {
    font-size: 16px;
    font-weight: bold;
    margin: 0;
    letter-spacing: 1px;
  }

  .divider {
    border-top: 1px dashed #000;
    margin: 8px 0;
  }

  .divider.double {
    border-top: 2px solid #000;
  }

  .receipt-info {
    margin-bottom: 8px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .order-id {
    font-weight: bold;
    font-size: 14px;
  }

  .bold {
    font-weight: bold;
  }

  .receipt-items {
    margin: 8px 0;
  }

  .item-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .item-name {
    flex: 1;
    word-break: break-word;
  }

  .qty {
    color: #666;
    margin-left: 4px;
  }

  .item-price {
    font-weight: bold;
    margin-left: 8px;
    white-space: nowrap;
  }

  .item-modifier {
    font-size: 10px;
    color: #666;
    padding-left: 12px;
    margin-bottom: 2px;
  }

  .receipt-total {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    font-weight: bold;
    padding: 8px 0;
  }

  .total-amount {
    font-size: 18px;
  }

  .receipt-footer {
    text-align: center;
    margin-top: 8px;
  }

  .receipt-footer p {
    margin: 4px 0;
  }

  .thank-you {
    font-size: 14px;
    font-weight: bold;
    margin-top: 8px !important;
  }

  .small {
    font-size: 10px;
    color: #666;
  }

  /* Print styles will be added via receipt-print.css */
</style>
