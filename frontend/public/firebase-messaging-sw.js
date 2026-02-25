importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyATwfJ0UqQUWM_NlUGBHX0xsYdI0-DNQA0',
  authDomain: 'notificaciones-paraje-app.firebaseapp.com',
  projectId: 'notificaciones-paraje-app',
  storageBucket: 'notificaciones-paraje-app.firebasestorage.app',
  messagingSenderId: '652067292975',
  appId: '1:652067292975:web:37848373dc98da6e6d83da',
  measurementId: 'G-188W1239W0'
});

const messaging = firebase.messaging();

// ✅ ESTE ES EL CÓDIGO NUEVO QUE DEBES AGREGAR
// Escuchar mensajes para activación inmediata del Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Forzando activación del Service Worker');
    self.skipWaiting();
  }
});

messaging.onBackgroundMessage((payload) => {
  console.log('Notificación en background:', payload);
  
  const notificationTitle = payload.notification.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: payload.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});