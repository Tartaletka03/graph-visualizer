/**
 * Запуск всех тестов в Node.js.
 * Использование:  node tests/run-all.mjs
 *
 * Тестовые файлы импортируются для побочной регистрации наборов,
 * после чего runAll() выполняет их и выводит результаты.
 */

import { runAll } from './runner.mjs';

// Импорт тестовых файлов (регистрируют наборы).
import './graph.test.js';
import './structures.test.js';
import './bfs.test.js';
import './dfs.test.js';
import './dijkstra.test.js';
import './prim.test.js';
import './kruskal.test.js';

const result = await runAll();
process.exit(result.failed > 0 ? 1 : 0);
