<script>
  import { onMount } from "svelte";
  import Layout from "./lib/Layout.svelte";
  import MenuGrid from "./lib/MenuGrid.svelte";
  import CategoryTabs from "./lib/CategoryTabs.svelte";
  import CheckoutModal from "./lib/CheckoutModal.svelte";
  import ProductCustomizer from "./lib/ProductCustomizer.svelte";
  import { cart, cartCount, cartTotal } from "./lib/cart.js";
  import { apiFetch } from "./lib/api.js";

  // Routing
  let currentRoute = "kiosk";

  // Lazy load components
  /** @type {any} */
  let CashierPOS = null;
  /** @type {any} */
  let AdminLogin = null;

  function handleHashChange() {
    const hash = window.location.hash.slice(1) || "/";
    
    if (hash === "/cashier" || hash === "cashier") {
      currentRoute = "cashier";
      import("./lib/cashier/CashierPOS.svelte").then(m => CashierPOS = m.default);
    } else if (hash === "/admin" || hash === "admin") {
      currentRoute = "admin";
      import("./lib/admin/AdminLogin.svelte").then(m => AdminLogin = m.default);
    } else {
      currentRoute = "kiosk";
    }
  }

  onMount(() => {
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  });

  // Kiosk State
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

  $: if (currentRoute === "kiosk") {
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
  }
</script>

{#if currentRoute === "kiosk"}
  <Layout
    cartState={{ count: $cartCount, total: $cartTotal }}
    onCartClick={() => (isCheckoutOpen = true)}
  >
    <section>
      <div style="margin-bottom: var(--spacing-lg);">
        <h2
          style:font-size="2rem"
          style:font-weight="700"
          style:margin-bottom="var(--spacing-md)"
          style:display="flex"
          style:align-items="center"
          style:gap="var(--spacing-sm)"
        >
          <span style:color="var(--color-accent)">Pesan</span> Sekarang
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
    </section>
  </Layout>
{:else if currentRoute === "cashier"}
  {#if CashierPOS}
    <svelte:component this={CashierPOS} />
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
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
