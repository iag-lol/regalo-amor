# 🚀 Inicio Rápido - Regalo Amor

## ✅ Problemas solucionados

1. ✅ **Textos simplificados** - Ya no suenan pretenciosos
2. ✅ **Admin arreglado** - Contraseña por defecto configurada
3. ✅ **Archivo .env creado** - Con configuración base

---

## 📝 Paso 1: Configurar Supabase (OBLIGATORIO)

### 1.1 Obtener credenciales

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto o selecciona uno existente
4. Ve a **Settings** → **API**
5. Copia estos datos:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **Service role key** (empieza con `eyJ...`)

### 1.2 Actualizar el .env

Abre el archivo `.env` y reemplaza:
```
SUPABASE_URL=TU_SUPABASE_URL_AQUI
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_AQUI
```

Por tus valores reales:
```
SUPABASE_URL=https://tuprojecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu_key_aqui
```

### 1.3 Crear las tablas

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `setup_database.sql` que está en tu proyecto
3. Copia TODO el contenido
4. Pégalo en el SQL Editor
5. Click en **RUN** o **Ejecutar**
6. Debería decir "Success" ✅

### 1.4 Crear el bucket de imágenes

1. En Supabase, ve a **Storage**
2. Click en **New bucket**
3. Nombre: `imagenes`
4. **Marca como público** ✅
5. Click en **Create**

---

## 🚀 Paso 2: Iniciar el servidor

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

## 🔐 Paso 3: Acceder al admin

1. Abre tu navegador en `http://localhost:3000`
2. Click en **"Panel"** en el header
3. Ingresa la contraseña: **`RegaloAmor2024`**
4. ¡Listo! Ya estás en el admin

### Cambiar la contraseña (recomendado)

Edita el `.env`:
```
ADMIN_PASSWORD=TuNuevaContraseñaSegura123
```

Reinicia el servidor (Ctrl+C y luego `npm run dev`)

---

## 📦 Paso 4: Agregar tus primeros productos

1. En el admin, ve a la pestaña **"Productos"**
2. Click en **"+ Nuevo producto"**
3. Completa:
   - **Nombre**: Taza Personalizada
   - **Categoría**: Tazas
   - **Precio**: 8990
   - **Stock**: 50
   - **Descripción**: Taza de cerámica personalizable
4. Sube una imagen (opcional por ahora)
5. Click en **"Guardar producto"**

---

## 🎉 ¡Ya está funcionando!

Ahora puedes:
- ✅ Ver productos en la página principal
- ✅ Agregar productos desde el admin
- ✅ Editar precios y stock
- ✅ Filtrar por categorías

---

## ⚠️ Problemas comunes

### "No puedo entrar al admin"

✅ **Solución**: Usa la contraseña `RegaloAmor2024`

Si no funciona, verifica que el archivo `.env` tenga:
```
ADMIN_PASSWORD=RegaloAmor2024
```

### "No se ven productos"

✅ **Solución**:
1. Verifica que ejecutaste el SQL en Supabase
2. Verifica que el `.env` tenga las credenciales correctas
3. Reinicia el servidor

### "Error al subir imágenes"

✅ **Solución**:
1. Ve a Supabase → Storage
2. Verifica que existe el bucket `imagenes`
3. Verifica que esté marcado como **público**

---

## 📱 Flow (Opcional - para pagos)

Si quieres activar los pagos con Flow:

1. Ve a [https://www.flow.cl](https://www.flow.cl)
2. Crea una cuenta
3. Obtén tus credenciales de **SANDBOX** (para pruebas)
4. Agrégalas al `.env`:

```
FLOW_API_KEY=tu_api_key_aqui
FLOW_SECRET_KEY=tu_secret_key_aqui
```

**Nota**: Por ahora puedes dejar Flow sin configurar. La tienda funciona igual, solo no podrás procesar pagos.

---

## 🆘 ¿Necesitas ayuda?

Si algo no funciona:

1. Revisa la consola del navegador (F12)
2. Revisa la terminal donde corre el servidor
3. Verifica que todas las credenciales del `.env` estén bien

---

## ✅ Checklist rápido

- [ ] Archivo `.env` configurado con Supabase
- [ ] Tablas creadas en Supabase (SQL ejecutado)
- [ ] Bucket `imagenes` creado y público
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Puedo entrar al admin con `RegaloAmor2024`
- [ ] Puedo agregar productos desde el admin
- [ ] Los productos se ven en la página principal

**Si todos están ✅, ¡tu tienda está lista! 🎉**
