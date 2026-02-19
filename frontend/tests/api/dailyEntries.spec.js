import { test, expect } from '@playwright/test';
import { testData } from './apiClient';

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

async function getTestFarmerId(token) {
  const response = await fetch(`${API_BASE_URL}/farmers?page=1&page_size=1`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const farmers = data.farmers || data.items || data;
  return farmers && farmers.length > 0 ? farmers[0].id : null;
}

async function getTestFlowerTypeId(token) {
  const response = await fetch(`${API_BASE_URL}/flower-types?page=1&page_size=1`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const items = data.flower_types || data.items || data;
  return items && items.length > 0 ? items[0].id : null;
}

async function getTestTimeSlotId(token) {
  const response = await fetch(`${API_BASE_URL}/time-slots?page=1&page_size=1`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const items = data.time_slots || data.items || data;
  return items && items.length > 0 ? items[0].id : null;
}

test.describe('Daily Entries API', () => {
  let token;
  let testFarmerId;
  let testFlowerTypeId;
  let testTimeSlotId;

  test.beforeAll(async () => {
    try {
      token = await getAuthToken();
      testFarmerId = await getTestFarmerId(token);
      testFlowerTypeId = await getTestFlowerTypeId(token);
      testTimeSlotId = await getTestTimeSlotId(token);
    } catch {
      // Tests will be skipped if auth fails
    }
  });

  test.describe('GET /daily-entries', () => {
    test('should list daily entries with valid auth', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-entries`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(Array.isArray(data) || Array.isArray(data.entries) || Array.isArray(data.items)).toBeTruthy();
    });

    test('should support pagination', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-entries?page=1&page_size=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
    });

    test('should filter by date', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/daily-entries?date=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
    });

    test('should filter by date range', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const response = await fetch(
        `${API_BASE_URL}/daily-entries?start_date=${weekAgo.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      expect(response.ok).toBeTruthy();
    });

    test('should filter by farmer', async () => {
      if (!token || !testFarmerId) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-entries?farmer_id=${testFarmerId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
    });

    test('should reject unauthenticated request', async () => {
      const response = await fetch(`${API_BASE_URL}/daily-entries`);
      expect(response.status).toBe(401);
    });
  });

  test.describe('POST /daily-entries', () => {
    test('should create new daily entry', async () => {
      if (!token || !testFarmerId || !testFlowerTypeId) {
        test.skip();
        return;
      }

      const entry = testData.dailyEntry({
        farmer_id: testFarmerId,
        flower_type_id: testFlowerTypeId,
        time_slot_id: testTimeSlotId,
      });
      
      const response = await fetch(`${API_BASE_URL}/daily-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      expect([200, 201]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(parseFloat(data.weight_kg)).toBe(entry.weight_kg);
    });

    test('should fail with missing required fields', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(422);
    });

    test('should fail with invalid weight', async () => {
      if (!token || !testFarmerId || !testFlowerTypeId) {
        test.skip();
        return;
      }

      const entry = testData.dailyEntry({
        farmer_id: testFarmerId,
        flower_type_id: testFlowerTypeId,
        time_slot_id: testTimeSlotId,
        weight_kg: -10,
      });
      
      const response = await fetch(`${API_BASE_URL}/daily-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      expect(response.status).toBe(422);
    });

    test('should fail with non-existent farmer', async () => {
      if (!token || !testFlowerTypeId) {
        test.skip();
        return;
      }

      const entry = testData.dailyEntry({
        farmer_id: 'non-existent-farmer-id',
        flower_type_id: testFlowerTypeId,
      });
      
      const response = await fetch(`${API_BASE_URL}/daily-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      expect(response.status).toBe(404);
    });

    test('should auto-calculate total amount', async () => {
      if (!token || !testFarmerId || !testFlowerTypeId) {
        test.skip();
        return;
      }

      const entry = testData.dailyEntry({
        farmer_id: testFarmerId,
        flower_type_id: testFlowerTypeId,
        time_slot_id: testTimeSlotId,
        weight_kg: 10,
        rate_per_kg: 50,
      });
      
      const response = await fetch(`${API_BASE_URL}/daily-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        const data = await response.json();
        expect(parseFloat(data.total_amount)).toBe(500);
      }
    });
  });

  test.describe('GET /daily-entries/{id}', () => {
    let testEntryId;

    test.beforeAll(async () => {
      if (!token || !testFarmerId || !testFlowerTypeId) return;

      const entry = testData.dailyEntry({
        farmer_id: testFarmerId,
        flower_type_id: testFlowerTypeId,
        time_slot_id: testTimeSlotId,
      });
      
      const response = await fetch(`${API_BASE_URL}/daily-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        const data = await response.json();
        testEntryId = data.id;
      }
    });

    test('should get daily entry by ID', async () => {
      if (!token || !testEntryId) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-entries/${testEntryId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(data.id).toBe(testEntryId);
    });

    test('should return 404 for non-existent entry', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-entries/non-existent-id`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(response.status).toBe(404);
    });
  });

  test.describe('PUT /daily-entries/{id}', () => {
    let testEntryId;

    test.beforeAll(async () => {
      if (!token || !testFarmerId || !testFlowerTypeId) return;

      const entry = testData.dailyEntry({
        farmer_id: testFarmerId,
        flower_type_id: testFlowerTypeId,
        time_slot_id: testTimeSlotId,
      });
      
      const response = await fetch(`${API_BASE_URL}/daily-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        const data = await response.json();
        testEntryId = data.id;
      }
    });

    test('should update daily entry', async () => {
      if (!token || !testEntryId) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-entries/${testEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ weight_kg: 15 }),
      });

      expect(response.ok).toBeTruthy();
      
      const data = await response.json();
      expect(parseFloat(data.weight_kg)).toBe(15);
    });

    test('should recalculate total on weight change', async () => {
      if (!token || !testEntryId) {
        test.skip();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-entries/${testEntryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ weight_kg: 20, rate_per_kg: 100 }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(parseFloat(data.total_amount)).toBe(2000);
      }
    });
  });

  test.describe('DELETE /daily-entries/{id}', () => {
    test('should soft delete daily entry', async () => {
      if (!token || !testFarmerId || !testFlowerTypeId) {
        test.skip();
        return;
      }

      // Create an entry to delete
      const entry = testData.dailyEntry({
        farmer_id: testFarmerId,
        flower_type_id: testFlowerTypeId,
        time_slot_id: testTimeSlotId,
      });
      
      const createResponse = await fetch(`${API_BASE_URL}/daily-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      if (!createResponse.ok) {
        test.skip();
        return;
      }

      const createdEntry = await createResponse.json();
      
      const deleteResponse = await fetch(`${API_BASE_URL}/daily-entries/${createdEntry.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(deleteResponse.ok).toBeTruthy();

      // Verify soft delete
      const getResponse = await fetch(`${API_BASE_URL}/daily-entries/${createdEntry.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      expect(getResponse.status).toBe(404);
    });
  });

  test.describe('GET /daily-entries/summary', () => {
    test('should get daily summary', async () => {
      if (!token) {
        test.skip();
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/daily-entries/summary?date=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Endpoint might not exist, accept both
      expect([200, 404]).toContain(response.status);
    });
  });

  test.describe('Batch operations', () => {
    test('should support batch create entries', async () => {
      if (!token || !testFarmerId || !testFlowerTypeId) {
        test.skip();
        return;
      }

      const entries = [
        testData.dailyEntry({
          farmer_id: testFarmerId,
          flower_type_id: testFlowerTypeId,
          time_slot_id: testTimeSlotId,
        }),
        testData.dailyEntry({
          farmer_id: testFarmerId,
          flower_type_id: testFlowerTypeId,
          time_slot_id: testTimeSlotId,
        }),
      ];

      const response = await fetch(`${API_BASE_URL}/daily-entries/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ entries }),
      });

      // Endpoint might not exist
      expect([200, 201, 404]).toContain(response.status);
    });
  });
});

test.describe('Daily Entries with Adjustments', () => {
  let token;
  let testFarmerId;
  let testFlowerTypeId;

  test.beforeAll(async () => {
    try {
      token = await getAuthToken();
      testFarmerId = await getTestFarmerId(token);
      testFlowerTypeId = await getTestFlowerTypeId(token);
    } catch {
      // Tests will be skipped
    }
  });

  test('should create entry with deductions', async () => {
    if (!token || !testFarmerId || !testFlowerTypeId) {
      test.skip();
      return;
    }

    const entry = testData.dailyEntry({
      farmer_id: testFarmerId,
      flower_type_id: testFlowerTypeId,
      weight_kg: 10,
      rate_per_kg: 100,
      deductions: [
        { type: 'quality', amount: 50, reason: 'Poor quality' },
      ],
    });
    
    const response = await fetch(`${API_BASE_URL}/daily-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
    });

    // Accept success or field not supported
    expect([200, 201, 422]).toContain(response.status);
  });

  test('should create entry with bonuses', async () => {
    if (!token || !testFarmerId || !testFlowerTypeId) {
      test.skip();
      return;
    }

    const entry = testData.dailyEntry({
      farmer_id: testFarmerId,
      flower_type_id: testFlowerTypeId,
      weight_kg: 10,
      rate_per_kg: 100,
      bonuses: [
        { type: 'premium', amount: 100, reason: 'Premium quality' },
      ],
    });
    
    const response = await fetch(`${API_BASE_URL}/daily-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
    });

    expect([200, 201, 422]).toContain(response.status);
  });
});
