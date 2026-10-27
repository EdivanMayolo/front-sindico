<template>
  <q-layout>
    <q-page-container>
      <q-page class="row items-center justify-center bg-grey-2 q-pa-md">
        <q-card class="col-12 col-sm-8 col-md-4">
          <q-card-section class="text-center">
            <q-icon name="apartment" size="56px" color="primary" />
            <div class="text-h5 q-mt-sm">CondoSimples</div>
            <div class="text-subtitle2 text-grey-7">Autogestão condominial</div>
          </q-card-section>

          <q-card-section>
            <q-form class="q-gutter-md" @submit="entrar">
              <q-input
                v-model="email"
                type="email"
                label="E-mail"
                outlined
                autofocus
                lazy-rules
                :rules="[(v) => !!v || 'Informe o e-mail']"
              >
                <template #prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-input
                v-model="senha"
                :type="mostrarSenha ? 'text' : 'password'"
                label="Senha"
                outlined
                lazy-rules
                :rules="[(v) => !!v || 'Informe a senha']"
              >
                <template #prepend>
                  <q-icon name="lock" />
                </template>
                <template #append>
                  <q-icon
                    :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="mostrarSenha = !mostrarSenha"
                  >
                    <q-tooltip>{{ mostrarSenha ? 'Esconder senha' : 'Mostrar senha' }}</q-tooltip>
                  </q-icon>
                </template>
              </q-input>

              <q-btn
                type="submit"
                label="Entrar"
                color="primary"
                size="lg"
                class="full-width"
                unelevated
                :loading="carregando"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import { mapActions } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import mensagemErro from 'src/utils/mensagemErro'

export default defineComponent({
  name: 'LoginPage',

  data() {
    return {
      email: '',
      senha: '',
      mostrarSenha: false,
      carregando: false,
    }
  },

  methods: {
    ...mapActions(useAuthStore, { entrarNaStore: 'entrar' }),

    async entrar() {
      this.carregando = true
      try {
        await this.entrarNaStore({ email: this.email, senha: this.senha })
        this.$router.push('/')
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },
  },
})
</script>
