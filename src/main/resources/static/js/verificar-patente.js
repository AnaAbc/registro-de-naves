/* Consulta de emisiones académicas con sesión DGMM. Los permisos se aplican en el backend. */
(() => {
  'use strict';
  const aviso = document.getElementById('verificacion-estado');
  const datosCaja = document.getElementById('verificacion-datos');
  const campo = document.getElementById('codigo-verificacion');
  const formulario = document.getElementById('form-verificar-patente');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let numeroConsulta = 0;

  async function consultar(id) {
    const actual = ++numeroConsulta;
    datosCaja.classList.add('oculto');
    campo.value = id || '';
    if (!id) {
      aviso.textContent = 'Introduce un código para realizar la consulta.';
      return;
    }
    if (!uuid.test(id)) {
      aviso.textContent = 'El código de verificación no tiene un formato válido.';
      return;
    }
    aviso.textContent = 'Consultando el registro…';
    try {
      const url = new URL('/api/verificacion/patentes/' + encodeURIComponent(id), window.location.origin);
      const respuesta = await fetch(url, {
        credentials: 'same-origin', cache: 'no-store', referrerPolicy: 'no-referrer'
      });
      if (actual !== numeroConsulta) return;
      if (respuesta.status === 401 || respuesta.status === 403) {
        aviso.textContent = 'Acceso exclusivo para funcionarios DGMM. Inicia sesión con una cuenta autorizada.';
        return;
      }
      if (respuesta.status === 404) {
        aviso.textContent = 'No se encontró una patente con este identificador. No se puede confirmar su autenticidad.';
        return;
      }
      if (!respuesta.ok) throw new Error('consulta');
      const datos = await respuesta.json();
      if (actual !== numeroConsulta) return;
      document.getElementById('numero').textContent = datos.numero ?? '';
      document.getElementById('emision').textContent = datos.emitidaEn ?? '';
      document.getElementById('estado').textContent = datos.estado ?? '';
      document.getElementById('vigencia').textContent = datos.vigencia ?? '';
      datosCaja.classList.remove('oculto');
      aviso.textContent = 'Emisión encontrada en Navecitas. Compara el número y la fecha con el documento académico.';
    } catch (_) {
      if (actual === numeroConsulta)
        aviso.textContent = 'No fue posible consultar el sistema. Intenta nuevamente; no se ha confirmado la autenticidad.';
    }
  }

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const id = campo.value.trim();
    if (!uuid.test(id)) { consultar(id); return; }
    if (window.location.hash.slice(1) === id) consultar(id);
    else window.location.hash = id;
  });
  window.addEventListener('hashchange', () => consultar(window.location.hash.slice(1)));
  consultar(window.location.hash.slice(1));
})();
