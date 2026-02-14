# Dockerfile for Malar Market Digital Ledger Backend

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .

# Create non-root user
RUN useradd -m appuser -u appuser -s /bin/bash -c "pip install --upgrade pip && pip cache purge"

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONDONTWRITE_VERSION=1
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=40s --retries=3 CMD curl -f http://localhost:8000/health || exit 1
