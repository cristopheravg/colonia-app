<template>
  <AppLayout>
    <div class="dashboard">
      <div class="welcome-card">
        <h2>¡Hola, {{ userName }}! 👋</h2>
        <p>Mesa Directiva Miguel Avila / Doroteo Arango</p>
      </div>
      
      <div class="quick-stats">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <h3>Estado de Cuenta</h3>
            <p class="stat-value">$1,200.00</p>
            <small>Saldo pendiente</small>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <h3>Próximo Evento</h3>
            <p class="stat-value">Asamblea General</p>
            <small>15 Enero</small>
          </div>
        </div>
      </div>
      
      <div class="quick-actions">
        <h3>Acceso Rápido</h3>
        <div class="actions-grid">
          <router-link to="/noticias" class="action-card">
            <div class="action-icon">📰</div>
            <span>Noticias</span>
          </router-link>
          
          <router-link to="/eventos" class="action-card">
            <div class="action-icon">📅</div>
            <span>Eventos</span>
          </router-link>
          
          <router-link to="/balance" class="action-card">
            <div class="action-icon">💰</div>
            <span>Mi Estado</span>
          </router-link>
          
          <router-link to="/qr" class="action-card">
            <div class="action-icon">📱</div>
            <span>Mi QR</span>
          </router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const authStore = useAuthStore()
const userName = computed(() => authStore.userName)
</script>

<style scoped>
/* Mantener estilos iguales */
.dashboard {
  padding: 0;
}

.welcome-card {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.welcome-card h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.welcome-card p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
  margin-right: 1rem;
  opacity: 0.8;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.stat-value {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.8;
}

.action-card span {
  font-size: 0.9rem;
  text-align: center;
  font-weight: 500;
}

@media (max-width: 768px) {
  .quick-stats {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
