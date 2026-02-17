<template>
  <div class="pagos-view">
    <!-- Header de la vista -->
    <div class="view-header">
      <h2 class="view-title">💰 Registrar Pago</h2>
      <p class="view-subtitle">Selecciona un usuario y registra sus pagos</p>
    </div>

    <!-- Selector de Usuario -->
    <section class="section-card">
      <div class="section-header">
        <span class="section-icon">👤</span>
        <h3>Seleccionar Usuario</h3>
      </div>
      
      <div class="form-group">
        <select v-model="selectedUser" @change="onUserChange" class="form-select">
          <option value="">-- Seleccione un usuario --</option>
          <option v-for="u in usuarios" :key="u.id" :value="u.id">
            {{ u.nombre }} {{ u.apellidos || '' }}
          </option>
        </select>
      </div>
    </section>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando información...</p>
    </div>

    <!-- Resumen de Pagos -->
    <section v-if="selectedUser && pagosUsuario.length > 0 && !loading" class="section-card">
      <div class="section-header">
        <span class="section-icon">📊</span>
        <h3>Resumen de Pagos</h3>
      </div>
      
      <!-- Totales Rápidos -->
      <div class="totales-grid">
        <div class="total-badge pendiente">
          <span class="total-label">Pendiente</span>
          <span class="total-value">${{ totalPendiente }}</span>
        </div>
        <div class="total-badge pagado">
          <span class="total-label">Pagado</span>
          <span class="total-value">${{ totalPagado }}</span>
        </div>
      </div>

      <!-- Lista de Conceptos -->
      <div class="conceptos-list">
        <div 
          v-for="concepto in pagosUsuario" 
          :key="concepto.id" 
          class="concepto-item"
          :class="{ 'concepto-seleccionado': selectedConcept === concepto.id }"
          @click="selectedConcept = concepto.id"
        >
          <div class="concepto-header">
            <span class="concepto-nombre">{{ concepto.nombre }}</span>
            <span class="estado-badge" :class="concepto.pendiente === 0 ? 'estado-completado' : 'estado-pendiente'">
              {{ concepto.pendiente === 0 ? 'Pagado' : 'Pendiente' }}
            </span>
          </div>

          <div class="concepto-stats">
            <div class="stat">
              <span class="stat-label">Total</span>
              <span class="stat-value">${{ concepto.total }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Pagado</span>
              <span class="stat-value">${{ concepto.pagado }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Pendiente</span>
              <span class="stat-value pendiente">${{ concepto.pendiente }}</span>
            </div>
          </div>

          <!-- Barra de progreso -->
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: (concepto.pagado / concepto.total * 100) + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ Math.round(concepto.pagado / concepto.total * 100) }}%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Estado sin conceptos -->
    <section v-else-if="selectedUser && pagosUsuario.length === 0 && !loading" class="section-card empty-state">
      <span class="empty-icon">📭</span>
      <p class="empty-text">Este usuario no tiene conceptos de pago registrados</p>
    </section>

    <!-- Formulario de Pago -->
    <section v-if="selectedUser && conceptosDisponibles.length && !loading" class="section-card">
      <div class="section-header">
        <span class="section-icon">💳</span>
        <h3>Registrar Pago</h3>
      </div>

      <!-- Selector de Concepto -->
      <div class="form-group">
        <label class="form-label">Concepto a pagar</label>
        <select v-model="selectedConcept" class="form-select">
          <option value="">-- Seleccione concepto --</option>
          <option v-for="c in conceptosDisponibles" :key="c.id" :value="c.id">
            {{ c.nombre }} - ${{ c.pendiente }} pendiente
          </option>
        </select>
      </div>

      <!-- Detalle del Concepto Seleccionado -->
      <div v-if="conceptoSeleccionado" class="detalle-concepto">
        <div class="detalle-row">
          <span>Total del concepto:</span>
          <strong>${{ conceptoSeleccionado.total }}</strong>
        </div>
        <div class="detalle-row">
          <span>Ya pagado:</span>
          <strong>${{ conceptoSeleccionado.pagado }}</strong>
        </div>
        <div class="detalle-row destacado">
          <span>Pendiente:</span>
          <strong class="texto-pendiente">${{ conceptoSeleccionado.pendiente }}</strong>
        </div>
      </div>

      <!-- Campo de Monto -->
      <div class="form-group">
        <label class="form-label">Monto a pagar</label>
        <div class="monto-input-wrapper">
          <span class="moneda-simbolo">$</span>
          <input 
            type="number" 
            v-model.number="monto" 
            :max="conceptoSeleccionado?.pendiente"
            min="1"
            step="0.01"
            class="form-input monto-input"
            placeholder="0.00"
          />
        </div>
        <small class="input-hint" v-if="conceptoSeleccionado">
          Máximo: ${{ conceptoSeleccionado.pendiente }}
        </small>
      </div>

      <!-- Botones de Acción -->
      <div class="action-buttons">
        <button 
          @click="registrarPago"
          class="btn btn-primary"
          :disabled="!puedeRegistrar"
        >
          <span class="btn-icon">✓</span>
          Registrar Pago
        </button>
        <button 
          v-if="selectedConcept || monto"
          @click="resetFormulario"
          class="btn btn-secondary"
        >
          <span class="btn-icon">↺</span>
          Limpiar
        </button>
      </div>
    </section>

    <!-- Mensaje Toast -->
    <transition name="toast">
      <div v-if="mensaje" class="toast" :class="toastClass">
        <span class="toast-icon">{{ exito ? '✅' : '❌' }}</span>
        <span>{{ mensaje }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// Estado
const usuarios = ref([])
const pagosUsuario = ref([])
const selectedUser = ref('')
const selectedConcept = ref('')
const monto = ref(0)
const mensaje = ref('')
const exito = ref(true)
const loading = ref(false)

// Computed
const conceptosDisponibles = computed(() =>
  pagosUsuario.value.filter(c => c.pendiente > 0)
)

const conceptoSeleccionado = computed(() =>
  conceptosDisponibles.value.find(c => c.id === selectedConcept.value)
)

const totalPendiente = computed(() => {
  return pagosUsuario.value.reduce((sum, c) => sum + c.pendiente, 0).toFixed(2)
})

const totalPagado = computed(() => {
  return pagosUsuario.value.reduce((sum, c) => sum + c.pagado, 0).toFixed(2)
})

const puedeRegistrar = computed(() => {
  return selectedUser.value && 
         selectedConcept.value && 
         monto.value > 0 && 
         monto.value <= conceptoSeleccionado.value?.pendiente
})

const toastClass = computed(() => exito.value ? 'toast-success' : 'toast-error')

// Métodos
const loadUsuarios = async () => {
  try {
    const res = await axios.get('/api/admin/usuarios')
    usuarios.value = res.data
  } catch (e) {
    console.error('Error cargando usuarios:', e)
    showMessage('Error cargando usuarios', false)
  }
}

const onUserChange = async () => {
  resetFormulario()
  pagosUsuario.value = []

  if (!selectedUser.value) return

  loading.value = true
  try {
    const res = await axios.get(`/api/admin/pagos/usuario/${selectedUser.value}`)
    pagosUsuario.value = res.data
  } catch (e) {
    console.error('Error cargando pagos:', e)
    showMessage('Error cargando información', false)
  } finally {
    loading.value = false
  }
}

const resetFormulario = () => {
  selectedConcept.value = ''
  monto.value = 0
}

const showMessage = (text, isSuccess) => {
  mensaje.value = text
  exito.value = isSuccess
  setTimeout(() => {
    mensaje.value = ''
  }, 3000)
}

const registrarPago = async () => {
  try {
    await axios.post('/api/admin/pagos/registrar', {
      usuario_id: selectedUser.value,
      concepto_id: selectedConcept.value,
      monto: monto.value
    })

    showMessage('¡Pago registrado exitosamente!', true)
    
    // Recargar datos
    await onUserChange()
    resetFormulario()
    
  } catch (e) {
    console.error('Error registrando pago:', e)
    showMessage('Error al registrar el pago', false)
  }
}

onMounted(loadUsuarios)
</script>

<style scoped>
.pagos-view {
  max-width: 100%;
  margin: 0 auto;
}

/* Header de la vista */
.view-header {
  margin-bottom: 20px;
}

.view-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.02em;
}

.view-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

/* Cards sección */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.section-icon {
  font-size: 1.2rem;
}

/* Formulario */
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
}

.form-select, .form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s;
  font-family: inherit;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 44px;
}

.form-select:focus, .form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Input de monto */
.monto-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.moneda-simbolo {
  font-size: 1.2rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
}

.monto-input {
  flex: 1;
}

.input-hint {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 6px;
}

/* Totales rápidos */
.totales-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.total-badge {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  border: 1.5px solid #e2e8f0;
}

.total-badge.pendiente {
  border-color: #fee2e2;
  background: #fef2f2;
}

.total-badge.pagado {
  border-color: #dcfce7;
  background: #f0fdf4;
}

.total-label {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 4px;
}

.total-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
}

.pendiente .total-value {
  color: #dc2626;
}

.pagado .total-value {
  color: #16a34a;
}

/* Lista de conceptos */
.conceptos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.concepto-item {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  transition: all 0.2s;
  cursor: pointer;
}

.concepto-item:active {
  transform: scale(0.99);
}

.concepto-seleccionado {
  border-color: #2563eb;
  background: #eff6ff;
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
  font-size: 1rem;
}

.estado-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.estado-completado {
  background: #16a34a;
  color: white;
}

.estado-pendiente {
  background: #f59e0b;
  color: white;
}

.concepto-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.7rem;
  color: #64748b;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.stat-value.pendiente {
  color: #dc2626;
}

/* Barra de progreso */
.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #2563eb;
  min-width: 40px;
  text-align: right;
}

/* Detalle del concepto seleccionado */
.detalle-concepto {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  border: 1.5px solid #e2e8f0;
}

.detalle-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #334155;
}

.detalle-row.destacado {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1.5px solid #e2e8f0;
}

.texto-pendiente {
  color: #dc2626;
  font-size: 1rem;
}

/* Botones */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  pointer-events: none;
}

.btn-primary {
  background: #2563eb;
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-primary:active:not(:disabled) {
  background: #1d4ed8;
}

.btn-secondary {
  background: #f1f5f9;
  color: #334155;
  border: 1.5px solid #e2e8f0;
}

.btn-icon {
  font-size: 1.1rem;
}

/* Estados de carga */
.loading-state {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 90px;
  left: 16px;
  right: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  font-weight: 500;
  border-left: 4px solid;
  animation: slideUp 0.3s ease;
}

.toast-success {
  border-left-color: #10b981;
  background: #f0fdf4;
  color: #065f46;
}

.toast-error {
  border-left-color: #ef4444;
  background: #fef2f2;
  color: #991b1b;
}

.toast-icon {
  font-size: 1.2rem;
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

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Tablet */
@media (min-width: 768px) {
  .pagos-view {
    padding: 0;
  }

  .action-buttons {
    flex-direction: row;
  }

  .btn {
    width: auto;
    min-width: 200px;
  }

  .toast {
    left: auto;
    right: 24px;
    bottom: 90px;
    max-width: 400px;
  }

  .concepto-item:hover {
    border-color: #94a3b8;
  }

  .concepto-seleccionado:hover {
    border-color: #2563eb;
  }
}
</style>