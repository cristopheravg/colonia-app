import { createRouter, createWebHistory } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
//import ActiveEventsView from '@/views/admin/eventos/ActiveEventsView.vue'


//Vecino views
const LoginView = () => import('@/views/auth/LoginView.vue')
const DashboardView = () => import('@/views/vecino/DashboardView.vue')
const NewsView = () => import('@/views/vecino/NewsView.vue')
const EventsView = () => import('@/views/vecino/EventsView.vue')
const BalanceView = () => import('@/views/vecino/BalanceView.vue')
const QRView = () => import('@/views/vecino/QRView.vue')

// Admin views
const AdminLayout = () => import('@/views/admin/AdminLayout.vue')
const UsuariosIndex = () => import('@/views/admin/usuarios/ListaUsuarios.vue')
const ActiveEventsView = () => import('@/views/admin/eventos/ActiveEventsView.vue')
const ActiveNewsView = () => import('@/views/admin/noticias/ActiveNewsView.vue')

const AsistenciasView = () => import('@/views/admin/asistencia/RegistroAsistenciaView.vue')


const AdminPagosView = ()  => import('@/views/admin/pagos/AdminPagosView.vue')
const ConceptosView = () => import('@/views/admin/pagos/ConceptosView.vue')
const UsuariosPagosView = () => import('@/views/admin/pagos/UsuariosPagosView.vue')


const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },


  { path: '/', name: 'root', beforeEnter: (to, from, next) => {
      const token = localStorage.getItem('colonia_token')
      if (!token) return next('/login')
      
      try {
        const user = jwtDecode(token)
        if (user?.rol === 'admin') return next('/admin')
        if (user?.rol === 'vecino') return next('/balance')
      } catch {
        return next('/login')
      }
      next()
  }},



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
  },


    // Rutas admin
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/usuarios' },
      { path: 'usuarios', component: UsuariosIndex },
      { path: 'eventos', component: ActiveEventsView },
      { path: 'noticias', component: ActiveNewsView },
      { path: 'asistencias', component: AsistenciasView },

      // 🔹 PAGOS
      { path: 'pagos', component: AdminPagosView },
      { path: 'pagos/conceptos', component: ConceptosView },
      { path: 'pagos/usuario/:id?', name: 'admin-pagos-usuario', component: UsuariosPagosView, props: true }

    ]
  }


]

const router = createRouter({
  history: createWebHistory(),
  routes
})





router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('colonia_token')

  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  if (token) {
    let user = null
    try {
      user = jwtDecode(token)
    } catch {
      return next('/login')
    }

    // Evitar loops: si ya está en la ruta correcta, no redirigir
    if (to.path.startsWith('/admin') && user.rol !== 'admin') {
      return next('/balance')
    }

    if ((to.path === '/balance' || !to.path.startsWith('/admin')) && user.rol === 'admin') {
      return next('/admin')
    }
  }

  next()
})



export default router
