# PRD: Produtividade do editor

## Objetivo

Reduzir atritos do fluxo diario no Design Model, tornando a area de trabalho mais flexivel, permitindo recuperar templates por JSON e dando mais controle sobre canvas e camadas sem aumentar o escopo do MVP.

## Contexto

O editor ja oferece templates locais, canvas editavel, camadas manipulaveis, presets, persistencia local e exportacao JSON/CSS. A proxima rodada deve melhorar operacoes frequentes: liberar espaco horizontal quando a sidebar esquerda nao for necessaria, importar um JSON exportado anteriormente, ajustar dimensoes customizadas do canvas e evitar alteracoes acidentais em camadas.

## Escopo desta iteracao

- Permitir recolher e expandir a sidebar esquerda.
- Importar JSON compativel com o formato exportado pelo app.
- Editar largura e altura customizadas do canvas de forma controlada.
- Melhorar atalhos de teclado documentados na interface de comandos ou tooltips existentes, sem depender de texto longo na tela.
- Adicionar bloqueio de camada se couber no ciclo, preservando selecao e inspecao.

## Fora de escopo

- Importacao de formatos externos que nao sejam o JSON do proprio app.
- Sincronizacao em nuvem ou backend.
- Historico completo de undo/redo.
- Colaboracao em tempo real.
- Reestruturacao visual ampla da aplicacao.
- Mudancas em deploy, banco de dados ou autenticacao.

## Historias

1. Como criador de templates, quero recolher a sidebar esquerda para ganhar area util no canvas durante ajustes finos.
2. Como criador de templates, quero importar um JSON exportado pelo app para continuar uma composicao salva fora do navegador.
3. Como criador de templates, quero definir largura e altura customizadas do canvas para criar formatos que nao estao nos presets.
4. Como criador de templates, quero atalhos mais previsiveis para acoes frequentes para editar mais rapido sem perder controle.
5. Como criador de templates, quero bloquear uma camada para evitar mover, redimensionar ou editar sem querer.

## Criterios gerais de aceite

- Cada historia deve ser implementavel de forma independente em uma sessao focada.
- Mudancas visuais devem ser verificadas em desktop e largura mobile/tablet quando aplicavel.
- `npm run typecheck` deve passar ao final de historias com codigo.
- `npm run build` deve passar antes de concluir a rodada.
- Importacao de JSON deve rejeitar conteudo invalido com mensagem clara e sem quebrar o template atual.
- Nenhum segredo, arquivo gerado ou dependencia local deve ser versionado.

## Historias detalhadas

### US-001: Sidebar esquerda recolhivel

Como criador de templates, quero recolher a sidebar esquerda para ganhar area util no canvas durante ajustes finos.

#### Criterios de aceite

- A interface oferece um controle para recolher e expandir a sidebar esquerda.
- Ao recolher, a area central do editor ocupa o espaco liberado sem sobrepor a sidebar direita.
- O estado recolhido/expandido permanece previsivel ao trocar de template na mesma sessao.
- Em largura mobile/tablet, o controle nao causa texto cortado nem sobreposicao de paineis.
- Typecheck passes.
- Build passes.
- Verify in browser.

### US-002: Importacao de JSON do template

Como criador de templates, quero importar um JSON exportado pelo app para continuar uma composicao salva fora do navegador.

#### Criterios de aceite

- A interface permite selecionar ou colar um JSON de template.
- JSON valido no formato `TemplateDocument` cria ou substitui um template local de forma explicita para o usuario.
- JSON invalido exibe uma mensagem clara e preserva o template atual sem alteracoes.
- O importador valida os campos minimos de metadata, canvas, tokens e layers antes de persistir.
- O template importado aparece na lista local e pode ser exportado novamente.
- Typecheck passes.
- Build passes.
- Verify in browser.

### US-003: Dimensoes customizadas do canvas

Como criador de templates, quero definir largura e altura customizadas do canvas para criar formatos que nao estao nos presets.

#### Criterios de aceite

- A interface permite editar largura e altura do canvas quando o preset customizado estiver ativo.
- Largura e altura aceitam apenas numeros dentro de limites seguros definidos pelo produto.
- Valores invalidos mostram feedback claro e nao corrompem o canvas atual.
- Ao salvar dimensoes customizadas, o canvas, a persistencia local e a exportacao JSON refletem os novos valores.
- A exportacao CSS continua usando as dimensoes finais do canvas.
- Typecheck passes.
- Build passes.
- Verify in browser.

### US-004: Melhorias de atalhos de teclado

Como criador de templates, quero atalhos mais previsiveis para acoes frequentes para editar mais rapido sem perder controle.

#### Criterios de aceite

- Atalhos existentes de movimento por setas continuam funcionando com e sem snap.
- Pelo menos duas acoes frequentes possuem atalhos verificaveis, como duplicar, excluir, alternar snap ou alternar lock.
- Atalhos nao disparam quando o foco esta em campos de texto, numero, textarea ou seletor.
- Tooltips ou labels acessiveis indicam os atalhos das acoes suportadas.
- Typecheck passes.
- Build passes.
- Verify in browser.

### US-005: Bloqueio de camada

Como criador de templates, quero bloquear uma camada para evitar mover, redimensionar ou editar sem querer.

#### Criterios de aceite

- A lista de camadas ou o inspector permite alternar uma camada entre bloqueada e desbloqueada.
- Camadas bloqueadas continuam selecionaveis para inspecao.
- Camadas bloqueadas nao podem ser movidas por drag, redimensionadas por alcas ou alteradas por nudges de teclado.
- O estado de bloqueio persiste em localStorage e aparece na exportacao JSON.
- A interface comunica visualmente que a camada esta bloqueada sem esconder seu conteudo.
- Typecheck passes.
- Build passes.
- Verify in browser.

## Sequencia sugerida

1. Sidebar esquerda recolhivel.
2. Dimensoes customizadas do canvas.
3. Importacao de JSON do template.
4. Melhorias de atalhos de teclado.
5. Bloqueio de camada.

## Riscos e validacao

- Importacao de JSON pode corromper estado local se aceitar dados incompletos; validar schema minimo antes de persistir.
- Dimensoes customizadas podem quebrar layout em telas pequenas; verificar desktop, tablet e mobile.
- Atalhos podem conflitar com edicao de campos; bloquear handlers quando o foco estiver em inputs.
- Bloqueio de camada altera regras de manipulacao direta; validar drag, resize, snap e teclado.
