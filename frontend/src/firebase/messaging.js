import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from './init';

const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    console.log('Solicitando permiso de notificaciones...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permiso concedido, obteniendo token...');
      
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
      
      console.log('✅ Token FCM obtenido:', token);
      return { success: true, token };
    } else {
      console.log('❌ Permiso denegado');
      return { success: false, error: 'Permiso denegado' };
    }
  } catch (error) {
    console.error('❌ Error:', error);
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