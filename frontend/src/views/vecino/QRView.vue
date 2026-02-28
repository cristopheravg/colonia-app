<template>
  <AppLayout>
    <section class="qr-view">
      <!-- Header uniforme con la vista de eventos -->
      <div class="view-header" :class="{ 'header-scrolled': isScrolled }">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">Mi QR</h1>
            <span class="user-role-badge">{{ userRoleText }}</span>
          </div>
          
          <!-- Acción de cerrar sesión estilo app -->
          <button class="logout-btn" @click="logout">
            <span class="btn-icon">🚪</span>
            <span class="btn-text">Salir</span>
          </button>
        </div>

        <!-- Subtítulo estilo app -->
        <p class="header-subtitle">Mesa Directiva Miguel Avila / Doroteo Arango</p>
      </div>

      <!-- Contenido principal -->
      <div class="qr-content">
        <!-- Tarjeta principal del QR -->
        <div class="qr-card">
          <!-- Info del usuario destacada -->
          <div class="user-profile-header">
            <div class="user-avatar-large">{{ userInitials }}</div>
            <div class="user-info">
              <h2>{{ userFullName }}</h2>
              <span class="user-badge">{{ userRoleText }}</span>
            </div>
          </div>

          <!-- QR Code con efecto de tarjeta -->
          <div class="qr-code-container">
            <div v-if="verificationCode" class="qr-code-wrapper">
              <qrcode-vue
                v-if="qrData"
                :value="qrData"
                :size="220"
                level="H"
                :scale="9"
                :bg-color="'#ffffff'"
                :fg-color="'#2563eb'"
              />
              <div class="qr-overlay-effect"></div>
            </div>
            <div v-else class="qr-placeholder">
              <div class="spinner"></div>
              <p>Generando código QR...</p>
            </div>
          </div>

          <!-- Código de verificación con diseño premium -->
          <div class="verification-section">
            <div class="verification-label">
              <span class="label-icon">🔐</span>
              <span>Código de verificación</span>
            </div>
            
            <div class="code-display">
              <span class="code-text">{{ verificationCode }}</span>
              <button class="copy-btn" @click="copyCode" title="Copiar código">
                📋
              </button>
            </div>

            <!-- Timer con diseño circular -->
            <div class="timer-container">
              <div class="timer-circle" :style="{ transform: `rotate(${(otpTimeLeft / 60) * 360}deg)` }"></div>
              <span class="timer-text">{{ otpTimeLeft }}s</span>
            </div>
            <p class="timer-label">El código se actualiza automáticamente</p>
          </div>

          <!-- Nota informativa -->
          <div class="info-note">
            <span class="info-icon">📍</span>
            <p>Presenta este código para identificarte en eventos y pagos</p>
          </div>
        </div>

        <!-- Tips de uso -->
        <div class="tips-section">
          <h4>💡 Tips de uso</h4>
          <ul>
            <li>El código se renueva cada 60 segundos</li>
            <li>Puedes escanear el QR o leer el código manual</li>
            <li>Muestra este código al personal autorizado</li>
          </ul>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import QrcodeVue from 'qrcode.vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { authService } from '../../services/authService.js'

const router = useRouter()
const authStore = useAuthStore()

// Estados
const isScrolled = ref(false)
const verificationCode = ref('')
const qrData = ref('')
const otpTimeLeft = ref(60)
const totalOtpTime = 60
let countdownInterval = null
let intervalId = null

// Computed
const userFullName = computed(() => {
  const user = authStore.user
  if (!user) return 'Usuario'
  return `${user.nombre} ${user.apellidos || ''}`.trim()
})

const userRole = computed(() => authStore.user?.rol || 'vecino')
const userRoleText = computed(() => userRole.value === 'admin' ? 'Administrador' : 'Vecino')

const userInitials = computed(() => {
  const name = userFullName.value
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

// Scroll handler para efecto del header
const handleScroll = (e) => {
  const container = e.target
  isScrolled.value = container.scrollTop > 20
}

// Funciones QR/OTP
const startOtpCountdown = () => {
  otpTimeLeft.value = totalOtpTime
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    otpTimeLeft.value -= 1
    if (otpTimeLeft.value <= 0) {
      clearInterval(countdownInterval)
      generateOTP()
    }
  }, 1000)
}

const generateOTP = async () => {
  try {
    const userId = authStore.user?.id
    if (!userId) {
      verificationCode.value = '---'
      return
    }
    const res = await axios.post('/api/otp/generar', { userId })
    verificationCode.value = res.data.otp
    qrData.value = btoa(`${verificationCode.value}-${userId}`)
    startOtpCountdown()
  } catch (err) {
    console.error('Error generando OTP:', err)
    verificationCode.value = '---'
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(verificationCode.value)
    // Feedback visual (podrías agregar un toast)
    alert('Código copiado al portapapeles')
  } catch (err) {
    console.error('Error copiando código:', err)
  }
}

// Logout
const logout = async () => {
  try {
    await authService.logout()
    localStorage.removeItem('colonia_token')
    localStorage.removeItem('colonia_user')
    router.push('/login')
  } catch (error) {
    console.error('Error cerrando sesión:', error)
    alert('No se pudo cerrar sesión, intenta de nuevo')
  }
}

// Lifecycle
onMounted(() => {
  generateOTP()
  intervalId = setInterval(generateOTP, 60 * 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<style scoped>
/* ===== ESTILOS UNIFORMES CON LA VISTA DE EVENTOS ===== */
.qr-view {
  /*height: 100vh;*/
  flex:1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  position: relative;
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

/* ===== HEADER UNIFORME ===== */
.view-header {
  background: white;
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all 0.3s ease;
}

.view-header.header-scrolled {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.user-role-badge {
  background: #2563eb;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
}

.header-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  text-align: left;
}

/* Botón de logout estilo app */
.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: #f1f5f9;
  border-radius: 30px;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

.btn-icon {
  font-size: 1rem;
}

/* ===== CONTENIDO PRINCIPAL ===== */
.qr-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

/* Tarjeta principal */
.qr-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  margin-bottom: 20px;
}

/* Perfil de usuario */
.user-profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.user-avatar-large {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
}

.user-info h2 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.user-badge {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 20px;
}

/* QR Code */
.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.qr-code-wrapper {
  background: white;
  padding: 16px;
  border-radius: 24px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.qr-overlay-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  pointer-events: none;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f5f9;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sección de verificación */
.verification-section {
  background: #f8fafc;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
}

.verification-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.label-icon {
  font-size: 1rem;
}

.code-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border-radius: 16px;
  padding: 4px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.code-text {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: 4px;
  color: #2563eb;
  padding: 12px;
  text-align: center;
}

.copy-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

/* Timer circular */
.timer-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 8px;
}

.timer-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  animation: timerRotate 60s linear infinite;
}

@keyframes timerRotate {
  to { transform: rotate(360deg); }
}

.timer-text {
  font-size: 1rem;
  font-weight: 600;
  color: #2563eb;
  position: relative;
  z-index: 1;
}

.timer-label {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  text-align: center;
}

/* Nota informativa */
.info-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f1f5f9;
  border-radius: 16px;
  padding: 14px;
}

.info-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.info-note p {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
}

/* Tips section */
.tips-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #f1f5f9;
}

.tips-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.tips-section ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.tips-section li {
  padding: 8px 0;
  color: #475569;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.tips-section li:last-child {
  border-bottom: none;
}

.tips-section li::before {
  content: "•";
  color: #2563eb;
  font-weight: bold;
  font-size: 1.2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .qr-content {
    padding: 16px;
  }

  .qr-card {
    padding: 20px;
  }

  .user-profile-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .user-info {
    text-align: center;
  }

  .code-text {
    font-size: 1.5rem;
    letter-spacing: 2px;
  }
}

@media (min-width: 768px) {
  .qr-view {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;
    background: white;
  }

  .qr-content {
    background: #f8fafc;
  }
}

/* Ajustes para el QR */
:deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  max-width: 220px;
  max-height: 220px;
  display: block;
  margin: 0 auto;
  border-radius: 12px;
}
</style>