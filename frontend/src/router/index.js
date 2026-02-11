import { createRouter, createWebHistory } from 'vue-router'

const LoginView = () => import('@/views/auth/LoginView.vue')
const DashboardView = () => import('@/views/vecino/DashboardView.vue')
const NewsView = () => import('@/views/vecino/NewsView.vue')
const EventsView = () => import('@/views/vecino/EventsView.vue')
const BalanceView = () => import('@/views/vecino/BalanceView.vue')
const QRView = () => import('@/views/vecino/QRView.vue')

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/noticias',
    name: 'noticias',
    component: NewsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/eventos',
    name: 'eventos',
    component: EventsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/balance',
    name: 'balance',
    component: BalanceView,
    meta: { requiresAuth: true }
  },
  {
    path: '/qr',
    name: 'qr',
    component: QRView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de navegación
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('colonia_token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.name === 'login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
