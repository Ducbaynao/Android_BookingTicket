import { apiClient } from './apiClient';

/**
 * Movie API Service
 * Bao gồm:
 * - API public cho màn hình người dùng
 * - API admin CRUD cho chức năng quản lí phim
 */
export const movieService = {
  /**
   * API: GET /api/movies
   * Lấy danh sách phim (có thể kèm query params nếu backend hỗ trợ).
   */
  getAllMovies: async (params = {}) => {
    try {
      console.log('movieService.getAllMovies called with params:', params);
      const response = await apiClient.get('/api/movies', { params });
      console.log('Movies API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/movies/{id}
   * Lấy chi tiết phim theo ID.
   */
  getMovieById: async (id) => {
    try {
      const response = await apiClient.get(`/api/movies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie ${id}:`, error);
      throw error;
    }
  },

  /**
   * API: GET /api/movies/search?keyword=...
   * Tìm phim theo từ khóa.
   */
  searchMovies: async (keyword) => {
    try {
      const response = await apiClient.get('/api/movies/search', {
        params: { keyword }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/movies/genre/{genre}
   * Lọc phim theo thể loại.
   */
  getMoviesByGenre: async (genre) => {
    try {
      const response = await apiClient.get(`/api/movies/genre/${genre}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movies by genre ${genre}:`, error);
      throw error;
    }
  },

  /**
   * API: GET /api/movies/featured
   * Lấy danh sách phim nổi bật.
   */
  getFeaturedMovies: async () => {
    try {
      const response = await apiClient.get('/api/movies/featured');
      return response.data;
    } catch (error) {
      console.error('Error fetching featured movies:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/recommendations/genres
   * Lấy danh sách thể loại để cá nhân hóa gợi ý.
   */
  getRecommendationGenres: async () => {
    try {
      const response = await apiClient.get('/api/recommendations/genres');
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendation genres:', error);
      throw error;
    }
  },

  /**
   * API: POST /api/recommendations/select/genres
   * Lưu các thể loại người dùng chọn để phục vụ recommendation.
   */
  selectRecommendationGenres: async (genreIds = []) => {
    try {
      const body = {
        genres: genreIds.map((id) => ({ id })),
      };
      const response = await apiClient.post('/api/recommendations/select/genres', body);
      return response.data;
    } catch (error) {
      console.error('Error saving selected recommendation genres:', error);
      throw error;
    }
  },

  /**
   * API: GET /api/recommendations/movies?limit=...
   * Lấy danh sách phim gợi ý cho người dùng.
   */
  getRecommendedMovies: async (limit = 10) => {
    try {
      const response = await apiClient.get('/api/recommendations/movies', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recommended movies:', error);
      throw error;
    }
  },

  /**
   * API: POST /api/movies/select
   * Ghi nhận hành vi chọn phim để cải thiện mô hình gợi ý.
   */
  selectMovieForRecommendation: async (movieId) => {
    try {
      const response = await apiClient.post('/api/movies/select', { movieId });
      return response.data;
    } catch (error) {
      console.error('Error saving movie selection:', error);
      throw error;
    }
  },

  // ============ ADMIN CRUD METHODS ============
  
  /**
   * API: POST /api/admin/movies
   * Tạo phim mới từ màn hình quản lí phim admin.
   */
  createMovie: async (movieData) => {
    try {
      const response = await apiClient.post('/api/admin/movies', movieData);
      return response.data;
    } catch (error) {
      console.error('Error creating movie:', error);
      throw error;
    }
  },

  /**
   * API: PUT /api/admin/movies/{id}
   * Cập nhật thông tin phim theo ID.
   */
  updateMovie: async (id, movieData) => {
    try {
      const response = await apiClient.put(`/api/admin/movies/${id}`, movieData);
      return response.data;
    } catch (error) {
      console.error(`Error updating movie ${id}:`, error);
      throw error;
    }
  },

  /**
   * API: DELETE /api/admin/movies/{id}
   * Xóa phim theo ID.
   */
  deleteMovie: async (id) => {
    try {
      await apiClient.delete(`/api/admin/movies/${id}`);
    } catch (error) {
      console.error(`Error deleting movie ${id}:`, error);
      throw error;
    }
  },

  /**
   * API: GET /api/admin/movies/status/{status}
   * Lấy danh sách phim theo trạng thái (SHOWING/COMING_SOON/ENDED...).
   */
  getMoviesByStatus: async (status) => {
    try {
      const response = await apiClient.get(`/api/admin/movies/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movies by status ${status}:`, error);
      throw error;
    }
  }
};

export const genreService = {
  /**
   * API: GET /api/genres
   * Lấy toàn bộ thể loại phim.
   */
  getAllGenres: async () => {
    try {
      const response = await apiClient.get('/api/genres');
      return response.data;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  }
};

