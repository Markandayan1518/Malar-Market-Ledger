"""
Tests for Health Check Endpoint

Tests for GET /health endpoint.
"""

import pytest
import requests
import os

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


class TestHealthCheck:
    """Tests for GET /health"""

    @pytest.mark.positive
    def test_health_check_returns_200(self):
        """Test GET /health returns 200 with healthy status"""
        session = requests.Session()
        session.trust_env = False
        session.proxies = {"http": None, "https": None}

        response = session.get(f"{BASE_URL}/health", timeout=10)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
