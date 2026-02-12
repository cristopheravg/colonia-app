<template>
  <div class="admin-pagos">
    <h1>Gestión de Pagos</h1>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="{ active: activeTab === 'conceptos' }"
        @click="activeTab = 'conceptos'"
      >
        Conceptos
      </button>

      <button
        :class="{ active: activeTab === 'usuarios' }"
        @click="activeTab = 'usuarios'"
      >
        Pagos por Usuario
      </button>
    </div>

    <!-- CONTENIDO -->
    <div class="tab-content">
      <ConceptosTab v-if="activeTab === 'conceptos'" />
      <PagosUsuariosTab v-if="activeTab === 'usuarios'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ConceptosTab from './components/ConceptosTab.vue'
import PagosUsuariosTab from './components/PagosUsuariosTab.vue'

const activeTab = ref('conceptos')
</script>

<style scoped>
.admin-pagos {
  padding: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  padding: 8px 16px;
  cursor: pointer;
}

.tabs .active {
  background-color: #333;
  color: white;
}
</style>
