<template>
  <div class="container">

    <!-- 🔎 BUSCADOR -->
    <div v-if="!usuarioId" class="card">
      <h2>Buscar Usuario</h2>

      <input
        v-model="busqueda"
        type="text"
        placeholder="Nombre del usuario..."
        class="input"
      />

      <div
        v-for="u in usuariosFiltrados"
        :key="u.id"
        class="user-item"
        @click="irADetalle(u.id)"
      >
        {{ u.nombre }}
      </div>
    </div>


    <!-- 👤 DETALLE -->
    <div v-else>

      <button class="back-btn" @click="volver">
        ← Volver
      </button>

      <div
        v-for="c in pagos"
        :key="c.id"
        class="concept-card"
      >
        <h3>{{ c.nombre }}</h3>

        <p class="resumen">
          Pagado: ${{ c.pagado }}  
          <br />
          Pendiente: ${{ c.pendiente }}
        </p>

        <div class="parcialidades">
          <span
            v-for="p in c.parcialidades"
            :key="p.numero"
            :class="['badge', p.estado]"
          >
            {{ p.numero }}
          </span>
        </div>

        <!-- 💳 REGISTRAR PAGO -->
        <div class="register-box">
          <input
            v-model="montos[c.id]"
            type="number"
            placeholder="Monto a registrar"
            class="input"
          />
          <button
            class="primary-btn"
            @click="registrarPago(c.id)"
          >
            Registrar
          </button>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const usuarioId = computed(() => route.params.id)

const usuarios = ref([])
const pagos = ref([])
const busqueda = ref('')
const montos = ref({})

// 🔎 Filtrado simple
const usuariosFiltrados = computed(() => {
  return usuarios.value.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.value.toLowerCase())
  )
})

const cargarUsuarios = async () => {
  const { data } = await axios.get('/api/admin/usuarios')
  usuarios.value = data
}

const cargarPagos = async () => {
  if (!usuarioId.value) return
  const { data } = await axios.get(
    `/api/admin/pagos/usuario/${usuarioId.value}`
  )
  pagos.value = data
}

const irADetalle = (id) => {
  router.push({ name: 'admin-pagos-usuario', params: { id } })
}

const volver = () => {
  router.push({ name: 'admin-pagos-usuario' })
}

const registrarPago = async (conceptoId) => {
  await axios.post('/api/admin/pagos/registrar', {
    usuario_id: usuarioId.value,
    concepto_id: conceptoId,
    monto: montos.value[conceptoId]
  })

  montos.value[conceptoId] = ''
  cargarPagos()
}

onMounted(() => {
  cargarUsuarios()
  cargarPagos()
})
</script>

<style scoped>

/* 📱 MOBILE FIRST */

.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card,
.concept-card {
  background: white;
  padding: 16px;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(15,23,42,0.05);
}

.input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
}

.user-item {
  padding: 10px;
  margin-top: 6px;
  border-radius: 8px;
  background: #f1f5f9;
  cursor: pointer;
}

.user-item:hover {
  background: #e2e8f0;
}

.parcialidades {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
}

.pagado {
  background: #22c55e;
  color: white;
}

.pendiente {
  background: #e2e8f0;
  color: #334155;
}

.register-box {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.primary-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: #0f172a;
  color: white;
  cursor: pointer;
}

.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 10px;
}

/* 💻 Desktop mejora layout */

@media (min-width: 768px) {

  .register-box {
    flex-direction: row;
  }

  .primary-btn {
    width: auto;
  }

}

</style>
