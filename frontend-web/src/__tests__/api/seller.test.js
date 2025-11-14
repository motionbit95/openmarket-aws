import { describe, it, expect } from 'vitest';
import { getSellers, getSellerById, createSeller, deleteSeller } from 'src/actions/seller';

describe('Seller API Tests', () => {
  let testSellerId;

  // 테스트용 판매자 데이터
  const testSellerData = {
    email: `seller${Date.now()}@example.com`,
    password: 'Seller123!@#',
    business_name: '테스트 상점',
    business_registration_number: '123-45-67890',
    phone: '02-1234-5678',
    address: '서울시 강남구 테스트로 123',
    representative_name: '대표자명',
    bank_name: '우리은행',
    account_number: '1002-123-456789',
    account_holder: '대표자명'
  };

  describe('판매자 생성 테스트', () => {
    it('새 판매자를 생성할 수 있어야 함', async () => {
      try {
        const result = await createSeller(testSellerData);
        expect(result).toBeDefined();
        expect(result.email).toBe(testSellerData.email);
        expect(result.business_name).toBe(testSellerData.business_name);
        testSellerId = result.id;
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('판매자 조회 테스트', () => {
    it('전체 판매자 목록을 조회할 수 있어야 함', async () => {
      try {
        const result = await getSellers({});
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });

    it('검색 파라미터로 판매자를 조회할 수 있어야 함', async () => {
      try {
        const result = await getSellers({ search: '테스트' });
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });

    it('ID로 특정 판매자를 조회할 수 있어야 함', async () => {
      if (!testSellerId) return;
      
      try {
        const result = await getSellerById(testSellerId);
        expect(result).toBeDefined();
        expect(result.id).toBe(testSellerId);
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('판매자 삭제 테스트', () => {
    it('판매자를 삭제할 수 있어야 함', async () => {
      if (!testSellerId) return;

      try {
        await deleteSeller(testSellerId);
        
        // 삭제 후 조회 시 404 에러가 발생해야 함
        try {
          await getSellerById(testSellerId);
          expect(false).toBe(true);
        } catch (deleteError) {
          expect(deleteError.status).toBe(404);
        }
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });
  });
});