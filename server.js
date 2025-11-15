import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createPayment } from './flowClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase no está configurado correctamente. Verifica SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : null;

const adminGuard = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  return next();
};

const defaultEnvioConfig = () => ({
  dias_abiertos: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  horarios: ['10:00-13:00', '15:00-19:00'],
  costo_base: 4990,
  comunas_disponibles: ['Santiago', 'Providencia', 'Las Condes'],
});

const safeNumber = (value) => Number.parseFloat(value || 0) || 0;

const demoProducts = () => ([
  {
    id: 'demo-box',
    nombre: 'Caja Atelier Signature',
    descripcion: 'Incluye flores preservadas, vela y tarjeta en papel algodón.',
    precio: 54990,
    imagen_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=60',
    categoria: 'Signature',
    stock: 10,
    descuento: null,
    es_combo: true,
  },
  {
    id: 'demo-champagne',
    nombre: 'Burbuja & Oro',
    descripcion: 'Espumante premium + copas grabadas.',
    precio: 78990,
    imagen_url: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=800&q=60',
    categoria: 'Celebración',
    stock: 8,
    descuento: null,
    es_combo: false,
  },
  {
    id: 'demo-arte',
    nombre: 'Canvas Personalizado',
    descripcion: 'Ilustración minimalista enmarcada lista para regalar.',
    precio: 63990,
    imagen_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60',
    categoria: 'Arte',
    stock: 5,
    descuento: 0,
    es_combo: false,
  },
]);

const uploadPersonalizationImage = async (base64, rut) => {
  if (!base64) return null;
  const bucket = process.env.SUPABASE_BUCKET_IMAGENES;
  if (!bucket) {
    console.warn('No hay bucket configurado, se omite carga de imagen.');
    return null;
  }

  const matches = base64.match(/^data:(.*);base64,(.*)$/);
  if (!matches) {
    throw new Error('Formato de imagen inválido');
  }
  const contentType = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  const extension = contentType.split('/')[1] || 'jpg';
  const fileName = `personalizaciones/${(rut || 'cliente').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
    contentType,
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicData?.publicUrl || null;
};

app.get('/api/productos', async (req, res) => {
  if (!supabase) {
    return res.json(demoProducts());
  }

  const { data, error } = await supabase
    .from('productos')
    .select('id,nombre,descripcion,precio,imagen_url,categoria,stock,descuento,es_combo')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Supabase productos error', error);
    return res.json(demoProducts());
  }

  return res.json(data || demoProducts());
});

app.get('/api/config-envios', async (req, res) => {
  const { data, error } = await supabase
    .from('config_envios')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.json(defaultEnvioConfig());
  }

  return res.json(data || defaultEnvioConfig());
});

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
      imagenBase64,
    } = req.body;

    if (!Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: 'El carrito no puede estar vacío' });
    }

    const requiredFields = [nombre, rut, email, direccion, comuna, telefonoWsp];
    if (requiredFields.some((value) => !value)) {
      return res.status(400).json({ error: 'Faltan campos obligatorios del cliente' });
    }

    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('*')
      .eq('rut', rut)
      .maybeSingle();

    const clientePayload = {
      rut,
      nombre,
      email,
      direccion,
      comuna,
      telefono_wsp: telefonoWsp,
      telefono_llamada: telefonoLlamada,
      telefono_es_mismo: Boolean(telefonoEsMismo),
      fidelidad_puntos: clienteExistente?.fidelidad_puntos || 0,
    };

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .upsert(clientePayload, { onConflict: 'rut' })
      .select()
      .single();

    if (clienteError) {
      return res.status(500).json({ error: 'No se pudo registrar el cliente' });
    }

    let imagenUrl = null;
    if (imagenBase64) {
      imagenUrl = await uploadPersonalizationImage(imagenBase64, rut);
    }

    const now = new Date();
    const pedidoPayload = {
      cliente_id: cliente.id,
      total: safeNumber(total),
      estado: 'pendiente_pago',
      fecha: now.toISOString(),
      fecha_actualizacion: now.toISOString(),
      texto_personalizacion: mensajePersonalizacion || '',
      tipo_diseno: tipoDiseno || 'solo_texto',
      imagen_url: imagenUrl,
      fecha_envio: fechaEnvio || null,
      horario_envio: horarioEnvio || null,
      canal: 'web',
      carrito_json: carrito,
    };

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert(pedidoPayload)
      .select()
      .single();

    if (pedidoError) {
      return res.status(500).json({ error: 'No se pudo crear el pedido' });
    }

    const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || '';
    const flowResponse = await createPayment({
      amount: safeNumber(total),
      commerceOrder: pedido.id,
      subject: `Pedido personalizado #${pedido.id}`,
      email,
      urlConfirmation: `${baseUrl}/api/flow/confirmacion`,
      urlReturn: `${baseUrl}/gracias.html`,
    });

    const puntosGanados = safeNumber(total) > 0 ? Math.max(1, Math.floor(safeNumber(total) / 10000)) : 0;
    let puntosActualizados = cliente.fidelidad_puntos;
    if (puntosGanados > 0) {
      const nuevoTotal = (cliente.fidelidad_puntos || 0) + puntosGanados;
      const { error: updateError } = await supabase
        .from('clientes')
        .update({ fidelidad_puntos: nuevoTotal })
        .eq('id', cliente.id);
      if (!updateError) {
        puntosActualizados = nuevoTotal;
      }
    }

    return res.json({
      ok: true,
      urlPago: flowResponse.url,
      pedidoId: pedido.id,
      puntosAcumulados: puntosActualizados,
    });
  } catch (error) {
    console.error('Error al crear pedido', error);
    return res.status(500).json({ error: 'Error interno al crear el pedido' });
  }
});

app.post('/api/flow/confirmacion', async (req, res) => {
  try {
    const payload = Object.keys(req.body || {}).length ? req.body : req.query;
    const { commerceOrder, status } = payload;

    if (!commerceOrder) {
      return res.status(400).send('commerceOrder es requerido');
    }

    let estado = 'anulado';
    if (status === '1') estado = 'pagado';
    else if (status === '2') estado = 'rechazado';

    const { error } = await supabase
      .from('pedidos')
      .update({ estado, fecha_actualizacion: new Date().toISOString() })
      .eq('id', commerceOrder);

    if (error) {
      console.error('No se pudo actualizar pedido Flow', error);
      return res.status(500).send('Error al actualizar pedido');
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error en confirmación Flow', error);
    return res.status(500).send('Error interno');
  }
});

app.get('/api/admin/resumen', adminGuard, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const { data: pedidosHoy } = await supabase
      .from('pedidos')
      .select('id,total,estado,fecha')
      .gte('fecha', start.toISOString())
      .lt('fecha', end.toISOString())
      .order('fecha', { ascending: false });

    const { data: productos } = await supabase
      .from('productos')
      .select('id,nombre,stock,precio,activo')
      .order('nombre', { ascending: true });

    const { data: metricas } = await supabase
      .from('metricas_diarias')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(7);

    return res.json({
      pedidosHoy: pedidosHoy || [],
      productos: productos || [],
      metricasUltimos7Dias: (metricas || []).reverse(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'No se pudo obtener el resumen' });
  }
});

app.post('/api/admin/config-envios', adminGuard, async (req, res) => {
  try {
    const {
      dias_abiertos = defaultEnvioConfig().dias_abiertos,
      horarios = defaultEnvioConfig().horarios,
      costo_base = defaultEnvioConfig().costo_base,
      comunas_disponibles = defaultEnvioConfig().comunas_disponibles,
    } = req.body;

    const payload = {
      id: 1,
      dias_abiertos,
      horarios,
      costo_base,
      comunas_disponibles,
    };

    const { data, error } = await supabase
      .from('config_envios')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return res.json({ ok: true, config: data });
  } catch (error) {
    console.error('Error al guardar config envíos', error);
    return res.status(500).json({ error: 'No se pudo guardar la configuración' });
  }
});

app.get('/api/admin/pedidos', adminGuard, async (req, res) => {
  try {
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('id,cliente_id,total,estado,fecha,texto_personalizacion,imagen_url,fecha_envio,horario_envio,carrito_json,tipo_diseno')
      .order('fecha', { ascending: false })
      .limit(50);

    const clienteIds = [...new Set((pedidos || []).map((p) => p.cliente_id))];

    let clientesMap = new Map();
    if (clienteIds.length) {
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id,nombre,email,rut,telefono_wsp,telefono_llamada,direccion,comuna');
      clientesMap = new Map((clientes || []).map((c) => [c.id, c]));
    }

    const enriched = (pedidos || []).map((p) => ({
      ...p,
      cliente: clientesMap.get(p.cliente_id) || null,
    }));

    return res.json(enriched);
  } catch (error) {
    console.error('Error al obtener pedidos admin', error);
    return res.status(500).json({ error: 'No se pudo obtener la lista de pedidos' });
  }
});

app.get('/api/admin/sii', adminGuard, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { data: ventas } = await supabase
      .from('pedidos')
      .select('total')
      .eq('estado', 'pagado')
      .gte('fecha', start.toISOString())
      .lt('fecha', nextMonth.toISOString());

    const totalVentasMes = (ventas || []).reduce((acc, item) => acc + safeNumber(item.total), 0);
    const periodo = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

    const { data: estado } = await supabase
      .from('sii_estado')
      .select('*')
      .eq('mes', periodo)
      .maybeSingle();

    return res.json({
      totalVentasMes,
      fechaCorte: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-20`,
      estadoPagoImpuestos: estado?.estado || 'pendiente',
      fechaPago: estado?.fecha_pago || null,
      periodo,
    });
  } catch (error) {
    console.error('Error en módulo SII', error);
    return res.status(500).json({ error: 'No se pudo obtener la información del SII' });
  }
});

app.post('/api/admin/sii/marcar-pagado', adminGuard, async (req, res) => {
  try {
    const now = new Date();
    const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const estado = req.body?.estado || 'pagado';

    const payload = {
      mes: periodo,
      estado,
      fecha_pago: estado === 'pagado' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('sii_estado')
      .upsert(payload, { onConflict: 'mes' })
      .select()
      .single();

    if (error) throw error;

    return res.json({ ok: true, sii: data });
  } catch (error) {
    console.error('No se pudo actualizar SII', error);
    return res.status(500).json({ error: 'No se pudo actualizar el estado del SII' });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
