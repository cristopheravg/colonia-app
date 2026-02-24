<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Colonia App iniciada')


  // Prevenir Ctrl+C, Ctrl+U, Ctrl+S, etc.
  document.addEventListener('keydown', (e) => {
    // Prevenir Ctrl+C, Ctrl+X, Ctrl+U, Ctrl+S, F12
    if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'u' || e.key === 's')) {
      e.preventDefault();
      return false;
    }
    
    // Prevenir F12 (abrir devtools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Prevenir Ctrl+Shift+I (abrir devtools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    
    // Prevenir Ctrl+Shift+J (abrir devtools)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
  });

  // Prevenir menú contextual (botón derecho)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });



})

</script>



