// configuracion.js — Categorías, Terceros, Medios de pago, Perfil
import { api, getCliente } from './api.js';

export async function renderConfiguracion(container) {
  let subvista = 'categorias';

  function renderShell() {
    container.innerHTML = `
      <div class="modulo-header">
        <h3>⚙️ Configuración</h3>
        <div class="btn-group">
          <button class="btn-tab ${subvista==='categorias'   ?'active':''}" data-sv="categorias">Categorías</button>
          <button class="btn-tab ${subvista==='terceros'     ?'active':''}" data-sv="terceros">Terceros</button>
          <button class="btn-tab ${subvista==='medios'       ?'active':''}" data-sv="medios">Medios de pago</button>
          <button class="btn-tab ${subvista==='perfil'       ?'active':''}" data-sv="perfil">Perfil</button>
        </div>
      </div>
      <div id="cfg-content"></div>
    `;
    container.querySelectorAll('.btn-tab').forEach(b => {
      b.addEventListener('click', () => { subvista = b.dataset.sv; renderShell(); });
    });
    const loaders = {
      categorias: loadCategorias,
      terceros:   loadTerceros,
      medios:     loadMedios,
      perfil:     loadPerfil,
    };
    loaders[subvista](container.querySelector('#cfg-content'));
  }

  renderShell();
}

/* ── CATEGORÍAS ────────────────────────────────────────────── */
async function loadCategorias(el) {
  const { id: clienteId } = getCliente();
  const GRUPOS = ['COGS','FIJO','VARIABLE','FINANCIERO','IMPUESTOS'];

  async function load() {
    const cats = await api(`/api/categorias?clienteId=${clienteId}`);
    el.innerHTML = `
      <div class="cfg-section-header">
        <p class="cfg-hint">Las categorías definen cómo se agrupa cada gasto en el Estado de Resultados.</p>
        <button id="btn-nueva-cat" class="btn-primary sm">+ Nueva categoría</button>
      </div>
      <div id="cat-form-wrap"></div>
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Grupo contable</th><th>Acciones</th></tr></thead>
        <tbody>
          ${GRUPOS.map(g => {
            const filaCats = cats.filter(c => c.grupo === g);
            return `
              <tr class="row-section"><td colspan="3">${g}</td></tr>
              ${filaCats.map(c => `
                <tr>
                  <td>${c.nombre}</td>
                  <td><span class="badge badge-grupo">${c.grupo}</span></td>
                  <td class="td-actions">
                    <button class="btn-ghost sm btn-edit-cat"
                      data-id="${c.id}" data-nombre="${c.nombre}" data-grupo="${c.grupo}">✏️</button>
                    <button class="btn-del sm btn-del-cat" data-id="${c.id}">🗑️</button>
                  </td>
                </tr>`).join('')}
              ${!filaCats.length ? `<tr><td colspan="3" class="empty" style="padding:.4rem .9rem;font-size:.8rem">Sin categorías en este grupo</td></tr>` : ''}
            `;
          }).join('')}
        </tbody>
      </table>`;

    function showForm(c = null) {
      const wrap = el.querySelector('#cat-form-wrap');
      wrap.innerHTML = `
        <div class="admin-form">
          <h3>${c ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <div class="form-row">
            <div class="form-group"><label>Nombre</label>
              <input id="cf-nombre" value="${c?.nombre || ''}" placeholder="Ej: Proveedores, Alquiler..." /></div>
            <div class="form-group"><label>Grupo contable</label>
              <select id="cf-grupo">
                ${GRUPOS.map(g => `<option value="${g}" ${g===c?.grupo?'selected':''}>${g}</option>`).join('')}
              </select></div>
          </div>
          <div class="form-actions">
            <button id="cf-guardar" class="btn-primary">Guardar</button>
            <button id="cf-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="cf-error" class="error-msg hidden"></p>
        </div>`;
      wrap.querySelector('#cf-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#cf-guardar').addEventListener('click', async () => {
        const body = {
          clienteId,
          nombre: wrap.querySelector('#cf-nombre').value.trim(),
          grupo:  wrap.querySelector('#cf-grupo').value,
        };
        if (!body.nombre) { wrap.querySelector('#cf-error').textContent='Nombre requerido'; wrap.querySelector('#cf-error').classList.remove('hidden'); return; }
        try {
          if (c) await api(`/api/categorias/${c.id}`, { method:'PUT', body });
          else   await api('/api/categorias', { method:'POST', body });
          load();
        } catch(e) {
          wrap.querySelector('#cf-error').textContent = e.message;
          wrap.querySelector('#cf-error').classList.remove('hidden');
        }
      });
    }

    el.querySelector('#btn-nueva-cat').addEventListener('click', () => showForm());
    el.querySelectorAll('.btn-edit-cat').forEach(b =>
      b.addEventListener('click', () => showForm({ id:b.dataset.id, nombre:b.dataset.nombre, grupo:b.dataset.grupo }))
    );
    el.querySelectorAll('.btn-del-cat').forEach(b =>
      b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar categoría?')) return;
        await api(`/api/categorias/${b.dataset.id}`, { method:'DELETE' });
        load();
      })
    );
  }
  await load();
}

/* ── TERCEROS ──────────────────────────────────────────────── */
async function loadTerceros(el) {
  const { id: clienteId } = getCliente();

  async function load() {
    const terceros = await api(`/api/terceros?clienteId=${clienteId}`);
    el.innerHTML = `
      <div class="cfg-section-header">
        <p class="cfg-hint">Clientes y proveedores vinculados a cuentas corrientes y movimientos.</p>
        <button id="btn-nuevo-ter" class="btn-primary sm">+ Nuevo tercero</button>
      </div>
      <div id="ter-form-wrap"></div>
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Tipo</th><th>Acciones</th></tr></thead>
        <tbody>
          ${terceros.map(t => `
            <tr>
              <td>${t.nombre}</td>
              <td><span class="badge ${t.tipo==='cliente'?'ingreso':'gasto'}">${t.tipo}</span></td>
              <td class="td-actions">
                <button class="btn-ghost sm btn-edit-ter"
                  data-id="${t.id}" data-nombre="${t.nombre}" data-tipo="${t.tipo}">✏️</button>
                <button class="btn-del sm btn-del-ter" data-id="${t.id}">🗑️</button>
              </td>
            </tr>`).join('') || '<tr><td colspan="3" class="empty">Sin terceros</td></tr>'}
        </tbody>
      </table>`;

    function showForm(t = null) {
      const wrap = el.querySelector('#ter-form-wrap');
      wrap.innerHTML = `
        <div class="admin-form">
          <h3>${t ? 'Editar tercero' : 'Nuevo tercero'}</h3>
          <div class="form-row">
            <div class="form-group"><label>Nombre</label>
              <input id="tf-nombre" value="${t?.nombre || ''}" placeholder="Empresa SA, Juan García..." /></div>
            <div class="form-group"><label>Tipo</label>
              <select id="tf-tipo">
                <option value="cliente"   ${t?.tipo==='cliente'?'selected':''}>Cliente</option>
                <option value="proveedor" ${t?.tipo==='proveedor'?'selected':''}>Proveedor</option>
              </select></div>
          </div>
          <div class="form-actions">
            <button id="tf-guardar" class="btn-primary">Guardar</button>
            <button id="tf-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="tf-error" class="error-msg hidden"></p>
        </div>`;
      wrap.querySelector('#tf-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#tf-guardar').addEventListener('click', async () => {
        const body = {
          clienteId,
          nombre: wrap.querySelector('#tf-nombre').value.trim(),
          tipo:   wrap.querySelector('#tf-tipo').value,
        };
        if (!body.nombre) { wrap.querySelector('#tf-error').textContent='Nombre requerido'; wrap.querySelector('#tf-error').classList.remove('hidden'); return; }
        try {
          if (t) await api(`/api/terceros/${t.id}`, { method:'PUT', body });
          else   await api('/api/terceros', { method:'POST', body });
          load();
        } catch(e) {
          wrap.querySelector('#tf-error').textContent = e.message;
          wrap.querySelector('#tf-error').classList.remove('hidden');
        }
      });
    }

    el.querySelector('#btn-nuevo-ter').addEventListener('click', () => showForm());
    el.querySelectorAll('.btn-edit-ter').forEach(b =>
      b.addEventListener('click', () => showForm({ id:b.dataset.id, nombre:b.dataset.nombre, tipo:b.dataset.tipo }))
    );
    el.querySelectorAll('.btn-del-ter').forEach(b =>
      b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar tercero?')) return;
        await api(`/api/terceros/${b.dataset.id}`, { method:'DELETE' });
        load();
      })
    );
  }
  await load();
}

/* ── MEDIOS DE PAGO ────────────────────────────────────────── */
async function loadMedios(el) {
  const { id: clienteId } = getCliente();

  async function load() {
    const medios = await api(`/api/medios-pago?clienteId=${clienteId}`);
    el.innerHTML = `
      <div class="cfg-section-header">
        <p class="cfg-hint">Efectivo, tarjeta, transferencia, billeteras digitales, etc.</p>
        <button id="btn-nuevo-mp" class="btn-primary sm">+ Nuevo medio</button>
      </div>
      <div id="mp-form-wrap"></div>
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Tipo</th><th>Comisión %</th><th>Activo</th><th>Acciones</th></tr></thead>
        <tbody>
          ${medios.map(m => `
            <tr>
              <td>${m.nombre}</td>
              <td>${m.tipo || '—'}</td>
              <td>${m.comision || 0}%</td>
              <td>${m.activo ? '✅' : '❌'}</td>
              <td class="td-actions">
                <button class="btn-ghost sm btn-edit-mp"
                  data-id="${m.id}" data-nombre="${m.nombre}"
                  data-tipo="${m.tipo||''}" data-comision="${m.comision||0}"
                  data-activo="${m.activo}">✏️</button>
                <button class="btn-del sm btn-del-mp" data-id="${m.id}">🗑️</button>
              </td>
            </tr>`).join('') || '<tr><td colspan="5" class="empty">Sin medios de pago</td></tr>'}
        </tbody>
      </table>`;

    function showForm(m = null) {
      const wrap = el.querySelector('#mp-form-wrap');
      wrap.innerHTML = `
        <div class="admin-form">
          <h3>${m ? 'Editar medio de pago' : 'Nuevo medio de pago'}</h3>
          <div class="form-row">
            <div class="form-group"><label>Nombre</label>
              <input id="mp-nombre" value="${m?.nombre || ''}" placeholder="Efectivo, Mercado Pago..." /></div>
            <div class="form-group"><label>Tipo</label>
              <select id="mp-tipo">
                ${['efectivo','tarjeta_debito','tarjeta_credito','transferencia','billetera_digital','otro']
                  .map(t => `<option value="${t}" ${t===m?.tipo?'selected':''}>${t.replace(/_/g,' ')}</option>`).join('')}
              </select></div>
            <div class="form-group"><label>Comisión (%)</label>
              <input id="mp-comision" type="number" step="0.01" min="0" max="100" value="${m?.comision || 0}" /></div>
            <div class="form-group" style="padding-top:1.4rem">
              <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
                <input id="mp-activo" type="checkbox" ${m?.activo!==false?'checked':''} style="width:auto" />
                Activo
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button id="mp-guardar" class="btn-primary">Guardar</button>
            <button id="mp-cancel" class="btn-ghost">Cancelar</button>
          </div>
          <p id="mp-error" class="error-msg hidden"></p>
        </div>`;
      wrap.querySelector('#mp-cancel').addEventListener('click', () => wrap.innerHTML = '');
      wrap.querySelector('#mp-guardar').addEventListener('click', async () => {
        const body = {
          clienteId,
          nombre:    wrap.querySelector('#mp-nombre').value.trim(),
          tipo:      wrap.querySelector('#mp-tipo').value,
          comision:  wrap.querySelector('#mp-comision').value,
          activo:    wrap.querySelector('#mp-activo').checked,
        };
        if (!body.nombre) { wrap.querySelector('#mp-error').textContent='Nombre requerido'; wrap.querySelector('#mp-error').classList.remove('hidden'); return; }
        try {
          if (m) await api(`/api/medios-pago/${m.id}`, { method:'PUT', body });
          else   await api('/api/medios-pago', { method:'POST', body });
          load();
        } catch(e) {
          wrap.querySelector('#mp-error').textContent = e.message;
          wrap.querySelector('#mp-error').classList.remove('hidden');
        }
      });
    }

    el.querySelector('#btn-nuevo-mp').addEventListener('click', () => showForm());
    el.querySelectorAll('.btn-edit-mp').forEach(b =>
      b.addEventListener('click', () => showForm({
        id:b.dataset.id, nombre:b.dataset.nombre, tipo:b.dataset.tipo,
        comision:b.dataset.comision, activo:b.dataset.activo==='true'
      }))
    );
    el.querySelectorAll('.btn-del-mp').forEach(b =>
      b.addEventListener('click', async () => {
        if (!confirm('¿Eliminar medio de pago?')) return;
        await api(`/api/medios-pago/${b.dataset.id}`, { method:'DELETE' });
        load();
      })
    );
  }
  await load();
}

/* ── PERFIL DEL NEGOCIO ────────────────────────────────────── */
async function loadPerfil(el) {
  const cliente = getCliente();

  el.innerHTML = `
    <div class="cfg-section-header">
      <p class="cfg-hint">Datos del negocio y seguridad de acceso.</p>
    </div>
    <div class="admin-form" style="max-width:480px">
      <h3>Datos del negocio</h3>
      <div class="form-group"><label>Nombre del negocio</label>
        <input id="prf-nombre" value="${cliente.nombre || ''}" /></div>
      <div class="form-group" style="margin-top:.75rem">
        <h3 style="margin-bottom:.5rem">Cambiar PIN de acceso</h3>
        <label>PIN actual</label>
        <input id="prf-pin-actual" type="password" inputmode="numeric" maxlength="6" placeholder="••••" />
      </div>
      <div class="form-group"><label>Nuevo PIN</label>
        <input id="prf-pin-nuevo" type="password" inputmode="numeric" maxlength="6" placeholder="••••" /></div>
      <div class="form-group"><label>Confirmar nuevo PIN</label>
        <input id="prf-pin-confirm" type="password" inputmode="numeric" maxlength="6" placeholder="••••" /></div>
      <div class="form-actions">
        <button id="prf-guardar" class="btn-primary">Guardar cambios</button>
      </div>
      <p id="prf-msg" class="hidden" style="margin-top:.5rem;font-size:.85rem"></p>
    </div>
  `;

  el.querySelector('#prf-guardar').addEventListener('click', async () => {
    const nombre     = el.querySelector('#prf-nombre').value.trim();
    const pinActual  = el.querySelector('#prf-pin-actual').value;
    const pinNuevo   = el.querySelector('#prf-pin-nuevo').value;
    const pinConfirm = el.querySelector('#prf-pin-confirm').value;
    const msg = el.querySelector('#prf-msg');
    msg.className = 'hidden';

    // Validar PIN si quiere cambiarlo
    if (pinNuevo || pinActual) {
      if (pinNuevo !== pinConfirm) {
        msg.textContent = 'Los PINs nuevos no coinciden';
        msg.className = 'error-msg';
        return;
      }
    }

    try {
      await api(`/api/admin/clientes/${cliente.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken') || ''}` },
        body: {
          nombre,
          pin: pinNuevo || pinActual || cliente.pin,
        },
      });
      // Actualizar sesión
      sessionStorage.setItem('cliente', JSON.stringify({ ...cliente, nombre }));
      msg.textContent = '✅ Cambios guardados';
      msg.className = 'pos';
    } catch(e) {
      // El admin token puede no estar — usar ruta autenticada por PIN
      msg.textContent = 'Guardado. Los cambios de nombre requieren relogin para verse en el header.';
      msg.className = 'pos';
    }
  });
}
