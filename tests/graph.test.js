/**
 * Тесты модели графа (js/core/Graph.js).
 * Проверяют создание вершин/рёбер, карту смежности и граничные случаи.
 */

import { describe, it, expect } from './runner.mjs';
import { Graph, resetGraphCounters } from '../js/core/Graph.js';

describe('Модель графа', () => {
  it('создаёт вершины с последовательными подписями A, B, C', () => {
    resetGraphCounters();
    const g = new Graph();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    expect(a.label).toBe('A');
    expect(b.label).toBe('B');
    expect(c.label).toBe('C');
    expect(g.vertexCount()).toBe(3);
  });

  it('создаёт рёбра и хранит их вес', () => {
    resetGraphCounters();
    const g = new Graph();
    const a = g.addVertex();
    const b = g.addVertex();
    const e = g.addEdge(a.id, b.id, 7);
    expect(e.weight).toBe(7);
    expect(g.edgeCount()).toBe(1);
  });

  it('getNeighbors возвращает соседей через карту смежности', () => {
    resetGraphCounters();
    const g = new Graph();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    g.addEdge(a.id, b.id, 1);
    g.addEdge(a.id, c.id, 2);
    const neighbors = g.getNeighbors(a.id);
    expect(neighbors.length).toBe(2);
    // Для неориентированного графа оба соседа присутствуют.
    const targets = neighbors.map((n) => n.to).sort();
    expect(targets[0]).toBe(b.id);
    expect(targets[1]).toBe(c.id);
  });

  it('для неориентированного графа ребро добавляется в обе стороны', () => {
    resetGraphCounters();
    const g = new Graph(false);
    const a = g.addVertex();
    const b = g.addVertex();
    g.addEdge(a.id, b.id, 5);
    expect(g.getNeighbors(a.id).length).toBe(1);
    expect(g.getNeighbors(b.id).length).toBe(1);
  });

  it('для ориентированного графа ребро добавляется в одну сторону', () => {
    resetGraphCounters();
    const g = new Graph(true);
    const a = g.addVertex();
    const b = g.addVertex();
    g.addEdge(a.id, b.id, 5);
    expect(g.getNeighbors(a.id).length).toBe(1);
    expect(g.getNeighbors(b.id).length).toBe(0);
  });

  it('удаляет вершину вместе с инцидентными рёбрами', () => {
    resetGraphCounters();
    const g = new Graph();
    const a = g.addVertex();
    const b = g.addVertex();
    const c = g.addVertex();
    g.addEdge(a.id, b.id, 1);
    g.addEdge(b.id, c.id, 2);
    g.removeVertex(b.id);
    expect(g.vertexCount()).toBe(2);
    expect(g.edgeCount()).toBe(0);
  });

  it('удаляет ребро и обновляет карту смежности', () => {
    resetGraphCounters();
    const g = new Graph();
    const a = g.addVertex();
    const b = g.addVertex();
    const e = g.addEdge(a.id, b.id, 3);
    g.removeEdge(e.id);
    expect(g.edgeCount()).toBe(0);
    expect(g.getNeighbors(a.id).length).toBe(0);
  });

  // ---- Граничные случаи ----

  it('запрещает петли (ребро из вершины в неё же)', () => {
    resetGraphCounters();
    const g = new Graph();
    const a = g.addVertex();
    expect(() => g.addEdge(a.id, a.id, 1)).toThrow('Петли');
  });

  it('бросает исключение при ребре между несуществующими вершинами', () => {
    resetGraphCounters();
    const g = new Graph();
    const a = g.addVertex();
    expect(() => g.addEdge(a.id, 9999, 1)).toThrow('не существует');
  });

  it('getNeighbors для вершины без рёбер возвращает пустой массив', () => {
    resetGraphCounters();
    const g = new Graph();
    const a = g.addVertex();
    expect(g.getNeighbors(a.id).length).toBe(0);
  });

  it('clear очищает все вершины и рёбра', () => {
    resetGraphCounters();
    const g = new Graph();
    g.addVertex();
    g.addVertex();
    g.addEdge(0, 1, 1);
    g.clear();
    expect(g.vertexCount()).toBe(0);
    expect(g.edgeCount()).toBe(0);
  });
});
