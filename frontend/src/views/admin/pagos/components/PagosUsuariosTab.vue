<template>
  <div>
    <h2>Pagos por Usuario</h2>

    <select v-model="usuarioSeleccionado">
      <option disabled value="">Selecciona un usuario</option>
      <option v-for="u in usuarios" :key="u.id" :value="u.id">
        {{ u.nombre }}
      </option>
    </select>

    <div v-if="usuarioSeleccionado">
      <hr />
      <p>Aquí se cargarán los conceptos activos y sus parcialidades...</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const usuarioSeleccionado = ref('')
const usuarios = ref([
  { id: 1, nombre: 'Cristopher Avila' },
  { id: 2, nombre: 'Juan Pérez' }
])
</script>
