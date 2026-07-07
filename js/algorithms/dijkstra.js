/**
 * Алгоритм Дейкстры — кратчайшие пути от стартовой вершины до всех остальных.
 *
 * Работает для графов с НЕОТРИЦАТЕЛЬНЫМИ весами рёбер.
 *
 * Ключевая структура данных — приоритетная очередь на основе бинарной
 * min-кучи (js/structures/PriorityQueue.js). Применяется «ленивое удаление»
 * (lazy deletion): при обновлении расстояния до вершины новая пара
 * (расстояние, вершина) просто добавляется в кучу, а устаревшие записи
 * с большим расстоянием пропускаются при извлечении.
 *
 * Сложность: O((V + E) log V):
 *  - каждая вершина извлекается из кучи не более O(E) раз в худшем случае,
 *    но суммарно число операций с кучей — O(E), каждая за O(log V);
 *  - релаксация рёбер — O(E) суммарно.
 *
 * Соседи берутся из карты смежности (O(степень вершины)), а не линейным
 * поиском по массиву рёбер.
 */

import { PriorityQueue } from '../structures/PriorityQueue.js';

export function dijkstra(graph, startId) {
  const steps = [];
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();

  // Инициализация расстояний.
  for (const v of graph.getVertices()) {
    dist.set(v.id, Infinity);
    prev.set(v.id, null);
  }
  dist.set(startId, 0);

  // Приоритетная очередь: пары [расстояние, idВершины].
  const pq = new PriorityQueue((a, b) => a[0] - b[0]);
  pq.push([0, startId]);

  steps.push({
    type: 'init',
    desc: `Инициализация: расстояние до ${graph.getVertex(startId).label} = 0, остальным — ∞`,
    current: startId,
    visited: [],
    distances: snapshot(dist, graph),
    prev: snapshotPrev(prev, graph),
    activeEdges: [],
  });

  while (!pq.isEmpty()) {
    const [d, u] = pq.pop();

    // Ленивое удаление: пропускаем устаревшую запись.
    if (visited.has(u)) continue;
    // Защита от недостижимой вершины (расстояние осталось ∞).
    if (d === Infinity) break;

    visited.add(u);
    const neighbors = graph.getNeighbors(u);
    const relaxedEdges = [];

    for (const n of neighbors) {
      if (visited.has(n.to)) continue;
      const nd = d + n.weight;
      if (nd < dist.get(n.to)) {
        dist.set(n.to, nd);
        prev.set(n.to, u);
        pq.push([nd, n.to]);
        relaxedEdges.push(n.edgeId);
      }
    }

    steps.push({
      type: 'visit',
      desc:
        `Извлекаем из очереди вершину ${graph.getVertex(u).label} (dist = ${d})` +
        (relaxedEdges.length
          ? `; релаксация рёбер: ${relaxedEdges.length}`
          : '; рёбра не улучшили расстояния'),
      current: u,
      visited: [...visited],
      distances: snapshot(dist, graph),
      prev: snapshotPrev(prev, graph),
      activeEdges: relaxedEdges,
    });
  }

  steps.push({
    type: 'done',
    desc: 'Алгоритм завершён. Итоговые расстояния вычислены.',
    current: null,
    visited: [...visited],
    distances: snapshot(dist, graph),
    prev: snapshotPrev(prev, graph),
    activeEdges: [],
  });

  return steps;
}

/** Возвращает читаемый снимок расстояний: {label: distance}. */
function snapshot(dist, graph) {
  const obj = {};
  for (const [id, d] of dist) {
    const v = graph.getVertex(id);
    obj[v ? v.label : id] = d;
  }
  return obj;
}

/** Возвращает снимок предков: {label: prevLabel|null}. */
function snapshotPrev(prev, graph) {
  const obj = {};
  for (const [id, p] of prev) {
    const v = graph.getVertex(id);
    const pv = p !== null ? graph.getVertex(p) : null;
    obj[v ? v.label : id] = pv ? pv.label : null;
  }
  return obj;
}
