

<template>
  <div class="pagos-container">
    <!-- Título -->
    <h1 class="page-title">Registrar Pagos</h1>

    <!-- Selector de Usuario -->
    <div class="card">
      <h3>Seleccionar Usuario</h3>
      <select v-model="selectedUser" @change="cargarPagos" class="form-control">
        <option value="">-- Elige un usuario --</option>
        <option v-for="user in usuarios" :key="user.id" :value="user.id">
          {{ user.nombre }} {{ user.apellidos || '' }}
        </option>
      </select>
    </div>

    <!-- Mostrar si hay usuario seleccionado -->
    <div v-if="selectedUser">
      <!-- Mensaje de carga -->
      <div v-if="cargando" class="card loading">
        <p>Cargando pagos...</p>
      </div>

      <!-- Si no hay pagos -->
      <div v-else-if="pagos.length === 0" class="card empty">
        <p>Este usuario no tiene pagos registrados</p>
      </div>

      <!-- Lista de pagos -->
      <div v-else class="card">
        <h3>Pagos de {{ nombreUsuario }}</h3>
        
        <!-- Totales -->
        <div class="totales">
          <div class="total-item">
            <span>Total Pagado:</span>
            <strong>${{ totalPagado }}</strong>
          </div>
          <div class="total-item">
            <span>Total Pendiente:</span>
            <strong>${{ totalPendiente }}</strong>
          </div>
        </div>

        <!-- Lista de conceptos -->
        <div class="conceptos">
          <div v-for="pago in pagos" :key="pago.id" class="concepto">
            <div class="concepto-header">
              <span class="concepto-nombre">{{ pago.nombre }}</span>
              <span class="badge" :class="pago.pendiente === 0 ? 'badge-success' : 'badge-warning'">
                {{ pago.pendiente === 0 ? 'Pagado' : 'Pendiente' }}
              </span>
            </div>
            
            <div class="concepto-detalles">
              <div>Total: ${{ pago.total }}</div>
              <div>Pagado: ${{ pago.pagado }}</div>
              <div class="pendiente">Pendiente: ${{ pago.pendiente }}</div>
            </div>

            <!-- Botón para pagar -->
            <button v-if="pago.pendiente > 0" 
                    @click="seleccionarConcepto(pago)"
                    class="btn-pagar">
              Pagar este concepto
            </button>
          </div>
        </div>
      </div>

      <!-- Formulario de pago -->
      <div v-if="conceptoSeleccionado" class="card form-pago">
        <h3>Registrar Pago</h3>
        <p><strong>Concepto:</strong> {{ conceptoSeleccionado.nombre }}</p>
        <p><strong>Pendiente:</strong> ${{ conceptoSeleccionado.pendiente }}</p>
        
        <div class="form-group">
          <label>Monto a pagar:</label>
          <input 
            type="number" 
            v-model="monto" 
            :max="conceptoSeleccionado.pendiente"
            min="1"
            step="0.01"
            class="form-control"
            placeholder="Ingrese el monto"
          />
        </div>

        <div class="botones">
          <button @click="registrarPago" 
                  :disabled="!monto || monto > conceptoSeleccionado.pendiente"
                  class="btn btn-primary">
            Confirmar Pago
          </button>
          <button @click="cancelarPago" class="btn btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Mensaje flotante -->
    <div v-if="mensaje" class="mensaje-flotante" :class="tipoMensaje">
      {{ mensaje }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// Estados
const usuarios = ref([])
const pagos = ref([])
const selectedUser = ref('')
const cargando = ref(false)
const mensaje = ref('')
const tipoMensaje = ref('exito')
const conceptoSeleccionado = ref(null)
const monto = ref(0)

// Computed
const nombreUsuario = computed(() => {
  const user = usuarios.value.find(u => u.id === selectedUser.value)
  return user ? `${user.nombre} ${user.apellidos || ''}` : ''
})

const totalPagado = computed(() => {
  return pagos.value.reduce((sum, p) => sum + p.pagado, 0).toFixed(2)
})

const totalPendiente = computed(() => {
  return pagos.value.reduce((sum, p) => sum + p.pendiente, 0).toFixed(2)
})

// Métodos
const cargarUsuarios = async () => {
  try {
    const { data } = await axios.get('/api/admin/usuarios')
    usuarios.value = data
  } catch (error) {
    mostrarMensaje('Error al cargar usuarios', 'error')
  }
}

const cargarPagos = async () => {
  if (!selectedUser.value) return
  
  cargando.value = true
  try {
    const { data } = await axios.get(`/api/admin/pagos/usuario/${selectedUser.value}`)
    pagos.value = data
  } catch (error) {
    mostrarMensaje('Error al cargar pagos', 'error')
  } finally {
    cargando.value = false
  }
}

const seleccionarConcepto = (pago) => {
  conceptoSeleccionado.value = pago
  monto.value = pago.pendiente // Sugerir el monto pendiente
}

const cancelarPago = () => {
  conceptoSeleccionado.value = null
  monto.value = 0
}

const registrarPago = async () => {
  if (!monto.value || monto.value <= 0) {
    mostrarMensaje('Ingrese un monto válido', 'error')
    return
  }

  if (monto.value > conceptoSeleccionado.value.pendiente) {
    mostrarMensaje('El monto supera lo pendiente', 'error')
    return
  }

  try {
    await axios.post('/api/admin/pagos/registrar', {
      usuario_id: selectedUser.value,
      concepto_id: conceptoSeleccionado.value.id,
      monto: monto.value
    })

    mostrarMensaje('Pago registrado con éxito', 'exito')
    cancelarPago()
    await cargarPagos() // Recargar la lista
  } catch (error) {
    mostrarMensaje('Error al registrar el pago', 'error')
  }
}

const mostrarMensaje = (texto, tipo) => {
  mensaje.value = texto
  tipoMensaje.value = tipo
  setTimeout(() => {
    mensaje.value = ''
  }, 3000)
}

onMounted(cargarUsuarios)
</script>

<style scoped>
.pagos-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

.page-title {
  font-size: 1.5rem;
  color: #0f172a;
  margin-bottom: 20px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

.card h3 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #2563eb;
}

.totales {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.total-item {
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
}

.total-item span {
  display: block;
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 4px;
}

.conceptos {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.concepto {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

.concepto-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.concepto-nombre {
  font-weight: 600;
  color: #0f172a;
}

.badge {
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-success {
  background: #16a34a;
  color: white;
}

.badge-warning {
  background: #f59e0b;
  color: white;
}

.concepto-detalles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.concepto-detalles .pendiente {
  color: #dc2626;
  font-weight: 600;
}

.btn-pagar {
  width: 100%;
  padding: 10px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.form-pago {
  background: #f0f9ff;
  border-color: #2563eb;
}

.form-group {
  margin: 16px 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.botones {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e8f0;
  color: #334155;
}

.mensaje-flotante {
  position: fixed;
  bottom: 90px;
  left: 16px;
  right: 16px;
  padding: 14px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  text-align: center;
  font-weight: 500;
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

.mensaje-flotante.exito {
  background: #f0fdf4;
  color: #166534;
  border-left: 4px solid #16a34a;
}

.mensaje-flotante.error {
  background: #fef2f2;
  color: #991b1b;
  border-left: 4px solid #dc2626;
}

.loading, .empty {
  text-align: center;
  color: #64748b;
  padding: 40px 20px;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Tablet */
@media (min-width: 768px) {
  .pagos-container {
    padding: 24px;
  }

  .mensaje-flotante {
    left: auto;
    right: 24px;
    max-width: 400px;
  }
}
</style>