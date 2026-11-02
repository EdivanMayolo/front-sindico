<template>
  <q-page padding>
    <!-- Tela mestre/detalhe: o apartamento e os seus vínculos (8A / 14A) -->
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" to="/apartamentos">
        <q-tooltip>Voltar para a lista</q-tooltip>
      </q-btn>
      <div v-if="apartamento" class="text-h5 q-ml-sm">Apartamento {{ nomeApto(apartamento) }}</div>
      <q-badge
        v-if="apartamento"
        class="q-ml-md"
        :color="apartamento.ativo ? 'positive' : 'grey'"
        :label="apartamento.ativo ? 'Ativo' : 'Inativo'"
      />
    </div>

    <q-inner-loading :showing="carregando" />

    <div v-if="apartamento" class="row q-col-gutter-md">
      <!-- Dados do apartamento (Gestalt: proximidade — cada assunto no seu cartão) -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1">Dados</div>
          </q-card-section>
          <q-list dense>
            <q-item>
              <q-item-section>Número</q-item-section>
              <q-item-section side>{{ apartamento.numero }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Bloco</q-item-section>
              <q-item-section side>{{ apartamento.bloco || '—' }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Andar</q-item-section>
              <q-item-section side>{{ apartamento.andar || '—' }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Cadastrado em</q-item-section>
              <q-item-section side>{{ dataBr(apartamento.data_cadastro) }}</q-item-section>
            </q-item>
          </q-list>
          <q-card-actions v-if="isAdmin" align="right">
            <q-btn
              v-if="apartamento.ativo"
              flat
              color="negative"
              label="Inativar"
              @click="inativar"
            />
            <q-btn v-else flat color="positive" label="Reativar" @click="ativar" />
            <q-btn flat color="primary" icon="edit" label="Editar" @click="formApto = true" />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Vínculos ativos: proprietários e inquilinos -->
      <div class="col-12 col-md-8">
        <q-card flat bordered>
          <q-card-section class="row items-center">
            <div class="text-subtitle1">Proprietários e inquilinos</div>
            <q-space />
            <q-btn
              v-if="isAdmin"
              color="primary"
              icon="person_add"
              label="Adicionar"
              unelevated
              dense
              no-caps
              class="q-px-sm"
              @click="abrirVinculo(null)"
            />
          </q-card-section>

          <q-list separator>
            <q-item v-if="!apartamento.vinculos.length">
              <q-item-section class="text-grey-7">Nenhum vínculo ativo.</q-item-section>
            </q-item>
            <q-item v-for="v in apartamento.vinculos" :key="v.id_vinculo">
              <q-item-section avatar>
                <q-icon
                  :name="v.tipo_vinculo === 'PROPRIETARIO' ? 'vpn_key' : 'person'"
                  :color="v.tipo_vinculo === 'PROPRIETARIO' ? 'primary' : 'secondary'"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ v.nome }}</q-item-label>
                <q-item-label caption>
                  {{ tipoVinculo(v.tipo_vinculo) }} desde {{ dataBr(v.data_inicio) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center no-wrap">
                  <q-badge v-if="v.reside" color="positive" class="q-mr-sm">Mora aqui</q-badge>
                  <template v-if="isAdmin">
                    <q-btn flat round dense icon="edit" color="primary" @click="abrirVinculo(v)">
                      <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense icon="logout" color="negative" @click="encerrar(v)">
                      <q-tooltip>Encerrar vínculo</q-tooltip>
                    </q-btn>
                  </template>
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Histórico (RN08): vínculos encerrados continuam guardados -->
          <q-expansion-item icon="history" label="Vínculos encerrados" @show="carregarHistorico">
            <q-list separator>
              <q-item v-if="!historico.length">
                <q-item-section class="text-grey-7">Nenhum vínculo encerrado.</q-item-section>
              </q-item>
              <q-item v-for="v in historico" :key="v.id_vinculo">
                <q-item-section>
                  <q-item-label>{{ v.nome }}</q-item-label>
                  <q-item-label caption>
                    {{ tipoVinculo(v.tipo_vinculo) }} de {{ dataBr(v.data_inicio) }} até
                    {{ dataBr(v.data_fim) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </q-card>
      </div>

      <!-- Faturas do apartamento, mês a mês (RF17 / 56A); o clique abre o esboço -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1">Faturas</div>
          </q-card-section>
          <q-list separator>
            <q-item v-if="!faturas.length">
              <q-item-section class="text-grey-7">Nenhuma fatura gerada.</q-item-section>
            </q-item>
            <q-item
              v-for="f in faturas"
              :key="f.id_fatura"
              clickable
              :to="`/faturas/${f.id_fatura}`"
            >
              <q-item-section avatar><q-icon name="request_quote" /></q-item-section>
              <q-item-section>
                <q-item-label
                  >Referente a {{ mesAno(f.mes_referencia, f.ano_referencia) }}</q-item-label
                >
                <q-item-label caption>
                  Cobrança em {{ mesCobranca(f.mes_referencia, f.ano_referencia) }} ·
                  {{ f.quantidade_itens }} itens
                </q-item-label>
              </q-item-section>
              <q-item-section side class="text-weight-bold">
                {{ dinheiro(f.valor_total) }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <ApartamentoForm v-model="formApto" :apartamento="apartamento" @salvo="carregar" />
    <VinculoForm
      v-if="apartamento"
      v-model="formVinculo"
      :id-apartamento="apartamento.id_apartamento"
      :vinculo="vinculoEditado"
      @salvo="carregar"
    />

    <!-- Encerrar vínculo: confirma e pergunta a data de fim -->
    <q-dialog v-model="encerrarAberto" persistent>
      <q-card v-if="vinculoEncerrado" class="full-width">
        <q-card-section>
          <div class="text-h6">Encerrar vínculo</div>
          <div class="q-mt-sm">
            Encerrar o vínculo de <strong>{{ vinculoEncerrado.nome }}</strong> ({{
              tipoVinculo(vinculoEncerrado.tipo_vinculo)
            }}) com este apartamento? Ele continua no histórico.
          </div>
        </q-card-section>
        <q-card-section>
          <DataInput v-model="dataFim" label="Data de fim" hint="Vazio = hoje" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn
            unelevated
            color="negative"
            label="Encerrar"
            :loading="encerrando"
            @click="confirmarEncerrar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import ApartamentoService from 'src/services/ApartamentoService'
import VinculoService from 'src/services/VinculoService'
import FaturaService from 'src/services/FaturaService'
import ApartamentoForm from 'src/components/ApartamentoForm.vue'
import VinculoForm from 'src/components/VinculoForm.vue'
import DataInput from 'src/components/DataInput.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { dataBr, dinheiro, mesAno, mesCobranca, nomeApto, tipoVinculo } from 'src/utils/formatar'

export default defineComponent({
  name: 'ApartamentoDetalhePage',

  components: { ApartamentoForm, VinculoForm, DataInput },

  data() {
    return {
      apartamento: null,
      historico: [],
      faturas: [],
      carregando: false,
      formApto: false,
      formVinculo: false,
      vinculoEditado: null,
      encerrarAberto: false,
      vinculoEncerrado: null,
      dataFim: null,
      encerrando: false,
    }
  },

  computed: {
    ...mapState(useAuthStore, ['isAdmin']),
  },

  // O id vem da rota /apartamentos/:id (parâmetro, como na aula de Router)
  mounted() {
    this.carregar()
  },

  methods: {
    dataBr,
    dinheiro,
    mesAno,
    mesCobranca,
    nomeApto,
    tipoVinculo,

    async carregar() {
      this.carregando = true
      try {
        const response = await ApartamentoService.buscarPorId(this.$route.params.id)
        this.apartamento = response.data.data
        this.carregarHistorico()
        this.carregarFaturas()
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
        if (err?.status === 404) this.$router.push('/apartamentos')
      } finally {
        this.carregando = false
      }
    },

    async carregarHistorico() {
      try {
        const response = await VinculoService.listar({
          id_apartamento: this.$route.params.id,
          ativo: false,
        })
        this.historico = response.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      }
    },

    // Da mais recente para a mais antiga (ordem da API); as canceladas não valem
    async carregarFaturas() {
      try {
        const response = await FaturaService.listar({ id_apartamento: this.$route.params.id })
        this.faturas = response.data.data.filter((f) => f.status !== 'CANCELADA')
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      }
    },

    abrirVinculo(vinculo) {
      this.vinculoEditado = vinculo
      this.formVinculo = true
    },

    encerrar(vinculo) {
      this.vinculoEncerrado = vinculo
      this.dataFim = null
      this.encerrarAberto = true
    },

    async confirmarEncerrar() {
      this.encerrando = true
      try {
        await VinculoService.encerrar(this.vinculoEncerrado.id_vinculo, { data_fim: this.dataFim })
        this.$q.notify({ type: 'positive', message: 'Vínculo encerrado.' })
        this.encerrarAberto = false
        this.carregar()
      } catch (err) {
        // Ex.: "não encerra o último proprietário de apartamento ativo"
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
      } finally {
        this.encerrando = false
      }
    },

    confirmar(titulo, mensagem, rotulo, cor, acao) {
      this.$q
        .dialog({
          title: titulo,
          message: mensagem,
          cancel: { flat: true, label: 'Cancelar' },
          ok: { color: cor, unelevated: true, label: rotulo },
          persistent: true,
        })
        .onOk(async () => {
          try {
            await acao()
            this.carregar()
          } catch (err) {
            this.$q.notify({ type: 'negative', message: mensagemErro(err) })
          }
        })
    },

    inativar() {
      this.confirmar(
        'Inativar apartamento',
        `Inativar o apartamento ${nomeApto(this.apartamento)}? Ele não é excluído (fica no histórico) e deixa de entrar no rateio e nas faturas.`,
        'Inativar',
        'negative',
        async () => {
          await ApartamentoService.inativar(this.apartamento.id_apartamento)
          this.$q.notify({ type: 'positive', message: 'Apartamento inativado.' })
        },
      )
    },

    ativar() {
      this.confirmar(
        'Reativar apartamento',
        `Reativar o apartamento ${nomeApto(this.apartamento)}? Ele precisa ter um proprietário ativo.`,
        'Reativar',
        'positive',
        async () => {
          await ApartamentoService.ativar(this.apartamento.id_apartamento)
          this.$q.notify({ type: 'positive', message: 'Apartamento reativado.' })
        },
      )
    },
  },
})
</script>
