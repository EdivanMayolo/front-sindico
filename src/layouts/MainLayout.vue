<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="menuAberto = !menuAberto" />

        <q-toolbar-title>CondoSimples</q-toolbar-title>

        <!-- No celular mostra só o ícone, para não apertar a barra -->
        <q-btn flat no-caps icon="account_circle" :label="$q.screen.gt.xs ? usuario.nome : ''">
          <q-menu>
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label>{{ usuario.nome }}</q-item-label>
                  <q-item-label caption>{{ usuario.email }}</q-item-label>
                  <q-item-label caption>
                    Perfil: {{ isAdmin ? 'Administrador' : 'Consulta' }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
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
    <q-drawer v-model="menuAberto" show-if-above bordered>
      <q-list>
        <q-item-label header>Menu</q-item-label>

        <q-item v-for="item in menuVisivel" :key="item.to" clickable :to="item.to" exact>
          <q-item-section avatar>
            <q-icon :name="item.icone" />
          </q-item-section>
          <q-item-section>{{ item.titulo }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from 'src/stores/auth'

// Itens do menu. "perfis" limita quem vê o item (sem "perfis" = todos).
// Cada parte do sistema acrescenta os seus itens aqui.
const MENU = [{ titulo: 'Início', icone: 'home', to: '/' }]

export default defineComponent({
  name: 'MainLayout',

  data() {
    return {
      menuAberto: false,
    }
  },

  computed: {
    ...mapState(useAuthStore, ['usuario', 'isAdmin']),

    menuVisivel() {
      return MENU.filter((item) => !item.perfis || item.perfis.includes(this.usuario.perfil))
    },
  },

  methods: {
    ...mapActions(useAuthStore, { sairDaStore: 'sair' }),

    sair() {
      this.sairDaStore()
      this.$router.push('/login')
    },
  },
})
</script>
