# QA e Acessibilidade

Checklist de validacao manual para o app React/Vite de criacao de templates visuais de projetos.

## Objetivo

Garantir que a interface seja utilizavel, responsiva, acessivel por teclado, compreensivel em estados vazios/erro e estavel em performance antes de entrega ou publicacao.

## Escopo de Validacao

- Tela inicial e fluxo principal de criacao/edicao de templates.
- Componentes interativos: botoes, inputs, selects, menus, cards, paineis, modais e controles de preview.
- Estados de carregamento, vazio, erro, sucesso e sem permissao, quando existirem.
- Layout em desktop, tablet e mobile.

## Checklist de Acessibilidade

- [ ] A pagina define idioma correto no HTML (`lang="pt-BR"` quando aplicavel).
- [ ] A hierarquia de titulos segue ordem logica (`h1`, `h2`, `h3`) sem saltos confusos.
- [ ] Elementos interativos usam semantica nativa sempre que possivel (`button`, `a`, `input`, `select`, `textarea`).
- [ ] Botoes com apenas icone possuem nome acessivel via texto oculto ou `aria-label`.
- [ ] Imagens informativas possuem `alt` descritivo.
- [ ] Imagens decorativas usam `alt=""` ou equivalente para nao poluir leitores de tela.
- [ ] Campos de formulario possuem label associado de forma programatica.
- [ ] Mensagens de erro indicam claramente o problema e como corrigir.
- [ ] Campos invalidos usam `aria-invalid` e apontam para a mensagem com `aria-describedby`, quando aplicavel.
- [ ] Mudancas importantes de estado sao anunciadas com `aria-live` ou feedback visivel equivalente.
- [ ] Componentes customizados seguem padroes ARIA somente quando a semantica nativa nao resolver.

## Checklist de Teclado

- [ ] Todo fluxo principal pode ser concluido usando apenas teclado.
- [ ] A ordem de foco segue a ordem visual e logica da interface.
- [ ] O foco visivel aparece claramente em botoes, links, inputs, abas, menus e cards clicaveis.
- [ ] `Tab` avanca, `Shift + Tab` retorna e nenhum componente prende o foco indevidamente.
- [ ] `Enter` e `Space` ativam botoes e controles equivalentes.
- [ ] `Esc` fecha modais, menus e paineis temporarios, quando existirem.
- [ ] Ao abrir modal, o foco entra no modal; ao fechar, retorna para o elemento que o abriu.
- [ ] Elementos desabilitados nao recebem foco e possuem aparencia distinguivel.

## Checklist de Responsividade

- [ ] A interface funciona sem rolagem horizontal em 320px, 375px, 768px, 1024px e desktop amplo.
- [ ] Textos longos quebram linha sem sair do container.
- [ ] Botoes e controles mantem area minima de toque de 24 x 24 px, preferencialmente 44 x 44 px em mobile.
- [ ] Paineis, grids e cards se reorganizam sem sobreposicao.
- [ ] Preview, canvas ou area visual principal mantem proporcao e permanece utilizavel em telas pequenas.
- [ ] Menus e toolbars continuam acessiveis em mobile.
- [ ] Conteudo permanece legivel com zoom do navegador em 200%.

## Estados Vazios, Erro e Carregamento

- [ ] Estado vazio explica o que esta faltando e oferece uma acao clara para continuar.
- [ ] Estado de carregamento nao causa saltos bruscos de layout.
- [ ] Operacoes demoradas indicam progresso, bloqueio ou estado pendente de forma clara.
- [ ] Erros de rede, validacao e operacao possuem mensagens especificas e recuperaveis.
- [ ] Acoes destrutivas pedem confirmacao quando houver perda de dados.
- [ ] A interface nao expõe stack traces, tokens, IDs sensiveis ou detalhes internos em erros.
- [ ] Estados de sucesso confirmam que a acao foi concluida.

## Contraste e Legibilidade

- [ ] Texto normal atende contraste minimo AA de 4.5:1.
- [ ] Texto grande atende contraste minimo AA de 3:1.
- [ ] Icones, bordas de inputs, foco e controles interativos possuem contraste minimo de 3:1.
- [ ] Informacoes importantes nao dependem apenas de cor.
- [ ] Estados de erro/sucesso combinam cor com texto, icone ou outro indicador.
- [ ] A tipografia permanece legivel em mobile e em zoom de 200%.
- [ ] Placeholders nao substituem labels.

## Performance e Estabilidade Visual

- [ ] A primeira tela carrega sem atraso perceptivel em conexao comum.
- [ ] Interacoes principais respondem sem travamentos.
- [ ] Imagens e assets visuais possuem tamanho adequado e nao bloqueiam renderizacao sem necessidade.
- [ ] O layout evita CLS perceptivel durante carregamento.
- [ ] Listas ou galerias grandes usam paginacao, virtualizacao ou carregamento progressivo quando necessario.
- [ ] Animacoes sao leves e respeitam `prefers-reduced-motion`.
- [ ] O bundle nao inclui dependencias pesadas sem justificativa.

## Criterios de Validacao Manual

Executar antes de considerar a interface pronta:

1. Abrir o app em desktop e percorrer o fluxo principal sem erros visuais ou funcionais.
2. Repetir o fluxo apenas com teclado, validando foco, ordem e atalhos basicos.
3. Testar pelo menos um leitor de tela ou inspecao equivalente de nomes acessiveis.
4. Validar mobile em largura de 320px e 375px.
5. Validar tablet em largura aproximada de 768px.
6. Aplicar zoom de 200% e confirmar que o fluxo continua utilizavel.
7. Simular estados vazio, carregando, erro e sucesso.
8. Conferir contraste dos textos e controles principais.
9. Ativar reducao de movimento no sistema ou DevTools e verificar animacoes.
10. Rodar auditoria automatizada de acessibilidade e revisar manualmente os pontos apontados.

## Comandos Sugeridos

```bash
npm run dev
npm run build
```

Quando houver ferramenta de auditoria instalada no projeto:

```bash
npx lighthouse http://localhost:5173 --only-categories=accessibility,performance,best-practices
```

## Criterio de Aceite

- Nenhum bloqueador de teclado.
- Nenhum texto critico com contraste abaixo de AA.
- Nenhum fluxo principal inacessivel por teclado.
- Nenhum erro interno exposto para o usuario.
- Layout sem sobreposicao ou rolagem horizontal nas larguras testadas.
- Estados vazio, carregando, erro e sucesso compreensiveis.
- Build de producao concluindo sem erro.
