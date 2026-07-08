/**
 * Тесты алгоритма обхода в глубину (DFS).
 */

import { describe, it, expect } from './runner.mjs';
import { dfs } from '../js/algorithms/dfs.js';
import { buildCanonicalGraph, idByLabel } from './fixtures.mjs';

describe('Алгоритм DFS', () => {
  it('посещает все вершины канонического графа из A', () => {
    const g = buildCanonicalGraph();
    const steps = dfs(g, idByLabel(g, 'A'));
    const done = steps[steps.length - 1];
    expect(done.order.length).toBe(6);
    expect(done.order[0]).toBe(idByLabel(g, 'A'));
  });

  it('первым делом углубляется по одной ветви', () => {
    const g = buildCanonicalGraph();
    const steps = dfs(g, idByLabel(g, 'A'));
    // После A стек содержит соседей A (B, C). DFS выберет одного и пойдёт вглубь.
    const firstVisit = steps[1];
    expect(firstVisit.type).toBe('visit');
    expect(firstVisit.current).toBe(idByLabel(g, 'A'));
  });

  it('использует стек, а не очередь', () => {
    const g = buildCanonicalGraph();
    const steps = dfs(g, idByLabel(g, 'A'));
    // В шагах DFS поле stack должно быть непустым, queue - пустым.
    const hasStack = steps.some((s) => s.stack.length > 0);
    expect(hasStack).toBeTruthy();
    const noQueue = steps.every((s) => s.queue.length === 0);
    expect(noQueue).toBeTruthy();
  });

  it('посещает только достижимую компоненту в несвязном графе', () => {
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    const d = g.addVertex();
    g.addEdge(a.id, b.id, 1);
    g.addEdge(c.id, d.id, 1);
    const steps = dfs(g, a.id);
    const done = steps[steps.length - 1];
    expect(done.order.length).toBe(2);
  });

  it('DFS из единственной вершины без рёбер посещает только её', () => {
    const g = buildCanonicalGraph();
    g.clear();
    const a = g.addVertex();
    const steps = dfs(g, a.id);
    const done = steps[steps.length - 1];
    expect(done.order.length).toBe(1);
  });
});
