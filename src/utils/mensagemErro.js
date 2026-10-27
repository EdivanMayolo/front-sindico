// Texto do aviso de erro (RNF14): usa a mensagem que a API devolveu.
// Sem resposta (API desligada ou sem rede), explica o que aconteceu.
// "err" é o err.response que os services rejeitam.
export default function mensagemErro(err) {
  if (!err) {
    return 'Não foi possível conectar ao servidor. Verifique se a API está rodando.'
  }
  return err.data?.message || 'Não foi possível concluir a operação.'
}
