<template>
  <div>

    <!-- Header -->
    <div class="header-row">
      <h2>Conceptos de Pago</h2>
      <button class="primary-btn" @click="abrirModal">
        Nuevo Concepto
      </button>
    </div>

    <!-- Lista -->
    <div 
      class="concept-card" 
      v-for="c in conceptosOrdenados" 
      :key="c.id"
    >
      <div>
        <h3>{{ c.nombre }}</h3>
        <p>
          Tipo: {{ c.tipo }} |
          Total: ${{ c.total }} |
          Mensualidades: {{ c.mensualidades }}
        </p>
      </div>

      <div class="actions">
        <button @click="editarConcepto(c)">Editar</button>
        <button @click="toggleActivo(c)">
          {{ c.activo ? 'Desactivar' : 'Activar' }}
        </button>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal">

        <h3>{{ modoEdicion ? 'Editar Concepto' : 'Nuevo Concepto' }}</h3>

        <form @submit.prevent="guardarConcepto">

        <!-- Nombre -->
        <div class="field">
            <label>Nombre del concepto</label>
            <input 
            v-model="form.nombre" 
            placeholder="Ej: Mantenimiento Enero 2026" 
            required 
            />
            <small>Nombre que verán los vecinos en su estado de cuenta.</small>
        </div>

        <!-- Tipo -->
        <div class="field">
            <label>Tipo de pago</label>
            <select v-model="form.tipo">
            <option value="unico">Pago Único</option>
            <option value="parcial">Pago en Mensualidades</option>
            </select>
            <small>
            Pago único = se liquida completo una sola vez.  
            Mensual = se divide en varias parcialidades.
            </small>
        </div>

        <!-- Total -->
        <div class="field">
            <label>Monto total</label>
            <input 
            type="number"
            v-model.number="form.total" 
            placeholder="Ej: 1200"
            required
            />
            <small>Total que deberá cubrir el vecino.</small>
        </div>

        <!-- Mensualidades -->
        <div class="field" v-if="form.tipo === 'parcial'">
            <label>Número de mensualidades</label>
            <input 
            type="number"
            v-model.number="form.mensualidades" 
            placeholder="Ej: 6"
            />
            <small>
            Número de pagos en los que se dividirá el monto total.
            </small>
        </div>

        <div class="modal-actions">
            <button type="button" @click="cerrarModal">
            Cancelar
            </button>
            <button type="submit" class="primary-btn">
            Guardar
            </button>
        </div>

        </form>


      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const token = localStorage.getItem('colonia_token')

const api = axios.create({
  baseURL: 'http://54.227.139.118:3000/api',
  headers: {
    Authorization: `Bearer ${token}`
  }
})

const conceptos = ref([])

const conceptosOrdenados = computed(() => {
  return [...conceptos.value].sort((a, b) => {

    // primero activos
    if (a.activo !== b.activo) {
      return b.activo - a.activo
    }

    // luego más recientes
    return new Date(b.created_at) - new Date(a.created_at)

  })
})


const mostrarModal = ref(false)
const modoEdicion = ref(false)

const form = ref({
  id: null,
  nombre: '',
  tipo: 'unico',
  total: 0,
  mensualidades: 1
})

/* ✅ ESTA FUNCIÓN FALTABA */
const cargarConceptos = async () => {
  try {
    const response = await api.get('/conceptos')
    conceptos.value = response.data
  } catch (error) {
    console.error('Error cargando conceptos:', error)
  }
}

const resetForm = () => {
  form.value = {
    id: null,
    nombre: '',
    tipo: 'unico',
    total: 0,
    mensualidades: 1
  }
  modoEdicion.value = false
}

const editarConcepto = (concepto) => {
  form.value = { ...concepto }
  modoEdicion.value = true
  mostrarModal.value = true
}

const guardarConcepto = async () => {
  try {
    // Validación mínima antes de enviar
    if (!form.value.nombre || !form.value.tipo || !form.value.total) {
      alert('Faltan campos obligatorios')
      return
    }

    let response
    if (modoEdicion.value) {
      response = await api.put(`/conceptos/${form.value.id}`, form.value)
      alert(response.data.message || 'Concepto actualizado')
    } else {
      response = await api.post('/conceptos', form.value)
      alert(response.data.message || 'Concepto creado')
    }

    // Refrescar lista y cerrar modal
    await cargarConceptos()
    resetForm()
    mostrarModal.value = false

  } catch (error) {
    console.error('Error guardando concepto:', error.response?.data || error)
    alert(error.response?.data?.message || 'Error al guardar concepto')
  }
}


const toggleActivo = async (concepto) => {
  try {
    await api.patch(`/conceptos/${concepto.id}/estado`)
    await cargarConceptos()
  } catch (error) {
    console.error('Error cambiando estado:', error)
  }
}

const cerrarModal = () => {
  resetForm()         // Reinicia el formulario
  mostrarModal.value = false  // Cierra el modal
}

const abrirModal = () => {
  resetForm()         // Limpia el formulario y pone modoEdicion en false
  mostrarModal.value = true  // Abre el modal
}


/* ✅ ahora sí existe */
onMounted(cargarConceptos)

</script>



<style scoped>

.header-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.primary-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.concept-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(15,23,42,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions button {
  margin-left: 8px;
}

/* MODAL */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 14px;
  width: 400px;
  max-width: 90%;
}

.modal input,
.modal select {
  width: 100%;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.field {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #0f172a;
}

.field small {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.3;
}


</style>
