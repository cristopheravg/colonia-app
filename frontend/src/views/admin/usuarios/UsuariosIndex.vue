<template>
  <div>
    <h1>Usuarios</h1>
    <button @click="$router.push('/admin/usuarios/create')">Nuevo Usuario</button>

    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Apellidos</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in usuarios" :key="u.id">
          <td>{{ u.nombre }}</td>
          <td>{{ u.apellidos }}</td>
          <td>
            <button @click="$router.push(`/admin/usuarios/${u.id}/edit`)">Editar</button>
            <button @click="eliminar(u.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      usuarios: []
    }
  },
  mounted() {
    this.fetchUsuarios()
  },
  methods: {
    fetchUsuarios() {
      axios.get('/api/usuarios', {
        headers: { Authorization: `Bearer ${localStorage.getItem('colonia_token')}` }
      })
      .then(res => this.usuarios = res.data)
      .catch(err => console.error(err))
    },
    eliminar(id) {
      if (!confirm('¿Eliminar usuario?')) return;
      axios.delete(`/api/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('colonia_token')}` }
      })
      .then(() => this.fetchUsuarios())
      .catch(err => console.error(err))
    }
  }
}
</script>
