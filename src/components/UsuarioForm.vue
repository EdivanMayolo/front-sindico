<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="preencher"
  >
    <q-card class="full-width">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ usuario ? 'Editar usuário' : 'Novo usuário' }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-form @submit="salvar">
        <q-card-section class="row q-col-gutter-md">
          <q-input
            v-model="form.nome"
            class="col-12"
            label="Nome *"
            outlined
            autofocus
            lazy-rules
            :rules="[(v) => !!v || 'Informe o nome']"
          />
          <q-input
            v-model="form.email"
            class="col-12"
            type="email"
            label="E-mail *"
            hint="Usado para entrar no sistema"
            autocomplete="off"
            outlined
            lazy-rules
            :rules="[(v) => emailValido(v) || 'Informe um e-mail válido']"
          />

          <!-- Senha só no cadastro; depois, pelo botão "Redefinir senha" -->
          <template v-if="!usuario">
            <SenhaInput
              v-model="form.senha"
              class="col-12 col-sm-6"
              label="Senha *"
              hint="Mínimo de 6 caracteres"
              :rules="[(v) => (v && v.length >= 6) || 'A senha deve ter pelo menos 6 caracteres']"
            />
            <SenhaInput
              v-model="form.confirmacao"
              class="col-12 col-sm-6"
              label="Confirmar senha *"
              :rules="[(v) => v === form.senha || 'As senhas não conferem']"
            />
          </template>

          <!-- O ADMIN não pode tirar o próprio acesso (25A): os campos ficam bloqueados -->
          <div class="col-12">
            <div class="text-subtitle2">Perfil</div>
            <q-option-group
              v-model="form.perfil"
              :options="PERFIS"
              :disable="ehVoce"
              color="primary"
            />
          </div>
          <div v-if="usuario" class="col-12">
            <q-toggle
              v-model="form.ativo"
              label="Usuário ativo (pode entrar no sistema)"
              color="positive"
              :disable="ehVoce"
            />
          </div>
          <div v-if="ehVoce" class="col-12 text-caption text-grey-7">
            Você não pode remover o seu próprio acesso de administrador.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <!-- A própria senha se troca pelo menu do usuário, no topo -->
          <q-btn
            v-if="usuario && !ehVoce"
            flat
            color="primary"
            icon="lock_reset"
            label="Redefinir senha"
            @click="senhaAberta = true"
          />
          <q-space />
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn type="submit" color="primary" label="Salvar" unelevated :loading="salvando" />
        </q-card-actions>
      </q-form>
    </q-card>

    <SenhaForm v-model="senhaAberta" :usuario="usuario" />
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import UsuarioService from 'src/services/UsuarioService'
import SenhaInput from 'src/components/SenhaInput.vue'
import SenhaForm from 'src/components/SenhaForm.vue'
import mensagemErro from 'src/utils/mensagemErro'

// Termos do dia a dia na tela (23A); a API continua recebendo ADMIN e COMUM
const PERFIS = [
  { label: 'Administrador — pode cadastrar e alterar tudo', value: 'ADMIN' },
  { label: 'Consulta — só consulta, não altera nada', value: 'COMUM' },
]

export default defineComponent({
  name: 'UsuarioForm',

  components: { SenhaInput, SenhaForm },

  props: {
    modelValue: { type: Boolean, default: false },
    // Usuário a editar; vazio = cadastro novo
    usuario: { type: Object, default: null },
  },

  emits: ['update:modelValue', 'salvo'],

  data() {
    return {
      PERFIS,
      form: {},
      salvando: false,
      senhaAberta: false,
    }
  },

  computed: {
    ...mapState(useAuthStore, { logado: 'usuario' }),

    // O ADMIN está editando o próprio cadastro?
    ehVoce() {
      return !!this.usuario && this.usuario.id_usuario === this.logado.id_usuario
    },
  },

  methods: {
    ...mapActions(useAuthStore, ['atualizarUsuario']),

    emailValido(v) {
      return /^\S+@\S+\.\S+$/.test(v || '')
    },

    preencher() {
      const u = this.usuario || {}
      this.form = {
        nome: u.nome || '',
        email: u.email || '',
        senha: '',
        confirmacao: '',
        // Cadastro novo começa como Consulta: dar o acesso de administrador é uma escolha
        perfil: u.perfil || 'COMUM',
        ativo: u.ativo ?? true,
      }
    },

    // Bloquear o acesso pede confirmação antes de salvar (20A)
    salvar() {
      if (this.usuario && this.usuario.ativo && !this.form.ativo) {
        this.$q
          .dialog({
            title: 'Bloquear acesso',
            message: `${this.form.nome} não vai mais conseguir entrar no sistema. O cadastro continua guardado e pode ser reativado depois. Confirma?`,
            cancel: { flat: true, label: 'Cancelar' },
            ok: { color: 'negative', unelevated: true, label: 'Bloquear' },
            persistent: true,
          })
          .onOk(() => this.gravar())
      } else {
        this.gravar()
      }
    },

    async gravar() {
      this.salvando = true
      try {
        const response = this.usuario
          ? await UsuarioService.alterar(this.usuario.id_usuario, {
              nome: this.form.nome,
              email: this.form.email,
              perfil: this.form.perfil,
              ativo: this.form.ativo,
            })
          : await UsuarioService.criar({
              nome: this.form.nome,
              email: this.form.email,
              senha: this.form.senha,
              perfil: this.form.perfil,
            })
        // Alterou o próprio nome ou e-mail: atualiza a barra do topo
        if (this.ehVoce) this.atualizarUsuario(response.data.data)
        this.$q.notify({ type: 'positive', message: 'Usuário salvo.' })
        this.$emit('salvo', response.data.data)
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
