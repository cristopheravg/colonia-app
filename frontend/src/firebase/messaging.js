// firebase/messaging.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Detectar si es móvil
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Función para esperar SW con timeout
const waitForServiceWorker = async (timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      
      if (!registration) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
      }
      
      if (registration.active) {
        return registration;
      }
      
      // Esperar un poco antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.log('Error SW, reintentando...', e.message);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error('Timeout esperando Service Worker');
};

// Función específica para móviles
const requestMobilePermission = async () => {
  console.log('📱 Modo móvil detectado, usando estrategia especial');
  
  // En Android, a veces necesitamos un pequeño retraso
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Verificar si ya tenemos permiso
    if (Notification.permission === 'granted') {
      console.log('✅ Permiso ya concedido en móvil');
      return 'granted';
    }
    
    // En móvil, el requestPermission debe ser iniciado por acción del usuario
    console.log('📱 Solicitando permiso en móvil...');
    const permission = await Notification.requestPermission();
    console.log('📱 Resultado permiso móvil:', permission);
    
    return permission;
  } catch (error) {
    console.error('❌ Error en móvil:', error);
    return 'denied';
  }
};

// Función principal
export const requestNotificationPermission = async () => {
  try {
    console.log('🔍 Iniciando solicitud de permisos...');
    console.log('📱 Es móvil?', isMobile());
    
    // Verificar soporte
    if (!('Notification' in window)) {
      throw new Error('Notificaciones no soportadas');
    }
    
    // Solicitar permiso (con estrategia especial para móvil)
    let permission;
    if (isMobile()) {
      permission = await requestMobilePermission();
    } else {
      permission = await Notification.requestPermission();
    }
    
    console.log('✅ Permiso obtenido:', permission);
    
    if (permission !== 'granted') {
      return { 
        success: false, 
        error: permission === 'denied' ? 'Permiso denegado' : 'Permiso no concedido'
      };
    }
    
    // Esperar Service Worker con timeout
    console.log('⏳ Esperando Service Worker...');
    const registration = await waitForServiceWorker();
    console.log('✅ Service Worker listo');
    
    // Pequeña pausa extra para móvil
    if (isMobile()) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Obtener token
    console.log('🔑 Solicitando token FCM...');
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      console.log('✅ Token obtenido:', token.substring(0, 30) + '...');
      
      // Guardar en localStorage
      localStorage.setItem('fcm_token', token);
      localStorage.setItem('fcm_token_date', new Date().toISOString());
      
      return { success: true, token };
    } else {
      throw new Error('Token vacío');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📨 Mensaje recibido:', payload);
      resolve(payload);
    });
  });