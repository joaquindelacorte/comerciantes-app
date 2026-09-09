// auth.js — pantalla de login por PIN
import { renderAdmin } from './admin.js';
import { renderResultados } from './resultados.js';
import { renderProductos } from './productos.js';
import { renderStock } from './stock.js';
import { renderTesoreria } from './tesoreria.js';
import { renderManufactura } from './manufactura.js';

const MODULOS = {
  resultados: renderResultados,
  productos:  renderProductos,
  stock:      renderStock,
  tesoreria:  renderTesoreria,
  manufactura: renderManufactura,
};

export async function renderLogin() {
  const app = document.getElementById('app');

  // Cargar lista de negocios
  let clientes = [];
  try {
    const res = await fetch('/api/auth/clientes');
    if (res.ok) clientes = await res.json();
  } catch (e) {
    console.error('Error cargando negocios:', e);
  }

  app.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <h1 class="login-title">Comerciantes App</h1>
        <p class="login-sub">Ingresá a tu negocio</p>

        <div class="form-group">
          <label for="negocio">Negocio</label>
          <select id="negocio">
            <option value="">— Seleccioná —</option>
            ${clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="pin">PIN</label>
          <input id="pin" type="password" inputmode="numeric" maxlength="6" placeholder="••••" />
        </div>

        <button id="btn-login" class="btn-primary">Entrar</button>
        <p id="login-error" class="error-msg hidden"></p>
        <button id="btn-admin" class="btn-link">⚙️ Panel de administración</button>
      </div>
    </div>
  `;

  document.getElementById('btn-admin').addEventListener('click', renderAdmin);

  document.getElementById('btn-login').addEventListener('click', async () => {
    const clienteId = document.getElementById('negocio').value;
    const pin = document.getElementById('pin').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');

    if (!clienteId || !pin) {
      errEl.textContent = 'Seleccioná un negocio e ingresá el PIN';
      errEl.classList.remove('hidden');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, pin }),
      });
      if (!res.ok) throw new Error('PIN incorrecto');
      const cliente = await res.json();
      sessionStorage.setItem('cliente', JSON.stringify(cliente));
      renderDashboard(cliente);
    } catch {
      errEl.textContent = 'PIN incorrecto';
      errEl.classList.remove('hidden');
    }
  });
}

function renderDashboard(cliente) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard">
      <header class="dash-header">
        <h2>${cliente.nombre}</h2>
        <button id="btn-logout" class="btn-ghost">Salir</button>
      </header>
      <nav class="dash-nav">
        <button class="nav-btn active" data-modulo="resultados">📊 Resultados</button>
        <button class="nav-btn" data-modulo="productos">📦 Productos</button>
        <button class="nav-btn" data-modulo="stock">🏪 Stock</button>
        <button class="nav-btn" data-modulo="tesoreria">💰 Tesorería</button>
        <button class="nav-btn" data-modulo="manufactura">🔧 Manufactura</button>
      </nav>
      <main id="contenido" class="dash-content">
        <p class="placeholder-msg">Seleccioná un módulo</p>
      </main>
    </div>
  `;

  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.removeItem('cliente');
    renderLogin();
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const contenido = document.getElementById('contenido');
      contenido.innerHTML = `<p class="loading">Cargando...</p>`;
      const fn = MODULOS[btn.dataset.modulo];
      if (fn) await fn(contenido);
      else contenido.innerHTML = `<p class="placeholder-msg">Módulo <strong>${btn.dataset.modulo}</strong> — en construcción</p>`;
    });
  });
}
