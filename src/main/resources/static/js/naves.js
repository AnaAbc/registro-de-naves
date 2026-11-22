/* Navecitas — pantalla de registro de nave.
   HU-03 (registro) con la compuerta de HU-04 (disponibilidad de nombre).

   Sprint 3: el formulario ya no pide propietario ni agente residente.
   Esos se agregan despues, desde el expediente de la nave. */

const campoNombre  = $('nombre');
const veredicto    = $('veredicto');
const btnConsultar = $('btn-consultar');
const camposNave   = $('campos-nave');
const formNave     = $('form-nave');
const avisoForm    = $('aviso-form');
const resultado    = $('resultado');

let nombreAprobado = null;   // ultimo nombre confirmado como disponible

// ---------------------------------------------------------------
// HU-04 — consulta de disponibilidad
// ---------------------------------------------------------------
async function consultarDisponibilidad() {
  const nombre = campoNombre.value;

  btnConsultar.disabled = true;
  mostrar(veredicto, 'neutro', 'Consultando el registro...');

  try {
    const { ok, datos } = await api(
      '/api/naves/disponibilidad?nombre=' + encodeURIComponent(nombre));

    if (!ok) {
      cerrarCompuerta((datos && datos.mensaje) || 'No se pudo consultar el nombre.');
      return;
    }

    if (datos.disponible) {
      nombreAprobado = nombre;
      camposNave.disabled = false;
      mostrar(veredicto, 'libre', datos.mensaje);
    } else {
      cerrarCompuerta(datos.mensaje);
    }
  } catch (e) {
    if (e.message !== 'sin sesion') {
      cerrarCompuerta('No se pudo contactar el servidor. Intente de nuevo.');
    }
  } finally {
    btnConsultar.disabled = false;
  }
}

function cerrarCompuerta(mensaje) {
  nombreAprobado = null;
  camposNave.disabled = true;
  mostrar(veredicto, 'ocupado', mensaje);
}

// Si el usuario edita el nombre despues de aprobarlo, la compuerta se cierra:
// no debe poder guardar con un nombre que nunca se consulto.
campoNombre.addEventListener('input', () => {
  if (nombreAprobado !== null && campoNombre.value !== nombreAprobado) {
    nombreAprobado = null;
    camposNave.disabled = true;
    mostrar(veredicto, 'neutro', 'El nombre cambió. Consulte la disponibilidad otra vez.');
  }
});

campoNombre.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); consultarDisponibilidad(); }
});

btnConsultar.addEventListener('click', consultarDisponibilidad);

// ---------------------------------------------------------------
// HU-03 — registro de nave
// ---------------------------------------------------------------
formNave.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarErrores();
  ocultar(avisoForm);

  if (nombreAprobado === null) {
    mostrar(avisoForm, 'ocupado', 'Consulte la disponibilidad del nombre antes de guardar.');
    return;
  }

  const cuerpo = {
    nombre:            campoNombre.value.trim(),
    tipo:              texto('tipo'),
    servicio:          texto('servicio'),
    tonelajeBruto:     numero('tonelajeBruto'),
    tonelajeNeto:      numero('tonelajeNeto'),
    eslora:            numero('eslora'),
    manga:             numero('manga'),
    puntal:            numero('puntal'),
    anioConstruccion:  numero('anioConstruccion'),
    lugarConstruccion: texto('lugarConstruccion'),
    materialCasco:     texto('materialCasco'),
    tipoPropulsion:    texto('tipoPropulsion'),
    potenciaKw:        numero('potenciaKw')
  };

  $('btn-guardar').disabled = true;

  try {
    const { estado, datos } = await api('/api/naves', { metodo: 'POST', cuerpo });

    if (estado === 201) {
      mostrarResultado(datos);
      mostrar(avisoForm, 'libre',
        'La nave quedó guardada y su trámite quedó en Solicitud presentada. '
        + 'Ahora puede vincularle propietarios.');
      camposNave.disabled = true;
      nombreAprobado = null;
      return;
    }

    // 400: validacion de campos. 409: nombre en uso o tonelaje incoherente.
    pintarErrores(datos);
    mostrar(avisoForm, 'ocupado', (datos && datos.mensaje) || 'No se pudo guardar la nave.');

  } catch (err) {
    if (err.message !== 'sin sesion') {
      mostrar(avisoForm, 'ocupado', 'No se pudo contactar el servidor. Intente de nuevo.');
    }
  } finally {
    $('btn-guardar').disabled = false;
  }
});

function mostrarResultado(nave) {
  $('tabla-resultado').innerHTML = `
    <tr><th>Número de registro</th><td class="cifra">${nave.id}</td></tr>
    <tr><th>Nombre</th><td>${escapar(nave.nombre)}</td></tr>
    <tr><th>Tipo y servicio</th><td>${nave.tipo} &middot; ${nave.servicio}</td></tr>
    <tr><th>Tonelaje</th><td class="cifra">${nave.tonelajeBruto} TRB / ${nave.tonelajeNeto} TRN</td></tr>
    <tr><th>Dimensiones</th><td class="cifra">${nave.eslora} &times; ${nave.manga} &times; ${nave.puntal} m</td></tr>
    <tr><th>Estado de la nave</th><td><span class="estado-etiqueta">${escapar(nave.estado)}</span></td></tr>
    <tr><th>Estado del trámite</th><td>${etiquetaTramite(nave.estadoTramite)}</td></tr>`;
  $('enlace-expediente').href = '/expediente.html?naveId=' + nave.id;
  resultado.dataset.visible = 'si';
}

$('btn-limpiar').addEventListener('click', () => {
  formNave.reset();
  campoNombre.value = '';
  nombreAprobado = null;
  camposNave.disabled = true;
  limpiarErrores();
  ocultar(veredicto);
  ocultar(avisoForm);
  delete resultado.dataset.visible;
});


pintarSesion();
