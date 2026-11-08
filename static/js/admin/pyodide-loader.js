import { PYODIDE_INDEX_URL, PYTHON_SOURCES } from './config.js';

const LIB_DIR = '/lib';
let pyodidePromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`${src}를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침하세요.`));
    document.head.appendChild(el);
  });
}

async function fetchText(url) {
  const resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) throw new Error(`${url}를 불러오지 못했습니다 (상태 ${resp.status}).`);
  return resp.text();
}

async function installSources(py) {
  py.FS.mkdirTree(LIB_DIR);
  await Promise.all(Object.entries(PYTHON_SOURCES).map(async ([name, url]) => {
    py.FS.writeFile(`${LIB_DIR}/${name}`, await fetchText(url));
  }));
  py.runPython(`import sys\nsys.path.insert(0, '${LIB_DIR}')`);
}

async function boot() {
  await loadScript(`${PYODIDE_INDEX_URL}pyodide.js`);
  const py = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  await installSources(py);
  return py;
}

export function getPython() {
  if (!pyodidePromise) {
    pyodidePromise = boot().catch(err => {
      pyodidePromise = null;
      throw err;
    });
  }
  return pyodidePromise;
}

export async function callPython(module, fn, args) {
  const py = await getPython();
  const pyArgs = args.map(a => (Array.isArray(a) ? py.toPy(a) : a));
  const mod = py.pyimport(module);
  try {
    return mod[fn](...pyArgs);
  } finally {
    pyArgs.forEach(a => a?.destroy?.());
    mod.destroy();
  }
}
