# ⚠️ QUÉ FALTA PARA QUE TU TIENDA FUNCIONE AL 100%

## 🎯 RESUMEN:

Tu tienda **SÍ está funcionando**, pero está vacía porque **Supabase no está configurado en Render**.

---

## ✅ LO QUE YA FUNCIONA:

- ✅ Código subido a GitHub
- ✅ Deploy en Render activo
- ✅ Diseño blanco/negro premium
- ✅ Panel admin con contraseña: `Avil5765.`
- ✅ Sin errores en el código

---

## ❌ LO QUE FALTA (5 minutos):

### **Necesitas configurar Supabase en Render**

Sin esto, la tienda NO puede:
- Cargar productos
- Guardar pedidos
- Mostrar el admin completo
- Funcionar

---

## 🚀 SOLUCIÓN (PASO A PASO):

### **PASO 1: Ve a Supabase**

1. Abre https://supabase.com
2. Inicia sesión
3. Click en tu proyecto (o crea uno nuevo si no tienes)

---

### **PASO 2: Obtén las credenciales**

1. En Supabase, ve a **Settings** (menú lateral)
2. Click en **API**
3. Copia estos 2 valores:

   **Project URL:**
   ```
   https://abcdefgh.supabase.co
   ```

   **service_role key (secret):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
   ```

   ⚠️ **IMPORTANTE:** Es la key "service_role", NO la "anon public"

---

### **PASO 3: Agrégalas en Render**

1. Ve a https://dashboard.render.com
2. Click en tu servicio "regalo-amor"
3. Click en **"Environment"** (menú lateral)
4. Click en **"Add Environment Variable"**

Agrega estas 3 variables:

#### Variable 1:
```
Key: SUPABASE_URL
Value: https://tuprojecto.supabase.co
```
*(Pega tu URL real)*

#### Variable 2:
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGc...
```
*(Pega tu key completa)*

#### Variable 3:
```
Key: SUPABASE_BUCKET_IMAGENES
Value: imagenes
```

5. Click en **"Save Changes"**
6. Espera 2-3 minutos (redeploy automático)

---

### **PASO 4: Crea las tablas en Supabase**

1. En Supabase, ve a **SQL Editor**
2. Click en **"New query"**
3. Abre el archivo [setup_database.sql](setup_database.sql)
4. Copia **TODO** el contenido
5. Pégalo en el SQL Editor
6. Click en **"RUN"**
7. Debe decir ✅ **"Success. No rows returned"**

---

### **PASO 5: Crea el bucket de imágenes**

1. En Supabase, ve a **Storage**
2. Click en **"Create a new bucket"**
3. Completa:
   - Name: `imagenes`
   - ✅ **Public bucket** (activar)
4. Click en **"Create bucket"**

5. Ahora configura las políticas:
   - Click en el bucket `imagenes`
   - Ve a **"Policies"**
   - Click en **"New Policy"** → **"For full customization"**

   **Política 1 - Lectura:**
   ```
   Policy name: Public read
   Allowed operation: SELECT
   Target roles: public
   USING expression: true
   ```

   **Política 2 - Escritura:**
   ```
   Policy name: Public insert
   Allowed operation: INSERT
   Target roles: public
   WITH CHECK expression: true
   ```

---

### **PASO 6: Verifica que funcione**

1. Espera 2-3 minutos después de guardar las variables en Render
2. Abre: `https://regalo-amor.onrender.com`
3. Presiona **F12** → Pestaña **Console**
4. Ya NO deberías ver errores rojos
5. Click en **"Panel"**
6. Contraseña: `Avil5765.`
7. ✅ **Deberías ver el dashboard completo**

---

## 🎯 CHECKLIST FINAL:

- [ ] Supabase URL agregada en Render
- [ ] Supabase Service Role Key agregada en Render
- [ ] SUPABASE_BUCKET_IMAGENES agregado en Render
- [ ] Variables guardadas en Render
- [ ] setup_database.sql ejecutado en Supabase
- [ ] Bucket "imagenes" creado y marcado como público
- [ ] Políticas del bucket configuradas
- [ ] Render hizo redeploy (2-3 min)
- [ ] Probaste entrar al admin

---

## ✅ CUANDO TERMINES ESTO:

Tu tienda funcionará al 100%:
- ✅ Podrás crear productos con fotos desde el admin
- ✅ Los productos aparecerán en la tienda
- ✅ El carrito funcionará
- ✅ Los pedidos se guardarán
- ✅ Todo operativo

---

## 🆘 SI TIENES PROBLEMAS:

1. Revisa los logs de Render para ver errores
2. Verifica que las credenciales estén correctas
3. Asegúrate de que el bucket sea PÚBLICO
4. Espera el redeploy completo (2-3 min)

---

## 📍 DOCUMENTACIÓN:

- [CONFIGURAR_RENDER.md](CONFIGURAR_RENDER.md) - Guía detallada
- [setup_database.sql](setup_database.sql) - SQL para ejecutar
- [COMO_EMPEZAR.md](COMO_EMPEZAR.md) - Guía completa

---

**Repositorio:** https://github.com/iag-lol/regalo-amor

**Todo el código está listo. Solo falta que configures Supabase.** 🚀
