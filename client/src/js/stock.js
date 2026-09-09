// stock.js — inventario y movimientos
import { api, getCliente, fmt, fmtNum } from './api.js';

export async function renderStock(container) {
  const { id: clienteId } = getCliente();
  container.innerHTML = `<p class="loading">Cargando...</p>`;

  async function load() {
    const [productos, movimientos] = await Promise.all([
      api(`/api/productos?clienteId=${clienteId}`),
      api(`/api/stock?clienteId=${clienteId}`),
    ]);

    const alertas = productos.filter(p => Number(p.stock) <= Number(p.stock_minimo));

    container.innerHTML = `
      <div class="modulo-header">
        <h3>🏪 Stock e Inventario</h3>
        <button id="btn-nuevo-mov" class="btn-primary sm">+ Movimiento</button>
      </div>

      ${alertas.length ? `
        <div class="alerta-box">
          ⚠️ <strong>${alertas.length} producto(s) con stock bajo:</strong>
          ${alertas.map(p => `${p.nombre} (${fmtNum(p.stock, 0)})`).join(', ')}
        </div>` : ''}

      <div id="stock-form-wrap"></div>

      <h4 style="margin-bottom:.5rem">Estado del inventario</h4>
      <table class="data-table">
        <thead>
          <tr><th>Producto</th><th class="num">Stock</th><th class="num">Mínimo</th><th class="num">Valor stock</th><th>Estado</th></tr>
        </thead>
        <tbody>
          ${productos.map(p => {
            const bajo = Number(p.stock) <= Number(p.stock_minimo);
            return `<tr>
              <td>${p.nombre}</td>
              <td class="num">${fmtNum(p.stock, 2)}</td>
              <td class="num">${fmtNum(p.stock_minimo, 2)}</td>
              <td class="num">${fmt(p.stock * p.costo)}</td>
              <td><span class="badge ${bajo ? 'gasto' : 'ingreso'}">${bajo ? 'Bajo' : 'OK'}</span></td>
            </tr>`;
          }).join('') || '<tr><td colspan="5" class="empty">Sin productos</td></tr>'}
        </tbody>
      </table>

      <h4 style="margin:1.5rem 0 .5rem">Últimos movimientos</h4>
      <table class="data-table">
        <thead>
          <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th class="num">Cantidad</th><th>Motivo</th></tr>
        </thead>
        <tbody>
          ${movimientos.slice(0, 30).map(m => `
            <tr>
              <td>${new Date(m.fecha).toLocaleDateString('es-AR')}</td>
              <td>${m.producto_nombre}</td>
              <td><span class="badge ${m.tipo === 'entrada' ? 'ingreso' : 'gasto'}">${m.tipo}</span></td>
              <td class="num">${fmtNum(m.cantidad, 2)}</td>
              <td>${m.motivo || '—'}</td>
            </tr>`).join('') || '<tr><td colspan="5" class="empty">Sin movimientos</td></tr>'}
        </tbody>
      </table>
    `;

    container.querySelector('#btn-nuevo-mov').addEventListener('click', () => {
      const wrap = container.querySelector('#stock-form-wrap');
      wrap.innerHTML = `
        <div class="admin-form">
          <h3>Registrar movimiento de stock</h3>
          <div class="form-row">
            <div class="form-group"><label>Producto</label>
              <select id="sm-prod">
                <option value="">— Seleccioná —</option>
                ${productos.map(p => `<option value="${p.id}">${p.nombre} (stock: ${fmtNum(p.stock, 0)})</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>Tipo</label>
              <select id="sm-tipo">
                <option value="entrada">Entrada (compra/ajuste +)</option>
                <option value="salida">Salida (venta/ajuste -)</option>
              </select>
            </div>
            <div class="form-group"><label>Cantidad</label>
              <input id="sm-cant" type="number" step="0.001" min="0.001" value="1" /></div>
            <div class="form-group"><label>Motivo</label>
              <input id="sm-motivo" placeholder="Compra, venta, ajuste..." /></div>
          </div>
          <div class="form-actions">
            <button id="sm-guardar" class="btn-primary">Guardar</button>
            <button id="sm-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="sm-error" class="error-msg hidden"></p>
        </div>`;

      wrap.querySelector('#sm-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#sm-guardar').addEventListener('click', async () => {
        const productoId = wrap.querySelector('#sm-prod').value;
        const tipo = wrap.querySelector('#sm-tipo').value;
        const cantidad = wrap.querySelector('#sm-cant').value;
        const motivo = wrap.querySelector('#sm-motivo').value;
        if (!productoId) {
          wrap.querySelector('#sm-error').textContent = 'Seleccioná un producto';
          wrap.querySelector('#sm-error').classList.remove('hidden');
          return;
        }
        try {
          await api('/api/stock', { method: 'POST', body: { productoId, tipo, cantidad, motivo } });
          load();
        } catch (e) {
          wrap.querySelector('#sm-error').textContent = e.message;
          wrap.querySelector('#sm-error').classList.remove('hidden');
        }
      });
    });
  }

  await load();
}
