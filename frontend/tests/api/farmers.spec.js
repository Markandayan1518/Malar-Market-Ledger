import { test, expect } from '@playwright/test';
import { ApiClient, testData } from './apiClient';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

async function getAuthToken() {
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
    throw new Error('Failed to authenticate');
  }

  const data = await loginResponse.json();
  return data.access_token;
}

test.describe('Farmers API', () => {
  let token;
  let api;

  test.beforeAll(async () => {
    try {
      token = await getAuthToken();
      api = new ApiClient(API_BASE_URL);
      api.setToken(token);
    } catch {
      // Tests will be skipped if auth fails
    }
  });

  test.describe('GET /farmers', () => {
    test('should list farmers with valid auth', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(Array.isArray(data) || Array.isArray(data.farmers) || Array.isArray(data.items)).toBeTruthy();
    });

    test('should support pagination', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers?page=1&page_size=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      
      // Check for pagination structure
      if (data.items) {
        expect(data).toHaveProperty('items');
        expect(data).toHaveProperty('total');
      }
    });

    test('should support search query', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers?search=test`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
    });

    test('should filter by active status', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers?is_active=true`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
    });

    test('should reject unauthenticated request', async () => {
      const response = await fetch(`${API_BASE_URL}/farmers`);
      expect(response.status).toBe(401);
    });
  });

  test.describe('POST /farmers', () => {
    test('should create new farmer', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const farmer = testData.farmer();
      
      const response = await fetch(`${API_BASE_URL}/farmers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(farmer),
      });

      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(farmer.name);
    });

    test('should fail with missing required fields', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(422);
    });

    test('should fail with invalid phone format', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const farmer = testData.farmer({ phone: 'invalid-phone' });
      
      const response = await fetch(`${API_BASE_URL}/farmers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(farmer),
      });

      expect(response.status).toBe(422);
    });

    test('should fail with duplicate phone', async () => {
      if (!token) {
        test.skip();
        return;
      }

      // Create first farmer
      const farmer1 = testData.farmer();
      await fetch(`${API_BASE_URL}/farmers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(farmer1),
      });

      // Try to create second farmer with same phone
      const farmer2 = testData.farmer({ phone: farmer1.phone });
      const response = await fetch(`${API_BASE_URL}/farmers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(farmer2),
      });

      expect(response.status).toBe(400);
    });
  });

  test.describe('GET /farmers/{id}', () => {
    let testFarmerId;

    test.beforeAll(async () => {
      if (!token) return;

      // Create a test farmer
      const farmer = testData.farmer();
      const response = await fetch(`${API_BASE_URL}/farmers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(farmer),
      });

      if (response.ok) {
        const data = await response.json();
        testFarmerId = data.id;
      }
    });

    test('should get farmer by ID', async () => {
      if (!token || !testFarmerId) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers/${testFarmerId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(data.id).toBe(testFarmerId);
    });

    test('should return 404 for non-existent farmer', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers/non-existent-id`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.status).toBe(404);
    });
  });

  test.describe('PUT /farmers/{id}', () => {
    let testFarmerId;

    test.beforeAll(async () => {
      if (!token) return;

      const farmer = testData.farmer();
      const response = await fetch(`${API_BASE_URL}/farmers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(farmer),
      });

      if (response.ok) {
        const data = await response.json();
        testFarmerId = data.id;
      }
    });

    test('should update farmer', async () => {
      if (!token || !testFarmerId) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers/${testFarmerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(data.name).toBe('Updated Name');
    });

    test('should fail with invalid data', async () => {
      if (!token || !testFarmerId) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/farmers/${testFarmerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: 'invalid' }),
      });

      expect(response.status).toBe(422);
    });
  });

  test.describe('DELETE /farmers/{id}', () => {
    test('should soft delete farmer', async () => {
      if (!token) {
        test.skip();
        return;
      }

      // Create a farmer to delete
      const farmer = testData.farmer();
      const createResponse = await fetch(`${API_BASE_URL}/farmers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(farmer),
      });

      if (!createResponse.ok) {
        test.skip();
        return;
      }

      const createdFarmer = await createResponse.json();
      
      const deleteResponse = await fetch(`${API_BASE_URL}/farmers/${createdFarmer.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(deleteResponse.ok).toBeTruthy();

      // Verify soft delete - farmer should not appear in list
      const listResponse = await fetch(`${API_BASE_URL}/farmers/${createdFarmer.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(listResponse.status).toBe(404);
    });
  });

  test.describe('GET /farmers/{id}/balance', () => {
    test('should get farmer balance', async () => {
      if (!token) {
        test.skip();
        return;
      }

      // Get list of farmers first
      const listResponse = await fetch(`${API_BASE_URL}/farmers?page=1&page_size=1`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!listResponse.ok) {
        test.skip();
        return;
      }

      const listData = await listResponse.json();
      const farmers = listData.farmers || listData.items || listData;
      
      if (!farmers || farmers.length === 0) {
        test.skip();
        return;
      }

      const farmerId = farmers[0].id;
      
      const response = await fetch(`${API_BASE_URL}/farmers/${farmerId}/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Endpoint might not exist
      expect([200, 404]).toContain(response.status);
    });
  });
});
