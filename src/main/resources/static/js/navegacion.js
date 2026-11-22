/* Menú único según el rol confirmado por el servidor. No otorga permisos:
   las comprobaciones de autorización siguen siendo del backend. */
(() => {
  'use strict';
  const nav = document.getElementById('app-navegacion');
  const boton = document.getElementById('app-menu-boton');
  if (!nav || !boton) return;

  const enlacesPorRol = Object.freeze({
    AGENTE_NAVIERO: [
      ['Registrar nave', '/naves.html'],
      ['Mis naves', '/mis-naves.html'],
      ['Requisitos', '/guia-requisitos.html'],
      ['Patentes', '/patentes.html']
    ],
    FUNCIONARIO_DGMM: [
      ['Bandeja de trámites', '/bandeja.html'],
      ['Patentes', '/patentes.html'],
      ['Reportes', '/reportes.html'],
      ['Verificar patente', '/verificar-patente.html']
    ],
    AUDITOR: [
      ['Expedientes', '/bandeja.html'],
      ['Patentes', '/patentes.html'],
      ['Reportes', '/reportes.html']
    ],
    ADMINISTRADOR: [
      ['Usuarios', '/admin-usuarios.html']
    ]
  });
  const enlacesPublicos = [
    ['Inicio', '/'],
    ['Iniciar sesión', '/login.html']
  ];

  function estaActivo(href) {
    const destino = new URL(href, window.location.origin);
    if (destino.pathname !== window.location.pathname) return false;
    return !destino.hash || destino.hash === window.location.hash;
  }

  function pintar(enlaces) {
    nav.replaceChildren();
    for (const [texto, href] of enlaces) {
      const a = document.createElement('a');
      a.textContent = texto;
      a.href = href;
      if (estaActivo(href)) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    }
    nav.removeAttribute('aria-busy');
  }

  const cerrar = () => {
    nav.classList.remove('is-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir menú de navegación');
  };
  boton.addEventListener('click', () => {
    const abrir = boton.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-abierto', abrir);
    boton.setAttribute('aria-expanded', String(abrir));
    boton.setAttribute('aria-label', abrir ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) cerrar(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') { cerrar(); boton.focus(); }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !boton.contains(event.target)) cerrar();
  });
  window.addEventListener('hashchange', () => {
    nav.querySelectorAll('a').forEach(a => {
      if (estaActivo(a.getAttribute('href'))) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 1300) cerrar(); });

  async function iniciar() {
    const tieneSesionVisible = Boolean(document.getElementById('sesion'));
    const esVerificadorDGMM = document.body?.dataset?.navegacionSesion === 'dgmm';
    if (!tieneSesionVisible && !esVerificadorDGMM) { pintar(enlacesPublicos); return; }
    nav.setAttribute('aria-busy', 'true');
    try {
      const respuesta = await fetch('/api/auth/sesion', { credentials: 'same-origin', cache: 'no-store' });
      if (!respuesta.ok) { pintar(enlacesPublicos); return; }
      const sesion = await respuesta.json();
      if (sesion.autenticado && Object.hasOwn(enlacesPorRol, sesion.rol)) {
        pintar(enlacesPorRol[sesion.rol]);
        const regresoExpediente = document.getElementById('volver-expediente');
        if (regresoExpediente) {
          const esAgente = sesion.rol === 'AGENTE_NAVIERO';
          regresoExpediente.href = esAgente ? '/mis-naves.html' :
            sesion.rol === 'ADMINISTRADOR' ? '/admin-usuarios.html' : '/bandeja.html';
          const etiqueta = document.getElementById('volver-expediente-etiqueta');
          if (etiqueta) etiqueta.textContent = esAgente ? 'Mis naves' :
            sesion.rol === 'ADMINISTRADOR' ? 'Usuarios' : 'Bandeja de trámites';
        }
      } else pintar(enlacesPublicos);
    } catch (_) {
      pintar(enlacesPublicos);
    }
  }
  iniciar();
})();
