<template>
  <div class="events-view">
    <div class="page-header">
      <h1>Eventos de la Colonia</h1>
      <button class="btn-primary" @click="openCreateModal">
        + Nuevo Evento
      </button>
    </div>

    <!-- Lista de eventos -->
    <div v-if="!loading && sortedEvents.length" class="events-list">
      <div
        v-for="event in sortedEvents"
        :key="event.id"
        class="event-card"
      >
        <div class="event-info">
          <h3>{{ event.titulo }}</h3>
          <p class="event-date">
            📅 {{ formatDate(event.fecha) }}
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

const loading = ref(false)
const events = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const form = ref({
  titulo: '',
  descripcion: '',
  fecha: ''
})

// Simulación backend temporal
const exampleEvents = [
  {
    id: 1,
    titulo: 'Reunión Vecinal',
    descripcion: 'Se discutirán mejoras en seguridad.',
    fecha: '2026-03-10'
  },
  {
    id: 2,
    titulo: 'Mantenimiento Áreas Verdes',
    descripcion: 'Jornada de limpieza comunitaria.',
    fecha: '2026-02-20'
  }
]

const sortedEvents = computed(() =>
  [...events.value].sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha)
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
  form.value = { titulo: '', descripcion: '', fecha: '' }
  showModal.value = true
}

const editEvent = (event) => {
  isEditing.value = true
  editingId.value = event.id
  form.value = { ...event }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const saveEvent = () => {
  if (!form.value.titulo || !form.value.fecha) {
    alert('Título y fecha son obligatorios')
    return
  }

  if (isEditing.value) {
    const index = events.value.findIndex(e => e.id === editingId.value)
    events.value[index] = { ...form.value, id: editingId.value }
  } else {
    events.value.push({
      ...form.value,
      id: Date.now()
    })
  }

  closeModal()
}

const deleteEvent = (id) => {
  if (confirm('¿Seguro que quieres eliminar este evento?')) {
    events.value = events.value.filter(e => e.id !== id)
  }
}

onMounted(() => {
  loading.value = true

  // Aquí irá tu API real
  events.value = exampleEvents

  loading.value = false
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
