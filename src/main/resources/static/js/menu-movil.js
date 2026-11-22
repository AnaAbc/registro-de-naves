/** Navigation enhancement only. No changes to registration/authentication workflows. */
(() => {
  'use strict';
  const root = document.body;
  const button = document.getElementById('mobile-menu-button');
  const nav = document.getElementById('landing-nav');
  if (!root || !button || !nav) return;

  root.classList.add('nav-ready');
  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Abrir menú de navegación');
    nav.removeAttribute('data-open');
  };
  const openMenu = () => {
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Cerrar menú de navegación');
    nav.setAttribute('data-open', 'true');
  };

  button.addEventListener('click', () => {
    if (button.getAttribute('aria-expanded') === 'true') closeMenu();
    else openMenu();
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      button.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!button.contains(event.target) && !nav.contains(event.target)) closeMenu();
  });
  const breakpoint = window.matchMedia('(min-width: 768px)');
  const onBreakpointChange = () => closeMenu();
  if (breakpoint.addEventListener) breakpoint.addEventListener('change', onBreakpointChange);
  else breakpoint.addListener(onBreakpointChange);
})();
