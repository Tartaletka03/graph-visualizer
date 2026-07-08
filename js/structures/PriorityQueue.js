/**
 * Приоритетная очередь на основе бинарной min-кучи.
 *
 * Используется в алгоритме Дейкстры для эффективного выбора вершины
 * с минимальным текущим расстоянием. Поддерживает «ленивое удаление»
 * (lazy deletion): устаревшие записи с большим расстоянием просто
 * пропускаются при извлечении, что позволяет не реализовывать сложную
 * операцию decrease-key.
 *
 * Сложность: push - O(log n), pop - O(log n).
 */

export class PriorityQueue {
  constructor(compare = (a, b) => a - b) {
    /** @type {*[]} */
    this._heap = [];
    this._compare = compare;
  }

  get size() {
    return this._heap.length;
  }

  isEmpty() {
    return this._heap.length === 0;
  }

  /** Добавляет элемент в очередь. */
  push(item) {
    this._heap.push(item);
    this._siftUp(this._heap.length - 1);
  }

  /** Извлекает элемент с наивысшим приоритетом (минимальный). */
  pop() {
    if (this._heap.length === 0) return undefined;
    const top = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._siftDown(0);
    }
    return top;
  }

  /** Просмотр верхнего элемента без извлечения. */
  peek() {
    return this._heap[0];
  }

  /** Поднимает элемент с индексом i вверх, восстанавливая свойство кучи. */
  _siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this._compare(this._heap[i], this._heap[parent]) < 0) {
        [this._heap[i], this._heap[parent]] = [this._heap[parent], this._heap[i]];
        i = parent;
      } else {
        break;
      }
    }
  }

  /** Опускает элемент с индексом i вниз, восстанавливая свойство кучи. */
  _siftDown(i) {
    const n = this._heap.length;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && this._compare(this._heap[left], this._heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < n && this._compare(this._heap[right], this._heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === i) break;
      [this._heap[i], this._heap[smallest]] = [this._heap[smallest], this._heap[i]];
      i = smallest;
    }
  }
}
