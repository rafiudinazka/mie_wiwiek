<script>
  import { Lock, ArrowRight } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { apiFetch } from "../api.js";

  let pin = "";
  let error = "";
  let isLoading = false;
  let isLoggedIn = false;

  // Lazy load admin dashboard after login
  /** @type {any} */
  let AdminDashboard = null;

  async function handleLogin() {
    if (pin.length !== 4) {
      error = "PIN harus 4 digit";
      return;
    }

    isLoading = true;
    error = "";

    try {
      const res = await apiFetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        isLoggedIn = true;
        // Load admin dashboard
        const module = await import("./AdminLayout.svelte");
        AdminDashboard = module.default;
      } else {
        error = "PIN salah";
        pin = "";
      }
    } catch (err) {
      error = "Gagal terhubung ke server";
    } finally {
      isLoading = false;
    }
  }

  function handlePinInput(/** @type {any} */ e) {
    // Only allow numbers
    pin = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    error = "";
  }

  function handleKeydown(/** @type {any} */ e) {
    if (e.key === "Enter" && pin.length === 4) {
      handleLogin();
    }
  }
</script>

{#if isLoggedIn && AdminDashboard}
  <svelte:component this={AdminDashboard} />
{:else}
  <div class="login-page" transition:fade>
    <div class="login-card">
      <div class="login-header">
        <div class="lock-icon">
          <Lock size={32} />
        </div>
        <h1>Admin Login</h1>
        <p>Masukkan PIN untuk mengakses dashboard</p>
      </div>

      <div class="login-form">
        <div class="pin-input-wrapper">
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="password"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="4"
            placeholder="••••"
            bind:value={pin}
            on:input={handlePinInput}
            on:keydown={handleKeydown}
            class:error
            disabled={isLoading}
            autofocus
          />
          <div class="pin-dots">
            {#each [0, 1, 2, 3] as i}
              <div class="dot" class:filled={pin.length > i}></div>
            {/each}
          </div>
        </div>

        {#if error}
          <p class="error-text" transition:fade={{ duration: 150 }}>{error}</p>
        {/if}

        <button
          class="login-btn"
          on:click={handleLogin}
          disabled={pin.length !== 4 || isLoading}
        >
          {#if isLoading}
            <span class="spinner"></span>
            Memproses...
          {:else}
            Masuk
            <ArrowRight size={18} />
          {/if}
        </button>
      </div>

      <div class="login-footer">
        <button class="back-btn" on:click={() => (window.location.hash = "/")}>
          ← Kembali ke Kiosk
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-primary);
    background-image: radial-gradient(
      circle at top right,
      #2a2a2a 0%,
      #121212 50%
    );
    padding: 24px;
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    background: var(--color-bg-secondary);
    border-radius: 24px;
    padding: 40px 32px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .lock-icon {
    width: 64px;
    height: 64px;
    background: rgba(255, 92, 0, 0.15);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: var(--color-accent);
  }

  .login-header h1 {
    font-size: 1.75rem;
    margin-bottom: 8px;
  }

  .login-header p {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pin-input-wrapper {
    position: relative;
  }

  .pin-input-wrapper input {
    width: 100%;
    padding: 20px;
    font-size: 2rem;
    text-align: center;
    letter-spacing: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: var(--color-text-primary);
    transition: all 0.2s;
    opacity: 0;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1;
  }

  .pin-input-wrapper input:focus {
    outline: none;
    border-color: var(--color-accent);
    background: rgba(255, 255, 255, 0.08);
  }

  .pin-input-wrapper input.error {
    border-color: var(--color-danger);
  }

  .pin-dots {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding: 28px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    pointer-events: none;
  }

  .dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all 0.15s;
  }

  .dot.filled {
    background: var(--color-accent);
    transform: scale(1.1);
  }

  .error-text {
    color: var(--color-danger);
    font-size: 0.875rem;
    text-align: center;
  }

  .login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 16px;
    background: var(--color-accent);
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    background: var(--color-accent-hover);
  }

  .login-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .login-footer {
    margin-top: 24px;
    text-align: center;
  }

  .back-btn {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    background: none;
    padding: 8px 16px;
  }

  .back-btn:hover {
    color: var(--color-text-primary);
  }
</style>
