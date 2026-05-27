import { apiClient } from './apiClient';

export const foodService = {
  // Get all available food items
  getAllFoodItems: async () => {
    try {
      const response = await apiClient.get('/api/food-items');
      return response.data;
    } catch (error) {
      console.error('Error fetching food items:', error);
      throw error;
    }
  },

  // Get food items by category
  getFoodItemsByCategory: async (category) => {
    try {
      const response = await apiClient.get(`/api/food-items?category=${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food items by category:', error);
      throw error;
    }
  },

  // Get food item by ID
  getFoodItemById: async (id) => {
    try {
      const response = await apiClient.get(`/api/food-items/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food item:', error);
      throw error;
    }
  }
};

export default foodService;
