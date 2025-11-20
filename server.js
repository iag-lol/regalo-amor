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

// Validar variables de entorno críticas
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('TU_SUPABASE')) {
  console.error('❌ ERROR: Supabase no está configurado');
  console.error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Render');
}

const supabase = SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('TU_SUPABASE')
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Middleware de autenticación admin
const adminGuard = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  const adminPassword = process.env.ADMIN_PASSWORD || 'RegaloAmor2024';

  console.log('[Admin Auth] Intento de autenticación');
  console.log('[Admin Auth] Contraseña configurada:', adminPassword);
  console.log('[Admin Auth] Token recibido:', token ? '***' + token.slice(-4) : 'NO ENVIADO');

  if (!token) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'No se envió contraseña'
    });
  }

  if (token !== adminPassword) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Contraseña incorrecta',
      hint: `La contraseña configurada es: ${adminPassword}`
    });
  }

  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isSupabaseConfigured = supabase !== null;
  const isFlowConfigured = process.env.FLOW_API_KEY && !process.env.FLOW_API_KEY.includes('TU_FLOW');

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    supabase: isSupabaseConfigured ? 'configurado' : '❌ NO CONFIGURADO',
    flow: isFlowConfigured ? 'configurado' : 'no configurado (opcional)',
    admin: process.env.ADMIN_PASSWORD ? 'configurado' : 'usando default',
    message: isSupabaseConfigured
      ? 'Sistema funcionando correctamente'
      : '⚠️ Configura Supabase en las variables de entorno de Render'
  });
});

// GET /api/productos
app.get('/api/productos', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        ok: false,
        message: '⚠️ Base de datos no configurada. Configura Supabase en las variables de entorno de Render.',
        config_required: 'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
      });
    }

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) throw error;

    res.json({ ok: true, productos: data });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ ok: false, message: 'Error al obtener productos', error: error.message });
  }
});

// GET /api/config-envios
app.get('/api/config-envios', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({
        ok: true,
        config: {
          dias_abiertos: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          horarios: ['10:00-13:00', '15:00-19:00'],
          comunas_disponibles: ['Santiago'],
          costo_base: 3990
        }
      });
    }

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
        dias_abiertos: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horarios: ['10:00-13:00', '15:00-19:00'],
        comunas_disponibles: ['Santiago'],
        costo_base: 3990
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
app.get('/api/admin/resumen', adminGuard, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        error: 'Base de datos no configurada',
        message: 'Debes configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Render',
        instructions: 'Ve a Render Dashboard → Tu servicio → Environment → Add Environment Variable'
      });
    }

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
app.get('/api/admin/pedidos', adminGuard, async (req, res) => {
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
app.get('/api/admin/clientes', adminGuard, async (req, res) => {
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
app.get('/api/admin/sii', adminGuard, async (req, res) => {
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
app.post('/api/admin/sii/marcar-pago', adminGuard, async (req, res) => {
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
app.get('/api/admin/metricas-avanzadas', adminGuard, async (req, res) => {
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
app.post('/api/admin/producto', adminGuard, async (req, res) => {
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

// CRUD de productos
app.post('/api/admin/productos', adminGuard, async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      imagen_url,
      categoria,
      stock,
      descuento,
      es_combo,
      imagenes_galeria,
    } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }

    const payload = {
      nombre,
      descripcion: descripcion || '',
      precio: safeNumber(precio),
      imagen_url: imagen_url || null,
      categoria: categoria || 'General',
      stock: Number.parseInt(stock) || 0,
      descuento: safeNumber(descuento) || 0,
      es_combo: Boolean(es_combo),
      activo: true,
      imagenes_galeria: imagenes_galeria || [],
    };

    const { data, error } = await supabase
      .from('productos')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return res.json({ ok: true, producto: data });
  } catch (error) {
    console.error('Error al crear producto', error);
    return res.status(500).json({ error: 'No se pudo crear el producto' });
  }
});

app.put('/api/admin/productos/:id', adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio,
      imagen_url,
      categoria,
      stock,
      descuento,
      es_combo,
      activo,
      imagenes_galeria,
    } = req.body;

    const payload = {};
    if (nombre !== undefined) payload.nombre = nombre;
    if (descripcion !== undefined) payload.descripcion = descripcion;
    if (precio !== undefined) payload.precio = safeNumber(precio);
    if (imagen_url !== undefined) payload.imagen_url = imagen_url;
    if (categoria !== undefined) payload.categoria = categoria;
    if (stock !== undefined) payload.stock = Number.parseInt(stock);
    if (descuento !== undefined) payload.descuento = safeNumber(descuento);
    if (es_combo !== undefined) payload.es_combo = Boolean(es_combo);
    if (activo !== undefined) payload.activo = Boolean(activo);
    if (imagenes_galeria !== undefined) payload.imagenes_galeria = imagenes_galeria;

    const { data, error } = await supabase
      .from('productos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ ok: true, producto: data });
  } catch (error) {
    console.error('Error al actualizar producto', error);
    return res.status(500).json({ error: 'No se pudo actualizar el producto' });
  }
});

app.delete('/api/admin/productos/:id', adminGuard, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;

    return res.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar producto', error);
    return res.status(500).json({ error: 'No se pudo eliminar el producto' });
  }
});

// Subir imagen a Supabase Storage
app.post('/api/admin/upload-imagen', adminGuard, async (req, res) => {
  try {
    const { imagen_base64, nombre_archivo } = req.body;

    if (!imagen_base64) {
      return res.status(400).json({ error: 'Imagen es requerida' });
    }

    const bucket = process.env.SUPABASE_BUCKET_IMAGENES || 'imagenes';
    const matches = imagen_base64.match(/^data:(.*);base64,(.*)$/);
    if (!matches) {
      throw new Error('Formato de imagen inválido');
    }

    const contentType = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    const extension = contentType.split('/')[1] || 'jpg';
    const fileName = `productos/${nombre_archivo || Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return res.json({ ok: true, url: publicData?.publicUrl || null });
  } catch (error) {
    console.error('Error al subir imagen', error);
    return res.status(500).json({ error: 'No se pudo subir la imagen' });
  }
});

// Obtener categorías disponibles
app.get('/api/admin/categorias', adminGuard, async (req, res) => {
  try {
    const { data } = await supabase
      .from('productos')
      .select('categoria')
      .eq('activo', true);

    const categorias = [...new Set((data || []).map(p => p.categoria).filter(Boolean))];

    return res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías', error);
    return res.status(500).json({ error: 'No se pudieron obtener las categorías' });
  }
});

// Obtener todos los productos para admin (incluso inactivos)
app.get('/api/admin/productos', adminGuard, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;

    return res.json(data || []);
  } catch (error) {
    console.error('Error al obtener productos admin', error);
    return res.status(500).json({ error: 'No se pudieron obtener los productos' });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
