-- ============================================
-- AGREGAR DESCUENTOS POR CANTIDAD A PRODUCTOS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor

-- 1. Agregar columna descuentos_cantidad a productos
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS descuentos_cantidad JSONB DEFAULT '[]'::jsonb;

-- 2. Agregar comentario explicativo
COMMENT ON COLUMN productos.descuentos_cantidad IS 'Array de objetos con niveles de descuento por cantidad. Ej: [{"cantidad": 3, "porcentaje": 10}, {"cantidad": 5, "porcentaje": 15}]';

-- 3. Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_productos_descuentos_cantidad
ON productos USING GIN (descuentos_cantidad);

-- 4. Ejemplo de cómo agregar descuentos por cantidad a un producto existente:
-- UPDATE productos
-- SET descuentos_cantidad = '[
--   {"cantidad": 2, "porcentaje": 5},
--   {"cantidad": 5, "porcentaje": 10},
--   {"cantidad": 10, "porcentaje": 15},
--   {"cantidad": 20, "porcentaje": 20}
-- ]'::jsonb
-- WHERE nombre = 'Tu Producto';

-- 5. Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Columna descuentos_cantidad agregada correctamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Formato del JSON:';
  RAISE NOTICE '[';
  RAISE NOTICE '  { "cantidad": 2, "porcentaje": 5 },   -- 2+ unidades = 5% descuento';
  RAISE NOTICE '  { "cantidad": 5, "porcentaje": 10 },  -- 5+ unidades = 10% descuento';
  RAISE NOTICE '  { "cantidad": 10, "porcentaje": 15 }, -- 10+ unidades = 15% descuento';
  RAISE NOTICE '  { "cantidad": 20, "porcentaje": 20 }  -- 20+ unidades = 20% descuento';
  RAISE NOTICE ']';
END $$;
