<template>
  <div class="card-grid">

    <router-link 
      to="/admin/pagos/conceptos" 
      class="card"
    >
      <h3>Conceptos</h3>
      <p>Crear y administrar cuotas</p>
    </router-link>

    <router-link 
      :to="{ name: 'admin-pagos-usuario' }"
      class="card"
    >
      <h3>Usuarios</h3>
      <p>Consultar estado y registrar pagos</p>
    </router-link>

  </div>
</template>



<style scoped>
.card-grid {
  display: grid;
  gap: 16px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 14px;
  text-decoration: none;
  color: #0f172a;
  box-shadow: 0 4px 12px rgba(15,23,42,0.05);
  transition: 0.2s;
}

.card:hover {
  transform: translateY(-4px);
}
</style>
