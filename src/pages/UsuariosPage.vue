<template>
  <q-page padding>
    <!-- Mesmo formato das outras telas: título, botão Novo, busca e tabela -->
    <div class="row items-center q-mb-md">
      <div class="text-h5">Usuários</div>
      <q-space />
      <q-btn color="primary" icon="add" label="Novo usuário" unelevated @click="abrirForm(null)" />
    </div>

    <!-- Mostra todos (ativos e inativos): costumam ser poucos -->
    <q-table
      :rows="usuarios"
      :columns="colunas"
      row-key="id_usuario"
      :filter="busca"
      :loading="carregando"
      :grid="$q.screen.xs"
      flat
      bordered
      no-data-label="Nenhum usuário cadastrado."
      no-results-label="Nenhum usuário encontrado."
      :rows-per-page-options="[10, 25, 50, 0]"
      @row-click="(evt, row) => abrirForm(row)"
    >
      <template #top>
        <q-input v-model="busca" class="col-12 col-sm-6" dense outlined placeholder="Buscar">
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template #body-cell-ativo="props">
        <q-td :props="props">
          <q-badge :color="props.row.ativo ? 'positive' : 'grey'">
            {{ props.row.ativo ? 'Ativo' : 'Inativo' }}
          </q-badge>
        </q-td>
      </template>
    </q-table>

    <UsuarioForm v-model="formAberto" :usuario="usuarioEditado" @salvo="carregar" />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import UsuarioService from 'src/services/UsuarioService'
import UsuarioForm from 'src/components/UsuarioForm.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { perfil } from 'src/utils/formatar'

export default defineComponent({
  name: 'UsuariosPage',

  components: { UsuarioForm },

  data() {
    return {
      usuarios: [],
      busca: '',
      carregando: false,
      formAberto: false,
      usuarioEditado: null,
      colunas: [
        { name: 'nome', label: 'Nome', field: 'nome', align: 'left', sortable: true },
        { name: 'email', label: 'E-mail', field: 'email', align: 'left' },
        { name: 'perfil', label: 'Perfil', field: 'perfil', align: 'left', format: perfil },
        // O "format" é o texto do modo cartão (celular); na tabela aparece o selo colorido
        {
          name: 'ativo',
          label: 'Situação',
          field: 'ativo',
          align: 'center',
          format: (v) => (v ? 'Ativo' : 'Inativo'),
        },
      ],
    }
  },

  mounted() {
    this.carregar()
  },

  methods: {
    async carregar() {
      this.carregando = true
      try {
        const response = await UsuarioService.listar()
        this.usuarios = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },

    abrirForm(usuario) {
      this.usuarioEditado = usuario
      this.formAberto = true
    },
  },
})
</script>
