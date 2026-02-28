<template>
  <AppLayout>
    <div class="news-detail-view">

      <!-- HEADER -->
      <div class="detail-header">
        <button class="back-button" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Volver</span>
        </button>
      </div>

      <!-- CONTENIDO -->
      <div class="detail-content">
        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando noticia...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Error al cargar la noticia</h3>
          <p>{{ error }}</p>
          <button class="retry-btn" @click="loadNews">Reintentar</button>
        </div>

        <!-- Noticia -->
        <template v-else>
          <div class="news-metadata">
            <span class="news-date">📅 {{ formatDate(news.fecha_publicacion) }}</span>
            <span class="news-badge" v-if="news.destacada">🌟 Destacada</span>
          </div>

          <h1 class="news-title">{{ news.titulo }}</h1>

          <div class="news-body" v-html="news.contenido"></div>

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

/**
 * Botón "Volver" inteligente:
 * - Navegador normal: router.back()
 * - WebView Android/iOS: envia mensaje a la app
 * - Fallback: redirige al inicio
 */
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' }))
    return
  }

  if (window.webkit?.messageHandlers?.iosWebViewHandler) {
    window.webkit.messageHandlers.iosWebViewHandler.postMessage({ action: 'goBack' })
    return
  }

  router.push('/')
}

const loadNews = async () => {
  loading.value = true
  error.value = null

  try {
    const id = route.params.id
    const token = localStorage.getItem('colonia_token')

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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Inter', sans-serif;
  color: #1f2937;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #111827;
  transition: background 0.2s;
}

.back-button:hover {
  background: #e5e7eb;
}

.detail-content {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.news-metadata {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.875rem;
  color: #6b7280;
}

.news-badge {
  background: #f59e0b;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.news-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #111827;
}

.news-body p {
  line-height: 1.7;
  margin-bottom: 16px;
  color: #374151;
}

.news-footer {
  margin-top: 24px;
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  gap: 12px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #6b7280;
  font-size: 1rem;
  text-align: center;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid #d1d5db;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.retry-btn:hover {
  background: #1d4ed8;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>