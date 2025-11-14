import apiClient from './api-client';

const ADMIN_API_BASE = '/admin';

class AdminApiService {
  // 관리자 로그인
  async signIn(adminId, adminPw) {
    return apiClient.post(`${ADMIN_API_BASE}/sign-in`, { adminId, adminPw });
  }

  // 관리자 정보 조회
  async getMe(token) {
    return apiClient.get(`${ADMIN_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // 관리자 대시보드 데이터 조회
  async getDashboardData(token, date = null, period = 'monthly') {
    const params = {};
    if (date && period !== 'monthly') {
      params.date = date.toISOString();
      params.period = period;
    }

    return apiClient.get(`${ADMIN_API_BASE}/dashboard`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export default new AdminApiService();
