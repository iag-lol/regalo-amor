const state = {
  productos: [],
  carrito: [],
  configEnvios: null,
  imagenBase64: null,
  adminToken: localStorage.getItem('admin-token') || '',
};

const currency = (value = 0) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

const elements = {
  listaProductos: document.getElementById('listaProductos'),
  categoriaFiltro: document.getElementById('categoriaFiltro'),
  searchProducto: document.getElementById('searchProducto'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  checkoutTotal: document.getElementById('checkoutTotal'),
  cartCount: document.getElementById('cartCount'),
  openCheckout: document.getElementById('openCheckout'),
  checkoutOverlay: document.getElementById('checkoutOverlay'),
  closeOverlay: document.getElementById('closeOverlay'),
  clearCart: document.getElementById('clearCart'),
  btnConfirmar: document.getElementById('btnConfirmar'),
  pedidoForm: document.getElementById('pedidoForm'),
  diasEnvio: document.getElementById('diasEnvio'),
  horariosEnvio: document.getElementById('horariosEnvio'),
  comunasList: document.getElementById('comunasList'),
  mensajePersonalizacion: document.getElementById('mensajePersonalizacion'),
  tipoDiseno: document.getElementById('tipoDiseno'),
  imagenPersonalizacion: document.getElementById('imagenPersonalizacion'),
  previewImagen: document.getElementById('previewImagen'),
  puntosCliente: document.getElementById('puntosCliente'),
  adminBtn: document.getElementById('adminBtn'),
  adminModal: document.getElementById('adminModal'),
  closeAdmin: document.getElementById('closeAdmin'),
  adminLogin: document.getElementById('adminLogin'),
  adminPanel: document.getElementById('adminPanel'),
  adminPassword: document.getElementById('adminPassword'),
  adminError: document.getElementById('adminError'),
  adminLoginBtn: document.getElementById('adminLoginBtn'),
  pedidosHoy: document.getElementById('pedidosHoy'),
  stockTabla: document.getElementById('stockTabla'),
  metricas: document.getElementById('metricas'),
  pedidosRecientes: document.getElementById('pedidosRecientes'),
  configEnviosForm: document.getElementById('configEnviosForm'),
  configStatus: document.getElementById('configStatus'),
  siiInfo: document.getElementById('siiInfo'),
  marcarSii: document.getElementById('marcarSii'),
  adminModalContent: document.querySelector('#adminModal .modal-content'),
  floatingCart: document.getElementById('floatingCart'),
  scrollDestacados: document.getElementById('scrollDestacados'),
  refreshAdmin: document.getElementById('refreshAdmin'),
};

const renderProductos = (productos) => {
  elements.listaProductos.innerHTML = '';
  if (!productos.length) {
    elements.listaProductos.innerHTML = '<p>No hay productos disponibles.</p>';
    return;
  }

  productos.forEach((producto) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${producto.imagen_url || 'https://via.placeholder.com/400x300?text=Producto'}" alt="${producto.nombre}" />
      <div>
        <p class="categoria">${producto.categoria || 'Colección'}</p>
        <h3>${producto.nombre}</h3>
        <p>${producto.descripcion || ''}</p>
      </div>
      <p>${currency(producto.precio)}</p>
      <button class="cta" data-producto="${producto.id}">Agregar</button>
    `;
    elements.listaProductos.append(card);
  });
};

const updateCategorias = (productos) => {
  const categorias = Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean)));
  elements.categoriaFiltro.innerHTML = '<option value="">Todas las categorías</option>';
  categorias.forEach((categoria) => {
    const option = document.createElement('option');
    option.value = categoria;
    option.textContent = categoria;
    elements.categoriaFiltro.append(option);
  });
};

const filtrarProductos = () => {
  const termino = elements.searchProducto.value.toLowerCase();
  const categoria = elements.categoriaFiltro.value;
  const filtrados = state.productos.filter((producto) => {
    const coincideCategoria = categoria ? producto.categoria === categoria : true;
    const coincideTexto = producto.nombre.toLowerCase().includes(termino) ||
      (producto.descripcion || '').toLowerCase().includes(termino);
    return coincideCategoria && coincideTexto;
  });
  renderProductos(filtrados);
};

const addToCart = (productoId) => {
  const producto = state.productos.find((p) => String(p.id) === String(productoId));
  if (!producto) return;
  const existing = state.carrito.find((item) => item.productoId === producto.id);
  if (existing) {
    existing.cantidad += 1;
  } else {
    state.carrito.push({
      productoId: producto.id,
      nombre: producto.nombre,
      cantidad: 1,
      precioUnitario: producto.precio,
    });
  }
  renderCart();
};

const updateQuantity = (productoId, delta) => {
  const item = state.carrito.find((i) => String(i.productoId) === String(productoId));
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    state.carrito = state.carrito.filter((i) => i !== item);
  }
  renderCart();
};

const renderCart = () => {
  elements.cartItems.innerHTML = '';
  let total = 0;
  if (!state.carrito.length) {
    elements.cartItems.innerHTML = '<p class="nota">Aún no agregas productos.</p>';
  }

  state.carrito.forEach((item) => {
    total += item.cantidad * item.precioUnitario;
    const row = document.createElement('div');
    row.className = 'cart-line';
    row.innerHTML = `
      <div>
        <strong>${item.nombre}</strong>
        <p>${currency(item.precioUnitario)} x ${item.cantidad}</p>
      </div>
      <div class="cart-actions">
        <button data-action="dec" data-id="${item.productoId}" aria-label="Restar">-</button>
        <button data-action="inc" data-id="${item.productoId}" aria-label="Sumar">+</button>
      </div>
    `;
    elements.cartItems.append(row);
  });

  const totalItems = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  elements.cartTotal.textContent = currency(total);
  if (elements.checkoutTotal) elements.checkoutTotal.textContent = currency(total);
  elements.cartCount.textContent = `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`;
  const disabled = state.carrito.length === 0;
  if (elements.openCheckout) {
    elements.openCheckout.disabled = disabled;
    elements.openCheckout.classList.toggle('disabled', disabled);
  }
};

const loadProductos = async () => {
  try {
    const response = await fetch('/api/productos');
    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Error del servidor:', data.message || 'Error desconocido');
      state.productos = [];
      renderProductos([]);
      updateCategorias([]);
      return;
    }

    const productos = data.productos || [];
    state.productos = productos;
    renderProductos(productos);
    updateCategorias(productos);
  } catch (error) {
    console.error('No se pudieron cargar productos', error);
    state.productos = [];
    renderProductos([]);
    updateCategorias([]);
  }
};

const loadConfigEnvios = async () => {
  try {
    const response = await fetch('/api/config-envios');
    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Error del servidor:', data.message || 'Error desconocido');
      // Configuración por defecto
      state.configEnvios = {
        dias_abiertos: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horarios: ['10:00-13:00', '15:00-19:00'],
        comunas_disponibles: ['Santiago']
      };
      return;
    }

    const config = data.config || data;
    state.configEnvios = config;

    if (elements.diasEnvio && config.dias_abiertos) {
      elements.diasEnvio.innerHTML = config.dias_abiertos
        .map((dia) => `<option value="${dia}">${dia}</option>`)
        .join('');
    }

    if (elements.horariosEnvio && config.horarios) {
      elements.horariosEnvio.innerHTML = config.horarios
        .map((hora) => `<option value="${hora}">${hora}</option>`)
        .join('');
    }

    if (elements.comunasList && config.comunas_disponibles) {
      elements.comunasList.innerHTML = config.comunas_disponibles
        .map((comuna) => `<option value="${comuna}"></option>`)
        .join('');
    }

    populateConfigForm(config);
  } catch (error) {
    console.error('No se pudo obtener config de envíos', error);
  }
};

const collectFormData = () => {
  const formData = new FormData(elements.pedidoForm);
  const payload = Object.fromEntries(formData.entries());
  payload.telefonoEsMismo = formData.get('telefonoEsMismo') === 'on';
  if (payload.telefonoEsMismo) {
    payload.telefonoLlamada = payload.telefonoWsp;
  }
  payload.total = state.carrito.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);
  payload.carrito = state.carrito;
  payload.mensajePersonalizacion = elements.mensajePersonalizacion.value.trim();
  payload.tipoDiseno = elements.tipoDiseno.value;
  payload.imagenBase64 = state.imagenBase64;
  return payload;
};

const submitPedido = async () => {
  if (!state.carrito.length) {
    alert('El carrito está vacío');
    return;
  }

  const payload = collectFormData();
  const required = ['nombre', 'rut', 'email', 'direccion', 'comuna', 'telefonoWsp', 'fechaEnvio', 'horarioEnvio'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) {
    alert('Por favor completa todos los campos requeridos.');
    return;
  }

  elements.btnConfirmar.disabled = true;
  const originalText = elements.btnConfirmar.textContent;
  elements.btnConfirmar.textContent = 'Procesando…';

  try {
    const response = await fetch('/api/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'No se pudo crear el pedido');
    }
    if (data.puntosAcumulados != null) {
      elements.puntosCliente.textContent = `Tus puntos acumulados: ${data.puntosAcumulados}`;
    }
    window.location.href = data.urlPago;
  } catch (error) {
    console.error(error);
    alert(error.message || 'Error en el pago');
  } finally {
    elements.btnConfirmar.disabled = false;
    elements.btnConfirmar.textContent = originalText;
  }
};

const handleImageUpload = () => {
  const file = elements.imagenPersonalizacion.files[0];
  if (!file) {
    state.imagenBase64 = null;
    elements.previewImagen.innerHTML = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    state.imagenBase64 = event.target.result;
    elements.previewImagen.innerHTML = `<img src="${state.imagenBase64}" alt="Preview" />`;
  };
  reader.readAsDataURL(file);
};

const openAdminModal = () => {
  elements.adminModal.classList.add('open');
};

const closeAdminModal = () => {
  elements.adminModal.classList.remove('open');
};

const authenticateAdmin = async (token) => {
  try {
    const response = await fetch('/api/admin/resumen', {
      headers: { 'x-admin-token': token },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de autenticación:', errorData);
      const mensaje = errorData.hint || errorData.message || 'Credenciales inválidas';
      throw new Error(mensaje);
    }

    const data = await response.json();

    // Verificar si hay error de configuración
    if (data.error) {
      console.error('Error del servidor:', data);

      // Mostrar mensaje específico si es problema de Supabase
      if (data.message && data.message.includes('Base de datos no configurada')) {
        throw new Error('⚠️ Supabase no configurado. Ve a Render → Environment y agrega SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
      }

      throw new Error(data.message || data.error);
    }

    state.adminToken = token;
    localStorage.setItem('admin-token', token);
    elements.adminError.textContent = '';
    elements.adminLogin.classList.add('hidden');
    elements.adminPanel.classList.remove('hidden');
    renderAdminResumen(data);
    await loadAdminExtras();
  } catch (error) {
    console.error('Error completo:', error);
    elements.adminError.textContent = error.message;
    throw error;
  }
};

const renderAdminResumen = (data) => {
  elements.pedidosHoy.innerHTML = (data.pedidosHoy || [])
    .map((pedido) => `<li><span>#${pedido.id} • ${new Date(pedido.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span><strong>${pedido.estado}</strong><span>${currency(pedido.total)}</span></li>`)
    .join('') || '<li>No hay pedidos hoy.</li>';

  elements.stockTabla.innerHTML = (data.productos || [])
    .map((producto) => `<tr class="${producto.stock < 5 ? 'low-stock' : ''}"><td>${producto.nombre}</td><td>${producto.stock}</td></tr>`)
    .join('');

  const maxIngresos = Math.max(...(data.metricasUltimos7Dias || []).map((m) => m.ingresos || 0), 1);
  elements.metricas.innerHTML = (data.metricasUltimos7Dias || [])
    .map((metrica) => {
      const altura = (metrica.ingresos || 0) / maxIngresos * 100;
      return `<div class="metric-bar" style="height:${Math.max(10, altura)}%"><span>${new Date(metrica.fecha).toLocaleDateString('es-CL', { weekday: 'short' })}</span></div>`;
    })
    .join('');
};

const loadAdminExtras = async () => {
  await Promise.all([fetchPedidosRecientes(), fetchSiiInfo()]);
};

const fetchPedidosRecientes = async () => {
  try {
    const response = await fetch('/api/admin/pedidos', {
      headers: { 'x-admin-token': state.adminToken },
    });
    const pedidos = await response.json();
    elements.pedidosRecientes.innerHTML = (pedidos || [])
      .map((pedido) => {
        const cliente = pedido.cliente || {};
        const imagenBtn = pedido.imagen_url
          ? `<a href="${pedido.imagen_url}" class="cta secondary" target="_blank">Ver imagen</a>`
          : '';
        return `
          <div class="pedido-card">
            <strong>Pedido #${pedido.id}</strong>
            <span>${cliente.nombre || 'Cliente'}</span>
            <span>Estado: ${pedido.estado}</span>
            <span>Total: ${currency(pedido.total)}</span>
            <span>${pedido.texto_personalizacion || ''}</span>
            ${imagenBtn}
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error('No se pudieron cargar pedidos admin', error);
  }
};

const fetchSiiInfo = async () => {
  try {
    const response = await fetch('/api/admin/sii', {
      headers: { 'x-admin-token': state.adminToken },
    });
    const sii = await response.json();
    elements.siiInfo.innerHTML = `
      <p>Total ventas mes: <strong>${currency(sii.totalVentasMes || 0)}</strong></p>
      <p>Fecha corte: ${sii.fechaCorte}</p>
      <p>Estado: ${sii.estadoPagoImpuestos}</p>
    `;
  } catch (error) {
    console.error('No se pudo obtener SII', error);
  }
};

const populateConfigForm = (config) => {
  if (!elements.configEnviosForm) return;
  elements.configEnviosForm.dias.value = (config.dias_abiertos || []).join(', ');
  elements.configEnviosForm.horarios.value = (config.horarios || []).join(', ');
  elements.configEnviosForm.costo.value = config.costo_base || 0;
  elements.configEnviosForm.comunas.value = (config.comunas_disponibles || []).join(', ');
};

const saveConfigEnvios = async (event) => {
  event.preventDefault();
  if (!state.adminToken) return;
  elements.configStatus.textContent = 'Guardando...';
  const payload = {
    dias_abiertos: elements.configEnviosForm.dias.value.split(',').map((x) => x.trim()).filter(Boolean),
    horarios: elements.configEnviosForm.horarios.value.split(',').map((x) => x.trim()).filter(Boolean),
    costo_base: Number(elements.configEnviosForm.costo.value) || 0,
    comunas_disponibles: elements.configEnviosForm.comunas.value.split(',').map((x) => x.trim()).filter(Boolean),
  };

  try {
    const response = await fetch('/api/admin/config-envios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': state.adminToken,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo guardar');
    elements.configStatus.textContent = 'Configuración guardada';
    populateConfigForm(data.config);
    loadConfigEnvios();
  } catch (error) {
    elements.configStatus.textContent = error.message;
  }
};

const marcarSiiPagado = async () => {
  if (!state.adminToken) return;
  try {
    const response = await fetch('/api/admin/sii/marcar-pagado', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': state.adminToken,
      },
      body: JSON.stringify({ estado: 'pagado' }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al marcar SII');
    fetchSiiInfo();
  } catch (error) {
    alert(error.message);
  }
};

const attachEvents = () => {
  elements.listaProductos.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-producto]');
    if (!button) return;
    addToCart(button.dataset.producto);
  });

  elements.cartItems.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const { id, action } = button.dataset;
    updateQuantity(id, action === 'inc' ? 1 : -1);
  });

  elements.searchProducto.addEventListener('input', filtrarProductos);
  elements.categoriaFiltro.addEventListener('change', filtrarProductos);
  elements.btnConfirmar.addEventListener('click', submitPedido);
  elements.imagenPersonalizacion.addEventListener('change', handleImageUpload);

  if (elements.openCheckout) {
    elements.openCheckout.addEventListener('click', () => {
      if (!state.carrito.length) return;
      elements.checkoutOverlay.classList.add('open');
    });
  }
  if (elements.closeOverlay) {
    elements.closeOverlay.addEventListener('click', () => {
      elements.checkoutOverlay.classList.remove('open');
    });
  }
  if (elements.checkoutOverlay) {
    elements.checkoutOverlay.addEventListener('click', (event) => {
      if (event.target === elements.checkoutOverlay) {
        elements.checkoutOverlay.classList.remove('open');
      }
    });
  }
  if (elements.clearCart) {
    elements.clearCart.addEventListener('click', () => {
      state.carrito = [];
      renderCart();
    });
  }
  if (elements.floatingCart) {
    elements.floatingCart.addEventListener('click', () => {
      if (!state.carrito.length) return;
      elements.checkoutOverlay.classList.add('open');
    });
  }

  elements.adminBtn.addEventListener('click', openAdminModal);
  elements.closeAdmin.addEventListener('click', closeAdminModal);
  elements.adminModal.addEventListener('click', (event) => {
    if (event.target === elements.adminModal) closeAdminModal();
  });
  elements.adminLoginBtn.addEventListener('click', async () => {
    const token = elements.adminPassword.value;
    if (!token) return;
    try {
      await authenticateAdmin(token);
    } catch (error) {
      // handled
    }
  });
  elements.configEnviosForm.addEventListener('submit', saveConfigEnvios);
  elements.marcarSii.addEventListener('click', marcarSiiPagado);
  elements.refreshAdmin?.addEventListener('click', () => {
    if (!state.adminToken) return;
    authenticateAdmin(state.adminToken).catch(() => {});
  });
  elements.pedidoForm.telefonoEsMismo?.addEventListener('change', (event) => {
    if (event.target.checked) {
      elements.pedidoForm.telefonoLlamada.value = elements.pedidoForm.telefonoWsp.value;
    }
  });
  elements.pedidoForm.telefonoWsp?.addEventListener('input', () => {
    if (elements.pedidoForm.telefonoEsMismo.checked) {
      elements.pedidoForm.telefonoLlamada.value = elements.pedidoForm.telefonoWsp.value;
    }
  });
  elements.scrollDestacados?.addEventListener('click', () => {
    document.querySelector('#destacados')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Admin tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Gestión de productos admin
  document.getElementById('btnNuevoProducto')?.addEventListener('click', () => {
    abrirModalProducto();
  });

  document.getElementById('closeProductoModal')?.addEventListener('click', cerrarModalProducto);

  document.getElementById('cancelProducto')?.addEventListener('click', cerrarModalProducto);

  document.getElementById('productoModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'productoModal') {
      cerrarModalProducto();
    }
  });

  document.getElementById('productoForm')?.addEventListener('submit', guardarProducto);

  document.getElementById('productoImagen')?.addEventListener('change', handleProductoImagenChange);

  // Filtros de productos admin
  document.getElementById('adminSearchProducto')?.addEventListener('input', filtrarAdminProductos);
  document.getElementById('adminCategoriaFiltro')?.addEventListener('change', filtrarAdminProductos);
};

const autoLoginAdmin = () => {
  if (!state.adminToken) return;
  authenticateAdmin(state.adminToken).catch(() => {
    localStorage.removeItem('admin-token');
    state.adminToken = '';
    elements.adminLogin.classList.remove('hidden');
    elements.adminPanel.classList.add('hidden');
  });
};

// Admin tabs
const switchTab = (tabName) => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });

  if (tabName === 'productos') {
    loadAdminProductos();
  }
};

// Admin productos
let adminProductos = [];
let productoEnEdicion = null;
let imagenProductoBase64 = null;

const loadAdminProductos = async () => {
  try {
    const response = await fetch('/api/admin/productos', {
      headers: { 'x-admin-token': state.adminToken },
    });
    const data = await response.json();
    adminProductos = data || [];
    renderAdminProductos(adminProductos);
    updateAdminCategorias();
  } catch (error) {
    console.error('Error al cargar productos admin', error);
  }
};

const renderAdminProductos = (productos) => {
  const tbody = document.getElementById('productosTableBody');
  if (!tbody) return;

  tbody.innerHTML = productos.map(producto => `
    <tr>
      <td><img src="${producto.imagen_url || 'https://via.placeholder.com/60'}" alt="${producto.nombre}" /></td>
      <td><strong>${producto.nombre}</strong></td>
      <td>${producto.categoria || 'Sin categoría'}</td>
      <td>${currency(producto.precio)}</td>
      <td>${producto.stock || 0}</td>
      <td>${producto.descuento || 0}%</td>
      <td><span class="producto-estado ${producto.activo ? 'activo' : 'inactivo'}">${producto.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <div class="producto-acciones">
          <button class="btn-editar" data-id="${producto.id}">Editar</button>
          <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => editarProducto(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', () => eliminarProducto(btn.dataset.id));
  });
};

const updateAdminCategorias = () => {
  const categorias = [...new Set(adminProductos.map(p => p.categoria).filter(Boolean))];
  const select = document.getElementById('adminCategoriaFiltro');
  const datalist = document.getElementById('categoriasDatalist');

  if (select) {
    select.innerHTML = '<option value="">Todas las categorías</option>' +
      categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  if (datalist) {
    datalist.innerHTML = categorias.map(cat => `<option value="${cat}"></option>`).join('');
  }
};

const filtrarAdminProductos = () => {
  const search = document.getElementById('adminSearchProducto')?.value.toLowerCase() || '';
  const categoria = document.getElementById('adminCategoriaFiltro')?.value || '';

  const filtrados = adminProductos.filter(producto => {
    const matchSearch = producto.nombre.toLowerCase().includes(search) ||
                       (producto.descripcion || '').toLowerCase().includes(search);
    const matchCategoria = categoria ? producto.categoria === categoria : true;
    return matchSearch && matchCategoria;
  });

  renderAdminProductos(filtrados);
};

const abrirModalProducto = (producto = null) => {
  productoEnEdicion = producto;
  imagenProductoBase64 = null;

  const modal = document.getElementById('productoModal');
  const title = document.getElementById('productoModalTitle');
  const form = document.getElementById('productoForm');

  if (producto) {
    title.textContent = 'Editar producto';
    document.getElementById('productoId').value = producto.id;
    document.getElementById('productoNombre').value = producto.nombre || '';
    document.getElementById('productoCategoria').value = producto.categoria || '';
    document.getElementById('productoPrecio').value = producto.precio || 0;
    document.getElementById('productoStock').value = producto.stock || 0;
    document.getElementById('productoDescuento').value = producto.descuento || 0;
    document.getElementById('productoDescripcion').value = producto.descripcion || '';
    document.getElementById('productoEsCombo').checked = producto.es_combo || false;

    if (producto.imagen_url) {
      document.getElementById('productoImagenPreview').innerHTML =
        `<img src="${producto.imagen_url}" alt="Preview" />`;
    }
  } else {
    title.textContent = 'Nuevo producto';
    form.reset();
    document.getElementById('productoImagenPreview').innerHTML = '';
  }

  modal.classList.add('open');
};

const cerrarModalProducto = () => {
  document.getElementById('productoModal').classList.remove('open');
  productoEnEdicion = null;
  imagenProductoBase64 = null;
  document.getElementById('productoError').textContent = '';
};

const handleProductoImagenChange = () => {
  const file = document.getElementById('productoImagen').files[0];
  if (!file) {
    imagenProductoBase64 = null;
    document.getElementById('productoImagenPreview').innerHTML = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    imagenProductoBase64 = event.target.result;
    document.getElementById('productoImagenPreview').innerHTML =
      `<img src="${imagenProductoBase64}" alt="Preview" />`;
  };
  reader.readAsDataURL(file);
};

const subirImagenProducto = async (base64) => {
  try {
    const response = await fetch('/api/admin/upload-imagen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': state.adminToken,
      },
      body: JSON.stringify({
        imagen_base64: base64,
        nombre_archivo: `producto-${Date.now()}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    return data.url;
  } catch (error) {
    throw error;
  }
};

const guardarProducto = async (event) => {
  event.preventDefault();

  const errorEl = document.getElementById('productoError');
  errorEl.textContent = '';

  try {
    let imagenUrl = productoEnEdicion?.imagen_url || null;

    if (imagenProductoBase64) {
      imagenUrl = await subirImagenProducto(imagenProductoBase64);
    }

    const payload = {
      nombre: document.getElementById('productoNombre').value,
      categoria: document.getElementById('productoCategoria').value,
      precio: parseFloat(document.getElementById('productoPrecio').value),
      stock: parseInt(document.getElementById('productoStock').value) || 0,
      descuento: parseFloat(document.getElementById('productoDescuento').value) || 0,
      descripcion: document.getElementById('productoDescripcion').value,
      es_combo: document.getElementById('productoEsCombo').checked,
      imagen_url: imagenUrl,
    };

    const isEdit = productoEnEdicion !== null;
    const url = isEdit ? `/api/admin/productos/${productoEnEdicion.id}` : '/api/admin/productos';
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': state.adminToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    cerrarModalProducto();
    loadAdminProductos();
    alert(`Producto ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
  } catch (error) {
    errorEl.textContent = error.message || 'Error al guardar el producto';
  }
};

const editarProducto = (id) => {
  const producto = adminProductos.find(p => String(p.id) === String(id));
  if (producto) {
    abrirModalProducto(producto);
  }
};

const eliminarProducto = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este producto?')) return;

  try {
    const response = await fetch(`/api/admin/productos/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': state.adminToken },
    });

    if (!response.ok) throw new Error('Error al eliminar');

    loadAdminProductos();
    alert('Producto eliminado exitosamente');
  } catch (error) {
    alert('Error al eliminar el producto');
  }
};

const init = () => {
  attachEvents();
  loadProductos();
  loadConfigEnvios();
  autoLoginAdmin();
  renderCart();
};

init();
