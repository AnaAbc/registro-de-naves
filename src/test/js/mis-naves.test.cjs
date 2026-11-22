const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync('src/main/resources/static/js/mis-naves.js','utf8');

test('HU-10: Mis naves conserva filtros, conteo y apertura del expediente', async () => {
  const elementos = new Map(), peticiones = [];
  function elemento(id) {
    if (!elementos.has(id)) {
      const clases = new Set(['oculto']);
      elementos.set(id, {
        innerHTML:'', textContent:'', listeners:{}, classList:{
          add:cl=>clases.add(cl), remove:cl=>clases.delete(cl),
          contains:cl=>clases.has(cl)
        }, addEventListener(tipo, fn){this.listeners[tipo]=fn;}
      });
    }
    return elementos.get(id);
  }
  const api=async ruta=> {
    peticiones.push(ruta);
    if (ruta==='/api/naves/conteo-por-estado')
      return {ok:true,datos:{total:1,estados:{SOLICITUD_PRESENTADA:1}}};
    return {ok:true,datos:[{id:4,nombre:'Estrella del Istmo',tipo:'CARGA',tonelajeBruto:18450,
      estado:'REGISTRADA',estadoTramite:'SOLICITUD_PRESENTADA'}]};
  };
  const contexto=vm.createContext({
    $:elemento, api, pintarSesion(){}, escapar: v=>String(v), etiquetaTramite:e=>e,
    NOMBRE_ESTADO_TRAMITE:{SOLICITUD_PRESENTADA:'Solicitud presentada', EN_REVISION:'En revisión'}
  });
  vm.runInContext(script,contexto);
  await new Promise(setImmediate);
  assert.ok(peticiones.includes('/api/naves/conteo-por-estado'));
  assert.ok(peticiones.includes('/api/naves'));
  assert.match(elemento('filtro-estado').innerHTML,/Solicitud presentada/);
  assert.match(elemento('lista-naves').innerHTML,/Estrella del Istmo/);
  assert.match(elemento('lista-naves').innerHTML,/expediente.html\?naveId=4/);
  const accion=elemento('filtro-estado').listeners.click;
  await accion({target:{closest:()=>({dataset:{estado:'SOLICITUD_PRESENTADA'}})}});
  assert.ok(peticiones.includes('/api/naves?estado=SOLICITUD_PRESENTADA'));
});

test('verificación DGMM requiere cookies de sesión en la consulta',()=>{
 const codigo=fs.readFileSync('src/main/resources/static/js/verificar-patente.js','utf8');
 assert.match(codigo,/credentials:\s*'same-origin'/);
 const html=fs.readFileSync('src/main/resources/static/verificar-patente.html','utf8');
 assert.match(html,/data-navegacion-sesion="dgmm"/);
 assert.doesNotMatch(html,/id="volver-verificador"/);
 assert.match(html,/id="sesion"/);
 assert.match(html,/<script>pintarSesion\(\);<\/script>/);
});
