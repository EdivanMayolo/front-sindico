// Rotas do sistema. Proteção pelo "meta" (como na aula de Router):
//   meta: { publica: true }        → não precisa de login
//   meta: { perfis: ['ADMIN'] }    → só os perfis da lista entram
//   sem meta                       → qualquer usuário logado
const routes = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
    meta: { publica: true },
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: { publica: true },
  },
]

export default routes
