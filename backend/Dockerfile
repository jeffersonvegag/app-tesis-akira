FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Actualizar pip y setuptools
RUN pip install --upgrade pip setuptools wheel

# Copiar y instalar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Verificar la instalación
RUN pip list

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 8000

# Usar uvicorn directamente
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]