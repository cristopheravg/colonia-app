import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from './init';

const messaging = getMessaging(app);

// Función para esperar a que el SW esté realmente activo
const waitForServiceWorkerActivation = async () => {
  // Primero, asegurarnos de que el SW esté registrado
  let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
  
  if (!registration) {
    console.log('Registrando Service Worker por primera vez...');
    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
  }
  
  console.log('Estado del Service Worker:', {
    installing: !!registration.installing,
    waiting: !!registration.waiting,
    active: !!registration.active
  });
  
  // Si hay un SW en instalación o esperando, esperamos a que se active
  if (registration.installing) {
    console.log('Service Worker instalándose...');
    await new Promise((resolve) => {
      const sw = registration.installing;
      sw.addEventListener('statechange', (e) => {
        console.log('Estado del SW cambiado a:', e.target.state);
        if (e.target.state === 'activated') {
          resolve();
        }
      });
    });
  } else if (registration.waiting && !registration.active) {
    console.log('Service Worker en espera, forzando activación...');
    // Forzar la activación del SW en espera
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    await new Promise((resolve) => {
      const sw = registration.waiting;
      sw.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
          resolve();
        }
      });
    });
  }
  
  return registration;
};

export const requestNotificationPermission = async () => {
  try {
    console.log('🔍 Verificando soporte de notificaciones...');
    
    // Verificar soporte del navegador
    if (!('Notification' in window)) {
      throw new Error('Este navegador no soporta notificaciones');
    }
    
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker no soportado');
    }
    
    console.log('✅ Navegador compatible');
    console.log('Solicitando permiso de notificaciones...');
    
    const permission = await Notification.requestPermission();
    console.log('Permiso:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Permiso concedido');
      
      // PASO 1: Asegurar que el Service Worker esté activo
      console.log('Verificando Service Worker...');
      const registration = await waitForServiceWorkerActivation();
      console.log('✅ Service Worker listo:', registration.active ? 'activo' : 'inactivo');
      
      // Pequeña pausa para asegurar estabilidad
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // PASO 2: Obtener token FCM
      console.log('Obteniendo token FCM con VAPID:', 
        import.meta.env.VITE_FIREBASE_VAPID_KEY.substring(0, 20) + '...');
      
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (token) {
        console.log('✅✅✅ Token FCM obtenido EXITOSAMENTE:', token);
        
        // Guardar token localmente para depuración
        localStorage.setItem('fcm_token', token);
        localStorage.setItem('fcm_token_date', new Date().toISOString());
        
        return { success: true, token };
      } else {
        console.log('⚠️ Token vacío - posible problema de red');
        return { success: false, error: 'Token vacío' };
      }
    } else {
      console.log('❌ Permiso denegado por usuario');
      return { success: false, error: 'Permiso denegado' };
    }
  } catch (error) {
    console.error('❌❌❌ Error DETALLADO:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Mensajes de error más específicos
    if (error.message.includes('push service error')) {
      console.error('🔴 Error del servicio push - Posibles causas:');
      console.error('  1. Problema de red/bloqueo');
      console.error('  2. Firebase no puede contactar con el servicio FCM');
      console.error('  3. La clave VAPID no es válida para este dominio');
      console.error('  4. El navegador bloquea el servicio push');
    }
    
    return { success: false, error: error.message };
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📨 Mensaje recibido en primer plano:', payload);
      resolve(payload);
    });
  });