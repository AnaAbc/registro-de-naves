const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const codigo = fs.readFileSync('src/main/resources/static/js/navegacion.js', 'utf8');

function entorno(rol, pathname = '/naves.html', options = {}) {
  const eventos = {};
  const listeners = {};
  const clases = new Set();
  const nav = {
    children: [], attributes: {},
    classList: {
      add: v => clases.add(v), remove: v => clases.delete(v),
      toggle: (v, activo) => activo ? clases.add(v) : clases.delete(v),
      contains: v => clases.has(v)
    },
    replaceChildren() { this.children.length = 0; },
    appendChild(v) { this.children.push(v); },
    setAttribute(k, v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(k, fn) { eventos[k] = fn; },
    contains() { return false; },
    querySelectorAll() { return this.children; }
  };
  const boton = {
    attributes: {},
    addEventListener(k, fn) { listeners[k] = fn; },
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    focus() {}, contains() { return false; }
  };
  const volver = { href:'', hidden:true };
  const document = {
    body: {dataset: options.verificador ? {navegacionSesion:'dgmm'} : {}},
    referrer: options.referrer || '',
    getElementById: id => ({'app-navegacion': nav,'app-menu-boton':boton,
      'sesion': options.verificador ? null : {},
      'volver-verificador': options.verificador ? volver : null})[id] || null,
    createElement: () => ({ attributes:{}, setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},getAttribute(k){return this.attributes[k];} }),
    addEventListener() {}
  };
  const window = {
    location: { origin:'http://localhost:8080', pathname, hash:'' },
    innerWidth: 1400, addEventListener() {}
  };
  const ctx = vm.createContext({document,window,URL,
    fetch: async () => ({ok:true,json:async()=>({autenticado:!!rol,rol})})});
  vm.runInContext(codigo,ctx);
  return {nav,boton,volver,eventos,listeners,listo:()=>new Promise(setImmediate)};
}

test('el agente ve registro, requisitos y patentes, pero no reportes ni administración', async()=>{
  const x=entorno('AGENTE_NAVIERO'); await x.listo();
  const etiquetas=x.nav.children.map(a=>a.textContent);
  assert.deepEqual(etiquetas,['Registrar nave','Mis naves','Requisitos','Patentes']);
  assert.ok(!etiquetas.includes('Reportes'));
});

test('el auditor ve consultas y reportes, nunca controles de registro ni administración', async()=>{
  const x=entorno('AUDITOR','/bandeja.html'); await x.listo();
  assert.deepEqual(x.nav.children.map(a=>a.textContent),['Expedientes','Patentes','Reportes']);
});

test('la navegación móvil abre, cierra y mantiene atributos accesibles', async()=>{
  const x=entorno('ADMINISTRADOR','/admin-usuarios.html'); await x.listo();
  assert.deepEqual(x.nav.children.map(a=>a.textContent),['Usuarios']);
  x.listeners.click();
  assert.equal(x.boton.attributes['aria-expanded'],'true');
  assert.equal(x.nav.classList.contains('is-abierto'),true);
  x.listeners.click();
  assert.equal(x.boton.attributes['aria-expanded'],'false');
  assert.equal(x.nav.classList.contains('is-abierto'),false);
});

test('el verificador DGMM conserva su menú, nombre y cierre de sesión, sin Volver', async()=>{
  const x=entorno('FUNCIONARIO_DGMM','/verificar-patente.html',{verificador:true});
  await x.listo();
  assert.deepEqual(x.nav.children.map(a=>a.textContent),
    ['Bandeja de trámites','Patentes','Reportes','Verificar patente']);
  const html=fs.readFileSync('src/main/resources/static/verificar-patente.html','utf8');
  assert.match(html,/id="sesion"/);
  assert.match(html,/<script>pintarSesion\(\);<\/script>/);
  assert.doesNotMatch(html,/id="volver-verificador"/);
  assert.doesNotMatch(codigo,/configurarRegreso|volver-verificador/);
});

test('la navegación no autenticada omite la verificación reservada a DGMM', async()=>{
  const x=entorno(null,'/verificar-patente.html',{verificador:true});
  await x.listo();
  assert.deepEqual(x.nav.children.map(a=>a.textContent), ['Inicio','Iniciar sesión']);
});

test('el botón de cerrar sesión es rojo, legible y el rol se pinta desde la sesión',()=>{
  const js=fs.readFileSync('src/main/resources/static/js/comun.js','utf8');
  const css=fs.readFileSync('src/main/resources/static/css/navegacion.css','utf8');
  assert.match(js,/Cerrar sesión/);
  assert.match(js,/FUNCIONARIO_DGMM: 'Funcionario DGMM'/);
  assert.match(js,/id="btn-salir"/);
  assert.match(js,/f.action = '\/api\/auth\/logout'/);
  assert.match(css,/\.app-sesion #btn-salir[^}]*background:\s*#fff0f1;[^}]*color:\s*#a82231;/);
});

test('Mis naves es una página independiente y Registrar nave carece del listado',()=>{
  const a=fs.readFileSync('src/main/resources/static/naves.html','utf8');
  const b=fs.readFileSync('src/main/resources/static/mis-naves.html','utf8');
  const c=fs.readFileSync('src/main/resources/static/js/naves.js','utf8');
  const d=fs.readFileSync('src/main/resources/static/js/mis-naves.js','utf8');
  assert.doesNotMatch(a,/id="seccion-mis-naves"|id="filtro-estado"|id="lista-naves"/);
  for (const id of ['seccion-mis-naves','filtro-estado','lista-naves','caja-lista-naves'])
    assert.match(b,new RegExp('id="'+id+'"'));
  assert.doesNotMatch(c,/cargarNaves\(/);
  assert.match(d,/cargarNaves\(\)/);
  assert.match(codigo,/\['Mis naves', '\/mis-naves.html'\]/);
});


test('DGMM es el único rol con el enlace de verificación',async()=>{
  for (const rol of ['AGENTE_NAVIERO','AUDITOR','ADMINISTRADOR',null]) {
    const x=entorno(rol); await x.listo();
    assert.ok(!x.nav.children.some(a=>a.textContent==='Verificar patente'),String(rol));
  }
  const x=entorno('FUNCIONARIO_DGMM','/bandeja.html'); await x.listo();
  assert.ok(x.nav.children.some(a=>a.textContent==='Verificar patente'));
});

test('portada: sin accesos redundantes en la barra; Crear cuenta solo en el hero y login',()=>{
 const portada=fs.readFileSync('src/main/resources/static/index.html','utf8');
 const login=fs.readFileSync('src/main/resources/static/login.html','utf8');
 const header=portada.match(/<header[\s\S]*?<\/header>/)?.[0];
 assert.ok(header);
 assert.doesNotMatch(portada, /href="\/verificar-patente\.html"/);
 assert.doesNotMatch(header, /href="\/registro-usuario\.html"/);
 assert.match(portada, /class="hero-actions"[\s\S]*?href="\/registro-usuario\.html"/);
 assert.match(portada, /href="\/login\.html"/);
 assert.match(login, /href="\/registro-usuario\.html"/);
});

test('verificador DGMM: sin aviso redundante, con espacio entre campo y botón',()=>{
 const html=fs.readFileSync('src/main/resources/static/verificar-patente.html','utf8');
 const css=fs.readFileSync('src/main/resources/static/css/verificador.css','utf8');
 assert.match(html, /class="pagina-verificacion"/);
 assert.doesNotMatch(html, /Esta consulta confirma únicamente la existencia/);
 assert.match(html, /class="fila verificador-campos"/);
 assert.match(html, /href="\/css\/verificador\.css"/);
 assert.match(css, /\.verificador-campos\s*\{[^}]*gap:\s*16px/);
 assert.match(css, /grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
 assert.match(html, /id="verificacion-datos"/);
});

test('las descripciones forman parte de las tarjetas de encabezado',()=>{
 const pages=['admin-usuarios','bandeja','expediente','guia-requisitos','mis-naves','naves','patente-provisional','patentes','reportes','verificar-patente'];
 for(const page of pages) {
  const html=fs.readFileSync(`src/main/resources/static/${page}.html`,'utf8');
  const card=html.match(/<section class="encabezado-pagina"[\s\S]*?<\/section>/)?.[0];
  assert.ok(card,page);
  assert.match(card,/<div class="encabezado-pagina__tarjeta">[\s\S]*?<p class="sumario">[\s\S]*?<\/p>[\s\S]*?<\/div>/, page);
 }
});
