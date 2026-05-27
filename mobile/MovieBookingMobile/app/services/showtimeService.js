import { apiClient } from './apiClient';

/**
 * Showtime API Service
 * Phục vụ chức năng quản lí suất chiếu (admin) và tra cứu suất chiếu (user).
 */
export const showtimeService = {
  /**
   * API: GET /api/showtimes
   * @param {Object} filters - Bộ lọc gồm movieId/cinemaId/date(yyyy-MM-dd)
   * Lấy danh sách suất chiếu theo điều kiện lọc.
   */
  getAllShowtimes: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.movieId) params.append('movieId', filters.movieId);
      if (filters.date) params.append('date', filters.date);
      if (filters.cinemaId) params.append('cinemaId', filters.cinemaId);
      
      const url = `/api/showtimes${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching showtimes:', url);
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/showtimes/{id}
   * Lấy chi tiết suất chiếu theo ID.
   */
  getShowtimeById: async (showtimeId) => {
    try {
      const response = await apiClient.get(`/api/showtimes/${showtimeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching showtime:', error);
      throw error;
    }
  },

  /**
   * API: POST /api/showtimes
   * Tạo suất chiếu mới.
   */
  createShowtime: async (showtimeData) => {
    try {
      const response = await apiClient.post('/api/showtimes', showtimeData);
      return response.data;
    } catch (error) {
      console.error('Error creating showtime:', error);
      throw error;
    }
  },

  /**
   * API: PUT /api/showtimes/{id}
   * Cập nhật suất chiếu theo ID.
   */
  updateShowtime: async (id, showtimeData) => {
    try {
      const response = await apiClient.put(`/api/showtimes/${id}`, showtimeData);
      return response.data;
    } catch (error) {
      console.error('Error updating showtime:', error);
      throw error;
    }
  },

  /**
   * API: DELETE /api/showtimes/{id}
   * Xóa suất chiếu theo ID.
   */
  deleteShowtime: async (id) => {
    try {
      await apiClient.delete(`/api/showtimes/${id}`);
    } catch (error) {
      console.error('Error deleting showtime:', error);
      throw error;
    }
  },

  /**
   * Alias legacy để tương thích code cũ.
   */
  getShowtimes: async (filters = {}) => {
    return showtimeService.getAllShowtimes(filters);
  },
};

/**
 * Cinema API Service
 * Hỗ trợ dữ liệu rạp cho form/lọc suất chiếu.
 */
export const cinemaService = {
  /**
   * API: GET /api/cinemas
   * Lấy danh sách toàn bộ rạp.
   */
  getAllCinemas: async () => {
    try {
      const response = await apiClient.get('/api/cinemas');
      return response.data;
    } catch (error) {
      console.error('Error fetching cinemas:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/cinemas/{id}
   * Lấy thông tin rạp theo ID.
   */
  getCinemaById: async (id) => {
    try {
      const response = await apiClient.get(`/api/cinemas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cinema:', error);
      throw error;
    }
  },
};

/**
 * Room API Service
 * Hỗ trợ dữ liệu phòng theo rạp cho chức năng quản lí suất chiếu.
 */
export const roomService = {
  /**
   * API: GET /api/rooms?cinemaId=...
   * Lấy danh sách phòng theo rạp.
   */
  getRoomsByCinema: async (cinemaId) => {
    try {
      const response = await apiClient.get('/api/rooms', {
        params: { cinemaId },
      });
      return response.data;
    } catch (error) {
      if (error?.status === 404) {
        return [];
      }
      console.error('Error fetching rooms by cinema:', error);
      throw error;
    }
  },
};

export default showtimeService;
