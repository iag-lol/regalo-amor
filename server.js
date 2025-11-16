import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createFlowPayment } from './flowClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/productos
app.get('/api/productos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) throw error;

    res.json({ ok: true, productos: data });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ ok: false, message: 'Error al obtener productos' });
  }
});

// GET /api/config-envios
app.get('/api/config-envios', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('config_envios')
      .select('*')
      .single();

    if (error) throw error;

    res.json({ ok: true, config: data || {} });
  } catch (error) {
    console.error('Error al obtener configuración de envíos:', error);
    res.json({
      ok: true,
      config: {
        dias_abiertos: [1, 2, 3, 4, 5],
        horarios: ['10:00-13:00', '14:00-18:00'],
        precio_base: 3000
      }
    });
  }
});

// POST /api/pedido
app.post('/api/pedido', async (req, res) => {
  try {
    const {
      carrito,
      total,
      nombre,
      rut,
      email,
      direccion,
      comuna,
      telefonoWsp,
      telefonoLlamada,
      telefonoEsMismo,
      fechaEnvio,
      horarioEnvio,
      mensajePersonalizacion,
      tipoDiseno,
      imagenBase64
    } = req.body;

    if (!nombre || !rut || !email || !carrito || carrito.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan datos obligatorios'
      });
    }

    // Upsert cliente
    const { data: clienteData, error: clienteError } = await supabase
      .from('clientes')
      .upsert({
        rut,
        nombre,
        email,
        direccion,
        comuna,
        telefono_wsp: telefonoWsp,
        telefono_llamada: telefonoEsMismo ? telefonoWsp : telefonoLlamada,
        puntos: 0
      }, {
        onConflict: 'rut',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (clienteError) {
      console.error('Error al crear/actualizar cliente:', clienteError);
    }

    const clienteId = clienteData?.id;

    // Subir imagen si existe
    let imagenUrl = null;
    if (imagenBase64 && imagenBase64.startsWith('data:image')) {
      try {
        const timestamp = Date.now();
        const matches = imagenBase64.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);

        if (matches && matches.length === 3) {
          const ext = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          const fileName = `personalizaciones/${rut}-${timestamp}.${ext}`;
          const bucketName = process.env.SUPABASE_BUCKET_IMAGENES || 'imagenes';

          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, buffer, {
              contentType: `image/${ext}`,
              upsert: true
            });

          if (uploadError) {
            console.error('Error al subir imagen:', uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);

            imagenUrl = urlData.publicUrl;
          }
        }
      } catch (imgError) {
        console.error('Error procesando imagen:', imgError);
      }
    }

    // Crear pedido
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: clienteId,
        total,
        estado: 'pendiente_pago',
        carrito: JSON.stringify(carrito),
        fecha_envio: fechaEnvio,
        horario_envio: horarioEnvio,
        mensaje_personalizacion: mensajePersonalizacion || '',
        tipo_diseno: tipoDiseno || 'solo_texto',
        imagen_url: imagenUrl,
        canal: 'web',
        fecha: new Date().toISOString()
      })
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    const pedidoId = pedidoData.id;

    // Crear pago en Flow
    const flowPayment = await createFlowPayment({
      amount: total,
      commerceOrder: String(pedidoId),
      subject: `Pedido personalizado #${pedidoId}`,
      email,
      urlConfirmation: `${process.env.BASE_URL}/api/flow/confirmacion`,
      urlReturn: `${process.env.BASE_URL}/gracias.html`
    });

    res.json({
      ok: true,
      urlPago: flowPayment.url,
      pedidoId
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({
      ok: false,
      message: error.message || 'Error al procesar el pedido'
    });
  }
});

// POST /api/flow/confirmacion
app.post('/api/flow/confirmacion', async (req, res) => {
  try {
    const { commerceOrder, status } = req.body;

    if (!commerceOrder) {
      return res.status(400).send('Falta commerceOrder');
    }

    const nuevoEstado = status === '1' || status === 1 ? 'pagado' : 'rechazado';

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', commerceOrder);

    if (error) {
      console.error('Error actualizando pedido:', error);
    }

    // Registrar en métricas si está pagado
    if (nuevoEstado === 'pagado') {
      const hoy = new Date().toISOString().split('T')[0];

      const { data: pedido } = await supabase
        .from('pedidos')
        .select('total')
        .eq('id', commerceOrder)
        .single();

      if (pedido) {
        await supabase
          .from('metricas_diarias')
          .upsert({
            fecha: hoy,
            ventas_total: pedido.total,
            pedidos_count: 1
          }, {
            onConflict: 'fecha',
            ignoreDuplicates: false
          });
      }
    }

    res.send('OK');
  } catch (error) {
    console.error('Error en confirmación Flow:', error);
    res.status(500).send('ERROR');
  }
});

// GET /api/admin/check-password
app.post('/api/admin/check-password', async (req, res) => {
  try {
    const { password } = req.body;
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === correctPassword) {
      res.json({ ok: true, valid: true });
    } else {
      res.json({ ok: true, valid: false });
    }
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al verificar contraseña' });
  }
});

// GET /api/admin/resumen
app.get('/api/admin/resumen', async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Pedidos de hoy
    const { data: pedidosHoy, error: pedidosError } = await supabase
      .from('pedidos')
      .select('total, estado')
      .gte('fecha', hoy);

    if (pedidosError) throw pedidosError;

    const ventasHoy = pedidosHoy
      .filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.total, 0);

    const numPedidosHoy = pedidosHoy.filter(p => p.estado === 'pagado').length;
    const ticketPromedio = numPedidosHoy > 0 ? ventasHoy / numPedidosHoy : 0;

    // Productos
    const { data: productos } = await supabase
      .from('productos')
      .select('*')
      .order('stock');

    // Métricas últimos 7 días
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const fecha7Dias = hace7Dias.toISOString().split('T')[0];

    const { data: metricas } = await supabase
      .from('metricas_diarias')
      .select('*')
      .gte('fecha', fecha7Dias)
      .order('fecha');

    res.json({
      ok: true,
      ventasHoy,
      numPedidosHoy,
      ticketPromedio: Math.round(ticketPromedio),
      productos: productos || [],
      metricas: metricas || []
    });

  } catch (error) {
    console.error('Error en resumen admin:', error);
    res.status(500).json({ ok: false, message: 'Error al obtener resumen' });
  }
});

// GET /api/admin/pedidos
app.get('/api/admin/pedidos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (nombre, rut, email)
      `)
      .order('fecha', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ ok: true, pedidos: data });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ ok: false, message: 'Error al obtener pedidos' });
  }
});

// GET /api/admin/clientes
app.get('/api/admin/clientes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre');

    if (error) throw error;

    res.json({ ok: true, clientes: data });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ ok: false, message: 'Error al obtener clientes' });
  }
});

// GET /api/admin/sii
app.get('/api/admin/sii', async (req, res) => {
  try {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const inicioMes = new Date(anio, mes - 1, 1).toISOString().split('T')[0];
    const finMes = new Date(anio, mes, 0).toISOString().split('T')[0];

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('total')
      .eq('estado', 'pagado')
      .gte('fecha', inicioMes)
      .lte('fecha', finMes);

    const ventasMes = pedidos ? pedidos.reduce((sum, p) => sum + p.total, 0) : 0;
    const ivaEstimado = Math.round(ventasMes * 0.19);

    const { data: pagos } = await supabase
      .from('sii_pagos')
      .select('*')
      .eq('mes', mes)
      .eq('anio', anio)
      .single();

    res.json({
      ok: true,
      ventasMes,
      ivaEstimado,
      pagado: !!pagos,
      fechaPago: pagos?.fecha_pago || null
    });

  } catch (error) {
    console.error('Error al obtener info SII:', error);
    res.status(500).json({ ok: false, message: 'Error al obtener info SII' });
  }
});

// POST /api/admin/sii/marcar-pago
app.post('/api/admin/sii/marcar-pago', async (req, res) => {
  try {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const { error } = await supabase
      .from('sii_pagos')
      .upsert({
        mes,
        anio,
        fecha_pago: new Date().toISOString(),
        monto: req.body.monto || 0
      }, {
        onConflict: 'mes,anio'
      });

    if (error) throw error;

    res.json({ ok: true, message: 'Pago registrado' });

  } catch (error) {
    console.error('Error al marcar pago SII:', error);
    res.status(500).json({ ok: false, message: 'Error al marcar pago' });
  }
});

// GET /api/admin/metricas-avanzadas
app.get('/api/admin/metricas-avanzadas', async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Ventas por categoría
    const { data: productos } = await supabase.from('productos').select('id, nombre, categoria, precio');
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('carrito, total, fecha, estado')
      .eq('estado', 'pagado')
      .gte('fecha', hace30Dias);

    const ventasPorCategoria = {};
    const productosMasVendidos = {};

    pedidos?.forEach(pedido => {
      try {
        const carrito = typeof pedido.carrito === 'string' ? JSON.parse(pedido.carrito) : pedido.carrito;
        carrito.forEach(item => {
          const producto = productos?.find(p => p.id === item.id);
          if (producto) {
            const cat = producto.categoria || 'general';
            ventasPorCategoria[cat] = (ventasPorCategoria[cat] || 0) + (item.precio * item.cantidad);
            productosMasVendidos[producto.nombre] = (productosMasVendidos[producto.nombre] || 0) + item.cantidad;
          }
        });
      } catch (e) {}
    });

    const topProductos = Object.entries(productosMasVendidos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }));

    res.json({
      ok: true,
      ventasPorCategoria,
      topProductos,
      totalPedidos: pedidos?.length || 0,
      ventasMes: pedidos?.reduce((sum, p) => sum + p.total, 0) || 0
    });
  } catch (error) {
    console.error('Error en métricas avanzadas:', error);
    res.status(500).json({ ok: false, message: 'Error al obtener métricas' });
  }
});

// POST /api/admin/producto
app.post('/api/admin/producto', async (req, res) => {
  try {
    const { nombre, precio, stock, descripcion, categoria, imagen_url, descuento } = req.body;

    const { data, error } = await supabase
      .from('productos')
      .insert({
        nombre,
        precio: parseInt(precio),
        stock: parseInt(stock),
        descripcion: descripcion || '',
        categoria: categoria || 'general',
        imagen_url: imagen_url || '',
        activo: true,
        descuento: parseInt(descuento || 0)
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, producto: data });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ ok: false, message: 'Error al crear producto' });
  }
});

// DELETE /api/admin/producto/:id
app.delete('/api/admin/producto/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ ok: true, message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ ok: false, message: 'Error al eliminar producto' });
  }
});

// PUT /api/admin/producto/:id
app.put('/api/admin/producto/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, producto: data });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ ok: false, message: 'Error al actualizar producto' });
  }
});

// PUT /api/admin/pedido/:id
app.put('/api/admin/pedido/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, pedido: data });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ ok: false, message: 'Error al actualizar pedido' });
  }
});

// PUT /api/admin/cliente/:id
app.put('/api/admin/cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { puntos } = req.body;

    const { data, error } = await supabase
      .from('clientes')
      .update({ puntos })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, cliente: data });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ ok: false, message: 'Error al actualizar cliente' });
  }
});

// POST /api/admin/config-envios
app.post('/api/admin/config-envios', async (req, res) => {
  try {
    const { dias_abiertos, horarios, precio_base } = req.body;

    const { data, error } = await supabase
      .from('config_envios')
      .upsert({
        id: 1,
        dias_abiertos,
        horarios,
        precio_base
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ ok: true, config: data });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ ok: false, message: 'Error al actualizar configuración' });
  }
});

// Fallback para SPA
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ ok: false, message: 'Endpoint no encontrado' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
