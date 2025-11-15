# Regalos Personalizados con Flow + Supabase

Aplicación fullstack lista para Render que permite vender regalos personalizados, gestionar pedidos y cobrar con Flow.

## Requisitos previos

- Node.js 18+
- Cuenta Supabase (tablas indicadas en el código)
- Credenciales Flow (sandbox o producción)

## Configuración

1. Copia `.env.example` a `.env` y completa las variables.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor en desarrollo:
   ```bash
   npm start
   ```
4. Render despliega automáticamente ejecutando `npm install` y `npm start`.

## Notas

- Los archivos estáticos viven en `/public`.
- La ruta `/api/flow/confirmacion` debe estar disponible públicamente para recibir confirmaciones de Flow.
- Para el panel admin usa el header `x-admin-token` con la contraseña definida en `ADMIN_PASSWORD`.
