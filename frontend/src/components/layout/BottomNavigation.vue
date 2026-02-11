<template>
  <nav class="bottom-navigation">
    <router-link to="/noticias" class="nav-item" :class="{ active: $route.path === '/noticias' }">
      <Newspaper class="nav-icon" />
      <span class="nav-label">Noticias</span>
    </router-link>
    
    <router-link to="/eventos" class="nav-item" :class="{ active: $route.path === '/eventos' }">
      <Calendar class="nav-icon" />
      <span class="nav-label">Eventos</span>
    </router-link>
    
    <router-link to="/balance" class="nav-item" :class="{ active: $route.path === '/balance' }">
      <Wallet class="nav-icon" />
      <span class="nav-label">Mi Estado</span>
    </router-link>
    
    <router-link to="/qr" class="nav-item" :class="{ active: $route.path === '/qr' }">
      <QrCode class="nav-icon" />
      <span class="nav-label">Mi QR</span>
    </router-link>
  </nav>
</template>

<script setup>
import { Newspaper, Calendar, Wallet, QrCode } from 'lucide-vue-next'
</script>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 12px 0 8px;
  box-shadow: 0 -2px 15px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  border-top: 1px solid #e0e0e0;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  padding: 6px 12px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 70px;
  flex: 1;
  max-width: 85px;
  position: relative;
  -webkit-tap-highlight-color: transparent;

}

.nav-item:focus,
.nav-item:active,
.nav-item:focus-visible {
  outline: none;
  background: transparent;
}

@media (hover: hover) {
  .nav-item:hover {
    background: #f8fafc;
  }
}


.nav-item:hover {
  background: #f8fafc;
}

.nav-item.active {
  color: #4A90E2;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: #4A90E2;
  border-radius: 3px;
}

.nav-item.active .nav-icon {
  color: #4A90E2;       /* 👈 mismo azul del cuadrito */
  transform: translateY(-2px);
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 4px;
  width: 22px;
  height: 22px;
  stroke-width: 1.6;
  display: block;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  background: none;
  box-shadow: none;
  transition: transform 0.25s ease, color 0.25s ease;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.2px;
}

/* Ajustar contenido principal para la bottom nav */
:deep(.app-main) {
  padding-bottom: 90px !important; /* Aumentado para más espacio */
}

/* Safe area para iPhone */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bottom-navigation {
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
  }
}

/* Para pantallas más grandes, ajustar tamaño */
@media (min-width: 768px) {
  .bottom-navigation {
    max-width: 500px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 20px 20px 0 0;
    border: 1px solid #e0e0e0;
    border-bottom: none;
  }
  
  .nav-item {
    min-width: 80px;
    max-width: 100px;
    padding: 8px 12px;
  }
  
  .nav-icon {
    font-size: 22px;
    width: 40px;
    height: 40px;
  }
  
  .nav-label {
    font-size: 12px;
  }
}

/* Efecto de elevación al hacer hover */
.nav-item:hover .nav-icon {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(74, 144, 226, 0.2);
}

/* Transición suave para estados activos */
.nav-item.active .nav-icon {
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}
</style>
