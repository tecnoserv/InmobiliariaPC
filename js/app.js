// JS principal para cargar y filtrar propiedades (JSON)
const state = {
  propiedades: [],
  filtros: { q: '', operacion: '', tipo: '', precioMin: null, precioMax: null }
};



const $ = (sel, scope=document) => scope.querySelector(sel);
const $$ = (sel, scope=document) => Array.from(scope.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', async () => {
  // Año en footer
  $('#anio').textContent = new Date().getFullYear();

  // Toggle menú móvil
  const navToggle = $('.nav-toggle');
  const navList = $('.nav-list');
  navToggle?.addEventListener('click', () => {
    const open = navList.classList.toggle('show');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  

  // Cargar propiedades desde JSON
  try {
    const res = await fetch('data/propiedades.json');
    state.propiedades = await res.json();
    renderDestacadas(state.propiedades);
  } catch (e) {
    console.error('No se pudo cargar propiedades.json. Si estás abriendo el archivo localmente, usá un servidor local (por ej. VSCode Live Server).', e);
  }

  // Buscador
  $('#buscador')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    leerFiltros();
    aplicarFiltrosYRender();
    document.getElementById('listado')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Links del menú (Ventas/Alquiler/Temporario)
  $$('.link-op').forEach(link => {
    link.addEventListener('click', (ev) => {
      const op = ev.currentTarget.getAttribute('data-op');
      limpiarBuscador();
      state.filtros.operacion = op;
      aplicarFiltrosYRender();
    });
  });
});

function leerFiltros() {
  state.filtros.q = $('#q')?.value.trim().toLowerCase() || '';
  state.filtros.operacion = $('#operacion')?.value || '';
  state.filtros.tipo = $('#tipo')?.value || '';
  const min = parseInt($('#precioMin')?.value || '', 10);
  const max = parseInt($('#precioMax')?.value || '', 10);
  state.filtros.precioMin = Number.isFinite(min) ? min : null;
  state.filtros.precioMax = Number.isFinite(max) ? max : null;
}

function limpiarBuscador() {
  $('#q').value = '';
  $('#operacion').value = '';
  $('#tipo').value = '';
  $('#precioMin').value = '';
  $('#precioMax').value = '';
}

function aplicarFiltrosYRender() {
  const { q, operacion, tipo, precioMin, precioMax } = state.filtros;
  let lista = state.propiedades.slice();

  if (operacion) lista = lista.filter(p => p.operacion === operacion);
  if (tipo) lista = lista.filter(p => p.tipo === tipo);
  if (q) {
    lista = lista.filter(p => {
      const hay = (p.titulo + ' ' + p.descripcion + ' ' + p.barrio + ' ' + (p.direccion||'')).toLowerCase();
      return hay.includes(q);
    });
  }
  if (precioMin != null) lista = lista.filter(p => p.precio >= precioMin);
  if (precioMax != null) lista = lista.filter(p => p.precio <= precioMax);

  renderResultados(lista);
}

function renderDestacadas(arr) {
  const cont = document.getElementById('gridDestacadas');
  if (!cont) return;
  const destacadas = arr.filter(p => p.destacada).slice(0, 6);
  cont.innerHTML = destacadas.map(cardPropiedad).join('');
}

function renderResultados(arr) {
  const grid = document.getElementById('gridResultados');
  const contador = document.getElementById('contadorResultados');
  if (!grid) return;
  contador.textContent = arr.length ? `${arr.length} resultado(s)` : 'Sin resultados para los filtros aplicados.';
  grid.innerHTML = arr.map(cardPropiedad).join('');
}

function cardPropiedad(p) {
  const img = (p.imagenes && p.imagenes[0]) || 'https://placehold.co/800x600?text=Propiedad';
  const moneda = p.moneda || '$';
  const precioFmt = new Intl.NumberFormat('es-AR').format(p.precio);
  const amb = p.ambientes ? `<span class="badge">${p.ambientes} amb</span>` : '';
  const dorm = p.dormitorios ? `<span class="badge">${p.dormitorios} dorm</span>` : '';
  const sup = p.superficie ? `<span class="badge">${p.superficie} m²</span>` : '';

  return `
    <article class="card">
      <img class="thumb" src="${img}" alt="${escapeHtml(p.titulo)}">
      <div class="body">
        <h3 class="title">${escapeHtml(p.titulo)}</h3>
        <div class="meta">${escapeHtml((p.barrio || '') + (p.direccion ? ' · ' + p.direccion : ''))}</div>
        <div class="meta"><span class="badge">${p.tipo}</span><span class="badge">${p.operacion}</span>${amb}${dorm}${sup}</div>
        <div class="price">${moneda} ${precioFmt}</div>
      </div>
    </article>
  `;
}

// util para evitar XSS si un día se nutre desde un backend
function escapeHtml(str='') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


(() => {
  const panel  = document.getElementById('subheader') || document.querySelector('.sub-header');
  const toggle = document.querySelector('.subheader-toggle');                 // la flecha
  const logo   = document.querySelector('.header-logo a, .header-logo, .brand'); // tu logo (ajusta si tu selector es otro)

  if (!panel || (!toggle && !logo)) return;

  function setOpen(open){
    panel.classList.toggle('is-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function togglePanel(e){
    if (e) e.preventDefault();   // evita navegar si el logo es <a>
    setOpen(!panel.classList.contains('is-open'));
  }

  // Click en la flecha (ya lo tenías, pero lo dejamos unificado)
  if (toggle) toggle.addEventListener('click', togglePanel);

  // Click en el logo: hace lo mismo que la flecha
  if (logo)   logo.addEventListener('click', togglePanel);

  // Cerrar al hacer click fuera
  /*document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !toggle?.contains(e.target) && !logo?.contains(e.target)) {
      setOpen(false);
    }
  });*/

  // Escape para cerrar
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
})();

const items = document.querySelectorAll('.has-submenu');
  items.forEach(li => {
    const toggle = li.querySelector('.submenu-toggle');
    const submenu = li.querySelector('.submenu');
    if (!toggle || !submenu) return;

    // Asegurá que el botón no “envíe” formularios si los hubiera
    if (!toggle.hasAttribute('type')) toggle.setAttribute('type', 'button');

      const setOpen = (open) => {
        li.classList.toggle('open', open ?? !li.classList.contains('open'));
        toggle.setAttribute('aria-expanded', li.classList.contains('open'));
      };
  
      toggle.addEventListener('click', () => setOpen());
    });