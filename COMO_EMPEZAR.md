# 🎯 CÓMO EMPEZAR CON TU TIENDA - REGALO AMOR

## 📋 RESUMEN RÁPIDO

Tu tienda está **100% lista** para funcionar. Solo necesitas configurar Supabase y opcionalmente Flow.

### ✅ Lo que ya funciona:
- ✅ **Formulario de productos** con subida de fotos
- ✅ **Carrito de compras** completo
- ✅ **Checkout** con personalización
- ✅ **Panel de admin** con CRUD completo
- ✅ **Integración con Flow** para pagos
- ✅ **Diseño premium** blanco/negro responsivo

---

## 🚀 PASOS PARA EMPEZAR (30 minutos)

### PASO 1: CONFIGURAR SUPABASE (OBLIGATORIO)

**1.1 Crear proyecto**
```
1. Ve a https://supabase.com
2. Crear cuenta
3. New Project → regalo-amor
4. Espera 2-3 minutos
```

**1.2 Ejecutar SQL**
```
1. Ve a SQL Editor
2. Abre el archivo: setup_database.sql
3. Copia TODO
4. Pega en SQL Editor
5. Click en RUN
6. Debe decir "Success"
```

**1.3 Crear bucket de fotos**
```
1. Ve a Storage
2. Create new bucket
3. Nombre: imagenes
4. ✅ Marcar como PÚBLICO
5. Create
```

**1.4 Configurar políticas del bucket (MUY IMPORTANTE)**
```
1. Storage → imagenes → Policies
2. New Policy → For full customization

Política 1 - Lectura pública:
  - Name: Public read
  - Operation: SELECT
  - Target roles: public
  - USING: true

Política 2 - Subida:
  - Name: Public insert
  - Operation: INSERT
  - Target roles: public, authenticated, anon
  - WITH CHECK: true

Política 3 - Actualización:
  - Name: Public update
  - Operation: UPDATE
  - Target roles: public, authenticated, anon
  - USING: true
  - WITH CHECK: true
```

**1.5 Obtener credenciales**
```
1. Settings → API
2. Copiar:
   - Project URL
   - Service role key (empieza con eyJ...)
```

**1.6 Actualizar .env**
```env
SUPABASE_URL=https://tuprojecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu_key_completa
```

---

### PASO 2: INICIAR SERVIDOR

```bash
cd tienda-flow
npm install
npm run dev
```

Deberías ver:
```
Servidor escuchando en puerto 3000
```

---

### PASO 3: PROBAR EL ADMIN

```
1. http://localhost:3000
2. Click en "Panel"
3. Contraseña: RegaloAmor2024
4. ✅ Entras al dashboard
```

---

### PASO 4: CREAR TU PRIMER PRODUCTO CON FOTO

**En el admin:**

```
1. Pestaña "Productos"
2. Click "+ Nuevo producto"
3. Completa:
   - Nombre: Taza Personalizada
   - Categoría: Tazas
   - Precio: 8990
   - Stock: 50
   - Descuento: 0
   - Descripción: Taza de cerámica personalizada
4. FOTO: Click en "Elegir archivo"
   - Selecciona una imagen
   - Verás el preview
5. Click "Guardar producto"
```

**¡La foto se sube automáticamente a Supabase!**

---

### PASO 5: VER EL PRODUCTO EN LA TIENDA

```
1. Ve a http://localhost:3000
2. Scroll a "Nuestros productos"
3. ✅ Tu producto aparece con la foto
```

---

### PASO 6: PROBAR EL CARRITO

```
1. Click "Agregar" en un producto
2. ✅ El carrito flotante muestra "1 productos"
3. Click en el carrito flotante
4. ✅ Se abre el panel de checkout
```

---

### PASO 7: PROBAR EL CHECKOUT

```
1. Completa el formulario:
   - Nombre, RUT, Email
   - Dirección, Comuna
   - Teléfonos
   - Fecha y horario de envío
   - Mensaje personalizado
   - Sube una foto (opcional)
2. Click "Confirmar y pagar"
```

**SIN Flow configurado:**
- Te dará error al intentar pagar
- Pero el pedido SE GUARDÓ en la base de datos
- Puedes verlo en el admin → Pedidos

**CON Flow configurado:**
- Te redirige a Flow
- Pagas
- Vuelves a la página de gracias
- El pedido queda como "pagado"

---

## 💳 CONFIGURAR FLOW (OPCIONAL - PARA PAGOS)

### Opción 1: SANDBOX (Pruebas)

```
1. Ve a https://www.flow.cl
2. Crear cuenta
3. Ir a integraciones
4. Crear integración SANDBOX
5. Copiar API Key y Secret Key
```

En `.env`:
```env
FLOW_API_KEY=tu_sandbox_api_key
FLOW_API_SECRET=tu_sandbox_secret_key
FLOW_ENV=sandbox
```

### Opción 2: PRODUCCIÓN (Pagos reales)

```
1. Cuenta Flow verificada
2. RUT de empresa
3. Credenciales de PRODUCCIÓN
```

En `.env`:
```env
FLOW_API_KEY=tu_production_api_key
FLOW_API_SECRET=tu_production_secret_key
FLOW_ENV=production
```

**Reinicia el servidor después de cambiar el .env**

---

## 📸 CÓMO FUNCIONA LA SUBIDA DE FOTOS

### Cuando CREAS un producto:

1. Seleccionas foto → Preview en el modal
2. Click "Guardar producto"
3. La foto se convierte a base64
4. Se sube a Supabase Storage
5. Se genera URL pública
6. Se guarda en la base de datos
7. ✅ La foto aparece en el producto

### Cuando EDITAS un producto:

1. Ves la foto actual
2. Opcional: Cambiar foto
3. Si cambias: Nueva foto se sube
4. Si no: Mantiene la foto actual
5. ✅ Actualizado

---

## 🛒 CÓMO FUNCIONA EL CARRITO

### Flujo completo:

```
1. Cliente agrega productos
   ↓
2. Carrito flotante muestra total
   ↓
3. Click en carrito o "Personalizar"
   ↓
4. Panel de checkout se abre
   ↓
5. Cliente llena formulario
   ↓
6. Cliente sube foto de inspiración
   ↓
7. Click "Confirmar y pagar"
   ↓
8. Se crea:
   - Cliente en BD (si no existe)
   - Pedido en BD
   - Foto de personalización en Supabase
   ↓
9. Se llama a Flow API
   ↓
10. Cliente es redirigido a Flow
   ↓
11. Cliente paga
   ↓
12. Flow notifica a tu servidor
   ↓
13. Pedido se marca como "pagado"
   ↓
14. Cliente ve página de gracias
```

---

## 🎨 PERSONALIZACIÓN DE PRODUCTOS

Cada pedido puede incluir:

- ✅ **Texto personalizado** (hasta 240 caracteres)
- ✅ **Tipo de diseño**:
  - Solo texto
  - Texto + imagen
  - Ilustración personalizada
- ✅ **Foto de inspiración** (subida por el cliente)
- ✅ **Fecha y horario de entrega**

Todo se guarda en la base de datos para que puedas procesarlo.

---

## 📊 GESTIÓN DESDE EL ADMIN

### Dashboard

- Pedidos de hoy
- Stock bajo
- Métricas de 7 días
- Control SII (impuestos)

### Productos

- Ver todos los productos
- Crear nuevos (con foto)
- Editar existentes
- Eliminar (soft delete)
- Filtrar por categoría
- Buscar por nombre

### Pedidos

- Ver todos los pedidos
- Filtrar por estado
- Ver detalles completos
- Ver personalización del cliente

### Configuración

- Días de envío
- Horarios disponibles
- Comunas que cubres
- Costo de envío

---

## ✅ CHECKLIST COMPLETO

- [ ] Supabase configurado
- [ ] SQL ejecutado (tablas creadas)
- [ ] Bucket `imagenes` creado y PÚBLICO
- [ ] Políticas del bucket configuradas
- [ ] .env actualizado con credenciales
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Puedo entrar al admin
- [ ] Puedo crear producto con foto
- [ ] La foto se ve en la tienda
- [ ] Puedo agregar al carrito
- [ ] El checkout se abre
- [ ] Puedo llenar formulario
- [ ] (Opcional) Flow configurado

---

## 🔥 TIPS PROFESIONALES

### Para las fotos de productos:

- Usa imágenes de 800x800px mínimo
- Fondo blanco o transparente
- Formato JPG o PNG
- Máximo 2-3 MB por imagen
- Buena iluminación

### Para las categorías:

- Mantén nombres simples: "Tazas", "Poleras", etc.
- No uses tildes en las categorías
- Sé consistente con mayúsculas

### Para los precios:

- Usa números redondos: 8990, 12990
- Si pones descuento, se verá el precio tachado
- El descuento es en porcentaje (0-100)

### Para el stock:

- Actualízalo regularmente
- Stock bajo (<10) aparecerá en alertas del admin
- Stock 0 = producto se puede vender igual (pedido bajo demanda)

---

## 🆘 PROBLEMAS COMUNES Y SOLUCIONES

### ❌ "Error al obtener productos"

```
Causa: Supabase no configurado o tablas no existen

Solución:
1. Verifica SUPABASE_URL en .env
2. Verifica SUPABASE_SERVICE_ROLE_KEY en .env
3. Ejecuta setup_database.sql en Supabase
4. Reinicia el servidor
```

### ❌ "Error al subir imagen"

```
Causa: Bucket no existe o no es público

Solución:
1. Ve a Supabase → Storage
2. Verifica que existe "imagenes"
3. Debe estar marcado como PÚBLICO
4. Configura las 3 políticas (ver PASO 1.4)
```

### ❌ "Las imágenes no se ven"

```
Causa: Falta política de lectura pública

Solución:
1. Storage → imagenes → Policies
2. Debe existir política SELECT con public
3. USING debe ser: true
```

### ❌ "Error al crear pedido"

```
Causa: Flow no configurado

Solución:
Si quieres probar SIN Flow:
- El error es normal
- El pedido SÍ se guarda en BD
- Puedes verlo en admin → Pedidos

Si quieres que funcione:
- Configura Flow (ver PASO 7)
- Reinicia el servidor
```

---

## 🎉 ¡LISTO!

Tu tienda **Regalo Amor** está funcionando al 100% con:

✅ Base de datos en Supabase
✅ Sistema de fotos completo
✅ CRUD de productos funcionando
✅ Carrito y checkout
✅ Integración con Flow lista
✅ Panel admin profesional
✅ Diseño premium responsivo

**Ahora solo falta:**
1. Agregar tus productos reales
2. Configurar Flow cuando quieras recibir pagos
3. ¡Vender!

---

## 📞 SIGUIENTE PASO

**Despliega en producción con Render:**
Ve al archivo `README_REGALO_AMOR.md` para instrucciones de deployment.

**O continúa configurando:**
1. Agrega más productos
2. Configura días de envío
3. Prueba el flujo completo
4. Cambia la contraseña del admin

---

**¿Dudas?** Revisa:
- SETUP_COMPLETO.md (guía detallada)
- INICIO_RAPIDO.md (guía en español simplificada)
- RESUMEN_MEJORAS.md (todo lo que se implementó)
