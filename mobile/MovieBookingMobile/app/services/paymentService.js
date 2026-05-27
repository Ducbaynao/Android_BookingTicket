import { apiClient } from './apiClient';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_PAYMENT_BOOKING_ID_KEY = 'pendingPaymentBookingId';

const paymentService = {
  /**
   * Create payment URL for a booking.
   */
  createPaymentUrl: async (bookingId) => {
    const response = await apiClient.get('/api/payment/pay', {
      params: { bookingId },
    });
    return response.data;
  },

  setPendingPaymentBookingId: async (bookingId) => {
    await AsyncStorage.setItem(PENDING_PAYMENT_BOOKING_ID_KEY, String(bookingId));
  },

  getPendingPaymentBookingId: async () => {
    const value = await AsyncStorage.getItem(PENDING_PAYMENT_BOOKING_ID_KEY);
    if (!value) {
      return null;
    }
    const bookingId = Number(value);
    return Number.isNaN(bookingId) ? null : bookingId;
  },

  clearPendingPaymentBookingId: async () => {
    await AsyncStorage.removeItem(PENDING_PAYMENT_BOOKING_ID_KEY);
  },

  /**
   * Open VNPAY URL in external browser.
   */
  openPaymentUrl: async (paymentUrl) => {
    await Linking.openURL(paymentUrl);
  },

  /**
   * Parse app deep-link returned from backend /vnpReturn redirect.
   */
  parsePaymentDeepLink: (url) => {
    if (!url) {
      return null;
    }

    const [base, queryString = ''] = url.split('?');
    if (!base.startsWith('moviebooking://payment-result')) {
      return null;
    }

    const query = {};
    queryString.split('&').forEach((pair) => {
      if (!pair) {
        return;
      }
      const [rawKey, rawValue = ''] = pair.split('=');
      const key = decodeURIComponent(rawKey || '');
      const value = decodeURIComponent(rawValue || '');
      query[key] = value;
    });

    return query;
  },

  /**
   * Confirm payment result from backend (authoritative status).
   */
  getPaymentStatus: async (bookingId) => {
    const response = await apiClient.get('/api/payment/status', {
      params: { bookingId },
    });
    return response.data;
  },
};

export default paymentService;
