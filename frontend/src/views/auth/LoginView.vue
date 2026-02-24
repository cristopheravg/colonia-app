<template>
  <div class="login-view">
    <!-- Contenedor principal -->
    <div class="login-container">
      <!-- Tarjeta de login con estilo uniforme -->
      <div class="login-card">
        <!-- Icono/Logo -->
        <div class="card-icon">
          <span class="emoji-icon">🏘️</span>
        </div>

        <div class="card-header">
          <h1 class="card-title">Bienvenido</h1>
          <p class="card-subtitle">Ingresa a tu cuenta</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Campo de email -->
          <div class="form-group">
            <label for="email" class="form-label">Correo electrónico</label>
            <div class="input-wrapper">
              <span class="input-icon">📧</span>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="ejemplo@correo.com"
                required
                :disabled="isLoading"
                @input="clearError"
              >
            </div>
          </div>

          <!-- Campo de contraseña -->
          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <div class="input-wrapper">
              <span class="input-icon">🔐</span>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                :disabled="isLoading"
                @input="clearError"
              >
              <button 
                type="button" 
                class="password-toggle"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <!-- Botón de login -->
          <button type="submit" :disabled="isLoading" class="btn-login">
            <span v-if="!isLoading">Ingresar</span>
            <div v-else class="spinner"></div>
          </button>

          <!-- Mensaje de error -->
          <transition name="fade">
            <div v-if="error" class="error-message">
              <span class="error-icon">⚠️</span>
              <span>{{ error }}</span>
            </div>
          </transition>
        </form>

        <!-- Link de recuperación -->
        <div class="forgot-password">
          <a href="#" @click.prevent="forgotPassword">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')

const clearError = () => {
  error.value = ''
}

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Por favor completa todos los campos'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await authStore.login({
      email: email.value,
      password: password.value
    })

    if (result.success) {
      const rol = result.user?.rol || null

      // Redirigir según el rol
      if (rol === 'admin') {
        router.push('/admin')
      } else {
        router.push('/balance')
      }
    } else {
      error.value = result.error || 'Credenciales incorrectas'
    }
  } catch (err) {
    error.value = 'Error al conectar con el servidor'
  } finally {
    isLoading.value = false
  }
}

const forgotPassword = () => {
  alert('Funcionalidad de recuperación de contraseña - Próximamente')
}
</script>

<style scoped>
/* ===== ESTILOS UNIFORMES CON LAS DEMÁS VISTAS ===== */
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  animation: pageSlideIn 0.3s ease-out;
}

@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== CONTENEDOR PRINCIPAL ===== */
.login-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

/* ===== TARJETA DE LOGIN ===== */
.login-card {
  background: white;
  border-radius: 32px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  animation: cardAppear 0.4s ease-out;
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Icono de la tarjeta (igual que en balance) */
.card-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  border: 1px solid #e2e8f0;
}

.emoji-icon {
  font-size: 2rem;
}

/* Header de la tarjeta */
.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.card-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* ===== FORMULARIO ===== */
.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  font-size: 1rem;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
  color: #0f172a;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-wrapper input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.input-wrapper input::placeholder {
  color: #cbd5e1;
}

/* Toggle de contraseña */
.password-toggle {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 1rem;
  color: #64748b;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #2563eb;
}

/* Botón de login (igual que en balance) */
.btn-login {
  width: 100%;
  padding: 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.btn-login:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner (mismo que en otras vistas) */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mensaje de error */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.85rem;
}

.error-icon {
  font-size: 1rem;
}

/* Link de olvidé contraseña */
.forgot-password {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.forgot-password a {
  color: #64748b;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.2s ease;
  cursor: pointer;
}

.forgot-password a:hover {
  color: #2563eb;
}

/* Animaciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== RESPONSIVE (mobile first) ===== */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 24px;
    border-radius: 24px;
  }

  .card-title {
    font-size: 1.3rem;
  }

  .card-icon {
    width: 56px;
    height: 56px;
  }

  .emoji-icon {
    font-size: 1.8rem;
  }

  .input-wrapper input {
    padding: 12px 12px 12px 40px;
    font-size: 0.9rem;
  }

  .btn-login {
    padding: 14px;
  }
}

/* Pantallas más grandes */
@media (min-width: 768px) {
  .login-view {
    background: white;
  }

  .login-container {
    background: #f8fafc;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* Ajustes para que coincida perfectamente con balance */
.login-view,
.login-container,
.login-card {
  box-sizing: border-box;
}

/* Mismos estilos de fuente */
.card-title,
.card-subtitle,
.form-label,
.btn-login,
.error-message,
.forgot-password a {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>