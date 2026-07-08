/**
 * Обход графа в глубину (DFS, Depth-First Search).
 *
 * Итеративная реализация на явном стеке (без рекурсии - это позволяет
 * генерировать шаги единообразно и избегать переполнения стека вызовов).
 *
 * Временная сложность: O(V + E), пространственная: O(V).
 *
 * Возвращает массив шагов в едином формате.
 */

export function dfs(graph, startId) {
  const steps = [];
  const visited = new Set();
  const stack = [startId];
  const order = [];

  steps.push({
    type: 'init',
    desc: `Начало обхода в глубину из вершины ${graph.getVertex(startId).label}`,
    current: startId,
    visited: [...visited],
    queue: [],
    stack: [...stack],
    order: [...order],
    activeEdges: [],
  });

  while (stack.length > 0) {
    const current = stack.pop();

    if (visited.has(current)) {
      // Уже посещена ранее - пропускаем (возврат из тупика).
      continue;
    }

    visited.add(current);
    order.push(current);
    const neighbors = graph.getNeighbors(current);
    const added = [];

    // Соседи помещаются в стек в обратном порядке, чтобы первая по списку
    // вершина обрабатывалась первой (детерминированный обход).
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const n = neighbors[i];
      if (!visited.has(n.to)) {
        stack.push(n.to);
        added.push({ to: n.to, edgeId: n.edgeId });
      }
    }

    steps.push({
      type: 'visit',
      desc:
        `Посещаем вершину ${graph.getVertex(current).label}` +
        (added.length
          ? `; в стек помещены: ${added.map((a) => graph.getVertex(a.to).label).join(', ')}`
          : '; тупик - возврат'),
      current,
      visited: [...visited],
      queue: [],
      stack: [...stack],
      order: [...order],
      activeEdges: added.map((a) => a.edgeId),
    });
  }

  steps.push({
    type: 'done',
    desc: `Обход завершён. Порядок: ${order.map((id) => graph.getVertex(id).label).join(' → ')}`,
    current: null,
    visited: [...visited],
    queue: [],
    stack: [],
    order: [...order],
    activeEdges: [],
  });

  return steps;
}
