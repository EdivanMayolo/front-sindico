<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">Apartamentos</div>
      <q-space />
      <q-btn
        v-if="isAdmin"
        color="primary"
        icon="add"
        label="Novo apartamento"
        unelevated
        @click="formAberto = true"
      />
    </div>

    <q-table
      :rows="apartamentos"
      :columns="colunas"
      row-key="id_apartamento"
      :filter="busca"
      :loading="carregando"
      :grid="$q.screen.xs"
      flat
      bordered
      no-data-label="Nenhum apartamento cadastrado."
      no-results-label="Nenhum apartamento encontrado."
      :rows-per-page-options="[10, 25, 50, 0]"
      @row-click="(evt, row) => $router.push(`/apartamentos/${row.id_apartamento}`)"
    >
      <template #top>
        <q-input v-model="busca" class="col-12 col-sm-6" dense outlined placeholder="Buscar">
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-space />
        <q-toggle v-model="mostrarInativos" label="Mostrar inativos" @update:model-value="carregar" />
      </template>

      <template #body-cell-ativo="props">
        <q-td :props="props">
          <q-badge :color="props.row.ativo ? 'positive' : 'grey'">
            {{ props.row.ativo ? 'Ativo' : 'Inativo' }}
          </q-badge>
        </q-td>
      </template>
    </q-table>

    <ApartamentoForm v-model="formAberto" @salvo="abrirNovo" />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import ApartamentoService from 'src/services/ApartamentoService'
import ApartamentoForm from 'src/components/ApartamentoForm.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { nomeApto } from 'src/utils/formatar'

export default defineComponent({
  name: 'ApartamentosPage',

  components: { ApartamentoForm },

  data() {
    return {
      apartamentos: [],
      busca: '',
      mostrarInativos: false,
      carregando: false,
      formAberto: false,
      colunas: [
        {
          name: 'apto',
          label: 'Apartamento',
          field: (row) => nomeApto(row),
          align: 'left',
          sortable: true,
        },
        { name: 'andar', label: 'Andar', field: 'andar', align: 'left', format: (v) => v || '—' },
        {
          name: 'proprietarios',
          label: 'Proprietário(s)',
          field: 'proprietarios',
          align: 'left',
          format: (v) => v || '—',
        },
        {
          name: 'moradores',
          label: 'Morador(es)',
          field: 'moradores',
          align: 'left',
          format: (v) => v || '—',
        },
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

  computed: {
    ...mapState(useAuthStore, ['isAdmin']),
  },

  mounted() {
    this.carregar()
  },

  methods: {
    async carregar() {
      this.carregando = true
      try {
        const params = this.mostrarInativos ? {} : { ativo: true }
        const response = await ApartamentoService.listar(params)
        this.apartamentos = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },

    // Depois de cadastrar, abre o apartamento novo (para conferir e incluir moradores)
    abrirNovo(apartamento) {
      this.$router.push(`/apartamentos/${apartamento.id_apartamento}`)
    },
  },
})
</script>
