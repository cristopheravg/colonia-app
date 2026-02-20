<template>
  <div class="events-view">
    <div class="page-header">
      <h1>Eventos de la Colonia</h1>
      <button class="btn-primary" @click="openCreateModal">
        + Nuevo Evento
      </button>
    </div>

        <button class="btn-primary" @click="goToAsistencias">
      📋 Asistencias
    </button>
    <!-- Lista de eventos -->
    <div v-if="!loading && sortedEvents.length" class="events-list">
      <div
        v-for="event in sortedEvents"
        :key="event.id"
        class="event-card"
      >
        <div class="event-info">
          <h3>{{ event.nombre }}</h3>
          <p class="event-date">
            📅 {{ formatDate(event.fecha_inicio) }}
          </p>
          <p class="event-description">
            {{ event.descripcion }}
          </p>
        </div>

        <div class="event-actions">
          <button class="btn-edit" @click="editEvent(event)">
            Editar
          </button>
          <button class="btn-delete" @click="deleteEvent(event.id)">
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading && !sortedEvents.length" class="empty-state">
      No hay eventos registrados.
    </div>

    <div v-if="loading" class="loading">
      Cargando eventos...
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h2>{{ isEditing ? 'Editar Evento' : 'Nuevo Evento' }}</h2>

        <div class="form-group">
          <label>Título</label>
          <input v-model="form.nombre" type="text" />
        </div>

        <div class="form-group">
          <label>Descripción</label>
          <textarea v-model="form.descripcion"></textarea>
        </div>

        <div class="form-group">
          <label>Fecha</label>
          <input v-model="form.fecha_inicio" type="date" />
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">
            Cancelar
          </button>
          <button class="btn-primary" @click="saveEvent">
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
const events = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const token = localStorage.getItem('colonia_token')
const api = axios.create({
  baseURL: '/api',
  headers: {
    Authorization: `Bearer ${token}`
  }
})


const form = ref({
  nombre: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  lugar: '',
  max_asistentes: 0
})



const sortedEvents = computed(() =>
  [...events.value].sort(
    (a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
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
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    lugar: '',
    max_asistentes: 0
  }
  showModal.value = true
}

const editEvent = (event) => {
  isEditing.value = true
  editingId.value = event.id

  form.value = {
    ...event,
    fecha_inicio: event.fecha_inicio
      ? event.fecha_inicio.split('T')[0]
      : '',
    fecha_fin: event.fecha_fin
      ? event.fecha_fin.split('T')[0]
      : ''
  }

  showModal.value = true
}


const closeModal = () => {
  showModal.value = false
}

const saveEvent = async () => {
  if (!form.value.nombre || !form.value.fecha_inicio) {
    alert('Título y fecha son obligatorios')
    return
  }

  try {
    if (isEditing.value) {
      await api.put(`/eventos/${editingId.value}`, form.value)
    } else {
      await api.post('/eventos', form.value)
    }

    const response = await api.get('/eventos')

    events.value = response.data.data

    closeModal()
  } catch (error) {
    console.error('Error guardando evento:', error)
    alert('Error al guardar el evento')
  }
}


const deleteEvent = async (id) => {
  if (!confirm('¿Seguro que quieres eliminar este evento?')) return

  try {
    await api.delete(`/eventos/${id}`)
    events.value = events.value.filter(e => e.id !== id)
  } catch (error) {
    console.error('Error eliminando evento:', error)
    alert('Error al eliminar')
  }
}


const goToAsistencias = () => {
  window.location.href = 'asistencias'
}

onMounted(async () => {
  loading.value = true

  try {
    const response = await api.get('/eventos')
    events.value = response.data.data
  } catch (error) {
    console.error('Error cargando eventos:', error)
  } finally {
    loading.value = false
  }
})

</script>

<style scoped>
.events-view {
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

.events-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.event-date {
  font-size: 0.9rem;
  color: #666;
}

.event-actions {
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
</style>
