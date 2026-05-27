import { apiClient } from './apiClient';

/**
 * Admin Dashboard API Service
 * Phục vụ chức năng xem thống kê quản trị:
 * - Tổng quan KPI dashboard
 * - Doanh thu theo khoảng thời gian
 * - Top phim theo số lượng đặt vé
 * - Danh sách booking phân trang (legacy dashboard)
 */
const adminService = {
  /**
   * API: GET /api/admin/dashboard/stats
   * Lấy bộ chỉ số tổng quan cho dashboard admin.
   */
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get('/api/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/admin/dashboard/revenue
   * @param {string|undefined} startDate - Định dạng yyyy-MM-dd
   * @param {string|undefined} endDate - Định dạng yyyy-MM-dd
   * Lấy thống kê doanh thu theo khoảng ngày để hiển thị chart.
   */
  getRevenueStats: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await apiClient.get('/api/admin/dashboard/revenue', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/admin/dashboard/top-movies
   * @param {number} limit - Số lượng phim top cần lấy.
   * Lấy top phim theo số lượng đặt vé/doanh thu.
   */
  getTopMovies: async (limit = 5) => {
    try {
      const response = await apiClient.get('/api/admin/dashboard/top-movies', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top movies:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/admin/dashboard/bookings
   * @param {number} page - Trang hiện tại.
   * @param {number} size - Kích thước trang.
   * Endpoint legacy phục vụ xem danh sách booking trên dashboard.
   */
  getAllBookings: async (page = 0, size = 20) => {
    try {
      const response = await apiClient.get('/api/admin/dashboard/bookings', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }
  },
};

export default adminService;
