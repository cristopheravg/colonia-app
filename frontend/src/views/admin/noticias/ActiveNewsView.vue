<template>
  <div class="news-admin-view">
    <div class="page-header">
      <h1>Noticias de la Colonia</h1>
      <button class="btn-primary" @click="openCreateModal">
        + Nueva Noticia
      </button>
    </div>

    <!-- Lista de noticias -->
    <div v-if="!loading && sortedNews.length" class="news-list">
      <div
        v-for="news in sortedNews"
        :key="news.id"
        class="news-card"
      >
        <div class="news-info">
          <h3>{{ news.titulo }}</h3>
          <p class="news-date">
            📅 {{ formatDate(news.fecha_publicacion) }}
          </p>
          <p class="news-content">
            {{ news.contenido }}
          </p>
          <p v-if="news.destacada" class="news-badge">🌟 Destacada</p>
        </div>

        <div class="news-actions">
          <button class="btn-edit" @click="editNews(news)">
            Editar
          </button>
          <button class="btn-delete" @click="deleteNews(news.id)">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading && !sortedNews.length" class="empty-state">
      No hay noticias registradas.
    </div>

    <div v-if="loading" class="loading">
      Cargando noticias...
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Noticia' : 'Nueva Noticia' }}</h2>

        <div class="form-group">
          <label>Título</label>
          <input v-model="form.titulo" type="text" />
        </div>

        <div class="form-group">
          <label>Contenido</label>
          <textarea v-model="form.contenido"></textarea>
        </div>

        <div class="form-group">
          <label>Fecha de Publicación</label>
          <input v-model="form.fecha_publicacion" type="date" />
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" v-model="form.destacada" />
            Destacada
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">
            Cancelar
          </button>
          <button class="btn-primary" @click="saveNews">
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(false)
const newsList = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const token = localStorage.getItem('colonia_token')
const api = axios.create({
  baseURL: 'http://54.227.139.118:3000/api',
  headers: {
    Authorization: `Bearer ${token}`
  }
})

const form = ref({
  titulo: '',
  contenido: '',
  fecha_publicacion: '',
  destacada: false
})

const sortedNews = computed(() =>
  [...newsList.value].sort(
    (a, b) => new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
  )
)

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = {
    titulo: '',
    contenido: '',
    fecha_publicacion: '',
    destacada: false
  }
  showModal.value = true
}

const editNews = (news) => {
  isEditing.value = true
  editingId.value = news.id
  form.value = {
    ...news,
    fecha_publicacion: news.fecha_publicacion
      ? news.fecha_publicacion.split('T')[0]
      : ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveNews = async () => {
  if (!form.value.titulo || !form.value.fecha_publicacion) {
    alert('Título y fecha son obligatorios')
    return
  }

  try {
    if (isEditing.value) {
      await api.put(`/noticias/${editingId.value}`, form.value)
    } else {
      await api.post('/noticias', form.value)
    }

    const response = await api.get('/noticias')
    newsList.value = response.data.data
    closeModal()
  } catch (error) {
    console.error('Error guardando noticia:', error)
    alert('Error al guardar la noticia')
  }
}

const deleteNews = async (id) => {
  if (!confirm('¿Seguro que quieres eliminar esta noticia?')) return

  try {
    await api.delete(`/noticias/${id}`)
    newsList.value = newsList.value.filter(n => n.id !== id)
  } catch (error) {
    console.error('Error eliminando noticia:', error)
    alert('Error al eliminar')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.get('/noticias')
    newsList.value = response.data.data
  } catch (error) {
    console.error('Error cargando noticias:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.news-admin-view {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.btn-primary {
  background: #4A90E2;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-secondary {
  background: #ccc;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.news-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.news-actions {
  display: flex;
  gap: 10px;
}

.btn-edit {
  background: #f57c00;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-delete {
  background: #d32f2f;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 25px;
  border-radius: 12px;
  width: 400px;
}

.form-group {
  margin-bottom: 15px;
}

input, textarea {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.news-badge {
  color: #856404;
  font-weight: 600;
  margin-top: 5px;
}
</style>
