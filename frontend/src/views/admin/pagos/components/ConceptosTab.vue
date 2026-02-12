<template>
  <div>
    <h2>Conceptos de Pago</h2>

    <button @click="mostrarFormulario = !mostrarFormulario">
      + Nuevo Concepto
    </button>

    <div v-if="mostrarFormulario" class="form">
      <input v-model="form.nombre" placeholder="Nombre" />
      <textarea v-model="form.descripcion" placeholder="Descripción" />

      <select v-model="form.tipo">
        <option value="unico">Único</option>
        <option value="parcial">Parcialidades</option>
      </select>

      <input v-model="form.total" type="number" placeholder="Monto Total" />
      <input
        v-if="form.tipo === 'parcial'"
        v-model="form.mensualidades"
        type="number"
        placeholder="Número de parcialidades"
      />

      <button>Guardar</button>
    </div>

    <hr />

    <!-- Aquí irá la tabla -->
    <p>Aquí se listarán los conceptos...</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mostrarFormulario = ref(false)

const form = ref({
  nombre: '',
  descripcion: '',
  tipo: 'unico',
  total: 0,
  mensualidades: 1
})
</script>
