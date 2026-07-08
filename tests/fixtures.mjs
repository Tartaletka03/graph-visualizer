/**
 * Общие тестовые графы и вспомогательные функции.
 *
 * Канонический граф (используется в отчёте) - 6 вершин A-F, 9 рёбер:
 *   A-B:4, A-C:2, B-C:1, B-D:5, C-D:8, C-E:10, D-E:2, D-F:6, E-F:3
 *
 * Эталонные результаты:
 *  - Дейкстра из A: A=0, B=3, C=2, D=8, E=10, F=13
 *  - MST (Прим/Краскал): вес 13; рёбра B-C:1, A-C:2, D-E:2, E-F:3, B-D:5
 *  - BFS из A: A B C D E F
 */

import { Graph, resetGraphCounters } from '../js/core/Graph.js';

/** Строит канонический тестовый граф из 6 вершин. */
export function buildCanonicalGraph() {
  resetGraphCounters();
  const g = new Graph(false);
  const A = g.addVertex(0, 0); // id 0
  const B = g.addVertex(0, 0); // id 1
  const C = g.addVertex(0, 0); // id 2
  const D = g.addVertex(0, 0); // id 3
  const E = g.addVertex(0, 0); // id 4
  const F = g.addVertex(0, 0); // id 5
  g.addEdge(A.id, B.id, 4);
  g.addEdge(A.id, C.id, 2);
  g.addEdge(B.id, C.id, 1);
  g.addEdge(B.id, D.id, 5);
  g.addEdge(C.id, D.id, 8);
  g.addEdge(C.id, E.id, 10);
  g.addEdge(D.id, E.id, 2);
  g.addEdge(D.id, F.id, 6);
  g.addEdge(E.id, F.id, 3);
  return g;
}

/** Возвращает id вершины по подписи. */
export function idByLabel(graph, label) {
  for (const v of graph.getVertices()) {
    if (v.label === label) return v.id;
  }
  return null;
}

/** Возвращает подписи рёбер MST по массиву id рёбер. */
export function edgeLabels(graph, edgeIds) {
  const set = new Set(edgeIds);
  return graph
    .getEdges()
    .filter((e) => set.has(e.id))
    .map((e) => {
      const a = graph.getVertex(e.from).label;
      const b = graph.getVertex(e.to).label;
      return `${a}${b}=${e.weight}`;
    })
    .sort();
}

/** Извлекает итоговые расстояния из последнего шага Дейкстры. */
export function finalDistances(steps) {
  const last = steps[steps.length - 1];
  return last.distances;
}

/** Возвращает итоговый вес MST из последнего шага. */
export function finalMstWeight(steps) {
  return steps[steps.length - 1].totalWeight;
}
