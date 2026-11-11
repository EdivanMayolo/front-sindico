<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <!-- Barra e menu não saem no papel (print-hide). Ao imprimir, os dois também se fecham,
         para a página não ficar com o espaço deles em branco (imprimindo). -->
    <q-header elevated class="print-hide" :model-value="!imprimindo">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="menuAberto = !menuAberto" />

        <!-- Mesma marca do login e da tela inicial -->
        <q-toolbar-title>
          <q-icon name="apartment" class="q-mr-sm" />
          CondoSimples
        </q-toolbar-title>

        <!-- Perfil de quem está logado: a troca entre ADMIN e Consulta fica visível -->
        <q-badge
          v-if="usuario && $q.screen.gt.xs"
          :color="usuario.perfil === 'ADMIN' ? 'orange' : 'green'"
          :label="usuario.perfil === 'ADMIN' ? 'ADMIN' : 'CONSULTA'"
        />

        <!-- No celular mostra só o ícone, para não apertar a barra.
             "usuario?." porque, ao clicar em Sair, o menu ainda se redesenha (fechando) sem usuário -->
        <q-btn flat no-caps icon="account_circle" :label="$q.screen.gt.xs ? usuario?.nome : ''">
          <q-menu>
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label>{{ usuario?.nome }}</q-item-label>
                  <q-item-label caption>{{ usuario?.email }}</q-item-label>
                  <q-item-label caption>Perfil: {{ perfil(usuario?.perfil) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item v-close-popup clickable @click="senhaAberta = true">
                <q-item-section avatar>
                  <q-icon name="key" />
                </q-item-section>
                <q-item-section>Trocar minha senha</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="sair">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Sair</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Menu lateral: fixo no computador e no tablet deitado; botão ☰ no celular (RNF02) -->
    <q-drawer v-model="menuAberto" show-if-above bordered class="print-hide">
      <q-list>
        <!-- Itens agrupados por assunto, cada grupo com o seu título -->
        <template v-for="grupo in gruposVisiveis" :key="grupo.titulo">
          <q-item-label v-if="grupo.titulo" header>{{ grupo.titulo }}</q-item-label>

          <!-- Item destacado também nas telas "filhas" (ex.: /apartamentos/1 destaca Apartamentos) -->
          <q-item
            v-for="item in grupo.itens"
            :key="item.to"
            clickable
            :to="item.to"
            :active="estaAtivo(item)"
          >
            <q-item-section avatar>
              <q-icon :name="item.icone" />
            </q-item-section>
            <q-item-section>{{ item.titulo }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <SenhaForm v-model="senhaAberta" />
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import SenhaForm from 'src/components/SenhaForm.vue'
import { perfil } from 'src/utils/formatar'

// Itens do menu, em grupos (o título do grupo aparece no menu; sem título = sem cabeçalho).
// "perfis" limita quem vê o item (sem "perfis" = todos).
const MENU = [
  {
    titulo: '',
    itens: [{ titulo: 'Início', icone: 'home', to: '/' }],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { titulo: 'Apartamentos', icone: 'apartment', to: '/apartamentos' },
      { titulo: 'Pessoas', icone: 'people', to: '/pessoas' },
    ],
  },
  {
    titulo: 'Mês a mês',
    itens: [
      { titulo: 'Despesas', icone: 'receipt_long', to: '/despesas' },
      { titulo: 'Leitura de gás', icone: 'local_fire_department', to: '/leituras-gas' },
      { titulo: 'Faturas', icone: 'request_quote', to: '/faturas' },
    ],
  },
  {
    titulo: 'Financeiro',
    itens: [
      { titulo: 'Receitas', icone: 'savings', to: '/receitas' },
      { titulo: 'Financeiro', icone: 'account_balance', to: '/financeiro' },
    ],
  },
  {
    titulo: 'Sistema',
    itens: [{ titulo: 'Usuários', icone: 'manage_accounts', to: '/usuarios', perfis: ['ADMIN'] }],
  },
]

export default defineComponent({
  name: 'MainLayout',

  components: { SenhaForm },

  data() {
    return {
      menuAberto: false,
      senhaAberta: false,
      imprimindo: false,
      menuAntesDeImprimir: false,
    }
  },

  computed: {
    ...mapState(useAuthStore, ['usuario']),

    // Só os itens que o perfil pode ver; grupo que fica vazio some (ex.: "Sistema" para Consulta)
    gruposVisiveis() {
      return MENU.map((grupo) => ({
        titulo: grupo.titulo,
        itens: grupo.itens.filter(
          (item) => !item.perfis || item.perfis.includes(this.usuario?.perfil),
        ),
      })).filter((grupo) => grupo.itens.length)
    },
  },

  // Impressão (esboço da fatura): pelo botão Imprimir ou pelo Ctrl+P
  mounted() {
    window.addEventListener('beforeprint', this.antesDeImprimir)
    window.addEventListener('afterprint', this.depoisDeImprimir)
  },

  beforeUnmount() {
    window.removeEventListener('beforeprint', this.antesDeImprimir)
    window.removeEventListener('afterprint', this.depoisDeImprimir)
  },

  methods: {
    ...mapActions(useAuthStore, { sairDaStore: 'sair' }),

    perfil,

    antesDeImprimir() {
      this.menuAntesDeImprimir = this.menuAberto
      this.menuAberto = false
      this.imprimindo = true
    },

    depoisDeImprimir() {
      this.menuAberto = this.menuAntesDeImprimir
      this.imprimindo = false
    },

    estaAtivo(item) {
      return item.to === '/' ? this.$route.path === '/' : this.$route.path.startsWith(item.to)
    },

    sair() {
      this.sairDaStore()
      this.$router.push('/login')
    },
  },
})
</script>
