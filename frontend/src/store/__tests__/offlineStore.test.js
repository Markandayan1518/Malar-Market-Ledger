/**
 * Unit tests for offline store caching utilities
 * Tests the farmer products cache functionality
 */

import {
  initDB,
  cacheFarmerProducts,
  getCachedFarmerProducts,
  getCachedFarmerProductsByFarmer,
  getCachedFarmerProduct,
  putCachedFarmerProduct,
  removeCachedFarmerProduct,
  clearCachedFarmerProducts,
  STORES
} from '../offlineStore';

// Mock IndexedDB
import 'fake-indexeddb/auto';

describe('Offline Store - Farmer Products Cache', () => {
  // Reset database before each test
  beforeEach(async () => {
    // Clear the farmer products cache
    await clearCachedFarmerProducts().catch(() => {});
  });

  describe('cacheFarmerProducts', () => {
    it('should cache multiple farmer products', async () => {
      const products = [
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10, flower_name: 'Jasmine' },
        { farmer_id: 'farmer-1', flower_type_id: 'flower-2', entry_count: 5, flower_name: 'Rose' },
        { farmer_id: 'farmer-2', flower_type_id: 'flower-1', entry_count: 8, flower_name: 'Jasmine' },
      ];

      await cacheFarmerProducts(products);

      const cached = await getCachedFarmerProducts();
      expect(cached).toHaveLength(3);
    });

    it('should use composite key for unique identification', async () => {
      const products = [
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10 },
      ];

      await cacheFarmerProducts(products);

      const cached = await getCachedFarmerProduct('farmer-1', 'flower-1');
      expect(cached).not.toBeNull();
      expect(cached.id).toBe('farmer-1_flower-1');
    });

    it('should clear existing products before caching new ones', async () => {
      // First batch
      await cacheFarmerProducts([
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10 },
      ]);

      // Second batch (should replace first)
      await cacheFarmerProducts([
        { farmer_id: 'farmer-2', flower_type_id: 'flower-2', entry_count: 5 },
      ]);

      const cached = await getCachedFarmerProducts();
      expect(cached).toHaveLength(1);
      expect(cached[0].farmer_id).toBe('farmer-2');
    });
  });

  describe('getCachedFarmerProductsByFarmer', () => {
    beforeEach(async () => {
      await cacheFarmerProducts([
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10 },
        { farmer_id: 'farmer-1', flower_type_id: 'flower-2', entry_count: 5 },
        { farmer_id: 'farmer-2', flower_type_id: 'flower-1', entry_count: 8 },
      ]);
    });

    it('should return products for a specific farmer', async () => {
      const products = await getCachedFarmerProductsByFarmer('farmer-1');
      expect(products).toHaveLength(2);
      products.forEach(p => expect(p.farmer_id).toBe('farmer-1'));
    });

    it('should return empty array for unknown farmer', async () => {
      const products = await getCachedFarmerProductsByFarmer('unknown-farmer');
      expect(products).toEqual([]);
    });
  });

  describe('getCachedFarmerProduct', () => {
    beforeEach(async () => {
      await cacheFarmerProducts([
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10, flower_name: 'Jasmine' },
      ]);
    });

    it('should return a specific farmer product', async () => {
      const product = await getCachedFarmerProduct('farmer-1', 'flower-1');
      expect(product).not.toBeNull();
      expect(product.flower_name).toBe('Jasmine');
      expect(product.entry_count).toBe(10);
    });

    it('should return null for non-existent product', async () => {
      const product = await getCachedFarmerProduct('farmer-1', 'non-existent');
      expect(product).toBeUndefined();
    });
  });

  describe('putCachedFarmerProduct', () => {
    it('should add a new farmer product', async () => {
      await putCachedFarmerProduct({
        farmer_id: 'farmer-1',
        flower_type_id: 'flower-1',
        entry_count: 5,
        flower_name: 'Jasmine'
      });

      const product = await getCachedFarmerProduct('farmer-1', 'flower-1');
      expect(product).not.toBeNull();
      expect(product.entry_count).toBe(5);
    });

    it('should update an existing farmer product', async () => {
      // Add initial product
      await putCachedFarmerProduct({
        farmer_id: 'farmer-1',
        flower_type_id: 'flower-1',
        entry_count: 5,
      });

      // Update the same product
      await putCachedFarmerProduct({
        farmer_id: 'farmer-1',
        flower_type_id: 'flower-1',
        entry_count: 10,
        flower_name: 'Updated Jasmine'
      });

      const product = await getCachedFarmerProduct('farmer-1', 'flower-1');
      expect(product.entry_count).toBe(10);
      expect(product.flower_name).toBe('Updated Jasmine');
    });
  });

  describe('removeCachedFarmerProduct', () => {
    beforeEach(async () => {
      await cacheFarmerProducts([
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10 },
        { farmer_id: 'farmer-1', flower_type_id: 'flower-2', entry_count: 5 },
      ]);
    });

    it('should remove a specific farmer product', async () => {
      await removeCachedFarmerProduct('farmer-1', 'flower-1');

      const products = await getCachedFarmerProducts();
      expect(products).toHaveLength(1);
      expect(products[0].flower_type_id).toBe('flower-2');
    });

    it('should not throw when removing non-existent product', async () => {
      await expect(removeCachedFarmerProduct('unknown', 'unknown')).resolves.not.toThrow();
    });
  });

  describe('clearCachedFarmerProducts', () => {
    beforeEach(async () => {
      await cacheFarmerProducts([
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1', entry_count: 10 },
        { farmer_id: 'farmer-2', flower_type_id: 'flower-2', entry_count: 5 },
      ]);
    });

    it('should clear all farmer products', async () => {
      await clearCachedFarmerProducts();

      const products = await getCachedFarmerProducts();
      expect(products).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty products array', async () => {
      await expect(cacheFarmerProducts([])).resolves.not.toThrow();
      const cached = await getCachedFarmerProducts();
      expect(cached).toHaveLength(0);
    });

    it('should handle products with missing optional fields', async () => {
      await cacheFarmerProducts([
        { farmer_id: 'farmer-1', flower_type_id: 'flower-1' },
      ]);

      const product = await getCachedFarmerProduct('farmer-1', 'flower-1');
      expect(product).not.toBeNull();
      expect(product.entry_count).toBeUndefined();
      expect(product.flower_name).toBeUndefined();
    });

    it('should handle special characters in IDs', async () => {
      const specialId = 'farmer_@test-123';
      await putCachedFarmerProduct({
        farmer_id: specialId,
        flower_type_id: 'flower-1',
        entry_count: 1
      });

      const products = await getCachedFarmerProductsByFarmer(specialId);
      expect(products).toHaveLength(1);
    });
  });
});

describe('Offline Store - Database Initialization', () => {
  it('should initialize database with FARMER_PRODUCTS_CACHE store', async () => {
    const db = await initDB();
    expect(db.objectStoreNames.contains(STORES.FARMER_PRODUCTS_CACHE)).toBe(true);
  });

  it('should return same database instance on multiple calls', async () => {
    const db1 = await initDB();
    const db2 = await initDB();
    expect(db1).toBe(db2);
  });
});
