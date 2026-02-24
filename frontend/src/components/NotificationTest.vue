<template>
  <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
    <button 
      @click="requestPermission"
      :disabled="loading"
      style="
        background-color: #1976d2;
        color: white;
        border: none;
        padding: 15px 25px;
        border-radius: 50px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      "
    >
      {{ loading ? 'Activando...' : '🔔 Activar Notificaciones' }}
    </button>
    
    <div v-if="token" style="margin-top: 10px; color: #4caf50; background: white; padding: 10px; border-radius: 4px;">
      ✅ Notificaciones activadas
    </div>
    
    <div v-if="error" style="margin-top: 10px; color: #f44336; background: white; padding: 10px; border-radius: 4px;">
      ❌ Error: {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { requestNotificationPermission } from '@/firebase/messaging';

const loading = ref(false);
const token = ref(null);
const error = ref(null);

const requestPermission = async () => {
  loading.value = true;
  error.value = null;
  
  const result = await requestNotificationPermission();
  
  if (result.success) {
    token.value = result.token;
    console.log('✅ Token guardado:', result.token);
  } else {
    error.value = result.error;
  }
  
  loading.value = false;
};
</script>