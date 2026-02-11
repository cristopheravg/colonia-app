<template>
  <AppLayout>
    <div class="balance-view">
      <h1>💰 Mi Estado de Cuenta</h1>
      
      <!-- Resumen General -->
      <div class="summary-card" v-if="!loading">
        <div class="summary-header">
          <h2>Resumen Financiero</h2>
          <span class="update-time">Actualizado: {{ lastUpdate }}</span>
        </div>
        
        <div class="summary-grid">
          <div class="summary-item total-pagado">
            <div class="summary-icon">✅</div>
            <div class="summary-content">
              <h3>Total Pagado</h3>
              <p class="amount">${{ formatCurrency(summary.totalPagado || 0) }}</p>
            </div>
          </div>
          
          <div class="summary-item saldo-pendiente">
            <div class="summary-icon">📋</div>
            <div class="summary-content">
              <h3>Saldo Pendiente</h3>
              <p class="amount">${{ formatCurrency(summary.totalPendiente || 0) }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div class="loading-state" v-if="loading">
        <div class="spinner"></div>
        <p>Cargando estado de cuenta...</p>
      </div>
      
      <!-- Detalle por Concepto -->
      <div class="concepts-section" v-if="!loading && balance.detalle?.length">
        <h2>Detalle por Concepto</h2>
        
        <div class="concepts-list">
          <div class="concept-card" v-for="(item, index) in balance.detalle" :key="index">
            <div class="concept-header">
              <h3>{{ item.concepto || 'Concepto sin nombre' }}</h3>
              <span class="concept-status" :class="getStatusClass(item)">
                {{ getStatusText(item) }}
              </span>
            </div>
            
            <div class="concept-details">
              <div class="detail-row">
                <span>Total del concepto:</span>
                <span class="amount">${{ formatCurrency(item.total_concepto || 0) }}</span>
              </div>
              
              <div class="detail-row">
                <span>Pagado:</span>
                <span class="amount paid">${{ formatCurrency(item.total_pagado || 0) }}</span>
              </div>
              
              <div class="detail-row">
                <span>Saldo pendiente:</span>
                <span class="amount pending">${{ formatCurrency(item.saldo_pendiente || 0) }}</span>
              </div>
              
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgress(item) + '%' }"></div>
              </div>
              
              <div class="progress-text">
                {{ getProgress(item) }}% completado
                <span v-if="item.pagos_realizados > 0">
                  ({{ item.pagos_realizados }} pagos realizados)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sin datos -->
      <div class="empty-state" v-if="!loading && (!balance.detalle || !balance.detalle.length)">
        <div class="empty-icon">📊</div>
        <h3>No hay conceptos de pago activos</h3>
        <p>Actualmente no tienes conceptos de pago asignados.</p>
      </div>
      
      <!-- Historial reciente -->
      <div class="history-section" v-if="!loading && recentPayments.length">
        <h2>Historial Reciente</h2>
        
        <div class="history-list">
          <div class="history-item" v-for="payment in recentPayments" :key="payment.id">
            <div class="history-icon" :class="payment.estado">
              {{ payment.estado === 'pagado' ? '✅' : '⏳' }}
            </div>
            <div class="history-content">
              <h4>{{ payment.concepto || 'Pago' }}</h4>
              <p>${{ formatCurrency(payment.monto || 0) }} • {{ formatDate(payment.fecha_pago) }}</p>
            </div>
            <div class="history-amount">
              ${{ formatCurrency(payment.monto || 0) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { paymentService } from '@/services/paymentService'

const loading = ref(true)
const balance = ref({ detalle: [], resumen: {} })
const paymentHistory = ref([])

// Datos de ejemplo mientras se conecta al backend
const exampleData = {
  detalle: [
    {
      concepto: 'Aportación Anual 2024',
      total_concepto: 1200.00,
      total_pagado: 1200.00,
      saldo_pendiente: 0.00,
      pagos_realizados: 1,
      estado: 'Completado'
    },
    {
      concepto: 'Acometida Eléctrica',
      total_concepto: 3600.00,
      total_pagado: 1200.00,
      saldo_pendiente: 2400.00,
      pagos_realizados: 2,
      estado: '2/6'
    },
    {
      concepto: 'Fondo de Emergencia',
      total_concepto: 2400.00,
      total_pagado: 600.00,
      saldo_pendiente: 1800.00,
      pagos_realizados: 1,
      estado: '1/12'
    }
  ],
  resumen: {
    totalPagado: 3000.00,
    totalPendiente: 4200.00,
    totalConceptos: 7200.00,
    conceptosActivos: 3
  }
}

const exampleHistory = [
  {
    id: 1,
    concepto: 'Aportación Anual 2024',
    monto: 1200.00,
    fecha_pago: '2024-01-05T10:00:00',
    estado: 'pagado'
  },
  {
    id: 2,
    concepto: 'Acometida Eléctrica - Mensualidad 1',
    monto: 600.00,
    fecha_pago: '2024-01-10T11:30:00',
    estado: 'pagado'
  },
  {
    id: 3,
    concepto: 'Acometida Eléctrica - Mensualidad 2',
    monto: 600.00,
    fecha_pago: '2024-02-01T09:15:00',
    estado: 'pagado'
  }
]

const summary = computed(() => balance.value.resumen || {})
const recentPayments = computed(() => paymentHistory.value.slice(0, 3))

const lastUpdate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formatCurrency = (amount) => {
  return parseFloat(amount).toFixed(2)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Fecha no disponible'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch (error) {
    return 'Fecha inválida'
  }
}

const getProgress = (item) => {
  const total = parseFloat(item.total_concepto || 0)
  const paid = parseFloat(item.total_pagado || 0)
  if (total === 0) return 0
  const progress = (paid / total) * 100
  return Math.min(Math.round(progress), 100)
}

const getStatusClass = (item) => {
  const saldo = parseFloat(item.saldo_pendiente || 0)
  const total = parseFloat(item.total_concepto || 1)
  
  if (saldo <= 0) return 'status-completed'
  if (saldo < total) return 'status-partial'
  return 'status-pending'
}

const getStatusText = (item) => {
  const saldo = parseFloat(item.saldo_pendiente || 0)
  
  if (saldo <= 0) return 'Completado'
  
  const pagos = item.pagos_realizados || 0
  const estado = item.estado || ''
  
  if (estado && typeof estado === 'string') {
    return estado
  }
  
  if (pagos > 0) {
    return `${pagos} pagos realizados`
  }
  
  return 'Pendiente'
}

const loadBalanceData = async () => {
  loading.value = true
  
  try {
    // Intentar cargar datos reales del backend
    const response = await paymentService.getBalance()
    console.log('Datos del backend:', response)
    
    if (response && response.success) {
      balance.value = response.data || exampleData
    } else {
      // Usar datos de ejemplo si falla
      balance.value = exampleData
    }
  } catch (error) {
    console.error('Error cargando balance:', error)
    // Usar datos de ejemplo
    balance.value = exampleData
  }
  
  // Cargar historial (por ahora datos de ejemplo)
  paymentHistory.value = exampleHistory
  
  loading.value = false
}

onMounted(() => {
  console.log('BalanceView montado')
  loadBalanceData()
})
</script>

<style scoped>
/* Mantener todos los estilos iguales */
.balance-view {
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

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.summary-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.4rem;
}

.update-time {
  color: #666;
  font-size: 0.9rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.summary-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s;
}

.summary-item:hover {
  transform: translateY(-2px);
}

.summary-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.summary-content h3 {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.amount {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
}

.total-pagado .summary-icon { color: #2e7d32; }
.saldo-pendiente .summary-icon { color: #d32f2f; }

.loading-state {
  text-align: center;
  padding: 50px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.concepts-section {
  margin-bottom: 30px;
}

.concepts-section h2 {
  color: #333;
  margin-bottom: 20px;
}

.concepts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.concept-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border-left: 4px solid #4A90E2;
}

.concept-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.concept-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.concept-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
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

.concept-details {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #666;
}

.detail-row .amount {
  font-size: 1rem;
  font-weight: 600;
}

.paid { color: #2e7d32; }
.pending { color: #d32f2f; }

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  margin: 20px 0 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4A90E2, #357ABD);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.history-section {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.history-section h2 {
  color: #333;
  margin-bottom: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: background 0.3s;
}

.history-item:hover {
  background: #e9ecef;
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.history-icon.pagado {
  background: #e8f5e9;
  color: #2e7d32;
}

.history-content {
  flex: 1;
}

.history-content h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.history-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.history-amount {
  font-weight: 700;
  color: #333;
  font-size: 1.1rem;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
  margin: 0;
}

@media (max-width: 768px) {
  .balance-view {
  min-height: calc(100vh - 180px);
    padding: 15px;
  }
  
  .summary-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .concept-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .history-item {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .history-content {
    text-align: center;
  }
}
</style>
