# Plano: Milhas e Pontos com lotes FIFO e transferências

## Objetivo
Evoluir a página existente, sem criar um módulo paralelo, para controlar cada aquisição como um lote independente, baixar milhas por FIFO e registrar transferências completas entre programas.

## Regras confirmadas
- **Baixa FIFO:** cotações e transferências consomem primeiro os lotes disponíveis mais antigos do programa.
- **Taxas:** somam ao custo atribuído ao novo lote de destino.
- Compras antigas permanecem imutáveis no histórico; novas aquisições nunca substituem seus custos.
- Bonificação aumenta somente a quantidade recebida.
- Transferências são movimentações internas, não compras, receitas ou lucro.

## Implementação

### 1. Estrutura segura de lotes e rastreabilidade
- Criar `milhas_lotes` para registrar origem, programa, data, quantidade inicial, saldo, custo total e custo por milheiro de cada lote.
- Criar `milhas_operacoes` para representar compras, utilizações, estornos e transferências com chave de idempotência para impedir duplicidade.
- Criar `milhas_alocacoes` para ligar cada saída aos lotes consumidos e preservar quantidade e custo apropriado de cada parcela.
- Criar `milhas_transferencias` para guardar origem/destino, bonificação, quantidade recebida, taxas, custo transferido e lote de destino.
- Aplicar acesso por usuário, permissões explícitas, índices e validações de integridade em todas as novas tabelas.

### 2. Migração dos registros existentes
- Converter cada compra atual em um lote próprio, preservando data, quantidade, valor e identificação do lançamento original.
- Reprocessar utilizações e estornos antigos em ordem cronológica usando FIFO.
- Manter `milhas_movimentos` como histórico compatível com a tela atual durante a transição.
- Não apagar nem reescrever os lançamentos financeiros originais.

### 3. Operações atômicas de estoque
- Implementar funções transacionais no banco para compra, utilização de cotação, cancelamento/estorno e transferência.
- Travar os lotes envolvidos durante a operação para evitar saldo negativo em ações simultâneas.
- Na utilização, criar alocações FIFO e calcular o custo real pela soma dos custos dos lotes consumidos.
- No estorno, devolver exatamente às mesmas parcelas/lotes originalmente consumidos.
- Na transferência, debitar os lotes de origem, criar um lote de destino e atribuir `custo consumido + taxas` à quantidade recebida.
- Repetir uma confirmação da mesma cotação ou transferência não criará lançamentos duplicados.

### 4. Compatibilidade com cotações
- Preservar a opção atual “Milhas próprias”, programa e quantidade na cotação.
- Substituir o cálculo médio atual pela baixa FIFO transacional quando a cotação for aprovada.
- Ao editar quantidade/programa, cancelar, reprovar ou excluir, reverter a alocação anterior e aplicar a nova de forma consistente.
- Manter o preço cobrado ao cliente inalterado; o custo das milhas continua sendo custo interno.
- Exibir aviso e impedir a confirmação quando o saldo do programa for insuficiente.

### 5. Página Milhas e Pontos
- Manter a identidade visual, navegação, filtros e cadastro de compras atuais.
- Organizar a página em visões claras de **Resumo**, **Lotes** e **Histórico**.
- Resumo por programa: saldo, custo total do estoque, custo médio ponderado do saldo e quantidade de lotes ativos.
- Lotes: identificação, origem, data, quantidade inicial, quantidade usada, saldo, custo total e custo por milheiro.
- Histórico unificado: compras, utilizações em cotações, estornos, saídas/entradas de transferências e taxas.
- Bloquear edição ou exclusão de compra já consumida; permitir somente quando não comprometer o histórico.

### 6. Registro de transferência
- Adicionar ação “Registrar transferência” na mesma página.
- Campos: data, programa de origem/destino, quantidade transferida, bonificação informada pelo usuário e taxas.
- Calcular ao vivo: bônus, quantidade recebida, custo FIFO transferido, custo total do destino e custo efetivo por milheiro.
- Mostrar os lotes de origem previstos pelo FIFO antes de confirmar.
- Validar programas diferentes, valores positivos e saldo suficiente.

### 7. Validação
- Testar compras com custos diferentes sem sobrescrita.
- Testar consumo atravessando dois ou mais lotes e conferir o custo proporcional.
- Testar estorno exato, alteração de cotação, cancelamento, reprovação e exclusão.
- Testar transferência com e sem bônus/taxa e encadeamento de múltiplas transferências.
- Testar tentativas duplicadas, saldo insuficiente e concorrência.
- Verificar visualmente a página em tamanhos desktop e móvel, além dos estados vazios e filtros.

## Resultado esperado
Cada ponto poderá ser rastreado desde a compra ou transferência de entrada até sua utilização. O estoque, o custo contábil e os saldos permanecerão consistentes mesmo com múltiplos lotes, custos diferentes, bonificações e estornos.
