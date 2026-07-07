/**
 * Модель графа.
 * Хранит вершины и рёбра, поддерживает карту смежности для быстрого
 * доступа к соседям вершины (O(1) вместо полного просмотра массива рёбер).
 *
 * Назначение: единственный источник данных о структуре графа для всех
 * алгоритмов и модуля визуализации.
 */

// Счётчики для генерации уникальных идентификаторов.
let vertexCounter = 0;
let edgeCounter = 0;

// Буквы для подписей вершин: A, B, ..., Z, AA, AB, ...
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function labelFromId(id) {
  // id — порядковый номер вершины (0, 1, 2, ...).
  let n = id;
  let label = '';
  n += 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = LETTERS[rem] + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export class Graph {
  constructor(directed = false) {
    this.directed = directed;
    /** @type {Map<number, {id:number,label:string,x:number,y:number}>} */
    this.vertices = new Map();
    /** @type {Map<number, {id:number,from:number,to:number,weight:number}>} */
    this.edges = new Map();
    /**
     * Карта смежности: vertexId -> Array<{to, edgeId, weight}>.
     * Для неориентированного графа запись добавляется в обе стороны.
     * Перестраивается при любом изменении набора рёбер.
     */
    this._adjacency = new Map();
  }

  /** Создаёт вершину в указанных координатах холста. */
  addVertex(x = 0, y = 0, label = null) {
    const id = vertexCounter++;
    const vertex = { id, label: label || labelFromId(id), x, y };
    this.vertices.set(id, vertex);
    this._adjacency.set(id, []);
    return vertex;
  }

  /** Добавляет взвешенное ребро между двумя вершинами. */
  addEdge(from, to, weight = 1) {
    if (!this.vertices.has(from) || !this.vertices.has(to)) {
      throw new Error('Одна из вершин не существует');
    }
    if (from === to) {
      throw new Error('Петли не допускаются');
    }
    const id = edgeCounter++;
    const edge = { id, from, to, weight };
    this.edges.set(id, edge);
    // Обновляем карту смежности без полного перестроения.
    this._adjacency.get(from).push({ to, edgeId: id, weight });
    if (!this.directed) {
      this._adjacency.get(to).push({ to: from, edgeId: id, weight });
    }
    return edge;
  }

  removeVertex(id) {
    if (!this.vertices.has(id)) return false;
    // Удаляем все инцидентные рёбра.
    const incident = new Set();
    for (const e of this.edges.values()) {
      if (e.from === id || e.to === id) incident.add(e.id);
    }
    incident.forEach((eid) => this.removeEdge(eid));
    this.vertices.delete(id);
    this._adjacency.delete(id);
    return true;
  }

  removeEdge(id) {
    const edge = this.edges.get(id);
    if (!edge) return false;
    this.edges.delete(id);
    // Перестраиваем карту смежности для надёжности.
    this._rebuildAdjacency();
    return true;
  }

  getVertex(id) {
    return this.vertices.get(id);
  }

  getEdge(id) {
    return this.edges.get(id);
  }

  /** Возвращает массив всех вершин. */
  getVertices() {
    return Array.from(this.vertices.values());
  }

  /** Возвращает массив всех рёбер. */
  getEdges() {
    return Array.from(this.edges.values());
  }

  /**
   * Возвращает соседей вершины через карту смежности — O(степень вершины),
   * а не O(E), как при линейном поиске по массиву рёбер.
   * @returns {Array<{to:number,edgeId:number,weight:number}>}
   */
  getNeighbors(vertexId) {
    const list = this._adjacency.get(vertexId);
    return list ? list.slice() : [];
  }

  /** Полная очистка графа. */
  clear() {
    this.vertices.clear();
    this.edges.clear();
    this._adjacency.clear();
  }

  /** Возвращает количество вершин. */
  vertexCount() {
    return this.vertices.size;
  }

  /** Возвращает количество рёбер. */
  edgeCount() {
    return this.edges.size;
  }

  /** Сериализация в обычный объект (для сохранения/загрузки). */
  toJSON() {
    return {
      directed: this.directed,
      vertices: this.getVertices(),
      edges: this.getEdges(),
    };
  }

  /** Полное перестроение карты смежности. */
  _rebuildAdjacency() {
    this._adjacency.clear();
    for (const v of this.vertices.keys()) {
      this._adjacency.set(v, []);
    }
    for (const e of this.edges.values()) {
      this._adjacency.get(e.from).push({ to: e.to, edgeId: e.id, weight: e.weight });
      if (!this.directed) {
        this._adjacency.get(e.to).push({ to: e.from, edgeId: e.id, weight: e.weight });
      }
    }
  }
}

/** Сброс счётчиков (используется в тестах). */
export function resetGraphCounters() {
  vertexCounter = 0;
  edgeCounter = 0;
}

export { labelFromId };
