<script>
  import { onMount } from "svelte";
  import Layout from "./lib/Layout.svelte";
  import MenuGrid from "./lib/MenuGrid.svelte";
  import CategoryTabs from "./lib/CategoryTabs.svelte";
  import CheckoutModal from "./lib/CheckoutModal.svelte";
  import ProductCustomizer from "./lib/ProductCustomizer.svelte";
  import FindOrderModal from "./lib/FindOrderModal.svelte";
  import OrderStatusModal from "./lib/OrderStatusModal.svelte";
  import { cart, cartCount, cartTotal, addonOrder } from "./lib/cart.js";
  import { apiFetch } from "./lib/api.js";

  // Routing
  let currentRoute = "order";

  // Lazy load components
  /** @type {any} */
  let CashierLogin = null;
  /** @type {any} */
  let AdminLogin = null;

  function handleHashChange() {
    const hash = window.location.hash.slice(1) || "/";
    
    if (hash === "/cashier" || hash === "cashier") {
      currentRoute = "cashier";
      import("./lib/cashier/CashierLogin.svelte").then(m => CashierLogin = m.default);
    } else if (hash === "/admin" || hash === "admin") {
      currentRoute = "admin";
      import("./lib/admin/AdminLogin.svelte").then(m => AdminLogin = m.default);
    } else {
      currentRoute = "order";
    }
  }

  onMount(() => {
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  });

  // Order Page State
  const CATEGORIES = [
    { id: "all", label: "Semua" },
    { id: "mie-kuah", label: "Mie Kuah" },
    { id: "mie-goreng", label: "Mie Goreng" },
    { id: "topping", label: "Topping" },
    { id: "minuman", label: "Minuman" },
    { id: "cemilan", label: "Cemilan" },
  ];

  /** @type {Array<any>} */
  let products = [];
  let loading = true;
  let activeCategory = "all";
  let isCheckoutOpen = false;
  let isCustomizerOpen = false;
  let isFindOrderOpen = false;
  let isStatusOpen = false;
  /** @type {any} */
  let selectedProductForCustomization = null;

  /** @param {string} category */
  async function fetchProducts(category) {
    loading = true;
    try {
      const url =
        category === "all"
          ? "/api/products"
          : `/api/products?category_id=${category}`;
      const res = await apiFetch(url);
      products = await res.json();
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      loading = false;
    }
  }

  $: if (currentRoute === "order") {
    fetchProducts(activeCategory);
  }

  /** @param {any} product */
  function handleProductClick(product) {
    if (product.modifiers && product.modifiers.length > 0) {
      selectedProductForCustomization = product;
      isCustomizerOpen = true;
    } else {
      cart.add(product);
    }
  }

  /** @param {any} customizedProduct */
  function handleCustomizedAdd(customizedProduct) {
    cart.add(customizedProduct);
    isCustomizerOpen = false;
    selectedProductForCustomization = null;
  }

  function handleCheckoutComplete() {
    isCheckoutOpen = false;
    cart.reset();
    addonOrder.set(null);
  }
</script>

{#if currentRoute === "order"}
  <Layout
    cartState={{ count: $cartCount, total: $cartTotal }}
    onCartClick={() => (isCheckoutOpen = true)}
    onFindOrder={() => (isFindOrderOpen = true)}
    onCheckStatus={() => (isStatusOpen = true)}
  >
    <section>
      <div style="margin-bottom: var(--spacing-lg);">
        <h2
          style:font-size="2rem"
          style:font-weight="800"
          style:margin-bottom="var(--spacing-md)"
          style:display="flex"
          style:align-items="center"
          style:gap="var(--spacing-sm)"
        >
          <span style:color="var(--color-accent)">Menu</span> Mie Wiwiek
        </h2>
        <CategoryTabs
          categories={CATEGORIES}
          {activeCategory}
          onSelect={(/** @type {string} */ id) => (activeCategory = id)}
        />
      </div>

      <MenuGrid {products} onAdd={handleProductClick} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => (isCheckoutOpen = false)}
        cartItems={$cart}
        total={$cartTotal}
        onComplete={handleCheckoutComplete}
      />

      <ProductCustomizer
        isOpen={isCustomizerOpen}
        product={selectedProductForCustomization}
        onClose={() => {
          isCustomizerOpen = false;
          selectedProductForCustomization = null;
        }}
        onAddToCart={handleCustomizedAdd}
      />

      <FindOrderModal
        isOpen={isFindOrderOpen}
        onClose={() => (isFindOrderOpen = false)}
      />

      <OrderStatusModal
        isOpen={isStatusOpen}
        onClose={() => (isStatusOpen = false)}
      />
    </section>
  </Layout>
{:else if currentRoute === "cashier"}
  {#if CashierLogin}
    <svelte:component this={CashierLogin} />
  {:else}
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>Loading Cashier...</p>
    </div>
  {/if}
{:else if currentRoute === "admin"}
  {#if AdminLogin}
    <svelte:component this={AdminLogin} />
  {:else}
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>Loading Admin...</p>
    </div>
  {/if}
{/if}

<style>
  .loading-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    gap: 16px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
