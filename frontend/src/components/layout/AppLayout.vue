<template>
  <div class="app-layout">
    <!-- Header -->

    <!--<header class="app-header" v-if="user">
      <div class="header-bar">
        <h1 class="header-title">Mesa Directiva <br />Miguel Avila / Doroteo Arango</h1>
      </div>
    </header>-->


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

/* ================= HEADER ================= */

.app-header {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  z-index: 100;
}

.header-bar {
  display: flex;
  justify-content: center;
  padding: 20px 16px 18px;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.25;
  letter-spacing: 0.3px;
}

/* Responsive header */
@media (max-width: 480px) {
  .header-title {
    font-size: 1.2rem;
    line-height: 1.2;
  }
}

/* ================= MAIN ================= */

.app-main {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  padding-bottom: 100px; /* espacio para bottom nav */
}

/* Tablet */
@media (max-width: 768px) {
  .app-main {
    padding: 1.25rem;
    padding-bottom: 100px;
  }
}

/* Móvil */
@media (max-width: 480px) {
  .app-main {
    padding: 1rem;
    padding-bottom: 100px;
  }
}

/* ================= VIEWS ================= */

:deep(.dashboard),
:deep(.news-view),
:deep(.events-view),
:deep(.balance-view),
:deep(.qr-view) {
  padding-bottom: 20px;
}


</style>
