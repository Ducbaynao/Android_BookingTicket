import { apiClient } from './apiClient';

/**
 * User Management API Service (Admin)
 * Phục vụ chức năng quản lí người dùng:
 * - Lọc/tìm kiếm user
 * - Cập nhật role/status
 * - Xóa user có preserve lịch sử
 * - Xem booking của user
 */
export const userManagementService = {
  /**
   * API: GET /api/admin/users
   * Lấy danh sách user theo filter: search/role/status/loyaltyTier.
   */
  getAllUsers: async (search = '', role = '', status = '', loyaltyTier = '') => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      if (loyaltyTier) params.append('loyaltyTier', loyaltyTier);
      
      const response = await apiClient.get(`/api/admin/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/admin/users/{id}
   * Lấy chi tiết người dùng theo ID.
   */
  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  /**
   * API: PUT /api/admin/users/{id}/role?role=...
   * Cập nhật quyền người dùng (USER/ADMIN).
   */
  updateUserRole: async (userId, role) => {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/role?role=${role}`);
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  /**
   * API: PUT /api/admin/users/{id}/status?status=...
   * Cập nhật trạng thái tài khoản (ACTIVE/BLOCKED).
   */
  updateUserStatus: async (userId, status) => {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/status?status=${status}`);
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  /**
   * API: DELETE /api/admin/users/{id}
   * Xóa user, backend sẽ giữ snapshot lịch sử giao dịch/đặt vé.
   */
  deleteUser: async (userId) => {
    try {
      await apiClient.delete(`/api/admin/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/admin/users/{id}/bookings?status=...
   * Lấy lịch sử booking của user để admin kiểm tra.
   */
  getUserBookings: async (userId, status = '') => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      const query = params.toString();
      const response = await apiClient.get(`/api/admin/users/${userId}/bookings${query ? `?${query}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }
};
