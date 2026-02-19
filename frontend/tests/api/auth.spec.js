import { test, expect } from '@playwright/test';
import { ApiClient, testData, authenticate } from './apiClient';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

test.describe('Authentication API', () => {
  let api;

  test.beforeAll(async () => {
    api = new ApiClient(API_BASE_URL);
  });

  test.describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const adminCredentials = {
        username: process.env.TEST_ADMIN_USERNAME || 'admin',
        password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
      };

      const formData = new FormData();
      formData.append('username', adminCredentials.username);
      formData.append('password', adminCredentials.password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('refresh_token');
      expect(data).toHaveProperty('token_type');
      expect(data.token_type).toBe('bearer');
    });

    test('should fail with invalid credentials', async () => {
      const formData = new FormData();
      formData.append('username', 'invalid_user');
      formData.append('password', 'invalid_password');

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(401);
    });

    test('should fail with missing credentials', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: new FormData(),
      });

      expect(response.status).toBe(422);
    });
  });

  test.describe('POST /auth/register', () => {
    test('should register new user', async () => {
      const user = testData.user();
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      // Accept both 201 (created) and 400 (user exists)
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        const data = await response.json();
        expect(data).toHaveProperty('id');
        expect(data.email).toBe(user.email);
      }
    });

    test('should fail with invalid email format', async () => {
      const user = testData.user({ email: 'invalid-email' });
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      expect(response.status).toBe(422);
    });

    test('should fail with weak password', async () => {
      const user = testData.user({ password: '123' });
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      expect(response.status).toBe(422);
    });
  });

  test.describe('POST /auth/refresh', () => {
    test('should refresh token with valid refresh token', async () => {
      // First login to get refresh token
      const adminCredentials = {
        username: process.env.TEST_ADMIN_USERNAME || 'admin',
        password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
      };

      const formData = new FormData();
      formData.append('username', adminCredentials.username);
      formData.append('password', adminCredentials.password);

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (!loginResponse.ok) {
        test.skip();
        return;
      }

      const loginData = await loginResponse.json();
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: loginData.refresh_token }),
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('refresh_token');
    });

    test('should fail with invalid refresh token', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: 'invalid_token' }),
      });

      expect(response.status).toBe(401);
    });
  });

  test.describe('POST /auth/forgot-password', () => {
    test('should accept forgot password request', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      // Accept both success and user not found (we don't reveal which)
      expect([200, 404]).toContain(response.status);
    });

    test('should fail with invalid email format', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' }),
      });

      expect(response.status).toBe(422);
    });
  });

  test.describe('Protected endpoints', () => {
    test('should reject request without token', async () => {
      const response = await fetch(`${API_BASE_URL}/users/me`);
      expect(response.status).toBe(401);
    });

    test('should reject request with invalid token', async () => {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': 'Bearer invalid_token' },
      });
      expect(response.status).toBe(401);
    });

    test('should accept request with valid token', async () => {
      const adminCredentials = {
        username: process.env.TEST_ADMIN_USERNAME || 'admin',
        password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
      };

      const formData = new FormData();
      formData.append('username', adminCredentials.username);
      formData.append('password', adminCredentials.password);

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (!loginResponse.ok) {
        test.skip();
        return;
      }

      const loginData = await loginResponse.json();
      
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${loginData.access_token}` },
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
    });
  });
});

test.describe('Role-based access control', () => {
  test('admin should have access to all endpoints', async () => {
    const adminCredentials = {
      username: process.env.TEST_ADMIN_USERNAME || 'admin',
      password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
    };

    const formData = new FormData();
    formData.append('username', adminCredentials.username);
    formData.append('password', adminCredentials.password);

    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!loginResponse.ok) {
      test.skip();
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;

    // Test admin-only endpoints
    const endpoints = [
      '/users',
      '/settings',
      '/business-profile',
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // Admin should have access (200) or endpoint might not exist (404)
      // But should not be forbidden (403)
      expect(response.status).not.toBe(403);
    }
  });
});
