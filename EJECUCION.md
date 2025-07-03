# 🚀 Guía de Ejecución - Career Plan System

## ✅ **Estructura Correcta del Proyecto**

```
app-dev/
├── docker-compose.yml          # ← AQUÍ está el archivo principal
├── docker-compose.prod.yml     # ← Para producción
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   └── ...
└── frontend/
    ├── Dockerfile              # Para producción
    ├── Dockerfile.dev          # Para desarrollo
    ├── src/
    └── ...
```

## 🐳 **Ejecución con Docker**

### **1. Navegar al directorio correcto**
```bash
cd Z:\Trabajos\TrabajoTesis\dev_akira2\app-dev
```

### **2. Ejecutar el sistema completo**
```bash
# Desarrollo (con hot reload)
docker-compose up --build

# En segundo plano
docker-compose up -d --build

# Producción
docker-compose -f docker-compose.prod.yml up --build
```

### **3. Verificar que todo esté funcionando**
- ✅ **Frontend**: http://localhost:3000
- ✅ **Backend API**: http://localhost:8000  
- ✅ **Documentación**: http://localhost:8000/docs
- ✅ **Base de datos**: localhost:3306

## 🔧 **Comandos Útiles**

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f frontend
docker-compose logs -f backend

# Parar servicios
docker-compose down

# Limpiar todo (incluyendo volúmenes)
docker-compose down -v

# Rebuilder solo un servicio
docker-compose up --build frontend
```

## 🐛 **Solución de Problemas**

### **Si el frontend no se levanta:**
```bash
# Verificar que el docker-compose.yml esté en app-dev/
ls docker-compose.yml

# Reconstruir contenedores
docker-compose down
docker-compose up --build
```

### **Si hay problemas de red:**
```bash
# Limpiar redes de Docker
docker network prune

# Verificar contenedores
docker-compose ps
```

### **Si la base de datos no conecta:**
```bash
# Esperar a que MySQL esté listo
docker-compose logs db

# Verificar salud de la DB
docker-compose exec db mysqladmin ping -h localhost -u root -p
```

## 🔄 **Desarrollo Local (Sin Docker)**

### **Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### **Base de datos:**
```bash
# Usar solo el contenedor de MySQL
docker-compose up db
```

## 📝 **Variables de Entorno**

Crear archivo `.env` en `frontend/`:
```env
VITE_API_URL=/api/v1
VITE_POWERBI_CLIENT_ID=your-client-id
VITE_POWERBI_WORKSPACE_ID=your-workspace-id
```

## ✨ **Usuarios de Prueba**

Una vez que el sistema esté funcionando, puedes usar:

- **Admin**: `admin` / `admin123`
- **Empleado**: `empleado` / `emp123`  
- **Supervisor**: `supervisor` / `sup123`

*Nota: Estos usuarios deben crearse a través de la API o inserción directa en la base de datos.*

## 🎯 **Verificación Final**

1. ✅ Frontend carga en http://localhost:3000
2. ✅ Login funciona correctamente  
3. ✅ Dashboard muestra datos por rol
4. ✅ API responde en http://localhost:8000/docs
5. ✅ Base de datos acepta conexiones

¡Listo para usar el sistema de capacitaciones! 🎉