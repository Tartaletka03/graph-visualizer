/**
 * Тесты структур данных: приоритетной очереди (бинарная куча) и DSU.
 */

import { describe, it, expect } from './runner.mjs';
import { PriorityQueue } from '../js/structures/PriorityQueue.js';
import { DSU } from '../js/structures/DSU.js';

describe('Приоритетная очередь (бинарная min-куча)', () => {
  it('извлекает элементы в порядке возрастания приоритета', () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.push(5);
    pq.push(1);
    pq.push(3);
    pq.push(2);
    pq.push(4);
    expect(pq.pop()).toBe(1);
    expect(pq.pop()).toBe(2);
    expect(pq.pop()).toBe(3);
    expect(pq.pop()).toBe(4);
    expect(pq.pop()).toBe(5);
  });

  it('поддерживает равные приоритеты', () => {
    const pq = new PriorityQueue((a, b) => a[0] - b[0]);
    pq.push([2, 'x']);
    pq.push([2, 'y']);
    pq.push([2, 'z']);
    expect(pq.pop()[0]).toBe(2);
    expect(pq.pop()[0]).toBe(2);
    expect(pq.pop()[0]).toBe(2);
    expect(pq.isEmpty()).toBeTruthy();
  });

  it('pop из пустой очереди возвращает undefined', () => {
    const pq = new PriorityQueue();
    expect(pq.pop()).toBeUndefined();
  });

  it('peek возвращает минимальный элемент без удаления', () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.push(10);
    pq.push(3);
    pq.push(7);
    expect(pq.peek()).toBe(3);
    expect(pq.size).toBe(3);
  });

  it('сохраняет свойство кучи при перемешивании операций', () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.push(8);
    pq.push(2);
    expect(pq.pop()).toBe(2);
    pq.push(1);
    pq.push(9);
    expect(pq.pop()).toBe(1);
    expect(pq.pop()).toBe(8);
    expect(pq.pop()).toBe(9);
    expect(pq.isEmpty()).toBeTruthy();
  });
});

describe('Система непересекающихся множеств (DSU)', () => {
  it('изначально каждый элемент — отдельное множество', () => {
    const dsu = new DSU(5);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (i !== j) expect(dsu.sameSet(i, j)).toBeFalsy();
      }
    }
  });

  it('union объединяет множества', () => {
    const dsu = new DSU(4);
    expect(dsu.union(0, 1)).toBeTruthy();
    expect(dsu.sameSet(0, 1)).toBeTruthy();
    expect(dsu.union(2, 3)).toBeTruthy();
    expect(dsu.sameSet(2, 3)).toBeTruthy();
    expect(dsu.sameSet(0, 2)).toBeFalsy();
  });

  it('union возвращает false, если элементы уже в одном множестве', () => {
    const dsu = new DSU(3);
    dsu.union(0, 1);
    dsu.union(1, 2);
    expect(dsu.union(0, 2)).toBeFalsy();
  });

  it('обеспечивает транзитивность принадлежности', () => {
    const dsu = new DSU(6);
    dsu.union(0, 1);
    dsu.union(2, 3);
    dsu.union(1, 2);
    // Теперь 0,1,2,3 — одна компонента.
    expect(dsu.sameSet(0, 3)).toBeTruthy();
    expect(dsu.sameSet(4, 0)).toBeFalsy();
    dsu.union(4, 5);
    expect(dsu.sameSet(4, 5)).toBeTruthy();
    expect(dsu.sameSet(0, 4)).toBeFalsy();
  });

  it('правильно обнаруживает цикл при добавлении ребра', () => {
    // Граф: 0-1, 1-2. Добавление 0-2 должно образовать цикл.
    const dsu = new DSU(3);
    dsu.union(0, 1);
    dsu.union(1, 2);
    // 0 и 2 уже в одной компоненте → ребро 0-2 образует цикл.
    expect(dsu.sameSet(0, 2)).toBeTruthy();
  });

  it('path compression не нарушает корректность find', () => {
    const dsu = new DSU(8);
    // Строим цепочку объединений.
    dsu.union(0, 1);
    dsu.union(1, 2);
    dsu.union(2, 3);
    dsu.union(3, 4);
    const root = dsu.find(4);
    // После сжатия пути все узлы цепочки должны указывать на один корень.
    expect(dsu.find(0)).toBe(root);
    expect(dsu.find(2)).toBe(root);
    expect(dsu.find(4)).toBe(root);
  });
});
