<script>
  import { onMount } from "svelte";
  import { Settings, Lock, ShieldQuestion, Check, Eye, EyeOff, AlertTriangle } from "lucide-svelte";
  import { fade, slide } from "svelte/transition";
  import { apiFetch } from "../api.js";

  // Change PIN state
  let currentPin = "";
  let newPin = "";
  let confirmPin = "";
  let pinError = "";
  let pinSuccess = "";
  let pinLoading = false;
  let showCurrentPin = false;
  let showNewPin = false;

  // Security Question state
  let secQuestion = "";
  let secAnswer = "";
  let secPin = "";
  let secError = "";
  let secSuccess = "";
  let secLoading = false;
  let isSecuritySetup = false;
  let currentQuestion = "";

  onMount(async () => {
    try {
      const res = await apiFetch("/api/admin/security-question");
      if (res.ok) {
        const data = await res.json();
        isSecuritySetup = data.isSetup;
        currentQuestion = data.question;
        if (data.question) {
          secQuestion = data.question;
        }
      }
    } catch (err) {
      console.error("Failed to fetch security question:", err);
    }
  });

  async function handleChangePin() {
    pinError = "";
    pinSuccess = "";

    if (!currentPin || currentPin.length !== 4) {
      pinError = "PIN lama harus 4 digit";
      return;
    }
    if (!newPin || newPin.length !== 4) {
      pinError = "PIN baru harus 4 digit";
      return;
    }
    if (newPin !== confirmPin) {
      pinError = "Konfirmasi PIN tidak cocok";
      return;
    }
    if (currentPin === newPin) {
      pinError = "PIN baru harus berbeda dengan PIN lama";
      return;
    }

    pinLoading = true;

    try {
      const res = await apiFetch("/api/admin/change-pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });

      if (res.ok) {
        pinSuccess = "PIN berhasil diubah!";
        currentPin = "";
        newPin = "";
        confirmPin = "";
      } else {
        const data = await res.json();
        pinError = data.error || "Gagal mengubah PIN";
      }
    } catch (err) {
      pinError = "Gagal terhubung ke server";
    } finally {
      pinLoading = false;
    }
  }

  async function handleSetupSecurity() {
    secError = "";
    secSuccess = "";

    if (!secQuestion.trim()) {
      secError = "Pertanyaan keamanan wajib diisi";
      return;
    }
    if (!secAnswer.trim()) {
      secError = "Jawaban keamanan wajib diisi";
      return;
    }
    if (!secPin || secPin.length !== 4) {
      secError = "Masukkan PIN admin untuk konfirmasi";
      return;
    }

    secLoading = true;

    try {
      const res = await apiFetch("/api/admin/setup-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: secQuestion.trim(),
          answer: secAnswer.trim(),
          pin: secPin,
        }),
      });

      if (res.ok) {
        secSuccess = "Pertanyaan keamanan berhasil disimpan!";
        isSecuritySetup = true;
        currentQuestion = secQuestion;
        secPin = "";
        secAnswer = "";
      } else {
        const data = await res.json();
        secError = data.error || "Gagal menyimpan";
      }
    } catch (err) {
      secError = "Gagal terhubung ke server";
    } finally {
      secLoading = false;
    }
  }

  /** @param {any} e */
  function filterPin(e) {
    return e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
  }

  const sampleQuestions = [
    "Siapa nama hewan peliharaan Anda?",
    "Di kota mana Anda lahir?",
    "Apa nama sekolah dasar Anda?",
    "Siapa nama sahabat masa kecil Anda?",
    "Apa makanan favorit Anda?",
  ];
</script>

<div class="settings-page">
  <header class="page-header">
    <h1><Settings size={24} /> Pengaturan Admin</h1>
    <p>Kelola PIN dan keamanan akun admin</p>
  </header>

  <!-- Change PIN Section -->
  <div class="settings-card">
    <div class="card-header">
      <div class="card-icon pin">
        <Lock size={22} />
      </div>
      <div>
        <h2>Ubah PIN Admin</h2>
        <p>Ganti PIN 4 digit untuk login admin</p>
      </div>
    </div>

    <div class="card-body">
      <div class="form-group">
        <label for="current-pin">PIN Lama</label>
        <div class="pin-row">
          <input
            id="current-pin"
            type={showCurrentPin ? "text" : "password"}
            inputmode="numeric"
            maxlength="4"
            placeholder="••••"
            bind:value={currentPin}
            on:input={(e) => { currentPin = filterPin(e); }}
          />
          <button class="eye-btn" on:click={() => showCurrentPin = !showCurrentPin}>
            {#if showCurrentPin} <EyeOff size={18} /> {:else} <Eye size={18} /> {/if}
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="new-pin">PIN Baru</label>
        <div class="pin-row">
          <input
            id="new-pin"
            type={showNewPin ? "text" : "password"}
            inputmode="numeric"
            maxlength="4"
            placeholder="••••"
            bind:value={newPin}
            on:input={(e) => { newPin = filterPin(e); }}
          />
          <button class="eye-btn" on:click={() => showNewPin = !showNewPin}>
            {#if showNewPin} <EyeOff size={18} /> {:else} <Eye size={18} /> {/if}
          </button>
        </div>
      </div>

      <div class="form-group">
        <label for="confirm-pin">Konfirmasi PIN Baru</label>
        <input
          id="confirm-pin"
          type="password"
          inputmode="numeric"
          maxlength="4"
          placeholder="••••"
          bind:value={confirmPin}
          on:input={(e) => { confirmPin = filterPin(e); }}
        />
      </div>

      {#if pinError}
        <p class="error-text" transition:fade={{ duration: 150 }}>{pinError}</p>
      {/if}
      {#if pinSuccess}
        <p class="success-text" transition:fade={{ duration: 150 }}><Check size={14} /> {pinSuccess}</p>
      {/if}

      <button class="save-btn" on:click={handleChangePin} disabled={pinLoading}>
        {#if pinLoading}
          <span class="mini-spinner"></span>
        {:else}
          <Lock size={16} />
        {/if}
        Ubah PIN
      </button>
    </div>
  </div>

  <!-- Security Question Section -->
  <div class="settings-card">
    <div class="card-header">
      <div class="card-icon security">
        <ShieldQuestion size={22} />
      </div>
      <div>
        <h2>Pertanyaan Keamanan</h2>
        <p>Digunakan untuk reset PIN jika lupa</p>
      </div>
    </div>

    {#if isSecuritySetup}
      <div class="current-security" transition:fade>
        <p class="setup-badge"><Check size={14} /> Pertanyaan keamanan sudah diatur</p>
        <p class="current-q">"{currentQuestion}"</p>
      </div>
    {:else}
      <div class="warning-box" transition:fade>
        <AlertTriangle size={16} />
        <span>Pertanyaan keamanan belum diatur. Jika lupa PIN, Anda tidak bisa reset sendiri!</span>
      </div>
    {/if}

    <div class="card-body">
      <div class="form-group">
        <label for="sec-question">Pertanyaan Keamanan</label>
        <input
          id="sec-question"
          type="text"
          placeholder="Tulis pertanyaan keamanan Anda"
          bind:value={secQuestion}
        />
        <div class="suggestions">
          <span class="suggestions-label">Contoh:</span>
          {#each sampleQuestions as q}
            <button class="suggestion-chip" on:click={() => secQuestion = q}>{q}</button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="sec-answer">Jawaban</label>
        <input
          id="sec-answer"
          type="text"
          placeholder="Jawaban Anda (tidak case-sensitive)"
          bind:value={secAnswer}
        />
        <span class="hint">Jawaban akan disimpan tanpa huruf besar/kecil</span>
      </div>

      <div class="form-group">
        <label for="sec-pin">Konfirmasi PIN Admin</label>
        <input
          id="sec-pin"
          type="password"
          inputmode="numeric"
          maxlength="4"
          placeholder="••••"
          bind:value={secPin}
          on:input={(e) => { secPin = filterPin(e); }}
        />
      </div>

      {#if secError}
        <p class="error-text" transition:fade={{ duration: 150 }}>{secError}</p>
      {/if}
      {#if secSuccess}
        <p class="success-text" transition:fade={{ duration: 150 }}><Check size={14} /> {secSuccess}</p>
      {/if}

      <button class="save-btn security" on:click={handleSetupSecurity} disabled={secLoading}>
        {#if secLoading}
          <span class="mini-spinner"></span>
        {:else}
          <ShieldQuestion size={16} />
        {/if}
        {isSecuritySetup ? "Perbarui Pertanyaan Keamanan" : "Simpan Pertanyaan Keamanan"}
      </button>
    </div>
  </div>
</div>

<style>
  .settings-page {
    max-width: 700px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 28px;
  }

  .page-header h1 {
    font-size: 1.75rem;
    font-weight: 800;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .page-header p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  /* Settings Card */
  .settings-card {
    background: var(--color-bg-secondary);
    border-radius: 16px;
    border: 1px solid var(--color-border);
    margin-bottom: 24px;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border);
  }

  .card-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .card-icon.pin {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
  }

  .card-icon.security {
    background: rgba(139, 92, 246, 0.08);
    color: #8b5cf6;
  }

  .card-header h2 {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .card-header p {
    font-size: 0.85rem;
    color: var(--color-text-muted);
  }

  .card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-primary);
    font-size: 0.95rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-subtle);
  }

  .pin-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .pin-row input { flex: 1; }

  .eye-btn {
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 10px;
    color: var(--color-text-secondary);
    display: flex;
    transition: all 0.2s;
  }

  .eye-btn:hover { color: var(--color-text-primary); }

  .hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .suggestions-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    width: 100%;
  }

  .suggestion-chip {
    font-size: 0.75rem;
    padding: 4px 10px;
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    color: var(--color-text-secondary);
    transition: all 0.2s;
    cursor: pointer;
  }

  .suggestion-chip:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-subtle);
    color: var(--color-accent);
  }

  .error-text {
    color: var(--color-danger);
    font-size: 0.85rem;
    text-align: center;
  }

  .success-text {
    color: var(--color-success);
    font-size: 0.85rem;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    background: var(--color-accent);
    color: #fff;
    font-weight: 700;
    font-size: 0.95rem;
    border-radius: 12px;
    transition: all 0.2s;
  }

  .save-btn.security {
    background: #8b5cf6;
  }

  .save-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .save-btn:disabled { opacity: 0.5; }

  .mini-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Current Security */
  .current-security {
    padding: 16px 24px;
    background: rgba(34, 197, 94, 0.04);
    border-bottom: 1px solid var(--color-border);
  }

  .setup-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    color: #16a34a;
    margin-bottom: 4px;
  }

  .current-q {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
    font-style: italic;
  }

  .warning-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: rgba(239, 68, 68, 0.04);
    border-bottom: 1px solid var(--color-border);
    color: #dc2626;
    font-size: 0.85rem;
    font-weight: 600;
  }
</style>
