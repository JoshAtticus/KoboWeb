# syntax=docker/dockerfile:1.7
# Lightweight Python base image
FROM python:3.12-slim

# Set environment: no .pyc files, unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=3004

# Create non-root user and work dir
WORKDIR /app
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Copy only what we need
COPY --chown=appuser:appuser server.py ./
COPY --chown=appuser:appuser static ./static

# Expose the port for Coolify/containers
EXPOSE 3004

# Healthcheck (optional): verify server responds on the configured port
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import socket,os; s=socket.socket(); \
  s.settimeout(3); \
  s.connect(('127.0.0.1', int(os.getenv('PORT','3004')))); \
  s.close()" || exit 1

# Run the app
CMD ["python", "server.py"]
