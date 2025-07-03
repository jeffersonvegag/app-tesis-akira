# CLAUDE.md - Guía de trabajo para el proyecto Career Plan

## Información General del Proyecto
- **Nombre**: Career Plan - Sistema de Capacitaciones Viamatica
- **Tipo**: Aplicación Full Stack (FastAPI + React + TypeScript)
- **Base de datos**: MySQL
- **Contenedores**: Docker y Docker Compose

## Comandos Importantes

### Desarrollo
```bash
# Ejecutar proyecto completo
docker-compose up --build

# Ejecutar solo backend
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Ejecutar solo frontend
cd frontend && npm run dev
```

### Testing y Validación
```bash
# Frontend - Lint
cd frontend && npm run lint

# Frontend - Build
cd frontend && npm run build

# Backend - Podría tener tests con pytest (verificar si existen)
```

## Estructura del Proyecto

### Backend (`/backend/`)
- **main.py**: Punto de entrada FastAPI con todos los endpoints
- **models.py**: Modelos SQLAlchemy para la base de datos
- **schemas.py**: Esquemas Pydantic para validación
- **database.py**: Configuración de conexión a MySQL
- **requirements.txt**: Dependencias Python
- **Dockerfile**: Imagen Docker para backend

### Frontend (`/frontend/`)
- **src/App.tsx**: Componente principal React
- **src/components/**: Componentes reutilizables organizados por funcionalidad
  - `ui/`: Componentes básicos (Button, Card, Input)
  - `layout/`: Layout principal
  - `powerbi/`: Componentes de integración Power BI
  - `client/`, `supervisor/`: Componentes específicos por rol
- **src/pages/**: Páginas principales de la aplicación
- **src/services/api.ts**: Cliente HTTP para comunicación con backend
- **src/store/**: Estado global con Zustand
- **src/types/**: Tipos TypeScript
- **package.json**: Dependencias Node.js

## Tecnologías Clave

### Backend
- FastAPI (framework web)
- SQLAlchemy (ORM)
- Pydantic (validación)
- Passlib (encriptación)
- MySQL (base de datos)

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (estilos)
- React Router (navegación)
- React Query (gestión estado servidor)
- Zustand (estado global)
- Axios (HTTP client)

## Roles del Sistema
1. **Administrador**: Gestión completa del sistema
2. **Área de Capacitación**: Diseño de planes de carrera
3. **Supervisor**: Seguimiento del equipo
4. **Empleado**: Consumo de capacitaciones
5. **Instructor**: Gestión de sesiones presenciales
6. **Administrador de Reportes**: Acceso a Power BI

## Entidades Principales
- **Person**: Datos personales básicos
- **User**: Autenticación y roles
- **Course**: Capacitaciones disponibles
- **CareerPlan**: Agrupaciones de cursos
- **UserCareerPlan**: Asignaciones de usuarios a planes

## Patrones de Código

### Backend
- Usar SQLAlchemy para queries
- Validar con Pydantic schemas
- Manejar errores con HTTPException
- Organizar endpoints por tags

### Frontend
- Componentes TypeScript con interfaces
- Hooks personalizados para lógica compleja
- Zustand para estado global
- Tailwind CSS para estilos
- React Hook Form para formularios

## Convenciones de Nombres
- **Archivos**: camelCase para React, snake_case para Python
- **Componentes**: PascalCase
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Tipos**: PascalCase con sufijo (ej: UserType, CourseData)

## URLs Importantes
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs
- Base de datos: localhost:3306

## Archivos de Configuración
- `docker-compose.yml`: Desarrollo
- `docker-compose.prod.yml`: Producción
- `frontend/vite.config.ts`: Configuración Vite
- `frontend/tailwind.config.js`: Configuración Tailwind
- `backend/requirements.txt`: Dependencias Python

## Reglas de Trabajo
- **NO reescribir archivos completos** - Solo editar fragmentos necesarios
- **Verificar dependencias** antes de usar librerías
- **Seguir patrones existentes** en el código
- **Validar cambios** con lint/build antes de finalizar
- **Usar tipos TypeScript** siempre que sea posible

## Notas Específicas
- El proyecto usa bcrypt para passwords (warning suprimido)
- CORS está configurado para permitir todos los orígenes en desarrollo
- Power BI se integra mediante iframes embebidos
- La base de datos se inicializa automáticamente con SQLAlchemy
- El frontend usa React 18 con las últimas características