<script>
  import { onMount } from "svelte";
  import { Lock, ArrowRight, User } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { apiFetch } from "../api.js";

  const SESSION_KEY = "cashier_session";
  const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 jam

  let username = "";
  let pin = "";
  let error = "";
  let isLoading = false;
  let isLoggedIn = false;
  let isCheckingSession = true;

  /** @type {any} */
  let cashierInfo = null;

  // Lazy load CashierPOS after login
  /** @type {any} */
  let CashierPOS = null;

  /**
   * Simpan session ke sessionStorage dengan expiry
   * @param {any} cashier
   */
  function saveSession(cashier) {
    const session = {
      loggedIn: true,
      cashier,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Cek apakah ada session yang valid (belum expired)
   * @returns {any|null}
   */
  function getValidSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session.loggedIn && session.expiresAt > Date.now()) {
        return session.cashier;
      }
      // Session expired, bersihkan
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  /**
   * Hapus session (untuk logout)
   */
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    isLoggedIn = false;
    CashierPOS = null;
    cashierInfo = null;
    username = "";
    pin = "";
  }

  // Saat mount, cek session yang sudah ada
  onMount(async () => {
    const session = getValidSession();
    if (session) {
      cashierInfo = session;
      isLoggedIn = true;
      const module = await import("./CashierPOS.svelte");
      CashierPOS = module.default;
    }
    isCheckingSession = false;
  });

  async function handleLogin() {
    if (!username.trim()) {
      error = "Username wajib diisi";
      return;
    }
    if (pin.length !== 4) {
      error = "PIN harus 4 digit";
      return;
    }

    isLoading = true;
    error = "";

    try {
      const res = await apiFetch("/api/cashier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), pin }),
      });

      if (res.ok) {
        const data = await res.json();
        cashierInfo = data.cashier;
        saveSession(data.cashier);
        isLoggedIn = true;
        // Load cashier POS
        const module = await import("./CashierPOS.svelte");
        CashierPOS = module.default;
      } else {
        const data = await res.json();
        error = data.error || "Login gagal";
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
    if (e.key === "Enter" && username.trim() && pin.length === 4) {
      handleLogin();
    }
  }
</script>

{#if isCheckingSession}
  <div class="login-page">
    <div class="login-card" style="text-align:center;">
      <div class="spinner"></div>
      <p style="color:var(--color-text-secondary);margin-top:16px;">Mengecek sesi...</p>
    </div>
  </div>
{:else if isLoggedIn && CashierPOS}
  <svelte:component this={CashierPOS} cashierName={cashierInfo?.name || 'Kasir'} onLogout={clearSession} />
{:else}
  <div class="login-page" transition:fade>
    <div class="login-card">
      <div class="login-header">
        <div class="lock-icon">
          <Lock size={28} />
        </div>
        <h1>Login Kasir</h1>
        <p>Masukkan username dan PIN untuk mengakses</p>
      </div>

      <div class="login-form">
        <div class="input-group">
          <label for="cashier-username">
            <User size={16} />
            Username
          </label>
          <input
            id="cashier-username"
            type="text"
            placeholder="Contoh: kasir1"
            bind:value={username}
            on:keydown={handleKeydown}
            disabled={isLoading}
            autocomplete="username"
          />
        </div>

        <div class="input-group">
          <label for="cashier-pin">
            <Lock size={16} />
            PIN (4 digit)
          </label>
          <div class="pin-input-wrapper">
            <input
              id="cashier-pin"
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
            />
            <div class="pin-dots">
              {#each [0, 1, 2, 3] as i}
                <div class="dot" class:filled={pin.length > i}></div>
              {/each}
            </div>
          </div>
        </div>

        {#if error}
          <p class="error-text" transition:fade={{ duration: 150 }}>{error}</p>
        {/if}

        <button
          class="login-btn"
          on:click={handleLogin}
          disabled={!username.trim() || pin.length !== 4 || isLoading}
        >
          {#if isLoading}
            <span class="btn-spinner"></span>
            Memproses...
          {:else}
            Masuk
            <ArrowRight size={18} />
          {/if}
        </button>
      </div>

      <div class="login-footer">
        <button class="back-btn" on:click={() => (window.location.hash = "/")}>
          ← Kembali ke Halaman Utama
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
    background: var(--color-bg-warm);
    padding: 24px;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background: var(--color-bg-secondary);
    border-radius: 24px;
    padding: 40px 32px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--color-border);
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .lock-icon {
    width: 64px;
    height: 64px;
    background: rgba(59, 130, 246, 0.08);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #3b82f6;
  }

  .login-header h1 {
    font-size: 1.75rem;
    font-weight: 800;
    margin-bottom: 8px;
    color: var(--color-text-primary);
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

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .input-group label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .input-group > input {
    padding: 14px 16px;
    background: var(--color-bg-warm);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    color: var(--color-text-primary);
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .input-group > input:focus {
    outline: none;
    border-color: #3b82f6;
    background: var(--color-bg-secondary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
    background: var(--color-bg-warm);
    border: 2px solid var(--color-border);
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
    border-color: #3b82f6;
    background: var(--color-bg-secondary);
  }

  .pin-input-wrapper input.error {
    border-color: var(--color-danger);
  }

  .pin-dots {
    display: flex;
    justify-content: center;
    gap: 20px;
    padding: 28px;
    background: var(--color-bg-warm);
    border: 2px solid var(--color-border);
    border-radius: 16px;
    pointer-events: none;
  }

  .dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-border-hover);
    transition: all 0.15s;
  }

  .dot.filled {
    background: #3b82f6;
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
    background: #3b82f6;
    color: #fff;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 12px;
    transition: all 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .login-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner, .btn-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border);
    border-top-color: #3b82f6;
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
    font-weight: 600;
  }

  .back-btn:hover {
    color: var(--color-text-primary);
  }
</style>
