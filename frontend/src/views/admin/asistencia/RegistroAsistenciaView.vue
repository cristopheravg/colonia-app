<template>
  <div class="scanner-container">
    <!-- Header -->
    <div class="header">
      <h2>📱 Registrar asistencia</h2>
      
      <!-- Info del evento seleccionado -->
      <div v-if="evento" class="evento-info">
        <div class="evento-nombre">{{ evento.nombre }}</div>
        <div class="evento-detalles">
          <span>📅 {{ formatHoraEvento(evento.fecha_inicio) }}</span>
          <span>📍 {{ evento.lugar || 'Sin especificar' }}</span>
        </div>
        <div class="evento-asistentes">
          👥 {{ asistenciasCount }}/{{ evento.max_asistentes || '∞' }}
        </div>
      </div>
    </div>

    <!-- Selector de eventos del día -->
    <div class="evento-selector" v-if="eventos.length">
      <label for="evento" class="selector-label">Evento:</label>
      <select 
        id="evento" 
        v-model="eventoSeleccionado" 
        @change="cambiarEvento"
        :disabled="cargandoEventos"
        class="selector-input"
      >
        <option value="">-- Seleccionar --</option>
        <option 
          v-for="ev in eventos" 
          :key="ev.id" 
          :value="ev.id"
        >
          {{ ev.nombre }} {{ formatHoraEvento(ev.fecha_inicio) }}
        </option>
      </select>
    </div>

    <!-- Estado de carga -->
    <div v-if="cargandoEventos" class="loading">
      Cargando eventos...
    </div>

    <!-- Área del escáner -->
    <div v-if="eventoSeleccionado" class="scanner-section">
      <div class="scanner-wrapper">
        <div id="reader" class="scanner-reader"></div>
        
        <div class="scanner-controls">
          <button @click="alternarCamara" class="btn-control">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">Cambiar cámara</span>
          </button>
          <button @click="reiniciarEscaneo" class="btn-control">
            <span class="btn-icon">🔁</span>
            <span class="btn-text">Reiniciar</span>
          </button>
        </div>
      </div>
    </div>

    <p v-else class="sin-evento">
      Seleccione un evento para activar el escáner
    </p>

    <!-- LISTA DE ASISTENTES -->
    <div class="asistentes-section" v-if="eventoSeleccionado">
      <div class="asistentes-header">
        <div class="header-top">
          <h3>📋 Asistentes <span class="asistentes-count">{{ asistencias.length }}</span></h3>
          <button @click="mostrarFaltantes" class="btn-faltantes">
            <span class="btn-icon">👥</span>
            Ver faltantes
          </button>
        </div>
        
        <div class="buscador">
          <input 
            type="text" 
            v-model="busquedaAsistente" 
            placeholder="Buscar asistente..."
            class="input-busqueda"
          />
        </div>
      </div>

      <div class="asistentes-lista">
        <div v-if="asistenciasFiltradas.length === 0" class="sin-datos">
          No hay asistentes registrados
        </div>
        
        <div 
          v-for="asis in asistenciasFiltradas" 
          :key="asis.id" 
          class="asistente-item"
        >
          <div class="asistente-info">
            <div class="asistente-nombre">{{ asis.nombre }} {{ asis.apellidos || '' }}</div>
            <div class="asistente-numero_vecino">#{{ asis.numero_vecino }}</div>
            <div class="asistente-hora">{{ formatHora(asis.fecha_asistencia) }}</div>
          </div>
          <div class="asistente-estado">
            <span class="badge presente">✅</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-contenido">
        <div class="modal-header">
          <h3>Confirmar asistencia</h3>
          <button @click="cerrarModal" class="btn-cerrar">×</button>
        </div>
        
        <div class="modal-body" v-if="qrPendiente">
          <div class="info-vecino">
            <div class="info-item">
              <span class="info-label">Nombre</span>
              <span class="info-value">{{ qrPendiente.nombre }} {{ qrPendiente.apellidos || '' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ qrPendiente.email || 'Sin email' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Número de vecino</span>
              <span class="info-value">#{{ qrPendiente.numero_vecino }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Dirección</span>
              <span class="info-value">{{ qrPendiente.direccion || 'Sin dirección' }}</span>
            </div>
          </div>
          
          <p class="confirm-text">¿Es la persona correcta?</p>
        </div>
        
        <div class="modal-footer">
          <button @click="cancelarAsistencia" class="btn-cancelar">
            Cancelar
          </button>
          <button @click="confirmarAsistencia" class="btn-confirmar">
            Confirmar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE FALTANTES -->
    <div v-if="modalFaltantesVisible" class="modal-overlay" @click.self="cerrarModalFaltantes">
      <div class="modal-contenido modal-faltantes">
        <div class="modal-header">
          <h3>👥 Vecinos faltantes ({{ vecinosFaltantes.length }})</h3>
          <button @click="cerrarModalFaltantes" class="btn-cerrar">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Buscador de faltantes -->
          <div class="buscador-faltantes">
            <input 
              type="text" 
              v-model="busquedaFaltante" 
              placeholder="Buscar vecino por nombre, número o email..."
              class="input-busqueda"
            />
          </div>

          <!-- Indicador de carga -->
          <div v-if="cargandoVecinos" class="loading">
            Cargando vecinos...
          </div>

          <!-- Lista de faltantes -->
          <div v-else class="faltantes-lista">
            <div v-if="vecinosFaltantesFiltrados.length === 0" class="sin-datos">
              No hay vecinos faltantes
            </div>
            
            <div 
              v-for="vecino in vecinosFaltantesFiltrados" 
              :key="vecino.id" 
              class="faltante-item"
            >
              <div class="faltante-info">
                <div class="faltante-nombre">{{ vecino.nombre }} {{ vecino.apellidos || '' }}</div>
                <div class="faltante-detalles">
                  <span class="faltante-numero">#{{ vecino.numero_vecino }}</span>
                  <span class="faltante-email">{{ vecino.correo || 'Sin email' }}</span>
                </div>
                <div class="faltante-direccion">{{ vecino.direccion || 'Sin dirección' }}</div>
              </div>
              <button 
                @click="registrarManual(vecino)" 
                class="btn-registrar"
                title="Registrar asistencia manual"
              >
                ✅
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="cerrarModalFaltantes" class="btn-cancelar">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Mensajes flotantes -->
    <transition name="fade">
      <div v-if="mensaje" :class="['mensaje', mensajeTipo]">
        {{ mensaje }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import axios from 'axios'
import { Html5Qrcode } from 'html5-qrcode'

// Props
const props = defineProps({
  eventoId: {
    type: Number,
    default: null
  }
})

// Estados
const mensaje = ref('')
const mensajeTipo = ref('info')
const escaneoActivo = ref(false)
const qrScanner = ref(null)
const camaraActual = ref('environment')
const cargandoEventos = ref(false)
const eventos = ref([])
const eventoSeleccionado = ref(null)
const evento = ref(null)
const procesando = ref(false)

// Estados para asistentes
const asistencias = ref([])
const cargandoAsistencias = ref(false)
const busquedaAsistente = ref('')

// Estados para modal de confirmación
const modalVisible = ref(false)
const qrPendiente = ref(null)

// Estados para modal de faltantes
const modalFaltantesVisible = ref(false)
const todosLosVecinos = ref([])
const cargandoVecinos = ref(false)
const busquedaFaltante = ref('')

// Computed
const asistenciasCount = computed(() => asistencias.value.length)

const asistenciasFiltradas = computed(() => {
  if (!busquedaAsistente.value) return asistencias.value
  
  const busqueda = busquedaAsistente.value.toLowerCase()
  return asistencias.value.filter(asis => 
    asis.nombre?.toLowerCase().includes(busqueda) ||
    asis.apellidos?.toLowerCase().includes(busqueda) ||
    asis.numero_vecino?.toString().includes(busqueda)
  )
})

const vecinosFaltantes = computed(() => {
  if (!todosLosVecinos.value.length || !asistencias.value.length) {
    return todosLosVecinos.value
  }
  
  // IDs de vecinos que ya asistieron
  const asistentesIds = new Set(asistencias.value.map(a => a.usuario_id))
  
  // Filtrar vecinos que NO están en asistentes
  return todosLosVecinos.value.filter(vecino => !asistentesIds.has(vecino.id))
})

const vecinosFaltantesFiltrados = computed(() => {
  if (!busquedaFaltante.value) return vecinosFaltantes.value
  
  const busqueda = busquedaFaltante.value.toLowerCase()
  return vecinosFaltantes.value.filter(vecino => 
    vecino.nombre?.toLowerCase().includes(busqueda) ||
    vecino.apellidos?.toLowerCase().includes(busqueda) ||
    (vecino.numero_vecino && vecino.numero_vecino.toString().includes(busqueda)) ||
    (vecino.correo && vecino.correo.toLowerCase().includes(busqueda)) ||
    (vecino.direccion && vecino.direccion.toLowerCase().includes(busqueda))
  )
})

// Configuración de axios
const createApi = () => {
  const token = localStorage.getItem('colonia_token')
  return axios.create({
    baseURL: '/api',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

// Métodos de formato
const formatHora = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatHoraEvento = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cargar eventos del día
const cargarEventosHoy = async () => {
  try {
    cargandoEventos.value = true
    const api = createApi()
    
    const response = await api.get('/eventos/hoy')
    eventos.value = response.data.data || []
    
    if (eventos.value.length === 1) {
      eventoSeleccionado.value = eventos.value[0].id
      evento.value = eventos.value[0]
      await cargarAsistencias()
      await iniciarEscaneo()
    }
    
  } catch (error) {
    console.error('Error cargando eventos:', error)
    mostrarMensaje('Error al cargar eventos', 'error')
  } finally {
    cargandoEventos.value = false
  }
}

// Cambiar evento
const cambiarEvento = async () => {
  if (!eventoSeleccionado.value) {
    evento.value = null
    asistencias.value = []
    await detenerEscaneo()
    return
  }
  
  const encontrado = eventos.value.find(e => e.id === eventoSeleccionado.value)
  evento.value = encontrado
  
  await detenerEscaneo()
  await cargarAsistencias()
  await iniciarEscaneo()
}

// Cargar asistencias del evento
const cargarAsistencias = async () => {
  if (!eventoSeleccionado.value) return
  
  try {
    cargandoAsistencias.value = true
    const api = createApi()
    const response = await api.get(`/asistencias/evento/${eventoSeleccionado.value}`)
    asistencias.value = response.data
    busquedaAsistente.value = ''
  } catch (error) {
    console.error('Error cargando asistencias:', error)
    mostrarMensaje('Error al cargar lista', 'error')
  } finally {
    cargandoAsistencias.value = false
  }
}

// Cargar todos los vecinos (para lista de faltantes)
const cargarTodosLosVecinos = async () => {
  try {
    cargandoVecinos.value = true
    const api = createApi()
    const response = await api.get('/usuarios')
    todosLosVecinos.value = response.data.data || []
  } catch (error) {
    console.error('Error cargando vecinos:', error)
    mostrarMensaje('Error al cargar vecinos', 'error')
  } finally {
    cargandoVecinos.value = false
  }
}

// Iniciar escáner
const iniciarEscaneo = async () => {
  if (!eventoSeleccionado.value) {
    mostrarMensaje('Debe seleccionar un evento', 'error')
    return
  }

  try {
    if (qrScanner.value) {
      await detenerEscaneo()
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    escaneoActivo.value = true
    qrScanner.value = new Html5Qrcode("reader")
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    }

    await qrScanner.value.start(
      { facingMode: camaraActual.value },
      config,
      manejarEscaneo,
      manejarError
    )
    
  } catch (error) {
    console.error('Error al iniciar escáner:', error)
    mostrarMensaje('Error al iniciar la cámara', 'error')
    escaneoActivo.value = false
  }
}

// Detener escáner
const detenerEscaneo = async () => {
  if (qrScanner.value && qrScanner.value.isScanning) {
    try {
      await qrScanner.value.stop()
    } catch (error) {
      console.error('Error al detener escáner:', error)
    }
  }
  qrScanner.value = null
  escaneoActivo.value = false
}

// Reiniciar escáner
const reiniciarEscaneo = async () => {
  await detenerEscaneo()
  await iniciarEscaneo()
  mostrarMensaje('Escáner reiniciado', 'success')
}

// Alternar cámara
const alternarCamara = async () => {
  camaraActual.value = camaraActual.value === 'environment' ? 'user' : 'environment'
  await reiniciarEscaneo()
}

// Manejar escaneo exitoso
const manejarEscaneo = async (decodedText) => {
  if (procesando.value || modalVisible.value) return
  
  try {
    procesando.value = true
    
    if (qrScanner.value && qrScanner.value.isScanning) {
      await qrScanner.value.pause()
    }
    
    mostrarMensaje('Verificando...', 'info')

    const api = createApi()

    let qrDecodificado
    try {
      qrDecodificado = atob(decodedText)
    } catch {
      qrDecodificado = decodedText
    }
    
    const partes = qrDecodificado.split('-')
    if (partes.length !== 2) {
      throw new Error('Formato QR inválido')
    }
    
    const usuario_id = parseInt(partes[1])
    
    const response = await api.get(`/usuarios/${usuario_id}`)
    const usuarioData = response.data.data
    
    qrPendiente.value = {
      qr_original: decodedText,
      qr_decodificado: qrDecodificado,
      usuario_id: usuario_id,
      nombre: usuarioData.nombre,
      apellidos: usuarioData.apellidos,
      email: usuarioData.correo,
      numero_vecino: usuarioData.numero_vecino,
      direccion: usuarioData.direccion
    }
    
    modalVisible.value = true
    
  } catch (error) {
    console.error('Error:', error)
    mostrarMensaje('QR inválido', 'error')
    
    setTimeout(() => {
      if (qrScanner.value && qrScanner.value.isScanning) {
        qrScanner.value.resume()
      }
    }, 2000)
  } finally {
    procesando.value = false
  }
}

// Confirmar asistencia
const confirmarAsistencia = async () => {
  if (!qrPendiente.value) return
  
  try {
    procesando.value = true
    
    const api = createApi()
    
    const res = await api.post('/asistencias/scan', {
      qr: qrPendiente.value.qr_original,
      evento_id: eventoSeleccionado.value
    })

    await cargarAsistencias()
    await cargarTodosLosVecinos() // Actualizar lista de faltantes
    mostrarMensaje('✅ Asistencia registrada', 'success')
    
    if (navigator.vibrate) {
      navigator.vibrate(200)
    }
    
  } catch (error) {
    console.error('Error:', error)
    mostrarMensaje('Error al registrar', 'error')
  } finally {
    cerrarModal()
    procesando.value = false
    
    setTimeout(() => {
      if (qrScanner.value && qrScanner.value.isScanning) {
        qrScanner.value.resume()
      }
    }, 1000)
  }
}

// Cancelar asistencia
const cancelarAsistencia = () => {
  cerrarModal()
  mostrarMensaje('Registro cancelado', 'info')
  
  setTimeout(() => {
    if (qrScanner.value && qrScanner.value.isScanning) {
      qrScanner.value.resume()
    }
  }, 500)
}

// Cerrar modal de confirmación
const cerrarModal = () => {
  modalVisible.value = false
  qrPendiente.value = null
}

// Mostrar modal de faltantes
const mostrarFaltantes = async () => {
  await cargarTodosLosVecinos()
  modalFaltantesVisible.value = true
}

// Cerrar modal de faltantes
const cerrarModalFaltantes = () => {
  modalFaltantesVisible.value = false
  busquedaFaltante.value = ''
}

// Registrar asistencia manual
const registrarManual = async (vecino) => {
  if (!eventoSeleccionado.value) {
    mostrarMensaje('Seleccione un evento primero', 'error')
    return
  }
  
  try {
    procesando.value = true
    
    // Crear QR manual (timestamp-id)
    const qrManual = `${Date.now()}-${vecino.id}`
    const qrBase64 = btoa(qrManual)
    
    const api = createApi()
    const res = await api.post('/asistencias/scan', {
      qr: qrBase64,
      evento_id: eventoSeleccionado.value
    })
    
    await cargarAsistencias()
    await cargarTodosLosVecinos() // Actualizar lista de faltantes
    mostrarMensaje(`✅ Asistencia registrada para ${vecino.nombre}`, 'success')
    
    if (navigator.vibrate) {
      navigator.vibrate(200)
    }
    
  } catch (error) {
    console.error('Error:', error)
    mostrarMensaje('Error al registrar asistencia', 'error')
  } finally {
    procesando.value = false
  }
}

// Manejar errores del escáner
const manejarError = (errorMessage) => {
  if (!errorMessage.includes('NotFoundException')) {
    console.warn('Error:', errorMessage)
  }
}

// Mostrar mensaje
const mostrarMensaje = (texto, tipo = 'info') => {
  mensaje.value = texto
  mensajeTipo.value = tipo
  
  setTimeout(() => {
    mensaje.value = ''
  }, 3000)
}

// Inicializar
onMounted(async () => {
  await cargarEventosHoy()
})

// Limpiar
onUnmounted(() => {
  detenerEscaneo()
})
</script>


<style scoped>
/* Mobile First - Estilos base para móvil */
.scanner-container {
  max-width: 100%;
  padding: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.header {
  margin-bottom: 16px;
}

.header h2 {
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  color: #333;
}

.evento-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  border-left: 4px solid #4CAF50;
}

.evento-nombre {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 8px;
}

.evento-detalles {
  display: flex;
  gap: 12px;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.evento-asistentes {
  font-size: 0.9rem;
  color: #4CAF50;
  font-weight: 500;
}

/* Selector de eventos */
.evento-selector {
  margin-bottom: 16px;
}

.selector-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 6px;
}

.selector-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  -webkit-appearance: none;
  appearance: none;
}

/* Escáner */
.scanner-section {
  margin-bottom: 20px;
}

.scanner-wrapper {
  background: #f5f5f5;
  border-radius: 16px;
  padding: 12px;
}

.scanner-reader {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1;
  background: #000;
}

.scanner-controls {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: white;
  color: #333;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
}

.btn-control:active {
  background: #f0f0f0;
  transform: scale(0.98);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Lista de asistentes */
.asistentes-section {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.asistentes-header {
  margin-bottom: 16px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.asistentes-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.asistentes-count {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #495057;
}

.btn-faltantes {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 20px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-faltantes:active {
  background: #bbdefb;
  transform: scale(0.98);
}

.input-busqueda {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 0.95rem;
  background: #f8f9fa;
}

.asistentes-lista {
  max-height: 300px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.asistente-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.asistente-item:last-child {
  border-bottom: none;
}

.asistente-info {
  flex: 1;
}

.asistente-nombre {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.asistente-numero_vecino {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 2px;
}

.asistente-hora {
  font-size: 0.7rem;
  color: #999;
}

.asistente-estado .badge {
  font-size: 1.2rem;
}

.sin-datos {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 0.9rem;
}

/* Modal de confirmación */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-contenido {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  animation: slideUp 0.3s ease;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}

.info-vecino {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 2px;
}

.info-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.confirm-text {
  text-align: center;
  font-size: 1rem;
  color: #495057;
  margin: 16px 0 0;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
}

.btn-cancelar, .btn-confirmar {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancelar {
  background: #f8f9fa;
  color: #495057;
}

.btn-cancelar:active {
  background: #e9ecef;
}

.btn-confirmar {
  background: #4CAF50;
  color: white;
}

.btn-confirmar:active {
  background: #45a049;
  transform: scale(0.98);
}

/* Modal de faltantes */
.modal-faltantes {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-faltantes .modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.buscador-faltantes {
  margin-bottom: 16px;
}

.faltantes-lista {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.faltante-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 8px;
}

.faltante-item:last-child {
  margin-bottom: 0;
}

.faltante-info {
  flex: 1;
}

.faltante-nombre {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.faltante-detalles {
  display: flex;
  gap: 8px;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 2px;
  flex-wrap: wrap;
}

.faltante-numero {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
}

.faltante-email {
  color: #666;
}

.faltante-direccion {
  font-size: 0.75rem;
  color: #999;
}

.btn-registrar {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 20px;
  background: #4CAF50;
  color: white;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 8px;
}

.btn-registrar:active {
  background: #45a049;
  transform: scale(0.95);
}

/* Mensajes flotantes */
.mensaje {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  padding: 14px 20px;
  border-radius: 12px;
  color: white;
  font-weight: 500;
  text-align: center;
  z-index: 1100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideUp 0.3s;
}

.mensaje.info {
  background: #2196F3;
}

.mensaje.success {
  background: #4CAF50;
}

.mensaje.error {
  background: #f44336;
}

/* Estados */
.sin-evento {
  text-align: center;
  color: #999;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 12px;
  margin: 20px 0;
}

.loading {
  text-align: center;
  color: #666;
  padding: 20px;
}

/* Animaciones */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Ajustes para pantallas más grandes */
@media (min-width: 768px) {
  .scanner-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .modal-overlay {
    align-items: center;
    justify-content: center;
  }
  
  .modal-contenido {
    width: 90%;
    max-width: 400px;
    border-radius: 20px;
  }
  
  .modal-faltantes {
    max-width: 600px;
  }
  
  .faltante-item {
    padding: 16px;
  }
  
  .btn-registrar {
    width: 44px;
    height: 44px;
  }
  
  .mensaje {
    left: auto;
    right: 20px;
    bottom: 20px;
    width: auto;
    min-width: 300px;
  }
}
</style>