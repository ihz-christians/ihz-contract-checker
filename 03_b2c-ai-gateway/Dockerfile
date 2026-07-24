FROM python:3.11-slim

# Create a non-root user for security compliance in Kubernetes
RUN addgroup --system appuser && adduser --system --group appuser

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

# Hand over ownership to the non-root user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

ENV PYTHONPATH=/app/src

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
