<template>
  <div>
    <h1>{{ isEdit ? 'Editar Usuario' : 'Nuevo Usuario' }}</h1>
    <form @submit.prevent="guardar">
      <div>
        <label>Nombre</label>
        <input v-model="usuario.nombre" required />
      </div>
      <div>
        <label>Apellidos</label>
        <input v-model="usuario.apellidos" required />
      </div>
      <div>
        <label>Correo</label>
        <input type="email" v-model="usuario.correo" required />
      </div>
      <div>
        <label>Teléfono</label>
        <input v-model="usuario.telefono" />
      </div>
      <div>
        <label>Número Vecino</label>
        <input v-model="usuario.numero_vecino" />
      </div>
      <div>
        <label>QR (URL o Base64)</label>
        <input v-model="usuario.qr" />
      </div>
      <button type="submit">Guardar</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      usuario: {
        nombre: '',
        apellidos: '',
        correo: '',
        telefono: '',
        numero_vecino: '',
        qr: ''
      },
      isEdit: false
    }
  },
  mounted() {
    const id = this.$route.params.id
    if (id) {
      this.isEdit = true
      axios.get(`/api/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('colonia_token')}` }
      })
      .then(res => this.usuario = res.data)
      .catch(err => console.error(err))
    }
  },
  methods: {
    guardar() {
      const id = this.$route.params.id
      const request = this.isEdit
        ? axios.put(`/api/usuarios/${id}`, this.usuario, { headers: { Authorization: `Bearer ${localStorage.getItem('colonia_token')}` } })
        : axios.post('/api/usuarios', this.usuario, { headers: { Authorization: `Bearer ${localStorage.getItem('colonia_token')}` } })

      request.then(() => this.$router.push('/admin/usuarios'))
             .catch(err => console.error(err))
    }
  }
}
</script>
