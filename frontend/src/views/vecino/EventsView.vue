<template>
  <AppLayout>
    <div class="events-view">
      <h1>📅 Eventos de la Colonia</h1>
      
      <div class="events-list">
        <div class="event-card" v-for="event in events" :key="event.id">
          <div class="event-date">
            <div class="event-day">{{ getDay(event.fecha) }}</div>
            <div class="event-month">{{ getMonth(event.fecha) }}</div>
          </div>
          
          <div class="event-content">
            <h3>{{ event.titulo }}</h3>
            <p class="event-description">{{ event.descripcion }}</p>
            
            <div class="event-details">
              <span class="detail-item">
                <i>📅</i> {{ formatDate(event.fecha) }}
              </span>
              <span class="detail-item" v-if="event.hora">
                <i>🕒</i> {{ event.hora }}
              </span>
              <span class="detail-item" v-if="event.lugar">
                <i>📍</i> {{ event.lugar }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const events = ref([
  {
    id: 1,
    titulo: 'Junta de Vecinos',
    descripcion: 'Se tratarán temas relacionados al suministro de agua y mantenimiento de áreas comunes.',
    fecha: '2026-02-24',
    hora: '18:00 hrs',
    lugar: 'Salón Comunitario'
  },
  {
    id: 2,
    titulo: 'Limpieza General',
    descripcion: 'Jornada de limpieza en áreas verdes y calles principales de la colonia.',
    fecha: '2026-03-10',
    hora: '09:00 hrs',
    lugar: 'Punto de encuentro: Parque Central'
  },
  {
    id: 3,
    titulo: 'Asamblea Anual',
    descripcion: 'Revisión de estados financieros y plan de trabajo para el próximo año.',
    fecha: '2026-01-30',
    hora: '17:30 hrs',
    lugar: 'Auditorio de la Colonia'
  }
])

const getDay = (dateString) => {
  const date = new Date(dateString)
  return date.getDate()
}

const getMonth = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  console.log('EventsView cargado - modo informativo')
})
</script>

<style scoped>
.events-view {
  padding: 0;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 25px;
  text-align: center;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.event-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  border-left: 4px solid #4A90E2;
  transition: transform 0.3s, box-shadow 0.3s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.12);
}

.event-date {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  min-width: 70px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #e9ecef;
}

.event-day {
  font-size: 28px;
  font-weight: bold;
  color: #4A90E2;
  line-height: 1;
}

.event-month {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
  font-weight: 500;
}

.event-content {
  flex: 1;
}

.event-content h3 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.event-description {
  color: #555;
  line-height: 1.6;
  margin-bottom: 15px;
  font-size: 0.95rem;
}

.event-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 0.9rem;
}

.detail-item i {
  font-size: 1rem;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 768px) {
  .events-view {
    padding: 15px;
  }
  
  .event-card {
    flex-direction: column;
    gap: 15px;
  }
  
  .event-date {
    flex-direction: row;
    justify-content: center;
    gap: 15px;
    min-width: auto;
    padding: 10px;
  }
  
  .event-day {
    font-size: 24px;
  }
  
  .event-details {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
