<template>
  <AppLayout>
    <div class="qr-view">
      <h1>📱 Mi Código QR</h1>
      <p class="subtitle">Mesa Directiva Miguel Avila / Doroteo Arango</p>
      
      <!-- Tarjeta del QR - Versión simple -->
      <div class="qr-card-simple">
        <div class="qr-main">
          <!-- QR Code -->
          <div class="qr-code-wrapper">
            <div v-if="qrData" class="qr-code">
              <vue-qrcode :value="qrData" :size="280" :margin="0" />
            </div>
            <div v-else class="qr-placeholder">
              <div class="spinner"></div>
              <p>Generando código QR...</p>
            </div>
          </div>
          
          <!-- Información mínima del usuario -->
          <div class="user-info-minimal">
            <div class="user-avatar-mini">
              {{ userInitials }}
            </div>
            <div class="user-details-mini">
              <h3>{{ userName }}</h3>
              <p>{{ userRoleText }}</p>
            </div>
          </div>
        </div>
        
        <!-- Solo código de verificación -->
        <div class="verification-minimal">
          <h4>Código:</h4>
          <div class="code-simple">{{ verificationCode }}</div>
        </div>
      </div>
      
      <!-- Nota simple -->
      <div class="simple-note">
        <p>📍 Presenta este código para identificarte en eventos y pagos</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import VueQrcode from 'vue-qrcode'

const authStore = useAuthStore()

// Datos del usuario
const userName = computed(() => authStore.user?.nombre || 'Usuario')
const userEmail = computed(() => authStore.user?.email || '')
const userRole = computed(() => authStore.user?.rol || 'vecino')
const userId = computed(() => authStore.user?.id || '0')

const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
})

const userRoleText = computed(() => 
  userRole.value === 'admin' ? 'Administrador' : 'Vecino'
)

// Datos para el QR
const qrData = ref('')
const verificationCode = ref('')

// Generar datos para el QR
const generateQRData = () => {
  const user = authStore.user
  
  if (!user) {
    qrData.value = 'ERROR: Usuario no autenticado'
    verificationCode.value = '---'
    return
  }
  
  // Crear objeto con datos del usuario
  const userData = {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    timestamp: new Date().toISOString(),
    app: 'Mesa Directiva'
  }
  
  // Convertir a string para el QR
  qrData.value = JSON.stringify(userData)
  
  // Generar código de verificación (6 dígitos)
  verificationCode.value = Math.random().toString().substring(2, 8)
}

// Inicializar
onMounted(() => {
  console.log('QRView cargado')
  generateQRData()
})
</script>

<style scoped>
.qr-view {
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 8px;
  font-size: 1.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
  font-size: 0.95rem;
}

/* Tarjeta del QR - Simple */
.qr-card-simple {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 25px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.qr-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
  margin-bottom: 25px;
}

.qr-code-wrapper {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 15px;
  border: 2px solid #dee2e6;
}

.qr-code {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 280px;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: #666;
}

.qr-placeholder .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Información del usuario - Minimal */
.user-info-minimal {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 300px;
}

.user-avatar-mini {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
}

.user-details-mini {
  text-align: left;
  flex: 1;
}

.user-details-mini h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.1rem;
}

.user-details-mini p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Código de verificación - Minimal */
.verification-minimal {
  background: #f0f7ff;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #4A90E2;
}

.verification-minimal h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 1rem;
  text-align: center;
}

.code-simple {
  font-family: 'Courier New', monospace;
  font-size: 2.2rem;
  font-weight: bold;
  letter-spacing: 3px;
  color: #4A90E2;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px dashed #4A90E2;
  text-align: center;
}

/* Nota simple */
.simple-note {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px 20px;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.simple-note p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .qr-view {
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  justify-content: center;
    padding: 15px;
    max-width: 100%;
  }
  
  .qr-card-simple {
    padding: 20px;
  }
  
  .qr-code-wrapper {
    padding: 15px;
  }
  
  .qr-code {
    min-height: 250px;
  }
  
  .user-info-minimal {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .user-details-mini {
    text-align: center;
  }
  
  .code-simple {
    font-size: 1.8rem;
    letter-spacing: 2px;
    padding: 10px;
  }
  
  h1 {
    font-size: 1.3rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .qr-code {
    min-height: 220px;
  }
  
  .code-simple {
    font-size: 1.6rem;
    letter-spacing: 1px;
  }
}
</style>
