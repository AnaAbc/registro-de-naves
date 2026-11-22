/* HU-10: filtros, conteos y expedientes del agente. Separado del registro. */

// ---------------------------------------------------------------
// Lista de naves propias, con el filtro de HU-10
// ---------------------------------------------------------------

/** Estado elegido en los chips; '' es "Todas". */
let filtroEstado = '';
let conteo = null;          // ultima respuesta de /api/naves/conteo-por-estado
let consultaNaves = 0;      // para descartar respuestas viejas si se pulsa rapido

async function cargarConteo() {
  try {
    const { ok, datos } = await api('/api/naves/conteo-por-estado');
    conteo = ok ? datos : null;
  } catch (e) {
    conteo = null;
  }
  pintarChips();
}

function pintarChips() {
  const caja = $('filtro-estado');
  if (!conteo || !conteo.estados) {
    caja.innerHTML = '';
    return;
  }
  const opciones = [['', 'Todas', conteo.total]].concat(
    Object.keys(NOMBRE_ESTADO_TRAMITE).map(e =>
      [e, NOMBRE_ESTADO_TRAMITE[e], conteo.estados[e] || 0]));

  caja.innerHTML = opciones.map(([estado, nombre, cantidad]) => `
    <button type="button" class="chip" data-estado="${estado}"
            aria-pressed="${estado === filtroEstado ? 'true' : 'false'}">
      ${escapar(nombre)} <span class="cifra">${cantidad}</span>
    </button>`).join('');
}

$('filtro-estado').addEventListener('click', async (e) => {
  const chip = e.target.closest('button[data-estado]');
  if (!chip || chip.dataset.estado === filtroEstado) return;
  filtroEstado = chip.dataset.estado;
  pintarChips();
  await cargarNaves();
});

async function cargarNaves() {
  const cuerpo = $('lista-naves');
  const sinResultados = $('sin-resultados');
  const caja = $('caja-lista-naves');
  const esta = ++consultaNaves;

  const ruta = filtroEstado
    ? '/api/naves?estado=' + encodeURIComponent(filtroEstado)
    : '/api/naves';

  try {
    const { ok, datos } = await api(ruta);
    if (esta !== consultaNaves) return;   // llego tarde: ya se pidio otro filtro

    sinResultados.classList.add('oculto');
    caja.classList.remove('oculto');

    if (!ok || !Array.isArray(datos)) {
      cuerpo.innerHTML = '<tr><td colspan="6">' + escapar((datos && datos.mensaje)
        || 'No se pudo cargar el registro.') + '</td></tr>';
      return;
    }

    if (datos.length === 0) {
      // HU-10: sin resultados se dice, en vez de dejar una tabla vacia.
      caja.classList.add('oculto');
      sinResultados.textContent = filtroEstado
        ? 'No tiene naves con el trámite en «' + NOMBRE_ESTADO_TRAMITE[filtroEstado]
          + '». Elija otro estado o «Todas».'
        : 'Todavía no ha registrado naves.';
      sinResultados.classList.remove('oculto');
      return;
    }

    cuerpo.innerHTML = datos.map(n => `
      <tr>
        <td>${escapar(n.nombre)}</td>
        <td>${escapar(n.tipo)}</td>
        <td class="cifra">${n.tonelajeBruto}</td>
        <td><span class="estado-etiqueta" data-estado="${escapar(n.estado)}">${escapar(n.estado)}</span></td>
        <td>${etiquetaTramite(n.estadoTramite)}</td>
        <td><a class="enlace-fila" href="/expediente.html?naveId=${n.id}">Abrir</a></td>
      </tr>`).join('');
  } catch (e) { /* api() ya redirigio si fue 401 */ }
}

pintarSesion();
cargarConteo();
cargarNaves();
