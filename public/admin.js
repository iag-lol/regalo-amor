/* ============================================
   ADMIN PANEL - REGALO AMOR
   JavaScript completo con todas las funcionalidades
   ============================================ */

// ============================================
// GLOBAL STATE
// ============================================

let currentSection = 'dashboard';
let pedidosData = [];
let productosData = [];
let estadisticasData = null;

// ============================================
// AUTHENTICATION
// ============================================

const adminPassword = 'admin123'; // Cambiar en producción
let isAuthenticated = false;

// Check if already authenticated
if (localStorage.getItem('adminToken') === adminPassword) {
  isAuthenticated = true;
  showAdminPanel();
} else {
  showLoginScreen();
}

// Login handler
document.getElementById('adminLoginBtn').addEventListener('click', login);
document.getElementById('adminPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});

function login() {
  const password = document.getElementById('adminPassword').value;
  if (password === adminPassword) {
    isAuthenticated = true;
    localStorage.setItem('adminToken', adminPassword);
    showAdminPanel();
    showToast('Sesión iniciada correctamente', 'success');
  } else {
    document.getElementById('adminError').textContent = 'Contraseña incorrecta';
  }
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  isAuthenticated = false;
  showLoginScreen();
  showToast('Sesión cerrada', 'success');
});

function showLoginScreen() {
  document.getElementById('adminLogin').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('adminLogin').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  loadDashboard();
}

// ============================================
// NAVIGATION
// ============================================

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.dataset.section;
    navigateToSection(section);
  });
});

function navigateToSection(section) {
  // Update nav active state
  navItems.forEach(item => {
    if (item.dataset.section === section) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update content sections
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });
  document.getElementById(`section-${section}`).classList.add('active');

  currentSection = section;

  // Load data for section
  switch(section) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'pedidos':
      loadPedidos();
      break;
    case 'productos':
      loadProductos();
      break;
    case 'sii':
      loadSII();
      break;
    case 'config':
      loadConfig();
      break;
  }
}

// ============================================
// DASHBOARD
// ============================================

document.getElementById('refreshDashboard').addEventListener('click', loadDashboard);

async function loadDashboard() {
  try {
    const res = await fetch('/api/admin/estadisticas', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });

    if (!res.ok) throw new Error('Error al cargar estadísticas');

    estadisticasData = await res.json();

    // Update KPIs
    document.getElementById('kpiVentasMes').textContent = formatMoney(estadisticasData.ventasMes);
    document.getElementById('kpiPedidosPagados').textContent = estadisticasData.pedidosPagadosMes || 0;
    document.getElementById('kpiPendientes').textContent = estadisticasData.pedidosPendientes || 0;
    document.getElementById('kpiEnProceso').textContent = estadisticasData.pedidosEnProceso || 0;
    document.getElementById('kpiIVA').textContent = formatMoney(estadisticasData.ivaMes);

    // Render charts
    renderVentasChart(estadisticasData.chartLabels, estadisticasData.chartData);
    renderTopProductos(estadisticasData.topProductos);

  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Error al cargar el dashboard', 'error');
  }
}

// Chart.js - Ventas últimos 30 días
let ventasChart = null;

function renderVentasChart(labels, data) {
  const ctx = document.getElementById('chartVentas');

  if (ventasChart) {
    ventasChart.destroy();
  }

  ventasChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels || [],
      datasets: [{
        label: 'Ventas diarias',
        data: data || [],
        borderColor: '#111827',
        backgroundColor: 'rgba(17, 24, 39, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#111827',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return 'Ventas: $' + context.parsed.y.toLocaleString('es-CL');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString('es-CL');
            }
          },
          grid: {
            color: '#f3f4f6'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Top productos
function renderTopProductos(productos) {
  const container = document.getElementById('topProductos');

  if (!productos || productos.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay datos suficientes</p>';
    return;
  }

  container.innerHTML = productos.map((p, index) => `
    <div class="top-producto-item">
      <div>
        <span style="color: #9ca3af; margin-right: 0.5rem;">${index + 1}.</span>
        <span class="top-producto-name">${p.nombre}</span>
      </div>
      <span class="top-producto-count">${p.cantidad} ventas</span>
    </div>
  `).join('');
}

// ============================================
// PEDIDOS
// ============================================

document.getElementById('refreshPedidos').addEventListener('click', loadPedidos);
document.getElementById('filtroEstadoPedido').addEventListener('change', renderPedidosTable);

async function loadPedidos() {
  try {
    const res = await fetch('/api/admin/pedidos', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });

    if (!res.ok) throw new Error('Error al cargar pedidos');

    const data = await res.json();
    pedidosData = data.pedidos || [];
    renderPedidosTable();

  } catch (error) {
    console.error('Error loading pedidos:', error);
    showToast('Error al cargar pedidos', 'error');
  }
}

function renderPedidosTable() {
  const container = document.getElementById('pedidosTable');
  const filtroEstado = document.getElementById('filtroEstadoPedido').value;

  let pedidosFiltrados = pedidosData;
  if (filtroEstado) {
    pedidosFiltrados = pedidosData.filter(p => p.estado === filtroEstado);
  }

  if (pedidosFiltrados.length === 0) {
    container.innerHTML = '<div class="loading">No hay pedidos para mostrar</div>';
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Fecha</th>
          <th>Total</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${pedidosFiltrados.map(pedido => `
          <tr>
            <td><code>${pedido.id.substring(0, 8)}</code></td>
            <td>
              <div>${pedido.nombre_cliente}</div>
              <div style="font-size: 0.85rem; color: var(--muted);">${pedido.email}</div>
            </td>
            <td>${formatDate(pedido.fecha)}</td>
            <td><strong>${formatMoney(pedido.total)}</strong></td>
            <td>${getBadgeEstado(pedido.estado)}</td>
            <td>
              <div class="table-actions">
                <button class="btn-icon" onclick="verDetallePedido('${pedido.id}')" title="Ver detalle">👁️</button>
                <button class="btn-icon" onclick="cambiarEstadoPedido('${pedido.id}')" title="Cambiar estado">📝</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getBadgeEstado(estado) {
  const badges = {
    'pendiente_pago': '<span class="badge badge-pendiente">Pendiente Pago</span>',
    'pagado': '<span class="badge badge-pagado">Pagado</span>',
    'en_proceso': '<span class="badge badge-proceso">En Proceso</span>',
    'terminado': '<span class="badge badge-terminado">Terminado</span>',
    'enviado': '<span class="badge badge-enviado">Enviado</span>',
    'entregado': '<span class="badge badge-entregado">Entregado</span>',
    'cancelado': '<span class="badge badge-cancelado">Cancelado</span>'
  };
  return badges[estado] || `<span class="badge">${estado}</span>`;
}

// Estados disponibles con info
const ESTADOS_PEDIDO = {
  pendiente_pago: { label: 'Pendiente Pago', icon: '⏳', color: '#f59e0b', next: 'pagado' },
  pagado: { label: 'Pago Confirmado', icon: '✓', color: '#10b981', next: 'en_proceso' },
  en_proceso: { label: 'En Preparación', icon: '🔨', color: '#3b82f6', next: 'terminado' },
  terminado: { label: 'Listo', icon: '✨', color: '#8b5cf6', next: 'enviado' },
  enviado: { label: 'Despachado', icon: '🚚', color: '#6366f1', next: 'entregado' },
  entregado: { label: 'Entregado', icon: '🎉', color: '#059669', next: null },
  cancelado: { label: 'Cancelado', icon: '✗', color: '#ef4444', next: null }
};

// Generar timeline visual del pedido
function generarTimeline(estadoActual) {
  const estados = ['pagado', 'en_proceso', 'terminado', 'enviado', 'entregado'];
  const indexActual = estados.indexOf(estadoActual);

  if (estadoActual === 'pendiente_pago' || estadoActual === 'cancelado') {
    return `<div class="timeline-status ${estadoActual}">${ESTADOS_PEDIDO[estadoActual].icon} ${ESTADOS_PEDIDO[estadoActual].label}</div>`;
  }

  return `
    <div class="order-timeline">
      ${estados.map((estado, index) => {
        const info = ESTADOS_PEDIDO[estado];
        const isCompleted = index <= indexActual;
        const isCurrent = index === indexActual;
        return `
          <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
            <div class="timeline-icon" style="background: ${isCompleted ? info.color : '#e5e7eb'}">${info.icon}</div>
            <span class="timeline-label">${info.label}</span>
          </div>
          ${index < estados.length - 1 ? '<div class="timeline-line ' + (index < indexActual ? 'completed' : '') + '"></div>' : ''}
        `;
      }).join('')}
    </div>
  `;
}

// Ver detalle de pedido (modal flotante) - MEJORADO
async function verDetallePedido(pedidoId) {
  const pedido = pedidosData.find(p => p.id === pedidoId);
  if (!pedido) return;

  const carrito = pedido.carrito_json || [];
  const estadoInfo = ESTADOS_PEDIDO[pedido.estado] || ESTADOS_PEDIDO.pendiente_pago;

  // Formatear teléfono para WhatsApp (quitar espacios y agregar +56)
  const telefonoWhatsApp = pedido.telefono
    ? pedido.telefono.replace(/\s/g, '').replace(/^0/, '').replace(/^\+?56/, '')
    : null;
  const whatsappLink = telefonoWhatsApp ? `https://wa.me/56${telefonoWhatsApp}` : null;

  const modalBody = document.getElementById('pedidoModalBody');
  modalBody.innerHTML = `
    <div class="order-detail-enhanced">
      <!-- Header con ID y Estado -->
      <div class="order-header">
        <div class="order-id">
          <span class="order-id-label">Pedido</span>
          <span class="order-id-value">#${pedido.id.substring(0, 8).toUpperCase()}</span>
        </div>
        <div class="order-status-badge" style="background: ${estadoInfo.color}">
          ${estadoInfo.icon} ${estadoInfo.label}
        </div>
      </div>

      <!-- Timeline Visual -->
      <div class="timeline-container">
        ${generarTimeline(pedido.estado)}
      </div>

      <!-- Grid de información -->
      <div class="order-grid">
        <!-- Cliente -->
        <div class="order-card">
          <div class="order-card-header">
            <h3>👤 Cliente</h3>
            <div class="contact-buttons">
              ${whatsappLink ? `<a href="${whatsappLink}" target="_blank" class="btn-contact whatsapp" title="WhatsApp">💬</a>` : ''}
              <a href="mailto:${pedido.email}" class="btn-contact email" title="Enviar Email">✉️</a>
            </div>
          </div>
          <div class="order-card-body">
            <div class="info-item">
              <span class="info-icon">👤</span>
              <div>
                <span class="info-label">Nombre</span>
                <span class="info-value">${pedido.nombre_cliente}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">✉️</span>
              <div>
                <span class="info-label">Email</span>
                <span class="info-value">${pedido.email}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">📱</span>
              <div>
                <span class="info-label">Teléfono</span>
                <span class="info-value">${pedido.telefono || 'No especificado'}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="info-icon">📍</span>
              <div>
                <span class="info-label">Dirección</span>
                <span class="info-value">${pedido.direccion || 'No especificada'}</span>
              </div>
            </div>
            ${pedido.comuna ? `
              <div class="info-item">
                <span class="info-icon">🏘️</span>
                <div>
                  <span class="info-label">Comuna</span>
                  <span class="info-value">${pedido.comuna}</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Productos -->
        <div class="order-card">
          <div class="order-card-header">
            <h3>📦 Productos</h3>
            <span class="items-count">${carrito.length} item${carrito.length > 1 ? 's' : ''}</span>
          </div>
          <div class="order-card-body">
            <div class="products-list">
              ${carrito.map(item => `
                <div class="product-item">
                  <div class="product-info">
                    <span class="product-name">${item.nombre}</span>
                    <span class="product-qty">x${item.cantidad}</span>
                  </div>
                  <span class="product-price">${formatMoney(item.precio * item.cantidad)}</span>
                </div>
              `).join('')}
            </div>
            <div class="order-total">
              <span>Total</span>
              <strong>${formatMoney(pedido.total)}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Información adicional -->
      <div class="order-extra">
        <div class="extra-item">
          <span class="extra-label">📅 Fecha del pedido</span>
          <span class="extra-value">${formatDate(pedido.fecha)}</span>
        </div>
        ${pedido.fecha_envio ? `
          <div class="extra-item">
            <span class="extra-label">🚚 Fecha de envío</span>
            <span class="extra-value">${pedido.fecha_envio}</span>
          </div>
        ` : ''}
        ${pedido.mensaje ? `
          <div class="extra-item full">
            <span class="extra-label">💬 Mensaje del cliente</span>
            <span class="extra-value message">"${pedido.mensaje}"</span>
          </div>
        ` : ''}
        ${pedido.personalizacion ? `
          <div class="extra-item full">
            <span class="extra-label">✨ Personalización</span>
            <span class="extra-value">${pedido.personalizacion}</span>
          </div>
        ` : ''}
      </div>

      <!-- Acciones -->
      <div class="order-actions">
        <h3>⚡ Acciones</h3>
        <p class="actions-note">Al cambiar el estado, se enviará un email automático al cliente</p>
        <div class="actions-grid">
          ${pedido.estado === 'pendiente_pago' ? `
            <button class="action-btn confirm" onclick="actualizarEstadoConEmail('${pedido.id}', 'pagado')">
              <span class="action-icon">✓</span>
              <span class="action-text">Confirmar Pago</span>
            </button>
          ` : ''}
          ${pedido.estado === 'pagado' ? `
            <button class="action-btn process" onclick="actualizarEstadoConEmail('${pedido.id}', 'en_proceso')">
              <span class="action-icon">🔨</span>
              <span class="action-text">Iniciar Preparación</span>
            </button>
          ` : ''}
          ${pedido.estado === 'en_proceso' ? `
            <button class="action-btn ready" onclick="actualizarEstadoConEmail('${pedido.id}', 'terminado')">
              <span class="action-icon">✨</span>
              <span class="action-text">Marcar como Listo</span>
            </button>
          ` : ''}
          ${pedido.estado === 'terminado' ? `
            <button class="action-btn ship" onclick="actualizarEstadoConEmail('${pedido.id}', 'enviado')">
              <span class="action-icon">🚚</span>
              <span class="action-text">Marcar Despachado</span>
            </button>
          ` : ''}
          ${pedido.estado === 'enviado' ? `
            <button class="action-btn deliver" onclick="actualizarEstadoConEmail('${pedido.id}', 'entregado')">
              <span class="action-icon">🎉</span>
              <span class="action-text">Confirmar Entrega</span>
            </button>
          ` : ''}
          ${pedido.estado !== 'cancelado' && pedido.estado !== 'entregado' ? `
            <button class="action-btn cancel" onclick="actualizarEstadoConEmail('${pedido.id}', 'cancelado')">
              <span class="action-icon">✗</span>
              <span class="action-text">Cancelar Pedido</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  openModal('pedidoModal');
}

// Cambiar estado desde tabla
function cambiarEstadoPedido(pedidoId) {
  verDetallePedido(pedidoId);
}

// Actualizar estado CON envío de email al cliente
async function actualizarEstadoConEmail(pedidoId, nuevoEstado) {
  const pedido = pedidosData.find(p => p.id === pedidoId);
  if (!pedido) return;

  const estadoLabel = ESTADOS_PEDIDO[nuevoEstado]?.label || nuevoEstado;

  // Confirmar acción
  const confirmar = confirm(`¿Cambiar estado a "${estadoLabel}"?\n\nSe enviará un email automático a ${pedido.email}`);
  if (!confirmar) return;

  try {
    // Mostrar loading
    showToast('Actualizando estado y enviando email...', 'success');

    const res = await fetch(`/api/admin/pedidos/${pedidoId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': localStorage.getItem('adminToken')
      },
      body: JSON.stringify({
        estado: nuevoEstado,
        enviarEmail: true
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al actualizar estado');

    if (data.emailEnviado) {
      showToast(`Estado actualizado y email enviado a ${pedido.email}`, 'success');
    } else {
      showToast('Estado actualizado (email no configurado)', 'success');
    }

    closeModal('pedidoModal');
    loadPedidos();
    loadDashboard();

  } catch (error) {
    console.error('Error updating estado:', error);
    showToast('Error al actualizar estado', 'error');
  }
}

// Actualizar estado (sin email - legacy)
async function actualizarEstado(pedidoId, nuevoEstado) {
  try {
    const res = await fetch(`/api/admin/pedidos/${pedidoId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) throw new Error('Error al actualizar estado');

    showToast('Estado actualizado correctamente', 'success');
    closeModal('pedidoModal');
    loadPedidos();
    loadDashboard(); // Actualizar métricas

  } catch (error) {
    console.error('Error updating estado:', error);
    showToast('Error al actualizar estado', 'error');
  }
}

// ============================================
// PRODUCTOS
// ============================================

document.getElementById('btnNuevoProducto').addEventListener('click', () => openProductoModal());
document.getElementById('searchProducto').addEventListener('input', renderProductosTable);
document.getElementById('filtroCategoria').addEventListener('change', renderProductosTable);

async function loadProductos() {
  try {
    const res = await fetch('/api/productos');
    if (!res.ok) throw new Error('Error al cargar productos');

    const data = await res.json();
    productosData = data.productos || [];

    // Llenar categorías únicas
    const categorias = [...new Set(productosData.map(p => p.categoria))];
    const filtroCategoria = document.getElementById('filtroCategoria');
    filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>' +
      categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    // Llenar datalist para autocompletar
    const datalist = document.getElementById('categoriasDatalist');
    datalist.innerHTML = categorias.map(cat => `<option value="${cat}">`).join('');

    renderProductosTable();

  } catch (error) {
    console.error('Error loading productos:', error);
    showToast('Error al cargar productos', 'error');
  }
}

function renderProductosTable() {
  const container = document.getElementById('productosTable');
  const search = document.getElementById('searchProducto').value.toLowerCase();
  const categoria = document.getElementById('filtroCategoria').value;

  let productosFiltrados = productosData.filter(p => p.activo !== false);

  if (search) {
    productosFiltrados = productosFiltrados.filter(p =>
      p.nombre.toLowerCase().includes(search) ||
      (p.categoria && p.categoria.toLowerCase().includes(search))
    );
  }

  if (categoria) {
    productosFiltrados = productosFiltrados.filter(p => p.categoria === categoria);
  }

  if (productosFiltrados.length === 0) {
    container.innerHTML = '<div class="loading">No hay productos para mostrar</div>';
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Descuento</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${productosFiltrados.map(producto => `
          <tr>
            <td>
              ${producto.imagen_url ? `<img src="${producto.imagen_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.5rem;">` : '📦'}
            </td>
            <td>
              <strong>${producto.nombre}</strong>
              ${producto.es_combo ? '<span class="badge" style="background: #dbeafe; color: #1e40af; margin-left: 0.5rem;">Combo</span>' : ''}
            </td>
            <td>${producto.categoria || '-'}</td>
            <td><strong>${formatMoney(producto.precio)}</strong></td>
            <td>${producto.stock || 0}</td>
            <td>${producto.descuento ? producto.descuento + '%' : '-'}</td>
            <td>
              <div class="table-actions">
                <button class="btn-icon" onclick="editarProducto('${producto.id}')" title="Editar">✏️</button>
                <button class="btn-icon" onclick="eliminarProducto('${producto.id}')" title="Eliminar">🗑️</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Modal producto
let editingProductoId = null;

function openProductoModal(productoId = null) {
  editingProductoId = productoId;
  const modal = document.getElementById('productoModal');
  const title = document.getElementById('productoModalTitle');
  const form = document.getElementById('productoForm');

  form.reset();
  document.getElementById('productoError').textContent = '';
  document.getElementById('productoImagenPreview').classList.remove('active');

  // Limpiar campos de descuentos por cantidad
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`descCant${i}Min`).value = '';
    document.getElementById(`descCant${i}Porc`).value = '';
  }

  if (productoId) {
    title.textContent = 'Editar Producto';
    const producto = productosData.find(p => p.id === productoId);
    if (producto) {
      document.getElementById('productoId').value = producto.id;
      document.getElementById('productoNombre').value = producto.nombre;
      document.getElementById('productoCategoria').value = producto.categoria || '';
      document.getElementById('productoPrecio').value = producto.precio;
      document.getElementById('productoStock').value = producto.stock || 0;
      document.getElementById('productoDescuento').value = producto.descuento || 0;
      document.getElementById('productoDescripcion').value = producto.descripcion || '';
      document.getElementById('productoEsCombo').checked = producto.es_combo || false;

      // Cargar descuentos por cantidad
      const descuentosCantidad = producto.descuentos_cantidad || [];
      descuentosCantidad.forEach((desc, index) => {
        if (index < 4) {
          document.getElementById(`descCant${index + 1}Min`).value = desc.cantidad || '';
          document.getElementById(`descCant${index + 1}Porc`).value = desc.porcentaje || '';
        }
      });

      if (producto.imagen_url) {
        const preview = document.getElementById('productoImagenPreview');
        preview.innerHTML = `<img src="${producto.imagen_url}" alt="Preview">`;
        preview.classList.add('active');
      }
    }
  } else {
    title.textContent = 'Nuevo Producto';
    document.getElementById('productoId').value = '';
  }

  openModal('productoModal');
}

function editarProducto(productoId) {
  openProductoModal(productoId);
}

async function eliminarProducto(productoId) {
  if (!confirm('¿Estás seguro de eliminar este producto?')) return;

  try {
    const res = await fetch(`/api/admin/productos/${productoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });

    if (!res.ok) throw new Error('Error al eliminar producto');

    showToast('Producto eliminado correctamente', 'success');
    loadProductos();

  } catch (error) {
    console.error('Error deleting producto:', error);
    showToast('Error al eliminar producto', 'error');
  }
}

// Preview imagen
document.getElementById('productoImagen').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.getElementById('productoImagenPreview');
      preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
      preview.classList.add('active');
    };
    reader.readAsDataURL(file);
  }
});

// Guardar producto
document.getElementById('productoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productoId = document.getElementById('productoId').value;
  const nombre = document.getElementById('productoNombre').value;
  const categoria = document.getElementById('productoCategoria').value;
  const precio = parseInt(document.getElementById('productoPrecio').value);
  const stock = parseInt(document.getElementById('productoStock').value);
  const descuento = parseInt(document.getElementById('productoDescuento').value) || 0;
  const descripcion = document.getElementById('productoDescripcion').value;
  const esCombo = document.getElementById('productoEsCombo').checked;
  const imagenFile = document.getElementById('productoImagen').files[0];

  // Recoger descuentos por cantidad
  const descuentosCantidad = [];
  for (let i = 1; i <= 4; i++) {
    const cantidad = parseInt(document.getElementById(`descCant${i}Min`).value);
    const porcentaje = parseInt(document.getElementById(`descCant${i}Porc`).value);
    if (cantidad > 0 && porcentaje > 0) {
      descuentosCantidad.push({ cantidad, porcentaje });
    }
  }
  // Ordenar por cantidad ascendente
  descuentosCantidad.sort((a, b) => a.cantidad - b.cantidad);

  try {
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('categoria', categoria);
    formData.append('precio', precio);
    formData.append('stock', stock);
    formData.append('descuento', descuento);
    formData.append('descripcion', descripcion);
    formData.append('es_combo', esCombo);
    formData.append('descuentos_cantidad', JSON.stringify(descuentosCantidad));
    if (imagenFile) {
      formData.append('imagen', imagenFile);
    }

    const url = productoId
      ? `/api/admin/productos/${productoId}`
      : '/api/admin/productos';
    const method = productoId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
      body: formData
    });

    if (!res.ok) throw new Error('Error al guardar producto');

    showToast(`Producto ${productoId ? 'actualizado' : 'creado'} correctamente`, 'success');
    closeModal('productoModal');
    loadProductos();

  } catch (error) {
    console.error('Error saving producto:', error);
    document.getElementById('productoError').textContent = 'Error al guardar el producto';
  }
});

document.getElementById('cancelProducto').addEventListener('click', () => {
  closeModal('productoModal');
});

// ============================================
// SII
// ============================================

async function loadSII() {
  if (!estadisticasData) {
    await loadDashboard();
  }

  document.getElementById('siiVentasBrutas').textContent = formatMoney(estadisticasData.ventasMes);
  document.getElementById('siiNeto').textContent = formatMoney(estadisticasData.netoMes);
  document.getElementById('siiIVAPagar').textContent = formatMoney(estadisticasData.ivaMes);
}

document.getElementById('btnMarcarPagoSII').addEventListener('click', () => {
  showToast('Funcionalidad de registro de pagos SII en desarrollo', 'success');
});

// ============================================
// CONFIGURACIÓN
// ============================================

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      const config = data.config || {};

      const form = document.getElementById('configEnviosForm');
      if (config.dias) form.dias.value = config.dias.join(', ');
      if (config.horarios) form.horarios.value = config.horarios.join(', ');
      if (config.costo) form.costo.value = config.costo;
      if (config.comunas) form.comunas.value = config.comunas.join(', ');
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

document.getElementById('configEnviosForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const config = {
    dias: formData.get('dias').split(',').map(d => d.trim()),
    horarios: formData.get('horarios').split(',').map(h => h.trim()),
    costo: parseInt(formData.get('costo')),
    comunas: formData.get('comunas').split(',').map(c => c.trim())
  };

  try {
    const res = await fetch('/api/admin/config-envios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(config)
    });

    if (!res.ok) throw new Error('Error al guardar configuración');

    document.getElementById('configStatus').textContent = '✓ Configuración guardada correctamente';
    document.getElementById('configStatus').style.color = 'var(--success)';
    showToast('Configuración guardada correctamente', 'success');

  } catch (error) {
    console.error('Error saving config:', error);
    document.getElementById('configStatus').textContent = '✗ Error al guardar';
    document.getElementById('configStatus').style.color = 'var(--danger)';
    showToast('Error al guardar configuración', 'error');
  }
});

// ============================================
// MODALS
// ============================================

document.getElementById('closePedidoModal').addEventListener('click', () => closeModal('pedidoModal'));
document.getElementById('closeProductoModal').addEventListener('click', () => closeModal('productoModal'));

// Close modal on backdrop click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = 'auto';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : '✗';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatMoney(amount) {
  return '$' + (amount || 0).toLocaleString('es-CL');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Make functions global for onclick handlers
window.verDetallePedido = verDetallePedido;
window.cambiarEstadoPedido = cambiarEstadoPedido;
window.actualizarEstado = actualizarEstado;
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.actualizarEstadoConEmail = actualizarEstadoConEmail;
