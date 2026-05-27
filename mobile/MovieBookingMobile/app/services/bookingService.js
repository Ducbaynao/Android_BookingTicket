import { apiClient } from './apiClient';

const bookingService = {
  // Get my bookings
  getMyBookings: async () => {
    try {
      const response = await apiClient.get('/api/bookings/my-simple');
      return response.data;
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      throw error;
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    try {
      const response = await apiClient.get(`/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  // Create booking
  createBooking: async (bookingData) => {
    try {
      const response = await apiClient.post('/api/bookings/create-simple', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await apiClient.delete(`/api/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },
};

export default bookingService;
