<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="app-header" v-if="user">
      <div class="header-content">
        <h1>Mesa Directiva<br>Miguel Avila / Doroteo Arango</h1>
        <div class="user-info">
          <span>{{ userName }}</span>
        </div>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="app-main">
      <slot></slot>
    </main>

    <!-- Bottom Navigation (solo si está autenticado) -->
    <BottomNavigation v-if="user" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BottomNavigation from './BottomNavigation.vue'

const authStore = useAuthStore()

const user = computed(() => authStore.user)
const userName = computed(() => authStore.userName)
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.app-header {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: white;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.3;
  font-weight: 600;
  text-align: left;
}

.user-info {
  font-weight: 500;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.app-main {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  padding-bottom: 100px; /* Espacio aumentado para bottom nav */
}

/* Responsive */
@media (max-width: 768px) {
  .app-main {
    padding: 1.25rem;
    padding-bottom: 100px;
  }
  
  .app-header h1 {
    font-size: 0.95rem;
  }
  
  .user-info {
    font-size: 0.85rem;
    padding: 5px 10px;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .app-header h1 {
    font-size: 0.9rem;
  }
  
  .app-main {
    padding: 1rem;
    padding-bottom: 100px;
  }
  
  .user-info {
    align-self: flex-end;
    margin-top: -30px;
  }
}

/* Ajustes para contenido específico */
:deep(.dashboard),
:deep(.news-view),
:deep(.events-view),
:deep(.balance-view),
:deep(.qr-view) {
  padding-bottom: 20px;
}
</style>
