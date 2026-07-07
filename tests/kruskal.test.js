/**
 * Тесты алгоритма Краскала (минимальное остовное дерево).
 * Эталон для канонического графа: суммарный вес MST = 13,
 * рёбра: B-C:1, A-C:2, D-E:2, E-F:3, B-D:5.
 *
 * Отдельно проверяется корректность DSU при рёбрах с равными весами:
 * обнаружение цикла зависит только от принадлежности вершин компонентам,
 * а не от веса или порядка рёбер.
 */

import { describe, it, expect } from './runner.mjs';
import { kruskal } from '../js/algorithms/kruskal.js';
import { buildCanonicalGraph, finalMstWeight, edgeLabels } from './fixtures.mjs';

describe('Алгоритм Краскала', () => {
  it('строит MST суммарным весом 13', () => {
    const g = buildCanonicalGraph();
    const steps = kruskal(g);
    expect(finalMstWeight(steps)).toBe(13);
  });

  it('включает в MST ровно V−1 = 5 рёбер', () => {
    const g = buildCanonicalGraph();
    const steps = kruskal(g);
    const done = steps[steps.length - 1];
    expect(done.mstEdges.length).toBe(5);
  });

  it('выбирает рёбра с минимальными весами', () => {
    const g = buildCanonicalGraph();
    const steps = kruskal(g);
    const done = steps[steps.length - 1];
    const labels = edgeLabels(g, done.mstEdges);
    expect(labels).toContain('BC=1');
    expect(labels).toContain('AC=2');
    expect(labels).toContain('DE=2');
    expect(labels).toContain('EF=3');
    expect(labels).toContain('BD=5');
  });

  it('отбрасывает рёбра, образующие цикл', () => {
    const g = buildCanonicalGraph();
    const steps = kruskal(g);
    const skipSteps = steps.filter((s) => s.type === 'skip');
    // Как минимум одно ребро должно быть отброшено как цикл (например, A-B).
    expect(skipSteps.length > 0).toBeTruthy();
  });

  it('первый шаг — сортировка рёбер', () => {
    const g = buildCanonicalGraph();
    const steps = kruskal(g);
    expect(steps[0].type).toBe('init');
  });

  it('рёбра рассматриваются в порядке возрастания веса', () => {
    const g = buildCanonicalGraph();
    const steps = kruskal(g);
    const addSteps = steps.filter((s) => s.type === 'add' || s.type === 'skip');
    // Получаем веса рассмотренных рёбер по описаниям шагов.
    const weights = addSteps.map((s) => {
      const m = s.desc.match(/\(вес (\d+)\)/);
      return m ? parseInt(m[1], 10) : null;
    }).filter((w) => w !== null);
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i] >= weights[i - 1]).toBeTruthy();
    }
  });

  // ---- Проверка корректности DSU при равных весах ----

  it('корректно обнаруживает цикл при рёбрах с равными весами', () => {
    // Треугольник с равными весами: A-B:1, B-C:1, A-C:1.
    // MST должно содержать 2 ребра, третье — цикл.
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    g.addEdge(a.id, b.id, 1);
    g.addEdge(b.id, c.id, 1);
    g.addEdge(a.id, c.id, 1);
    const steps = kruskal(g);
    const done = steps[steps.length - 1];
    expect(done.mstEdges.length).toBe(2);
    expect(done.totalWeight).toBe(2);
    expect(steps.filter((s) => s.type === 'skip').length).toBe(1);
  });

  it('изменение порядка рёбер с равными весами не приводит к циклу в MST', () => {
    // Квадрат с диагональю, все веса равны.
    // MST из 4 вершин содержит 3 ребра; 2 ребра отбрасываются как циклы.
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    const d = g.addVertex();
    g.addEdge(a.id, b.id, 1);
    g.addEdge(b.id, c.id, 1);
    g.addEdge(c.id, d.id, 1);
    g.addEdge(d.id, a.id, 1);
    g.addEdge(a.id, c.id, 1); // диагональ
    const steps = kruskal(g);
    const done = steps[steps.length - 1];
    expect(done.mstEdges.length).toBe(3);
    expect(done.totalWeight).toBe(3);
    // MST не может содержать цикл по определению.
    expect(steps.filter((s) => s.type === 'skip').length).toBe(2);
  });

  it('для несвязного графа строит остовный лес', () => {
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    const d = g.addVertex();
    g.addEdge(a.id, b.id, 3);
    g.addEdge(c.id, d.id, 1);
    const steps = kruskal(g);
    const done = steps[steps.length - 1];
    // Две компоненты по 2 вершины = 2 ребра в лесу.
    expect(done.mstEdges.length).toBe(2);
    expect(done.totalWeight).toBe(4);
  });

  it('для графа без рёбер MST пуст', () => {
    const g = buildCanonicalGraph();
    g.clear();
    g.addVertex();
    g.addVertex();
    const steps = kruskal(g);
    const done = steps[steps.length - 1];
    expect(done.mstEdges.length).toBe(0);
    expect(done.totalWeight).toBe(0);
  });
});
