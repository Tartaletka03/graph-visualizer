/**
 * Контроллер пользовательского интерфейса.
 *
 * Связывает модель графа, модуль визуализации и алгоритмы с действиями
 * пользователя. Разделён на три зоны ответственности:
 *  - редактор графа (создание, перемещение, удаление вершин и рёбер);
 *  - управление выполнением алгоритма (запуск, шаги, автопроигрывание);
 *  - информационная панель (описание шага, порядок обхода, расстояния, MST).
 */

import { bfs } from '../algorithms/bfs.js';
import { dfs } from '../algorithms/dfs.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { prim } from '../algorithms/prim.js';
import { kruskal } from '../algorithms/kruskal.js';

const ALGORITHMS = { bfs, dfs, dijkstra, prim, kruskal };

// Алгоритмы, которым нужна стартовая вершина.
const NEEDS_START = new Set(['bfs', 'dfs', 'dijkstra', 'prim']);

export class UIController {
  constructor(graph, visualizer) {
    this.graph = graph;
    this.visualizer = visualizer;

    this.selectedAlgo = 'bfs';
    this.steps = [];
    this.currentStep = -1;
    this.autoTimer = null;

    // Состояние редактора.
    this.dragging = null;          // перетаскиваемая вершина
    this.connectFrom = null;       // первая вершина для создания ребра
    this.dragMoved = false;

    this._cacheDom();
    this._bindEvents();
    this._renderVertexOptions();
  }

  _cacheDom() {
    const $ = (id) => document.getElementById(id);
    this.canvas = $('canvas');
    this.algoButtons = document.querySelectorAll('[data-algo]');
    this.startSelect = $('start-vertex');
    this.btnRun = $('btn-run');
    this.btnPrev = $('btn-prev');
    this.btnNext = $('btn-next');
    this.btnAuto = $('btn-auto');
    this.btnReset = $('btn-reset');
    this.btnSample = $('btn-sample');
    this.btnClear = $('btn-clear');
    this.btnFit = $('btn-fit');
    this.speedSlider = $('speed-slider');
    this.speedValue = $('speed-value');
    this.infoStep = $('info-step');
    this.infoDesc = $('info-desc');
    this.infoOrder = $('info-order');
    this.infoDistances = $('info-distances');
    this.infoMst = $('info-mst');
    this.weightModal = $('weight-modal');
    this.weightInput = $('weight-input');
    this.weightOk = $('weight-ok');
    this.weightCancel = $('weight-cancel');
    this.contextMenu = $('context-menu');
    this.hint = $('hint');
  }

  _bindEvents() {
    // Выбор алгоритма.
    this.algoButtons.forEach((btn) => {
      btn.addEventListener('click', () => this._selectAlgorithm(btn.dataset.algo));
    });

    // Кнопки управления.
    this.btnRun.addEventListener('click', () => this.runAlgorithm());
    this.btnNext.addEventListener('click', () => this.nextStep());
    this.btnPrev.addEventListener('click', () => this.prevStep());
    this.btnAuto.addEventListener('click', () => this.toggleAuto());
    this.btnReset.addEventListener('click', () => this.resetVisualization());
    this.btnSample.addEventListener('click', () => this.loadSample());
    this.btnClear.addEventListener('click', () => this.clearAll());
    this.btnFit.addEventListener('click', () => this.fitToScreen());

    // Слайдер скорости.
    this.speedSlider.addEventListener('input', () => {
      this.speedValue.textContent = `${this.speedSlider.value} мс`;
      if (this.autoTimer) {
        this._stopAuto();
        this._startAuto();
      }
    });

    // Редактор графа: клики и перетаскивание на холсте.
    this.canvas.addEventListener('mousedown', (e) => this._onCanvasDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onCanvasMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._onCanvasUp(e));
    this.canvas.addEventListener('contextmenu', (e) => this._onContextMenu(e));

    // Pan/zoom: колесо мыши (зум), средняя кнопка или пробел (pan).
    this.spaceDown = false;
    this.panning = false;
    this.panStart = null;
    this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this._isInputFocused(e)) {
        this.spaceDown = true; this.canvas.style.cursor = 'grab'; e.preventDefault();
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') { this.spaceDown = false; this.canvas.style.cursor = 'crosshair'; }
    });

    // Touch для мобильных: одно касание — pan (если не попало в вершину),
    // два касания — pinch-zoom.
    this._touchState = null;
    this.canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });

    // Модальное окно ввода веса.
    this.weightOk.addEventListener('click', () => this._confirmWeight());
    this.weightCancel.addEventListener('click', () => this._cancelWeight());
    this.weightInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._confirmWeight();
      if (e.key === 'Escape') this._cancelWeight();
    });

    // Контекстное меню.
    document.addEventListener('click', () => this.contextMenu.classList.add('hidden'));
  }

  _selectAlgorithm(algo) {
    this.selectedAlgo = algo;
    this.algoButtons.forEach((b) => {
      b.classList.toggle('active', b.dataset.algo === algo);
    });
    this.startSelect.parentElement.style.display = NEEDS_START.has(algo) ? '' : 'none';
    this.resetVisualization();
  }

  _renderVertexOptions() {
    this.startSelect.innerHTML = '';
    for (const v of this.graph.getVertices()) {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.label;
      this.startSelect.appendChild(opt);
    }
  }

  // ---------- Редактор графа ----------

  /** Координаты курсора в системе холста (с учётом pan/zoom). */
  _getMousePos(e) {
    return this.visualizer.screenToWorld(e.clientX, e.clientY);
  }

  _vertexAt(x, y) {
    const r = 20;
    for (const v of this.graph.getVertices()) {
      const dx = v.x - x;
      const dy = v.y - y;
      if (dx * dx + dy * dy <= r * r) return v;
    }
    return null;
  }

  _isInputFocused(e) {
    const t = e.target.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT';
  }

  /** Зум колесом мыши к точке курсора. */
  _onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.visualizer.zoomAt(e.clientX, e.clientY, factor);
  }

  _onCanvasDown(e) {
    // Средняя кнопка или пробел — pan холста; левая без пробела — редактор.
    if (e.button === 1 || (e.button === 0 && this.spaceDown)) {
      this.panning = true;
      this.panStart = { x: e.clientX, y: e.clientY, tx: this.visualizer.tx, ty: this.visualizer.ty };
      this.canvas.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return;
    const { x, y } = this._getMousePos(e);
    const v = this._vertexAt(x, y);
    this.dragMoved = false;

    if (v) {
      this.dragging = v.id;
      this._dragOffset = { dx: v.x - x, dy: v.y - y };
    }
  }

  _onCanvasMove(e) {
    if (this.panning) {
      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;
      this.visualizer.tx = this.panStart.tx + dx;
      this.visualizer.ty = this.panStart.ty + dy;
      this.visualizer.applyViewportTransform();
      return;
    }
    if (this.dragging === null) return;
    const { x, y } = this._getMousePos(e);
    const v = this.graph.getVertex(this.dragging);
    if (!v) return;
    v.x = x + this._dragOffset.dx;
    v.y = y + this._dragOffset.dy;
    this.dragMoved = true;
    this.visualizer.updateVertexPosition(this.graph, v.id);
  }

  _onCanvasUp(e) {
    if (this.panning) {
      this.panning = false;
      this.canvas.style.cursor = this.spaceDown ? 'grab' : 'crosshair';
      return;
    }
    if (e.button !== 0) return;
    const { x, y } = this._getMousePos(e);
    const v = this._vertexAt(x, y);

    if (this.dragging !== null && !this.dragMoved) {
      // Клик по вершине без перетаскивания — создание ребра.
      this._handleVertexClick(v);
    } else if (this.dragging === null && !v) {
      // Клик по пустому месту — добавление вершины.
      this._addVertex(x, y);
    }

    this.dragging = null;
    this.dragMoved = false;
  }

  _addVertex(x, y) {
    const v = this.graph.addVertex(x, y);
    this.visualizer.render(this.graph);
    this._renderVertexOptions();
    this._showHint('');
  }

  _handleVertexClick(v) {
    if (this.connectFrom === null) {
      this.connectFrom = v.id;
      this.visualizer.setVertexState(v.id, 'current');
    } else if (this.connectFrom !== v.id) {
      // Запрос веса ребра через модальное окно.
      this._pendingEdge = { from: this.connectFrom, to: v.id };
      this.visualizer.setVertexState(this.connectFrom, 'default');
      this.visualizer.setVertexState(v.id, 'current');
      this._openWeightModal();
    } else {
      // Клик по той же вершине — отмена.
      this.visualizer.setVertexState(this.connectFrom, 'default');
      this.connectFrom = null;
    }
  }

  _openWeightModal() {
    this.weightInput.value = '1';
    this.weightModal.classList.remove('hidden');
    this.weightInput.focus();
    this.weightInput.select();
  }

  _confirmWeight() {
    const w = parseInt(this.weightInput.value, 10);
    if (Number.isNaN(w) || w < 0) {
      this.weightInput.classList.add('error');
      return;
    }
    this.weightInput.classList.remove('error');
    const { from, to } = this._pendingEdge;
    try {
      this.graph.addEdge(from, to, w);
      this.visualizer.render(this.graph);
      this._renderVertexOptions();
    } catch (err) {
      this._showHint(err.message);
    }
    this._closeWeightModal();
  }

  _cancelWeight() {
    if (this._pendingEdge) {
      this.visualizer.setVertexState(this._pendingEdge.to, 'default');
    }
    this._closeWeightModal();
  }

  _closeWeightModal() {
    this.weightModal.classList.add('hidden');
    this._pendingEdge = null;
    this.connectFrom = null;
  }

  _onContextMenu(e) {
    e.preventDefault();
    const { x, y } = this._getMousePos(e);
    const v = this._vertexAt(x, y);
    let edge = null;
    if (!v) {
      edge = this._edgeAt(x, y);
    }

    this.contextMenu.innerHTML = '';
    this.contextMenu.classList.remove('hidden');

    if (v) {
      const item = document.createElement('button');
      item.textContent = 'Удалить вершину';
      item.addEventListener('click', () => {
        this.graph.removeVertex(v.id);
        this.visualizer.render(this.graph);
        this._renderVertexOptions();
        this.contextMenu.classList.add('hidden');
      });
      this.contextMenu.appendChild(item);
    } else if (edge) {
      const item = document.createElement('button');
      item.textContent = 'Удалить ребро';
      item.addEventListener('click', () => {
        this.graph.removeEdge(edge.id);
        this.visualizer.render(this.graph);
        this.contextMenu.classList.add('hidden');
      });
      this.contextMenu.appendChild(item);
    } else {
      this.contextMenu.classList.add('hidden');
      return;
    }

    this.contextMenu.style.left = `${e.clientX}px`;
    this.contextMenu.style.top = `${e.clientY}px`;
  }

  _edgeAt(x, y) {
    const threshold = 8;
    for (const e of this.graph.getEdges()) {
      const a = this.graph.getVertex(e.from);
      const b = this.graph.getVertex(e.to);
      const d = distToSegment(x, y, a.x, a.y, b.x, b.y);
      if (d <= threshold) return e;
    }
    return null;
  }

  _showHint(text) {
    if (this.hint) this.hint.textContent = text;
  }

  // ---------- Touch-управление (pan/zoom для мобильных) ----------

  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const world = this.visualizer.screenToWorld(t.clientX, t.clientY);
      const v = this._vertexAt(world.x, world.y);
      if (v) {
        // Начинаем перетаскивание вершины.
        this._touchState = {
          mode: 'drag-vertex',
          vertexId: v.id,
          offset: { dx: v.x - world.x, dy: v.y - world.y },
          startX: t.clientX,
          startY: t.clientY,
          moved: false,
        };
      } else {
        // Pan холста.
        this._touchState = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          tx: this.visualizer.tx,
          ty: this.visualizer.ty,
        };
      }
    } else if (e.touches.length === 2) {
      // Pinch-zoom.
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      this._touchState = {
        mode: 'pinch',
        startDist: dist,
        startScale: this.visualizer.scale,
        cx, cy,
      };
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (!this._touchState) return;
    const st = this._touchState;

    if (st.mode === 'drag-vertex' && e.touches.length === 1) {
      const t = e.touches[0];
      const world = this.visualizer.screenToWorld(t.clientX, t.clientY);
      const v = this.graph.getVertex(st.vertexId);
      if (v) {
        v.x = world.x + st.offset.dx;
        v.y = world.y + st.offset.dy;
        st.moved = Math.hypot(t.clientX - st.startX, t.clientY - st.startY) > 8;
        this.visualizer.updateVertexPosition(this.graph, v.id);
      }
    } else if (st.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      this.visualizer.tx = st.tx + (t.clientX - st.startX);
      this.visualizer.ty = st.ty + (t.clientY - st.startY);
      this.visualizer.applyViewportTransform();
    } else if (st.mode === 'pinch' && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const factor = dist / st.startDist;
      const newScale = Math.max(0.3, Math.min(3, st.startScale * factor));
      // Зум к центру между пальцами.
      const rect = this.canvas.getBoundingClientRect();
      const sx = st.cx - rect.left;
      const sy = st.cy - rect.top;
      this.visualizer.tx = sx - (sx - this.visualizer.tx) * (newScale / this.visualizer.scale);
      this.visualizer.ty = sy - (sy - this.visualizer.ty) * (newScale / this.visualizer.scale);
      this.visualizer.scale = newScale;
      this.visualizer.applyViewportTransform();
    }
  }

  _onTouchEnd(e) {
    if (!this._touchState) return;
    const st = this._touchState;
    // Если перетаскивали вершину, но не сдвинули — это клик (создание ребра).
    if (st.mode === 'drag-vertex' && !st.moved) {
      const v = this.graph.getVertex(st.vertexId);
      if (v) this._handleVertexClick(v);
    }
    this._touchState = null;
  }

  // ---------- Управление алгоритмом ----------

  runAlgorithm() {
    if (this.graph.vertexCount() === 0) {
      this._showHint('Сначала создайте граф или загрузите пример');
      return;
    }
    const algo = ALGORITHMS[this.selectedAlgo];
    const startId = parseInt(this.startSelect.value, 10);

    if (NEEDS_START.has(this.selectedAlgo)) {
      this.steps = algo(this.graph, startId);
    } else {
      this.steps = algo(this.graph);
    }
    this.currentStep = 0;
    this._applyCurrent();
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._applyCurrent();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._applyCurrent();
    }
  }

  toggleAuto() {
    if (this.autoTimer) {
      this._stopAuto();
    } else {
      if (this.steps.length === 0) this.runAlgorithm();
      this._startAuto();
    }
  }

  _startAuto() {
    this.btnAuto.textContent = '⏸ Пауза';
    const delay = parseInt(this.speedSlider.value, 10);
    this.autoTimer = setInterval(() => {
      if (this.currentStep >= this.steps.length - 1) {
        this._stopAuto();
        return;
      }
      this.nextStep();
    }, delay);
  }

  _stopAuto() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
    this.btnAuto.textContent = '▶ Авто';
  }

  resetVisualization() {
    this._stopAuto();
    this.steps = [];
    this.currentStep = -1;
    this.visualizer.resetStates();
    this.infoStep.textContent = '—';
    this.infoDesc.textContent = 'Выберите алгоритм и нажмите «Запустить»';
    this.infoOrder.innerHTML = '';
    this.infoDistances.innerHTML = '';
    this.infoMst.innerHTML = '';
  }

  _applyCurrent() {
    if (this.currentStep < 0 || !this.steps.length) return;
    const step = this.steps[this.currentStep];
    this.visualizer.applyStep(step, this.graph);
    this._updateInfoPanel(step);
  }

  _updateInfoPanel(step) {
    this.infoStep.textContent = `Шаг ${this.currentStep + 1} / ${this.steps.length}`;
    this.infoDesc.textContent = step.desc || '';

    // Порядок обхода (BFS/DFS).
    if (step.order) {
      const labels = step.order.map((id) => this.graph.getVertex(id)?.label || id);
      this.infoOrder.innerHTML = labels.length
        ? `<span class="info-label">Порядок обхода:</span> ${labels.join(' → ')}`
        : '';
    } else {
      this.infoOrder.innerHTML = '';
    }

    // Таблица расстояний (Дейкстра).
    if (step.distances) {
      this.infoDistances.innerHTML = this._renderDistanceTable(step);
    } else {
      this.infoDistances.innerHTML = '';
    }

    // MST (Прим/Краскал).
    if (step.mstEdges) {
      this.infoMst.innerHTML = this._renderMstInfo(step);
    } else {
      this.infoMst.innerHTML = '';
    }
  }

  _renderDistanceTable(step) {
    const rows = Object.entries(step.distances)
      .map(([label, d]) => {
        const val = d === Infinity ? '∞' : d;
        const prev = step.prev && step.prev[label] ? `← ${step.prev[label]}` : '';
        const isCurrent = step.current !== null && this.graph.getVertex(step.current)?.label === label;
        return `<tr class="${isCurrent ? 'row-current' : ''}">
          <td>${label}</td><td>${val}</td><td>${prev}</td></tr>`;
      })
      .join('');
    return `<span class="info-label">Расстояния от источника:</span>
      <table class="data-table"><thead><tr><th>Вершина</th><th>Расст.</th><th>Предок</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
  }

  _renderMstInfo(step) {
    const count = step.mstEdges.length;
    return `<span class="info-label">Остовное дерево:</span> рёбер — ${count},
      суммарный вес — <strong>${step.totalWeight}</strong>`;
  }

  // ---------- Пример графа и очистка ----------

  loadSample() {
    this.graph.clear();
    // 6 вершин, расположенных по кругу.
    const cx = 360, cy = 280, r = 180;
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const ids = [];
    for (let i = 0; i < 6; i++) {
      const angle = (-90 + i * 60) * Math.PI / 180;
      const v = this.graph.addVertex(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      ids.push(v.id);
    }
    // Рёбра из примера отчёта.
    const edges = [
      [0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 5],
      [2, 3, 8], [2, 4, 10], [3, 4, 2], [3, 5, 6], [4, 5, 3],
    ];
    for (const [a, b, w] of edges) {
      this.graph.addEdge(ids[a], ids[b], w);
    }
    this.visualizer.render(this.graph);
    this._renderVertexOptions();
    this.resetVisualization();
    this._showHint('Загружен пример графа (6 вершин, 9 рёбер)');
  }

  clearAll() {
    this.graph.clear();
    this.visualizer.render(this.graph);
    this._renderVertexOptions();
    this.resetVisualization();
    this._showHint('Граф очищен');
  }

  /** Масштабирует граф так, чтобы он весь поместился в видимую область. */
  fitToScreen() {
    const vertices = this.graph.getVertices();
    if (vertices.length === 0) {
      this.visualizer.resetView();
      this._showHint('Холст пуст');
      return;
    }
    const xs = vertices.map((v) => v.x);
    const ys = vertices.map((v) => v.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const padding = 60;
    const rect = this.canvas.getBoundingClientRect();
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;
    const scale = Math.min(rect.width / w, rect.height / h, 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    this.visualizer.scale = Math.max(0.3, scale);
    this.visualizer.tx = rect.width / 2 - cx * this.visualizer.scale;
    this.visualizer.ty = rect.height / 2 - cy * this.visualizer.scale;
    this.visualizer.applyViewportTransform();
    this._showHint('Вид подогнан под граф');
  }
}

/** Расстояние от точки до отрезка. */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}
