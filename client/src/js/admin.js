// admin.js — panel de administración de comercios
let adminToken = null;

export function renderAdmin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <h1 class="login-title" style="font-size:1.2rem">⚙️ Panel Admin</h1>
        <p class="login-sub">Solo para el dueño de la plataforma</p>
        <div class="form-group">
          <label for="admin-pass">Contraseña</label>
          <input id="admin-pass" type="password" placeholder="••••••••" />
        </div>
        <button id="btn-admin-login" class="btn-primary">Entrar</button>
        <p id="admin-error" class="error-msg hidden"></p>
        <button id="btn-volver" class="btn-ghost" style="width:100%;margin-top:.75rem">← Volver al login</button>
      </div>
    </div>
  `;

  document.getElementById('btn-volver').addEventListener('click', () => {
    import('./auth.js').then(m => m.renderLogin());
  });

  document.getElementById('btn-admin-login').addEventListener('click', async () => {
    const pass = document.getElementById('admin-pass').value;
    const errEl = document.getElementById('admin-error');
    errEl.classList.add('hidden');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass }),
      });
      if (!res.ok) throw new Error();
      adminToken = pass;
      renderAdminPanel();
    } catch {
      errEl.textContent = 'Contraseña incorrecta';
      errEl.classList.remove('hidden');
    }
  });
}

async function renderAdminPanel() {
  const app = document.getElementById('app');
  const clientes = await fetchClientes();

  app.innerHTML = `
    <div class="dashboard">
      <header class="dash-header">
        <h2>⚙️ Admin — Comercios</h2>
        <button id="btn-admin-logout" class="btn-ghost">Salir</button>
      </header>
      <div class="dash-content">
        <div class="admin-toolbar">
          <button id="btn-nuevo" class="btn-primary" style="width:auto;padding:.5rem 1.2rem">+ Nuevo comercio</button>
        </div>
        <div id="admin-form-wrap"></div>
        <table class="admin-table">
          <thead>
            <tr><th>#</th><th>Nombre</th><th>PIN</th><th>Acciones</th></tr>
          </thead>
          <tbody id="admin-tbody">
            ${renderRows(clientes)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btn-admin-logout').addEventListener('click', () => {
    adminToken = null;
    import('./auth.js').then(m => m.renderLogin());
  });

  document.getElementById('btn-nuevo').addEventListener('click', () => {
    showForm(null);
  });

  bindTableActions();
}

function renderRows(clientes) {
  if (!clientes.length) return '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Sin comercios registrados</td></tr>';
  return clientes.map(c => `
    <tr data-id="${c.id}" data-nombre="${c.nombre}" data-pin="${c.pin}">
      <td>${c.id}</td>
      <td>${c.nombre}</td>
      <td><code>${c.pin}</code></td>
      <td class="td-actions">
        <button class="btn-edit btn-ghost" data-id="${c.id}">✏️ Editar</button>
        <button class="btn-del" data-id="${c.id}">🗑️ Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function showForm(cliente) {
  const wrap = document.getElementById('admin-form-wrap');
  wrap.innerHTML = `
    <div class="admin-form">
      <h3>${cliente ? 'Editar comercio' : 'Nuevo comercio'}</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Nombre del comercio</label>
          <input id="f-nombre" type="text" value="${cliente?.nombre || ''}" placeholder="Almacén San Martín" />
        </div>
        <div class="form-group">
          <label>PIN (numérico)</label>
          <input id="f-pin" type="text" inputmode="numeric" maxlength="6" value="${cliente?.pin || ''}" placeholder="1234" />
        </div>
      </div>
      <div class="form-actions">
        <button id="btn-guardar" class="btn-primary" style="width:auto;padding:.5rem 1.4rem">Guardar</button>
        <button id="btn-cancelar" class="btn-ghost">Cancelar</button>
      </div>
      <p id="form-error" class="error-msg hidden"></p>
    </div>
  `;

  document.getElementById('btn-cancelar').addEventListener('click', () => {
    wrap.innerHTML = '';
  });

  document.getElementById('btn-guardar').addEventListener('click', async () => {
    const nombre = document.getElementById('f-nombre').value.trim();
    const pin = document.getElementById('f-pin').value.trim();
    const errEl = document.getElementById('form-error');
    errEl.classList.add('hidden');

    if (!nombre || !pin) {
      errEl.textContent = 'Nombre y PIN son requeridos';
      errEl.classList.remove('hidden');
      return;
    }

    try {
      const url = cliente ? `/api/admin/clientes/${cliente.id}` : '/api/admin/clientes';
      const method = cliente ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ nombre, pin }),
      });
      if (!res.ok) throw new Error();
      wrap.innerHTML = '';
      const clientes = await fetchClientes();
      document.getElementById('admin-tbody').innerHTML = renderRows(clientes);
      bindTableActions();
    } catch {
      errEl.textContent = 'Error al guardar. Intentá de nuevo.';
      errEl.classList.remove('hidden');
    }
  });
}

function bindTableActions() {
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const tr = btn.closest('tr');
      showForm({ id: tr.dataset.id, nombre: tr.dataset.nombre, pin: tr.dataset.pin });
    });
  });

  document.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este comercio y todos sus datos?')) return;
      await fetch(`/api/admin/clientes/${btn.dataset.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      const clientes = await fetchClientes();
      document.getElementById('admin-tbody').innerHTML = renderRows(clientes);
      bindTableActions();
    });
  });
}

async function fetchClientes() {
  const res = await fetch('/api/admin/clientes', {
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  return res.ok ? res.json() : [];
}
