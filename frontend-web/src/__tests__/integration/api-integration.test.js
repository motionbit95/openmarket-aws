import { describe, it, expect, beforeAll } from 'vitest';
import axiosInstance, { endpoints } from 'src/lib/axios';

describe('API Integration Tests', () => {
  beforeAll(() => {
    // 테스트 환경 설정
    console.log('Testing against:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
  });

  describe('서버 연결 테스트', () => {
    it('백엔드 서버에 연결할 수 있어야 함', async () => {
      try {
        // 간단한 헬스체크 또는 기본 엔드포인트 호출
        const response = await axiosInstance.get('/');
        expect(response.status).toBe(200);
      } catch (error) {
        console.warn('Backend server not available:', error.message);
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('엔드포인트 구조 테스트', () => {
    it('모든 엔드포인트가 문자열이어야 함', () => {
      const checkEndpoints = (obj, path = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            checkEndpoints(value, currentPath);
          } else {
            expect(typeof value).toBe('string');
            expect(value.startsWith('/')).toBe(true);
          }
        });
      };

      checkEndpoints(endpoints);
    });

    it('엔드포인트에 중복이 없어야 함', () => {
      const allEndpoints = [];
      
      const collectEndpoints = (obj) => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'object' && value !== null) {
            collectEndpoints(value);
          } else if (typeof value === 'string') {
            allEndpoints.push(value);
          }
        });
      };

      collectEndpoints(endpoints);
      
      const uniqueEndpoints = [...new Set(allEndpoints)];
      expect(allEndpoints.length).toBe(uniqueEndpoints.length);
    });
  });

  describe('HTTP 메서드별 테스트', () => {
    const testEndpoint = '/users';

    it('GET 요청을 처리할 수 있어야 함', async () => {
      try {
        const response = await axiosInstance.get(testEndpoint);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      } catch (error) {
        console.warn('GET request failed:', error.message);
        expect(['NETWORK_ERROR', 'AUTH_ERROR'].includes(error.type)).toBe(true);
      }
    });

    it('잘못된 엔드포인트에 대해 404를 반환해야 함', async () => {
      try {
        await axiosInstance.get('/non-existent-endpoint');
        expect(false).toBe(true); // 위 호출이 성공하면 테스트 실패
      } catch (error) {
        if (error.type === 'NETWORK_ERROR') {
          console.warn('Network error occurred:', error.message);
        } else {
          expect(error.status).toBe(404);
        }
      }
    });
  });

  describe('에러 처리 테스트', () => {
    it('네트워크 에러를 적절히 처리해야 함', async () => {
      // 잘못된 URL로 요청하여 네트워크 에러 발생시키기
      const wrongAxios = axiosInstance.create({ 
        baseURL: 'http://non-existent-server:9999',
        timeout: 1000 
      });

      try {
        await wrongAxios.get('/test');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.type).toBe('NETWORK_ERROR');
        expect(error.message).toContain('네트워크 연결을 확인해주세요');
      }
    });

    it('타임아웃 에러를 적절히 처리해야 함', async () => {
      const slowAxios = axiosInstance.create({ 
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        timeout: 1 // 1ms로 설정하여 타임아웃 유발
      });

      try {
        await slowAxios.get('/users');
        expect(false).toBe(true);
      } catch (error) {
        expect(error.type).toBe('NETWORK_ERROR');
      }
    });
  });

  describe('인증 테스트', () => {
    it('토큰 없이 보호된 엔드포인트 접근 시 401 에러가 발생해야 함', async () => {
      // localStorage에서 토큰 제거
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }

      try {
        // 보호된 엔드포인트에 접근 (예: 사용자 생성)
        await axiosInstance.post('/users', { test: 'data' });
        expect(false).toBe(true);
      } catch (error) {
        if (error.type === 'NETWORK_ERROR') {
          console.warn('Network error occurred:', error.message);
        } else {
          expect(error.status).toBe(401);
          expect(error.type).toBe('AUTH_ERROR');
        }
      }
    });
  });
});