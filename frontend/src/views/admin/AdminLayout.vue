<template>
  <div class="admin-layout">
    
    <!-- Header -->
    <header class="admin-header">
      <div class="header-top">
        <div>
          <h1 class="admin-title">Panel de Administración</h1>
          <p class="admin-subtitle">Gestión de la colonia</p>
        </div>

        <!-- Botón de cerrar sesión -->
        <button class="logout-button" @click="logout" :disabled="loggingOut">
          <LogOut class="logout-icon" />
          Cerrar sesión
        </button>
      </div>
    </header>

    <!-- Contenido dinámico -->
    <main class="admin-content">
      <router-view />
    </main>

    <!-- Bottom Navigation -->
    <nav class="admin-bottom-nav">
      <router-link to="/admin/usuarios" class="nav-item" active-class="active">
        <Users class="icon" />
        <span>Usuarios</span>
      </router-link>

      <router-link to="/admin/eventos" class="nav-item" active-class="active">
        <Calendar class="icon" />
        <span>Eventos</span>
      </router-link>

      <router-link to="/admin/pagos" class="nav-item" active-class="active">
        <CreditCard class="icon" />
        <span>Pagos</span>
      </router-link>

      <router-link to="/admin/noticias" class="nav-item" active-class="active">
        <Newspaper class="icon" />
        <span>Noticias</span>
      </router-link>
    </nav>

  </div>
</template>

<script setup>
import { Users, Calendar, CreditCard, Newspaper, LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { authService } from '../../services/authService.js'

const router = useRouter()
const loggingOut = ref(false)

const logout = async () => {
  loggingOut.value = true
  try {
    await authService.logout()
    localStorage.removeItem('colonia_token')
    localStorage.removeItem('colonia_user')
    router.push('/login')
  } catch (error) {
    console.error('Error cerrando sesión:', error)
    alert('No se pudo cerrar sesión, intenta de nuevo')
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
}

/* HEADER */
.admin-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 20px 12px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}

.admin-subtitle {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

/* Botón de cerrar sesión */
.logout-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.logout-button:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.logout-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2.5;
}

/* CONTENT */
.admin-content {
  flex: 1;
  padding: 20px;
  padding-bottom: 90px;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

/* BOTTOM NAV */
.admin-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.75rem;
  text-decoration: none;
  color: #64748b;
  transition: all 0.2s ease;
}

.icon {
  width: 22px;
  height: 22px;
  margin-bottom: 4px;
}

.nav-item.active {
  color: #2563eb;
  font-weight: 500;
}

.nav-item.active .icon {
  stroke-width: 2.5;
}

/* Desktop enhancement */
@media (min-width: 768px) {
  .admin-header {
    padding: 28px 40px 20px;
  }

  .admin-content {
    padding: 40px;
    margin-bottom: 120px;
  }

  .admin-bottom-nav {
    height: 70px;
  }
}
</style>
