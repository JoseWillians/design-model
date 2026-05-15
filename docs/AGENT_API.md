# API Local para Agentes

O Design Model expõe uma API local no navegador para permitir que agentes de IA, automações e scripts assistidos manipulem o editor sem depender de backend ou serviços externos.

## Acesso

Abra o app no navegador e use:

```js
window.designModelAgent
```

A API é instalada apenas em tempo de execução no navegador. Ela não cria rotas HTTP, não lê arquivos locais, não acessa `.env` e não executa código arbitrário.

## Métodos

```ts
window.designModelAgent.getState()
```

Retorna templates, template atual, camada selecionada, `selectedLayerId` e lista achatada de camadas.

```ts
window.designModelAgent.selectTemplate(templateId)
window.designModelAgent.selectLayer(layerId)
```

Seleciona template ou camada quando o ID existe.

```ts
window.designModelAgent.addLayer("text" | "rectangle" | "ellipse" | "image")
```

Cria uma camada no template atual.

```ts
window.designModelAgent.updateLayer(layerId, patch)
```

Atualiza campos permitidos da camada. Camadas bloqueadas só aceitam desbloqueio explícito.

Campos aceitos no `patch`:

- `name`
- `visible`
- `locked`
- `bounds`
- `style`
- `content`
- `textStyle`
- `src`
- `alt`
- `fit`

```ts
window.designModelAgent.alignLayer(layerId, alignment)
```

Alinha uma camada ao canvas. Valores aceitos:

- `left`
- `center-horizontal`
- `right`
- `top`
- `center-vertical`
- `bottom`

```ts
window.designModelAgent.updateCanvas({ width, height, background, gridSize })
```

Atualiza dimensões, fundo e grade do canvas usando os mesmos limites da interface.

```ts
window.designModelAgent.expandCanvas()
```

Expande o canvas atual para o preset `Área livre`, com `2560x1600`.

```ts
window.designModelAgent.exportCurrentTemplate("json" | "css")
```

Retorna o conteúdo exportado como string.

## Exemplo

```js
const agent = window.designModelAgent;
const layer = agent.addLayer("text");

agent.updateLayer(layer.id, {
  content: "Proposta visual",
  bounds: { x: 80, y: 80, width: 420, height: 96 },
  textStyle: { fontSize: 42, fontWeight: 800, color: "#111827" },
});

agent.alignLayer(layer.id, "center-horizontal");
```

## Regras de segurança

- A API só altera o estado local do app no navegador.
- Valores numéricos são limitados antes de persistir.
- Strings são truncadas em campos sensíveis.
- Não há execução de JavaScript enviado por agentes.
- Não há acesso a arquivos, tokens, variáveis de ambiente ou rede privada.
