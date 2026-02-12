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
const UsuariosIndex = () => import('@/views/admin/usuarios/UsuariosIndex.vue')
const UsuarioForm = () => import('@/views/admin/usuarios/UsuarioForm.vue')
const ActiveEventsView = () => import('@/views/admin/eventos/ActiveEventsView.vue')
const ActiveNewsView = () => import('@/views/admin/noticias/ActiveNewsView.vue')
const PaymentsView = () => import('@/views/admin/pagos/AdminPagosView.vue')
const PaymentsConceptsView = () => import('@/views/admin/pagos/components/ConceptosTab.vue')
const PaymentsUserView = () => import('@/views/admin/pagos/components/PagosUsuariosTab.vue')

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },


  {
    path: '/',
    name: 'root',
    beforeEnter: (to, from, next) => {
      const token = localStorage.getItem('colonia_token')


      if (!token) {
        return next('/login')
      }

      let user  = null

      try {
        user = jwtDecode(token)
      } catch(error){
        return next('/login')
      }

      if (user?.rol === 'admin') {
        return next('/admin/')
      }

      return next('/balance')
    }
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
  },


    // Rutas admin
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/admin/usuarios' },
      { path: 'usuarios', component: UsuariosIndex },
      { path: 'usuarios/create', component: UsuarioForm },
      { path: 'usuarios/:id/edit', component: UsuarioForm },
      { path: 'eventos', component: ActiveEventsView },
      { path: 'noticias', component: ActiveNewsView },
      { path: 'pagos', component: PaymentsView },
      { path: 'pagos/conceptos', component: PaymentsConceptsView },
      { path: 'pagos/abonar', component: PaymentsUserView  }
    ]
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
    return next('/login')
  }

  next()
})

export default router
