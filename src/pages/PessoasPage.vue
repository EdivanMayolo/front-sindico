<template>
  <q-page padding>
    <!-- Mesmo formato em todas as telas: título, botão Novo, busca e tabela -->
    <div class="row items-center q-mb-md">
      <div class="text-h5">Pessoas</div>
      <q-space />
      <q-btn
        v-if="isAdmin"
        color="primary"
        icon="add"
        label="Nova pessoa"
        unelevated
        @click="abrirForm(null)"
      />
    </div>

    <q-table
      :rows="pessoas"
      :columns="colunas"
      row-key="id_pessoa"
      :filter="busca"
      :loading="carregando"
      :grid="$q.screen.xs"
      flat
      bordered
      no-data-label="Nenhuma pessoa cadastrada."
      no-results-label="Nenhuma pessoa encontrada."
      :rows-per-page-options="[10, 25, 50, 0]"
      @row-click="(evt, row) => abrirDetalhe(row)"
    >
      <template #top>
        <q-input v-model="busca" class="col-12 col-sm-6" dense outlined placeholder="Buscar">
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-space />
        <q-toggle v-model="mostrarInativas" label="Mostrar inativas" @update:model-value="carregar" />
      </template>

      <template #body-cell-ativo="props">
        <q-td :props="props">
          <q-badge :color="props.row.ativo ? 'positive' : 'grey'">
            {{ props.row.ativo ? 'Ativa' : 'Inativa' }}
          </q-badge>
        </q-td>
      </template>
    </q-table>

    <!-- Detalhe da pessoa (17A): dados + apartamentos ligados a ela -->
    <q-dialog v-model="detalheAberto">
      <q-card v-if="pessoa" class="full-width">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ pessoa.nome }}</div>
          <q-space />
          <q-btn v-close-popup flat round dense icon="close" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list dense>
            <q-item>
              <q-item-section avatar><q-icon name="badge" /></q-item-section>
              <q-item-section>CPF: {{ cpf(pessoa.cpf) }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="phone" /></q-item-section>
              <q-item-section>{{ pessoa.telefone }}</q-item-section>
            </q-item>
            <q-item v-if="pessoa.email">
              <q-item-section avatar><q-icon name="email" /></q-item-section>
              <q-item-section>{{ pessoa.email }}</q-item-section>
            </q-item>
            <q-item v-if="pessoa.endereco">
              <q-item-section avatar><q-icon name="place" /></q-item-section>
              <q-item-section>{{ pessoa.endereco }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Apartamentos</div>
          <div v-if="!pessoa.vinculos.length" class="text-grey-7">
            Nenhum vínculo ativo com apartamento.
          </div>
          <q-list v-else bordered separator>
            <q-item
              v-for="v in pessoa.vinculos"
              :key="v.id_vinculo"
              v-close-popup
              clickable
              :to="`/apartamentos/${v.id_apartamento}`"
            >
              <q-item-section avatar>
                <q-icon name="apartment" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Apartamento {{ nomeApto(v) }}</q-item-label>
                <q-item-label caption>
                  {{ tipoVinculo(v.tipo_vinculo) }} desde {{ dataBr(v.data_inicio) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge v-if="v.reside" color="positive">Mora aqui</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions v-if="isAdmin" align="right">
          <q-btn flat color="negative" icon="delete" label="Excluir" @click="excluir" />
          <q-btn
            unelevated
            color="primary"
            icon="edit"
            label="Editar"
            @click="abrirForm(pessoa)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <PessoaForm v-model="formAberto" :pessoa="pessoaEditada" @salvo="salvo" />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import PessoaService from 'src/services/PessoaService'
import PessoaForm from 'src/components/PessoaForm.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { cpf, dataBr, nomeApto, tipoVinculo } from 'src/utils/formatar'

export default defineComponent({
  name: 'PessoasPage',

  components: { PessoaForm },

  data() {
    return {
      pessoas: [],
      busca: '',
      mostrarInativas: false,
      carregando: false,
      detalheAberto: false,
      pessoa: null,
      formAberto: false,
      pessoaEditada: null,
      // Só as colunas essenciais; o resto fica no detalhe
      colunas: [
        { name: 'nome', label: 'Nome', field: 'nome', align: 'left', sortable: true },
        { name: 'cpf', label: 'CPF', field: 'cpf', align: 'left', format: cpf },
        { name: 'telefone', label: 'Telefone', field: 'telefone', align: 'left' },
        // O "format" é o texto do modo cartão (celular); na tabela aparece o selo colorido
        {
          name: 'ativo',
          label: 'Situação',
          field: 'ativo',
          align: 'center',
          format: (v) => (v ? 'Ativa' : 'Inativa'),
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
    cpf,
    dataBr,
    nomeApto,
    tipoVinculo,

    async carregar() {
      this.carregando = true
      try {
        const params = this.mostrarInativas ? {} : { ativo: true }
        const response = await PessoaService.listar(params)
        this.pessoas = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.carregando = false
      }
    },

    async abrirDetalhe(row) {
      try {
        const response = await PessoaService.buscarPorId(row.id_pessoa)
        this.pessoa = response.data.data
        this.detalheAberto = true
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      }
    },

    abrirForm(pessoa) {
      this.pessoaEditada = pessoa
      this.formAberto = true
    },

    salvo() {
      this.detalheAberto = false
      this.carregar()
    },

    // A API decide: sem histórico exclui; com histórico só inativa; com vínculo ativo bloqueia
    excluir() {
      this.$q
        .dialog({
          title: 'Excluir pessoa',
          message: `Excluir ${this.pessoa.nome}? Se ela tiver histórico de vínculos com apartamentos, será apenas inativada.`,
          cancel: { flat: true, label: 'Cancelar' },
          ok: { color: 'negative', unelevated: true, label: 'Excluir' },
          persistent: true,
        })
        .onOk(async () => {
          try {
            const response = await PessoaService.excluir(this.pessoa.id_pessoa)
            this.$q.notify({ type: 'positive', message: response.data.message })
            this.detalheAberto = false
            this.carregar()
          } catch (err) {
            this.$q.notify({ type: 'negative', message: mensagemErro(err) })
          }
        })
    },
  },
})
</script>
