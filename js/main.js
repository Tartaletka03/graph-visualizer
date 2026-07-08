/**
 * Точка входа приложения.
 *
 * Создаёт модель графа, визуализатор и контроллер интерфейса, связывая их
 * вместе. Вся логика разбита по модулям:
 *  - core/Graph.js           - модель графа;
 *  - structures/*            - приоритетная очередь и DSU;
 *  - algorithms/*            - BFS, DFS, Дейкстра, Прим, Краскал;
 *  - visualization/Visualizer.js - отрисовка SVG;
 *  - ui/UIController.js      - обработка действий пользователя.
 */

import { Graph } from './core/Graph.js';
import { Visualizer } from './visualization/Visualizer.js';
import { UIController } from './ui/UIController.js';

function main() {
  const canvas = document.getElementById('canvas');
  const graph = new Graph(false);
  const visualizer = new Visualizer(canvas);
  const ui = new UIController(graph, visualizer);

  // Делаем экземпляры доступными из консоли разработчика (удобно отладки).
  window.__app = { graph, visualizer, ui };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
