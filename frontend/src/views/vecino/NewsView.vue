<template>
  <AppLayout>
    <section class="news-view">
      <!-- Header uniforme (sin cambios) -->
      <div class="view-header" :class="{ 'header-scrolled': isScrolled }">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">Noticias</h1>
            <span class="news-count-badge">{{ newsList.length }}</span>
          </div>
          
          <!-- Filtro de noticias destacadas -->
          <button class="filter-main-btn" @click="showFilters = !showFilters">
            <span class="btn-icon">🔍</span>
            <span class="btn-text" v-if="activeFilter !== 'all'">Filtrado</span>
          </button>
        </div>

        <!-- Filtros rápidos (sin cambios) -->
        <transition name="slide-fade">
          <div v-if="showFilters" class="quick-filters">
            <button 
              v-for="filter in filters" 
              :key="filter.value"
              class="filter-chip"
              :class="{ active: activeFilter === filter.value }"
              @click="activeFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
        </transition>
      </div>

      <!-- Lista de noticias -->
      <div 
        class="news-list-container"
        ref="scrollContainer"
        @scroll="handleScroll"
      >
        <!-- Loader (sin cambios) -->
        <div v-if="loading" class="infinite-loader">
          <div class="spinner"></div>
          <span>Cargando noticias...</span>
        </div>

        <!-- Lista con transiciones - MODIFICADO: usar router-link en lugar de @click -->
        <transition-group 
          v-else
          name="page-transition" 
          tag="div" 
          class="news-list"
          appear
        >
          <router-link
            :to="`/noticias/${news.id}`"
            class="news-card"
            v-for="(news, index) in filteredNews"
            :key="news.id"
            :style="{ transitionDelay: `${index * 0.03}s` }"
          >
            <div class="card-inner">
              <!-- Icono de categoría/importancia -->
              <div class="news-icon">
                <span class="icon-emoji">{{ getNewsIcon(news) }}</span>
              </div>

              <div class="news-content">
                <div class="news-header">
                  <h3 class="news-title">{{ news.titulo }}</h3>
                  <span class="news-badge" v-if="news.destacada">🌟 Destacada</span>
                </div>
                
                <div class="news-description" v-html="truncateContent(news.contenido)"></div>

                <div class="news-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">{{ formatRelativeDate(news.fecha_publicacion) }}</span>
                  </div>
                </div>
              </div>

              <!-- Chevron indicador -->
              <div class="card-chevron">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </router-link>
        </transition-group>

        <!-- Empty state mejorado (sin cambios) -->
        <div v-if="!loading && filteredNews.length === 0" class="empty-state">
          <div class="empty-icon">📰</div>
          <h3>No hay noticias disponibles</h3>
          <p>Las últimas noticias de la colonia aparecerán aquí</p>
          <button class="btn-notify" @click="refreshNews">
            <span>🔄</span> Actualizar
          </button>
        </div>
      </div>

      <!-- MODIFICADO: Eliminar el modal completamente -->
      <!-- El modal ha sido eliminado -->
      
    </section>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router' // Añadido import de router
import AppLayout from '@/components/layout/AppLayout.vue'

// Estados
const newsList = ref([])
const loading = ref(false)
const showFilters = ref(false)
const activeFilter = ref('all')
// ELIMINADO: selectedNews ya no es necesario
const isScrolled = ref(false)
const scrollContainer = ref(null)

// Añadido router (por si necesitas navegación programática)
const router = useRouter()

// Filtros (sin cambios)
const filters = [
  { label: 'Todas', value: 'all' },
  { label: 'Destacadas', value: 'featured' },
  { label: 'Recientes', value: 'recent' }
]

// Computed - noticias filtradas (sin cambios)
const filteredNews = computed(() => {
  if (!newsList.value.length) return []
  
  let filtered = [...newsList.value]
  
  switch(activeFilter.value) {
    case 'featured':
      filtered = filtered.filter(news => news.destacada)
      break
    case 'recent':
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(news => new Date(news.fecha_publicacion) >= weekAgo)
      break
    default:
      break
  }
  
  return filtered.sort((a, b) => 
    new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
  )
})

// Scroll handler (sin cambios)
const handleScroll = () => {
  const container = scrollContainer.value
  if (!container) return
  isScrolled.value = container.scrollTop > 20
}

// Cargar noticias (sin cambios)
const loadNews = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('colonia_token')
    const response = await fetch('/api/noticias', {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await response.json()

    if (data.success) {
      newsList.value = data.data
    }
  } catch (error) {
    console.error('Error cargando noticias:', error)
  } finally {
    loading.value = false
  }
}

// Refresh (sin cambios)
const refreshNews = () => {
  loadNews()
}

// Utilidades (sin cambios)
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatRelativeDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

// Función truncate (sin cambios)
const truncateContent = (content) => {
  if (!content) return ''
  
  const textOnly = content.replace(/<[^>]*>/g, '')
  
  if (textOnly.length > 120) {
    let lastBreak = content.lastIndexOf('<br>', 120)
    if (lastBreak === -1) {
      lastBreak = content.lastIndexOf('<br />', 120)
    }
    
    if (lastBreak !== -1 && lastBreak < 120) {
      return content.substring(0, lastBreak) + '...'
    } else {
      let charCount = 0
      let result = ''
      const tagRegex = /(<[^>]*>)|([^<]+)/g
      let match
      
      while ((match = tagRegex.exec(content)) !== null) {
        if (match[1]) {
          result += match[1]
        } else {
          const text = match[2]
          const remaining = 120 - charCount
          if (text.length > remaining) {
            result += text.substring(0, remaining) + '...'
            break
          } else {
            result += text
            charCount += text.length
          }
        }
      }
      return result
    }
  }
  return content
}

const getNewsIcon = (news) => {
  if (news.destacada) return '🌟'
  return '📰'
}

// ELIMINADO: openNewsDetails y closeNewsDetails ya no son necesarios

// Lifecycle
onMounted(() => {
  loadNews()
  document.body.classList.add('page-enter')
  setTimeout(() => {
    document.body.classList.remove('page-enter')
  }, 300)
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ===== ESTILOS UNIFORMES CON LAS OTRAS VISTAS ===== */
.news-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  position: relative;
  animation: pageSlideIn 0.3s ease-out;
}

@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== HEADER UNIFORME ===== */
.view-header {
  background: white;
  border-bottom: 1px solid #f1f5f9;
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all 0.3s ease;
}

.view-header.header-scrolled {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.news-count-badge {
  background: #2563eb;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.filter-main-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: #f1f5f9;
  border-radius: 30px;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-main-btn:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

.btn-text {
  font-size: 0.8rem;
  background: #2563eb;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
}

.quick-filters {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.quick-filters::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-chip.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

/* ===== LISTA DE NOTICIAS ===== */
.news-list-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* MODIFICADO: Estilos para router-link */
.news-card {
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  /*animation: cardFadeIn 0.4s ease forwards;
  opacity: 0;*/
  text-decoration: none; /* Quitar subrayado del link */
  color: inherit; /* Mantener color de texto */
  display: block; /* Para que ocupe todo el ancho */
}

.news-card:active {
  transform: scale(0.99);
  background: #fafafa;
}

.card-inner {
  display: flex;
  gap: 16px;
  padding: 16px;
  position: relative;
}

.news-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
}

.icon-emoji {
  font-size: 1.5rem;
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
  flex-wrap: wrap;
}

.news-title {
  margin: 0;
  font-size: 1rem;
  font-weight: bold;
  color: #0f172a;
  line-height: 1.4;
}

.news-badge {
  background: #fef3c7;
  color: #92400e;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.news-description {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.news-description p {
  margin: 0 0 4px 0;
}

.news-description p:last-child {
  margin-bottom: 0;
}

.news-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #64748b;
}

.meta-icon {
  font-size: 0.85rem;
}

.card-chevron {
  display: flex;
  align-items: center;
  opacity: 0.3;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.infinite-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #64748b;
  font-size: 0.85rem;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.6;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 4px;
}

.empty-state p {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 20px;
}

.btn-notify {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-notify:active {
  transform: scale(0.95);
  background: #1d4ed8;
}

/* ELIMINADO: Todos los estilos del modal ya no son necesarios */

/* Animaciones (mantener las que se usan) */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.page-transition-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-transition-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.page-transition-move {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .news-list-container {
    padding: 16px;
  }

  .card-inner {
    padding: 14px;
  }
}

@media (min-width: 768px) {
  .news-view {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;
    background: white;
  }

  .news-list-container {
    background: #f8fafc;
  }
}
</style>