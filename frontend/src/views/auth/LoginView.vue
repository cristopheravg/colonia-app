<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Mesa Directiva<br>Miguel Avila / Doroteo Arango</h1>
      <p>Sistema de gestión vecinal</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <input 
            v-model="email" 
            type="email" 
            placeholder="Correo electrónico" 
            required
            :disabled="isLoading"
            @input="clearError"
          >
        </div>
        
        <div class="form-group">
          <input 
            v-model="password" 
            type="password" 
            placeholder="Contraseña" 
            required
            :disabled="isLoading"
            @input="clearError"
          >
        </div>
        
        <button type="submit" :disabled="isLoading" class="btn-primary">
          {{ isLoading ? 'Cargando...' : 'Ingresar' }}
        </button>
        
        <transition name="fade">
          <p v-if="error" class="error-message">{{ error }}</p>
        </transition>
      </form>
      
      <div class="test-accounts">
        <p><strong>Cuentas de prueba:</strong></p>
        <p>Admin: admin@colonia.com / admin123</p>
        <p>Vecino: maria@vecino.com / maria123</p>
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
const isLoading = ref(false)
const error = ref('')

const clearError = () => {
  error.value = ''
}

const handleLogin = async () => {
  isLoading.value = true

  const result = await authStore.login({
    email: email.value,
    password: password.value
  })

  if (result.success) {
    // obtener el rol del usuario desde result.user o desde el token
    const rol = result.user?.rol || null

    if (rol === 'admin') {
      router.push('/admin')
    } else if (rol === 'vecino') {
      router.push('/balance')
    } else {
      router.push('/') // fallback por si algo raro
    }
  } else {
    error.value = result.error
  }

  isLoading.value = false
}

</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 10px;
  font-size: 1.5rem;
  line-height: 1.3;
  font-weight: 600;
}

p {
  color: #666;
  text-align: center;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #4A90E2;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #357ABD;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  padding: 10px;
  background: #ffeaea;
  border-radius: 6px;
  border: 1px solid #ffcccc;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.test-accounts {
  margin-top: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.test-accounts p {
  margin: 5px 0;
  text-align: left;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  h1 {
    font-size: 1.3rem;
  }
}
</style>
