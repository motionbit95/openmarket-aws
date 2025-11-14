import apiClient from './api-client';

export const sellerAuthService = {
  /**
   * Find seller email by name and phone
   * @param {string} name - Seller name
   * @param {string} phone - Seller phone number
   * @returns {Promise<{seller: {email: string, createdAt: string}}>}
   */
  async findSellerEmail(name, phone) {
    return await apiClient.post('/sellers/find-id', { name, phone });
  },

  /**
   * Send verification code (email-based)
   * @param {string} email - Email address
   * @returns {Promise<{message: string}>}
   */
  async sendVerificationCode(email) {
    return await apiClient.post('/auth/send-verification', { email });
  },

  /**
   * Verify email code
   * @param {string} email - Email address
   * @param {string} code - Verification code
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async verifyEmailCode(email, code) {
    return await apiClient.post('/auth/verify-code', { email, code });
  },

  /**
   * Sign in seller
   * @param {string} email - Seller email
   * @param {string} password - Seller password
   * @returns {Promise<{token: string}>}
   */
  async signIn(email, password) {
    return await apiClient.post('/sellers/sign-in', { email, password });
  },

  /**
   * Sign up seller
   * @param {Object} sellerData - Seller registration data
   * @returns {Promise<{seller: Object, token: string}>}
   */
  async signUp(sellerData) {
    return await apiClient.post('/sellers/sign-up', sellerData);
  }
};