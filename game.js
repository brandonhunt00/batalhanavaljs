/* ═══════════════════════════════════════════════════════════════
   BATALHA NAVAL – game.js
   Separação completa HTML / CSS / JS
   Classes: Ship, Board, Player, BattleshipGame
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────
   CLASSE: Ship
   Representa um navio individual
────────────────────────────────────────── */
class Ship {
  constructor(name, size, emoji) {
    this.name   = name;
    this.size   = size;
    this.emoji  = emoji;
    this.hits   = 0;
    this.sunk   = false;
    this.cells  = []; // [{row, col}] preenchido ao posicionar
  }

  hit() {
    this.hits++;
    if (this.hits >= this.size) this.sunk = true;
  }

  isSunk() { return this.sunk; }
}

/* ──────────────────────────────────────────
   CLASSE: Board
   Representa o tabuleiro 10×10 de um jogador
────────────────────────────────────────── */
class Board {
  static SIZE = 10;

  constructor() {
    this.grid  = Array.from({ length: Board.SIZE }, () => Array(Board.SIZE).fill(null));
    this.shots = Array.from({ length: Board.SIZE }, () => Array(Board.SIZE).fill(false));
    this.ships = [];
  }

  // Verifica se posição é válida para posicionar navio
  canPlace(row, col, size, horizontal) {
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row       : row + i;
      const c = horizontal ? col + i   : col;
      if (r < 0 || r >= Board.SIZE || c < 0 || c >= Board.SIZE) return false;
      if (this.grid[r][c] !== null) return false;
      // Verifica vizinhos (1 célula de folga)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < Board.SIZE && nc >= 0 && nc < Board.SIZE && this.grid[nr][nc] !== null) return false;
        }
      }
    }
    return true;
  }

  placeShip(ship, row, col, horizontal) {
    for (let i = 0; i < ship.size; i++) {
      const r = horizontal ? row     : row + i;
      const c = horizontal ? col + i : col;
      this.grid[r][c] = ship;
      ship.cells.push({ row: r, col: c });
    }
    this.ships.push(ship);
  }

  receiveShot(row, col) {
    if (this.shots[row][col]) return { result: 'already', ship: null };
    this.shots[row][col] = true;
    const ship = this.grid[row][col];
    if (ship) {
      ship.hit();
      return { result: ship.isSunk() ? 'sunk' : 'hit', ship };
    }
    return { result: 'miss', ship: null };
  }

  allSunk() {
    return this.ships.every(s => s.isSunk());
  }

  // Posicionamento aleatório
  placeRandom(ships) {
    // Reset
    this.grid  = Array.from({ length: Board.SIZE }, () => Array(Board.SIZE).fill(null));
    this.ships = [];
    ships.forEach(ship => {
      ship.cells = [];
      ship.hits  = 0;
      ship.sunk  = false;
    });

    ships.forEach(ship => {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 1000) {
        attempts++;
        const horiz = Math.random() < 0.5;
        const row   = Math.floor(Math.random() * Board.SIZE);
        const col   = Math.floor(Math.random() * Board.SIZE);
        if (this.canPlace(row, col, ship.size, horiz)) {
          this.placeShip(ship, row, col, horiz);
          placed = true;
        }
      }
    });
  }
}

/* ──────────────────────────────────────────
   CLASSE: Player
   Representa um jogador
────────────────────────────────────────── */
class Player {
  constructor(name) {
    this.name  = name;
    this.board = new Board();
    this.ships = Player.createFleet();
  }

  static createFleet() {
    return [
      new Ship('Porta-aviões', 5, '✈️'),
      new Ship('Encouraçado', 4, '🛡️'),
      new Ship('Cruzador',    3, '⚓'),
      new Ship('Submarino',   2, '🤿'),
      new Ship('Destruidor',  2, '💣'),
    ];
  }

  shipsRemaining() {
    return this.ships.filter(s => !s.isSunk()).length;
  }
}

/* ──────────────────────────────────────────
   CLASSE: BattleshipGame
   Orquestra a partida inteira
────────────────────────────────────────── */
class BattleshipGame {
  constructor(name1, name2) {
    this.players      = [new Player(name1), new Player(name2)];
    this.currentIndex = 0;  // índice do jogador ativo
    this.phase        = 'placement'; // placement | handover | battle | gameover
    this.placingPlayerIndex = 0;
    this.horizontal   = true;
    this.shipQueueIdx = 0;  // qual navio está sendo posicionado
    this.shotMadeThisTurn = false;
    this.actionLog    = [];
  }

  get current() { return this.players[this.currentIndex]; }
  get opponent() { return this.players[1 - this.currentIndex]; }
  get placing()  { return this.players[this.placingPlayerIndex]; }
}

/* ═══════════════════════════════════════════════════════════════
   CONTROLADOR DA UI
═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── Ler parâmetros da URL ─── */
  const params = new URLSearchParams(window.location.search);
  const name1  = params.get('p1') || 'Jogador 1';
  const name2  = params.get('p2') || 'Jogador 2';

  /* ─── Criar jogo ─── */
  const game = new BattleshipGame(name1, name2);

  /* ─── Referências DOM ─── */
  const placementOverlay = document.getElementById('placement-overlay');
  const handoverOverlay  = document.getElementById('handover-overlay');
  const gameoverOverlay  = document.getElementById('gameover-overlay');
  const gameWrapper      = document.getElementById('game-wrapper');

  const placementTitle   = document.getElementById('placement-title');
  const placementSubtitle= document.getElementById('placement-subtitle');
  const shipQueue        = document.getElementById('ship-queue');
  const placementGrid    = document.getElementById('placement-grid');

  const btnRotate        = document.getElementById('btn-rotate');
  const btnRandom        = document.getElementById('btn-random-place');
  const btnConfirm       = document.getElementById('btn-confirm-place');

  const handoverTitle    = document.getElementById('handover-title');
  const handoverMsg      = document.getElementById('handover-msg');
  const btnHandover      = document.getElementById('btn-handover');

  const gameoverTitle    = document.getElementById('gameover-title');
  const gameoverMsg      = document.getElementById('gameover-msg');
  const btnRestart       = document.getElementById('btn-restart');

  const nameP1El         = document.getElementById('name-p1');
  const nameP2El         = document.getElementById('name-p2');
  const shipsP1El        = document.getElementById('ships-p1');
  const shipsP2El        = document.getElementById('ships-p2');
  const scoreP1El        = document.getElementById('score-p1');
  const scoreP2El        = document.getElementById('score-p2');
  const turnTextEl       = document.getElementById('turn-text');

  const attackGrid       = document.getElementById('attack-grid');
  const defenseGrid      = document.getElementById('defense-grid');
  const attackLabel      = document.getElementById('attack-label');
  const actionLogEl      = document.getElementById('action-log');
  const sunkTableBody    = document.getElementById('sunk-table-body');

  const btnEndTurn       = document.getElementById('btn-end-turn');

  /* ─── Nomes no placar ─── */
  nameP1El.textContent = name1;
  nameP2El.textContent = name2;

  /* ════════════════════════════════════════
     FASE DE POSICIONAMENTO
  ════════════════════════════════════════ */

  function startPlacementPhase() {
    game.phase           = 'placement';
    game.placingPlayerIndex = 0;
    game.horizontal      = true;
    game.shipQueueIdx    = 0;

    showOverlay(placementOverlay);
    renderPlacementForCurrentPlayer();
  }

  function renderPlacementForCurrentPlayer() {
    const p = game.placing;
    placementTitle.textContent = `🚢 ${p.name} – Posicione seus Navios`;
    game.shipQueueIdx = 0;
    game.horizontal   = true;
    p.board = new Board();
    p.ships = Player.createFleet();

    buildShipQueueList();
    buildGrid(placementGrid, null, true);
    btnConfirm.disabled = true;
  }

  function buildShipQueueList() {
    shipQueue.innerHTML = '';
    const p = game.placing;
    p.ships.forEach((ship, idx) => {
      const li = document.createElement('li');
      li.dataset.idx = idx;

      const blocks = document.createElement('span');
      blocks.className = 'ship-blocks';
      for (let i = 0; i < ship.size; i++) {
        const b = document.createElement('span');
        b.className = 'ship-block';
        blocks.appendChild(b);
      }

      li.appendChild(blocks);
      li.appendChild(document.createTextNode(` ${ship.emoji} ${ship.name} (${ship.size})`));

      if (idx === game.shipQueueIdx) li.classList.add('current-ship');
      shipQueue.appendChild(li);
    });
  }

  function updateShipQueueList() {
    const items = shipQueue.querySelectorAll('li');
    items.forEach((li, idx) => {
      li.classList.remove('current-ship', 'placed-ship');
      if (idx < game.shipQueueIdx)      li.classList.add('placed-ship');
      else if (idx === game.shipQueueIdx) li.classList.add('current-ship');
    });
  }

  /* ── Construir grade 10×10 ── */
  function buildGrid(gridEl, boardData, isPlacement) {
    gridEl.innerHTML = '';
    const COLS = ['A','B','C','D','E','F','G','H','I','J'];

    // Célula vazia canto superior-esquerdo
    const corner = document.createElement('div');
    corner.className = 'cell-header';
    gridEl.appendChild(corner);

    // Cabeçalhos de coluna (letras)
    COLS.forEach(c => {
      const h = document.createElement('div');
      h.className = 'cell-header';
      h.textContent = c;
      gridEl.appendChild(h);
    });

    for (let row = 0; row < Board.SIZE; row++) {
      // Cabeçalho de linha (número)
      const rh = document.createElement('div');
      rh.className = 'cell-header';
      rh.textContent = row + 1;
      gridEl.appendChild(rh);

      for (let col = 0; col < Board.SIZE; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        if (isPlacement) {
          // Mostrar navios já posicionados
          if (game.placing.board.grid[row][col]) cell.classList.add('ship-cell');
          cell.addEventListener('mouseover', onPlacementHover);
          cell.addEventListener('mouseout',  onPlacementOut);
          cell.addEventListener('click',     onPlacementClick);
        } else if (boardData) {
          renderBoardCell(cell, row, col, boardData);
        }

        gridEl.appendChild(cell);
      }
    }
  }

  function renderBoardCell(cell, row, col, boardData) {
    const { board, isDefense } = boardData;
    const shot  = board.shots[row][col];
    const ship  = board.grid[row][col];

    cell.classList.remove('hit', 'miss', 'ship-cell', 'sunk-cell');

    if (shot) {
      if (ship) {
        cell.classList.add('hit');
        if (ship.isSunk()) cell.classList.add('sunk-cell');
      } else {
        cell.classList.add('miss');
      }
    } else if (isDefense && ship) {
      cell.classList.add('ship-cell');
      if (ship.isSunk()) cell.classList.add('sunk-cell');
    }
  }

  /* ── Hover preview de posicionamento ── */
  function getCellsForPreview(row, col) {
    const p    = game.placing;
    const ship = p.ships[game.shipQueueIdx];
    if (!ship) return [];
    const cells = [];
    for (let i = 0; i < ship.size; i++) {
      const r = game.horizontal ? row     : row + i;
      const c = game.horizontal ? col + i : col;
      cells.push({ row: r, col: c });
    }
    return cells;
  }

  function onPlacementHover(e) {
    if (game.shipQueueIdx >= game.placing.ships.length) return;
    const row   = parseInt(e.target.dataset.row);
    const col   = parseInt(e.target.dataset.col);
    const ship  = game.placing.ships[game.shipQueueIdx];
    const valid = game.placing.board.canPlace(row, col, ship.size, game.horizontal);
    const cells = getCellsForPreview(row, col);

    cells.forEach(({ row: r, col: c }) => {
      const cell = placementGrid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
      if (cell) cell.classList.add(valid ? 'preview-valid' : 'preview-invalid');
    });
  }

  function onPlacementOut() {
    placementGrid.querySelectorAll('.preview-valid, .preview-invalid')
      .forEach(el => el.classList.remove('preview-valid', 'preview-invalid'));
  }

  function onPlacementClick(e) {
    const p    = game.placing;
    if (game.shipQueueIdx >= p.ships.length) return;
    const row  = parseInt(e.currentTarget.dataset.row);
    const col  = parseInt(e.currentTarget.dataset.col);
    const ship = p.ships[game.shipQueueIdx];

    if (!p.board.canPlace(row, col, ship.size, game.horizontal)) return;

    p.board.placeShip(ship, row, col, game.horizontal);
    game.shipQueueIdx++;

    buildGrid(placementGrid, null, true);
    updateShipQueueList();

    if (game.shipQueueIdx >= p.ships.length) {
      btnConfirm.disabled = false;
      placementSubtitle.textContent = 'Todos os navios posicionados! Confirme para continuar.';
    }
  }

  /* ── Botão girar ── */
  btnRotate.addEventListener('click', () => {
    game.horizontal = !game.horizontal;
    btnRotate.textContent = game.horizontal ? '🔄 Girar (R) – Horizontal' : '🔄 Girar (R) – Vertical';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (game.phase === 'placement') btnRotate.click();
    }
  });

  /* ── Botão aleatório ── */
  btnRandom.addEventListener('click', () => {
    const p = game.placing;
    p.board.placeRandom(p.ships);
    game.shipQueueIdx = p.ships.length;
    buildGrid(placementGrid, null, true);
    updateShipQueueList();
    btnConfirm.disabled = false;
    placementSubtitle.textContent = 'Navios posicionados aleatoriamente! Confirme para continuar.';
  });

  /* ── Confirmar posicionamento ── */
  btnConfirm.addEventListener('click', () => {
    if (game.placingPlayerIndex === 0) {
      // Passou para o segundo jogador posicionar
      game.placingPlayerIndex = 1;
      game.shipQueueIdx = 0;
      btnConfirm.disabled = true;

      // Mostra handover antes do P2 posicionar
      hideAllOverlays();
      handoverTitle.textContent = `Vez de ${game.players[1].name} posicionar`;
      handoverMsg.textContent   = 'Passe o dispositivo. Não deixe o adversário ver!';
      showOverlay(handoverOverlay);
      btnHandover.dataset.context = 'placement';

    } else {
      // Ambos posicionaram – iniciar batalha
      game.phase        = 'battle';
      game.currentIndex = 0;
      game.shotMadeThisTurn = false;

      hideAllOverlays();
      handoverTitle.textContent = `Vez de ${game.players[0].name} atacar`;
      handoverMsg.textContent   = 'Passe o dispositivo. A batalha começa!';
      showOverlay(handoverOverlay);
      btnHandover.dataset.context = 'battle';
    }
  });

  /* ── Handover ── */
  btnHandover.addEventListener('click', () => {
    const ctx = btnHandover.dataset.context;
    hideAllOverlays();

    if (ctx === 'placement') {
      renderPlacementForCurrentPlayer();
      showOverlay(placementOverlay);
    } else {
      // Batalha
      showGameBoard();
      gameWrapper.classList.remove('hidden');
    }
  });

  /* ════════════════════════════════════════
     FASE DE BATALHA
  ════════════════════════════════════════ */

  function showGameBoard() {
    updateScoreboard();
    renderBattleGrids();
    btnEndTurn.disabled = true;
    game.shotMadeThisTurn = false;
  }

  function updateScoreboard() {
    const p0 = game.players[0];
    const p1 = game.players[1];

    shipsP1El.textContent = p0.shipsRemaining();
    shipsP2El.textContent = p1.shipsRemaining();

    // Destaque de quem está jogando
    scoreP1El.classList.toggle('active-turn', game.currentIndex === 0);
    scoreP2El.classList.toggle('active-turn', game.currentIndex === 1);

    turnTextEl.textContent = `Turno de: ${game.current.name}`;

    attackLabel.textContent = `Atacar: ${game.opponent.name}`;
  }

  function renderBattleGrids() {
    // Tabuleiro de ataque = grade do oponente
    buildGridBattle(attackGrid,  game.opponent.board, false);
    // Tabuleiro de defesa = grade própria
    buildGridBattle(defenseGrid, game.current.board,  true);
  }

  function buildGridBattle(gridEl, board, isDefense) {
    gridEl.innerHTML = '';
    const COLS = ['A','B','C','D','E','F','G','H','I','J'];

    const corner = document.createElement('div');
    corner.className = 'cell-header';
    gridEl.appendChild(corner);

    COLS.forEach(c => {
      const h = document.createElement('div');
      h.className = 'cell-header';
      h.textContent = c;
      gridEl.appendChild(h);
    });

    for (let row = 0; row < Board.SIZE; row++) {
      const rh = document.createElement('div');
      rh.className = 'cell-header';
      rh.textContent = row + 1;
      gridEl.appendChild(rh);

      for (let col = 0; col < Board.SIZE; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        renderBoardCell(cell, row, col, { board, isDefense });

        if (!isDefense) {
          cell.addEventListener('click', onAttackClick);
        }

        gridEl.appendChild(cell);
      }
    }
  }

  function onAttackClick(e) {
    if (game.shotMadeThisTurn) return; // só 1 tiro por turno

    const row = parseInt(e.currentTarget.dataset.row);
    const col = parseInt(e.currentTarget.dataset.col);

    const result = game.opponent.board.receiveShot(row, col);
    if (result.result === 'already') return;

    game.shotMadeThisTurn = true;

    // Atualizar célula visualmente
    const cell = e.currentTarget;
    if (result.result === 'hit' || result.result === 'sunk') {
      cell.classList.add('hit');
      if (result.result === 'sunk') cell.classList.add('sunk-cell');
    } else {
      cell.classList.add('miss');
    }

    // Registrar no log
    const COLS = ['A','B','C','D','E','F','G','H','I','J'];
    const coord = `${COLS[col]}${row + 1}`;
    addToLog(result, coord, game.current.name, result.ship);

    // Tabela de afundados
    if (result.result === 'sunk') {
      addSunkRow(game.current.name, result.ship);
      updateDefenseGrid(); // atualizar grade de defesa do oponente ao virar
    }

    // Verificar vitória
    if (game.opponent.board.allSunk()) {
      showGameOver(game.current.name);
      return;
    }

    updateScoreboard();
    btnEndTurn.disabled = false;
  }

  function updateDefenseGrid() {
    // Atualiza células sunk na grade de defesa
    const cells = defenseGrid.querySelectorAll('.cell');
    cells.forEach(cell => {
      const row  = parseInt(cell.dataset.row);
      const col  = parseInt(cell.dataset.col);
      if (isNaN(row)) return;
      renderBoardCell(cell, row, col, { board: game.current.board, isDefense: true });
    });
  }

  /* ── Log de ações (OL dinâmica) ── */
  function addToLog(result, coord, playerName, ship) {
    const li = document.createElement('li');
    let text;
    if (result.result === 'sunk') {
      text = `💥 ${playerName} afundou ${ship.emoji} ${ship.name} em ${coord}!`;
      li.className = 'log-sunk';
    } else if (result.result === 'hit') {
      text = `🎯 ${playerName} acertou em ${coord}!`;
      li.className = 'log-hit';
    } else {
      text = `💨 ${playerName} errou em ${coord}.`;
      li.className = 'log-miss';
    }
    li.textContent = text;

    // Inserir no topo
    actionLogEl.insertBefore(li, actionLogEl.firstChild);

    // Limitar a 20 entradas
    while (actionLogEl.children.length > 20) {
      actionLogEl.removeChild(actionLogEl.lastChild);
    }

    game.actionLog.unshift({ text, type: li.className });
  }

  /* ── Tabela de afundados (TABLE dinâmica) ── */
  function addSunkRow(playerName, ship) {
    const tr = document.createElement('tr');
    tr.className = 'new-row';

    const tdPlayer = document.createElement('td');
    tdPlayer.textContent = playerName;

    const tdShip = document.createElement('td');
    tdShip.textContent = `${ship.emoji} ${ship.name}`;

    const tdSize = document.createElement('td');
    tdSize.textContent = ship.size;

    tr.appendChild(tdPlayer);
    tr.appendChild(tdShip);
    tr.appendChild(tdSize);

    sunkTableBody.appendChild(tr);

    // Remover classe de animação após ela terminar
    setTimeout(() => tr.classList.remove('new-row'), 500);
  }

  /* ── Fim de turno ── */
  btnEndTurn.addEventListener('click', () => {
    if (!game.shotMadeThisTurn) return;

    btnEndTurn.disabled = true;
    game.shotMadeThisTurn = false;

    // Trocar jogador
    game.currentIndex = 1 - game.currentIndex;

    // Handover
    hideAllOverlays();
    handoverTitle.textContent = `Vez de ${game.current.name} atacar`;
    handoverMsg.textContent   = 'Passe o dispositivo para o próximo jogador!';
    showOverlay(handoverOverlay);
    btnHandover.dataset.context = 'battle';
  });

  /* ── Game over ── */
  function showGameOver(winnerName) {
    gameoverTitle.textContent = `🏆 ${winnerName} venceu!`;
    gameoverMsg.textContent   = `Parabéns, Capitão ${winnerName}! Você afundou toda a frota inimiga!`;
    hideAllOverlays();
    showOverlay(gameoverOverlay);
  }

  btnRestart.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */

  function showOverlay(overlay) {
    overlay.classList.add('active');
  }

  function hideAllOverlays() {
    [placementOverlay, handoverOverlay, gameoverOverlay].forEach(o => o.classList.remove('active'));
  }

  /* ── Iniciar ── */
  startPlacementPhase();
});
