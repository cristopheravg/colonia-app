<template>
  <AppLayout>
    <div class="account-view">
      <h1>👤 Mi Cuenta</h1>
      
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">{{ userInitials }}</div>
          <div class="profile-info">
            <h2>{{ userName }}</h2>
            <p>{{ userEmail }}</p>
            <span class="badge" :class="userRoleClass">{{ userRoleText }}</span>
          </div>
        </div>
        
        <div class="profile-details">
          <div class="detail-item">
            <label>📍 Dirección</label>
            <p>{{ userAddress }}</p>
          </div>
          
          <div class="detail-item">
            <label>📅 Miembro desde</label>
            <p>{{ joinDate }}</p>
          </div>
        </div>
      </div>
      
      <div class="account-actions">
        <h3>Acciones de Cuenta</h3>
        <button class="action-btn" @click="editProfile">
          ✏️ Editar Perfil
        </button>
        <button class="action-btn" @click="changePassword">
          🔒 Cambiar Contraseña
        </button>
        <button class="action-btn logout-btn" @click="logout">
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => authStore.user?.nombre || 'Usuario')
const userEmail = computed(() => authStore.user?.email || '')
const userAddress = computed(() => authStore.user?.direccion || 'No especificada')
const userRole = computed(() => authStore.user?.rol || 'vecino')

const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
})

const userRoleText = computed(() => 
  userRole.value === 'admin' ? 'Administrador' : 'Vecino'
)

const userRoleClass = computed(() => 
  userRole.value === 'admin' ? 'badge-admin' : 'badge-vecino'
)

const joinDate = computed(() => {
  const date = authStore.user?.created_at ? new Date(authStore.user.created_at) : new Date()
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const editProfile = () => {
  alert('Funcionalidad de editar perfil - Próximamente')
}

const changePassword = () => {
  alert('Funcionalidad de cambiar contraseña - Próximamente')
}

const logout = () => {
  authStore.logout()
}
</script>

<style scoped>
.account-view {
  padding: 0;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 25px;
  text-align: center;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
}

.avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
}

.profile-info h2 {
  margin: 0 0 5px 0;
  color: #333;
}

.profile-info p {
  margin: 0 0 10px 0;
  color: #666;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge-admin {
  background: #e3f2fd;
  color: #1565c0;
}

.badge-vecino {
  background: #e8f5e9;
  color: #2e7d32;
}

.profile-details {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item label {
  display: block;
  color: #888;
  font-size: 14px;
  margin-bottom: 5px;
}

.detail-item p {
  color: #333;
  margin: 0;
}

.account-actions {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.account-actions h3 {
  color: #333;
  margin-bottom: 20px;
}

.action-btn {
  display: block;
  width: 100%;
  padding: 15px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  text-align: left;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.logout-btn {
  color: #e74c3c;
  border-color: #ffcdd2;
}

.logout-btn:hover {
  background: #ffebee;
}

@media (max-width: 768px) {
  .account-view {
    padding: 15px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .profile-info {
    text-align: center;
  }
}
</style>
