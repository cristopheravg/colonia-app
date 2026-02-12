<template>
  <div class="admin-layout">
    
    <!-- Header -->
    <header class="admin-header">
      <h1 class="admin-title">Panel de Administración</h1>
      <p class="admin-subtitle">Gestión de la colonia</p>
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
import { Users, Calendar, CreditCard, Newspaper } from 'lucide-vue-next'
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
  padding: 24px 20px 12px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  width: 100%;
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
  }

  .admin-bottom-nav {
    height: 70px;
  }

}

</style>
