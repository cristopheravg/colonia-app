<template>
  <AppLayout>
    <div class="qr-view">
      <h1>Código QR</h1>
      <p class="subtitle">Mesa Directiva Miguel Avila / Doroteo Arango</p>

      <!-- Tarjeta del QR -->
      <div class="qr-card-simple">
        <div class="qr-main">
          <!-- QR Code -->
          <div class="qr-code-wrapper">
            <div v-if="verificationCode" class="qr-code">
              <qrcode-vue
                v-if="qrData"
                :value="qrData"
                :size="200"       
                level="H"
                :scale="9"
                :bg-color="'#ffffff'"
                :fg-color="'#585858'"
              />
            </div>
            <div v-else class="qr-placeholder">
              <div class="spinner"></div>
              <p>Generando código QR...</p>
            </div>
          </div>

          <!-- Información mínima del usuario -->
          <div class="user-info-minimal">
            <div class="user-avatar-mini">{{ userInitials }}</div>
            <div class="user-details-mini">
              <h3>{{ userFullName }}</h3>
              <p>{{ userRoleText }}</p>
            </div>
          </div>
        </div>

        <!-- Código de verificación + contador -->
        <div class="verification-minimal">
          <h4>Código:</h4>
          <div class="code-simple">{{ verificationCode }}</div>
          <p class="otp-countdown">Expira en: {{ otpTimeLeft }}s</p>
        </div>
      </div>

      <!-- Nota simple -->
      <div class="simple-note">
        <p>📍 Presenta este código para identificarte en eventos y pagos</p>
      </div>

      <div>
        <!-- Tu contenido de la vista -->
        <a href="#" @click.prevent="logout">Cerrar sesión</a>
      </div>

    </div>
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

// Nombre completo del usuario (nombre + apellidos)
const userFullName = computed(() => {
  const user = authStore.user
  if (!user) return 'Usuario'
  return `${user.nombre} ${user.apellidos || ''}`.trim()
})

const userRole = computed(() => authStore.user?.rol || 'vecino')

// Iniciales del usuario (nombre + apellidos)
const userInitials = computed(() => {
  const name = userFullName.value
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

const userRoleText = computed(() => userRole.value === 'admin' ? 'Administrador' : 'Vecino')

// QR y OTP
const verificationCode = ref('')
const qrData = ref('')  
const otpTimeLeft = ref(60)
const totalOtpTime = 60
let countdownInterval = null

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
    const res = await axios.post('http://54.227.139.118:3000/generar', { userId })
    verificationCode.value = res.data.otp

    // Concatenar OTP + ID y codificar en Base64
    qrData.value = btoa(`${verificationCode.value}-${userId}`) 
    startOtpCountdown()
  } catch (err) {
    console.error('Error generando OTP:', err)
    verificationCode.value = '---'
  }
}

let intervalId = null
onMounted(() => {
  generateOTP()
  intervalId = setInterval(generateOTP, 60 * 1000)
})
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  if (countdownInterval) clearInterval(countdownInterval)
})

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
</script>


<style scoped>
/* Mantengo tu CSS tal cual lo tenías */
.qr-view { min-height: calc(100vh - 180px); display: flex; flex-direction: column; justify-content: center; padding: 20px; max-width: 500px; margin: 0 auto; text-align: center; }
h1 { color: #333; margin-bottom: 8px; font-size: 1.5rem; }
.subtitle { color: #666; margin-bottom: 30px; font-size: 0.95rem; }
.qr-card-simple { background: white; border-radius: 20px; padding: 30px; margin-bottom: 25px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); border: 1px solid #e9ecef; }
.qr-main { display: flex; flex-direction: column; align-items: center; gap: 25px; margin-bottom: 25px; }
.qr-code-wrapper { background: #f8f9fa; padding: 25px; border-radius: 15px; border: 2px solid #dee2e6; }
.qr-code { display: flex; justify-content: center; align-items: center; min-height: 280px; }
.qr-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; color: #666; }
.qr-placeholder .spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #4A90E2; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.user-info-minimal { display: flex; align-items: center; gap: 15px; background: #f8f9fa; padding: 15px 20px; border-radius: 12px; width: 100%; max-width: 300px; }
.user-avatar-mini { width: 50px; height: 50px; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold; flex-shrink: 0; }
.user-details-mini { text-align: left; flex: 1; }
.user-details-mini h3 { margin: 0 0 5px 0; color: #333; font-size: 1.1rem; }
.user-details-mini p { margin: 0; color: #666; font-size: 0.9rem; }
.verification-minimal { background: #f0f7ff; border-radius: 12px; padding: 20px; border: 2px solid #4A90E2; }
.verification-minimal h4 { margin: 0 0 12px 0; color: #333; font-size: 1rem; text-align: center; }
.code-simple { font-family: 'Courier New', monospace; font-size: 2.2rem; font-weight: bold; letter-spacing: 3px; color: #4A90E2; padding: 12px; background: white; border-radius: 8px; border: 1px dashed #4A90E2; text-align: center; }
.otp-countdown { margin-top: 8px; font-size: 1rem; color: #ff4d4f; font-weight: bold; text-align: center; }
.simple-note { background: #f8f9fa; border-radius: 12px; padding: 15px 20px; color: #666; font-size: 0.95rem; line-height: 1.5; }
.simple-note p { margin: 0; }
@media (max-width: 768px) { .qr-view { padding: 15px; max-width: 100%; } .qr-card-simple { padding: 20px; } .qr-code-wrapper { padding: 15px; } .qr-code { min-height: 250px; } .user-info-minimal { flex-direction: column; text-align: center; gap: 12px; } .user-details-mini { text-align: center; } .code-simple { font-size: 1.8rem; letter-spacing: 2px; padding: 10px; } h1 { font-size: 1.3rem; } .subtitle { font-size: 0.9rem; } }
@media (max-width: 480px) { .qr-code { min-height: 220px; } .code-simple { font-size: 1.6rem; letter-spacing: 1px; } }

.qr-code vue-qrcode {
  width: 100% !important;      /* ocupar todo el ancho del contenedor */
  height: 100% !important;     /* ocupar todo el alto del contenedor */
  max-width: 280px;             /* mantener tu tamaño original */
  max-height: 280px;
  display: block;
  margin: 0 auto;
}


</style>
