# Corrigir e ampliar o controle de milhas por cotação

## Objetivo
Vincular cada uso de milhas a um lote escolhido na cotação, atualizar estoque e histórico automaticamente na aprovação e exibir custo real e venda prevista na página Milhas e Pontos.

## Implementação

### 1. Cotação: lote e preço de venda
- Na seção **Milhas próprias**, manter programa e quantidade.
- Adicionar seleção obrigatória de **lote**, mostrando identificação, saldo disponível e custo por milheiro.
- Adicionar **valor de venda do milheiro** e calcular a venda prevista: `quantidade ÷ 1.000 × valor de venda do milheiro`.
- Salvar o lote e o preço de venda junto à cotação, sem alterar o preço cobrado nos demais itens.
- Ao editar uma cotação aprovada, carregar os valores salvos e validar novamente o saldo do lote.

### 2. Baixa automática e rastreável
- Alterar a sincronização da aprovação para consumir somente o lote escolhido, em vez do FIFO automático usado pelas cotações hoje.
- Validar que o lote pertence ao usuário, corresponde ao programa e tem saldo suficiente.
- Registrar na utilização o lote, a cotação, a quantidade, o custo histórico do lote e o preço/total de venda previstos.
- Ao reprovar, cancelar, editar ou excluir a cotação, devolver as milhas ao lote correto e recalcular os valores.
- Manter a operação idempotente: salvar ou aprovar novamente sem mudanças não cria duplicidade.
- Corrigir o carregamento da tela após cada operação para que estoque, histórico e totais reflitam a mudança imediatamente.

### 3. Totais financeiros na página Milhas e Pontos
- Exibir no topo, considerando apenas utilizações ativas de cotações aprovadas:
  - custo real total das milhas utilizadas;
  - venda prevista total;
  - resultado previsto entre venda e custo.
- No histórico, mostrar código da cotação, lote utilizado, custo real, venda prevista e valor do milheiro vendido.
- Manter separadamente os indicadores atuais de saldo, custo do estoque e custo médio.

### 4. Editar e excluir com segurança
- **Compras:** permitir editar ou excluir quando não houver consumo dependente; se houver, informar quais utilizações/transferências precisam ser desfeitas primeiro.
- **Transferências:** adicionar edição e exclusão; desfazer origem e destino somente quando o lote de destino não tiver uso posterior. A edição será refeita de forma atômica para evitar saldos parciais.
- **Uso por cotação:** oferecer editar, abrindo a cotação correspondente, e excluir a baixa; a exclusão devolve o saldo ao lote, apaga o histórico daquela utilização e desativa “Milhas próprias” na cotação até uma nova configuração/aprovação.
- Usar confirmações claras e bloquear qualquer ação que produziria saldo negativo ou apagaria uma cadeia já consumida.

### 5. Dados existentes e validação
- Preservar compras, transferências e utilizações atuais.
- Manter usos antigos sem lote selecionado com sua alocação histórica; novas alterações exigirão seleção explícita.
- Validar aprovação, troca de lote, mudança de quantidade/preço, reprovação, exclusão e reaplicação.
- Conferir totais, atualização imediata da interface, segurança dos dados e funcionamento em tela grande e celular.

## Detalhes técnicos
- Ampliar as operações de milhas com snapshots do lote e da venda prevista.
- Redefinir a função de sincronização e o gatilho de cotações para ler `milhasLoteId` e `milhasValorVendaMilheiro`.
- Criar operações protegidas no servidor para excluir/reprocessar utilizações e transferências sem conceder escrita direta às tabelas internas.
- Preservar as regras de acesso por usuário e executar a verificação de segurança após a migração.
