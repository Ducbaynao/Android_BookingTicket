import { apiClient } from './apiClient';

export const seatService = {
  // Get seats by showtime ID
  getSeatsByShowtime: async (showtimeId) => {
    try {
      const response = await apiClient.get(`/api/seats/showtime/${showtimeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching seats:', error);
      throw error;
    }
  },

  // Get available seats only
  getAvailableSeats: async (showtimeId) => {
    try {
      const response = await apiClient.get(`/api/seats/showtime/${showtimeId}/available`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available seats:', error);
      throw error;
    }
  },

  // Count available seats
  countAvailableSeats: async (showtimeId) => {
    try {
      const response = await apiClient.get(`/api/seats/showtime/${showtimeId}/count`);
      return response.data;
    } catch (error) {
      console.error('Error counting available seats:', error);
      throw error;
    }
  },

  // Mark seat as booked
  markSeatAsBooked: async (seatId) => {
    try {
      await apiClient.post(`/api/seats/${seatId}/book`);
    } catch (error) {
      console.error('Error marking seat as booked:', error);
      throw error;
    }
  },

  // Release seat
  releaseSeat: async (seatId) => {
    try {
      await apiClient.post(`/api/seats/${seatId}/release`);
    } catch (error) {
      console.error('Error releasing seat:', error);
      throw error;
    }
  }
};

export default seatService;
