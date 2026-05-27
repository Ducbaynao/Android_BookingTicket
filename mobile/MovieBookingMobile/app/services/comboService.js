import { apiClient } from './apiClient';

export const comboService = {
  getAllCombos: async () => {
    try {
      const response = await apiClient.get('/api/combos');
      const combos = Array.isArray(response.data) ? response.data : [];
      if (combos.length > 0) {
        return combos;
      }
    } catch (error) {
      if (error?.status !== 404) {
        throw error;
      }
    }

    // Fallback: some backends store combos as food items with category=COMBO
    try {
      const response = await apiClient.get('/api/food-items?category=COMBO');
      const items = Array.isArray(response.data) ? response.data : [];
      return items.map((item) => ({
        id: item.id,
        name: item.name,
        comboPrice: item.price,
      }));
    } catch (fallbackError) {
      return [];
    }
  },
};

export default comboService;
