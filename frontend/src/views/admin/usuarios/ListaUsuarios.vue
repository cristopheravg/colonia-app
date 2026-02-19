<template>
  <div>
    <h1 class="page-title">Usuarios</h1>
    <button class="btn-primary" @click="abrirModal()">Nuevo Usuario</button>

    <!-- Lista mobile -->
    <div class="users-list">
      <div v-for="u in usuarios" :key="u.id" class="user-card">
        <p><strong>Nombre:</strong> {{ u.nombre }} {{ u.apellidos }}</p>
        <p><strong>Correo:</strong> {{ u.correo }}</p>
        <p v-if="u.telefono"><strong>Tel:</strong> {{ u.telefono }}</p>
        <p v-if="u.numero_vecino"><strong>Número:</strong> {{ u.numero_vecino }}</p>
        <p><strong>Rol:</strong> {{ u.rol }} | <strong>Activo:</strong> {{ u.activo ? 'Sí' : 'No' }}</p>
        <div class="card-actions">
          <button class="btn-edit" @click="abrirModal(u)">Editar</button>
          <button class="btn-delete" @click="eliminar(u.id)">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Tabla para desktop -->
    <table class="users-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Apellidos</th>
          <th>Correo</th>
          <th>Teléfono</th>
          <th>Número Vecino</th>
          <th>Rol</th>
          <th>Activo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in usuarios" :key="u.id">
          <td>{{ u.nombre }}</td>
          <td>{{ u.apellidos }}</td>
          <td>{{ u.correo }}</td>
          <td>{{ u.telefono }}</td>
          <td>{{ u.numero_vecino }}</td>
          <td>{{ u.rol }}</td>
          <td>{{ u.activo ? 'Sí' : 'No' }}</td>
          <td>
            <button class="btn-edit" @click="abrirModal(u)">Editar</button>
            <button class="btn-delete" @click="eliminar(u.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>{{ usuario.id ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
        <form @submit.prevent="guardar">
          <input v-model="usuario.nombre" placeholder="Nombre" required />
          <input v-model="usuario.apellidos" placeholder="Apellidos" required />
          <input v-model="usuario.correo" placeholder="Correo" type="email" required />
          <input v-model="usuario.telefono" placeholder="Teléfono" />
          <input v-model="usuario.direccion" placeholder="Dirección" required />
          <input v-model="usuario.numero_vecino" placeholder="Número Vecino" />
          <input v-model="usuario.password" placeholder="Contraseña" :required="!usuario.id" type="password" />
          <select v-model="usuario.rol">
            <option value="vecino">Vecino</option>
            <option value="admin">Admin</option>
          </select>
          <label>
            <input type="checkbox" v-model="usuario.activo" /> Activo
          </label>
          <div class="modal-buttons">
            <button type="submit" class="btn-primary">Guardar</button>
            <button type="button" class="btn-secondary" @click="cerrarModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const usuarios = ref([])
const showModal = ref(false)
const usuario = ref({})

// Token y URL del backend
const token = localStorage.getItem('colonia_token')
const api = axios.create({
  baseURL: '/api', // 🔹 apunta directo a tu backend
  headers: { Authorization: `Bearer ${token}` }
})

const fetchUsuarios = async () => {
  try {
    const res = await api.get('/usuarios')
    console.log('Respuesta completa del backend:', res)
    usuarios.value = res.data.data || []
    console.log('Usuarios cargados en Vue:', usuarios.value)
  } catch (err) {
    console.error('Error cargando usuarios:', err)
  }
}

const abrirModal = (u = {}) => {
  usuario.value = { 
    nombre: '', 
    apellidos: '', 
    correo: '', 
    telefono: '', 
    direccion: '',  // 🔹 inicializamos
    numero_vecino: '', 
    rol: 'vecino', 
    activo: true,
    ...u 
  }
  showModal.value = true
}

const cerrarModal = () => {
  usuario.value = {}
  showModal.value = false
}

const guardar = async () => {
  try {
    if (usuario.value.id) {
      await api.put(`/usuarios/${usuario.value.id}`, usuario.value)
    } else {
      await api.post('/usuarios', usuario.value)
    }
    cerrarModal()
    fetchUsuarios()
  } catch (err) {
    console.error('Error guardando usuario:', err)
  }
}

const eliminar = async (id) => {
  if (!confirm('¿Eliminar usuario?')) return
  try {
    await api.delete(`/usuarios/${id}`)
    fetchUsuarios()
  } catch (err) {
    console.error('Error eliminando usuario:', err)
  }
}

onMounted(fetchUsuarios)
</script>

<style scoped>
/* Mantén tus estilos existentes, igual que antes */
</style>


<style scoped>
.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 20px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.user-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
}
.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

/* Oculta tabla en móvil */
.users-table {
  display: none;
  width: 100%;
  border-collapse: collapse;
}
.users-table th, .users-table td {
  border: 1px solid #e2e8f0;
  padding: 8px;
  text-align: left;
}

/* Botones */
.btn-primary {
  padding: 6px 12px;
  background: #2563eb;
  color: white;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
.btn-primary:hover { background: #1d4ed8; }

.btn-edit {
  padding: 4px 8px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-edit:hover { background: #d97706; }

.btn-delete {
  padding: 4px 8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-delete:hover { background: #b91c1c; }

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 6px;
  width: 90%;
  max-width: 400px;
}
.modal-content form input,
.modal-content form select {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
}
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-secondary {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #64748b;
  background: white;
  cursor: pointer;
}
.btn-secondary:hover { background: #f1f5f9; }

/* Desktop: muestra tabla y oculta lista */
@media (min-width: 768px) {
  .users-list { display: none; }
  .users-table { display: table; }
}
</style>
