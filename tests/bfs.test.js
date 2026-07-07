/**
 * Тесты алгоритма обхода в ширину (BFS).
 * Входные данные — канонический граф 6 вершин; эталон — порядок обхода.
 */

import { describe, it, expect } from './runner.mjs';
import { bfs } from '../js/algorithms/bfs.js';
import { buildCanonicalGraph, idByLabel } from './fixtures.mjs';

describe('Алгоритм BFS', () => {
  it('обходит канонический граф из A в порядке A B C D E F', () => {
    const g = buildCanonicalGraph();
    const steps = bfs(g, idByLabel(g, 'A'));
    const done = steps[steps.length - 1];
    const labels = done.order.map((id) => g.getVertex(id).label);
    expect(labels).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('первый шаг — инициализация со стартовой вершиной в очереди', () => {
    const g = buildCanonicalGraph();
    const steps = bfs(g, idByLabel(g, 'A'));
    expect(steps[0].type).toBe('init');
    expect(steps[0].queue.length).toBe(1);
  });

  it('последний шаг — завершение с описанием порядка', () => {
    const g = buildCanonicalGraph();
    const steps = bfs(g, idByLabel(g, 'A'));
    const done = steps[steps.length - 1];
    expect(done.type).toBe('done');
    expect(done.order.length).toBe(6);
  });

  it('посещает все достижимые вершины несвязного графа только в одной компоненте', () => {
    // Граф: A-B и отдельная C-D. BFS из A посетит только A, B.
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    const d = g.addVertex();
    g.addEdge(a.id, b.id, 1);
    g.addEdge(c.id, d.id, 1);
    const steps = bfs(g, a.id);
    const done = steps[steps.length - 1];
    expect(done.order.length).toBe(2);
  });

  it('BFS из единственной вершины без рёбер посещает только её', () => {
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const steps = bfs(g, a.id);
    const done = steps[steps.length - 1];
    expect(done.order.length).toBe(1);
  });

  it('расширяет фронт по уровням: сначала соседи A, затем их соседи', () => {
    const g = buildCanonicalGraph();
    const steps = bfs(g, idByLabel(g, 'A'));
    // Шаг 1 (init): очередь [A].
    // Шаг 2 (visit A): очередь [B, C] — соседи A.
    const afterA = steps[1];
    const queueLabels = afterA.queue.map((id) => g.getVertex(id).label).sort();
    expect(queueLabels).toEqual(['B', 'C']);
  });
});
