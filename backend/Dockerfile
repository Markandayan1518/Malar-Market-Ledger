# Dockerfile for Malar Market Digital Ledger Backend

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITE_VERSION=1
ENV PYTHONUNBUFFERED=1
ENV http_proxy=""
ENV https_proxy=""
ENV HTTP_PROXY=""
ENV HTTPS_PROXY=""

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=40s --retries=3 CMD curl -f http://localhost:8000/health || exit 1
