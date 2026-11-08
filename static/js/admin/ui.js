export const $ = id => document.getElementById(id);

export function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  });
  node.append(...children);
  return node;
}

export function errorText(err) {
  const msg = String(err?.message || err);
  if (!msg.includes('Traceback')) return msg;
  return msg.trim().split('\n').at(-1).replace(/^\w+Error:\s*/, '');
}

export async function runWithButton(button, errorEl, task, statusEl) {
  errorEl.textContent = '';
  button.disabled = true;
  try {
    await task();
  } catch (err) {
    console.error(err);
    errorEl.textContent = errorText(err);
    if (statusEl) statusEl.textContent = '';
  } finally {
    button.disabled = false;
  }
}

export function fillSelect(select, options) {
  const previous = select.value;
  select.replaceChildren(...options.map(o => h('option', { value: o.value, text: o.label })));
  if (options.some(o => o.value === previous)) select.value = previous;
}

export function checkedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}
