/**
 * Тесты алгоритма Дейкстры.
 * Эталон для канонического графа из A:
 *   A=0, B=3, C=2, D=8, E=10, F=13
 * Путь к F: A→C→B→D→E→F (2+1+5+2+3 = 13).
 */

import { describe, it, expect } from './runner.mjs';
import { dijkstra } from '../js/algorithms/dijkstra.js';
import { buildCanonicalGraph, idByLabel, finalDistances } from './fixtures.mjs';

describe('Алгоритм Дейкстры', () => {
  it('вычисляет корректные кратчайшие расстояния из A', () => {
    const g = buildCanonicalGraph();
    const steps = dijkstra(g, idByLabel(g, 'A'));
    const dist = finalDistances(steps);
    expect(dist.A).toBe(0);
    expect(dist.B).toBe(3);
    expect(dist.C).toBe(2);
    expect(dist.D).toBe(8);
    expect(dist.E).toBe(10);
    expect(dist.F).toBe(13);
  });

  it('расстояние до стартовой вершины равно 0', () => {
    const g = buildCanonicalGraph();
    const steps = dijkstra(g, idByLabel(g, 'C'));
    const dist = finalDistances(steps);
    expect(dist.C).toBe(0);
  });

  it('для недостижимой вершины расстояние остаётся ∞', () => {
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex(); // изолированная
    g.addEdge(a.id, b.id, 5);
    const steps = dijkstra(g, a.id);
    const dist = finalDistances(steps);
    expect(dist[c.label]).toBe(Infinity);
  });

  it('кратчайший путь к F проходит через C, B, D, E', () => {
    const g = buildCanonicalGraph();
    const steps = dijkstra(g, idByLabel(g, 'A'));
    const last = steps[steps.length - 1];
    // Предок F - E, предок E - D, предок D - B, предок B - C, предок C - A.
    expect(last.prev.F).toBe('E');
    expect(last.prev.E).toBe('D');
    expect(last.prev.D).toBe('B');
    expect(last.prev.B).toBe('C');
    expect(last.prev.C).toBe('A');
  });

  it('генерирует шаги с обновлением расстояний на итерациях', () => {
    const g = buildCanonicalGraph();
    const steps = dijkstra(g, idByLabel(g, 'A'));
    // Должны быть шаги: init, по одному на каждую вершину (6), done.
    const visitSteps = steps.filter((s) => s.type === 'visit');
    expect(visitSteps.length).toBe(6);
  });

  it('обрабатывает граф с равными весами рёбер', () => {
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    g.addEdge(a.id, b.id, 1);
    g.addEdge(a.id, c.id, 1);
    const steps = dijkstra(g, a.id);
    const dist = finalDistances(steps);
    expect(dist[b.label]).toBe(1);
    expect(dist[c.label]).toBe(1);
  });

  it('корректно работает на графе из одной вершины', () => {
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const steps = dijkstra(g, a.id);
    const dist = finalDistances(steps);
    expect(dist[a.label]).toBe(0);
  });

  it('расстояния монотонно не убывают при извлечении вершин', () => {
    // Свойство Дейкстры: вершины извлекаются в порядке неубывания расстояния.
    const g = buildCanonicalGraph();
    const steps = dijkstra(g, idByLabel(g, 'A'));
    const visitSteps = steps.filter((s) => s.type === 'visit');
    const dists = visitSteps.map((s) => s.distances[g.getVertex(s.current).label]);
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i] >= dists[i - 1]).toBeTruthy();
    }
  });
});
