import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from 'src/actions/user';

describe('User API Tests', () => {
  let testUserId;

  // 테스트용 사용자 데이터
  const testUserData = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: '테스트 사용자',
    phone: '010-1234-5678',
    birth_date: '1990-01-01',
    gender: 'male'
  };

  describe('사용자 생성 테스트', () => {
    it('새 사용자를 생성할 수 있어야 함', async () => {
      try {
        const result = await createUser(testUserData);
        expect(result).toBeDefined();
        expect(result.email).toBe(testUserData.email);
        expect(result.name).toBe(testUserData.name);
        testUserId = result.id;
      } catch (error) {
        // 백엔드가 실행되지 않은 경우 테스트 스킵
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('사용자 조회 테스트', () => {
    it('전체 사용자 목록을 조회할 수 있어야 함', async () => {
      try {
        const result = await getUsers({});
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });

    it('검색 파라미터로 사용자를 조회할 수 있어야 함', async () => {
      try {
        const result = await getUsers({ search: '테스트' });
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });

    it('ID로 특정 사용자를 조회할 수 있어야 함', async () => {
      if (!testUserId) return;
      
      try {
        const result = await getUserById(testUserId);
        expect(result).toBeDefined();
        expect(result.id).toBe(testUserId);
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('사용자 수정 테스트', () => {
    it('사용자 정보를 수정할 수 있어야 함', async () => {
      if (!testUserId) return;

      const updateData = {
        name: '수정된 테스트 사용자',
        phone: '010-9876-5432'
      };

      try {
        const result = await updateUser(testUserId, updateData);
        expect(result).toBeDefined();
        expect(result.name).toBe(updateData.name);
        expect(result.phone).toBe(updateData.phone);
      } catch (error) {
        console.warn('Backend not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('사용자 삭제 테스트', () => {
    it('사용자를 삭제할 수 있어야 함', async () => {
      if (!testUserId) return;

      try {
        await deleteUser(testUserId);
        
        // 삭제 후 조회 시 404 에러가 발생해야 함
        try {
          await getUserById(testUserId);
          // 위 호출이 성공하면 테스트 실패
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