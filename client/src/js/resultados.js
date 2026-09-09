// resultados.js — Estado de Resultados (P&L)
import { api, getCliente, fmt } from './api.js';

export async function renderResultados(container) {
  const { id: clienteId } = getCliente();
  container.innerHTML = `<p class="loading">Cargando...</p>`;

  const [txs, cats] = await Promise.all([
    api(`/api/tesoreria/tx?clienteId=${clienteId}`),
    api(`/api/categorias?clienteId=${clienteId}`),
  ]);

  const meses = [...new Set(txs.map(t => t.fecha?.slice(0, 7)))].sort().reverse();
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  let mesSeleccionado = meses[0] || mesActual;
  let vista = 'mensual';

  function calcPL(filteredTx) {
    const ingresos = filteredTx.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0);
    const gastos   = filteredTx.filter(t => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0);
    const resultado = ingresos - gastos;

    // Por grupo contable
    const grupos = { COGS: 0, FIJO: 0, VARIABLE: 0, FINANCIERO: 0, IMPUESTOS: 0 };
    filteredTx.filter(t => t.tipo === 'gasto').forEach(t => {
      const cat = cats.find(c => c.id === t.categoria_id);
      if (cat && grupos[cat.grupo] !== undefined) grupos[cat.grupo] += Number(t.monto);
    });

    return { ingresos, gastos, resultado, grupos };
  }

  function renderVista() {
    let txFiltradas;
    if (vista === 'mensual') {
      txFiltradas = txs.filter(t => t.fecha?.slice(0, 7) === mesSeleccionado);
    } else if (vista === 'acumulado') {
      const año = mesSeleccionado.slice(0, 4);
      txFiltradas = txs.filter(t => t.fecha?.slice(0, 4) === año);
    } else {
      txFiltradas = txs;
    }

    const { ingresos, gastos, resultado, grupos } = calcPL(txFiltradas);
    const positivo = resultado >= 0;

    container.innerHTML = `
      <div class="modulo-header">
        <h3>📊 Estado de Resultados</h3>
        <div class="toolbar">
          <div class="btn-group">
            <button class="btn-tab ${vista === 'mensual' ? 'active' : ''}" data-v="mensual">Mensual</button>
            <button class="btn-tab ${vista === 'acumulado' ? 'active' : ''}" data-v="acumulado">Acumulado</button>
            <button class="btn-tab ${vista === 'historico' ? 'active' : ''}" data-v="historico">Histórico</button>
          </div>
          ${vista !== 'historico' ? `
          <select id="sel-mes">
            ${meses.map(m => `<option value="${m}" ${m === mesSeleccionado ? 'selected' : ''}>${m}</option>`).join('')}
          </select>` : ''}
        </div>
      </div>

      <div class="pl-cards">
        <div class="pl-card ingreso">
          <span class="pl-label">Ingresos</span>
          <span class="pl-valor">${fmt(ingresos)}</span>
        </div>
        <div class="pl-card gasto">
          <span class="pl-label">Gastos</span>
          <span class="pl-valor">${fmt(gastos)}</span>
        </div>
        <div class="pl-card resultado ${positivo ? 'pos' : 'neg'}">
          <span class="pl-label">Resultado</span>
          <span class="pl-valor">${fmt(resultado)}</span>
        </div>
      </div>

      <div class="pl-detalle">
        <h4>Detalle por categoría contable</h4>
        <table class="data-table">
          <thead><tr><th>Grupo</th><th>Descripción</th><th class="num">Monto</th></tr></thead>
          <tbody>
            <tr class="row-section"><td colspan="3">INGRESOS</td></tr>
            <tr><td>—</td><td>Ventas y otros ingresos</td><td class="num">${fmt(ingresos)}</td></tr>
            <tr class="row-section"><td colspan="3">GASTOS</td></tr>
            <tr><td>COGS</td><td>Costo de mercadería vendida</td><td class="num">${fmt(grupos.COGS)}</td></tr>
            <tr><td>FIJO</td><td>Gastos fijos (alquiler, servicios)</td><td class="num">${fmt(grupos.FIJO)}</td></tr>
            <tr><td>VARIABLE</td><td>Gastos variables</td><td class="num">${fmt(grupos.VARIABLE)}</td></tr>
            <tr><td>FINANCIERO</td><td>Gastos financieros</td><td class="num">${fmt(grupos.FINANCIERO)}</td></tr>
            <tr><td>IMPUESTOS</td><td>Impuestos y tasas</td><td class="num">${fmt(grupos.IMPUESTOS)}</td></tr>
            <tr class="row-total ${positivo ? 'pos' : 'neg'}">
              <td colspan="2"><strong>RESULTADO NETO</strong></td>
              <td class="num"><strong>${fmt(resultado)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pl-detalle" style="margin-top:1.5rem">
        <h4>Últimas transacciones</h4>
        <table class="data-table">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th class="num">Monto</th></tr></thead>
          <tbody>
            ${txFiltradas.slice(0, 20).map(t => `
              <tr>
                <td>${t.fecha}</td>
                <td><span class="badge ${t.tipo}">${t.tipo}</span></td>
                <td>${t.descripcion || '—'}</td>
                <td class="num ${t.tipo}">${fmt(t.monto)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" class="empty">Sin movimientos</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.btn-tab').forEach(b => {
      b.addEventListener('click', () => { vista = b.dataset.v; renderVista(); });
    });
    container.querySelector('#sel-mes')?.addEventListener('change', e => {
      mesSeleccionado = e.target.value; renderVista();
    });
  }

  renderVista();
}
