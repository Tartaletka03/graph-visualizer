/**
 * Тесты алгоритма Прима (минимальное остовное дерево).
 * Эталон для канонического графа: суммарный вес MST = 13,
 * рёбра: B-C:1, A-C:2, D-E:2, E-F:3, B-D:5.
 */

import { describe, it, expect } from './runner.mjs';
import { prim } from '../js/algorithms/prim.js';
import { buildCanonicalGraph, idByLabel, finalMstWeight, edgeLabels } from './fixtures.mjs';

describe('Алгоритм Прима', () => {
  it('строит MST суммарным весом 13 из A', () => {
    const g = buildCanonicalGraph();
    const steps = prim(g, idByLabel(g, 'A'));
    expect(finalMstWeight(steps)).toBe(13);
  });

  it('включает в MST ровно V−1 = 5 рёбер', () => {
    const g = buildCanonicalGraph();
    const steps = prim(g, idByLabel(g, 'A'));
    const done = steps[steps.length - 1];
    expect(done.mstEdges.length).toBe(5);
  });

  it('выбирает рёбра с минимальными весами', () => {
    const g = buildCanonicalGraph();
    const steps = prim(g, idByLabel(g, 'A'));
    const done = steps[steps.length - 1];
    const labels = edgeLabels(g, done.mstEdges);
    // Ожидаемые рёбра MST (независимо от порядка).
    expect(labels).toContain('BC=1');
    expect(labels).toContain('AC=2');
    expect(labels).toContain('DE=2');
    expect(labels).toContain('EF=3');
    expect(labels).toContain('BD=5');
  });

  it('результат не зависит от стартовой вершины (вес MST)', () => {
    const g = buildCanonicalGraph();
    const fromA = finalMstWeight(prim(g, idByLabel(g, 'A')));
    const fromD = finalMstWeight(prim(g, idByLabel(g, 'D')));
    const fromF = finalMstWeight(prim(g, idByLabel(g, 'F')));
    expect(fromA).toBe(13);
    expect(fromD).toBe(13);
    expect(fromF).toBe(13);
  });

  it('для несвязного графа строит MST только компоненты стартовой вершины', () => {
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    const d = g.addVertex();
    g.addEdge(a.id, b.id, 3);
    g.addEdge(c.id, d.id, 1); // отдельная компонента
    const steps = prim(g, a.id);
    const done = steps[steps.length - 1];
    expect(done.mstEdges.length).toBe(1);
    expect(done.totalWeight).toBe(3);
  });

  it('первый шаг добавляет стартовую вершину в дерево', () => {
    const g = buildCanonicalGraph();
    const steps = prim(g, idByLabel(g, 'A'));
    expect(steps[0].type).toBe('init');
    expect(steps[0].inTree.length).toBe(1);
  });
});
