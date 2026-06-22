<script>
  import { onMount } from "svelte";
  import { X, Check, CreditCard, User, Phone, QrCode } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { formatRupiah } from "./utils.js";
  import { apiFetch } from "./api.js";
  import Receipt from "./Receipt.svelte";
  import { addonOrder } from "./cart.js";

  export let isOpen = false;
  /** @type {any[]} */
  export let cartItems = [];
  export let total = 0;
  export let onClose = () => {};
  export let onComplete = () => {};

  // Steps: 1 = Review, 2 = Customer Info, 3 = Payment, 4 = Success
  let step = 1;
  let isProcessing = false;
  /** @type {any} */
  let orderNumber = null;

  // Customer info
  let customerName = "";
  let customerPhone = "";
  let nameError = "";
  let phoneError = "";

  // Payment config
  let paymentGateway = "simulated";
  let snapLoaded = false;

  // Receipt
  let showReceipt = false;
  let orderData = null;

  onMount(async () => {
    // Fetch payment config
    try {
      const res = await apiFetch("/api/payment/client-key");
      if (res.ok) {
        const config = await res.json();
        paymentGateway = config.gateway;

        if (config.gateway === "midtrans" && config.clientKey) {
          loadSnapJs(config.clientKey, config.isProduction);
        }
      }
    } catch (err) {
      console.log("Using simulated payment (server not reachable)");
    }
  });

  /**
   * @param {string} clientKey
   * @param {boolean} isProduction
   */
  function loadSnapJs(clientKey, isProduction) {
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    // Check if already loaded
    if ((/** @type {any} */ (window)).snap) {
      snapLoaded = true;
      return;
    }

    const script = document.createElement("script");
    script.src = baseUrl;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => {
      snapLoaded = true;
      console.log("✅ Midtrans Snap.js loaded");
    };
    script.onerror = () => {
      console.error("❌ Failed to load Snap.js");
    };
    document.head.appendChild(script);
  }

  function resetState() {
    step = 1;
    isProcessing = false;
    orderNumber = null;
    customerName = $addonOrder ? $addonOrder.customer_name : "";
    customerPhone = $addonOrder ? $addonOrder.customer_phone : "";
    nameError = "";
    phoneError = "";
    showReceipt = false;
    orderData = null;
  }

  function handleClose() {
    resetState();
    onClose();
  }

  // Reactive statement to prefill data if addonOrder changes
  $: if ($addonOrder && step === 1) {
    customerName = $addonOrder.customer_name;
    customerPhone = $addonOrder.customer_phone;
  }

  function goToCustomerInfo() {
    if ($addonOrder) {
      // Skip customer info step if in addon mode
      step = 3;
    } else {
      step = 2;
    }
  }

  function validateCustomerInfo() {
    let valid = true;
    nameError = "";
    phoneError = "";

    if (!customerName.trim()) {
      nameError = "Nama wajib diisi";
      valid = false;
    }

    if (!customerPhone.trim()) {
      phoneError = "Nomor HP wajib diisi";
      valid = false;
    } else if (!/^[0-9]{10,13}$/.test(customerPhone.replace(/[-\s]/g, ""))) {
      phoneError = "Nomor HP tidak valid";
      valid = false;
    }

    return valid;
  }

  function goToPayment() {
    if (validateCustomerInfo()) {
      step = 3;
    }
  }

  async function handlePay() {
    isProcessing = true;

    try {
      let orderId;
      let payResult;

      if ($addonOrder) {
        orderId = $addonOrder.id;
        const res = await apiFetch(`/api/orders/${orderId}/add-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems,
            extraTotal: total,
          }),
        });
        if (!res.ok) throw new Error("Failed to add items to order");
        payResult = await res.json();
      } else {
        // Step 1: Create order
        const orderRes = await apiFetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            total,
            items: cartItems,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
          }),
        });

        if (!orderRes.ok) throw new Error("Failed to create order");
        const orderDataResult = await orderRes.json();
        orderId = orderDataResult.orderId;

        // Step 2: Process payment
        const payRes = await apiFetch(
          `/api/orders/${orderId}/pay`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!payRes.ok) throw new Error("Payment failed");
        payResult = await payRes.json();
      }

      // Step 3: Handle payment based on gateway
      if (payResult.snapToken && (/** @type {any} */ (window)).snap) {
        // Midtrans Snap payment popup
        await handleMidtransPayment(orderId, payResult.snapToken);
      } else {
        // Simulated payment - direct success
        handlePaymentSuccess(orderId, "Simulated");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Pembayaran gagal. Silakan coba lagi.");
    } finally {
      isProcessing = false;
    }
  }

  /**
   * @param {any} orderId
   * @param {string} snapToken
   */
  function handleMidtransPayment(orderId, snapToken) {
    return new Promise((resolve, reject) => {
      (/** @type {any} */ (window)).snap.pay(snapToken, {
        onSuccess: async function (/** @type {any} */ result) {
          console.log("✅ Payment success:", result);
          // Confirm order on backend (webhook may not reach localhost)
          await apiFetch(
            `/api/orders/${orderId}/confirm-payment`,
            {
              method: "POST",
            },
          );
          handlePaymentSuccess(orderId, result.payment_type || "Midtrans");
          resolve(result);
        },
        onPending: async function (/** @type {any} */ result) {
          console.log("⏳ Payment pending:", result);
          // Still confirm - payment will settle shortly
          await apiFetch(
            `/api/orders/${orderId}/confirm-payment`,
            {
              method: "POST",
            },
          );
          handlePaymentSuccess(orderId, "Midtrans (Pending)");
          resolve(result);
        },
        onError: function (/** @type {any} */ result) {
          console.error("❌ Payment error:", result);
          alert("Pembayaran gagal. Silakan coba lagi.");
          reject(result);
        },
        onClose: function () {
          console.log("❌ Payment popup closed");
          // User closed without completing - order remains pending
          isProcessing = false;
        },
      });
    });
  }

  /**
   * @param {any} orderId
   * @param {string} paymentMethod
   */
  function handlePaymentSuccess(orderId, paymentMethod) {
    orderNumber = orderId;
    orderData = {
      orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: cartItems,
      total,
      paymentMethod,
      createdAt: new Date(),
    };
    step = 4;
  }

  function handleDone() {
    resetState();
    onComplete();
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" transition:fade={{ duration: 200 }}>
    <div class="modal-content" transition:fly={{ y: 50, duration: 300 }}>
      {#if step === 4}
        <!-- Success State -->
        <div class="success-state">
          <div class="check-circle">
            <Check size={48} color="#fff" />
          </div>
          <h2>Pesanan Dikonfirmasi!</h2>
          <p class="order-number">Order #{orderNumber}</p>
          <p class="success-msg">
            Tunggu panggilan nama <strong>{customerName}</strong> untuk mengambil
            pesanan Anda.
          </p>
          <button class="done-btn" on:click={handleDone}> Selesai </button>
        </div>
      {:else}
        <!-- Header -->
        <div class="modal-header">
          <h2>
            {#if $addonOrder}
              Tambah ke Pesanan #{$addonOrder.id}
            {:else if step === 1}Ringkasan Pesanan
            {:else if step === 2}Data Pemesan
            {:else if step === 3}Pembayaran
            {/if}
          </h2>
          <button on:click={handleClose} class="close-btn">
            <X size={24} />
          </button>
        </div>

        <!-- Step Indicator -->
        <div class="steps">
          <div class="step" class:active={step >= 1} class:done={step > 1}>
            1
          </div>
          <div class="step-line" class:active={step > 1}></div>
          <div class="step" class:active={step >= 2} class:done={step > 2}>
            2
          </div>
          <div class="step-line" class:active={step > 2}></div>
          <div class="step" class:active={step >= 3}>3</div>
        </div>

        {#if step === 1}
          <!-- Order Summary -->
          <div class="order-summary">
            {#each cartItems as item}
              <div class="summary-item">
                <div class="item-info">
                  <span class="item-title">{item.title}</span>
                  {#if item.quantity > 1}
                    <span class="item-qty">x{item.quantity}</span>
                  {/if}
                </div>
                <span class="price"
                  >{formatRupiah(item.totalPrice || item.price)}</span
                >
              </div>
            {/each}
            <div class="total-row">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>
          </div>

          <button class="primary-btn" on:click={goToCustomerInfo}>
            Lanjut
          </button>
        {:else if step === 2}
          <!-- Customer Info Form -->
          <div class="form-section">
            <div class="form-group">
              <label for="name">
                <User size={18} />
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                bind:value={customerName}
                placeholder="Masukkan nama Anda"
                class:error={nameError}
              />
              {#if nameError}
                <span class="error-text">{nameError}</span>
              {/if}
            </div>

            <div class="form-group">
              <label for="phone">
                <Phone size={18} />
                Nomor HP
              </label>
              <input
                type="tel"
                id="phone"
                bind:value={customerPhone}
                placeholder="08xxxxxxxxxx"
                class:error={phoneError}
              />
              {#if phoneError}
                <span class="error-text">{phoneError}</span>
              {/if}
            </div>
          </div>

          <div class="button-group">
            <button class="secondary-btn" on:click={() => (step = 1)}>
              Kembali
            </button>
            <button class="primary-btn" on:click={goToPayment}> Lanjut </button>
          </div>
        {:else if step === 3}
          <!-- Payment -->
          <div class="payment-section">
            <div class="payment-summary">
              <p>Nama: <strong>{customerName}</strong></p>
              <p>No HP: <strong>{customerPhone}</strong></p>
              <p class="payment-total">
                Total: <strong>{formatRupiah(total)}</strong>
              </p>
            </div>

            <div class="payment-method">
              {#if paymentGateway === "midtrans"}
                <div class="method-card active midtrans">
                  <QrCode size={24} />
                  <div class="method-info">
                    <span class="method-title">Midtrans Payment</span>
                    <span class="method-desc"
                      >QRIS, GoPay, OVO, Bank Transfer</span
                    >
                  </div>
                </div>
                <p class="method-note">
                  Popup pembayaran Midtrans akan terbuka setelah klik bayar
                </p>
              {:else}
                <div class="method-card active">
                  <CreditCard size={24} />
                  <span>Pembayaran Simulasi</span>
                </div>
                <p class="method-note">
                  * Untuk demo, pembayaran akan langsung berhasil
                </p>
              {/if}
            </div>
          </div>

          <div class="button-group">
            <button
              class="secondary-btn"
              on:click={() => (step = $addonOrder ? 1 : 2)}
              disabled={isProcessing}
            >
              Kembali
            </button>
            <button
              class="pay-btn"
              on:click={handlePay}
              disabled={isProcessing}
              class:processing={isProcessing}
            >
              {#if isProcessing}
                Memproses...
              {:else}
                Bayar Sekarang
              {/if}
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 200;
    background: rgba(45, 32, 22, 0.35);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-content {
    background: var(--color-bg-secondary);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-lg);
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  .modal-header h2 { font-size: 1.5rem; color: var(--color-text-primary); }

  .close-btn {
    background: transparent;
    color: var(--color-text-secondary);
    padding: 8px;
  }

  /* Steps */
  .steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: var(--spacing-xl);
  }

  .step {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.3s;
  }

  .step.active {
    background: var(--color-accent);
    color: #fff;
    border-color: var(--color-accent);
  }

  .step.done {
    background: var(--color-success);
    border-color: var(--color-success);
    color: #fff;
  }

  .step-line {
    width: 40px; height: 2px;
    background: var(--color-border);
    transition: all 0.3s;
  }

  .step-line.active { background: var(--color-accent); }

  /* Order Summary */
  .order-summary {
    background: var(--color-bg-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-xl);
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid var(--color-border);
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-border);
  }

  .item-info { display: flex; align-items: center; gap: 8px; }
  .item-qty { color: var(--color-text-secondary); font-size: 0.875rem; }
  .price { font-weight: 600; }

  .total-row {
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    margin-top: 8px;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-accent);
  }

  /* Form */
  .form-section { margin-bottom: var(--spacing-xl); }
  .form-group { margin-bottom: var(--spacing-lg); }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--color-text-secondary);
  }

  .form-group input {
    width: 100%;
    padding: 14px 16px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 1rem;
    transition: all 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-subtle);
  }

  .form-group input.error { border-color: var(--color-danger); }

  .error-text {
    color: var(--color-danger);
    font-size: 0.8rem;
    margin-top: 4px;
    display: block;
  }

  /* Payment */
  .payment-section { margin-bottom: var(--spacing-xl); }

  .payment-summary {
    background: var(--color-bg-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    border: 1px solid var(--color-border);
  }

  .payment-summary p { margin-bottom: 8px; color: var(--color-text-secondary); }

  .payment-total {
    font-size: 1.25rem;
    color: var(--color-text-primary) !important;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }

  .payment-method { text-align: center; }

  .method-card {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: 8px;
  }

  .method-card.active {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
  }

  .method-card.midtrans { flex-direction: row; text-align: left; }
  .method-info { display: flex; flex-direction: column; gap: 2px; }
  .method-title { font-weight: 600; font-size: 1rem; color: var(--color-text-primary); }
  .method-desc { font-size: 0.8rem; color: var(--color-text-secondary); }
  .method-note { font-size: 0.8rem; color: var(--color-text-muted); }

  /* Buttons */
  .button-group { display: flex; gap: 12px; }

  .primary-btn, .secondary-btn, .pay-btn, .done-btn {
    flex: 1;
    padding: 14px 24px;
    border-radius: var(--radius-full);
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .primary-btn, .pay-btn, .done-btn {
    background: var(--color-accent);
    color: #fff;
  }

  .primary-btn:hover, .pay-btn:hover, .done-btn:hover {
    background: var(--color-accent-hover);
  }

  .secondary-btn {
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }

  .pay-btn:disabled, .secondary-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .pay-btn.processing { background: var(--color-text-muted); }

  /* Success State */
  .success-state { text-align: center; padding: 40px 0; }

  .check-circle {
    width: 80px; height: 80px;
    background: var(--color-success);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);
    animation: scaleIn 0.3s ease;
  }

  @keyframes scaleIn {
    from { transform: scale(0); }
    to { transform: scale(1); }
  }

  .success-state h2 { font-size: 1.75rem; margin-bottom: var(--spacing-sm); }

  .order-number {
    font-size: 1.25rem;
    color: var(--color-accent);
    font-weight: 700;
    margin-bottom: var(--spacing-md);
  }

  .success-msg {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
    line-height: 1.5;
  }

  .success-msg strong { color: var(--color-text-primary); }
  .done-btn { width: 100%; }
</style>
