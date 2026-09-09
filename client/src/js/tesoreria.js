// tesoreria.js — transacciones, cuenta corriente, terceros
import { api, getCliente, fmt } from './api.js';

export async function renderTesoreria(container) {
  const { id: clienteId } = getCliente();
  let subvista = 'movimientos';
  container.innerHTML = `<p class="loading">Cargando...</p>`;

  async function loadMovimientos() {
    const [txs, cats, terceros] = await Promise.all([
      api(`/api/tesoreria/tx?clienteId=${clienteId}`),
      api(`/api/categorias?clienteId=${clienteId}`),
      api(`/api/terceros?clienteId=${clienteId}`),
    ]);

    const ingresos = txs.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0);
    const gastos   = txs.filter(t => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0);

    container.querySelector('#tesoreria-content').innerHTML = `
      <div class="pl-cards" style="margin-bottom:1rem">
        <div class="pl-card ingreso"><span class="pl-label">Total ingresos</span><span class="pl-valor">${fmt(ingresos)}</span></div>
        <div class="pl-card gasto"><span class="pl-label">Total gastos</span><span class="pl-valor">${fmt(gastos)}</span></div>
        <div class="pl-card resultado ${ingresos - gastos >= 0 ? 'pos' : 'neg'}">
          <span class="pl-label">Saldo</span><span class="pl-valor">${fmt(ingresos - gastos)}</span>
        </div>
      </div>

      <div class="modulo-header">
        <h4>Transacciones</h4>
        <button id="btn-nueva-tx" class="btn-primary sm">+ Nueva</button>
      </div>
      <div id="tx-form-wrap"></div>
      <table class="data-table">
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th class="num">Monto</th></tr></thead>
        <tbody>
          ${txs.slice(0, 50).map(t => {
            const cat = cats.find(c => c.id === t.categoria_id);
            return `<tr>
              <td>${t.fecha}</td>
              <td><span class="badge ${t.tipo}">${t.tipo}</span></td>
              <td>${cat ? cat.nombre : '—'}</td>
              <td>${t.descripcion || '—'}</td>
              <td class="num ${t.tipo}">${fmt(t.monto)}</td>
            </tr>`;
          }).join('') || '<tr><td colspan="5" class="empty">Sin movimientos</td></tr>'}
        </tbody>
      </table>
    `;

    container.querySelector('#btn-nueva-tx').addEventListener('click', () => {
      const wrap = container.querySelector('#tx-form-wrap');
      wrap.innerHTML = `
        <div class="admin-form">
          <h3>Nueva transacción</h3>
          <div class="form-row">
            <div class="form-group"><label>Tipo</label>
              <select id="tx-tipo"><option value="ingreso">Ingreso</option><option value="gasto">Gasto</option></select></div>
            <div class="form-group"><label>Monto ($)</label>
              <input id="tx-monto" type="number" step="0.01" /></div>
            <div class="form-group"><label>Categoría</label>
              <select id="tx-cat">
                <option value="">— Sin categoría —</option>
                ${cats.map(c => `<option value="${c.id}">${c.nombre} (${c.grupo})</option>`).join('')}
              </select></div>
            <div class="form-group"><label>Descripción</label>
              <input id="tx-desc" /></div>
            <div class="form-group"><label>Fecha</label>
              <input id="tx-fecha" type="date" value="${new Date().toISOString().slice(0,10)}" /></div>
          </div>
          <div class="form-actions">
            <button id="tx-guardar" class="btn-primary">Guardar</button>
            <button id="tx-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="tx-error" class="error-msg hidden"></p>
        </div>`;

      wrap.querySelector('#tx-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#tx-guardar').addEventListener('click', async () => {
        const monto = wrap.querySelector('#tx-monto').value;
        if (!monto) { wrap.querySelector('#tx-error').textContent = 'Ingresá un monto'; wrap.querySelector('#tx-error').classList.remove('hidden'); return; }
        try {
          await api('/api/tesoreria/tx', { method: 'POST', body: {
            clienteId,
            tipo: wrap.querySelector('#tx-tipo').value,
            monto,
            categoriaId: wrap.querySelector('#tx-cat').value || null,
            descripcion: wrap.querySelector('#tx-desc').value,
            fecha: wrap.querySelector('#tx-fecha').value,
          }});
          loadMovimientos();
        } catch (e) {
          wrap.querySelector('#tx-error').textContent = e.message;
          wrap.querySelector('#tx-error').classList.remove('hidden');
        }
      });
    });
  }

  async function loadCuentas() {
    const [cuentas, terceros] = await Promise.all([
      api(`/api/tesoreria/cuentas-corrientes?clienteId=${clienteId}`),
      api(`/api/terceros?clienteId=${clienteId}`),
    ]);

    const pendiente = cuentas.filter(c => c.estado !== 'pagada').reduce((s, c) => s + Number(c.monto), 0);

    container.querySelector('#tesoreria-content').innerHTML = `
      <div class="pl-cards" style="margin-bottom:1rem">
        <div class="pl-card neg"><span class="pl-label">Saldo pendiente</span><span class="pl-valor">${fmt(pendiente)}</span></div>
      </div>
      <div class="modulo-header">
        <h4>Cuentas corrientes</h4>
        <button id="btn-nueva-cc" class="btn-primary sm">+ Nueva</button>
      </div>
      <div id="cc-form-wrap"></div>
      <table class="data-table">
        <thead><tr><th>Tercero</th><th>Descripción</th><th>Vencimiento</th><th>Estado</th><th class="num">Monto</th></tr></thead>
        <tbody>
          ${cuentas.map(c => `<tr>
            <td>${c.tercero_nombre || '—'}</td>
            <td>${c.descripcion || '—'}</td>
            <td>${c.vencimiento || '—'}</td>
            <td><span class="badge estado-${c.estado}">${c.estado}</span></td>
            <td class="num">${fmt(c.monto)}</td>
          </tr>`).join('') || '<tr><td colspan="5" class="empty">Sin cuentas</td></tr>'}
        </tbody>
      </table>
    `;

    container.querySelector('#btn-nueva-cc').addEventListener('click', () => {
      const wrap = container.querySelector('#cc-form-wrap');
      wrap.innerHTML = `
        <div class="admin-form">
          <h3>Nueva cuenta corriente</h3>
          <div class="form-row">
            <div class="form-group"><label>Tercero</label>
              <select id="cc-tercero">
                <option value="">— Sin tercero —</option>
                ${terceros.map(t => `<option value="${t.id}">${t.nombre} (${t.tipo})</option>`).join('')}
              </select></div>
            <div class="form-group"><label>Monto ($)</label>
              <input id="cc-monto" type="number" step="0.01" /></div>
            <div class="form-group"><label>Descripción</label>
              <input id="cc-desc" /></div>
            <div class="form-group"><label>Vencimiento</label>
              <input id="cc-venc" type="date" /></div>
          </div>
          <div class="form-actions">
            <button id="cc-guardar" class="btn-primary">Guardar</button>
            <button id="cc-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="cc-error" class="error-msg hidden"></p>
        </div>`;
      wrap.querySelector('#cc-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#cc-guardar').addEventListener('click', async () => {
        try {
          await api('/api/tesoreria/cuentas-corrientes', { method: 'POST', body: {
            clienteId,
            terceroId: wrap.querySelector('#cc-tercero').value || null,
            monto:     wrap.querySelector('#cc-monto').value,
            descripcion: wrap.querySelector('#cc-desc').value,
            vencimiento: wrap.querySelector('#cc-venc').value || null,
          }});
          loadCuentas();
        } catch (e) {
          wrap.querySelector('#cc-error').textContent = e.message;
          wrap.querySelector('#cc-error').classList.remove('hidden');
        }
      });
    });
  }

  function renderShell() {
    container.innerHTML = `
      <div class="modulo-header">
        <h3>💰 Tesorería</h3>
        <div class="btn-group">
          <button class="btn-tab ${subvista === 'movimientos' ? 'active' : ''}" data-sv="movimientos">Movimientos</button>
          <button class="btn-tab ${subvista === 'cuentas' ? 'active' : ''}" data-sv="cuentas">Cuentas corrientes</button>
        </div>
      </div>
      <div id="tesoreria-content"></div>
    `;
    container.querySelectorAll('.btn-tab').forEach(b => {
      b.addEventListener('click', () => { subvista = b.dataset.sv; renderShell(); });
    });
    if (subvista === 'movimientos') loadMovimientos();
    else loadCuentas();
  }

  renderShell();
}
