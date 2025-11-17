-- ============================================
-- REGALO AMOR - SETUP DE BASE DE DATOS
-- ============================================
-- Ejecuta este script completo en el SQL Editor de Supabase

-- 1. Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC NOT NULL,
  imagen_url TEXT,
  categoria TEXT,
  stock INTEGER DEFAULT 0,
  descuento NUMERIC DEFAULT 0,
  es_combo BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  imagenes_galeria JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  direccion TEXT,
  comuna TEXT,
  telefono_wsp TEXT,
  telefono_llamada TEXT,
  telefono_es_mismo BOOLEAN DEFAULT false,
  fidelidad_puntos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  total NUMERIC NOT NULL,
  estado TEXT DEFAULT 'pendiente_pago',
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  texto_personalizacion TEXT,
  tipo_diseno TEXT,
  imagen_url TEXT,
  fecha_envio DATE,
  horario_envio TEXT,
  canal TEXT DEFAULT 'web',
  carrito_json JSONB
);

-- 4. Tabla de configuración de envíos
CREATE TABLE IF NOT EXISTS config_envios (
  id INTEGER PRIMARY KEY DEFAULT 1,
  dias_abiertos TEXT[] DEFAULT ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  horarios TEXT[] DEFAULT ARRAY['10:00-13:00', '15:00-19:00'],
  costo_base NUMERIC DEFAULT 4990,
  comunas_disponibles TEXT[] DEFAULT ARRAY['Santiago', 'Providencia', 'Las Condes']
);

-- Insertar configuración por defecto
INSERT INTO config_envios (id, dias_abiertos, horarios, costo_base, comunas_disponibles)
VALUES (1,
  ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  ARRAY['10:00-13:00', '15:00-19:00'],
  4990,
  ARRAY['Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'La Reina', 'Vitacura', 'Lo Barnechea', 'Peñalolén', 'Macul', 'La Florida']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Tabla de métricas diarias
CREATE TABLE IF NOT EXISTS metricas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE DEFAULT CURRENT_DATE,
  ingresos NUMERIC DEFAULT 0,
  pedidos_count INTEGER DEFAULT 0
);

-- 6. Tabla de estado SII
CREATE TABLE IF NOT EXISTS sii_estado (
  mes TEXT PRIMARY KEY,
  estado TEXT DEFAULT 'pendiente',
  fecha_pago TIMESTAMP WITH TIME ZONE
);

-- 7. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_clientes_rut ON clientes(rut);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha);

-- 8. Insertar productos de ejemplo (opcional - puedes comentar esto si no quieres ejemplos)
INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria, stock, descuento, es_combo, activo)
VALUES
  ('Taza Personalizada', 'Taza de cerámica de 11oz con diseño personalizado de alta calidad', 8990, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80', 'Tazas', 50, 0, false, true),
  ('Polera Hombre Personalizada', 'Polera de algodón 100% con estampado premium', 12990, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', 'Poleras Hombre', 30, 0, false, true),
  ('Polera Mujer Personalizada', 'Polera de algodón suave con diseño exclusivo', 12990, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80', 'Poleras Mujer', 30, 0, false, true),
  ('Gorro Personalizado', 'Gorro de lana con bordado personalizado', 9990, 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=80', 'Gorros', 25, 0, false, true),
  ('Botella Térmica Personalizada', 'Botella térmica de acero inoxidable 500ml', 14990, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', 'Botellas', 40, 0, false, true),
  ('Cuadro Personalizado 30x40cm', 'Cuadro con impresión de alta calidad en canvas', 24990, 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=600&q=80', 'Cuadros', 15, 0, false, true),
  ('Mousepad Personalizado', 'Mousepad gaming con diseño a todo color', 7990, 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80', 'Mousepad', 60, 0, false, true),
  ('Pantuflas Personalizadas', 'Pantuflas cómodas con estampado personalizado', 11990, 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80', 'Pantuflas', 20, 10, false, true),
  ('Combo Regalo Amor Premium', 'Incluye taza, cuadro y tarjeta personalizada', 39990, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', 'Combos', 10, 15, true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- ¡LISTO! Tu base de datos está configurada
-- ============================================

-- Para verificar que todo se creó correctamente, ejecuta:
SELECT 'productos' as tabla, COUNT(*) as registros FROM productos
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL
SELECT 'config_envios', COUNT(*) FROM config_envios;
