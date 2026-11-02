<template>
  <q-page padding>
    <!-- Barra da tela: não sai no papel (print-hide, classe do Quasar) -->
    <div class="row items-center q-mb-md print-hide">
      <q-btn flat round icon="arrow_back" @click="voltar">
        <q-tooltip>Voltar</q-tooltip>
      </q-btn>
      <div class="text-h5 q-ml-sm">Fatura</div>
      <q-space />
      <q-btn
        v-if="fatura"
        unelevated
        color="primary"
        icon="print"
        label="Imprimir"
        @click="imprimir"
      />
    </div>

    <q-inner-loading :showing="carregando" />

    <!-- Esboço da fatura (RF16 / 53A): é o que vai para o papel -->
    <div v-if="fatura" class="row justify-center">
      <q-card flat bordered class="col-12 col-md-8">
        <q-card-section class="row items-start">
          <div>
            <div class="text-h5">CondoSimples</div>
            <div class="text-subtitle1 text-grey-8">Esboço de fatura</div>
          </div>
          <q-space />
          <div class="text-right">
            <div class="text-subtitle1">
              Referente a
              <span class="text-weight-bold">
                {{ mesAno(fatura.mes_referencia, fatura.ano_referencia) }}
              </span>
            </div>
            <div class="text-grey-8">
              Cobrança em {{ mesCobranca(fatura.mes_referencia, fatura.ano_referencia) }}
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-list dense class="q-py-sm">
          <q-item>
            <q-item-section avatar><q-icon name="apartment" /></q-item-section>
            <q-item-section class="text-subtitle1">
              Apartamento {{ nomeApto(fatura) }}
            </q-item-section>
          </q-item>
          <!-- Nomes dos vínculos ativos de hoje -->
          <q-item v-if="apartamento">
            <q-item-section avatar><q-icon name="vpn_key" /></q-item-section>
            <q-item-section>
              <q-item-label caption>{{
                plural(proprietarios, 'Proprietário', 'Proprietários')
              }}</q-item-label>
              <q-item-label>{{ proprietarios.join(', ') || '—' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="apartamento">
            <q-item-section avatar><q-icon name="person" /></q-item-section>
            <q-item-section>
              <q-item-label caption>{{ plural(moradores, 'Morador', 'Moradores') }}</q-item-label>
              <q-item-label>{{ moradores.join(', ') || 'Nenhum morador cadastrado' }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator />

        <q-card-section>
          <!-- wrap-cells: a descrição quebra a linha no celular, sem rolagem para o lado -->
          <q-markup-table flat bordered wrap-cells separator="horizontal">
            <thead>
              <tr>
                <th class="text-left">Descrição</th>
                <th class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!fatura.itens.length">
                <td colspan="2" class="text-grey-7">Nenhum item.</td>
              </tr>
              <tr v-for="item in fatura.itens" :key="item.id_item_fatura">
                <td class="text-left">
                  {{ item.descricao }}
                  <q-badge v-if="item.avulso" outline color="grey-8" class="q-ml-sm">
                    Avulso
                  </q-badge>
                  <!-- Só o item avulso pode ser removido: os de despesa fazem parte do rateio -->
                  <q-btn
                    v-if="item.avulso && podeAlterar"
                    flat
                    round
                    dense
                    size="sm"
                    icon="delete"
                    color="negative"
                    class="q-ml-xs print-hide"
                    @click="removerItem(item)"
                  >
                    <q-tooltip>Remover item</q-tooltip>
                  </q-btn>
                </td>
                <td class="text-right">{{ dinheiro(item.valor) }}</td>
              </tr>
              <tr>
                <td class="text-left text-weight-bold">Total</td>
                <td class="text-right text-weight-bold text-subtitle1">
                  {{ dinheiro(fatura.valor_total) }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
          <!-- Perto dos itens (Gestalt: proximidade); não sai no papel -->
          <q-btn
            v-if="podeAlterar"
            flat
            no-caps
            color="primary"
            icon="add"
            label="Adicionar item (multa, taxa extra...)"
            class="q-mt-sm print-hide"
            @click="itemAberto = true"
          />
        </q-card-section>

        <q-card-section class="text-caption text-grey-7">
          Gerada em {{ dataBr(fatura.data_geracao) }}. Este documento é um esboço para conferência e
          não é boleto.
        </q-card-section>
      </q-card>
    </div>

    <ItemFaturaForm v-model="itemAberto" :fatura="fatura" @salvo="fatura = $event" />
  </q-page>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import { useAuthStore } from 'src/stores/auth'
import FaturaService from 'src/services/FaturaService'
import ApartamentoService from 'src/services/ApartamentoService'
import ItemFaturaForm from 'src/components/ItemFaturaForm.vue'
import mensagemErro from 'src/utils/mensagemErro'
import { dataBr, dinheiro, mesAno, mesCobranca, nomeApto } from 'src/utils/formatar'

export default defineComponent({
  name: 'FaturaPage',

  components: { ItemFaturaForm },

  data() {
    return {
      fatura: null,
      apartamento: null,
      carregando: false,
      itemAberto: false,
    }
  },

  computed: {
    ...mapState(useAuthStore, ['isAdmin']),

    // Itens avulsos só em fatura aberta (regra da API)
    podeAlterar() {
      return this.isAdmin && this.fatura?.status === 'ABERTA'
    },
    proprietarios() {
      return this.apartamento.vinculos
        .filter((v) => v.tipo_vinculo === 'PROPRIETARIO')
        .map((v) => v.nome)
    },

    moradores() {
      return this.apartamento.vinculos.filter((v) => v.reside).map((v) => v.nome)
    },
  },

  // O id vem da rota /faturas/:id
  mounted() {
    this.carregar()
  },

  methods: {
    dataBr,
    dinheiro,
    mesAno,
    mesCobranca,
    nomeApto,

    // "Proprietário" ou "Proprietários", conforme a quantidade de nomes
    plural(nomes, singular, plural) {
      return nomes.length > 1 ? plural : singular
    },

    async carregar() {
      this.carregando = true
      try {
        const response = await FaturaService.buscarPorId(this.$route.params.id)
        this.fatura = response.data.data
        // Proprietários e moradores (vínculos ativos do apartamento)
        const apto = await ApartamentoService.buscarPorId(this.fatura.id_apartamento)
        this.apartamento = apto.data.data
      } catch (err) {
        this.$q.notify({ type: 'negative', message: mensagemErro(err) })
        if (err?.status === 404) this.$router.push('/faturas')
      } finally {
        this.carregando = false
      }
    },

    // Volta para a tela de onde veio (Faturas ou Apartamento); aberto direto pelo endereço, vai para Faturas
    voltar() {
      if (window.history.state?.back) this.$router.back()
      else this.$router.push('/faturas')
    },

    // 54A: impressão do navegador (também salva em PDF). Menu, barra e botões têm print-hide.
    imprimir() {
      window.print()
    },

    removerItem(item) {
      this.$q
        .dialog({
          title: 'Remover item',
          message: `Remover "${item.descricao}" (${dinheiro(item.valor)}) desta fatura?`,
          cancel: { flat: true, label: 'Cancelar' },
          ok: { color: 'negative', unelevated: true, label: 'Remover' },
          persistent: true,
        })
        .onOk(async () => {
          try {
            // A API devolve a fatura atualizada (com o novo total)
            const response = await FaturaService.removerItem(
              this.fatura.id_fatura,
              item.id_item_fatura,
            )
            this.fatura = response.data.data
            this.$q.notify({ type: 'positive', message: 'Item removido.' })
          } catch (err) {
            this.$q.notify({ type: 'negative', message: mensagemErro(err) })
          }
        })
    },
  },
})
</script>
