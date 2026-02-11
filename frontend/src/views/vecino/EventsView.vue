<template>
  <AppLayout>
    <section class="events-view">
        <h1 class="page-title">Eventos de la colonia</h1>


      <div class="events-list">
        <article
          class="event-card"
          v-for="event in events"
          :key="event.id"
        >
          <div class="event-date">
            <span class="event-day">{{ getDay(event.fecha) }}</span>
            <span class="event-month">{{ getMonth(event.fecha) }}</span>
          </div>

          <div class="event-content">
            <h3 class="event-title">{{ event.titulo }}</h3>
            <p class="event-description">{{ event.descripcion }}</p>

            <div class="event-details">
              <span class="detail-item">
                📅 {{ formatDate(event.fecha) }}
              </span>
              <span class="detail-item" v-if="event.hora">
                🕒 {{ event.hora }}
              </span>
              <span class="detail-item" v-if="event.lugar">
                📍 {{ event.lugar }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const events = ref([
  {
    id: 1,
    titulo: 'Junta de Vecinos',
    descripcion:
      'Se tratarán temas relacionados al suministro de agua y mantenimiento de áreas comunes.',
    fecha: '2026-02-24',
    hora: '18:00 hrs',
    lugar: 'Salón Comunitario'
  },
  {
    id: 2,
    titulo: 'Limpieza General',
    descripcion:
      'Jornada de limpieza en áreas verdes y calles principales de la colonia.',
    fecha: '2026-03-10',
    hora: '09:00 hrs',
    lugar: 'Parque Central'
  },
  {
    id: 3,
    titulo: 'Asamblea Anual',
    descripcion:
      'Revisión de estados financieros y plan de trabajo para el próximo año.',
    fecha: '2026-01-30',
    hora: '17:30 hrs',
    lugar: 'Auditorio de la Colonia'
  }
])

const getDay = d => new Date(d).getDate()
const getMonth = d =>
  new Date(d)
    .toLocaleDateString('es-MX', { month: 'short' })
    .toUpperCase()

const formatDate = d =>
  new Date(d).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
</script>

<style scoped>
/* ===== CONTENEDOR ===== */

.page-title {
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin-bottom: 28px;
  margin-top: 15px;
}


.events-view {
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
/* ===== LISTA ===== */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
}

/* ===== CARD ===== */
.event-card {

  width: 100%;
  display: flex;
  gap: 16px;
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #2563eb;
}

/* ===== FECHA ===== */
.event-date {
  flex-shrink: 0;
  width: 72px;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.event-day {
  font-size: 1.6rem;
  font-weight: 700;
  color: #2563eb;
  line-height: 1;
}

.event-month {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-top: 4px;
}

/* ===== CONTENIDO ===== */
.event-content {
  flex: 1;
  min-width: 0;
}

.event-title {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.event-description {
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 12px;
}

/* ===== DETALLES ===== */
.event-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
}

.detail-item {
  font-size: 0.85rem;
  color: #6b7280;
  white-space: nowrap;
}

/* ===== MOBILE ===== */
@media (max-width: 768px) {
  .event-card {
    flex-direction: column;
  }

  .events-view {
    padding-left: 15px;
    padding-right: 15px;
  }

  .event-card {
    flex-direction: column;
  }

  .event-date {
    width: 100%;
    flex-direction: row;
    gap: 12px;
    justify-content: center;
  }

  .event-details {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
