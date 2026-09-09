// manufactura.js — BOM / recetas con costeo
import { api, getCliente, fmt, fmtNum } from './api.js';

export async function renderManufactura(container) {
  const { id: clienteId } = getCliente();
  container.innerHTML = `<p class="loading">Cargando...</p>`;

  async function load() {
    const [formulas, insumos] = await Promise.all([
      api(`/api/manufactura/formulas?clienteId=${clienteId}`),
      api(`/api/insumos?clienteId=${clienteId}`),
    ]);

    container.innerHTML = `
      <div class="modulo-header">
        <h3>🔧 Manufactura</h3>
        <div style="display:flex;gap:.5rem">
          <button id="btn-nuevo-ins" class="btn-ghost sm">+ Insumo</button>
          <button id="btn-nueva-formula" class="btn-primary sm">+ Fórmula/Receta</button>
        </div>
      </div>
      <div id="mfg-form-wrap"></div>

      <h4 style="margin-bottom:.5rem">Insumos / Materias primas</h4>
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Unidad</th><th class="num">Costo/u</th><th>Acciones</th></tr></thead>
        <tbody>
          ${insumos.map(i => `<tr>
            <td>${i.nombre}</td>
            <td>${i.unidad || '—'}</td>
            <td class="num">${fmt(i.costo)}</td>
            <td class="td-actions">
              <button class="btn-ghost sm btn-edit-ins"
                data-id="${i.id}" data-nombre="${i.nombre}"
                data-unidad="${i.unidad || ''}" data-costo="${i.costo}">✏️</button>
              <button class="btn-del sm btn-del-ins" data-id="${i.id}">🗑️</button>
            </td>
          </tr>`).join('') || '<tr><td colspan="4" class="empty">Sin insumos</td></tr>'}
        </tbody>
      </table>

      <h4 style="margin:1.5rem 0 .5rem">Fórmulas / Recetas</h4>
      <div id="formulas-list">
        ${formulas.length ? '' : '<p class="empty" style="margin-left:1rem">Sin fórmulas</p>'}
      </div>
    `;

    // Cargar detalle de cada fórmula
    for (const f of formulas) {
      const items = await api(`/api/manufactura/formulas/${f.id}/items`);
      const costoTotal = items.reduce((s, it) => s + Number(it.cantidad) * Number(it.costo || 0), 0);
      const costoPorUnidad = f.rendimiento > 0 ? costoTotal / f.rendimiento : 0;

      const div = document.createElement('div');
      div.className = 'formula-card';
      div.innerHTML = `
        <div class="formula-header">
          <strong>${f.nombre}</strong>
          <span class="formula-meta">Rendimiento: ${fmtNum(f.rendimiento, 2)} u. | Costo/u: ${fmt(costoPorUnidad)}</span>
          <button class="btn-del sm btn-del-formula" data-id="${f.id}">🗑️</button>
        </div>
        <table class="data-table" style="margin-top:.5rem">
          <thead><tr><th>Insumo</th><th class="num">Cantidad</th><th class="num">Costo/u</th><th class="num">Subtotal</th></tr></thead>
          <tbody>
            ${items.map(it => `<tr>
              <td>${it.insumo_nombre}</td>
              <td class="num">${fmtNum(it.cantidad, 3)}</td>
              <td class="num">${fmt(it.costo)}</td>
              <td class="num">${fmt(it.cantidad * it.costo)}</td>
            </tr>`).join('')}
            <tr class="row-total"><td colspan="3"><strong>Costo total producción</strong></td>
              <td class="num"><strong>${fmt(costoTotal)}</strong></td></tr>
          </tbody>
        </table>`;
      container.querySelector('#formulas-list').appendChild(div);

      div.querySelector('.btn-del-formula').addEventListener('click', async () => {
        if (!confirm('¿Eliminar fórmula?')) return;
        await api(`/api/manufactura/formulas/${f.id}`, { method: 'DELETE' });
        load();
      });
    }

    // Form insumo
    function showFormInsumo(ins = null) {
      const wrap = container.querySelector('#mfg-form-wrap');
      wrap.innerHTML = `
        <div class="admin-form">
          <h3>${ins ? 'Editar insumo' : 'Nuevo insumo'}</h3>
          <div class="form-row">
            <div class="form-group"><label>Nombre</label>
              <input id="ins-nombre" value="${ins?.nombre || ''}" /></div>
            <div class="form-group"><label>Unidad</label>
              <input id="ins-unidad" placeholder="kg, lt, u..." value="${ins?.unidad || ''}" /></div>
            <div class="form-group"><label>Costo por unidad ($)</label>
              <input id="ins-costo" type="number" step="0.0001" value="${ins?.costo || 0}" /></div>
          </div>
          <div class="form-actions">
            <button id="ins-guardar" class="btn-primary">Guardar</button>
            <button id="ins-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="ins-error" class="error-msg hidden"></p>
        </div>`;
      wrap.querySelector('#ins-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#ins-guardar').addEventListener('click', async () => {
        const body = {
          clienteId,
          nombre: wrap.querySelector('#ins-nombre').value,
          unidad: wrap.querySelector('#ins-unidad').value,
          costo:  wrap.querySelector('#ins-costo').value,
        };
        try {
          if (ins) await api(`/api/insumos/${ins.id}`, { method: 'PUT', body });
          else     await api('/api/insumos', { method: 'POST', body });
          load();
        } catch (e) {
          wrap.querySelector('#ins-error').textContent = e.message;
          wrap.querySelector('#ins-error').classList.remove('hidden');
        }
      });
    }

    // Form fórmula
    function showFormFormula() {
      const wrap = container.querySelector('#mfg-form-wrap');
      let items = [];
      const renderItems = () => {
        const tbody = wrap.querySelector('#fi-tbody');
        if (!tbody) return;
        tbody.innerHTML = items.map((it, idx) => `
          <tr>
            <td>${insumos.find(i => i.id == it.insumoId)?.nombre || '?'}</td>
            <td class="num">${fmtNum(it.cantidad, 3)}</td>
            <td class="num">${fmt((insumos.find(i => i.id == it.insumoId)?.costo || 0) * it.cantidad)}</td>
            <td><button class="btn-del sm rm-item" data-idx="${idx}">✕</button></td>
          </tr>`).join('') || '<tr><td colspan="4" class="empty">Sin ingredientes</td></tr>';
        tbody.querySelectorAll('.rm-item').forEach(b => {
          b.addEventListener('click', () => { items.splice(Number(b.dataset.idx), 1); renderItems(); });
        });
      };

      wrap.innerHTML = `
        <div class="admin-form">
          <h3>Nueva fórmula / receta</h3>
          <div class="form-row">
            <div class="form-group"><label>Nombre del producto final</label>
              <input id="ff-nombre" /></div>
            <div class="form-group"><label>Rendimiento (unidades producidas)</label>
              <input id="ff-rend" type="number" step="0.001" value="1" /></div>
          </div>
          <h4 style="margin:.75rem 0 .4rem">Ingredientes</h4>
          <div class="form-row" style="align-items:flex-end">
            <div class="form-group"><label>Insumo</label>
              <select id="ff-ins">
                ${insumos.map(i => `<option value="${i.id}">${i.nombre} (${i.unidad || 'u'})</option>`).join('')}
              </select></div>
            <div class="form-group"><label>Cantidad</label>
              <input id="ff-cant" type="number" step="0.001" value="1" /></div>
            <div class="form-group" style="padding-top:1.4rem">
              <button id="ff-add" class="btn-ghost">+ Agregar</button></div>
          </div>
          <table class="data-table" style="margin-top:.5rem">
            <thead><tr><th>Insumo</th><th class="num">Cantidad</th><th class="num">Subtotal</th><th></th></tr></thead>
            <tbody id="fi-tbody"></tbody>
          </table>
          <div class="form-actions" style="margin-top:.75rem">
            <button id="ff-guardar" class="btn-primary">Guardar fórmula</button>
            <button id="ff-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="ff-error" class="error-msg hidden"></p>
        </div>`;

      renderItems();
      wrap.querySelector('#ff-add').addEventListener('click', () => {
        const insumoId = wrap.querySelector('#ff-ins').value;
        const cantidad = Number(wrap.querySelector('#ff-cant').value);
        if (!insumoId || cantidad <= 0) return;
        items.push({ insumoId, cantidad });
        renderItems();
      });
      wrap.querySelector('#ff-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#ff-guardar').addEventListener('click', async () => {
        if (!items.length) {
          wrap.querySelector('#ff-error').textContent = 'Agregá al menos un ingrediente';
          wrap.querySelector('#ff-error').classList.remove('hidden');
          return;
        }
        try {
          await api('/api/manufactura/formulas', { method: 'POST', body: {
            clienteId,
            nombre:      wrap.querySelector('#ff-nombre').value,
            rendimiento: wrap.querySelector('#ff-rend').value,
            items,
          }});
          load();
        } catch (e) {
          wrap.querySelector('#ff-error').textContent = e.message;
          wrap.querySelector('#ff-error').classList.remove('hidden');
        }
      });
    }

    container.querySelector('#btn-nuevo-ins').addEventListener('click', () => showFormInsumo());
    container.querySelector('#btn-nueva-formula').addEventListener('click', showFormFormula);
    container.querySelectorAll('.btn-edit-ins').forEach(b => {
      b.addEventListener('click', () => showFormInsumo({ id: b.dataset.id, nombre: b.dataset.nombre, unidad: b.dataset.unidad, costo: b.dataset.costo }));
    });
    container.querySelectorAll('.btn-del-ins').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar insumo?')) return;
        await api(`/api/insumos/${b.dataset.id}`, { method: 'DELETE' });
        load();
      });
    });
  }

  await load();
}
