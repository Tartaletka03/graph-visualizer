/**
 * Алгоритм Краскала - построение минимального остовного дерева (MST).
 *
 * Сортирует все рёбра по возрастанию веса и последовательно добавляет
 * ребро в остов, если оно не образует цикла с уже выбранными рёбрами.
 * Проверка цикла выполняется через систему непересекающихся множеств (DSU):
 * если find(a) === find(b), вершины уже в одной компоненте и ребро образует
 * цикл - его пропускают.
 *
 * Сложность: O(E log E) - определяется сортировкой рёбер; операции DSU
 * с эвристиками практически константны.
 *
 * ВАЖНО о корректности DSU: проверка цикла выполняется по принадлежности
 * вершин компонентам и НЕ зависит от веса ребра или порядка рёбер с равными
 * весами. Порядок рёбер с равными весами влияет лишь на выбор конкретного
 * MST, когда таких деревьев несколько, но не на сам факт обнаружения цикла.
 */

import { DSU } from '../structures/DSU.js';

export function kruskal(graph) {
  const steps = [];
  const vertices = graph.getVertices();
  const edges = graph.getEdges();

  // DSU по числу вершин. Индексируем по id вершины; для произвольных id
  // используем отображение id -> индекс.
  const index = new Map();
  vertices.forEach((v, i) => index.set(v.id, i));
  const dsu = new DSU(vertices.length);

  // Сортировка рёбер по весу. Для детерминизма при равных весах используется
  // вторичный ключ - id ребра (не влияет на корректность циклов, только на
  // выбор MST при нескольких минимумах).
  const sorted = edges.slice().sort((a, b) => a.weight - b.weight || a.id - b.id);

  const mstEdges = [];
  let totalWeight = 0;

  steps.push({
    type: 'init',
    desc: `Сортировка ${edges.length} рёбер по возрастанию веса. Каждая вершина - отдельное множество.`,
    current: null,
    mstEdges: [],
    totalWeight,
    activeEdges: [],
    skippedEdges: [],
  });

  for (const e of sorted) {
    const ai = index.get(e.from);
    const bi = index.get(e.to);

    if (dsu.sameSet(ai, bi)) {
      // Ребро образует цикл - пропускаем.
      steps.push({
        type: 'skip',
        desc: `Ребро ${graph.getVertex(e.from).label}-${graph.getVertex(e.to).label} (вес ${e.weight}) образует цикл - отклонено`,
        current: null,
        mstEdges: [...mstEdges],
        totalWeight,
        activeEdges: [],
        skippedEdges: [e.id],
      });
      continue;
    }

    dsu.union(ai, bi);
    mstEdges.push(e.id);
    totalWeight += e.weight;

    steps.push({
      type: 'add',
      desc: `Добавляем ребро ${graph.getVertex(e.from).label}-${graph.getVertex(e.to).label} (вес ${e.weight}); суммарный вес = ${totalWeight}`,
      current: null,
      mstEdges: [...mstEdges],
      totalWeight,
      activeEdges: [e.id],
      skippedEdges: [],
    });
    // Ранний выход опущен намеренно: алгоритм просматривает все рёбра,
    // чтобы в визуализации явно показать отбраковку циклических рёбер.
  }

  steps.push({
    type: 'done',
    desc: `MST построено. Рёбер: ${mstEdges.length}, суммарный вес: ${totalWeight}`,
    current: null,
    mstEdges: [...mstEdges],
    totalWeight,
    activeEdges: [],
    skippedEdges: [],
  });

  return steps;
}
