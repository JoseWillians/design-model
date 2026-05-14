# Contribuindo com o Design Model

Obrigado por considerar contribuir. Este projeto busca evoluir de forma incremental, com mudancas pequenas, revisaveis e alinhadas ao produto.

## Como comecar

1. Leia o [README.md](./README.md).
2. Confira o [ROADMAP.md](./ROADMAP.md) para entender prioridades.
3. Instale dependencias:

```bash
npm install
```

4. Rode o projeto:

```bash
npm run dev
```

## Fluxo recomendado

1. Abra uma issue ou descreva claramente o problema no pull request.
2. Mantenha o escopo pequeno.
3. Preserve os padroes atuais de React, TypeScript e CSS.
4. Evite alterar arquivos gerados como `dist/`, `build/`, `coverage/` ou `node_modules/`.
5. Nao inclua segredos, tokens, credenciais ou valores reais de `.env`.
6. Atualize documentacao quando a mudanca alterar uso, arquitetura ou comportamento.

## Padroes de codigo

- Use TypeScript com tipos explicitos quando isso melhorar clareza.
- Prefira componentes pequenos e reutilizaveis.
- Preserve os tokens de design existentes sempre que possivel.
- Mantenha estados de hover, focus, disabled e selected em componentes interativos.
- Use elementos HTML semanticos antes de recorrer a ARIA customizado.
- Garanta nomes acessiveis para botoes apenas com icone.

## Validacao obrigatoria

Antes de abrir ou atualizar um pull request, rode:

```bash
npm run typecheck
npm run build
```

Para mudancas visuais, confira tambem:

- desktop;
- tablet ou largura proxima de 768px;
- mobile em 375px e, quando possivel, 320px;
- navegacao por teclado;
- contraste e foco visivel.

## Pull requests

Um bom pull request deve ter:

- resumo curto do que mudou;
- motivacao ou issue relacionada;
- passos de teste executados;
- screenshots ou descricao visual quando alterar UI;
- riscos conhecidos ou pontos que precisam de revisao.

## Areas que precisam de ajuda

- Testes automatizados para `src/lib/exporters.ts`.
- Testes automatizados para `src/lib/templateStore.ts`.
- Importacao de templates via JSON.
- Melhorias de acessibilidade no canvas.
- Evolucao dos templates iniciais.
- Responsividade mobile/tablet do editor.
- Documentacao de exemplos de templates.

## Reportando bugs

Inclua, sempre que possivel:

- passos para reproduzir;
- comportamento esperado;
- comportamento atual;
- navegador e sistema operacional;
- mensagens de erro do console, sem expor dados sensiveis;
- screenshots quando o problema for visual.

## Seguranca

Nao abra issues publicas com credenciais, tokens ou dados sensiveis. Se encontrar uma falha de seguranca, reporte de forma privada ao mantenedor do repositorio.

Areas sensiveis para revisar em contribuicoes futuras:

- importacao de arquivos;
- exportacao e download de conteudo;
- armazenamento local;
- futuras APIs de compartilhamento;
- futuras integracoes com login, workspace ou deploy.
