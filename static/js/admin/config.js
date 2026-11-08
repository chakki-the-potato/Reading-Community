export const REPO = Object.freeze({
  owner: 'chakki-the-potato',
  name: 'Reading-Community',
  branch: 'main',
});

export const ADMIN_LOGIN = Object.freeze({
  id: 'admin',
  password: 'admin123!',
});

export const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

export const PYTHON_SOURCES = Object.freeze({
  'check_verification.py': '../check_verification.py',
  'check_runner.py': '../static/py/check_runner.py',
  'review_candidates.py': '../static/py/review_candidates.py',
  'record_cell.py': '../static/py/record_cell.py',
});

export const PATHS = Object.freeze({
  index: 'records/index.json',
  payments: 'records/payments.json',
});
