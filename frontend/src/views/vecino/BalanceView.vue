<template>
  <AppLayout>
    <section class="balance-view">
      <!-- Header uniforme y limpio -->
      <div class="view-header" :class="{ 'header-scrolled': isScrolled }">
        <div class="header-content">
          <h1 class="page-title">Mi estado de cuenta</h1>
        </div>
      </div>

      <!-- Botón de refresh debajo del header -->
      <div class="refresh-section">
        <button class="refresh-btn" @click="refreshBalance" :disabled="loading">
          <span class="btn-icon" :class="{ 'spinning': loading }">🔄</span>
          <span class="btn-text">Actualizar</span>
        </button>
        <span class="update-badge">Actualizado: {{ lastUpdate }}</span>
      </div>

      <!-- Contenedor principal con scroll -->
      <div 
        class="balance-container"
        ref="scrollContainer"
        @scroll="handleScroll"
      >
        <!-- Loading State - siempre visible mientras carga -->
        <div class="loading-state" v-if="loading">
          <div class="spinner"></div>
          <p>Cargando estado de cuenta...</p>
        </div>

        <!-- Datos cargados -->
        <template v-else-if="dataLoaded">
          <!-- Resumen General - Cards una sobre otra -->
          <div class="summary-section">
            <!-- Tarjeta de Total Pagado -->
            <div class="summary-card total-pagado">
              <div class="card-icon">
                <span class="emoji-icon">✅</span>
              </div>
              <div class="card-content">
                <span class="card-label">Total Pagado</span>
                <span class="card-amount">${{ formatCurrency(summary.totalPagado || 0) }}</span>
                <span class="card-trend positive">al corriente</span>
              </div>
            </div>
            
            <!-- Tarjeta de Saldo Pendiente -->
            <div class="summary-card saldo-pendiente">
              <div class="card-icon">
                <span class="emoji-icon">⏳</span>
              </div>
              <div class="card-content">
                <span class="card-label">Saldo Pendiente</span>
                <span class="card-amount">${{ formatCurrency(summary.totalPendiente || 0) }}</span>
                <span class="card-trend pending">por pagar</span>
              </div>
            </div>
          </div>

          <!-- Detalle por Concepto -->
          <div class="concepts-section" v-if="detalleOrdenado?.length">
            <div class="section-header">
              <h2>Detalle por Concepto</h2>
              <span class="concept-count">{{ detalleOrdenado.length }} conceptos</span>
            </div>
            
            <div class="concepts-list">
              <transition-group name="list" tag="div" class="concepts-grid">
                <div 
                  class="concept-card" 
                  v-for="(item, index) in detalleOrdenado" 
                  :key="index"
                  :style="{ animationDelay: `${index * 0.05}s` }"
                >
                  <div class="card-header">
                    <div class="header-left">
                      <div class="concept-icon" :class="getStatusClass(item)">
                        {{ getConceptIcon(item) }}
                      </div>
                      <h3>{{ item.concepto || 'Concepto sin nombre' }}</h3>
                    </div>
                    <span class="concept-status" :class="getStatusClass(item)">
                      {{ getStatusText(item) }}
                    </span>
                  </div>
                  
                  <div class="card-body">
                    <div class="amount-row">
                      <span>Total del concepto</span>
                      <span class="amount-value">${{ formatCurrency(item.total_concepto || 0) }}</span>
                    </div>
                    
                    <div class="amount-row paid">
                      <span>Pagado</span>
                      <span class="amount-value">${{ formatCurrency(item.total_pagado || 0) }}</span>
                    </div>
                    
                    <div class="amount-row pending">
                      <span>Saldo pendiente</span>
                      <span class="amount-value">${{ formatCurrency(item.saldo_pendiente || 0) }}</span>
                    </div>
                    
                    <!-- Barra de progreso mejorada -->
                    <div class="progress-container">
                      <div class="progress-bar">
                        <div 
                          class="progress-fill" 
                          :style="{ width: getProgress(item) + '%' }"
                          :class="getProgressClass(item)"
                        ></div>
                      </div>
                      <div class="progress-stats">
                        <span class="progress-percentage">{{ getProgress(item) }}% completado</span>
                        <span class="payments-count" v-if="item.pagos_realizados > 0">
                          {{ item.pagos_realizados }} {{ item.pagos_realizados === 1 ? 'pago' : 'pagos' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Chevron indicador (opcional) -->
                  <div class="card-chevron">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                </div>
              </transition-group>
            </div>
          </div>
          
          <!-- Empty State mejorado -->
          <div class="empty-state" v-else>
            <div class="empty-icon">📊</div>
            <h3>No hay conceptos de pago activos</h3>
            <p>Actualmente no tienes conceptos de pago asignados.</p>
            <button class="btn-refresh" @click="refreshBalance">
              <span>🔄</span> Actualizar
            </button>
          </div>
        </template>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { balanceService } from '@/services/balanceService'
import { useAuthStore } from '@/stores/auth'

// Stores
const authStore = useAuthStore()

// Estados
const loading = ref(true)
const dataLoaded = ref(false)
const isScrolled = ref(false)
const scrollContainer = ref(null)
const balance = ref({
  detalle: [],
  resumen: {}
})
const lastUpdateTime = ref(new Date())

// Scroll handler para efecto del header
const handleScroll = () => {
  const container = scrollContainer.value
  if (!container) return
  isScrolled.value = container.scrollTop > 20
}

// resumen seguro
const summary = computed(() => balance.value.resumen || {})

// ordenar conceptos
const detalleOrdenado = computed(() => {
  if (!balance.value.detalle) return []
  return [...balance.value.detalle].sort((a, b) => {
    const saldoA = parseFloat(a.saldo_pendiente || 0)
    const saldoB = parseFloat(b.saldo_pendiente || 0)
    const totalA = parseFloat(a.total_concepto || 0)
    const totalB = parseFloat(b.total_concepto || 0)

    const estadoA = saldoA <= 0 ? 3 : saldoA < totalA ? 2 : 1
    const estadoB = saldoB <= 0 ? 3 : saldoB < totalB ? 2 : 1

    if (estadoA !== estadoB) {
      return estadoA - estadoB
    }
    return saldoB - saldoA
  })
})

// última actualización - se actualiza con cada refresh
const lastUpdate = computed(() => {
  return lastUpdateTime.value.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

// utilidades
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseFloat(amount || 0))
}

// progreso %
const getProgress = (item) => {
  const total = parseFloat(item.total_concepto || 0)
  const paid = parseFloat(item.total_pagado || 0)
  if (total === 0) return 0
  return Math.min(Math.round((paid / total) * 100), 100)
}

// clase de progreso
const getProgressClass = (item) => {
  const progress = getProgress(item)
  if (progress >= 100) return 'progress-completed'
  if (progress >= 50) return 'progress-medium'
  return 'progress-low'
}

// icono de concepto
const getConceptIcon = (item) => {
  const status = getStatusClass(item)
  if (status === 'status-completed') return '✅'
  if (status === 'status-partial') return '⏳'
  return '📝'
}

// clase de estado
const getStatusClass = (item) => {
  const saldo = parseFloat(item.saldo_pendiente || 0)
  const total = parseFloat(item.total_concepto || 0)
  if (saldo <= 0) return 'status-completed'
  if (saldo < total) return 'status-partial'
  return 'status-pending'
}

// texto estado
const getStatusText = (item) => {
  const saldo = parseFloat(item.saldo_pendiente || 0)
  if (saldo <= 0) return 'Completado'
  if (item.estado) return item.estado
  const pagos = item.pagos_realizados || 0
  if (pagos > 0) return `${pagos} ${pagos === 1 ? 'pago' : 'pagos'}`
  return 'Pendiente'
}

// cargar datos reales - con reintentos
const loadBalanceData = async (retryCount = 0) => {
  // Si no hay usuario, esperar y reintentar
  if (!authStore.user?.id) {
    if (retryCount < 10) { // Máximo 10 reintentos (5 segundos)
      console.log(`Esperando autenticación... intento ${retryCount + 1}/10`)
      setTimeout(() => loadBalanceData(retryCount + 1), 500)
      return
    } else {
      // Si después de 5 segundos no hay usuario, mostrar error
      loading.value = false
      dataLoaded.value = true
      return
    }
  }

  loading.value = true
  try {
    const response = await balanceService.getBalance()
    if (response?.success) {
      balance.value = response.data || { detalle: [], resumen: {} }
      lastUpdateTime.value = new Date()
    } else {
      balance.value = { detalle: [], resumen: {} }
    }
  } catch (error) {
    console.error('Error cargando balance:', error)
    balance.value = { detalle: [], resumen: {} }
  } finally {
    loading.value = false
    dataLoaded.value = true
  }
}

// refresh - actualiza datos y hora
const refreshBalance = () => {
  loadBalanceData()
}

// init - cargar inmediatamente con reintentos
onMounted(() => {
  document.body.classList.add('page-enter')
  setTimeout(() => {
    document.body.classList.remove('page-enter')
  }, 300)
  
  // Iniciar carga con reintentos
  loadBalanceData()
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ===== ESTILOS UNIFORMES CON LAS OTRAS VISTAS ===== */
.balance-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  position: relative;
  animation: pageSlideIn 0.3s ease-out;
}

@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== HEADER UNIFORME Y LIMPIO ===== */
.view-header {
  background: white;
  border-bottom: 1px solid #f1f5f9;
  padding: 16px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all 0.3s ease;
}

.view-header.header-scrolled {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
}

.header-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  text-align: center;
}

/* ===== SECCIÓN DE REFRESH DEBAJO DEL HEADER ===== */
.refresh-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

/* Botón de refresh */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: #f1f5f9;
  border-radius: 30px;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:active {
  background: #e2e8f0;
  transform: scale(0.95);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.update-badge {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 400;
}

/* ===== CONTENEDOR PRINCIPAL ===== */
.balance-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

/* ===== TARJETAS DE RESUMEN - UNA SOBRE OTRA ===== */
.summary-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  width: 100%;
}

.summary-card:active {
  transform: scale(0.99);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.total-pagado .card-icon {
  background: #e8f5e9;
  color: #2e7d32;
}

.saldo-pendiente .card-icon {
  background: #ffebee;
  color: #d32f2f;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 4px;
}

.card-amount {
  display: block;
  font-size: 1.6rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
  white-space: normal;
  margin-bottom: 4px;
}

.card-trend {
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
}

.card-trend.positive {
  background: #e8f5e9;
  color: #2e7d32;
}

.card-trend.pending {
  background: #ffebee;
  color: #d32f2f;
}

/* ===== SECCIÓN DE CONCEPTOS ===== */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.section-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.concept-count {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
}

.concepts-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Cards de conceptos */
.concept-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
  animation: cardFadeIn 0.4s ease forwards;
  opacity: 0;
  position: relative;
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

.concept-card:active {
  transform: scale(0.99);
  background: #fafafa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.concept-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.concept-icon.status-completed {
  background: #e8f5e9;
}

.concept-icon.status-partial {
  background: #fff3e0;
}

.concept-icon.status-pending {
  background: #ffebee;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  word-break: break-word;
}

.concept-status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.status-completed {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-partial {
  background: #fff3e0;
  color: #f57c00;
}

.status-pending {
  background: #ffebee;
  color: #d32f2f;
}

/* Cuerpo de la card */
.card-body {
  margin-bottom: 12px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.9rem;
  color: #475569;
  gap: 8px;
}

.amount-row span:first-child {
  white-space: nowrap;
}

.amount-row .amount-value {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  text-align: right;
  word-break: break-word;
}

.amount-row.paid .amount-value {
  color: #2e7d32;
  font-weight: 600;
}

.amount-row.pending .amount-value {
  color: #d32f2f;
  font-weight: 600;
}

/* Barra de progreso */
.progress-container {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-fill.progress-completed {
  background: linear-gradient(90deg, #2e7d32, #4caf50);
}

.progress-fill.progress-medium {
  background: linear-gradient(90deg, #f57c00, #ffb74d);
}

.progress-fill.progress-low {
  background: linear-gradient(90deg, #d32f2f, #ef5350);
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
  flex-wrap: wrap;
  gap: 8px;
}

.payments-count {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 10px;
}

/* Chevron */
.card-chevron {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.3;
}

@media (max-width: 480px) {
  .card-chevron {
    display: none;
  }
}

/* ===== LOADING STATE ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f5f9;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 24px;
  border: 1px solid #f1f5f9;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.6;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 4px;
}

.empty-state p {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 20px;
}

.btn-refresh {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh:active {
  transform: scale(0.95);
  background: #1d4ed8;
}

/* ===== ANIMACIONES ===== */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}

.page-enter {
  opacity: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .balance-container {
    padding: 16px;
  }

  .refresh-section {
    padding: 8px 16px;
  }

  .summary-card {
    padding: 16px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }

  .card-amount {
    font-size: 1.4rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .concept-status {
    align-self: flex-start;
  }
}

@media (min-width: 768px) {
  .balance-view {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;
    background: white;
  }

  .balance-container {
    background: #f8fafc;
  }
}

/* Ajustes tipográficos */
.amount, .card-amount, .amount-value {
  font-feature-settings: "tnum";
}
</style>