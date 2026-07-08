/**
 * Модуль визуализации.
 *
 * Отвечает за отрисовку графа на SVG-холсте и применение «шагов»,
 * генерируемых алгоритмами. Каждый шаг - это снимок состояния:
 * текущая вершина, посещённые/в очереди/в дереве вершины, активные
 * и пропущенные рёбра.
 *
 * Цвета состояний вынесены в CSS-переменные (см. css/styles.css),
 * поэтому визуализатор лишь назначает классы элементам.
 */

const VERTEX_RADIUS = 20;

const STATE = {
  DEFAULT: 'default',
  CURRENT: 'current',
  VISITED: 'visited',
  QUEUED: 'queued',
  STACK: 'stack',
  IN_TREE: 'in-tree',
};

export class Visualizer {
  /**
   * @param {SVGSVGElement} svg - корневой SVG-элемент холста.
   */
  constructor(svg) {
    this.svg = svg;
    this.svgNS = 'http://www.w3.org/2000/svg';
    // Viewport: корневой <g>, к которому применяется translate + scale (pan/zoom).
    this.viewport = document.createElementNS(this.svgNS, 'g');
    this.viewport.setAttribute('id', 'viewport');
    this.svg.appendChild(this.viewport);
    // Слои для корректного z-order: рёбра -> подписи весов -> вершины.
    this.edgeLayer = this._group('edge-layer');
    this.edgeLabelLayer = this._group('edge-label-layer');
    this.vertexLayer = this._group('vertex-layer');
    /** @type {Map<number,{circle:SVGCircleElement,label:SVGTextElement}>} */
    this.vertexEls = new Map();
    /** @type {Map<number,{line:SVGLineElement,label:SVGTextElement}>} */
    this.edgeEls = new Map();

    // Трансформация viewport: pan (tx, ty) и zoom (scale).
    this.tx = 0; this.ty = 0; this.scale = 1;
  }

  _group(id) {
    const g = document.createElementNS(this.svgNS, 'g');
    g.setAttribute('id', id);
    this.viewport.appendChild(g);
    return g;
  }

  /** Применяет текущую трансформацию pan/zoom к viewport. */
  applyViewportTransform() {
    this.viewport.setAttribute('transform',
      `translate(${this.tx}, ${this.ty}) scale(${this.scale})`);
  }

  /** Переводит экранные координаты в координаты холста (с учётом pan/zoom). */
  screenToWorld(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: (sx - this.tx) / this.scale,
      y: (sy - this.ty) / this.scale,
    };
  }

  /** Зум к точке курсора: сохраняет позицию под курсором. */
  zoomAt(clientX, clientY, factor) {
    const rect = this.svg.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const newScale = Math.max(0.3, Math.min(3, this.scale * factor));
    // Корректируем сдвиг, чтобы точка под курсором осталась на месте.
    this.tx = sx - (sx - this.tx) * (newScale / this.scale);
    this.ty = sy - (sy - this.ty) * (newScale / this.scale);
    this.scale = newScale;
    this.applyViewportTransform();
  }

  /** Сдвигает viewport на (dx, dy) в экранных координатах. */
  panBy(dx, dy) {
    this.tx += dx;
    this.ty += dy;
    this.applyViewportTransform();
  }

  /** Сброс pan/zoom к значениям по умолчанию. */
  resetView() {
    this.tx = 0; this.ty = 0; this.scale = 1;
    this.applyViewportTransform();
  }

  /** Полная перерисовка графа по модели. */
  render(graph) {
    this.edgeLayer.innerHTML = '';
    this.edgeLabelLayer.innerHTML = '';
    this.vertexLayer.innerHTML = '';
    this.vertexEls.clear();
    this.edgeEls.clear();

    for (const e of graph.getEdges()) {
      this._createEdge(e, graph);
    }
    for (const v of graph.getVertices()) {
      this._createVertex(v);
    }
  }

  _createVertex(v) {
    const g = document.createElementNS(this.svgNS, 'g');
    g.setAttribute('class', 'vertex-group');
    g.setAttribute('data-id', v.id);
    g.setAttribute('transform', `translate(${v.x}, ${v.y})`);

    const circle = document.createElementNS(this.svgNS, 'circle');
    circle.setAttribute('r', VERTEX_RADIUS);
    circle.setAttribute('class', `vertex ${STATE.DEFAULT}`);
    g.appendChild(circle);

    const label = document.createElementNS(this.svgNS, 'text');
    label.setAttribute('class', 'vertex-label');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.textContent = v.label;
    g.appendChild(label);

    this.vertexLayer.appendChild(g);
    this.vertexEls.set(v.id, { circle, label, group: g });
  }

  _createEdge(e, graph) {
    const from = graph.getVertex(e.from);
    const to = graph.getVertex(e.to);

    const line = document.createElementNS(this.svgNS, 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);
    line.setAttribute('class', `edge ${STATE.DEFAULT}`);
    this.edgeLayer.appendChild(line);

    const label = document.createElementNS(this.svgNS, 'text');
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    label.setAttribute('x', mx);
    label.setAttribute('y', my);
    label.setAttribute('class', 'edge-label');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = e.weight;
    this.edgeLabelLayer.appendChild(label);

    this.edgeEls.set(e.id, { line, label });
  }

  /** Обновляет позицию вершины (при перетаскивании). */
  updateVertexPosition(graph, id) {
    const v = graph.getVertex(id);
    const el = this.vertexEls.get(id);
    if (!v || !el) return;
    el.group.setAttribute('transform', `translate(${v.x}, ${v.y})`);
    // Обновляем концы инцидентных рёбер.
    for (const e of graph.getEdges()) {
      if (e.from === id || e.to === id) {
        const from = graph.getVertex(e.from);
        const to = graph.getVertex(e.to);
        const eEl = this.edgeEls.get(e.id);
        if (!eEl) continue;
        eEl.line.setAttribute('x1', from.x);
        eEl.line.setAttribute('y1', from.y);
        eEl.line.setAttribute('x2', to.x);
        eEl.line.setAttribute('y2', to.y);
        eEl.label.setAttribute('x', (from.x + to.x) / 2);
        eEl.label.setAttribute('y', (from.y + to.y) / 2);
      }
    }
  }

  /** Сбрасывает все элементы в состояние по умолчанию. */
  resetStates() {
    for (const { circle } of this.vertexEls.values()) {
      circle.setAttribute('class', `vertex ${STATE.DEFAULT}`);
    }
    for (const { line } of this.edgeEls.values()) {
      line.setAttribute('class', `edge ${STATE.DEFAULT}`);
    }
  }

  /** Применяет шаг алгоритма к холсту. */
  applyStep(step, graph) {
    this.resetStates();

    const visited = new Set(step.visited || []);
    const inTree = new Set(step.inTree || []);
    const queue = new Set(step.queue || []);
    const stack = new Set(step.stack || []);
    const activeEdges = new Set(step.activeEdges || []);
    const skippedEdges = new Set(step.skippedEdges || []);
    const mstEdges = new Set(step.mstEdges || []);

    // Вершины.
    for (const [id, { circle }] of this.vertexEls) {
      let state = STATE.DEFAULT;
      if (step.current === id) state = STATE.CURRENT;
      else if (inTree.has(id)) state = STATE.IN_TREE;
      else if (visited.has(id)) state = STATE.VISITED;
      else if (queue.has(id)) state = STATE.QUEUED;
      else if (stack.has(id)) state = STATE.STACK;
      circle.setAttribute('class', `vertex ${state}`);
    }

    // Рёбра.
    for (const [id, { line }] of this.edgeEls) {
      let state = STATE.DEFAULT;
      if (skippedEdges.has(id)) state = 'skipped';
      else if (mstEdges.has(id)) state = 'in-tree';
      else if (activeEdges.has(id)) state = STATE.CURRENT;
      line.setAttribute('class', `edge ${state}`);
    }
  }

  /** Подсветка вершины при наведении/выборе (для редактора). */
  setVertexState(id, state) {
    const el = this.vertexEls.get(id);
    if (el) el.circle.setAttribute('class', `vertex ${state}`);
  }

  /** Подсветка ребра (для редактора). */
  setEdgeState(id, state) {
    const el = this.edgeEls.get(id);
    if (el) el.line.setAttribute('class', `edge ${state}`);
  }
}

export { STATE };
