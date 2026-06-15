<script>
  import Header from "./Header.svelte";
  import CartBar from "./CartBar.svelte";

  export let cartState = { count: 0, total: 0 };
  export let onCartClick = () => {};
</script>

<div class="layout">
  <Header />
  <main>
    <slot></slot>
  </main>
  <CartBar
    itemCount={cartState.count}
    total={cartState.total}
    onClick={onCartClick}
  />
</div>

<style>
  .layout {
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background: radial-gradient(circle at top right, #2a2a2a 0%, #121212 40%);
  }

  main {
    flex: 1;
    padding: var(--spacing-xl);
    padding-bottom: 100px;
    overflow-y: auto;
  }

  @media (max-width: 600px) {
    main {
      padding: var(--spacing-md) !important;
      padding-bottom: 140px !important;
    }
  }
</style>
