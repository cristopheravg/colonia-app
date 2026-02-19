<template>
  <div class="container">
    <h1 class="title">Vecinos</h1>

    <!-- Usuarios -->
    <div class="usuarios-list">
      <div
        v-for="user in usuarios"
        :key="user.id"
        @click="abrirModalPago(user)"
        class="usuario-card"
      >
        <div>
          <h3>{{ user.nombre }} {{ user.apellidos }}</h3>
          <p>Vecino #{{ user.numero_vecino }}</p>
        </div>
        <span class="arrow">›</span>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modalVisible" class="modal-overlay">
      <div class="modal">

        <div class="modal-header">
          <h2>{{ selectedUser.nombre }} {{ selectedUser.apellidos }}</h2>
          <button @click="cerrarModal">✕</button>
        </div>

        <div v-if="cargando" class="loading">Cargando...</div>

        <div v-else>
          <!-- Balance -->
          <h3 class="section-title">Balance</h3>

          <div class="balance-list">
            <div v-for="pago in pagos" :key="pago.id" class="balance-card">

              <div class="balance-top">
                <h4>{{ pago.nombre }}</h4>
                <span
                  :class="Number(pago.pendiente) === 0 ? 'badge-ok' : 'badge-pending'"
                >
                  {{ Number(pago.pendiente) === 0 ? 'Pagado' : 'Pendiente' }}
                </span>
              </div>

              <div class="progress">
                <div
                  class="progress-bar"
                  :style="{
                    width:
                      ((pago.parcialidades?.length || 0) /
                        (pago.tipo === 'unico' ? 1 : pago.mensualidades)) *
                        100 + '%'
                  }"
                ></div>
              </div>

              <div class="balance-info">
                <small>Pagado: ${{ pago.pagado }}</small>
                <small>Restante: ${{ pago.pendiente }}</small>
              </div>

              <div class="balance-info">
                <small>
                  Pagos:
                  {{ pago.parcialidades?.length || 0 }}/
                  {{ pago.tipo === 'unico' ? 1 : pago.mensualidades }}
                </small>
              </div>
            </div>
          </div>

          <!-- Formulario -->
          <h3 class="section-title">Registrar pago</h3>

          <form @submit.prevent="registrarPago" class="form">

            <select v-model="conceptoSeleccionado">
              <option
                v-for="pago in pagos"
                :key="pago.id"
                :value="pago"
              >
                {{ pago.nombre }} - Restante: {{ pago.pendiente }}
              </option>
            </select>

            <input
              type="number"
              v-model.number="monto"
              placeholder="Monto"
            />

            <select v-model="metodo_pago">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>

            <input
              type="text"
              v-model="referencia"
              placeholder="Referencia (opcional)"
            />

            <button :disabled="!montoValido" class="btn">
              Registrar pago
            </button>
          </form>
        </div>
      </div>
    </div>

    <div v-if="mensaje" :class="['alert', tipoMensaje]">{{ mensaje }}</div>
  </div>
</template>



<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'

const token = localStorage.getItem('colonia_token')

const api = axios.create({
  baseURL: '/api',
  headers: { Authorization: `Bearer ${token}` }
})

// Estados
const usuarios = ref([])
const selectedUser = ref(null)
const pagos = ref([])
const conceptoSeleccionado = ref(null)
const monto = ref(0)
const metodo_pago = ref('efectivo')
const referencia = ref('')
const cargando = ref(false)
const mensaje = ref('')
const tipoMensaje = ref('success')
const modalVisible = ref(false)

// Computed: validar monto
const montoValido = computed(() => {
  if (!conceptoSeleccionado.value) return false
  const pendiente = Number(conceptoSeleccionado.value.pendiente)
  const total = Number(conceptoSeleccionado.value.total)
  const montoNum = Number(monto.value)

  // Pago único
  if (conceptoSeleccionado.value.tipo === 'unico') {
    return montoNum === total
  }

  // Última parcialidad
  if (esUltimaParcialidad(conceptoSeleccionado.value)) {
    return montoNum === pendiente
  }

  // Parcialidades normales
  return montoNum > 0 && montoNum <= pendiente
})

// Función para determinar si es última parcialidad
const esUltimaParcialidad = (concepto) => {
  if (!concepto) return false
  const pagados = concepto.parcialidades ? concepto.parcialidades.length : 0
  const mensualidades = concepto.tipo === 'unico' ? 1 : concepto.mensualidades
  return pagados + 1 === mensualidades
}

// Watch: autocompletar monto al seleccionar concepto
watch(conceptoSeleccionado, (nuevo) => {
  if (!nuevo) return
  const pendiente = Number(nuevo.pendiente)
  const total = Number(nuevo.total)

  if (nuevo.tipo === 'unico' || esUltimaParcialidad(nuevo)) {
    monto.value = pendiente
  } else {
    monto.value = 0
  }
})

// Cargar usuarios
const cargarUsuarios = async () => {
  try {
    const res = await api.get('/usuarios')
    if (res.data.success && Array.isArray(res.data.data)) {
      usuarios.value = res.data.data.filter(u => u.rol !== 'admin' && (u.activo === 1 || u.activo === '1'))
    } else {
      usuarios.value = []
      mostrarMensaje('Formato de usuarios inválido', 'error')
    }
  } catch (error) {
    console.error('Error al cargar usuarios', error)
    mostrarMensaje('Error al cargar usuarios: ' + (error.response?.data?.message || error.message), 'error')
    usuarios.value = []
  }
}

// Abrir modal y cargar pagos
const abrirModalPago = async (user) => {
  selectedUser.value = user
  modalVisible.value = true
  cargando.value = true
  pagos.value = []
  conceptoSeleccionado.value = null
  monto.value = 0
  metodo_pago.value = 'efectivo'
  referencia.value = ''

  try {
    const res = await api.get(`/pagos/usuario/${user.id}`)
    if (Array.isArray(res.data)) {
      pagos.value = res.data
    } else if (res.data && res.data.success && Array.isArray(res.data.data)) {
      pagos.value = res.data.data
    } else {
      pagos.value = []
      mostrarMensaje('No se encontraron pagos para este usuario', 'info')
    }

    // Seleccionar primer concepto pendiente
    const primerPendiente = pagos.value.find(p => Number(p.pendiente) > 0)
    if (primerPendiente) conceptoSeleccionado.value = primerPendiente

  } catch (error) {
    console.error('Error al cargar pagos', error)
    mostrarMensaje('Error al cargar pagos', 'error')
    pagos.value = []
  } finally {
    cargando.value = false
  }
}

// Cerrar modal
const cerrarModal = () => {
  modalVisible.value = false
  selectedUser.value = null
  pagos.value = []
  conceptoSeleccionado.value = null
  monto.value = 0
  metodo_pago.value = 'efectivo'
  referencia.value = ''
}

// Registrar pago
const registrarPago = async () => {
  if (!conceptoSeleccionado.value) {
    mostrarMensaje('Seleccione un concepto antes de registrar el pago', 'error')
    return
  }
  if (!montoValido.value) {
    mostrarMensaje('Ingrese un monto válido', 'error')
    return
  }

  cargando.value = true
  try {
    await api.post('/pagos/registrar', {
      usuario_id: selectedUser.value.id,
      concepto_id: conceptoSeleccionado.value.id,
      monto: monto.value,
      metodo_pago: metodo_pago.value,
      referencia: referencia.value || null
    })

    mostrarMensaje('Pago registrado con éxito', 'success')

    // Recargar pagos
    await abrirModalPago(selectedUser.value)

    // Seleccionar automáticamente primer concepto pendiente
    const primerPendiente = pagos.value.find(p => Number(p.pendiente) > 0)
    conceptoSeleccionado.value = primerPendiente || null
    monto.value = 0
    metodo_pago.value = 'efectivo'
    referencia.value = ''

  } catch (error) {
    console.error('Error al registrar pago', error)
    mostrarMensaje(error.response?.data?.message || 'Error al registrar pago', 'error')
  } finally {
    cargando.value = false
  }
}

// Mensajes
const mostrarMensaje = (texto, tipo) => {
  mensaje.value = texto
  tipoMensaje.value = tipo
  setTimeout(() => {
    mensaje.value = ''
  }, 5000)
}

onMounted(cargarUsuarios)
</script>



<style scoped>


.container {
  padding: 1rem;
  max-width: 600px;
  margin: auto;
  margin-bottom:300px;

}

.title {
  text-align: center;
  margin-bottom: 1rem;
}

/* Usuarios */
.usuario-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: 0.2s;
}

.usuario-card:hover {
  transform: scale(1.02);
}

.arrow {
  font-size: 1.5rem;
  color: #999;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  
}

.modal {
  background: white;
  width: 95%;
  max-width: 550px;
  border-radius: 16px;
  padding: 1rem;
  max-height: 85vh;
  overflow: auto;
  padding-bottom: 100px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Balance */
.balance-card {
  background: #f7f9fc;
  padding: 0.8rem;
  border-radius: 10px;
  margin-bottom: 0.7rem;
}

.balance-top {
  display: flex;
  justify-content: space-between;
}

.badge-ok {
  background: #d4edda;
  color: #155724;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
}

.badge-pending {
  background: #fff3cd;
  color: #856404;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
}

.progress {
  background: #e6e6e6;
  border-radius: 10px;
  height: 6px;
  margin: 6px 0;
}

.progress-bar {
  background: #007bff;
  height: 6px;
  border-radius: 10px;
}

/* Info */
.balance-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

select, input {
  padding: 0.7rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.btn {
  background: #007bff;
  color: white;
  padding: 0.9rem;
  border: none;
  border-radius: 10px;
  font-weight: bold;
}

.btn:disabled {
  background: #ccc;
}

/* Alerts */
.alert {
  margin-top: 1rem;
  padding: 0.6rem;
  border-radius: 8px;
  text-align: center;
}

.alert.success { background: #d4edda; }
.alert.error { background: #f8d7da; }
.alert.info { background: #d1ecf1; }
</style>


