<template>
  <!-- Duas utilidades na mesma janela:
       sem "usuario" → Trocar minha senha (pede a senha atual);
       com "usuario" → o ADMIN redefine a senha de quem esqueceu -->
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center">
        <div>
          <div class="text-h6">{{ usuario ? 'Redefinir senha' : 'Trocar minha senha' }}</div>
          <div v-if="usuario" class="text-caption text-grey-7">{{ usuario.nome }}</div>
        </div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form @submit="salvar">
        <q-card-section class="row q-col-gutter-md">
          <SenhaInput
            v-if="!usuario"
            v-model="form.senha_atual"
            class="col-12"
            label="Senha atual *"
            autocomplete="current-password"
            :rules="[(v) => !!v || 'Informe a senha atual']"
          />
          <SenhaInput
            v-model="form.nova_senha"
            class="col-12 col-sm-6"
            label="Nova senha *"
            hint="Mínimo de 6 caracteres"
            :rules="[(v) => (v && v.length >= 6) || 'A senha deve ter pelo menos 6 caracteres']"
          />
          <!-- Digitar 2 vezes evita gravar uma senha com erro de digitação (22A) -->
          <SenhaInput
            v-model="form.confirmacao"
            class="col-12 col-sm-6"
            label="Confirmar nova senha *"
            :rules="[(v) => v === form.nova_senha || 'As senhas não conferem']"
          />
          <div v-if="usuario" class="col-12 text-caption text-grey-7">
            Informe a nova senha ao usuário. Ela pode ser trocada depois em "Trocar minha senha".
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn type="submit" color="primary" label="Salvar" unelevated :loading="salvando" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import AuthService from 'src/services/AuthService'
import UsuarioService from 'src/services/UsuarioService'
import SenhaInput from 'src/components/SenhaInput.vue'
import mensagemErro from 'src/utils/mensagemErro'

export default defineComponent({
  name: 'SenhaForm',

  components: { SenhaInput },

  props: {
    modelValue: { type: Boolean, default: false },
    // Usuário que terá a senha redefinida; vazio = a senha de quem está logado
    usuario: { type: Object, default: null },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      form: {},
      salvando: false,
    }
  },

  methods: {
    preencher() {
      this.form = { senha_atual: '', nova_senha: '', confirmacao: '' }
    },

    // Depois de trocar a própria senha continua logado (24A): o login atual continua valendo
    async salvar() {
      this.salvando = true
      try {
        const response = this.usuario
          ? await UsuarioService.redefinirSenha(this.usuario.id_usuario, {
              nova_senha: this.form.nova_senha,
            })
          : await AuthService.alterarMinhaSenha({
              senha_atual: this.form.senha_atual,
              nova_senha: this.form.nova_senha,
            })
        this.$q.notify({ type: 'positive', message: response.data.message })
        this.$emit('update:modelValue', false)
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.salvando = false
      }
    },
  },
})
</script>
