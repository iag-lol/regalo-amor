-- ============================================
-- REGALO AMOR - ACTUALIZAR POLÍTICAS RLS
-- ============================================
-- Ejecuta este script para CORREGIR las políticas de seguridad
-- sin tener que recrear todas las tablas
-- ============================================

-- Habilitar RLS en todas las tablas (por si no está)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE sii_estado ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTOS: Lectura pública, escritura admin
-- ============================================
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

-- ============================================
-- CONFIG ENVIOS: Lectura pública, escritura admin
-- ============================================
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

-- ============================================
-- CLIENTES: Inserción/actualización pública, consulta admin
-- ============================================
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

-- ============================================
-- PEDIDOS: Inserción/actualización pública (para Flow), consulta admin
-- ============================================
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

-- ============================================
-- METRICAS: Inserción/actualización pública (para tracking), consulta admin
-- ============================================
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

-- ============================================
-- SII: Solo admin
-- ============================================
DROP POLICY IF EXISTS "Admin puede todo en sii" ON sii_estado;
CREATE POLICY "Admin puede todo en sii"
  ON sii_estado FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS actualizadas correctamente';
  RAISE NOTICE '   - Productos: Lectura pública (activo=true), escritura admin';
  RAISE NOTICE '   - Config envíos: Lectura pública, escritura admin';
  RAISE NOTICE '   - Clientes: Insert/Update público, consulta admin';
  RAISE NOTICE '   - Pedidos: Insert/Update público, consulta admin';
  RAISE NOTICE '   - Métricas: Insert/Update público, consulta admin';
  RAISE NOTICE '   - SII: Solo admin';
END $$;
