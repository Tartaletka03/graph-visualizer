/**
 * Обход графа в ширину (BFS, Breadth-First Search).
 *
 * Использует очередь. Посещает вершины по уровням: сначала все на расстоянии 1
 * от стартовой, затем на расстоянии 2 и т.д.
 *
 * Временная сложность: O(V + E), пространственная: O(V + E).
 *
 * Возвращает массив «шагов» - описаний состояний графа на каждом этапе.
 * Формат шага единый для всех алгоритмов (см. визуализатор).
 */

export function bfs(graph, startId) {
  const steps = [];
  const visited = new Set();
  const queue = [startId];
  const order = [];
  visited.add(startId);

  steps.push({
    type: 'init',
    desc: `Начало обхода в ширину из вершины ${graph.getVertex(startId).label}`,
    current: startId,
    visited: [...visited],
    queue: [...queue],
    stack: [],
    order: [...order],
    activeEdges: [],
  });

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    const neighbors = graph.getNeighbors(current);
    const added = [];

    for (const n of neighbors) {
      if (!visited.has(n.to)) {
        visited.add(n.to);
        queue.push(n.to);
        added.push({ to: n.to, edgeId: n.edgeId });
      }
    }

    steps.push({
      type: 'visit',
      desc:
        `Извлекаем из очереди вершину ${graph.getVertex(current).label}` +
        (added.length
          ? `; в очередь добавлены: ${added.map((a) => graph.getVertex(a.to).label).join(', ')}`
          : '; новых соседей нет'),
      current,
      visited: [...visited],
      queue: [...queue],
      stack: [],
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
