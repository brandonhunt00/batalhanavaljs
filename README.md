# ⚓ Batalha Naval JS

Jogo de **Batalha Naval** para dois jogadores em uma única tela, desenvolvido com HTML, CSS e JavaScript puros — sem bibliotecas externas.

Projeto desenvolvido como trabalho acadêmico da Unidade 01.

## 🎮 Como Jogar

1. Abra o `index.html` no navegador
2. Digite os nomes dos dois jogadores e clique em **Zarpar para a Batalha**
3. Cada jogador posiciona seus 5 navios secretamente (use `R` para girar)
4. Os jogadores se alternam atacando as coordenadas do adversário
5. Quem afundar toda a frota inimiga primeiro **vence!**

## 🚢 Frota

| Navio        | Tamanho |
|--------------|---------|
| Porta-aviões | 5       |
| Encouraçado  | 4       |
| Cruzador     | 3       |
| Submarino    | 2       |
| Destruidor   | 2       |

## 🗂️ Estrutura
```
batalha-naval-js/
├── index.html        # Página inicial (configuração de nomes)
├── style-index.css   # Estilos da página inicial
├── index.js          # Lógica da página inicial
├── game.html         # Página do jogo
├── style-game.css    # Estilos do jogo
└── game.js           # Lógica completa do jogo
```

## ✅ Requisitos Técnicos Implementados

- Animações CSS (navios, ondas, explosões)
- Dois jogadores humanos com passagem de tela
- Tabela dinâmica (`TABLE/TH/TR/TD`) — navios afundados
- Lista dinâmica (`OL/UL/LI`) — log de jogadas
- Estilos alterados via JS conforme estado do jogo (turno ativo)
- Eventos JS (clique, teclado, hover)
- Placar com nomes e pontuação atualizada
- Duas páginas com passagem de parâmetros via URL
- Classes JS: `Ship`, `Board`, `Player`, `BattleshipGame`
- Separação completa de HTML, CSS e JS
- Sem bibliotecas de terceiros

## 🛠️ Tecnologias

- HTML5
- CSS3 (animações, variáveis, grid)
- JavaScript ES6+ (classes, URLSearchParams, DOM API)