<template>
  <div class="scanner-container">
    <h2>Registrar asistencia</h2>

    <div id="reader"></div>

    <p v-if="mensaje">{{ mensaje }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { Html5Qrcode } from 'html5-qrcode'

const mensaje = ref('')
const eventoId = 1

onMounted(() => {
  const qr = new Html5Qrcode("reader")

  qr.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },

    async (decodedText) => {
      try {
        const token = localStorage.getItem('colonia_token')

        const api = axios.create({
          baseURL: '/api',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const res = await api.post('/asistencias/scan', {
          qr: decodedText,
          evento_id: eventoId
        })

        mensaje.value = res.data.message

      } catch (error) {
        mensaje.value =
          error.response?.data?.message || 'Error al registrar'
      }
    }
  )
})
</script>
