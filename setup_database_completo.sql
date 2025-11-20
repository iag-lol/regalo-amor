-- ============================================
-- REGALO AMOR - SETUP COMPLETO DE BASE DE DATOS
-- ============================================
-- Este script crea TODAS las tablas necesarias desde cero
-- Ejecuta este script COMPLETO en el SQL Editor de Supabase

-- ============================================
-- 1. ELIMINAR TABLAS EXISTENTES (OPCIONAL - DESCOMENTA SI QUIERES EMPEZAR DE CERO)
-- ============================================
-- DROP TABLE IF EXISTS pedidos CASCADE;
-- DROP TABLE IF EXISTS clientes CASCADE;
-- DROP TABLE IF EXISTS productos CASCADE;
-- DROP TABLE IF EXISTS config_envios CASCADE;
-- DROP TABLE IF EXISTS metricas_diarias CASCADE;
-- DROP TABLE IF EXISTS sii_estado CASCADE;

-- ============================================
-- 2. TABLA DE PRODUCTOS
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC NOT NULL CHECK (precio >= 0),
  imagen_url TEXT,
  categoria TEXT,
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  descuento NUMERIC DEFAULT 0 CHECK (descuento >= 0 AND descuento <= 100),
  es_combo BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  imagenes_galeria JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_precio ON productos(precio);
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos(created_at DESC);

-- ============================================
-- 3. TABLA DE CLIENTES
-- ============================================
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
  fidelidad_puntos INTEGER DEFAULT 0 CHECK (fidelidad_puntos >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_rut ON clientes(rut);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at DESC);

-- ============================================
-- 4. TABLA DE PEDIDOS
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  total NUMERIC NOT NULL CHECK (total >= 0),
  estado TEXT DEFAULT 'pendiente_pago' CHECK (estado IN ('pendiente_pago', 'pagado', 'rechazado', 'anulado', 'completado', 'enviado')),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  texto_personalizacion TEXT,
  tipo_diseno TEXT DEFAULT 'solo_texto' CHECK (tipo_diseno IN ('solo_texto', 'texto_imagen', 'ilustracion')),
  imagen_url TEXT,
  fecha_envio DATE,
  horario_envio TEXT,
  canal TEXT DEFAULT 'web' CHECK (canal IN ('web', 'whatsapp', 'instagram', 'telefono')),
  carrito_json JSONB,
  notas TEXT
);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_envio ON pedidos(fecha_envio);

-- ============================================
-- 5. TABLA DE CONFIGURACIÓN DE ENVÍOS
-- ============================================
CREATE TABLE IF NOT EXISTS config_envios (
  id INTEGER PRIMARY KEY DEFAULT 1,
  dias_abiertos TEXT[] DEFAULT ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  horarios TEXT[] DEFAULT ARRAY['10:00-13:00', '15:00-19:00'],
  costo_base NUMERIC DEFAULT 4990 CHECK (costo_base >= 0),
  comunas_disponibles TEXT[] DEFAULT ARRAY['Santiago'],
  mensaje_envio TEXT DEFAULT 'Envío dentro de 2-3 días hábiles',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto (solo si no existe)
INSERT INTO config_envios (
  id,
  dias_abiertos,
  horarios,
  costo_base,
  comunas_disponibles,
  mensaje_envio
) VALUES (
  1,
  ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  ARRAY['10:00-13:00', '15:00-19:00'],
  4990,
  ARRAY['Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'La Reina', 'Vitacura', 'Lo Barnechea', 'Peñalolén', 'Macul', 'La Florida', 'Maipú', 'Pudahuel', 'Estación Central', 'Quinta Normal', 'Recoleta', 'Independencia', 'Conchalí', 'Huechuraba', 'Quilicura', 'Renca', 'Cerro Navia', 'Lo Prado', 'San Miguel', 'San Joaquín', 'Pedro Aguirre Cerda', 'Lo Espejo', 'Cerrillos', 'El Bosque', 'San Ramón', 'La Cisterna', 'La Granja', 'San Bernardo', 'Puente Alto', 'La Pintana'],
  'Envío dentro de 2-3 días hábiles'
)
ON CONFLICT (id) DO UPDATE SET
  dias_abiertos = EXCLUDED.dias_abiertos,
  horarios = EXCLUDED.horarios,
  costo_base = EXCLUDED.costo_base,
  comunas_disponibles = EXCLUDED.comunas_disponibles,
  mensaje_envio = EXCLUDED.mensaje_envio,
  updated_at = NOW();

-- ============================================
-- 6. TABLA DE MÉTRICAS DIARIAS
-- ============================================
CREATE TABLE IF NOT EXISTS metricas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE DEFAULT CURRENT_DATE,
  ingresos NUMERIC DEFAULT 0 CHECK (ingresos >= 0),
  pedidos_count INTEGER DEFAULT 0 CHECK (pedidos_count >= 0),
  productos_vendidos INTEGER DEFAULT 0 CHECK (productos_vendidos >= 0),
  ticket_promedio NUMERIC DEFAULT 0 CHECK (ticket_promedio >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para métricas
CREATE INDEX IF NOT EXISTS idx_metricas_fecha ON metricas_diarias(fecha DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_metricas_fecha_unica ON metricas_diarias(fecha);

-- ============================================
-- 7. TABLA DE ESTADO SII (IMPUESTOS)
-- ============================================
CREATE TABLE IF NOT EXISTS sii_estado (
  mes TEXT PRIMARY KEY,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'exento')),
  monto_iva NUMERIC DEFAULT 0 CHECK (monto_iva >= 0),
  fecha_pago TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. INSERTAR PRODUCTOS DE EJEMPLO
-- ============================================
-- Solo si la tabla está vacía
INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria, stock, descuento, es_combo, activo)
SELECT * FROM (VALUES
  ('Taza Personalizada Premium', 'Taza de cerámica de 11oz con diseño personalizado de alta calidad. Resistente al lavavajillas y microondas.', 8990, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80', 'Tazas', 50, 0, false, true),
  ('Polera Hombre Personalizada', 'Polera de algodón 100% con estampado premium. Colores: Negro, Blanco, Gris. Tallas: S, M, L, XL, XXL.', 12990, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', 'Poleras Hombre', 30, 0, false, true),
  ('Polera Mujer Personalizada', 'Polera de algodón suave con diseño exclusivo. Colores: Rosa, Blanco, Negro, Gris. Tallas: XS, S, M, L, XL.', 12990, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80', 'Poleras Mujer', 30, 0, false, true),
  ('Gorro Personalizado', 'Gorro de lana con bordado personalizado. Ideal para invierno. Colores: Negro, Gris, Azul.', 9990, 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=80', 'Gorros', 25, 0, false, true),
  ('Botella Térmica Personalizada', 'Botella térmica de acero inoxidable 500ml. Mantiene frío por 24h y caliente por 12h.', 14990, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', 'Botellas', 40, 0, false, true),
  ('Cuadro Personalizado 30x40cm', 'Cuadro con impresión de alta calidad en canvas. Marco de madera incluido.', 24990, 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=600&q=80', 'Cuadros', 15, 10, false, true),
  ('Mousepad Personalizado', 'Mousepad gaming con diseño a todo color. Base antideslizante. Tamaño: 25x20cm.', 7990, 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80', 'Mousepad', 60, 0, false, true),
  ('Pantuflas Personalizadas', 'Pantuflas cómodas con estampado personalizado. Suela antideslizante. Tallas: 35-44.', 11990, 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80', 'Pantuflas', 20, 10, false, true),
  ('Combo Regalo Amor Premium', 'Incluye: Taza personalizada + Cuadro 20x30cm + Tarjeta de regalo. Ideal para ocasiones especiales.', 39990, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', 'Combos', 10, 15, true, true),
  ('Jarro Cervecero Personalizado', 'Jarro de vidrio de 500ml con grabado láser. Perfecto para regalos corporativos.', 13990, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80', 'Tazas', 35, 0, false, true)
) AS v(nombre, descripcion, precio, imagen_url, categoria, stock, descuento, es_combo, activo)
WHERE NOT EXISTS (SELECT 1 FROM productos LIMIT 1);

-- ============================================
-- 9. FUNCIONES AUXILIARES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE sii_estado ENABLE ROW LEVEL SECURITY;

-- Políticas para productos (lectura pública, escritura solo con service_role)
DROP POLICY IF EXISTS "Productos visibles públicamente" ON productos;
CREATE POLICY "Productos visibles públicamente"
  ON productos FOR SELECT
  TO anon, authenticated
  USING (activo = true);

DROP POLICY IF EXISTS "Admin puede todo en productos" ON productos;
CREATE POLICY "Admin puede todo en productos"
  ON productos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para config_envios (lectura pública)
DROP POLICY IF EXISTS "Config envíos visible públicamente" ON config_envios;
CREATE POLICY "Config envíos visible públicamente"
  ON config_envios FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin puede actualizar config envíos" ON config_envios;
CREATE POLICY "Admin puede actualizar config envíos"
  ON config_envios FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para clientes (inserción pública para registro, consulta solo admin)
DROP POLICY IF EXISTS "Clientes públicos inserción" ON clientes;
CREATE POLICY "Clientes públicos inserción"
  ON clientes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Clientes públicos upsert" ON clientes;
CREATE POLICY "Clientes públicos upsert"
  ON clientes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin puede todo en clientes" ON clientes;
CREATE POLICY "Admin puede todo en clientes"
  ON clientes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para pedidos (inserción pública, actualización pública para Flow, consulta solo admin)
DROP POLICY IF EXISTS "Pedidos públicos inserción" ON pedidos;
CREATE POLICY "Pedidos públicos inserción"
  ON pedidos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Pedidos públicos actualización" ON pedidos;
CREATE POLICY "Pedidos públicos actualización"
  ON pedidos FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin puede todo en pedidos" ON pedidos;
CREATE POLICY "Admin puede todo en pedidos"
  ON pedidos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para metricas_diarias (inserción/actualización pública para tracking, consulta solo admin)
DROP POLICY IF EXISTS "Metricas públicas upsert" ON metricas_diarias;
CREATE POLICY "Metricas públicas upsert"
  ON metricas_diarias FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Metricas públicas update" ON metricas_diarias;
CREATE POLICY "Metricas públicas update"
  ON metricas_diarias FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin puede todo en metricas" ON metricas_diarias;
CREATE POLICY "Admin puede todo en metricas"
  ON metricas_diarias FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para sii_estado (solo admin)
DROP POLICY IF EXISTS "Admin puede todo en sii" ON sii_estado;
CREATE POLICY "Admin puede todo en sii"
  ON sii_estado FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 11. VERIFICACIÓN FINAL
-- ============================================
-- Ejecuta esto después de todo para verificar que se creó correctamente

DO $$
DECLARE
  tabla_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tabla_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('productos', 'clientes', 'pedidos', 'config_envios', 'metricas_diarias', 'sii_estado');

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'VERIFICACIÓN DE TABLAS CREADAS';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tablas encontradas: %', tabla_count;

  IF tabla_count = 6 THEN
    RAISE NOTICE '✅ ÉXITO: Todas las tablas fueron creadas correctamente';
  ELSE
    RAISE NOTICE '⚠️ ADVERTENCIA: Se esperaban 6 tablas pero se encontraron %', tabla_count;
  END IF;
END $$;

-- Mostrar conteo de registros por tabla
SELECT
  'productos' as tabla,
  COUNT(*) as registros,
  'Productos disponibles en la tienda' as descripcion
FROM productos
UNION ALL
SELECT
  'clientes',
  COUNT(*),
  'Clientes registrados'
FROM clientes
UNION ALL
SELECT
  'pedidos',
  COUNT(*),
  'Pedidos realizados'
FROM pedidos
UNION ALL
SELECT
  'config_envios',
  COUNT(*),
  'Configuración de envíos'
FROM config_envios
UNION ALL
SELECT
  'metricas_diarias',
  COUNT(*),
  'Métricas registradas'
FROM metricas_diarias
UNION ALL
SELECT
  'sii_estado',
  COUNT(*),
  'Estados de SII'
FROM sii_estado
ORDER BY tabla;

-- ============================================
-- ¡LISTO! Tu base de datos está 100% configurada
-- ============================================

/*
NOTAS IMPORTANTES:
- Todas las tablas tienen IF NOT EXISTS, puedes ejecutar esto múltiples veces sin problemas
- Se insertaron 10 productos de ejemplo para que puedas probar la tienda
- Los índices mejoran la performance de búsquedas
- Los triggers actualizan automáticamente updated_at
- Las políticas RLS permiten acceso público a productos activos
- La configuración de envíos cubre las principales comunas de Santiago

PRÓXIMOS PASOS:
1. Ejecuta este script completo en Supabase SQL Editor
2. Verifica que el output muestre "✅ ÉXITO: Todas las tablas fueron creadas correctamente"
3. Ve a Storage y crea el bucket "imagenes" (público)
4. Configura las variables de entorno en Render
5. ¡A vender!
*/
