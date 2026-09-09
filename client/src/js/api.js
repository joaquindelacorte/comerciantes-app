// api.js — helper fetch con clienteId automático
export function getCliente() {
  return JSON.parse(sessionStorage.getItem('cliente') || '{}');
}

export async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la petición');
  }
  return res.json();
}

export function fmt(n) {
  return Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

export function fmtNum(n, dec = 2) {
  return Number(n || 0).toFixed(dec);
}
