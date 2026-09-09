// productos.js — catálogo con márgenes
import { api, getCliente, fmt, fmtNum } from './api.js';

export async function renderProductos(container) {
  const { id: clienteId } = getCliente();
  container.innerHTML = `<p class="loading">Cargando...</p>`;

  async function load() {
    const [productos, cats] = await Promise.all([
      api(`/api/productos?clienteId=${clienteId}`),
      api(`/api/categorias?clienteId=${clienteId}`),
    ]);

    container.innerHTML = `
      <div class="modulo-header">
        <h3>📦 Productos</h3>
        <button id="btn-nuevo-prod" class="btn-primary sm">+ Nuevo producto</button>
      </div>
      <div id="prod-form-wrap"></div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th><th class="num">Costo</th><th class="num">Precio</th>
            <th class="num">Margen</th><th class="num">Stock</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${productos.map(p => {
            const margen = p.precio_venta > 0
              ? ((p.precio_venta - p.costo) / p.precio_venta * 100).toFixed(1)
              : 0;
            const stockOk = Number(p.stock) > Number(p.stock_minimo);
            return `
            <tr>
              <td>${p.nombre}</td>
              <td class="num">${fmt(p.costo)}</td>
              <td class="num">${fmt(p.precio_venta)}</td>
              <td class="num ${Number(margen) > 0 ? 'pos' : 'neg'}">${margen}%</td>
              <td class="num ${stockOk ? '' : 'alerta'}">
                ${fmtNum(p.stock, 0)} ${!stockOk ? '⚠️' : ''}
              </td>
              <td class="td-actions">
                <button class="btn-ghost sm btn-edit-prod" data-id="${p.id}"
                  data-nombre="${p.nombre}" data-costo="${p.costo}"
                  data-precio="${p.precio_venta}" data-stock="${p.stock}"
                  data-minimo="${p.stock_minimo}" data-cat="${p.categoria_id || ''}">
                  ✏️
                </button>
                <button class="btn-del sm btn-del-prod" data-id="${p.id}">🗑️</button>
              </td>
            </tr>`;
          }).join('') || '<tr><td colspan="6" class="empty">Sin productos</td></tr>'}
        </tbody>
      </table>
    `;

    function showForm(p = null) {
      const wrap = container.querySelector('#prod-form-wrap');
      wrap.innerHTML = `
        <div class="admin-form">
          <h3>${p ? 'Editar producto' : 'Nuevo producto'}</h3>
          <div class="form-row">
            <div class="form-group"><label>Nombre</label>
              <input id="pf-nombre" value="${p?.nombre || ''}" /></div>
            <div class="form-group"><label>Costo ($)</label>
              <input id="pf-costo" type="number" step="0.01" value="${p?.costo || 0}" /></div>
            <div class="form-group"><label>Precio venta ($)</label>
              <input id="pf-precio" type="number" step="0.01" value="${p?.precio_venta || 0}" /></div>
            <div class="form-group"><label>Stock inicial</label>
              <input id="pf-stock" type="number" step="0.001" value="${p?.stock || 0}" /></div>
            <div class="form-group"><label>Stock mínimo</label>
              <input id="pf-minimo" type="number" step="0.001" value="${p?.stock_minimo || 0}" /></div>
            <div class="form-group"><label>Categoría</label>
              <select id="pf-cat">
                <option value="">— Sin categoría —</option>
                ${cats.map(c => `<option value="${c.id}" ${c.id == p?.categoria_id ? 'selected' : ''}>${c.nombre} (${c.grupo})</option>`).join('')}
              </select>
            </div>
          </div>
          <div id="pf-margen" class="margen-preview"></div>
          <div class="form-actions">
            <button id="pf-guardar" class="btn-primary">Guardar</button>
            <button id="pf-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="pf-error" class="error-msg hidden"></p>
        </div>`;

      function updateMargen() {
        const c = Number(document.getElementById('pf-costo').value);
        const v = Number(document.getElementById('pf-precio').value);
        const m = v > 0 ? ((v - c) / v * 100).toFixed(1) : 0;
        document.getElementById('pf-margen').innerHTML =
          `<span class="${Number(m) > 0 ? 'pos' : 'neg'}">Margen: ${m}% — Ganancia: ${fmt(v - c)}</span>`;
      }
      wrap.querySelector('#pf-costo').addEventListener('input', updateMargen);
      wrap.querySelector('#pf-precio').addEventListener('input', updateMargen);
      updateMargen();

      wrap.querySelector('#pf-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#pf-guardar').addEventListener('click', async () => {
        const body = {
          clienteId,
          nombre:      wrap.querySelector('#pf-nombre').value,
          costo:       wrap.querySelector('#pf-costo').value,
          precioVenta: wrap.querySelector('#pf-precio').value,
          stock:       wrap.querySelector('#pf-stock').value,
          stockMinimo: wrap.querySelector('#pf-minimo').value,
          categoriaId: wrap.querySelector('#pf-cat').value || null,
        };
        try {
          if (p) await api(`/api/productos/${p.id}`, { method: 'PUT', body });
          else    await api('/api/productos', { method: 'POST', body });
          load();
        } catch (e) {
          wrap.querySelector('#pf-error').textContent = e.message;
          wrap.querySelector('#pf-error').classList.remove('hidden');
        }
      });
    }

    container.querySelector('#btn-nuevo-prod').addEventListener('click', () => showForm());
    container.querySelectorAll('.btn-edit-prod').forEach(b => {
      b.addEventListener('click', () => showForm({
        id: b.dataset.id, nombre: b.dataset.nombre, costo: b.dataset.costo,
        precio_venta: b.dataset.precio, stock: b.dataset.stock,
        stock_minimo: b.dataset.minimo, categoria_id: b.dataset.cat,
      }));
    });
    container.querySelectorAll('.btn-del-prod').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar producto?')) return;
        await api(`/api/productos/${b.dataset.id}`, { method: 'DELETE' });
        load();
      });
    });
  }

  await load();
}
