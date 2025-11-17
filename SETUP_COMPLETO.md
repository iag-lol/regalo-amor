# 🚀 SETUP COMPLETO - REGALO AMOR

## PASO 1: CONFIGURAR SUPABASE (15 minutos)

### 1.1 Crear cuenta y proyecto

1. Ve a https://supabase.com
2. Click en "Start your project"
3. Crea una cuenta con Google o GitHub
4. Click en "New Project"
5. Completa:
   - Name: `regalo-amor` (o el que quieras)
   - Database Password: Guárdala bien (la necesitarás)
   - Region: South America (São Paulo) - más cercano a Chile
6. Click en "Create new project"
7. **Espera 2-3 minutos** mientras se crea el proyecto

---

## PASO 2: CREAR LAS TABLAS EN SUPABASE

### 2.1 Ejecutar el SQL

1. En Supabase, ve al menú lateral → **SQL Editor**
2. Click en **"+ New query"**
3. Abre el archivo `setup_database.sql` de tu proyecto
4. **Copia TODO el contenido** del archivo
5. Pégalo en el SQL Editor de Supabase
6. Click en **"RUN"** (abajo a la derecha)
7. Deberías ver: ✅ **"Success. No rows returned"**

### 2.2 Verificar que se crearon las tablas

Ejecuta esta consulta en el SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Deberías ver estas tablas:
- ✅ productos
- ✅ clientes
- ✅ pedidos
- ✅ config_envios
- ✅ metricas_diarias
- ✅ sii_estado

---

## PASO 3: CREAR BUCKET PARA IMÁGENES

### 3.1 Crear el bucket

1. En Supabase, ve a **Storage** (menú lateral)
2. Click en **"Create a new bucket"**
3. Completa:
   - **Name**: `imagenes` (exactamente así, sin mayúsculas)
   - **Public bucket**: ✅ **ACTIVAR ESTO** (muy importante)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/png, image/jpeg, image/jpg, image/webp`
4. Click en **"Create bucket"**

### 3.2 Configurar políticas de acceso (IMPORTANTE)

1. En Storage, click en el bucket `imagenes`
2. Ve a la pestaña **"Policies"**
3. Click en **"New Policy"**
4. Selecciona **"For full customization"**

**Primera política - SELECT (para ver imágenes):**
```sql
Policy name: Public read access
Allowed operation: SELECT
Target roles: public
USING expression: true
```

**Segunda política - INSERT (para subir imágenes):**
```sql
Policy name: Authenticated insert
Allowed operation: INSERT
Target roles: authenticated, anon, public
WITH CHECK expression: true
```

**Tercera política - UPDATE (para actualizar):**
```sql
Policy name: Authenticated update
Allowed operation: UPDATE
Target roles: authenticated, anon, public
USING expression: true
WITH CHECK expression: true
```

---

## PASO 4: OBTENER CREDENCIALES DE SUPABASE

1. En Supabase, ve a **Settings** → **API**
2. Copia estos datos:

   - **Project URL**:
     ```
     Ejemplo: https://abcdefghijk.supabase.co
     ```

   - **Service role key** (secret):
     ```
     Empieza con: eyJhbGc...
     ⚠️ NUNCA compartas esta key públicamente
     ```

3. Abre el archivo `.env` en tu proyecto

4. Reemplaza estas líneas:
   ```env
   SUPABASE_URL=https://tuprojecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu_key_completa_aqui
   ```

---

## PASO 5: CONFIGURAR FLOW (PAGOS)

### 5.1 Crear cuenta en Flow

1. Ve a https://www.flow.cl
2. Click en **"Registro"** → **"Persona"** o **"Empresa"**
3. Completa el formulario de registro
4. Verifica tu email

### 5.2 Obtener credenciales SANDBOX (para pruebas)

1. Inicia sesión en Flow
2. Ve a **"Mis integraciones"**
3. Click en **"Crear nueva integración"**
4. Selecciona **"Modo Sandbox"** (para pruebas)
5. Copia:
   - **API Key**
   - **Secret Key**

### 5.3 Configurar credenciales en .env

Abre `.env` y actualiza:

```env
# Para SANDBOX (pruebas)
FLOW_API_KEY=tu_api_key_de_flow
FLOW_SECRET_KEY=tu_secret_key_de_flow
FLOW_API_URL=https://sandbox.flow.cl/api

# Cuando vayas a producción, cambia a:
# FLOW_API_URL=https://www.flow.cl/api
```

---

## PASO 6: ARCHIVO .ENV COMPLETO

Tu archivo `.env` debe verse así:

```env
# Puerto del servidor
PORT=3000

# URL base
BASE_URL=http://localhost:3000

# Contraseña admin
ADMIN_PASSWORD=RegaloAmor2024

# SUPABASE - Reemplaza con tus credenciales reales
SUPABASE_URL=https://tuprojecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET_IMAGENES=imagenes

# FLOW - Reemplaza con tus credenciales reales
FLOW_API_KEY=tu_flow_api_key
FLOW_SECRET_KEY=tu_flow_secret_key
FLOW_API_URL=https://sandbox.flow.cl/api
```

---

## PASO 7: INICIAR LA APLICACIÓN

```bash
# 1. Abre la terminal en la carpeta del proyecto
cd tienda-flow

# 2. Instala dependencias (solo la primera vez)
npm install

# 3. Inicia el servidor
npm run dev
```

Deberías ver:
```
Servidor escuchando en puerto 3000
```

---

## PASO 8: PROBAR TODO EL SISTEMA

### 8.1 Acceder al admin

1. Abre http://localhost:3000
2. Click en **"Panel"**
3. Contraseña: `RegaloAmor2024`
4. ✅ Deberías entrar al dashboard

### 8.2 Crear tu primer producto con imagen

1. En el admin, ve a la pestaña **"Productos"**
2. Click en **"+ Nuevo producto"**
3. Completa:
   - **Nombre**: Taza Personalizada Premium
   - **Categoría**: Tazas
   - **Precio**: 12990
   - **Stock**: 50
   - **Descuento**: 10
   - **Descripción**: Taza de cerámica de alta calidad con impresión personalizada
   - **Imagen**: Click en "Elegir archivo" y sube una foto
4. Click en **"Guardar producto"**
5. ✅ El producto aparecerá en la tabla con su imagen

### 8.3 Ver el producto en la tienda

1. Abre http://localhost:3000
2. Scroll hasta "Nuestros productos"
3. ✅ Deberías ver tu producto con la imagen que subiste

### 8.4 Probar el carrito de compras

1. En la tienda, click en **"Agregar"** en algún producto
2. ✅ El carrito flotante debe mostrar "1 productos"
3. Click en el carrito flotante
4. ✅ Se abre el panel de checkout

### 8.5 Probar el flujo de compra completo

1. Agrega productos al carrito
2. Click en **"Personalizar"** (botón del header)
3. Completa todos los campos:
   - Nombre, RUT, Email
   - Dirección, Comuna
   - Teléfonos
   - Día y horario de envío
   - Mensaje personalizado
   - Sube una imagen de inspiración
4. Click en **"Confirmar y pagar"**
5. ✅ Serás redirigido a Flow para pagar

---

## PASO 9: VERIFICAR QUE TODO FUNCIONE

### Checklist de verificación:

- [ ] ✅ Supabase conectado (no hay errores en consola)
- [ ] ✅ Bucket `imagenes` creado y público
- [ ] ✅ Puedo entrar al admin con la contraseña
- [ ] ✅ Puedo crear productos
- [ ] ✅ Puedo subir imágenes a los productos
- [ ] ✅ Las imágenes se ven en la tabla del admin
- [ ] ✅ Las imágenes se ven en la tienda pública
- [ ] ✅ Puedo agregar productos al carrito
- [ ] ✅ El carrito flotante funciona
- [ ] ✅ El checkout se abre correctamente
- [ ] ✅ Los días y horarios de envío se cargan
- [ ] ✅ Flow está configurado (o puedo probarlo después)

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### "Error al obtener productos"

**Causa**: Supabase no está configurado o las tablas no existen

**Solución**:
1. Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén en `.env`
2. Ejecuta el SQL de nuevo en Supabase SQL Editor
3. Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)

### "Error al subir imagen"

**Causa**: El bucket no existe o no es público

**Solución**:
1. Ve a Supabase → Storage
2. Verifica que existe el bucket `imagenes`
3. Verifica que esté marcado como **público**
4. Agrega las políticas de acceso (ver PASO 3.2)

### "Las imágenes no se ven"

**Causa**: Las políticas del bucket no están configuradas

**Solución**:
1. Ve a Storage → imagenes → Policies
2. Asegúrate de tener la política "Public read access"
3. Si no existe, créala según PASO 3.2

### "No puedo pagar con Flow"

**Causa**: Flow no está configurado o estás en modo sandbox sin cuenta

**Solución**:
1. Verifica que `FLOW_API_KEY` y `FLOW_API_SECRET` estén en `.env`
2. Para pruebas, usa las credenciales de SANDBOX de Flow
3. Para producción real, necesitas una cuenta Flow verificada

**IMPORTANTE**: Si no tienes Flow configurado todavía, la tienda funcionará pero el botón de pago dará error. Esto es normal. Configura Flow cuando estés listo para recibir pagos reales.

**Modo de prueba SIN Flow**:
Puedes probar todo el flujo hasta el momento del pago. El sistema creará el pedido en la base de datos, guardará todos los datos del cliente y su personalización. Solo faltará el pago real.

---

## 🎉 ¡LISTO PARA VENDER!

Una vez completados todos los pasos, tu tienda está funcionando al 100%:

✅ Base de datos funcionando
✅ Sistema de imágenes operativo
✅ Panel admin completo
✅ Carrito de compras
✅ Integración con Flow
✅ Sistema de envíos
✅ Todo responsivo y profesional

---

## 📞 PRÓXIMOS PASOS

1. **Agrega productos reales** con fotos de calidad
2. **Configura días y horarios de envío** en Admin → Configuración
3. **Cambia la contraseña del admin** en `.env`
4. **Prueba el flujo completo** de compra
5. **Cuando estés listo**, pasa Flow a modo producción
6. **Despliega en Render** (instrucciones en README)

---

**¿Necesitas ayuda?** Revisa la consola del navegador (F12) y la terminal donde corre el servidor.
