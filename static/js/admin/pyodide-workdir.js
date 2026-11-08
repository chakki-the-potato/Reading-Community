import { getPython } from './pyodide-loader.js';

export const WORK_DIR = '/work';

function removeTree(fs, dir) {
  for (const name of fs.readdir(dir)) {
    if (name === '.' || name === '..') continue;
    const path = `${dir}/${name}`;
    if (fs.isDir(fs.stat(path).mode)) {
      removeTree(fs, path);
      fs.rmdir(path);
    } else {
      fs.unlink(path);
    }
  }
}

export async function resetWorkDir(files) {
  const { FS } = await getPython();
  if (FS.analyzePath(WORK_DIR).exists) removeTree(FS, WORK_DIR);
  else FS.mkdirTree(WORK_DIR);
  for (const [path, content] of Object.entries(files)) {
    const full = `${WORK_DIR}/${path}`;
    FS.mkdirTree(full.slice(0, full.lastIndexOf('/')));
    FS.writeFile(full, content);
  }
}

export async function readWorkFiles(paths) {
  const { FS } = await getPython();
  return Object.fromEntries(paths.map(p => {
    const full = `${WORK_DIR}/${p}`;
    return [p, FS.analyzePath(full).exists ? FS.readFile(full, { encoding: 'utf8' }) : null];
  }));
}

export const workPath = path => `${WORK_DIR}/${path}`;
