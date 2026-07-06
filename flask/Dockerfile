FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Exponer el puerto
EXPOSE 5000

# Añadimos la variable de entorno para saber que corre en flask (opcional)
ENV FLASK_APP=app.py
ENV FLASK_ENV=development

# Comando para ejecutar la aplicación
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
