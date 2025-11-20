-- ============================================
-- ACTUALIZAR ESTADOS DE PEDIDOS
-- ============================================
-- Ejecuta esto en Supabase para agregar los nuevos estados

-- 1. Eliminar constraint de tipo_diseno (causa errores)
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_tipo_diseno_check;

-- 2. Eliminar constraint de estado viejo
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;

-- 3. Agregar nuevo constraint con TODOS los estados
ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN (
    'pendiente_pago',
    'pagado',
    'rechazado',
    'anulado',
    'cancelado',
    'en_proceso',
    'terminado',
    'enviado',
    'entregado',
    'completado'
  ));

-- 4. Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Estados de pedidos actualizados correctamente';
  RAISE NOTICE 'Estados disponibles:';
  RAISE NOTICE '  - pendiente_pago: Cliente aún no paga';
  RAISE NOTICE '  - pagado: Pago confirmado';
  RAISE NOTICE '  - en_proceso: Trabajando en el pedido';
  RAISE NOTICE '  - terminado: Producto listo';
  RAISE NOTICE '  - enviado: En camino al cliente';
  RAISE NOTICE '  - entregado: Cliente lo recibió';
  RAISE NOTICE '  - cancelado: Pedido cancelado';
END $$;
