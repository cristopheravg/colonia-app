<template>
  <AppLayout>
    <section class="news-view">
      <!-- Header uniforme -->
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

        <!-- Filtros rápidos -->
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
        <!-- Loader -->
        <div v-if="loading" class="infinite-loader">
          <div class="spinner"></div>
          <span>Cargando noticias...</span>
        </div>

        <!-- Lista con transiciones -->
        <transition-group 
          v-else
          name="page-transition" 
          tag="div" 
          class="news-list"
          appear
        >
          <article
            class="news-card"
            v-for="(news, index) in filteredNews"
            :key="news.id"
            :style="{ transitionDelay: `${index * 0.03}s` }"
            @click="openNewsDetails(news)"
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
                
                <!-- CORREGIDO: Usar v-html para respetar los <br> -->
                <div class="news-description" v-html="truncateContent(news.contenido)"></div>

                <div class="news-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">{{ formatRelativeDate(news.fecha_publicacion) }}</span>
                  </div>
                  
                  <!--<div class="meta-item">
                    <span class="meta-icon">👁️</span>
                    <span class="meta-text">{{ news.visitas || 0 }} vistas</span>
                  </div>-->
                </div>
              </div>

              <!-- Chevron indicador -->
              <div class="card-chevron">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </article>
        </transition-group>

        <!-- Empty state mejorado -->
        <div v-if="!loading && filteredNews.length === 0" class="empty-state">
          <div class="empty-icon">📰</div>
          <h3>No hay noticias disponibles</h3>
          <p>Las últimas noticias de la colonia aparecerán aquí</p>
          <button class="btn-notify" @click="refreshNews">
            <span>🔄</span> Actualizar
          </button>
        </div>
      </div>

      <!-- Modal centrado para noticia completa (con padding para navbar) -->
      
        <transition name="modal-fade">
          <div v-if="selectedNews" class="modal-overlay" @click.self="closeNewsDetails">
            <div class="modal-container">
              <div class="modal-content">
                <div class="modal-header">
                  <h2>{{ selectedNews.titulo }}</h2>
                  <button class="modal-close" @click="closeNewsDetails">✕</button>
                </div>

                <div class="modal-body">
                  <!-- Metadata -->
                  <div class="modal-meta">
                    <span class="meta-date">
                      📅 {{ formatDate(selectedNews.fecha_publicacion) }}
                    </span>
                    <span class="meta-views" v-if="selectedNews.visitas">
                      👁️ {{ selectedNews.visitas }} vistas
                    </span>
                    <span class="meta-badge" v-if="selectedNews.destacada">🌟 Destacada</span>
                  </div>

                  <!-- Contenido completo con v-html -->
                  <div class="modal-description" v-html="selectedNews.contenido"></div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      
    </section>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

// Estados
const newsList = ref([])
const loading = ref(false)
const showFilters = ref(false)
const activeFilter = ref('all')
const selectedNews = ref(null)
const isScrolled = ref(false)
const scrollContainer = ref(null)

// Filtros
const filters = [
  { label: 'Todas', value: 'all' },
  { label: 'Destacadas', value: 'featured' },
  { label: 'Recientes', value: 'recent' }
]

// Computed - noticias filtradas
const filteredNews = computed(() => {
  if (!newsList.value.length) return []
  
  let filtered = [...newsList.value]
  
  switch(activeFilter.value) {
    case 'featured':
      filtered = filtered.filter(news => news.destacada)
      break
    case 'recent':
      // Últimos 7 días
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(news => new Date(news.fecha_publicacion) >= weekAgo)
      break
    default:
      // Todas
      break
  }
  
  // Ordenar por fecha (más reciente primero)
  return filtered.sort((a, b) => 
    new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
  )
})

// Scroll handler
const handleScroll = () => {
  const container = scrollContainer.value
  if (!container) return
  isScrolled.value = container.scrollTop > 20
}

// Cargar noticias
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

// Refresh
const refreshNews = () => {
  loadNews()
}

// Utilidades
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

// CORREGIDO: Función truncate que respeta HTML
const truncateContent = (content) => {
  if (!content) return ''
  
  // Eliminar etiquetas HTML para contar caracteres reales
  const textOnly = content.replace(/<[^>]*>/g, '')
  
  if (textOnly.length > 120) {
    // Buscar el último <br> antes del límite para no cortar a medias
    let lastBreak = content.lastIndexOf('<br>', 120)
    if (lastBreak === -1) {
      lastBreak = content.lastIndexOf('<br />', 120)
    }
    
    if (lastBreak !== -1 && lastBreak < 120) {
      // Cortar en el último <br> encontrado
      return content.substring(0, lastBreak) + '...'
    } else {
      // Si no hay <br>, cortar en 120 caracteres de texto
      let charCount = 0
      let result = ''
      const tagRegex = /(<[^>]*>)|([^<]+)/g
      let match
      
      while ((match = tagRegex.exec(content)) !== null) {
        if (match[1]) {
          // Es una etiqueta, agregarla completa
          result += match[1]
        } else {
          // Es texto
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

// Acciones
const openNewsDetails = (news) => {
  selectedNews.value = news
  document.body.style.overflow = 'hidden'
}

const closeNewsDetails = () => {
  selectedNews.value = null
  document.body.style.overflow = ''
}

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
 /* height: 100vh;*/
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

/* Botón de filtro */
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

/* Filtros rápidos */
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

/* Cards de noticias */
.news-card {
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: cardFadeIn 0.4s ease forwards;
  opacity: 0;
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
  from {
    opacity: 0;
    transform: translateY(10px);
  }
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

/* Icono de noticia */
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

/* Contenido */
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

/* Estilos para la descripción con HTML */
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

/* Meta datos */
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

/* Chevron */
.card-chevron {
  display: flex;
  align-items: center;
  opacity: 0.3;
}

/* Loader */
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

/* Empty state */
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

/* ===== MODAL CENTRADO CON PADDING PARA NAVBAR ===== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

/*.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px; 
  padding-bottom: calc(20px + 70px); 
}*/

.modal-overlay {
  position: fixed;
  inset: 0;.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  width: 100%;
  max-width: 500px;
  max-height: 80vh; /* Reducido para dejar espacio a la navbar */
  margin: auto;
}

.modal-content {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modalAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
    font-family: 'Times New Roman', Times, serif;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  padding-right: 12px;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 36px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #e2e8f0;
  color: #475569;
}

.modal-close:active {
  transform: scale(0.95);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  /* Padding inferior extra para el último elemento */
  padding-bottom: 32px;
}

.modal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
  color: #64748b;
}

.modal-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-meta .meta-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 12px;
}

.modal-description {
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.6;
  word-break: break-word;
  text-align: justify;
  /* Espacio extra al final */
  margin-bottom: 16px;
  font-family: 'Times New Roman', Times, serif;
}

.modal-description p {
  margin: 0 0 12px 0;
  text-align: justify;
}

.modal-description p:last-child {
  margin-bottom: 0;
}

.modal-description br {
  display: block;
  content: "";
  margin-top: 8px;
}

/* Animaciones */
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

  .modal-overlay {
    padding: 12px;
    padding-bottom: calc(12px + 70px); /* Ajuste para móvil */
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 20px;
    padding-bottom: 28px;
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

  .modal-overlay {
    padding-bottom: calc(20px + 80px); /* Ajuste para desktop */
  }
}

/* Ajuste específico para dispositivos muy pequeños */
@media (max-width: 380px) {
  .modal-overlay {
    padding: 8px;
    padding-bottom: 20px;
  }

  .modal-header {
    padding: 14px 16px;
  }

  .modal-body {
    padding: 16px;
    padding-bottom: 100px;
  }
}
</style>