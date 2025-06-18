# Instrucciones para generar package-lock.json

Para generar el archivo package-lock.json necesario:

1. Navegar al directorio frontend:
```bash
cd Z:\Trabajos\TrabajoTesis\dev_akira2\app-dev\frontend
```

2. Ejecutar npm install para generar el lock file:
```bash
npm install
```

3. Luego ejecutar Docker Compose desde app-dev:
```bash
cd ..
docker-compose up --build
```

Alternativamente, puedes usar npm install en lugar de npm ci en los Dockerfiles.