// Variables globales
let productos = [];
let carrito = [];
let configEnvios = {};
const precioEnvio = 3000;
let productoEditando = null;

// ========== FRONTEND - TIENDA ==========

async function cargarProductos() {
  try {
    const res = await fetch('/api/productos');
    const data = await res.json();

    if (data.ok && data.productos) {
      productos = data.productos;
      renderProductos();
    } else {
      document.getElementById('productsGrid').innerHTML =
        '<div class="loading"><p>No hay productos disponibles. Configure su base de datos.</p></div>';
    }
  } catch (error) {
    console.error('Error al cargar productos:', error);
    document.getElementById('productsGrid').innerHTML =
      '<div class="alert alert-error">Error al cargar productos. Verifique la configuración de Supabase.</div>';
  }
}

function renderProductos() {
  const grid = document.getElementById('productsGrid');

  if (productos.length === 0) {
    grid.innerHTML = '<div class="loading"><p>No hay productos disponibles</p></div>';
    return;
  }

  grid.innerHTML = productos.map(p => {
    const precioFinal = p.descuento > 0 ? p.precio * (1 - p.descuento / 100) : p.precio;
    const tieneDescuento = p.descuento > 0;

    return `
      <div class="product-card" onclick="agregarAlCarrito(${p.id})">
        ${tieneDescuento ? `<span class="product-badge discount">-${p.descuento}%</span>` : ''}
        ${p.stock <= 5 ? '<span class="product-badge" style="top: 1rem; left: 1rem;">Últimas unidades</span>' : ''}
        <div class="product-image">✦</div>
        <div class="product-content">
          <h3>${p.nombre}</h3>
          <p class="product-desc">${p.descripcion || 'Pieza única personalizable'}</p>
          <div class="product-price ${tieneDescuento ? 'with-discount' : ''}">
            ${tieneDescuento ? `<span class="original">$${formatPrice(p.precio)}</span>` : ''}
            <span>$${formatPrice(Math.round(precioFinal))}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Calcula el descuento aplicable según la cantidad
function calcularDescuentoPorCantidad(descuentosCantidad, cantidad) {
  if (!descuentosCantidad || descuentosCantidad.length === 0) return 0;

  // Ordenar por cantidad descendente para encontrar el nivel aplicable
  const niveles = [...descuentosCantidad].sort((a, b) => b.cantidad - a.cantidad);

  for (const nivel of niveles) {
    if (cantidad >= nivel.cantidad) {
      return nivel.porcentaje;
    }
  }
  return 0;
}

// Calcula el precio final con todos los descuentos
function calcularPrecioConDescuentos(producto, cantidad) {
  let precio = producto.precio;

  // Primero aplicar descuento general del producto
  if (producto.descuento > 0) {
    precio = Math.round(precio * (1 - producto.descuento / 100));
  }

  // Luego aplicar descuento por cantidad (sobre el precio ya descontado)
  const descCantidad = calcularDescuentoPorCantidad(producto.descuentos_cantidad, cantidad);
  if (descCantidad > 0) {
    precio = Math.round(precio * (1 - descCantidad / 100));
  }

  return precio;
}

function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  const itemExistente = carrito.find(item => item.id === id);
  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    const precioFinal = calcularPrecioConDescuentos(producto, 1);
    carrito.push({
      ...producto,
      cantidad: 1,
      precioFinal,
      precioBase: producto.precio
    });
  }

  renderCarrito();
  mostrarCards();
}

function renderCarrito() {
  const cartItems = document.getElementById('cartItems');

  if (carrito.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart"><div class="empty-cart-icon">♡</div><p>Aún no has seleccionado ningún artículo</p></div>';
    return;
  }

  cartItems.innerHTML = carrito.map(item => {
    // Recalcular precio con descuento por cantidad actual
    const precioConDescuento = calcularPrecioConDescuentos(item, item.cantidad);
    const descuentoCantidad = calcularDescuentoPorCantidad(item.descuentos_cantidad, item.cantidad);
    const tieneDescuentoCantidad = descuentoCantidad > 0;

    // Precio sin descuento por cantidad (solo descuento general)
    const precioSinDescCantidad = item.descuento > 0
      ? Math.round(item.precio * (1 - item.descuento / 100))
      : item.precio;

    // Actualizar el precio final del item en el carrito
    item.precioFinal = precioConDescuento;

    return `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${item.nombre}</div>
          ${tieneDescuentoCantidad ? `
            <div class="cart-item-price">
              <span style="text-decoration: line-through; color: #9ca3af; font-size: 0.85rem;">$${formatPrice(precioSinDescCantidad)}</span>
              <span style="color: #10b981; font-weight: 600;">$${formatPrice(precioConDescuento)}</span>
              <span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 4px;">-${descuentoCantidad}% por ${item.cantidad}+ uds</span>
            </div>
          ` : `
            <div class="cart-item-price">$${formatPrice(precioConDescuento)} c/u</div>
          `}
          <div class="cart-quantity">
            <button class="qty-btn" onclick="cambiarCantidad(${item.id}, -1)">−</button>
            <span>${item.cantidad}</span>
            <button class="qty-btn" onclick="cambiarCantidad(${item.id}, 1)">+</button>
          </div>
          ${item.descuentos_cantidad && item.descuentos_cantidad.length > 0 && !tieneDescuentoCantidad ? `
            <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">
              Compra ${item.descuentos_cantidad[0].cantidad}+ y obtén ${item.descuentos_cantidad[0].porcentaje}% desc.
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  calcularTotal();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find(i => i.id === id);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(i => i.id !== id);
  }

  renderCarrito();
  if (carrito.length === 0) {
    ocultarCards();
  }
}

function calcularTotal() {
  const subtotal = carrito.reduce((sum, item) => sum + (item.precioFinal * item.cantidad), 0);
  document.getElementById('subtotal').textContent = '$' + formatPrice(subtotal);
  document.getElementById('total').textContent = '$' + formatPrice(subtotal + precioEnvio);
}

function mostrarCards() {
  document.getElementById('personalizacionCard').style.display = 'block';
  document.getElementById('clienteCard').style.display = 'block';
  document.getElementById('envioCard').style.display = 'block';
  document.getElementById('resumenCard').style.display = 'block';
}

function ocultarCards() {
  document.getElementById('personalizacionCard').style.display = 'none';
  document.getElementById('clienteCard').style.display = 'none';
  document.getElementById('envioCard').style.display = 'none';
  document.getElementById('resumenCard').style.display = 'none';
}

async function confirmarPedido() {
  if (carrito.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }

  const nombre = document.getElementById('nombre').value;
  const rut = document.getElementById('rut').value;
  const email = document.getElementById('email').value;
  const telefonoWsp = document.getElementById('telefonoWsp').value;
  const fechaEnvio = document.getElementById('fechaEnvio').value;
  const horarioEnvio = document.getElementById('horarioEnvio').value;

  if (!nombre || !rut || !email || !telefonoWsp || !fechaEnvio || !horarioEnvio) {
    alert('Por favor completa todos los campos obligatorios');
    return;
  }

  const telefonoEsMismo = document.getElementById('telefonoEsMismo').checked;
  const telefonoLlamada = telefonoEsMismo ? telefonoWsp : document.getElementById('telefonoLlamada').value;
  const mensajePersonalizacion = document.getElementById('mensajePersonalizacion').value;
  const tipoDiseno = document.getElementById('tipoDiseno').value;

  let imagenBase64 = null;
  const imagenFile = document.getElementById('imagenPersonalizacion').files[0];
  if (imagenFile) {
    imagenBase64 = await fileToBase64(imagenFile);
  }

  const subtotal = carrito.reduce((sum, item) => sum + (item.precioFinal * item.cantidad), 0);
  const total = subtotal + precioEnvio;

  const pedido = {
    carrito: carrito.map(item => ({
      id: item.id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precioFinal
    })),
    total,
    nombre,
    rut,
    email,
    direccion: document.getElementById('direccion').value,
    comuna: document.getElementById('comuna').value,
    telefonoWsp,
    telefonoLlamada,
    telefonoEsMismo,
    fechaEnvio,
    horarioEnvio,
    mensajePersonalizacion,
    tipoDiseno,
    imagenBase64
  };

  try {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    const res = await fetch('/api/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido)
    });

    const data = await res.json();

    if (data.ok) {
      const redirectUrl = data.urlPago || `/gracias.html?commerceOrder=${data.pedidoId || ''}`;
      if (data.requierePagoManual) {
        alert(data.mensajePago || 'Pedido recibido. Te contactaremos para coordinar el pago.');
      }
      window.location.href = redirectUrl;
    } else {
      alert('Error: ' + data.message);
      btn.disabled = false;
      btn.textContent = 'Confirmar y Pagar';
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ocurrió un error al procesar tu pedido');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function cargarConfigEnvios() {
  try {
    const res = await fetch('/api/config-envios');
    const data = await res.json();
    if (data.ok) {
      configEnvios = data.config;

      const selectHorario = document.getElementById('horarioEnvio');
      const horarios = configEnvios.horarios || ['10:00-13:00', '14:00-18:00'];
      selectHorario.innerHTML = '<option value="">Seleccione un horario</option>' +
        horarios.map(h => `<option value="${h}">${h}</option>`).join('');
    }
  } catch (error) {
    console.error('Error al cargar config envíos:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const telefonoEsMismoElement = document.getElementById('telefonoEsMismo');
  if (telefonoEsMismoElement) {
    telefonoEsMismoElement.addEventListener('change', (e) => {
      document.getElementById('telefonoLlamadaGroup').style.display = e.target.checked ? 'none' : 'block';
    });
  }
});

// ========== ADMIN PANEL ==========

function openAdmin() {
  document.getElementById('adminModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAdmin() {
  document.getElementById('adminModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

async function loginAdmin() {
  const password = document.getElementById('adminPassword').value;

  try {
    const res = await fetch('/api/admin/check-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (data.ok && data.valid) {
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      cargarDatosAdmin();
    } else {
      document.getElementById('loginError').innerHTML = '<div class="alert alert-error" style="margin-top: 1rem;">Contraseña incorrecta</div>';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('loginError').innerHTML = '<div class="alert alert-error" style="margin-top: 1rem;">Error al verificar contraseña</div>';
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById('tab-' + tabName).classList.add('active');

  // Cargar datos específicos según la pestaña
  if (tabName === 'metricas') {
    cargarMetricasAvanzadas();
  }
}

async function cargarDatosAdmin() {
  await Promise.all([
    cargarResumenAdmin(),
    cargarPedidosAdmin(),
    cargarClientesAdmin(),
    cargarSIIAdmin(),
    cargarProductosAdmin()
  ]);
}

async function cargarResumenAdmin() {
  try {
    const res = await fetch('/api/admin/resumen');
    const data = await res.json();
    if (data.ok) {
      document.getElementById('ventasHoy').textContent = '$' + formatPrice(data.ventasHoy);
      document.getElementById('pedidosHoy').textContent = data.numPedidosHoy;
      document.getElementById('ticketPromedio').textContent = '$' + formatPrice(data.ticketPromedio);
      document.getElementById('productosActivos').textContent = data.productos?.filter(p => p.activo).length || 0;

      const stockBajo = data.productos.filter(p => p.stock <= 5);
      const stockBajoDiv = document.getElementById('stockBajo');
      if (stockBajo.length > 0) {
        stockBajoDiv.innerHTML = '<table><thead><tr><th>Producto</th><th>Stock</th><th>Precio</th></tr></thead><tbody>' +
          stockBajo.map(p => `<tr><td>${p.nombre}</td><td>${p.stock}</td><td>$${formatPrice(p.precio)}</td></tr>`).join('') +
          '</tbody></table>';
      } else {
        stockBajoDiv.innerHTML = '<p style="color: var(--text-muted);">No hay productos con stock bajo</p>';
      }

      // Top productos (placeholder - se carga con métricas avanzadas)
      document.getElementById('topProductos').innerHTML = '<div class="loading"><p>Cargue la pestaña Métricas para ver el detalle</p></div>';
    }
  } catch (error) {
    console.error('Error al cargar resumen:', error);
  }
}

async function cargarProductosAdmin() {
  try {
    const res = await fetch('/api/admin/resumen');
    const data = await res.json();
    if (data.ok) {
      const productosDiv = document.getElementById('productosTable');
      productosDiv.innerHTML = '<table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Descuento</th><th>Activo</th><th>Acciones</th></tr></thead><tbody>' +
        data.productos.map(p => `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.categoria || 'N/A'}</td>
            <td>$${formatPrice(p.precio)}</td>
            <td>${p.stock}</td>
            <td>${p.descuento || 0}%</td>
            <td>${p.activo ? 'Sí' : 'No'}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-outline" onclick="editarProducto(${p.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${p.id})">Eliminar</button>
              </div>
            </td>
          </tr>
        `).join('') +
        '</tbody></table>';
    }
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
}

async function cargarPedidosAdmin() {
  try {
    const res = await fetch('/api/admin/pedidos');
    const data = await res.json();
    if (data.ok) {
      const pedidosDiv = document.getElementById('pedidosTable');
      pedidosDiv.innerHTML = '<table><thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Fecha Envío</th><th>Personalización</th><th>Acciones</th></tr></thead><tbody>' +
        data.pedidos.map(p => `
          <tr>
            <td>#${p.id}</td>
            <td>${p.clientes?.nombre || 'N/A'}<br><small style="color: var(--text-muted);">${p.clientes?.rut || ''}</small></td>
            <td>$${formatPrice(p.total)}</td>
            <td><span class="status-badge status-${p.estado.replace('_', '')}">${p.estado}</span></td>
            <td>${p.fecha_envio || 'N/A'}<br><small style="color: var(--text-muted);">${p.horario_envio || ''}</small></td>
            <td>
              ${p.mensaje_personalizacion ? `<div style="margin-bottom: 0.5rem;">${p.mensaje_personalizacion}</div>` : ''}
              ${p.imagen_url ? `<a href="${p.imagen_url}" target="_blank" style="color: var(--gold);">Ver imagen</a>` : ''}
            </td>
            <td>
              <select onchange="cambiarEstadoPedido(${p.id}, this.value)" style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--beige);">
                <option value="${p.estado}" selected>${p.estado}</option>
                <option value="pendiente_pago">Pendiente Pago</option>
                <option value="pagado">Pagado</option>
                <option value="en_produccion">En Producción</option>
                <option value="enviado">Enviado</option>
                <option value="completado">Completado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </td>
          </tr>
        `).join('') +
        '</tbody></table>';
    }
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
  }
}

async function cargarClientesAdmin() {
  try {
    const res = await fetch('/api/admin/clientes');
    const data = await res.json();
    if (data.ok) {
      const clientesDiv = document.getElementById('clientesTable');
      clientesDiv.innerHTML = '<table><thead><tr><th>Nombre</th><th>RUT</th><th>Email</th><th>Comuna</th><th>Teléfono</th><th>Puntos</th></tr></thead><tbody>' +
        data.clientes.map(c => `
          <tr>
            <td>${c.nombre}</td>
            <td>${c.rut}</td>
            <td>${c.email}</td>
            <td>${c.comuna || 'N/A'}</td>
            <td>${c.telefono_wsp || 'N/A'}</td>
            <td>${c.puntos || 0}</td>
          </tr>
        `).join('') +
        '</tbody></table>';
    }
  } catch (error) {
    console.error('Error al cargar clientes:', error);
  }
}

async function cargarSIIAdmin() {
  try {
    const res = await fetch('/api/admin/sii');
    const data = await res.json();
    if (data.ok) {
      document.getElementById('ventasMesSII').textContent = '$' + formatPrice(data.ventasMes);
      document.getElementById('ivaEstimado').textContent = '$' + formatPrice(data.ivaEstimado);

      const statusDiv = document.getElementById('siiStatus');
      if (data.pagado) {
        statusDiv.innerHTML = `<div class="alert alert-success">Pago registrado el ${new Date(data.fechaPago).toLocaleDateString()}</div>`;
      } else {
        statusDiv.innerHTML = `
          <div class="alert alert-error">El pago de este mes no ha sido registrado</div>
          <button class="btn btn-primary" onclick="marcarPagoSII(${data.ivaEstimado})">Marcar como Pagado</button>
        `;
      }
    }
  } catch (error) {
    console.error('Error al cargar SII:', error);
  }
}

async function cargarMetricasAvanzadas() {
  try {
    const res = await fetch('/api/admin/metricas-avanzadas');
    const data = await res.json();
    if (data.ok) {
      document.getElementById('ventasMes30').textContent = '$' + formatPrice(data.ventasMes);
      document.getElementById('pedidosTotales').textContent = data.totalPedidos;

      // Ventas por categoría
      const catDiv = document.getElementById('ventasPorCategoria');
      if (Object.keys(data.ventasPorCategoria).length > 0) {
        catDiv.innerHTML = '<table><thead><tr><th>Categoría</th><th>Ventas Totales</th></tr></thead><tbody>' +
          Object.entries(data.ventasPorCategoria)
            .map(([cat, total]) => `<tr><td>${cat}</td><td>$${formatPrice(total)}</td></tr>`)
            .join('') +
          '</tbody></table>';
      } else {
        catDiv.innerHTML = '<p style="color: var(--text-muted);">No hay datos disponibles</p>';
      }

      // Top productos en dashboard
      const topDiv = document.getElementById('topProductos');
      if (data.topProductos && data.topProductos.length > 0) {
        topDiv.innerHTML = '<table><thead><tr><th>Producto</th><th>Unidades Vendidas</th></tr></thead><tbody>' +
          data.topProductos.map(p => `<tr><td>${p.nombre}</td><td>${p.cantidad}</td></tr>`).join('') +
          '</tbody></table>';
      } else {
        topDiv.innerHTML = '<p style="color: var(--text-muted);">No hay datos disponibles</p>';
      }
    }
  } catch (error) {
    console.error('Error al cargar métricas:', error);
  }
}

async function marcarPagoSII(monto) {
  try {
    const res = await fetch('/api/admin/sii/marcar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto })
    });
    const data = await res.json();
    if (data.ok) {
      alert('Pago registrado correctamente');
      cargarSIIAdmin();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al marcar pago');
  }
}

async function cambiarEstadoPedido(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/admin/pedido/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    const data = await res.json();
    if (data.ok) {
      alert('Estado actualizado correctamente');
      cargarPedidosAdmin();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar estado');
  }
}

// Gestión de Productos
function mostrarFormProducto() {
  document.getElementById('formProductoContainer').style.display = 'block';
  productoEditando = null;
  limpiarFormProducto();
}

function cancelarFormProducto() {
  document.getElementById('formProductoContainer').style.display = 'none';
  productoEditando = null;
  limpiarFormProducto();
}

function limpiarFormProducto() {
  document.getElementById('prod_nombre').value = '';
  document.getElementById('prod_precio').value = '';
  document.getElementById('prod_stock').value = '';
  document.getElementById('prod_categoria').value = 'tazas';
  document.getElementById('prod_descuento').value = '0';
  document.getElementById('prod_imagen_url').value = '';
  document.getElementById('prod_descripcion').value = '';
}

async function guardarProducto() {
  const nombre = document.getElementById('prod_nombre').value;
  const precio = document.getElementById('prod_precio').value;
  const stock = document.getElementById('prod_stock').value;
  const categoria = document.getElementById('prod_categoria').value;
  const descuento = document.getElementById('prod_descuento').value;
  const imagen_url = document.getElementById('prod_imagen_url').value;
  const descripcion = document.getElementById('prod_descripcion').value;

  if (!nombre || !precio || !stock) {
    alert('Complete los campos obligatorios');
    return;
  }

  const producto = {
    nombre,
    precio: parseInt(precio),
    stock: parseInt(stock),
    categoria,
    descuento: parseInt(descuento) || 0,
    imagen_url,
    descripcion
  };

  try {
    const url = productoEditando ? `/api/admin/producto/${productoEditando}` : '/api/admin/producto';
    const method = productoEditando ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(producto)
    });

    const data = await res.json();

    if (data.ok) {
      alert(productoEditando ? 'Producto actualizado' : 'Producto creado');
      cancelarFormProducto();
      cargarProductosAdmin();
      cargarProductos(); // Refrescar productos en tienda
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar producto');
  }
}

async function editarProducto(id) {
  try {
    const res = await fetch('/api/admin/resumen');
    const data = await res.json();
    if (data.ok) {
      const producto = data.productos.find(p => p.id === id);
      if (producto) {
        productoEditando = id;
        document.getElementById('prod_nombre').value = producto.nombre;
        document.getElementById('prod_precio').value = producto.precio;
        document.getElementById('prod_stock').value = producto.stock;
        document.getElementById('prod_categoria').value = producto.categoria || 'tazas';
        document.getElementById('prod_descuento').value = producto.descuento || 0;
        document.getElementById('prod_imagen_url').value = producto.imagen_url || '';
        document.getElementById('prod_descripcion').value = producto.descripcion || '';

        document.getElementById('formProductoContainer').style.display = 'block';
        document.querySelector('#formProductoContainer h4').textContent = 'Editar Producto';
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Está seguro de eliminar este producto?')) return;

  try {
    const res = await fetch(`/api/admin/producto/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (data.ok) {
      alert('Producto eliminado');
      cargarProductosAdmin();
      cargarProductos();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al eliminar producto');
  }
}

async function guardarConfigEnvios() {
  const diasSeleccionados = Array.from(document.querySelectorAll('.dia-envio:checked')).map(cb => parseInt(cb.value));
  const horarios = document.getElementById('horariosEnvio').value.split('\n').filter(h => h.trim());
  const precioBase = parseInt(document.getElementById('precioBaseEnvio').value);

  try {
    const res = await fetch('/api/admin/config-envios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dias_abiertos: diasSeleccionados,
        horarios,
        precio_base: precioBase
      })
    });
    const data = await res.json();
    if (data.ok) {
      alert('Configuración guardada correctamente');
      cargarConfigEnvios(); // Refrescar en tienda
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar configuración');
  }
}

// Utilidades
function formatPrice(price) {
  return new Intl.NumberFormat('es-CL').format(price);
}

function scrollToProducts() {
  document.getElementById('productsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
  cargarConfigEnvios();
});
