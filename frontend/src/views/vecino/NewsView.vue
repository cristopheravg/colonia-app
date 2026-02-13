<template>
  <AppLayout>
    <section class="news-view">
      <h1 class="page-title">Noticias de la Colonia</h1>

      <div class="news-list">
        <article
          class="news-card"
          v-for="news in newsList"
          :key="news.id"
        >
          <h3 class="news-title">{{ news.titulo }}</h3>
          <p class="news-content">{{ news.contenido }}</p>
          <div class="news-footer">
            <span class="news-date">{{ formatDate(news.fecha_publicacion) }}</span>
            <span class="news-badge" v-if="news.destacada">🌟 Destacada</span>
          </div>
        </article>
      </div>

      <div v-if="loading" class="loading">Cargando noticias...</div>
      <div v-if="!loading && !newsList.length" class="empty-state">No hay noticias disponibles.</div>
    </section>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const newsList = ref([])
const loading = ref(false)

// Función para formatear fechas
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

// Cargar noticias desde la API
onMounted(async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('colonia_token')

    const response = await fetch('http://54.227.139.118:3000/api/noticias', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (data.success) {
      newsList.value = data.data
    } else {
      console.error(data.message)
    }
  } catch (error) {
    console.error('Error cargando noticias:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-title {
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin-bottom: 28px;
  margin-top: 15px;
}

.news-view {
  min-height: calc(100vh - 180px);
  padding: 0;
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 25px;
  text-align: center;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.news-card {
  background: #fff;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  border-left: 4px solid #4A90E2;
  transition: transform 0.3s, box-shadow 0.3s;
}

.news-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.12);
}

.news-title {
  margin: 0 0 15px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

.news-content {
  color: #555;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 1rem;
}

.news-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.news-date {
  color: #666;
  font-size: 0.9rem;
}

.news-badge {
  background: #fff3cd;
  color: #856404;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.loading,
.empty-state {
  text-align: center;
  color: #666;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .news-view {
    padding: 15px;
  }

  .news-card {
    padding: 20px;
  }

  .news-footer {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
