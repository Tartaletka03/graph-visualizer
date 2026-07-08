/**
 * Алгоритм Прима - построение минимального остовного дерева (MST).
 *
 * Начинает со стартовой вершины и на каждом шаге добавляет ребро
 * минимального веса, соединяющее уже построенное дерево с вершиной,
 * ещё не включённой в него. Использует приоритетную очередь.
 *
 * Сложность: O((V + E) log V) при использовании бинарной кучи.
 *
 * Для несвязного графа строится MST только компоненты связности,
 * содержащей стартовую вершину.
 */

import { PriorityQueue } from '../structures/PriorityQueue.js';

export function prim(graph, startId) {
  const steps = [];
  const inTree = new Set();
  const mstEdges = [];
  let totalWeight = 0;

  // Очередь: пары [вес, idРебра, to, from].
  const pq = new PriorityQueue((a, b) => a[0] - b[0]);

  inTree.add(startId);
  // Помещаем в очередь все рёбра, исходящие из стартовой вершины.
  for (const n of graph.getNeighbors(startId)) {
    pq.push([n.weight, n.edgeId, n.to, startId]);
  }

  steps.push({
    type: 'init',
    desc: `Начало построения MST из вершины ${graph.getVertex(startId).label}`,
    current: startId,
    inTree: [...inTree],
    mstEdges: [...mstEdges],
    totalWeight,
    activeEdges: pq.size ? [] : [],
  });

  while (!pq.isEmpty() && inTree.size < graph.vertexCount()) {
    const [w, edgeId, to, from] = pq.pop();

    if (inTree.has(to)) {
      // Ребро ведёт в уже включённую вершину - пропускаем.
      steps.push({
        type: 'skip',
        desc: `Ребро ${graph.getVertex(from).label}-${graph.getVertex(to).label} (${w}) ведёт в дерево - пропускаем`,
        current: from,
        inTree: [...inTree],
        mstEdges: [...mstEdges],
        totalWeight,
        activeEdges: [edgeId],
      });
      continue;
    }

    // Добавляем ребро в остов.
    inTree.add(to);
    mstEdges.push(edgeId);
    totalWeight += w;

    // Добавляем в очередь рёбра новой вершины.
    for (const n of graph.getNeighbors(to)) {
      if (!inTree.has(n.to)) {
        pq.push([n.weight, n.edgeId, n.to, to]);
      }
    }

    steps.push({
      type: 'add',
      desc: `Добавляем ребро ${graph.getVertex(from).label}-${graph.getVertex(to).label} (вес ${w}); суммарный вес = ${totalWeight}`,
      current: to,
      inTree: [...inTree],
      mstEdges: [...mstEdges],
      totalWeight,
      activeEdges: [edgeId],
    });
  }

  steps.push({
    type: 'done',
    desc: `MST построено. Рёбер: ${mstEdges.length}, суммарный вес: ${totalWeight}`,
    current: null,
    inTree: [...inTree],
    mstEdges: [...mstEdges],
    totalWeight,
    activeEdges: [],
  });

  return steps;
}
