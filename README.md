# Career Plan - Sistema de Capacitaciones Viamatica

Sistema completo de gestión de capacitaciones desarrollado con FastAPI (backend) y React + TypeScript (frontend), containerizado con Docker.

## 🎯 Objetivo General

Desarrollar un sistema de capacitación que optimice la formación del talento humano mediante la asignación automatizada de cursos y el monitoreo del progreso a través de Power BI.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │    Database     │
│   React + TS    │◄──►│     FastAPI     │◄──►│      MySQL      │
│     + Vite      │    │    + SQLAlchemy │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │    Power BI     │              │
         └──────────────►│   Integration   │◄─────────────┘
                        └─────────────────┘
```

## 🚀 Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web moderno y rápido para APIs
- **SQLAlchemy**: ORM para manejo de base de datos
- **MySQL**: Base de datos relacional
- **Pydantic**: Validación de datos
- **Passlib**: Encriptación de contraseñas
- **Docker**: Containerización

### Frontend
- **React 18**: Biblioteca de JavaScript para interfaces de usuario
- **TypeScript**: Superset de JavaScript con tipado estático
- **Vite**: Build tool rápido y moderno
- **Tailwind CSS**: Framework de CSS utilitario
- **React Router**: Navegación de aplicaciones SPA
- **React Query**: Manejo de estado del servidor
- **Zustand**: Manejo de estado global
- **React Hook Form**: Manejo de formularios
- **Lucide React**: Iconos modernos

## 📁 Estructura del Proyecto

```
app-dev/
├── backend/
│   ├── main.py              # Punto de entrada de la API
│   ├── models.py            # Modelos de base de datos
│   ├── schemas.py           # Esquemas de validación
│   ├── database.py          # Configuración de base de datos
│   ├── requirements.txt     # Dependencias Python
│   ├── Dockerfile          # Imagen Docker backend
│   └── docker-compose.yml  # Orquestación de servicios
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Componentes UI reutilizables
│   │   │   ├── layout/          # Layout principal
│   │   │   └── powerbi/         # Componentes Power BI
│   │   ├── pages/               # Páginas de la aplicación
│   │   ├── services/            # Servicios API
│   │   ├── store/               # Estado global (Zustand)
│   │   ├── types/               # Tipos TypeScript
│   │   └── utils/               # Utilidades
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
```

## 👥 Roles del Sistema

### 1. Administrador del Sistema
- ✅ Gestionar plataforma completa
- ✅ Crear, modificar y eliminar cursos
- ✅ Gestionar usuarios
- ✅ Acceder a reportes generales en Power BI
- ❌ No puede tomar cursos

### 2. Área de Capacitación
- ✅ Diseñar y actualizar Plan de Carrera
- ✅ Asignar capacitaciones obligatorias
- ✅ Evaluar efectividad de cursos
- ✅ Acceder a reportes segmentados

### 3. Supervisor/Jefe de Área
- ✅ Ver progreso de su equipo
- ✅ Asignar capacitaciones adicionales
- ✅ Generar reportes de su equipo
- ❌ No puede modificar cursos

### 4. Empleado
- ✅ Ver cursos asignados
- ✅ Completar capacitaciones
- ✅ Elegir cursos adicionales
- ✅ Ver su progreso personal

### 5. Instructor
- ✅ Publicar sesiones presenciales
- ✅ Gestionar asistencias
- ✅ Subir materiales
- ✅ Validar finalización

### 6. Administrador de Reportes
- ✅ Acceso total a Power BI
- ✅ Generar informes
- ✅ Configurar dashboards

## 🚦 Instalación y Ejecución

### Prerrequisitos
- Docker
- Docker Compose
- Node.js 18+ (para desarrollo)
- Python 3.9+ (para desarrollo)

### 🐳 Ejecución con Docker (Recomendado)

1. **Navegar al directorio principal**
```bash
cd Z:\Trabajos\TrabajoTesis\dev_akira2\app-dev
```

2. **Ejecutar en modo desarrollo**
```bash
docker-compose up --build
```

3. **Para producción**
```bash
docker-compose -f docker-compose.prod.yml up --build
```

4. **Acceder a las aplicaciones**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs
- Base de datos MySQL: localhost:3306

### 🔧 Desarrollo Local

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Integración con Power BI

### Configuración

1. **Variables de entorno** (`.env`):
```env
VITE_POWERBI_CLIENT_ID=your-client-id
VITE_POWERBI_CLIENT_SECRET=your-client-secret
VITE_POWERBI_TENANT_ID=your-tenant-id
VITE_POWERBI_WORKSPACE_ID=your-workspace-id
```

2. **Configuración en Azure AD**:
- Registrar aplicación en Azure AD
- Configurar permisos para Power BI Service API
- Obtener credenciales de cliente

### Embedimiento de Reportes

Los reportes de Power BI se embeben utilizando iframes con autenticación:

```typescript
<PowerBIEmbed
  reportId="report-guid"
  embedUrl="https://app.powerbi.com/reportEmbed?..."
  accessToken="access-token"
  title="Dashboard de Capacitaciones"
/>
```

### Reportes Incluidos

#### Para Administradores
- 📊 Estadísticas globales de capacitación
- 👥 Número total de empleados en capacitación
- 📈 % de empleados que completaron cursos obligatorios
- 🏆 Cursos más y menos populares
- 🏢 Comparación por cliente/empresa

#### Para Área de Capacitación
- 📋 Efectividad de capacitaciones
- 📅 Progreso del plan anual
- 📊 Métricas de cumplimiento por curso

#### Para Supervisores
- 👥 Progreso del equipo asignado
- ⚠️ Alertas de capacitaciones pendientes
- 📈 Reportes de cumplimiento del equipo

#### Para Empleados
- 📚 Progreso personal
- 🎯 Cursos asignados vs completados
- 🏅 Certificaciones obtenidas

## 🗄️ Base de Datos

### Entidades Principales

- **Personas**: Datos personales (DNI, nombres, email)
- **Usuarios**: Autenticación y roles
- **Cursos**: Capacitaciones disponibles
- **Planes de Carrera**: Agrupaciones de cursos
- **Asignaciones**: Usuarios asignados a planes
- **Catálogos**: Géneros, roles, tecnologías, modalidades

### Diagrama de Relaciones

```
Person ──► User ──► UserCareerPlan ──► CareerPlan ──► Course
   │         │           │               │            │
   │         │           │               │            ├── Technology
   │         │           │               │            └── CourseModality
   │         │           │               │
   │         ├── Role     │               │
   │         └── Position │               │
   │                     │               │
   └── Gender            └── Status       └── Course Details
```

## 🔐 Autenticación y Seguridad

- **Hashing de contraseñas**: bcrypt
- **Validación de datos**: Pydantic schemas
- **Autorización basada en roles**: Middleware personalizado
- **CORS configurado**: Para desarrollo y producción

## 📱 Interfaz de Usuario

### Características del Frontend

- **Responsive Design**: Adaptable a móviles y escritorio
- **Dark/Light Mode**: Soporte para temas
- **Navegación por roles**: Menús dinámicos según permisos
- **Formularios validados**: Con React Hook Form
- **Estado optimista**: Actualizaciones instantáneas con rollback
- **Lazy Loading**: Carga bajo demanda de componentes

### Páginas Principales

1. **Login**: Autenticación con validación
2. **Dashboard**: Vista general personalizada por rol
3. **Cursos**: CRUD completo de capacitaciones
4. **Usuarios**: Gestión de empleados (solo admin)
5. **Planes de Carrera**: Diseño de rutas de aprendizaje
6. **Reportes**: Dashboards de Power BI embebidos
7. **Mi Progreso**: Vista personal del empleado

## 🔄 API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/v1/users` - Listar usuarios
- `POST /api/v1/users` - Crear usuario
- `GET /api/v1/users/{id}` - Obtener usuario
- `PUT /api/v1/users/{id}` - Actualizar usuario
- `DELETE /api/v1/users/{id}` - Eliminar usuario

### Cursos
- `GET /api/v1/courses` - Listar cursos
- `POST /api/v1/courses` - Crear curso
- `GET /api/v1/courses/{id}` - Obtener curso
- `PUT /api/v1/courses/{id}` - Actualizar curso
- `DELETE /api/v1/courses/{id}` - Eliminar curso

### Planes de Carrera
- `GET /api/v1/career-plans` - Listar planes
- `POST /api/v1/career-plans` - Crear plan
- `GET /api/v1/user-career-plans/user/{id}` - Planes por usuario

### Catálogos
- `GET /api/v1/roles` - Roles del sistema
- `GET /api/v1/technologies` - Tecnologías
- `GET /api/v1/modalities` - Modalidades de curso
- `GET /api/v1/positions` - Posiciones/cargos

## 🧪 Testing

### Backend
```bash
# Instalar dependencias de testing
pip install pytest pytest-asyncio httpx

# Ejecutar tests
pytest
```

### Frontend
```bash
# Instalar dependencias de testing
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Ejecutar tests
npm test
```

## 📈 Métricas y Monitoreo

### Power BI Dashboards

1. **Dashboard Ejecutivo**
   - KPIs principales
   - Tendencias mensuales
   - Comparaciones año anterior

2. **Dashboard Operativo**
   - Progreso en tiempo real
   - Alertas automáticas
   - Métricas por equipo

3. **Dashboard Individual**
   - Progreso personal
   - Recomendaciones
   - Certificaciones pendientes

## 🚀 Despliegue en Producción

### Configuración de Producción

1. **Variables de entorno**:
```env
DATABASE_URL=mysql+pymysql://user:pass@host/db
CORS_ORIGINS=["https://yourdomain.com"]
SECRET_KEY=your-secret-key
```

2. **Docker Compose para producción**:
```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### SSL/HTTPS
- Configurar certificados SSL
- Redirigir HTTP a HTTPS
- Configurar HSTS headers

## 🔧 Mantenimiento

### Backup de Base de Datos
```bash
docker exec mysql-container mysqldump -u root -p career_plan_db > backup.sql
```

### Actualización de Dependencias
```bash
# Backend
pip list --outdated
pip install -U package-name

# Frontend
npm outdated
npm update
```

### Logs y Monitoreo
- Logs centralizados con ELK Stack
- Métricas de aplicación con Prometheus
- Alertas automáticas con Grafana

## 📚 Documentación Adicional

- [API Documentation](http://localhost:8000/docs) - Swagger UI interactiva
- [Power BI Integration Guide](./docs/powerbi-setup.md)
- [Database Schema](./docs/database-schema.md)
- [User Manual](./docs/user-manual.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 👥 Equipo de Desarrollo

- **Backend**: FastAPI + SQLAlchemy + MySQL
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **DevOps**: Docker + Docker Compose
- **BI**: Power BI + Azure Integration

---

**Desarrollado para Viamatica** - Sistema de Capacitaciones v1.0.0