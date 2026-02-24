<template>
  <AppLayout>
    <section class="events-view">
      <!-- Header con más presencia -->
      <div class="view-header" :class="{ 'header-scrolled': isScrolled }">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">Eventos</h1>
            <span class="event-count-badge">{{ events.length }}</span>
          </div>
          
          <!-- Solo filtro, sin calendario -->
          <button class="filter-main-btn" @click="showFilters = !showFilters">
            <span class="btn-icon">🔍</span>
            <span class="btn-text" v-if="activeFilter !== 'upcoming'">Filtrado</span>
          </button>
        </div>

        <!-- Filtros rápidos con transición - SIN "TODOS" -->
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

      <!-- Lista con transición de entrada -->
      <div 
        class="events-list-container"
        ref="scrollContainer"
        @scroll="handleScroll"
      >
        <transition-group 
          name="page-transition" 
          tag="div" 
          class="events-list"
          appear
        >
          <article
            class="event-card"
            v-for="(event, index) in filteredEvents"
            :key="event.id"
            :style="{ transitionDelay: `${index * 0.03}s` }"
            @click="openEventDetails(event)"
          >
            <div class="card-inner">
              <div class="event-date">
                <span class="event-day">{{ getDay(event.fecha_inicio) }}</span>
                <span class="event-month">{{ getMonth(event.fecha_inicio) }}</span>
              </div>

              <div class="event-content">
                <div class="event-header">
                  <h3 class="event-title">{{ event.nombre }}</h3>
                  <span class="event-time" v-if="event.hora">
                    {{ formatTime(event.hora) }}
                  </span>
                </div>
                
                <p class="event-description">{{ event.descripcion }}</p>

                <div class="event-meta">
                  <div class="meta-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">{{ formatRelativeDate(event.fecha_inicio) }}</span>
                  </div>
                  
                  <div class="meta-item" v-if="event.lugar">
                    <span class="meta-icon">📍</span>
                    <span class="meta-text">{{ event.lugar }}</span>
                  </div>

                  <span class="event-status" :class="getEventStatus(event.fecha_inicio)">
                    {{ getEventStatusText(event.fecha_inicio) }}
                  </span>
                </div>
              </div>

              <div class="card-chevron">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </article>
        </transition-group>

        <!-- Loader -->
        <div v-if="isLoading" class="infinite-loader">
          <div class="spinner"></div>
          <span>Cargando más eventos...</span>
        </div>

        <!-- End indicator -->
        <div v-if="!hasMoreEvents && filteredEvents.length > 0" class="end-indicator">
          <span class="line"></span>
          <span>Ya has visto todos los eventos</span>
          <span class="line"></span>
        </div>

        <!-- Empty state -->
        <div v-if="filteredEvents.length === 0 && !isLoading" class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No hay eventos programados</h3>
          <p>Los próximos eventos aparecerán aquí</p>
          <button class="btn-notify" @click="notifyMe">
            <span>🔔</span> Notificarme
          </button>
        </div>
      </div>

      <!-- Bottom sheet con transición tipo móvil -->
      <transition name="modal-transition">
        <div v-if="selectedEvent" class="bottom-sheet" @click.self="closeEventDetails">
          <div class="sheet-content">
            <div class="sheet-handle"></div>
            
            <div class="sheet-header">
              <h2>{{ selectedEvent.nombre }}</h2>
              <button class="close-btn" @click="closeEventDetails">✕</button>
            </div>

            <div class="sheet-body">
              <div class="detail-section">
                <span class="detail-label">Fecha y hora</span>
                <span class="detail-value">{{ formatDate(selectedEvent.fecha_inicio) }}</span>
                <span v-if="selectedEvent.hora" class="detail-value time">{{ selectedEvent.hora }}</span>
              </div>

              <div class="detail-section" v-if="selectedEvent.lugar">
                <span class="detail-label">Lugar</span>
                <span class="detail-value">{{ selectedEvent.lugar }}</span>
              </div>

              <div class="detail-section">
                <span class="detail-label">Descripción</span>
                <p class="detail-description">{{ selectedEvent.descripcion }}</p>
              </div>

              <div class="sheet-actions">
                <button class="action-btn primary" @click="addToCalendar">
                  📅 Agregar a calendario
                </button>
                <button class="action-btn secondary" @click="shareEvent">
                  🔗 Compartir
                </button>
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
const events = ref([])
const isLoading = ref(false)
const hasMoreEvents = ref(true)
const page = ref(1)
const showFilters = ref(false)
const activeFilter = ref('upcoming') // Cambiado de 'all' a 'upcoming' como default
const selectedEvent = ref(null)
const isScrolled = ref(false)
const scrollContainer = ref(null)

// Filtros - SIN LA OPCIÓN "TODOS"
const filters = [
  { label: 'Próximos', value: 'upcoming' },
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'week' }
]

// Computed
const filteredEvents = computed(() => {
  if (!events.value.length) return []
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return events.value.filter(event => {
    const eventDate = new Date(event.fecha_inicio)
    eventDate.setHours(0, 0, 0, 0)
    
    switch(activeFilter.value) {
      case 'upcoming':
        return eventDate >= today
      case 'today':
        return eventDate.getTime() === today.getTime()
      case 'week':
        return eventDate >= today && eventDate <= weekLater
      default:
        return eventDate >= today // Por defecto, próximos
    }
  })
})

// Transición de página al entrar
onMounted(async () => {
  document.body.classList.add('page-enter')
  await loadEvents()
  setTimeout(() => {
    document.body.classList.remove('page-enter')
  }, 300)
})

// Load events
const loadEvents = async (reset = false) => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const token = localStorage.getItem('colonia_token')
    const response = await fetch(`/api/eventos?page=${page.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const data = await response.json()
    
    if (data.success) {
      if (reset) {
        events.value = data.data
      } else {
        events.value = [...events.value, ...data.data]
      }
      
      hasMoreEvents.value = data.data.length > 0
    }
  } catch (error) {
    console.error('Error cargando eventos:', error)
  } finally {
    isLoading.value = false
  }
}

// Scroll handler
const handleScroll = () => {
  const container = scrollContainer.value
  if (!container) return
  
  isScrolled.value = container.scrollTop > 20
  
  const bottomDistance = container.scrollHeight - container.scrollTop - container.clientHeight
  if (bottomDistance < 200 && !isLoading.value && hasMoreEvents.value) {
    page.value++
    loadEvents()
  }
}

// Utility functions
const getDay = d => new Date(d).getDate().toString().padStart(2, '0')
const getMonth = d => {
  const month = new Date(d).toLocaleDateString('es-MX', { month: 'short' }).toUpperCase()
  return month.replace('.', '')
}
const formatTime = time => time ? time.substring(0, 5) : ''
const formatDate = d => new Date(d).toLocaleDateString('es-MX', { 
  weekday: 'long', 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric' 
})

const formatRelativeDate = d => {
  const date = new Date(d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)
  
  if (eventDate.getTime() === today.getTime()) return 'Hoy'
  if (eventDate.getTime() === tomorrow.getTime()) return 'Mañana'
  
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

const getEventStatus = (date) => {
  const eventDate = new Date(date)
  eventDate.setHours(0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (eventDate < today) return 'past'
  if (eventDate.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

const getEventStatusText = (date) => {
  const status = getEventStatus(date)
  const texts = { past: 'Finalizado', today: 'Hoy', upcoming: 'Próximo' }
  return texts[status]
}

// Actions
const openEventDetails = (event) => {
  selectedEvent.value = event
  document.body.style.overflow = 'hidden'
}

const closeEventDetails = () => {
  selectedEvent.value = null
  document.body.style.overflow = ''
}

const addToCalendar = () => {
  console.log('Agregar a calendario:', selectedEvent.value)
  closeEventDetails()
}

const shareEvent = () => {
  console.log('Compartir:', selectedEvent.value)
}

const notifyMe = () => {
  console.log('Activar notificaciones')
}

// Cleanup
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ===== TRANSICIONES DE PÁGINA TIPO APP MÓVIL ===== */
.page-enter {
  opacity: 0;
}

.events-view {
  height: 100vh;
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

/* Transición para los cards */
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

/* ===== HEADER ===== */
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

.event-count-badge {
  background: #2563eb;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

/* Botón de filtro principal */
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

/* ===== LISTA ===== */
.events-list-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Cards */
.event-card {
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

.event-card:active {
  transform: scale(0.99);
  background: #fafafa;
}

.card-inner {
  display: flex;
  gap: 16px;
  padding: 16px;
  position: relative;
}

/* Fecha */
.event-date {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
}

.event-day {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2563eb;
  line-height: 1.2;
}

.event-month {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Contenido */
.event-content {
  flex: 1;
  min-width: 0;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
}

.event-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
}

.event-time {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.event-description {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Meta */
.event-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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

.event-status {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.event-status.upcoming {
  background: #e0f2fe;
  color: #0369a1;
}

.event-status.today {
  background: #dcfce7;
  color: #166534;
}

.event-status.past {
  background: #f1f5f9;
  color: #475569;
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

/* End indicator */
.end-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  color: #94a3b8;
  font-size: 0.8rem;
}

.end-indicator .line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, #e2e8f0, transparent);
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

/* ===== BOTTOM SHEET CON TRANSICIÓN MÓVIL ===== */
.modal-transition-enter-active,
.modal-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-transition-enter-from,
.modal-transition-leave-to {
  opacity: 0;
}

.modal-transition-enter-from .sheet-content,
.modal-transition-leave-to .sheet-content {
  transform: translateY(100%);
}

.bottom-sheet {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sheet-content {
  background: white;
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  margin: 12px auto;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.sheet-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.close-btn {
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
}

.sheet-body {
  padding: 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
  margin-bottom: 4px;
}

.detail-value {
  display: block;
  font-size: 1rem;
  color: #0f172a;
  font-weight: 500;
}

.detail-value.time {
  font-size: 0.9rem;
  color: #2563eb;
  margin-top: 2px;
}

.detail-description {
  margin: 8px 0 0;
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.5;
}

.sheet-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.sheet-actions .action-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
}

.sheet-actions .primary {
  background: #2563eb;
  color: white;
}

.sheet-actions .primary:active {
  background: #1d4ed8;
  transform: scale(0.98);
}

.sheet-actions .secondary {
  background: #f1f5f9;
  color: #334155;
}

.sheet-actions .secondary:active {
  background: #e2e8f0;
  transform: scale(0.98);
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

/* Responsive */
@media (min-width: 768px) {
  .events-view {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;
    background: white;
  }
}
</style>