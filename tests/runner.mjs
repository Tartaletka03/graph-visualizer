/**
 * Лёгкий тест-фреймворк для запуска в Node.js и в браузере.
 *
 * Предоставляет функции describe / it / expect и сборщик результатов.
 * Тестовые файлы импортируют эти функции и регистрируют наборы тестов
 * как побочный эффект импорта. Затем runAll() выполняет их по очереди.
 *
 * Инструмент выбран минимальным и без внешних зависимостей, чтобы тесты
 * можно было запускать как в Node (node tests/run-all.mjs), так и в браузере
 * (tests/index.html) без установки пакетов.
 */

const suites = [];
let currentSuite = null;

export function describe(name, fn) {
  currentSuite = { name, tests: [] };
  suites.push(currentSuite);
  try {
    fn();
  } finally {
    currentSuite = null;
  }
}

export function it(name, fn) {
  if (!currentSuite) throw new Error(`it("${name}") вызван вне describe`);
  currentSuite.tests.push({ name, fn });
}

class Expectation {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Ожидалось ${stringify(expected)}, получено ${stringify(this.actual)}`);
    }
  }

  toEqual(expected) {
    if (!deepEqual(this.actual, expected)) {
      throw new Error(`Ожидалось ${stringify(expected)}, получено ${stringify(this.actual)}`);
    }
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Ожидалось истинное значение, получено ${stringify(this.actual)}`);
    }
  }

  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Ожидалось ложное значение, получено ${stringify(this.actual)}`);
    }
  }

  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Ожидалось undefined, получено ${stringify(this.actual)}`);
    }
  }

  toHaveLength(n) {
    if (!this.actual || this.actual.length !== n) {
      throw new Error(`Ожидалась длина ${n}, получено ${stringify(this.actual?.length)}`);
    }
  }

  toContain(item) {
    const arr = Array.isArray(this.actual) ? this.actual : Object.values(this.actual || {});
    if (!arr.some((x) => deepEqual(x, item))) {
      throw new Error(`Ожидалось наличие ${stringify(item)} в ${stringify(this.actual)}`);
    }
  }

  toBeGreaterThan(n) {
    if (!(this.actual > n)) {
      throw new Error(`Ожидалось > ${n}, получено ${stringify(this.actual)}`);
    }
  }

  toBeLessThan(n) {
    if (!(this.actual < n)) {
      throw new Error(`Ожидалось < ${n}, получено ${stringify(this.actual)}`);
    }
  }

  toThrow(matcher) {
    let threw = false;
    try {
      this.actual();
    } catch (e) {
      threw = true;
      if (matcher && !String(e.message).includes(matcher)) {
        throw new Error(`Брошено исключение, но сообщение не содержит «${matcher}»: ${e.message}`);
      }
    }
    if (!threw) throw new Error('Ожидалось исключение, но оно не было брошено');
  }
}

export function expect(actual) {
  return new Expectation(actual);
}

/** Выполняет все зарегистрированные наборы тестов. */
export async function runAll(log = defaultLog) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const suite of suites) {
    log('suite', suite.name);
    for (const test of suite.tests) {
      try {
        await test.fn();
        passed++;
        log('pass', `  ✓ ${test.name}`);
      } catch (e) {
        failed++;
        const msg = `  ✗ ${test.name}\n      ${e.message}`;
        failures.push({ suite: suite.name, test: test.name, error: e.message });
        log('fail', msg);
      }
    }
  }

  log('summary', `\nИтого: ${passed + failed} тестов, прошло ${passed}, не прошло ${failed}`);
  return { passed, failed, failures };
}

export function getSuites() {
  return suites;
}

// ---------- Вспомогательные функции ----------

function defaultLog(type, text) {
  if (type === 'pass') console.log('\x1b[32m%s\x1b[0m', text);
  else if (type === 'fail') console.log('\x1b[31m%s\x1b[0m', text);
  else if (type === 'summary') console.log(text);
  else console.log(text);
}

function stringify(value) {
  if (value === undefined) return 'undefined';
  if (value === Infinity) return '∞';
  if (typeof value === 'object' && value !== null) {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}
