<template>
  <AppLayout>
    <div class="news-detail-view">
      <div class="detail-header">
        <button class="back-button" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Volver</span>
        </button>
      </div>

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

const goBack = () => router.back()

const loadNews = async () => {
  loading.value = true
  error.value = null

  try {
    const id = route.params.id
    const token = localStorage.getItem('colonia_token')

    // 🔹 Apuntar al endpoint de la API, no al frontend
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