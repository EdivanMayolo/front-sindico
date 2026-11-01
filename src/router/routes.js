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
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'pessoas', component: () => import('pages/PessoasPage.vue') },
      { path: 'apartamentos', component: () => import('pages/ApartamentosPage.vue') },
      // Parâmetro :id → this.$route.params.id na página (aula de Router)
      { path: 'apartamentos/:id', component: () => import('pages/ApartamentoDetalhePage.vue') },
      { path: 'despesas', component: () => import('pages/DespesasPage.vue') },
      { path: 'leituras-gas', component: () => import('pages/LeituraGasPage.vue') },
      {
        path: 'usuarios',
        component: () => import('pages/UsuariosPage.vue'),
        meta: { perfis: ['ADMIN'] },
      },
    ],
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
