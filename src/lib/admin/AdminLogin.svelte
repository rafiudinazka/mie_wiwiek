<script>
  import { onMount } from "svelte";
  import { navigate } from "../navigate.js";
  import { Lock, ArrowRight, ShieldQuestion, ArrowLeft, Check } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { apiFetch } from "../api.js";

  const SESSION_KEY = "admin_session";
  const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 jam

  let pin = "";
  let error = "";
  let isLoading = false;
  let isLoggedIn = false;
  let isCheckingSession = true;

  // Forgot PIN state
  let forgotMode = false;
  let securityQuestion = "";
  let securityAnswer = "";
  let newPin = "";
  let confirmNewPin = "";
  let forgotError = "";
  let forgotSuccess = "";
  let forgotLoading = false;
  let securitySetup = false;

  // Lazy load admin dashboard after login
  /** @type {any} */
  let AdminDashboard = null;

  /**
   * Simpan session ke sessionStorage dengan expiry
   */
  function saveSession() {
    const session = {
      loggedIn: true,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Cek apakah ada session yang valid (belum expired)
   * @returns {boolean}
   */
  function hasValidSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      if (session.loggedIn && session.expiresAt > Date.now()) {
        return true;
      }
      // Session expired, bersihkan
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
  }

  /**
   * Hapus session (untuk logout)
   */
  export function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // Saat mount, cek session yang sudah ada
  onMount(async () => {
    if (hasValidSession()) {
      isLoggedIn = true;
      const module = await import("./AdminLayout.svelte");
      AdminDashboard = module.default;
    }
    isCheckingSession = false;
  });

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
        saveSession();
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

  // --- Forgot PIN flow ---
  async function openForgotMode() {
    forgotMode = true;
    forgotError = "";
    forgotSuccess = "";
    securityAnswer = "";
    newPin = "";
    confirmNewPin = "";

    // Fetch security question
    try {
      const res = await apiFetch("/api/admin/security-question");
      if (res.ok) {
        const data = await res.json();
        securitySetup = data.isSetup;
        securityQuestion = data.question || "";
      }
    } catch (err) {
      forgotError = "Gagal memuat pertanyaan keamanan";
    }
  }

  function closeForgotMode() {
    forgotMode = false;
    forgotError = "";
    forgotSuccess = "";
  }

  async function handleForgotSubmit() {
    forgotError = "";

    if (!securityAnswer.trim()) {
      forgotError = "Jawaban wajib diisi";
      return;
    }
    if (!newPin || newPin.length !== 4) {
      forgotError = "PIN baru harus 4 digit";
      return;
    }
    if (newPin !== confirmNewPin) {
      forgotError = "Konfirmasi PIN tidak cocok";
      return;
    }

    forgotLoading = true;

    try {
      const res = await apiFetch("/api/admin/forgot-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: securityAnswer.trim(),
          newPin,
        }),
      });

      if (res.ok) {
        forgotSuccess = "PIN berhasil direset! Silakan login dengan PIN baru.";
        securityAnswer = "";
        newPin = "";
        confirmNewPin = "";
        // Auto close after 3 seconds
        setTimeout(() => {
          closeForgotMode();
        }, 3000);
      } else {
        const data = await res.json();
        forgotError = data.error || "Gagal mereset PIN";
      }
    } catch (err) {
      forgotError = "Gagal terhubung ke server";
    } finally {
      forgotLoading = false;
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
{:else if isLoggedIn && AdminDashboard}
  <svelte:component this={AdminDashboard} onLogout={clearSession} />
{:else}
  <div class="login-page" transition:fade>
    <div class="login-card">
      {#if !forgotMode}
        <!-- Normal Login -->
        <div class="login-header">
          <div class="lock-icon">
            <Lock size={28} />
          </div>
          <h1>Admin Panel</h1>
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

          <button class="forgot-link" on:click={openForgotMode}>
            <ShieldQuestion size={14} />
            Lupa PIN?
          </button>
        </div>

      {:else}
        <!-- Forgot PIN Mode -->
        <div class="login-header">
          <div class="lock-icon forgot">
            <ShieldQuestion size={28} />
          </div>
          <h1>Lupa PIN</h1>
          <p>Jawab pertanyaan keamanan untuk reset PIN</p>
        </div>

        {#if !securitySetup}
          <div class="no-security">
            <p>⚠️ Pertanyaan keamanan belum diatur.</p>
            <p class="sub">Hubungi pengembang/pemilik untuk mereset PIN secara manual, atau cek database.</p>
            <button class="back-to-login" on:click={closeForgotMode}>
              <ArrowLeft size={16} />
              Kembali ke Login
            </button>
          </div>
        {:else}
          <div class="forgot-form">
            <div class="question-box">
              <span class="q-label">Pertanyaan Keamanan:</span>
              <p class="q-text">"{securityQuestion}"</p>
            </div>

            <div class="form-group">
              <label for="forgot-answer">Jawaban Anda</label>
              <input
                id="forgot-answer"
                type="text"
                placeholder="Ketik jawaban..."
                bind:value={securityAnswer}
              />
            </div>

            <div class="form-group">
              <label for="forgot-new-pin">PIN Baru (4 digit)</label>
              <input
                id="forgot-new-pin"
                type="password"
                inputmode="numeric"
                maxlength="4"
                placeholder="••••"
                bind:value={newPin}
                on:input={(e) => { newPin = (/** @type {HTMLInputElement} */ (e.target)).value.replace(/[^0-9]/g, "").slice(0, 4); }}
              />
            </div>

            <div class="form-group">
              <label for="forgot-confirm-pin">Konfirmasi PIN Baru</label>
              <input
                id="forgot-confirm-pin"
                type="password"
                inputmode="numeric"
                maxlength="4"
                placeholder="••••"
                bind:value={confirmNewPin}
                on:input={(e) => { confirmNewPin = (/** @type {HTMLInputElement} */ (e.target)).value.replace(/[^0-9]/g, "").slice(0, 4); }}
              />
            </div>

            {#if forgotError}
              <p class="error-text" transition:fade={{ duration: 150 }}>{forgotError}</p>
            {/if}

            {#if forgotSuccess}
              <p class="success-text" transition:fade={{ duration: 150 }}>
                <Check size={16} /> {forgotSuccess}
              </p>
            {/if}

            <button
              class="login-btn forgot-btn"
              on:click={handleForgotSubmit}
              disabled={forgotLoading}
            >
              {#if forgotLoading}
                <span class="spinner"></span>
                Memproses...
              {:else}
                Reset PIN
                <ArrowRight size={18} />
              {/if}
            </button>

            <button class="back-to-login" on:click={closeForgotMode}>
              <ArrowLeft size={16} />
              Kembali ke Login
            </button>
          </div>
        {/if}
      {/if}

      <div class="login-footer">
        <button class="back-btn" on:click={() => navigate("/")}>
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
    max-width: 400px;
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
    background: var(--color-accent-subtle);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: var(--color-accent);
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
    border-color: var(--color-accent);
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
    font-weight: 700;
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
    font-weight: 600;
  }

  .back-btn:hover {
    color: var(--color-text-primary);
  }

  /* Forgot PIN styles */
  .forgot-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: none;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    padding: 8px;
    margin-top: 4px;
    transition: color 0.2s;
    font-weight: 600;
  }

  .forgot-link:hover {
    color: var(--color-accent);
  }

  .lock-icon.forgot {
    background: rgba(139, 92, 246, 0.08);
    color: #8b5cf6;
  }

  .forgot-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .question-box {
    background: var(--color-bg-warm);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--color-border);
  }

  .q-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .q-text {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-top: 6px;
    font-style: italic;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .form-group input {
    padding: 12px 14px;
    background: var(--color-bg-warm);
    border: 2px solid var(--color-border);
    border-radius: 12px;
    color: var(--color-text-primary);
    font-size: 0.95rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: #8b5cf6;
    background: var(--color-bg-secondary);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  .forgot-btn {
    background: #8b5cf6 !important;
  }

  .forgot-btn:hover:not(:disabled) {
    background: #7c3aed !important;
  }

  .success-text {
    color: var(--color-success);
    font-size: 0.875rem;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .no-security {
    text-align: center;
    padding: 20px 0;
  }

  .no-security p {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-warning);
    margin-bottom: 8px;
  }

  .no-security .sub {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    font-weight: 400;
    margin-bottom: 16px;
  }

  .back-to-login {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: none;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px;
    margin-top: 8px;
    width: 100%;
    transition: color 0.2s;
  }

  .back-to-login:hover {
    color: var(--color-text-primary);
  }
</style>
