/**
 * Система непересекающихся множеств (DSU, Disjoint Set Union).
 *
 * Используется в алгоритме Краскала для проверки того, образует ли
 * добавляемое ребро цикл: если обе вершины ребра уже принадлежат одной
 * компоненте (find(a) === find(b)), ребро пропускается.
 *
 * Реализованы две эвристики:
 *  - сжатие пути (path compression) в find();
 *  - объединение по рангу (union by rank) в union().
 *
 * Благодаря им амортизированная сложность операций практически O(1).
 *
 * ВАЖНО: операция union связывает корни множеств (parent[find(a)] = find(b)),
 * а не сами вершины. Связывание вершин напрямую — типичная ошибка, из-за
 * которой find возвращает некорректный корень и проверка циклов ломается.
 */

export class DSU {
  constructor(size = 0) {
    /** @type {number[]} */
    this.parent = new Array(size);
    /** @type {number[]} */
    this.rank = new Array(size);
    for (let i = 0; i < size; i++) {
      this.parent[i] = i;
      this.rank[i] = 0;
    }
  }

  /** Добавляет новый элемент как отдельное множество. */
  makeSet(x) {
    if (this.parent[x] === undefined) {
      this.parent[x] = x;
      this.rank[x] = 0;
    }
  }

  /** Возвращает корень множества, которому принадлежит x, со сжатием пути. */
  find(x) {
    if (this.parent[x] === undefined) return x;
    // Итеративная реализация сжатия пути.
    let root = x;
    while (this.parent[root] !== root) {
      root = this.parent[root];
    }
    // Второй проход: привязываем все узлы пути напрямую к корню.
    let cur = x;
    while (this.parent[cur] !== root) {
      const next = this.parent[cur];
      this.parent[cur] = root;
      cur = next;
    }
    return root;
  }

  /**
   * Объединяет множества, содержащие a и b, по рангу.
   * Возвращает true, если множества были разными (произошло слияние),
   * и false, если a и b уже в одном множестве.
   */
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    // Корень с большим рангом становится родителем.
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb;
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra;
    } else {
      this.parent[rb] = ra;
      this.rank[ra]++;
    }
    return true;
  }

  /** Проверяет, находятся ли a и b в одной компоненте. */
  sameSet(a, b) {
    return this.find(a) === this.find(b);
  }
}
