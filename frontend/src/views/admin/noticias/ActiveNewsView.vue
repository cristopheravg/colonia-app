<template>
  <div class="news-view">
    <div class="page-header">
      <h1>Noticias</h1>
      <button class="btn-primary" @click="openCreateModal">
        + Nueva Noticia
      </button>
    </div>

    <!-- Lista -->
    <div v-if="!loading && sortedNews.length" class="news-list">
      <div v-for="item in sortedNews" :key="item.id" class="news-card">
        <div class="news-info">
          <h3>{{ item.titulo }}</h3>
          <p class="news-date">
            📰 {{ formatDate(item.fecha) }}
          </p>
          <p class="news-description">
            {{ item.descripcion }}
          </p>
        </div>

        <div class="news-actions">
          <button class="btn-edit" @click="editNews(item)">
            Editar
          </button>
          <button class="btn-delete" @click="deleteNews(item.id)">
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
          <label>Descripción</label>
          <textarea v-model="form.descripcion"></textarea>
        </div>

        <div class="form-group">
          <label>Fecha</label>
          <input v-model="form.fecha" type="date" />
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

const loading = ref(false)
const news = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const form = ref({
  titulo: '',
  descripcion: '',
  fecha: ''
})

// Datos temporales
const exampleNews = [
  {
    id: 1,
    titulo: 'Nueva caseta de vigilancia',
    descripcion: 'Se instalará una nueva caseta en la entrada principal.',
    fecha: '2026-02-01'
  },
  {
    id: 2,
    titulo: 'Cambio de reglamento interno',
    descripcion: 'Actualización del reglamento aprobado en asamblea.',
    fecha: '2026-01-15'
  }
]

const sortedNews = computed(() =>
  [...news.value].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  )
)

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const openCreateModal = () => {
  isEditing.value = false
  editingId.value = null
  form.value = { titulo: '', descripcion: '', fecha: '' }
  showModal.value = true
}

const editNews = (item) => {
  isEditing.value = true
  editingId.value = item.id
  form.value = { ...item }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveNews = () => {
  if (!form.value.titulo || !form.value.fecha) {
    alert('Título y fecha son obligatorios')
    return
  }

  if (isEditing.value) {
    const index = news.value.findIndex(n => n.id === editingId.value)
    news.value[index] = { ...form.value, id: editingId.value }
  } else {
    news.value.push({
      ...form.value,
      id: Date.now()
    })
  }

  closeModal()
}

const deleteNews = (id) => {
  if (confirm('¿Eliminar esta noticia?')) {
    news.value = news.value.filter(n => n.id !== id)
  }
}

onMounted(() => {
  loading.value = true
  news.value = exampleNews
  loading.value = false
})
</script>

<style scoped>
.news-view {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
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

.news-date {
  font-size: 0.9rem;
  color: #666;
}

.news-actions {
  display: flex;
  gap: 10px;
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
</style>
