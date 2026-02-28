<template>
  <AppLayout>
    <div class="news-detail-view">
      <!-- Header con botón de retroceso -->
      <div class="detail-header">
        <button class="back-button" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Volver</span>
        </button>
      </div>

      <!-- Contenido de la noticia -->
      <div class="detail-content" v-if="news">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando noticia...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Error al cargar la noticia</h3>
          <p>{{ error }}</p>
          <button class="retry-btn" @click="loadNews">Reintentar</button>
        </div>

        <template v-else>
          <!-- Metadata de la noticia -->
          <div class="news-metadata">
            <span class="news-date">📅 {{ formatDate(news.fecha_publicacion) }}</span>
            <span class="news-badge" v-if="news.destacada">🌟 Destacada</span>
          </div>

          <!-- Título -->
          <h1 class="news-title">{{ news.titulo }}</h1>

          <!-- Contenido completo con HTML -->
          <div class="news-body" v-html="news.contenido"></div>

          <!-- Información adicional si existe -->
          <div class="news-footer" v-if="news.visitas">
            <span class="views-count">👁️ {{ news.visitas }} vistas</span>
          </div>
        </template>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
const router = useRouter()
const news = ref(null)
const loading = ref(true)
const error = ref(null)

// Función para volver atrás
const goBack = () => {
  router.back()
}

// Cargar la noticia
const loadNews = async () => {
  loading.value = true
  error.value = null
  
  try {
    const id = route.params.id
    const token = localStorage.getItem('colonia_token')
    
    // IMPORTANTE: Ajusta esta URL según tu API real
    const response = await fetch(`/api/noticias/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await response.json()

    if (data.success) {
      news.value = data.data
    } else {
      error.value = data.message || 'No se pudo cargar la noticia'
    }
  } catch (err) {
    console.error('Error cargando noticia:', err)
    error.value = 'Error de conexión al cargar la noticia'
  } finally {
    loading.value = false
  }
}

// Formatear fecha (reutilizada de NewsView)
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

onMounted(() => {
  loadNews()
})
</script>

<style scoped>
.news-detail-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  min-height: 100%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Header con botón de retroceso */
.detail-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 8px 12px;
  border: none;
  background: #f1f5f9;
  border-radius: 30px;
  color: #475569;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:active {
  background: #e2e8f0;
  transform: scale(0.97);
}

.back-button svg {
  width: 20px;
  height: 20px;
}

/* Contenido principal */
.detail-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  padding-bottom: 100px; /* Espacio para bottom nav */
}

/* Metadata */
.news-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #64748b;
}

.news-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.news-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
}

/* Título */
.news-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 20px 0;
  line-height: 1.3;
  font-family: 'Times New Roman', Times, serif;
}

/* Cuerpo de la noticia */
.news-body {
  font-size: 1.1rem;
  color: #334155;
  line-height: 1.7;
  word-break: break-word;
  text-align: justify;
  margin-bottom: 30px;
  font-family: 'Times New Roman', Times, serif;
}

.news-body p {
  margin: 0 0 16px 0;
  text-align: justify;
}

.news-body p:last-child {
  margin-bottom: 0;
}

.news-body br {
  display: block;
  content: "";
  margin-top: 12px;
}

/* Footer */
.news-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
  color: #64748b;
  font-size: 0.9rem;
}

.views-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Estados de carga y error */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.error-state h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 8px;
}

.error-state p {
  color: #64748b;
  margin: 0 0 20px;
}

.retry-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:active {
  transform: scale(0.95);
  background: #1d4ed8;
}

/* Responsive */
@media (max-width: 768px) {
  .detail-content {
    padding: 16px;
  }
  
  .news-title {
    font-size: 1.5rem;
  }
  
  .news-body {
    font-size: 1rem;
  }
}

@media (min-width: 768px) {
  .news-detail-view {
    max-width: 700px;
    margin: 0 auto;
    border-left: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;
  }
}
</style>