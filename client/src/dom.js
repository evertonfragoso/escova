// Tiny element builder. Text goes through textContent, so server data is never parsed as HTML.
export function h (tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue
    if (key === 'class') el.className = value
    else if (key === 'on') for (const [evt, fn] of Object.entries(value)) el.addEventListener(evt, fn)
    else if (key === 'dataset') Object.assign(el.dataset, value)
    else if (key in el) el[key] = value
    else el.setAttribute(key, value)
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    el.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return el
}
